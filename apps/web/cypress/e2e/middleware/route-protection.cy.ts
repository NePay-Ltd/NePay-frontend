// cypress/e2e/middleware/route-protection.cy.ts
// ─── Route Protection & Middleware Test Suite ─────────────────────────────────

describe("Middleware — Route Protection", () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  // ── Positive Tests ──────────────────────────────────────────────────────────

  it("P1 | No session + protected route → redirect to /login with returnTo param", () => {
    cy.visit("/overview");

    // HARD
    cy.url().should("include", "/login");
    cy.url().should("include", "returnTo=%2Foverview");
  });

  it("P2 | /terms accessible without session", () => {
    cy.visit("/terms");
    // HARD: must not redirect
    cy.url().should("include", "/terms");
    cy.url().should("not.include", "/login");
  });

  it("P3 | /privacy accessible without session", () => {
    cy.visit("/privacy");
    cy.url().should("include", "/privacy");
  });

  it("P4 | /faq accessible without session", () => {
    cy.visit("/faq");
    cy.url().should("include", "/faq");
  });

  it("P5 | /about accessible without session", () => {
    cy.visit("/about");
    cy.url().should("include", "/about");
  });

  it("P6 | /marketer/* accessible without nepay_refresh cookie", () => {
    cy.visit("/marketer", { failOnStatusCode: false });
    // HARD: must NOT redirect to /login (marketer has its own auth)
    cy.url().should("not.include", "/login");
  });

  it("P7 | Logged-in user visits /login → bounced to /overview", () => {
    cy.login();
    cy.visit("/login");
    // HARD
    cy.url({ timeout: 10000 }).should("include", "/overview");
  });

  it("P8 | Logged-in user visits /register → bounced to /overview", () => {
    cy.login();
    cy.visit("/register");
    cy.url({ timeout: 10000 }).should("include", "/overview");
  });

  it("P9 | /transfer without session → redirect to /login?returnTo=/transfer", () => {
    cy.visit("/transfer");
    cy.url().should("include", "/login");
    cy.url().should("include", "returnTo=%2Ftransfer");
  });

  // ── Negative Tests (Open Redirect Protection) ───────────────────────────────

  it("N1 | returnTo=https://evil.com → rejected, fallback to /overview after login", () => {
    cy.login();
    cy.visit("/login?returnTo=https://evil.com");
    cy.url({ timeout: 10000 }).should("include", "/overview");
    cy.url().should("not.include", "evil.com");
  });

  it("N2 | returnTo=//evil.com → rejected (protocol-relative)", () => {
    cy.login();
    cy.visit("/login?returnTo=//evil.com");
    cy.url({ timeout: 10000 }).should("include", "/overview");
    cy.url().should("not.include", "evil.com");
  });

  it("N3 | returnTo=\\/evil.com → rejected (backslash bypass)", () => {
    cy.login();
    cy.visit("/login?returnTo=\\/evil.com");
    cy.url({ timeout: 10000 }).should("include", "/overview");
    cy.url().should("not.include", "evil.com");
  });

  it("N4 | Forged nepay_refresh cookie with no real token → API calls fail gracefully", () => {
    // Set a cookie without a real token — simulates a forged/expired session
    cy.setCookie("nepay_refresh", "true", { path: "/" });
    // Do NOT set localStorage tokens

    cy.visit("/overview");

    // SOFT: page shell may load, but data should fail/show error — not crash
    cy.softAssert(() => {
      cy.get("body").should("be.visible");
    }, "Page renders without crash on forged cookie");

    cy.assertAll();
  });
});
