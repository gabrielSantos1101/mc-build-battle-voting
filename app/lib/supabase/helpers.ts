import { Competitor, CompetitorWithVotes, Vote } from './types'

export function getMinecraftAvatarUrl(nick: string, size = 48): string {
  if (!nick) return 'https://mc-heads.net/avatar/MHF_Steve/48'
  return `https://mc-heads.net/avatar/${encodeURIComponent(nick)}/${size}`
}

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

export function getSecondsUntilStart(startsAt: string | null): number {
  if (!startsAt) return 0
  const startTime = new Date(startsAt).getTime()
  if (isNaN(startTime)) return 0
  const now = Date.now()
  return Math.max(0, Math.floor((startTime - now) / 1000))
}

export function canVoteByTime(startsAt: string | null, endsAt: string | null): boolean {
  return getVotingTimeStatus(startsAt, endsAt) === 'active'
}

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