import type { IPInfo, AuthPayload } from '../supabase/types'
import { getClientIP } from '../ip/detection'
import { supabase } from '../supabase/client'

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