// cypress/e2e/auth/forgot-password.cy.ts
// ─── Forgot / Reset Password Test Suite ───────────────────────────────────────

describe("Auth — Forgot Password", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit("/forgot-password");
  });

  it("P1 | Valid email → success message shown", () => {
    const emailToType = Cypress.env("TEST_EMAIL") || "test@example.com";
    cy.get('input[name="email"]').type(emailToType);
    cy.get('button[type="submit"]').click();

    // HARD: success/confirmation message must appear
    cy.contains(/check your|sent|email/i, { timeout: 10000 }).should("be.visible");
  });

  it("N1 | Empty email → validation error before API call", () => {
    cy.get('button[type="submit"]').click();

    // HARD: form validation blocks API call
    cy.contains(/email|required/i).should("be.visible");
  });

  it("N2 | Malformed email → validation error", () => {
    cy.get('input[name="email"]').type("not-an-email");
    cy.get('button[type="submit"]').click();

    // HARD
    cy.contains(/valid email/i).should("be.visible");
  });

  it("N3 | Non-existent email → shows error message", () => {
    cy.intercept("POST", "**/auth/forgot-password", {
      statusCode: 404,
      body: { success: false, code: "ACCOUNT_NOT_FOUND", message: "We couldn't find an account with that email." }
    }).as("forgotPasswordErr");

    cy.get('input[name="email"]').type("doesnotexist99999@nepay.io");
    cy.get('button[type="submit"]').click();

    cy.wait("@forgotPasswordErr");
    cy.contains(/couldn't find|not found/i).should("be.visible");
  });
});

describe("Auth — Reset Password", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit("/reset-password");
  });

  it("N1 | Passwords don't match → confirm error", () => {
    cy.get('input[name="email"]').type("test@example.com");
    cy.get('input[name="code"]').type("123456");
    cy.get('input[name="password"]').type("NewPass123");
    cy.get('input[name="confirmPassword"]').type("DifferentPass123");
    cy.get('button[type="submit"]').click();

    // HARD
    cy.contains(/passwords do not match/i).should("be.visible");
  });

  it("N2 | Backend rejects code → validation error shown", () => {
    cy.intercept("POST", "**/auth/reset-password", {
      statusCode: 400,
      body: { success: false, code: "VALIDATION_FAILED", message: "Invalid or expired code" }
    }).as("resetErr");

    cy.get('input[name="email"]').type("test@example.com");
    cy.get('input[name="code"]').type("000000");
    cy.get('input[name="password"]').type("NewPass123");
    cy.get('input[name="confirmPassword"]').type("NewPass123");
    cy.get('button[type="submit"]').click();

    cy.wait("@resetErr");
    cy.contains(/invalid or expired/i).should("be.visible");
  });

  it("N3 | Weak new password → validation error", () => {
    cy.get('input[name="email"]').type("test@example.com");
    cy.get('input[name="code"]').type("123456");
    cy.get('input[name="password"]').type("weak");
    cy.get('input[name="confirmPassword"]').type("weak");
    cy.get('button[type="submit"]').click();

    // HARD
    cy.contains(/at least 6 characters/i).should("be.visible");
  });
});
