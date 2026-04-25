import { defineConfig } from 'cypress'
import { lighthouse, prepareAudit } from 'cypress-audit'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    video: false,
    screenshotOnRunFailure: false,
    setupNodeEvents(on, config) {
      lighthouse(on)
      on('before:browser:launch', (browser, launchOptions) => {
        prepareAudit(launchOptions)
        return launchOptions
      })
      return config
    },
  },
})
