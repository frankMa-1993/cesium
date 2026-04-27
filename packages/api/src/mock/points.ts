export const pointsMock = {
  code: 200,
  data: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'p1',
        geometry: { type: 'Point', coordinates: [114.0579, 22.5431] },
        properties: { id: 'p1', name: '监测点A', status: 'online', type: '水质' },
      },
      {
        type: 'Feature',
        id: 'p2',
        geometry: { type: 'Point', coordinates: [114.0679, 22.5531] },
        properties: { id: 'p2', name: '监测点B', status: 'warning', type: '大气' },
      },
      {
        type: 'Feature',
        id: 'p3',
        geometry: { type: 'Point', coordinates: [114.0479, 22.5331] },
        properties: { id: 'p3', name: '监测点C', status: 'danger', type: '土壤' },
      },
    ],
  },
}

export const pointDetailMock: Record<string, any> = {
  p1: {
    code: 200,
    data: {
      id: 'p1',
      name: '监测点A',
      status: 'online',
      type: '水质',
      value: 7.2,
      unit: 'pH',
      lon: 114.0579,
      lat: 22.5431,
      updateTime: '2026-04-27 14:00:00',
    },
  },
  p2: {
    code: 200,
    data: {
      id: 'p2',
      name: '监测点B',
      status: 'warning',
      type: '大气',
      value: 85,
      unit: 'AQI',
      lon: 114.0679,
      lat: 22.5531,
      updateTime: '2026-04-27 14:05:00',
    },
  },
  p3: {
    code: 200,
    data: {
      id: 'p3',
      name: '监测点C',
      status: 'danger',
      type: '土壤',
      value: 3.2,
      unit: 'mg/kg',
      lon: 114.0479,
      lat: 22.5331,
      updateTime: '2026-04-27 14:10:00',
    },
  },
}
