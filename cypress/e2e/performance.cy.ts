describe('性能指标', () => {
  beforeEach(() => {
    cy.visit('/#/')
    cy.waitForCesium()
  })

  it('内存占用不超过 150MB', () => {
    cy.window().then((win: any) => {
      if (win.performance && win.performance.memory) {
        const usedMB = win.performance.memory.usedJSHeapSize / 1024 / 1024
        expect(usedMB).to.be.lessThan(150)
      }
    })
  })

  it('Lighthouse Performance 评分 ≥85', () => {
    cy.lighthouse({
      performance: 85,
      accessibility: 70,
      'best-practices': 80,
      seo: 60,
    })
  })
})
