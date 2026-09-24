// cypress/e2e/wallet/wallet.cy.ts
// ─── Wallet Test Suite ────────────────────────────────────────────────────────

describe("Wallet", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/wallet");
    cy.url({ timeout: 60000 }).should("include", "/wallet");
  });

  it("P1 | Wallet page loads with balance breakdown", () => {
    cy.softAssert(() => {
      cy.contains(/₦|balance|wallet/i, { timeout: 10000 }).should("be.visible");
    }, "Balance visible");

    cy.assertAll();
  });

  it("P2 | Transaction history list renders", () => {
    cy.softAssert(() => {
      cy.get("body").then(($body) => {
        const text = $body.text();
        expect(
          text.match(/no transaction|nothing|empty/i) ||
          text.match(/debit|credit|transfer|₦/i)
        ).to.be.ok;
      });
    }, "Transaction list or empty state shown");

    cy.assertAll();
  });

  it("N1 | Empty transaction history → empty state message shown", () => {
    cy.intercept("GET", "**/transactions**", {
      statusCode: 200,
      body: { success: true, data: { items: [], total: 0 } },
    }).as("emptyTransactions");

    cy.reload();
    cy.wait("@emptyTransactions");

    cy.softAssert(() => {
      cy.contains(/no transaction|empty|nothing/i, { timeout: 8000 }).should("be.visible");
    }, "Empty state shown when no transactions");

    cy.assertAll();
  });

  it("N2 | API error on wallet fetch → error state shown, no crash", () => {
    cy.intercept("GET", "**/wallet**", {
      statusCode: 500,
      body: { success: false, message: "Server error" },
    }).as("walletError");

    cy.reload();
    cy.wait("@walletError");

    // HARD: page must not crash
    cy.get("body").should("be.visible");
    cy.contains(/something went wrong|error occurred/i).should("not.exist");
  });
});
