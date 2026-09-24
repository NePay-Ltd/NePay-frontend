// cypress/e2e/services/airtime.cy.ts
// ─── Services — Airtime Test Suite ───────────────────────────────────────────

describe("Services — Airtime", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/services/airtime");
    cy.url({ timeout: 60000 }).should("include", "/services/airtime");
  });

  it("P1 | Airtime page loads with provider list", () => {
    cy.softAssert(() => {
      cy.contains(/MTN|Airtel|Glo|9mobile/i, { timeout: 10000 }).should("be.visible");
    }, "Network providers listed");
    cy.assertAll();
  });

  it("P2 | Select provider → amount/phone form shown", () => {
    cy.contains(/MTN|Airtel|Glo/i, { timeout: 10000 }).first().click();
    cy.softAssert(() => {
      cy.get("input", { timeout: 5000 }).should("be.visible");
    }, "Form appears after selecting provider");
    cy.assertAll();
  });

  it("N1 | Invalid phone number → validation error", () => {
    cy.contains(/MTN|Airtel|Glo/i, { timeout: 10000 }).first().click();
    cy.get('input[name="phone"], input[placeholder*="phone" i], input[placeholder*="number" i]')
      .first()
      .type("12345");
    cy.get('button[type="submit"]').click();

    cy.contains(/valid|Nigerian|phone/i, { timeout: 5000 }).should("be.visible");
  });

  it("N2 | Empty amount → submit blocked", () => {
    cy.contains(/MTN|Airtel|Glo/i, { timeout: 10000 }).first().click();
    cy.get('input[name="phone"], input[placeholder*="phone" i]').first().type("08012345678");
    cy.get('button[type="submit"]').click();

    cy.contains(/amount|required/i, { timeout: 5000 }).should("be.visible");
  });

  it("N3 | No provider selected → submit blocked or provider selection highlighted", () => {
    cy.get('button[type="submit"]').click();
    cy.url().should("include", "/services/airtime");
  });

  it("N4 | Insufficient balance → error shown", () => {
    cy.intercept("POST", "**/services/airtime**", {
      statusCode: 400,
      body: { success: false, code: "INSUFFICIENT_BALANCE", message: "Insufficient wallet balance" },
    }).as("airtimeInsufficient");

    cy.contains(/MTN/i, { timeout: 10000 }).first().click();
    cy.get('input[name="phone"], input[placeholder*="phone" i]').first().type("08012345678");
    cy.get('input[name="amount"], input[placeholder*="amount" i]').first().type("999999999");
    cy.get('button[type="submit"]').click();
    cy.wait("@airtimeInsufficient");

    cy.contains(/insufficient|balance/i, { timeout: 8000 }).should("be.visible");
  });
});
