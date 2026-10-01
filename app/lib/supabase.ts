import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://exemplo.supabase.co'
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.exemplo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================================
// Types
// ============================================================

export type RoundStatus = 'draft' | 'active' | 'paused' | 'finished'

export type FrameTheme =
  | 'pale-garden'
  | 'warden-sculk'
  | 'wither'
  | 'ender-dragon'
  | 'jack-pumpkin'

export interface Round {
  id: string
  title: string
  status: RoundStatus
  show_live_results: boolean
  countdown_seconds: number | null
  starts_at: string | null
  ends_at: string | null
  created_at: string
}

export interface Competitor {
  id: string
  round_id: string
  player_nick: string
  image_url: string
  frame_theme: FrameTheme
  created_at: string
}

export interface Vote {
  id: string
  round_id: string
  competitor_id: string
  device_id: string
  ip: string
  country?: string
  region?: string
  city?: string
  created_at: string
}

export interface CompetitorWithVotes extends Competitor {
  vote_count: number
  vote_percentage: number
}

// ============================================================
// Helpers
// ============================================================

/** Get Minecraft player avatar URL (face only, 32px) */
export function getMinecraftAvatarUrl(nick: string, size = 48): string {
  if (!nick) return 'https://mc-heads.net/avatar/MHF_Steve/48'
  return `https://mc-heads.net/avatar/${encodeURIComponent(nick)}/${size}`
}

/** Get or create a persistent device ID for this browser */
export function getDeviceId(): string {
  const STORAGE_KEY = 'bb_device_id'
  let deviceId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  if (!deviceId) {
    deviceId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, deviceId)
    }
  }
  return deviceId
}

/** Check if the current device has already voted in a specific round */
export function hasVotedInRound(roundId: string): boolean {
  if (typeof window === 'undefined') return false
  const key = `bb_voted_${roundId}`
  return localStorage.getItem(key) === 'true'
}

/** Mark the current device as having voted in a round */
export function markVotedInRound(roundId: string): void {
  if (typeof window === 'undefined') return
  const key = `bb_voted_${roundId}`
  localStorage.setItem(key, 'true')
}

/** Check if an IP has already voted in a round (server-side check) */
export async function hasIPVotedInRound(roundId: string, ip: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('votes')
    .select('id')
    .eq('round_id', roundId)
    .eq('ip', ip)
    .limit(1)
    .maybeSingle()
  
  return !error && !!data
}

/** Initialize auth: get IP, create JWT, store token */
export async function initializeAuth(): Promise<{ token: string; ipInfo: IPInfo; deviceId: string }> {
  const deviceId = getDeviceId()
  const ipInfo = await getClientIP()
  const token = await createJWT({
    sub: deviceId,
    ip: ipInfo.ip,
    country: ipInfo.country,
    region: ipInfo.region,
    city: ipInfo.city,
  })
  setStoredToken(token)
  return { token, ipInfo, deviceId }
}

/** Get current auth payload from stored token */
export async function getAuthPayload(): Promise<AuthPayload | null> {
  const token = getStoredToken()
  if (!token) return null
  return verifyJWT(token)
}

/** Check if user can vote (not voted by device or IP) */
export async function canVote(roundId: string): Promise<{ canVote: boolean; reason?: string }> {
  const deviceId = getDeviceId()
  const { data: deviceVote } = await supabase
    .from('votes')
    .select('id')
    .eq('round_id', roundId)
    .eq('device_id', deviceId)
    .limit(1)
    .maybeSingle()
  
  if (deviceVote) {
    return { canVote: false, reason: 'device' }
  }

  const ipInfo = await getClientIP()
  const ipVoted = await hasIPVotedInRound(roundId, ipInfo.ip)
  if (ipVoted) {
    return { canVote: false, reason: 'ip' }
  }

  return { canVote: true }
}

/** Compute vote counts and percentages from a list of votes */
export function computeVoteStats(
  competitors: Competitor[],
  votes: Vote[]
): CompetitorWithVotes[] {
  const totalVotes = votes.length
  const voteMap: Record<string, number> = {}

  for (const vote of votes) {
    voteMap[vote.competitor_id] = (voteMap[vote.competitor_id] ?? 0) + 1
  }

  return competitors.map((c) => {
    const count = voteMap[c.id] ?? 0
    return {
      ...c,
      vote_count: count,
      vote_percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
    }
  }).sort((a, b) => b.vote_count - a.vote_count)
}

