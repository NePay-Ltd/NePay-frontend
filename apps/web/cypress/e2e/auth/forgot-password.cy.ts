// cypress/e2e/auth/forgot-password.cy.ts
// ─── Forgot / Reset Password Test Suite ───────────────────────────────────────

describe("Auth — Forgot Password", () => {
  beforeEach(() => {
    cy.logout();
    cy.visit("/forgot-password");
  });

  it("P1 | Valid email → success message shown", () => {
    cy.get('input[name="email"]').type(Cypress.env("TEST_EMAIL"));
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

  it("N3 | Non-existent email → neutral message (no user enumeration)", () => {
    cy.get('input[name="email"]').type("doesnotexist99999@nepay.io");
    cy.get('button[type="submit"]').click();

    // SOFT: should show same success message regardless (security best practice)
    cy.softAssert(() => {
      cy.contains(/check your|sent|email/i, { timeout: 10000 }).should("be.visible");
    }, "Neutral response for non-existent email (no user enumeration)");

    cy.assertAll();
  });
});

describe("Auth — Reset Password", () => {
  beforeEach(() => {
    cy.logout();
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

  it("N2 | Invalid code format (not 6 digits) → validation error", () => {
    cy.get('input[name="email"]').type("test@example.com");
    cy.get('input[name="code"]').type("abc");
    cy.get('button[type="submit"]').click();

    // HARD
    cy.contains(/6 digits/i).should("be.visible");
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
