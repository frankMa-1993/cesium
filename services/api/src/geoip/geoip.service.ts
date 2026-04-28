/**
 * 基于 geoip-lite 的离线 IP 地理位置解析，用于登录审计展示省市。
 *
 * 内网与回环地址返回简化文案；公网 IP 解析失败时返回 null。
 * 合规或精度要求高时可替换为商业 GeoIP 服务。
 */
import { Injectable } from '@nestjs/common'
import geoip from 'geoip-lite'

@Injectable()
export class GeoipService {
  /**
   * @param ip 可能带 `::ffff:` 前缀或来自代理链，会先规范化再查库
   * @returns province/city 供 `LoginLogEntity` 存储展示
   */
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
