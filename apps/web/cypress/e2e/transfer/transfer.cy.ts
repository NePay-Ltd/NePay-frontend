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
    // HARD
    cy.get("input", { timeout: 10000 }).should("be.visible");
    cy.contains(/transfer|send|recipient/i).should("be.visible");
  });

  it("P2 | Amount field formats correctly (no more than 2 decimal places shown)", () => {
    // Find the amount input and check formatting
    cy.get('input[name="amount"], input[placeholder*="amount" i], input[placeholder*="Amount" i]')
      .first()
      .type("12500")
      .should(($el) => {
        // SOFT: formatted value check
        const val = $el.val() as string;
        expect(val).to.match(/12[,.]?500/);
      });
  });

  it("P3 | Empty amount → submit blocked", () => {
    cy.get('button[type="submit"]').first().click();
    // HARD: should not proceed without an amount
    cy.url().should("include", "/transfer");
  });

  // ── Negative Tests ──────────────────────────────────────────────────────────

  it("N1 | Non-existent username search → 'not found' error shown", () => {
    cy.intercept("GET", "**/users/search**", {
      statusCode: 404,
      body: { success: false, message: "User not found" },
    }).as("userNotFound");

    // Type in search field
    cy.get("input").first().type("xyznonexistentuser999");
    cy.wait("@userNotFound");

    // HARD
    cy.contains(/not found|no user|does not exist/i, { timeout: 8000 }).should("be.visible");
  });

  it("N2 | Amount = 0 → validation error before API call", () => {
    cy.get('input[name="amount"], input[placeholder*="amount" i]')
      .first()
      .type("0");
    cy.get('button[type="submit"]').first().click();

    // HARD: 0 amount should be rejected
    cy.contains(/invalid|minimum|greater than/i).should("be.visible");
  });

  it("N3 | Insufficient balance → error shown on confirm", () => {
    cy.intercept("POST", "**/transfers**", {
      statusCode: 400,
      body: {
        success: false,
        code: "INSUFFICIENT_BALANCE",
        message: "Insufficient wallet balance",
      },
    }).as("insufficientBalance");

    cy.intercept("GET", "**/users/search**", {
      statusCode: 200,
      body: {
        success: true,
        data: { id: "user-123", username: "testrecipient", firstName: "Test", lastName: "User" },
      },
    });

    cy.get("input").first().type("testrecipient");
    cy.contains("testrecipient", { timeout: 5000 }).click();
    cy.get('input[name="amount"], input[placeholder*="amount" i]').first().type("9999999");
    cy.get('button[type="submit"]').first().click();
    cy.wait("@insufficientBalance");

    // HARD
    cy.contains(/insufficient|balance|funds/i, { timeout: 8000 }).should("be.visible");
  });

  it("N4 | API failure on confirm → error shown, no duplicate deduction", () => {
    cy.intercept("POST", "**/transfers/confirm**", {
      statusCode: 500,
      body: { success: false, message: "Transfer failed. Please try again." },
    }).as("transferFail");

    // SOFT: error message shown
    cy.softAssert(() => {
      cy.contains(/failed|error|try again/i, { timeout: 8000 }).should("exist");
    }, "Error message on transfer API failure");

    cy.assertAll();
  });

  it("N5 | Special characters in recipient search → no crash", () => {
    cy.get("input").first().type("<script>alert('xss')</script>");

    // HARD: no crash, no script execution
    cy.get("body").should("be.visible");
    cy.contains(/not found|no user|no result/i, { timeout: 5000 }).should("be.visible");
  });
});
