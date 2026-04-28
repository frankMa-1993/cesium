import { Injectable } from '@nestjs/common'
import geoip from 'geoip-lite'

/** 离线 IP → 省市（合规场景可替换为商用库） */
@Injectable()
export class GeoipService {
  lookup(ip: string): { province: string | null; city: string | null } {
    const clean = ip.replace(/^::ffff:/, '').trim()
    if (
      clean === '127.0.0.1' ||
      clean === '::1' ||
      clean.startsWith('192.168.') ||
      clean.startsWith('10.')
    ) {
      return { province: '局域网', city: clean }
    }
    try {
      const r = geoip.lookup(clean)
      if (!r)
        return { province: null, city: null }
      const region = r.region ? String(r.region) : null
      /** geoip-lite region 为部分地区代码，此处简化为国家+城市展示 */
      const city = r.city ? String(r.city) : null
      const country = r.country ? String(r.country) : null
      return {
        province: country || region,
        city: city || region,
      }
    } catch {
      return { province: null, city: null }
    }
  }
}
