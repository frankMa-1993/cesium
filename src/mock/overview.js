function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export default [
  {
    url: '/api/overview',
    method: 'GET',
    response() {
      return {
        code: 200,
        message: 'success',
        data: {
          onlineDevices: randomInt(1200, 1500),
          totalDevices: 2000,
          alertCount: randomInt(30, 80),
          warningCount: randomInt(50, 120),
          todayTask: randomInt(200, 400),
          completedTask: randomInt(100, 200),
          onlineRate: +(Math.random() * 10 + 75).toFixed(1),
        },
      }
    },
  },
]
