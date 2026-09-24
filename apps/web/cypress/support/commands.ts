// cypress/support/commands.ts
// ─── Custom Commands ──────────────────────────────────────────────────────────
//
// cy.login()       — programmatic login via API (fast, no UI form)
// cy.logout()      — clears localStorage + cookie + visits /login
// cy.softAssert()  — records a failure without stopping the test
// cy.assertAll()   — hard-fails if any soft assertions were collected
// cy.getBySel()    — query by data-testid attribute

// Extend Cypress types
declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>;
      logout(): Chainable<void>;
      softAssert(fn: () => void, message?: string): Chainable<void>;
      assertAll(): Chainable<void>;
      getBySel(selector: string): Chainable<JQuery<HTMLElement>>;
    }
  }
}

// ─── Soft assertion store ─────────────────────────────────────────────────────
// We keep a list of failures per test; cy.assertAll() hard-fails if any exist.
const softFailures: string[] = [];

// Reset soft failures before each test
beforeEach(() => {
  softFailures.length = 0;
});

// ─── cy.login() ───────────────────────────────────────────────────────────────
// Calls the real NePay backend via cy.request() — no UI form needed.
// Stores the token in localStorage (where api-client.ts reads it) and
// sets the nepay_refresh cookie so middleware passes through.
Cypress.Commands.add("login", (email?: string, password?: string) => {
  const testEmail = email || Cypress.env("TEST_EMAIL");
  const testPassword = password || Cypress.env("TEST_PASSWORD");
  const apiUrl = Cypress.env("API_URL");

  cy.request({
    method: "POST",
    url: `${apiUrl}/auth/login`,
    body: { email: testEmail, password: testPassword },
    failOnStatusCode: false,
  }).then((response) => {
    // Handle the response
    expect(response.status, "Login API should return 200 or 201").to.be.oneOf([200, 201]);

    const data = response.body && response.body.data;

    // Guard: if MFA is required on this account, skip test gracefully
    if (data && data.mfaRequired) {
      throw new Error(
        "cy.login() — MFA is enabled on the test account. Disable MFA or use a non-MFA test account."
      );
    }

    // Store tokens in localStorage so api-client interceptor picks them up
    window.localStorage.setItem("nepay-auth", JSON.stringify(data));

    // Set the session cookie so the Next.js middleware lets the request through
    cy.setCookie("nepay_refresh", "true", {
      path: "/",
      secure: true,
      sameSite: "lax",
    });
  });
});

// ─── cy.logout() ─────────────────────────────────────────────────────────────
Cypress.Commands.add("logout", () => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.visit("/login");
});

// ─── cy.softAssert() ─────────────────────────────────────────────────────────
// Wraps an assertion in a try/catch. If it fails, the error is recorded
// but the test continues. Call cy.assertAll() at the end to hard-fail.
Cypress.Commands.add("softAssert", (fn: () => void, message?: string) => {
  cy.wrap(null, { log: false }).then(() => {
    try {
      fn();
    } catch (err: any) {
      const label = message ? `[${message}] ` : "";
      const msg = `${label}${err.message}`;
      softFailures.push(msg);
      Cypress.log({
        name: "softAssert FAILED",
        message: msg,
        consoleProps: () => ({ error: err }),
      });
    }
  });
});

// ─── cy.assertAll() ──────────────────────────────────────────────────────────
// Hard-fails the test if any soft assertions failed, printing all of them.
Cypress.Commands.add("assertAll", () => {
  cy.wrap(null, { log: false }).then(() => {
    if (softFailures.length > 0) {
      const summary = softFailures
        .map((f, i) => `  ${i + 1}. ${f}`)
        .join("\n");
      throw new Error(`${softFailures.length} soft assertion(s) failed:\n${summary}`);
    }
  });
});

// ─── cy.getBySel() ───────────────────────────────────────────────────────────
// Shorthand for cy.get('[data-testid="..."]')
Cypress.Commands.add("getBySel", (selector: string) => {
  return cy.get(`[data-testid="${selector}"]`);
});
