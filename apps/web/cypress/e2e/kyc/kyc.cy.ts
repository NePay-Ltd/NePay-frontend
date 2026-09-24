// cypress/e2e/kyc/kyc.cy.ts
// ─── KYC Test Suite ───────────────────────────────────────────────────────────

describe("KYC — Identity Verification", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/kyc");
    cy.url({ timeout: 60000 }).should("include", "/kyc");
  });

  // ── Positive Tests ──────────────────────────────────────────────────────────

  it("P1 | KYC page loads with BVN input form", () => {
    // SOFT: check multiple elements exist
    cy.softAssert(() => {
      cy.get("input", { timeout: 8000 }).should("be.visible");
    }, "BVN input field visible");

    cy.softAssert(() => {
      cy.contains(/BVN|verification|identity/i, { timeout: 8000 }).should("be.visible");
    }, "KYC heading visible");

    cy.assertAll();
  });

  it("P2 | Valid BVN submitted → pending/success state shown", () => {
    cy.intercept("POST", "**/kyc**", {
      statusCode: 200,
      body: { success: true, data: { status: "PENDING" } },
    }).as("kycSubmit");

    cy.get("input").first().type("12345678901"); // valid 11-digit BVN
    cy.get('button[type="submit"]').click();
    cy.wait("@kycSubmit");

    // HARD: some success/pending feedback
    cy.contains(/pending|submitted|processing|success/i, { timeout: 8000 }).should("be.visible");
  });

  it("P3 | KYC banner on overview disappears after approval", () => {
    // Mock a verified user
    cy.intercept("GET", "**/users/me", {
      statusCode: 200,
      body: {
        success: true,
        data: { id: "user-1", firstName: "Dubem", kycVerified: true },
      },
    }).as("verifiedUser");

    cy.visit("/overview");
    cy.wait("@verifiedUser");

    // HARD: banner should not be visible for verified users
    cy.contains(/verify your identity|complete KYC|BVN verification/i).should("not.exist");
  });

  it("P4 | KYC banner visible on overview for unverified user", () => {
    cy.intercept("GET", "**/users/me", {
      statusCode: 200,
      body: {
        success: true,
        data: { id: "user-1", firstName: "Dubem", kycVerified: false },
      },
    }).as("unverifiedUser");

    cy.visit("/overview");
    cy.wait("@unverifiedUser");

    // HARD: banner must prompt user to verify
    cy.softAssert(() => {
      cy.contains(/verify|KYC|identity/i, { timeout: 8000 }).should("be.visible");
    }, "KYC prompt visible for unverified users");

    cy.assertAll();
  });

  // ── Negative Tests ──────────────────────────────────────────────────────────

  it("N1 | BVN shorter than 11 digits → validation error", () => {
    cy.get("input").first().type("1234567890"); // 10 digits
    cy.get('button[type="submit"]').click();

    // HARD
    cy.contains(/11|invalid|BVN/i).should("be.visible");
    cy.url().should("include", "/kyc");
  });

  it("N2 | BVN with letters → validation error", () => {
    cy.get("input").first().type("1234567890A");
    cy.get('button[type="submit"]').click();

    // HARD
    cy.contains(/invalid|digits only|numeric/i).should("be.visible");
  });

  it("N3 | BVN already used by another account → API error shown", () => {
    cy.intercept("POST", "**/kyc**", {
      statusCode: 409,
      body: {
        success: false,
        code: "CONFLICT",
        message: "This BVN is already linked to another account",
      },
    }).as("bvnConflict");

    cy.get("input").first().type("12345678901");
    cy.get('button[type="submit"]').click();
    cy.wait("@bvnConflict");

    // HARD
    cy.contains(/already linked|another account|conflict/i, { timeout: 8000 }).should("be.visible");
  });

  it("N4 | Already verified user → form not shown, verified state shown", () => {
    cy.intercept("GET", "**/users/me", {
      body: { success: true, data: { kycVerified: true } },
    });

    cy.reload();

    // HARD: form should be replaced by a verified state
    cy.softAssert(() => {
      cy.contains(/verified|approved|complete/i, { timeout: 8000 }).should("be.visible");
    }, "Verified state shown for already-verified user");

    cy.assertAll();
  });

  it("N5 | API error on BVN submit → error shown, form not locked", () => {
    cy.intercept("POST", "**/kyc**", {
      statusCode: 500,
      body: { success: false, message: "Server error. Please try again." },
    }).as("kycError");

    cy.get("input").first().type("12345678901");
    cy.get('button[type="submit"]').click();
    cy.wait("@kycError");

    // SOFT: error shown
    cy.softAssert(() => {
      cy.contains(/error|failed|try again/i, { timeout: 8000 }).should("be.visible");
    }, "Error message shown on API failure");

    // SOFT: form should still be interactive (not locked)
    cy.softAssert(() => {
      cy.get("input").first().should("not.be.disabled");
    }, "Form remains interactive after error");

    cy.assertAll();
  });
});
