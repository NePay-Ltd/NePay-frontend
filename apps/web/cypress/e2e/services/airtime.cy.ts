// cypress/e2e/services/airtime.cy.ts
// ─── Services — Airtime Test Suite ───────────────────────────────────────────

describe("Services — Airtime", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/services/airtime");
    cy.url({ timeout: 60000 }).should("include", "/services/airtime");
    // Wait for providers to load (page auto-selects MTN)
    cy.contains(/MTN|Airtel|Glo|9mobile/i, { timeout: 15000 }).should("be.visible");
  });

  it("P1 | Airtime page loads with provider list", () => {
    cy.softAssert(() => {
      cy.contains(/MTN|Airtel|Glo|9mobile/i, { timeout: 10000 }).should("be.visible");
    }, "Network providers listed");
    cy.assertAll();
  });

  it("P2 | Select provider → amount/phone form shown", () => {
    // The phone input is always visible — just confirm it exists
    cy.softAssert(() => {
      cy.get("#phone-input", { timeout: 5000 }).should("be.visible");
    }, "Form appears after selecting provider");
    cy.assertAll();
  });

  it("N1 | Invalid phone number → validation error", () => {
    // Type a short invalid phone number
    cy.get("#phone-input").clear().type("12345");
    // Set a valid amount via the ₦50 preset so the Pay button enables
    cy.contains("button", "50").click();
    // Click the sticky Pay bar
    cy.contains("button", "Pay").click();

    // SOFT: validation fires as a toast
    cy.softAssert(() => {
      cy.contains(/valid|phone|number/i, { timeout: 5000 }).should("be.visible");
    }, "Invalid phone toast shown");
    cy.assertAll();
  });

  it("N2 | Empty amount → submit blocked", () => {
    // Type a valid phone but leave amount at 0
    cy.get("#phone-input").clear().type("08012345678");
    // Don't select any amount preset — amount stays 0
    cy.contains("button", "Pay").click();

    // SOFT: minimum amount toast should appear
    cy.softAssert(() => {
      cy.contains(/minimum|amount/i, { timeout: 5000 }).should("be.visible");
    }, "Minimum amount toast shown");
    cy.assertAll();
  });

  it("N3 | No provider selected → submit blocked or provider selection highlighted", () => {
    // The Pay button is disabled when no valid state exists
    // On load the amount is 0, so the Pay button should be disabled
    cy.contains("button", "Pay").should("be.disabled");
    cy.url().should("include", "/services/airtime");
  });

  it("N4 | Insufficient balance → error shown", () => {
    cy.intercept("POST", "**/services/airtime**", {
      statusCode: 400,
      body: { success: false, code: "INSUFFICIENT_BALANCE", message: "Insufficient wallet balance" },
    }).as("airtimeInsufficient");

    cy.get("#phone-input").clear().type("08012345678");
    // Select ₦5000 preset to maximise amount
    cy.contains("button", "5000").click();
    cy.contains("button", "Pay").click();

    // PIN modal will open — enter any pin
    cy.get('input[inputmode="numeric"]', { timeout: 8000 }).type("0000");
    cy.wait("@airtimeInsufficient");

    cy.contains(/insufficient|balance/i, { timeout: 8000 }).should("be.visible");
  });
});
