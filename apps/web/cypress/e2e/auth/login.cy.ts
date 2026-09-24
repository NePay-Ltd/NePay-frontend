// cypress/e2e/auth/login.cy.ts
// ─── Login Test Suite ─────────────────────────────────────────────────────────
// Covers: positive logins, negative error states, validation, UX guards

describe("Auth — Login", () => {
  beforeEach(() => {
    cy.logout(); // ensure clean state before each test
    cy.visit("/login");
  });

  // ── Positive Tests ──────────────────────────────────────────────────────────

  it("P1 | Valid credentials → redirects to /overview", () => {
    cy.get('input[name="identifier"]').type(Cypress.env("TEST_EMAIL"));
    cy.get('input[name="password"]').type(Cypress.env("TEST_PASSWORD"));
    cy.get('button[type="submit"]').click();

    // HARD: must land on overview — no point running further checks without this
    cy.url({ timeout: 60000 }).should("include", "/overview");
  });

  it("P2 | nepay_refresh cookie is set after successful login", () => {
    cy.get('input[name="identifier"]').type(Cypress.env("TEST_EMAIL"));
    cy.get('input[name="password"]').type(Cypress.env("TEST_PASSWORD"));
    cy.get('button[type="submit"]').click();

    cy.url({ timeout: 60000 }).should("include", "/overview");

    // HARD: cookie is the middleware session gate — must be present
    cy.getCookie("nepay_refresh").should("exist").and("have.property", "value", "true");
  });

  it("P3 | Welcome toast shows user's first name after login", () => {
    cy.get('input[name="identifier"]').type(Cypress.env("TEST_EMAIL"));
    cy.get('input[name="password"]').type(Cypress.env("TEST_PASSWORD"));
    cy.get('button[type="submit"]').click();

    cy.url({ timeout: 60000 }).should("include", "/overview");

    // SOFT: cosmetic — toast should appear, but shouldn't block the flow
    cy.softAssert(() => {
      cy.get('[data-sonner-toast]', { timeout: 5000 }).should("be.visible");
    }, "Welcome toast visibility");

    cy.assertAll();
  });

  it("P4 | returnTo query param redirects to original route after login", () => {
    cy.visit("/login?returnTo=/transfer");
    cy.get('input[name="identifier"]').type(Cypress.env("TEST_EMAIL"));
    cy.get('input[name="password"]').type(Cypress.env("TEST_PASSWORD"));
    cy.get('button[type="submit"]').click();

    // HARD: must honour the returnTo param
    cy.url({ timeout: 60000 }).should("include", "/transfer");
  });

  it("P5 | Accessing /login when already logged in → bounced to /overview", () => {
    cy.login();
    cy.visit("/login");
    // HARD: middleware should redirect away
    cy.url({ timeout: 10000 }).should("include", "/overview");
  });

  // ── Negative Tests ──────────────────────────────────────────────────────────

  it("N1 | Wrong password → inline error shown (not a toast)", () => {
    cy.get('input[name="identifier"]').type(Cypress.env("TEST_EMAIL"));
    cy.get('input[name="password"]').type("WrongPassword999!");
    cy.get('button[type="submit"]').click();

    // HARD: must stay on login page
    cy.url().should("include", "/login");

    // HARD: inline error must appear (not just a toast that auto-dismisses)
    cy.contains(/invalid|incorrect|wrong|credentials/i, { timeout: 8000 }).should("be.visible");

    // SOFT: no toast shown for invalid credentials (per auth-context.tsx design)
    cy.softAssert(() => {
      cy.get('[data-sonner-toast]').should("not.exist");
    }, "No toast for invalid credentials");

    cy.assertAll();
  });

  it("N2 | Empty email field → validation error before API call", () => {
    cy.get('input[name="password"]').type("SomePassword1");
    cy.get('button[type="submit"]').click();

    // HARD: form validation should block submission
    cy.contains(/email|required|enter/i).should("be.visible");
    cy.url().should("include", "/login");
  });

  it("N3 | Empty password field → validation error before API call", () => {
    cy.get('input[name="identifier"]').type(Cypress.env("TEST_EMAIL"));
    cy.get('button[type="submit"]').click();

    // HARD
    cy.contains(/password|required/i).should("be.visible");
    cy.url().should("include", "/login");
  });

  it("N4 | Submit button disabled while login request is in-flight (no double submit)", () => {
    cy.get('input[name="identifier"]').type(Cypress.env("TEST_EMAIL"));
    cy.get('input[name="password"]').type(Cypress.env("TEST_PASSWORD"));

    cy.intercept("POST", "**/auth/login").as("loginRequest");
    cy.get('button[type="submit"]').click();

    // HARD: button must be disabled or show loading state during the request
    cy.get('button[type="submit"]').should("be.disabled");
    cy.wait("@loginRequest");
  });

  it("N5 | Network error during login → graceful error shown", () => {
    cy.intercept("POST", "**/auth/login", { forceNetworkError: true }).as("loginFail");

    cy.get('input[name="identifier"]').type(Cypress.env("TEST_EMAIL"));
    cy.get('input[name="password"]').type(Cypress.env("TEST_PASSWORD"));
    cy.get('button[type="submit"]').click();
    cy.wait("@loginFail");

    // HARD: error message should appear — no crash/blank page
    cy.softAssert(() => {
      cy.contains(/error|failed|try again|problem/i, { timeout: 8000 }).should("be.visible");
    }, "Error message on network failure");

    // HARD: still on login page
    cy.url().should("include", "/login");
    cy.assertAll();
  });

  it("N6 | Suspended account → persistent banner shown (not just toast)", () => {
    cy.intercept("POST", "**/auth/login", {
      statusCode: 403,
      body: {
        success: false,
        code: "ACCOUNT_SUSPENDED",
        message: "Your account has been suspended. Please contact support.",
      },
    }).as("suspendedLogin");

    cy.get('input[name="identifier"]').type("suspended@test.com");
    cy.get('input[name="password"]').type("AnyPass123");
    cy.get('button[type="submit"]').click();
    cy.wait("@suspendedLogin");

    // HARD: must show a visible, persistent suspended banner
    cy.contains(/suspended|contact support/i, { timeout: 8000 }).should("be.visible");

    // SOFT: no toast (per auth-context.tsx design decision)
    cy.softAssert(() => {
      cy.get('[data-sonner-toast]').should("not.exist");
    }, "No auto-dismiss toast for suspended account");

    cy.assertAll();
  });

  it("N7 | Open redirect — returnTo with external URL → fallback to /overview", () => {
    cy.login();
    cy.visit("/login?returnTo=https://evil.com");
    // HARD: middleware safeReturnTo must reject the external URL
    cy.url({ timeout: 10000 }).should("include", "/overview");
    cy.url().should("not.include", "evil.com");
  });

  it("N8 | Open redirect — returnTo with protocol-relative URL → fallback to /overview", () => {
    cy.login();
    cy.visit("/login?returnTo=//evil.com");
    cy.url({ timeout: 10000 }).should("include", "/overview");
    cy.url().should("not.include", "evil.com");
  });
});
