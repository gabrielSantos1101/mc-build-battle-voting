import { computeVoteStats, getMinecraftAvatarUrl } from '~/lib/supabase'
import type { Competitor, FrameTheme, Round, RoundStatus, Vote } from '~/lib/supabase/types'

export const EMPTY_LABEL = '—'
export const AVATAR_SIZE = 64

export interface ReportCompetitorRow {
  position: number
  competitor_id: string
  player_nick: string
  player_name: string
  image_url: string
  avatar_url: string
  skin_url: string | null
  frame_theme: FrameTheme
  vote_count: number
  vote_percentage: number
  first_vote_at: string | null
  last_vote_at: string | null
}

export interface ReportGeoRow {
  city: string
  region: string
  country: string
  count: number
  percentage: number
}

export interface ReportCountryRow {
  country: string
  count: number
  percentage: number
}

export interface ReportVoteDetail {
  created_at: string
  player_nick: string
  player_name: string
  country: string
  region: string
  city: string
  device_id: string
  ip: string
}

export interface VoteReport {
  round_id: string
  round_title: string
  round_status: RoundStatus
  round_starts_at: string | null
  round_ends_at: string | null
  generated_at: string
  total_votes: number
  total_competitors: number
  unique_devices: number
  unique_ips: number
  first_vote_at: string | null
  last_vote_at: string | null
  ranking: ReportCompetitorRow[]
  geo: ReportGeoRow[]
  countries: ReportCountryRow[]
  details: ReportVoteDetail[]
}

export const ROUND_STATUS_LABELS: Record<RoundStatus, string> = {
  draft: 'Rascunho',
  active: 'Votação aberta',
  paused: 'Pausada',
  finished: 'Encerrada',
}

export const FRAME_THEME_LABELS: Record<FrameTheme, string> = {
  'jack-pumpkin': 'Jack-o-Lantern',
  'warden-sculk': 'Deep Dark / Warden',
  'pale-garden': 'Pale Garden / Creaking',
  wither: 'Wither Boss',
  'ender-dragon': 'Ender Dragon',
}

function clean(value?: string | null): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : ''
}

function earliest(values: (string | null | undefined)[]): string | null {
  const dates = values
    .filter((v): v is string => Boolean(v))
    .map((v) => new Date(v).getTime())
    .filter((t) => !Number.isNaN(t))

  if (dates.length === 0) return null
  return new Date(Math.min(...dates)).toISOString()
}

function latest(values: (string | null | undefined)[]): string | null {
  const dates = values
    .filter((v): v is string => Boolean(v))
    .map((v) => new Date(v).getTime())
    .filter((t) => !Number.isNaN(t))

  if (dates.length === 0) return null
  return new Date(Math.max(...dates)).toISOString()
}

function percentageOf(value: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((value / total) * 10000) / 100
}

export function maskIp(ip?: string | null): string {
  const value = clean(ip)
  if (!value) return EMPTY_LABEL

  if (value.includes(':')) {
    const groups = value.split(':')
    if (groups.length <= 2) return value
    return `${groups.slice(0, 2).join(':')}:…`
  }

  const octets = value.split('.')
  if (octets.length !== 4) return value
  return `${octets[0]}.${octets[1]}.***.***`
}

export function shortenDeviceId(deviceId?: string | null): string {
  const value = clean(deviceId)
  if (!value) return EMPTY_LABEL
  return value.length > 12 ? `${value.slice(0, 12)}…` : value
}

export function formatGeoLabel(geo: Pick<ReportGeoRow, 'city' | 'region' | 'country'>): string {
  const city = clean(geo.city)
  const region = clean(geo.region)
  const country = clean(geo.country)

  const locality = [city, region].filter(Boolean).join('/')
  return [locality, country].filter(Boolean).join(' • ') || EMPTY_LABEL
}

export function formatDateTimeBr(iso?: string | null): string {
  if (!iso) return EMPTY_LABEL
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return EMPTY_LABEL
  return date.toLocaleString('pt-BR')
}

