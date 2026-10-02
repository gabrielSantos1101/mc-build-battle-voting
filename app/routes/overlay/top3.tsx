import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase, computeVoteStats } from '~/lib/supabase'
import type { Round, Competitor, Vote, CompetitorWithVotes, FrameTheme } from '~/lib/supabase'
import { PlayerHead, VoteBar } from '~/components/custom'
import { TrophyBadge } from '~/components/custom'

export const Route = createFileRoute()({
  component: OverlayTop3,
})

const FRAME_ACCENT: Record<FrameTheme, string> = {
  'warden-sculk': '#00c9a7',
  'pale-garden': '#c8c8b0',
  'wither': '#a0a0ff',
  'ender-dragon': '#9d50db',
  'jack-pumpkin': '#ff7800',
}

interface RankedEntry {
  competitor: CompetitorWithVotes
  rank: 1 | 2 | 3
}

function Top3Widget({ entries, showResults }: { entries: RankedEntry[], showResults: boolean }) {
  return (
    <div
      className="flex flex-col gap-2 p-2"
      style={{
        background: 'linear-gradient(135deg, rgba(14,13,19,0.92) 0%, rgba(10,9,18,0.88) 100%)',
        border: '2px solid rgba(255,120,0,0.4)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
        minWidth: '260px',
        maxWidth: '300px',
        fontFamily: "'Press Start 2P', monospace",
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between pb-1"
        style={{ borderBottom: '1px solid rgba(255,120,0,0.3)' }}
      >
        <span style={{ fontSize: '8px', color: '#ff7800', letterSpacing: '1px' }}>
          🎃 Top 3
        </span>
        {showResults && (
          <span style={{ fontSize: '6px', color: '#555' }}>ao vivo</span>
        )}
      </div>

      {/* Entries */}
      <AnimatePresence initial={false}>
        {entries.map(({ competitor, rank }) => {
          const accent = FRAME_ACCENT[competitor.frame_theme as FrameTheme] ?? '#ff7800'
          return (
            <motion.div
              key={competitor.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="flex items-center gap-2"
            >
              <TrophyBadge place={rank} size="sm" />
              <PlayerHead nick={competitor.player_nick} size={24} />
              <div className="flex-1 min-w-0">
                <div
                  style={{
                    fontSize: '8px',
                    color: accent,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: '2px',
                  }}
                >
                  {competitor.player_nick}
                </div>
                {showResults ? (
                  <VoteBar
                    percentage={competitor.vote_percentage}
                    count={competitor.vote_count}
                    color={accent}
                    animated
                  />
                ) : (
                  <div style={{ fontSize: '6px', color: '#444' }}>{'░'.repeat(10)}</div>
                )}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {entries.length === 0 && (
        <div style={{ fontSize: '7px', color: '#444', textAlign: 'center', padding: '8px' }}>
          Aguardando votos...
        </div>
      )}
    </div>
  )
}

function OverlayTop3() {
  const [round, setRound] = useState<Round | null>(null)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [votes, setVotes] = useState<Vote[]>([])

  useEffect(() => {
    async function init() {
      const { data: roundData } = await supabase
        .from('rounds')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!roundData) return
      setRound(roundData)

      const { data: comps } = await supabase.from('competitors').select('*').eq('round_id', roundData.id)
      setCompetitors(comps ?? [])

      const { data: voteData } = await supabase.from('votes').select('*').eq('round_id', roundData.id)
      setVotes(voteData ?? [])
    }
    init()
  }, [])

  useEffect(() => {
    if (!round) return
    const channel = supabase
      .channel(`overlay-top3-${round.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes', filter: `round_id=eq.${round.id}` }, (payload) => {
        setVotes((prev) => [...prev, payload.new as Vote])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rounds', filter: `id=eq.${round.id}` }, (payload) => {
        setRound(payload.new as Round)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competitors', filter: `round_id=eq.${round.id}` }, async () => {
        const { data } = await supabase.from('competitors').select('*').eq('round_id', round.id)
        setCompetitors(data ?? [])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [round?.id])

  const ranked = computeVoteStats(competitors, votes).slice(0, 3).map((c, i) => ({
    competitor: c,
    rank: (i + 1) as 1 | 2 | 3,
  }))

  return (
    <div style={{ background: 'transparent', padding: '8px', display: 'inline-block' }}>
      <Top3Widget entries={ranked} showResults={round?.show_live_results ?? true} />
    </div>
  )
}
