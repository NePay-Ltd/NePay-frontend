// cypress/e2e/dashboard/overview.cy.ts
// ─── Overview / Dashboard Test Suite ─────────────────────────────────────────

describe("Dashboard — Overview", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/overview");
    // Wait for page to load
    cy.url({ timeout: 60000 }).should("include", "/overview");
  });

  // ── Positive Tests ──────────────────────────────────────────────────────────

  it("P1 | Dashboard loads — wallet balance card visible with formatted value", () => {
    // SOFT: balance card exists
    cy.softAssert(() => {
      cy.contains(/₦|balance/i, { timeout: 10000 }).should("be.visible");
    }, "Wallet balance visible");

    cy.assertAll();
  });

  it("P2 | Recent transactions list renders", () => {
    // SOFT: at least one transaction, or an empty state
    cy.softAssert(() => {
      cy.get("body").then(($body) => {
        const hasTransactions = $body.text().match(/transaction|debit|credit|transfer/i);
        const hasEmptyState = $body.text().match(/no transaction|nothing here/i);
        expect(hasTransactions || hasEmptyState).to.be.ok;
      });
    }, "Transactions list or empty state visible");

    cy.assertAll();
  });

  it("P3 | Quick action buttons visible on dashboard", () => {
    // SOFT: check all quick actions exist
    const actions = ["Transfer", "Add Money"];
    actions.forEach((action) => {
      cy.softAssert(() => {
        cy.contains(action, { timeout: 8000 }).should("be.visible");
      }, `Quick action: ${action}`);
    });

    cy.assertAll();
  });

  it("P4 | Sidebar navigation links are all present", () => {
    const navItems = ["Overview", "Transactions", "Transfer to bank", "Bills & services"];
    navItems.forEach((item) => {
      cy.softAssert(() => {
        cy.contains(item, { timeout: 8000 }).should("exist");
      }, `Sidebar nav item: ${item}`);
    });

    cy.assertAll();
  });

  it("P5 | Clicking Transfer in sidebar navigates to /transfer", () => {
    cy.contains("Transfer to bank", { timeout: 8000 }).first().click();
    // HARD
    cy.url({ timeout: 10000 }).should("include", "/transfer");
  });

  it("P6 | Page has no visible error or crash", () => {
    // HARD: no error boundary or crash message
    cy.contains(/something went wrong|error occurred|unexpected/i).should("not.exist");
    cy.get("body").should("be.visible");
  });

  it("P7 | Can toggle balance visibility (eye icon)", () => {
    // Make sure balance is visible first
    cy.contains(/₦/i, { timeout: 10000 }).should("be.visible");

    // Click the hide balance button
    cy.get('button[aria-label="Hide balance"]').click();

    // Verify it turns into asterisks
    cy.contains("******").should("be.visible");
    cy.get('button[aria-label="Show balance"]').should("be.visible");

    // Click to show again
    cy.get('button[aria-label="Show balance"]').click();

    // Verify asterisks are gone and balance is back
    cy.contains("******").should("not.exist");
    cy.contains(/₦/i).should("be.visible");
  });

  // ── Negative Tests ──────────────────────────────────────────────────────────

  it("N1 | Wallet API error → error state shown, page does not crash", () => {
    cy.intercept("GET", "**/wallet**", {
      statusCode: 500,
      body: { success: false, message: "Internal server error" },
    }).as("walletError");

    cy.reload();
    cy.wait("@walletError");

    // HARD: no crash
    cy.get("body").should("be.visible");

    // SOFT: some error state or graceful fallback shown
    cy.softAssert(() => {
      cy.contains(/error|failed|unavailable|try again/i, { timeout: 8000 }).should("be.visible");
    }, "Error state on wallet API failure");

    cy.assertAll();
  });

  it("N2 | Skeleton loaders shown during slow API response", () => {
    cy.intercept("GET", "**/wallet**", (req) => {
      req.on("response", (res) => {
        res.setDelay(3000); // 3-second artificial delay
      });
    }).as("slowWallet");

    cy.reload();

    // SOFT: loading skeleton should be visible before data arrives
    cy.softAssert(() => {
      cy.get("[class*=skeleton], [class*=loading], [data-testid*=skeleton]", { timeout: 2000 })
        .should("exist");
    }, "Skeleton loaders during slow API");

    cy.wait("@slowWallet");
    cy.assertAll();
  });
});
