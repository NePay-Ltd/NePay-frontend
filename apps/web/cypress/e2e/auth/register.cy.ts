// cypress/e2e/auth/register.cy.ts
// ─── Registration Test Suite ──────────────────────────────────────────────────

describe("Auth — Register", () => {
  beforeEach(() => {
    cy.logout();
    cy.visit("/register");
  });

  // ── Positive Tests ──────────────────────────────────────────────────────────

  it("P1 | Step 1: Fill name + phone → Step 2 renders", () => {
    cy.contains("Next").click(); // try to proceed with empty fields first

    // HARD: Step 1 validation blocks
    cy.contains(/first name|required/i).should("be.visible");

    // Now fill valid data
    cy.get('input[name="firstName"]').type("Test");
    cy.get('input[name="lastName"]').type("User");
    cy.get('input[name="phone"]').type("08012345678");
    cy.contains("Next").click();

    // HARD: must advance to Step 2
    cy.contains(/email|username|password/i, { timeout: 5000 }).should("be.visible");
  });

  it("P2 | hearAboutUs = OTHER → 'Please specify' field appears", () => {
    // Navigate to Step 2
    cy.get('input[name="firstName"]').type("Test");
    cy.get('input[name="lastName"]').type("User");
    cy.get('input[name="phone"]').type("08012345678");
    cy.contains("Next").click();

    // Radix UI Select — click the trigger then force-click the portal item
    cy.contains(/how did you hear/i).should("be.visible");
    cy.get('#reg-hear').click();
    cy.contains("Other (Please specify)", { timeout: 5000 }).click({ force: true });

    // HARD: 'Please specify' field must appear
    cy.contains(/please specify/i, { timeout: 3000 }).should("be.visible");
    cy.get('input[name="hearAboutUsOther"]').should("be.visible");
  });

  it("P3 | Show/hide password toggle works", () => {
    cy.get('input[name="firstName"]').type("Test");
    cy.get('input[name="lastName"]').type("User");
    cy.get('input[name="phone"]').type("08012345678");
    cy.contains("Next").click();

    cy.get('input[name="password"]').should("have.attr", "type", "password");

    // SOFT: toggle exists and switches type (button identified by aria-label)
    cy.softAssert(() => {
      cy.get('button[aria-label="Show password"]').first().click();
      cy.get('input[name="password"]').should("have.attr", "type", "text");
    }, "Password show/hide toggle");

    cy.assertAll();
  });

  it("P4 | Password strength meter updates as user types", () => {
    cy.get('input[name="firstName"]').type("Test");
    cy.get('input[name="lastName"]').type("User");
    cy.get('input[name="phone"]').type("08012345678");
    cy.contains("Next").click();

    // SOFT: strength bar row renders when password is typed
    // The meter is 4 sibling divs inside a flex row after the password input
    cy.softAssert(() => {
      cy.get('#reg-password').type("weak");
      // The strength bar container sits right after the password input in the DOM
      cy.get('#reg-password').parent().find('div.flex.h-1').should("exist");
    }, "Password strength meter visible");

    cy.softAssert(() => {
      cy.get('#reg-password').clear().type("StrongPass123!");
      cy.get('#reg-password').parent().find('div.flex.h-1').should("exist");
    }, "Password strength meter updates");

    cy.assertAll();
  });

  // ── Negative Tests ──────────────────────────────────────────────────────────

  it("N1 | Password < 6 chars → validation error", () => {
    cy.get('input[name="firstName"]').type("Test");
    cy.get('input[name="lastName"]').type("User");
    cy.get('input[name="phone"]').type("08012345678");
    cy.contains("Next").click();

    cy.get('input[name="username"]').type("testuser123");
    cy.get('input[name="email"]').type("test@example.com");
    cy.get('input[name="password"]').type("abc");
    cy.get('input[name="confirmPassword"]').type("abc");
    cy.contains("Create Account").click();

    // HARD
    cy.contains(/at least 6 characters/i).should("be.visible");
  });

  it("N2 | Passwords do not match → confirm password error", () => {
    cy.get('input[name="firstName"]').type("Test");
    cy.get('input[name="lastName"]').type("User");
    cy.get('input[name="phone"]').type("08012345678");
    cy.contains("Next").click();

    cy.get('input[name="password"]').type("ValidPass1");
    cy.get('input[name="confirmPassword"]').type("DifferentPass1");
    cy.contains("Create Account").click();

    // HARD
    cy.contains(/passwords do not match/i).should("be.visible");
  });

  it("N3 | Username with spaces → validation error", () => {
    cy.get('input[name="firstName"]').type("Test");
    cy.get('input[name="lastName"]').type("User");
    cy.get('input[name="phone"]').type("08012345678");
    cy.contains("Next").click();

    cy.get('input[name="username"]').type("invalid username");
    cy.contains("Create Account").click();

    // HARD
    cy.contains(/letters, numbers and underscores/i).should("be.visible");
  });

  it("N4 | Invalid Nigerian phone format → validation error", () => {
    cy.get('input[name="firstName"]').type("Test");
    cy.get('input[name="lastName"]').type("User");
    cy.get('input[name="phone"]').type("12345");
    cy.contains("Next").click();

    // HARD: must not advance
    cy.contains(/valid Nigerian phone/i).should("be.visible");
  });

  it("N5 | hearAboutUs = OTHER + empty 'Please specify' → error on submit", () => {
    cy.get('input[name="firstName"]').type("Test");
    cy.get('input[name="lastName"]').type("User");
    cy.get('input[name="phone"]').type("08012345678");
    cy.contains("Next").click();

    cy.get('input[name="username"]').type("testuser9999");
    cy.get('input[name="email"]').type("testuser9999@example.com");
    cy.get('input[name="password"]').type("ValidPass1");
    cy.get('input[name="confirmPassword"]').type("ValidPass1");

    // Radix UI Select
    cy.get('#reg-hear').click();
    cy.contains("Other (Please specify)", { timeout: 5000 }).click({ force: true });
    // Leave hearAboutUsOther empty intentionally
    cy.contains("Create Account").click();

    // HARD
    cy.contains(/please specify/i).should("be.visible");
  });

  it("N6 | Terms checkbox not checked → submit blocked", () => {
    cy.get('input[name="firstName"]').type("Test");
    cy.get('input[name="lastName"]').type("User");
    cy.get('input[name="phone"]').type("08012345678");
    cy.contains("Next").click();

    cy.get('input[name="username"]').type("testuser9988");
    cy.get('input[name="email"]').type("test9988@example.com");
    cy.get('input[name="password"]').type("ValidPass1");
    cy.get('input[name="confirmPassword"]').type("ValidPass1");
    // Do NOT check terms
    cy.contains("Create Account").click();

    // HARD: should not call the API — stay on register page
    cy.url().should("include", "/register");
  });

  it("N7 | Back button on Step 2 → returns to Step 1 with data intact", () => {
    cy.get('input[name="firstName"]').type("Dubem");
    cy.get('input[name="lastName"]').type("Test");
    cy.get('input[name="phone"]').type("08012345678");
    cy.contains("Next").click();

    // Go back
    cy.contains("Back").click();

    // SOFT: Step 1 data should be retained
    cy.softAssert(() => {
      cy.get('input[name="firstName"]').should("have.value", "Dubem");
    }, "First name retained on back navigation");

    cy.softAssert(() => {
      cy.get('input[name="phone"]').should("have.value", "08012345678");
    }, "Phone retained on back navigation");

    cy.assertAll();
  });
});
