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
  player_name?: string | null
  image_url: string
  skin_url?: string | null
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

export type VotingTimeStatus = 'not_started' | 'active' | 'ended'