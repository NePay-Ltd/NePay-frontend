// cypress/support/e2e.ts
// This runs before every E2E test file.

import "./commands";

// Suppress Cypress uncaught exception errors that originate from Next.js
// hydration mismatches or third-party scripts — these are not test failures.
Cypress.on("uncaught:exception", (err) => {
  // Next.js hydration errors are benign in test environments
  if (
    err.message.includes("Hydration") ||
    err.message.includes("hydration") ||
    err.message.includes("ResizeObserver loop") ||
    err.message.includes("Script error")
  ) {
    return false; // returning false prevents Cypress from failing the test
  }
  // All other uncaught exceptions DO fail the test
  return true;
});
