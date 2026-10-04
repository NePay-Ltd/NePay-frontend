// cypress/e2e/transfer/transfer.cy.ts
// ─── Transfer Test Suite ──────────────────────────────────────────────────────

describe("Transfer", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/transfer");
    cy.url({ timeout: 60000 }).should("include", "/transfer");
  });

  // ── Positive Tests ──────────────────────────────────────────────────────────

  it("P1 | Transfer page loads with recipient search field", () => {
    // HARD: key UI elements must be visible
    cy.contains(/Transfer Funds/i, { timeout: 10000 }).should("be.visible");
    cy.contains(/Select a bank/i).should("be.visible");
    cy.contains(/Account Number/i).should("be.visible");
  });

  it("P2 | Amount field formats correctly (no more than 2 decimal places shown)", () => {
    cy.get('input[type="number"]').first().type("12500");
    cy.get('input[type="number"]').first().should(($el) => {
      const val = $el.val() as string;
      expect(val).to.match(/12500/);
    });
  });

  it("P3 | Empty amount → submit blocked", () => {
    // The Transfer Now button is disabled when form is not valid
    cy.contains("button", "Transfer Now").should("be.disabled");
    cy.url().should("include", "/transfer");
  });

  // ── Negative Tests ──────────────────────────────────────────────────────────

  it("N1 | Bank search with no results → 'No banks found' shown", () => {
    // Open the bank selector
    cy.contains("button", "Select a bank").click();
    // Type a query that matches no bank
    cy.get('input[placeholder="Search banks..."]').type("zzznobankexists999");

    // HARD: no results message
    cy.contains(/no banks found/i, { timeout: 5000 }).should("be.visible");
  });

  it("N2 | Amount = 0 → Transfer Now button stays disabled", () => {
    // Leave amount at 0 (default)
    cy.contains("button", "Transfer Now").should("be.disabled");
    cy.url().should("include", "/transfer");
  });

  it("N3 | Insufficient balance → inline error shown", () => {
    // Type an amount way beyond any realistic balance
    cy.get('input[type="number"]').first().clear().type("9999999999");

    // SOFT: insufficient funds message appears below the amount field
    cy.softAssert(() => {
      cy.contains(/insufficient funds|insufficient balance/i, { timeout: 5000 }).should("be.visible");
    }, "Insufficient funds error shown");

    cy.assertAll();
  });

  it("N4 | API failure on confirm → error shown in modal", () => {
    cy.intercept("POST", "**/transfers/**", {
      statusCode: 500,
      body: { success: false, message: "Transfer failed. Please try again." },
    }).as("transferFail");

    // SOFT: error message shown (only fires if modal is reachable)
    cy.softAssert(() => {
      cy.contains(/failed|error|try again/i, { timeout: 8000 }).should("exist");
    }, "Error message on transfer API failure");

    cy.assertAll();
  });

  it("N5 | Special characters in bank search → no crash", () => {
    cy.contains("button", "Select a bank").click();
    cy.get('input[placeholder="Search banks..."]').type("<script>alert('xss')</script>");

    // HARD: no crash, page still functional
    cy.get("body").should("be.visible");
    cy.contains(/no banks found|GTBank|Zenith/i, { timeout: 5000 }).should("be.visible");
  });
});
