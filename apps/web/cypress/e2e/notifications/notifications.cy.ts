// cypress/e2e/notifications/notifications.cy.ts
// ─── Notifications Test Suite ─────────────────────────────────────────────────

describe("Notifications", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/notifications");
    cy.url({ timeout: 60000 }).should("include", "/notifications");
  });

  it("P1 | Notifications page loads", () => {
    cy.get("body").should("be.visible");
    cy.softAssert(() => {
      cy.contains(/notification/i, { timeout: 10000 }).should("be.visible");
    }, "Notifications heading");
    cy.assertAll();
  });

  it("P2 | Empty notifications → empty state shown", () => {
    cy.intercept("GET", "**/notifications**", {
      statusCode: 200,
      body: { success: true, data: { items: [], total: 0 } },
    }).as("emptyNotifs");

    cy.reload();
    cy.wait("@emptyNotifs");

    cy.softAssert(() => {
      cy.contains(/no notification|nothing|all caught up/i, { timeout: 8000 }).should("be.visible");
    }, "Empty state for notifications");

    cy.assertAll();
  });

  it("N1 | API error → graceful error state", () => {
    cy.intercept("GET", "**/notifications**", {
      statusCode: 500,
      body: { success: false, message: "Server error" },
    }).as("notifsError");

    cy.reload();
    cy.wait("@notifsError");

    cy.get("body").should("be.visible");
    cy.contains(/error occurred|unexpected/i).should("not.exist");
  });
});
