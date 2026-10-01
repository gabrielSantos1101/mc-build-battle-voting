import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://exemplo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.exemplo'

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
  ends_at: string | null // Timestamp exato de término baseado na hora real
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
  created_at: string
}

// Derived: Competitor with vote count
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
  const target = new Date(endsAt).getTime()
  const now = Date.now()
  const diffMs = target - now
  return Math.max(0, Math.floor(diffMs / 1000))
}

export function formatTimeMMSS(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