/** Format remaining time from an exact target ISO timestamp (ends_at) */
export function getRemainingSeconds(endsAt: string | null): number {
  if (!endsAt) return 0
  const targetTime = new Date(endsAt).getTime()
  if (isNaN(targetTime)) return 0
  const now = Date.now()
  const diffMs = targetTime - now
  return Math.max(0, Math.floor(diffMs / 1000))
}

export function formatTimeMMSS(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '00:00'
  const hours = Math.floor(seconds / 3600)
  const remainingSecs = seconds % 3600
  const mins = Math.floor(remainingSecs / 60)
  const secs = remainingSecs % 60

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export type VotingTimeStatus = 'not_started' | 'active' | 'ended'

/** Get voting time status based on starts_at and ends_at */
export function getVotingTimeStatus(startsAt: string | null, endsAt: string | null): VotingTimeStatus {
  const now = Date.now()
  
  if (startsAt) {
    const startTime = new Date(startsAt).getTime()
    if (!isNaN(startTime) && now < startTime) {
      return 'not_started'
    }
  }
  
  if (endsAt) {
    const endTime = new Date(endsAt).getTime()
    if (!isNaN(endTime) && now >= endTime) {
      return 'ended'
    }
  }
  
  return 'active'
}

/** Get seconds until voting starts (if not started yet) */
export function getSecondsUntilStart(startsAt: string | null): number {
  if (!startsAt) return 0
  const startTime = new Date(startsAt).getTime()
  if (isNaN(startTime)) return 0
  const now = Date.now()
  return Math.max(0, Math.floor((startTime - now) / 1000))
}

/** Check if voting is currently allowed based on time */
export function canVoteByTime(startsAt: string | null, endsAt: string | null): boolean {
  return getVotingTimeStatus(startsAt, endsAt) === 'active'
}

/** Get display text for voting time status */
export function getVotingTimeStatusText(startsAt: string | null, endsAt: string | null): { label: string; variant: 'waiting' | 'active' | 'ended' } {
  const status = getVotingTimeStatus(startsAt, endsAt)
  
  switch (status) {
    case 'not_started': {
      const seconds = getSecondsUntilStart(startsAt)
      const hours = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      let timeStr = ''
      if (hours > 0) timeStr += `${hours}h `
      if (mins > 0 || hours > 0) timeStr += `${mins}m `
      timeStr += `${secs}s`
      return { label: `Inicia em ${timeStr}`, variant: 'waiting' }
    }
    case 'active': {
      const seconds = getRemainingSeconds(endsAt)
      return { label: `Termina em ${formatTimeMMSS(seconds)}`, variant: 'active' }
    }
    case 'ended':
      return { label: 'Encerrada', variant: 'ended' }
  }
}

export interface IPInfo {
  ip: string
  country?: string
  region?: string
  city?: string
  latitude?: number
  longitude?: number
}

export interface AuthPayload {
  sub: string
  ip: string
  country?: string
  region?: string
  city?: string
  iat: number
  exp: number
}

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

const JWT_SECRET = (import.meta as any).env?.VITE_JWT_SECRET || 'build-battle-secret-key-change-in-production'

async function importKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(JWT_SECRET)
  return crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

export async function createJWT(payload: Omit<AuthPayload, 'iat' | 'exp'>): Promise<string> {
  const key = await importKey()
  const now = Math.floor(Date.now() / 1000)
  const exp = now + 24 * 60 * 60
  
  const header = { alg: 'HS256', typ: 'JWT' }
  const fullPayload = { ...payload, iat: now, exp }
  
  const encoder = new TextEncoder()
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payloadB64 = btoa(JSON.stringify(fullPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${headerB64}.${payloadB64}`))
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  
  return `${headerB64}.${payloadB64}.${signatureB64}`
}

export async function verifyJWT(token: string): Promise<AuthPayload | null> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.')
    if (!headerB64 || !payloadB64 || !signatureB64) return null
    
    const key = await importKey()
    const encoder = new TextEncoder()
    const signature = new Uint8Array(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => c.charCodeAt(0)))
    
    const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(`${headerB64}.${payloadB64}`))
    if (!valid) return null
    
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    
    return payload as AuthPayload
  } catch {
    return null
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('bb_auth_token')
}

export function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('bb_auth_token', token)
}

export function clearStoredToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('bb_auth_token')
}
