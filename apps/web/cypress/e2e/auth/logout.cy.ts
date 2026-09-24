// cypress/e2e/auth/logout.cy.ts
// ─── Logout Test Suite ────────────────────────────────────────────────────────

describe("Auth — Logout", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/overview");
  });

  it("P1 | Logout clears nepay_refresh cookie", () => {
    // Find and click the logout trigger
    cy.contains(/log out|sign out/i, { timeout: 8000 }).click();

    // HARD: cookie must be gone
    cy.getCookie("nepay_refresh", { timeout: 8000 }).should("not.exist");
  });

  it("P2 | Logout redirects to /login", () => {
    cy.contains(/log out|sign out/i, { timeout: 8000 }).click();

    // HARD
    cy.url({ timeout: 8000 }).should("include", "/login");
  });

  it("P3 | Signed out toast is shown", () => {
    cy.contains(/log out|sign out/i, { timeout: 8000 }).click();

    // SOFT: toast is cosmetic
    cy.softAssert(() => {
      cy.contains(/signed out|logged out/i, { timeout: 5000 }).should("be.visible");
    }, "Signed out toast");

    cy.assertAll();
  });

  it("P4 | localStorage is cleared after logout", () => {
    cy.contains(/log out|sign out/i, { timeout: 8000 }).click();
    cy.url({ timeout: 8000 }).should("include", "/login");

    // HARD: tokens must be gone from localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem("nepay-auth")).to.be.null;
    });
  });

  it("N1 | After logout, browser back to protected route → redirected to /login", () => {
    cy.contains(/log out|sign out/i, { timeout: 8000 }).click();
    cy.url({ timeout: 8000 }).should("include", "/login");

    cy.go("back");

    // HARD: middleware must gate the route
    cy.url({ timeout: 8000 }).should("include", "/login");
  });

  it("N2 | Logout when API fails → still clears state and redirects", () => {
    cy.intercept("POST", "**/auth/logout", { forceNetworkError: true }).as("logoutFail");

    cy.contains(/log out|sign out/i, { timeout: 8000 }).click();
    cy.wait("@logoutFail");

    // HARD: even on API failure, user must be logged out locally
    cy.url({ timeout: 8000 }).should("include", "/login");
    cy.getCookie("nepay_refresh").should("not.exist");
  });
});
