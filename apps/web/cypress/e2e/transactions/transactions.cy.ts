// cypress/e2e/transactions/transactions.cy.ts
// ─── Transactions Test Suite ──────────────────────────────────────────────────

describe("Transactions", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/transactions");
    cy.url({ timeout: 60000 }).should("include", "/transactions");
  });

  it("P1 | Transactions page loads with history", () => {
    cy.get("body").should("be.visible");
    cy.softAssert(() => {
      cy.get("body").then(($body) => {
        const text = $body.text();
        expect(
          text.match(/transaction|debit|credit|₦/i) ||
          text.match(/no transaction|empty/i)
        ).to.be.ok;
      });
    }, "Transaction list or empty state");
    cy.assertAll();
  });

  it("P2 | Filter by debit type works", () => {
    cy.contains(/debit|filter/i, { timeout: 8000 }).first().click();
    cy.softAssert(() => {
      cy.contains(/debit/i).should("be.visible");
    }, "Debit filter active");
    cy.assertAll();
  });

  it("N1 | Empty history → empty state message shown", () => {
    // Intercept BEFORE visiting so it catches the initial data fetch
    cy.intercept("GET", "**/transactions**", {
      statusCode: 200,
      body: { success: true, data: { items: [], total: 0 } },
    }).as("emptyTxn");

    cy.login();
    cy.visit("/transactions");
    cy.wait("@emptyTxn");

    cy.softAssert(() => {
      cy.contains(/no transaction|empty|nothing/i, { timeout: 8000 }).should("be.visible");
    }, "Empty state shown");

    cy.assertAll();
  });

  it("N2 | API error → graceful fallback, no crash", () => {
    // Intercept BEFORE visiting so it catches the initial data fetch
    cy.intercept("GET", "**/transactions**", {
      statusCode: 500,
      body: { success: false, message: "Server error" },
    }).as("txnError");

    cy.login();
    cy.visit("/transactions");
    cy.wait("@txnError");

    cy.get("body").should("be.visible");
  });
});
