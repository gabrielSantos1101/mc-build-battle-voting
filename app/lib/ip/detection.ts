import type { IPInfo } from '../supabase/types'

let ipCache: IPInfo | null = null
let ipCacheTime = 0
const IP_CACHE_DURATION = 10 * 60 * 1000

export async function getClientIP(): Promise<IPInfo> {
  const now = Date.now()
  if (ipCache && now - ipCacheTime < IP_CACHE_DURATION) {
    return ipCache
  }

  const services = [
    'https://api.ipify.org?format=json',
    'https://ipapi.co/json/',
    'https://ipwho.is/',
  ]

  for (const service of services) {
    try {
      const response = await fetch(service, { signal: AbortSignal.timeout(5000) })
      if (!response.ok) continue
      const data = await response.json()
      
      let ipInfo: IPInfo
      if (service.includes('ipify')) {
        ipInfo = { ip: data.ip }
      } else if (service.includes('ipapi')) {
        ipInfo = { ip: data.ip, country: data.country_name, region: data.region, city: data.city }
      } else {
        ipInfo = { ip: data.ip, country: data.country, region: data.region, city: data.city, latitude: data.latitude, longitude: data.longitude }
      }
      
      ipCache = ipInfo
      ipCacheTime = now
      return ipInfo
    } catch {
      continue
    }
  }

  const fallback: IPInfo = { ip: 'unknown' }
  ipCache = fallback
  ipCacheTime = now
  return fallback
}