import 'cypress-audit/commands'

Cypress.Commands.add('waitForCesium', () => {
  cy.wait(3000)
})
