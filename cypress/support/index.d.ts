/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      waitForCesium(): Chainable<void>
    }
  }
}
