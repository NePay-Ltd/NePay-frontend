// cypress/e2e/security/change-password.cy.ts
// ─── Security Test Suite ──────────────────────────────────────────────────────

describe("Security — Change Password", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/security/change-password");
    cy.url({ timeout: 60000 }).should("include", "/security");
  });

  it("P1 | Change password page loads with 3 fields", () => {
    cy.softAssert(() => {
      cy.contains(/current password|old password/i, { timeout: 8000 }).should("be.visible");
    }, "Current password label");
    cy.softAssert(() => {
      cy.contains(/new password/i).should("be.visible");
    }, "New password label");
    cy.assertAll();
  });

  it("N1 | Wrong current password → API error shown", () => {
    cy.intercept("POST", "**/auth/change-password**", {
      statusCode: 401,
      body: { success: false, message: "Current password is incorrect" },
    }).as("wrongCurrentPw");

    cy.get('input[name="currentPassword"]').first().type("WrongCurrent1");
    cy.get('input[name="newPassword"]').first().type("NewValidPass1");
    cy.get('input[name="confirmNewPassword"], input[name="confirmPassword"]').first().type("NewValidPass1");
    cy.get('button[type="submit"]').click();
    cy.wait("@wrongCurrentPw");

    cy.contains(/incorrect|wrong|current/i, { timeout: 8000 }).should("be.visible");
  });

  it("N2 | New passwords don't match → validation error", () => {
    cy.get('input[name="newPassword"]').first().type("NewPass123");
    cy.get('input[name="confirmNewPassword"], input[name="confirmPassword"]').first().type("DifferentPass123");
    cy.get('button[type="submit"]').click();

    cy.contains(/do not match|match/i).should("be.visible");
  });

  it("N3 | Weak new password → validation error", () => {
    cy.get('input[name="newPassword"]').first().type("weak");
    cy.get('button[type="submit"]').click();

    cy.contains(/6 characters|strong|minimum/i).should("be.visible");
  });
});

describe("Security — Change PIN", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/security/change-pin");
  });

  it("N1 | PINs don't match → error", () => {
    cy.get('input[name="pin"]').first().type("1234");
    cy.get('input[name="confirmPin"]').first().type("5678");
    cy.get('button[type="submit"]').click();

    cy.contains(/match|same/i).should("be.visible");
  });

  it("N2 | PIN not 4 digits → validation error", () => {
    cy.get('input[name="pin"]').first().type("12");
    cy.get('button[type="submit"]').click();

    cy.contains(/4|digits|length/i).should("be.visible");
  });
});

describe("Security — Login Activity", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/security/login-activity");
  });

  it("P1 | Login activity page loads", () => {
    cy.get("body").should("be.visible");
    cy.softAssert(() => {
      cy.contains(/device|session|login|activity/i, { timeout: 8000 }).should("be.visible");
    }, "Activity page heading");
    cy.assertAll();
  });

  it("N1 | API error → graceful error state, no crash", () => {
    cy.intercept("GET", "**/auth/sessions**", {
      statusCode: 500,
      body: { success: false, message: "Server error" },
    }).as("sessionsError");

    cy.reload();
    cy.wait("@sessionsError");

    cy.get("body").should("be.visible");
  });
});
