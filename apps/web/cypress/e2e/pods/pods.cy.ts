// cypress/e2e/pods/pods.cy.ts
// ─── Pods Test Suite ──────────────────────────────────────────────────────────

describe("Pods", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/pods");
    cy.url({ timeout: 60000 }).should("include", "/pods");
  });

  it("P1 | Pods page loads", () => {
    cy.get("body").should("be.visible");
    cy.contains(/pod|saving|group/i, { timeout: 10000 }).should("be.visible");
  });

  it("P2 | Empty pods → empty state shown", () => {
    // Intercept BEFORE visiting so it catches the initial data fetch
    cy.intercept("GET", "**/pods**", {
      statusCode: 200,
      body: { success: true, data: [] },
    }).as("emptyPods");

    cy.login();
    cy.visit("/pods");
    cy.wait("@emptyPods");

    cy.softAssert(() => {
      cy.contains(/no pod|create|start/i, { timeout: 8000 }).should("be.visible");
    }, "Empty state message for no pods");

    cy.assertAll();
  });

  it("N1 | Create pod with no name → validation error", () => {
    cy.contains(/create|new pod/i, { timeout: 8000 }).click();
    cy.get('button[type="submit"]').click();

    cy.contains(/name|required/i, { timeout: 5000 }).should("be.visible");
  });

  it("N2 | Create pod with target = 0 → validation error", () => {
    cy.contains(/create|new pod/i, { timeout: 8000 }).click();
    cy.get('input[name="name"], input[placeholder*="name" i]').first().type("My Pod");
    cy.get('input[name="targetAmount"], input[placeholder*="target" i], input[placeholder*="amount" i]')
      .first()
      .type("0");
    cy.get('button[type="submit"]').click();

    cy.softAssert(() => {
      cy.contains(/invalid|greater than|minimum/i, { timeout: 5000 }).should("be.visible");
    }, "Zero target amount validation");

    cy.assertAll();
  });

  it("N3 | API error on pod load → page doesn't crash", () => {
    // Intercept BEFORE visiting so it catches the initial data fetch
    cy.intercept("GET", "**/pods**", {
      statusCode: 500,
      body: { success: false, message: "Server error" },
    }).as("podsError");

    cy.login();
    cy.visit("/pods");
    cy.wait("@podsError");

    cy.get("body").should("be.visible");
    cy.contains(/something went wrong|unhandled/i).should("not.exist");
  });
});