export function buildVoteReport(round: Round, competitors: Competitor[], votes: Vote[]): VoteReport {
  const stats = computeVoteStats(competitors, votes)
  const totalVotes = votes.length

  const votesByCompetitor = new Map<string, Vote[]>()
  for (const vote of votes) {
    const list = votesByCompetitor.get(vote.competitor_id)
    if (list) list.push(vote)
    else votesByCompetitor.set(vote.competitor_id, [vote])
  }

  const ranking: ReportCompetitorRow[] = stats.map((c, index) => {
    const competitorVotes = votesByCompetitor.get(c.id) ?? []
    const times = competitorVotes.map((v) => v.created_at)

    return {
      position: index + 1,
      competitor_id: c.id,
      player_nick: c.player_nick,
      player_name: clean(c.player_name),
      image_url: c.image_url,
      avatar_url: getMinecraftAvatarUrl(c.player_nick, AVATAR_SIZE),
      skin_url: c.skin_url ?? null,
      frame_theme: c.frame_theme,
      vote_count: c.vote_count,
      vote_percentage: c.vote_percentage,
      first_vote_at: earliest(times),
      last_vote_at: latest(times),
    }
  })

  const geoMap = new Map<string, ReportGeoRow>()
  const countryMap = new Map<string, number>()

  for (const vote of votes) {
    const city = clean(vote.city)
    const region = clean(vote.region)
    const country = clean(vote.country)
    const geoKey = `${city}|${region}|${country}`

    const existing = geoMap.get(geoKey)
    if (existing) existing.count += 1
    else geoMap.set(geoKey, { city, region, country, count: 1, percentage: 0 })

    const countryKey = country || EMPTY_LABEL
    countryMap.set(countryKey, (countryMap.get(countryKey) ?? 0) + 1)
  }

  const geo = [...geoMap.values()]
    .sort((a, b) => b.count - a.count || formatGeoLabel(a).localeCompare(formatGeoLabel(b), 'pt-BR'))
    .map((row) => ({ ...row, percentage: percentageOf(row.count, totalVotes) }))

  const countries: ReportCountryRow[] = [...countryMap.entries()]
    .map(([country, count]) => ({ country, count, percentage: percentageOf(count, totalVotes) }))
    .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country, 'pt-BR'))

  const nickById = new Map(competitors.map((c) => [c.id, c]))
  const details: ReportVoteDetail[] = [...votes]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((vote) => {
      const competitor = nickById.get(vote.competitor_id)
      return {
        created_at: vote.created_at,
        player_nick: competitor?.player_nick ?? EMPTY_LABEL,
        player_name: clean(competitor?.player_name),
        country: clean(vote.country),
        region: clean(vote.region),
        city: clean(vote.city),
        device_id: shortenDeviceId(vote.device_id),
        ip: maskIp(vote.ip),
      }
    })

  return {
    round_id: round.id,
    round_title: round.title,
    round_status: round.status,
    round_starts_at: round.starts_at,
    round_ends_at: round.ends_at,
    generated_at: new Date().toISOString(),
    total_votes: totalVotes,
    total_competitors: competitors.length,
    unique_devices: new Set(votes.map((v) => v.device_id)).size,
    unique_ips: new Set(votes.map((v) => v.ip)).size,
    first_vote_at: earliest(votes.map((v) => v.created_at)),
    last_vote_at: latest(votes.map((v) => v.created_at)),
    ranking,
    geo,
    countries,
    details,
  }
}

export function buildReportFileName(report: VoteReport, extension: string): string {
  const slug = report.round_title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)

  const stamp = new Date(report.generated_at)
  const pad = (n: number) => n.toString().padStart(2, '0')
  const datePart = `${stamp.getFullYear()}-${pad(stamp.getMonth() + 1)}-${pad(stamp.getDate())}_${pad(stamp.getHours())}${pad(stamp.getMinutes())}`

  return `votacao-${slug || 'rodada'}-${datePart}.${extension}`
}
