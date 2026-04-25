const LEVELS = ['danger', 'warning', 'info']
const TYPES = ['设备离线', '数据异常', '阈值越界', '通信中断', '电量过低']
const AREAS = ['朝阳区', '海淀区', '丰台区', '通州区', '昌平区', '大兴区', '房山区']

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export default [
  {
    url: '/api/alerts',
    method: 'GET',
    response() {
      const list = Array.from({ length: 8 }, (_, i) => ({
        id: `A${Date.now()}_${i}`,
        level: randomItem(LEVELS),
        type: randomItem(TYPES),
        area: randomItem(AREAS),
        deviceName: `监测设备-${randomInt(1000, 9999)}`,
        time: new Date(Date.now() - randomInt(0, 3600000)).toLocaleString('zh-CN'),
        desc: `检测到${randomItem(TYPES)}，请及时处理`,
      }))

      return {
        code: 200,
        message: 'success',
        data: {
          list,
          total: list.length,
        },
      }
    },
  },
]
