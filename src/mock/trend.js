function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateHours(count = 24) {
  return Array.from({ length: count }, (_, i) => `${i.toString().padStart(2, '0')}:00`)
}

function generateValues(count = 24, min = 20, max = 80) {
  return Array.from({ length: count }, () => randomInt(min, max))
}

export default [
  {
    url: '/api/trend',
    method: 'GET',
    response() {
      return {
        code: 200,
        message: 'success',
        data: {
          hours: generateHours(24),
          onlineTrend: generateValues(24, 1200, 1500),
          alertTrend: generateValues(24, 10, 60),
          dataVolume: generateValues(24, 500, 1200),
        },
      }
    },
  },
]
