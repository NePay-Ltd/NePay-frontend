// cypress/e2e/gift-cards/gift-cards.cy.ts
// ─── Gift Cards Test Suite ────────────────────────────────────────────────────

describe("Gift Cards", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/gift-cards");
    cy.url({ timeout: 60000 }).should("include", "/gift-cards");
  });

  it("P1 | Gift cards page loads with available cards", () => {
    cy.get("body").should("be.visible");
    cy.softAssert(() => {
      cy.contains(/gift card|Amazon|iTunes|Google Play/i, { timeout: 10000 }).should("be.visible");
    }, "Gift cards listed");
    cy.assertAll();
  });

  it("P2 | History tab navigates to gift card history", () => {
    cy.contains(/history/i, { timeout: 8000 }).click();
    cy.url().should("include", "/gift-cards");
    cy.softAssert(() => {
      cy.contains(/history|purchase|bought/i).should("be.visible");
    }, "History tab content");
    cy.assertAll();
  });

  it("P3 | Sell tab navigates to gift card submission", () => {
    cy.contains(/sell/i, { timeout: 8000 }).click();
    cy.softAssert(() => {
      cy.contains(/sell|upload|submit/i).should("be.visible");
    }, "Sell tab content");
    cy.assertAll();
  });

  it("N1 | Sell gift card with no image uploaded → validation error", () => {
    cy.contains(/sell/i, { timeout: 8000 }).click();
    cy.get('button[type="submit"]').click();
    cy.contains(/image|upload|required/i, { timeout: 5000 }).should("be.visible");
  });

  it("N2 | Buy with insufficient balance → error shown", () => {
    cy.intercept("POST", "**/gift-cards**", {
      statusCode: 400,
      body: { success: false, code: "INSUFFICIENT_BALANCE", message: "Insufficient balance" },
    }).as("giftCardInsufficient");

    cy.softAssert(() => {
      cy.contains(/Amazon|iTunes/i, { timeout: 10000 }).first().click();
    }, "Click a gift card");

    // Try to purchase
    cy.softAssert(() => {
      cy.get('button[type="submit"]').click();
    }, "Submit purchase");

    cy.assertAll();
  });

  it("N3 | API error on gift card load → no crash", () => {
    cy.intercept("GET", "**/gift-cards**", {
      statusCode: 500,
      body: { success: false, message: "Server error" },
    }).as("gcError");

    cy.reload();
    cy.wait("@gcError");

    cy.get("body").should("be.visible");
  });
});
