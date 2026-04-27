export const alertsMock = {
  code: 200,
  data: {
    list: [
      { id: 1, type: '水质异常', deviceName: '监测点A', area: '南山区', time: '2026-04-27 13:55:00', level: 'warning' },
      { id: 2, type: '设备离线', deviceName: '监测点B', area: '福田区', time: '2026-04-27 13:40:00', level: 'danger' },
      { id: 3, type: '数据延迟', deviceName: '监测点C', area: '宝安区', time: '2026-04-27 13:30:00', level: 'info' },
      { id: 4, type: '阈值超限', deviceName: '监测点D', area: '龙岗区', time: '2026-04-27 13:20:00', level: 'warning' },
      { id: 5, type: '设备故障', deviceName: '监测点E', area: '罗湖区', time: '2026-04-27 13:10:00', level: 'danger' },
    ],
  },
}
