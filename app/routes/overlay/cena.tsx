import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { PlayerHead } from '~/components/custom'
import { PlayerSkin3D } from '~/components/PlayerSkin3D'
import type { Competitor, CompetitorWithVotes, FrameTheme, Round, Vote } from '~/lib/supabase/types'
import { computeVoteStats, loadRoundWithCompetitors, supabase } from '~/lib'

export const Route = createFileRoute('/overlay/cena')({
  component: OverlayCena,
})

const FRAME_ACCENT: Record<FrameTheme, string> = {
  'warden-sculk': '#00c9a7',
  'pale-garden': '#c8c8b0',
  'wither': '#a0a0ff',
  'ender-dragon': '#9d50db',
  'jack-pumpkin': '#ff7800',
}

function Particle({ delay }: { delay: number }) {
  const x = Math.random() * 100
  return (
    <motion.div
      className="absolute bottom-0 rounded-full"
      style={{
        left: `${x}%`,
        width: 4,
        height: 4,
        background: Math.random() > 0.5 ? '#ff7800' : '#00c9a7',
      }}
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: -200, opacity: 0 }}
      transition={{ duration: 2, delay, repeat: Infinity, ease: 'easeOut' }}
    />
  )
}

function PodiumCard({
  competitor,
  rank,
  revealed,
}: {
  competitor: CompetitorWithVotes
  rank: 1 | 2 | 3
  revealed: boolean
}) {
  const accent = FRAME_ACCENT[competitor.frame_theme as FrameTheme] ?? '#ff7800'
  const heights = { 1: 'h-72', 2: 'h-56', 3: 'h-44' }
  const scales = { 1: 'scale-110', 2: 'scale-100', 3: 'scale-95' }
  const [skinUrl, setSkinUrl] = useState<string | null>(competitor.skin_url ?? null)

  useEffect(() => {
    if (!competitor.skin_url) {
      const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-skin`
      if (EDGE_FUNCTION_URL) {
        fetch(EDGE_FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nick: competitor.player_nick })
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data?.skinUrl) {
              setSkinUrl(data.skinUrl)
              supabase.from('competitors').update({ skin_url: data.skinUrl }).eq('id', competitor.id)
            }
          })
      }
    }
  }, [competitor.id, competitor.player_nick])

  return (
    <motion.div
      initial={{ opacity: 0, y: 80, scale: 0.7 }}
      animate={revealed ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 80, scale: 0.7 }}
      transition={{ type: 'spring', damping: 16, stiffness: 180, delay: rank === 3 ? 0 : rank === 2 ? 0.35 : 0.7 }}
      className={`flex flex-col items-center ${scales[rank]}`}
    >

      {/* Build image */}
      <div
        className="w-48 relative overflow-hidden mb-2"
        style={{
          border: `3px solid ${accent}`,
          boxShadow: `0 0 20px ${accent}60, 0 0 40px ${accent}20`,
          aspectRatio: '16/9',
        }}
      >
        <img
          src={competitor.image_url}
          alt={`${competitor.player_nick}'s build`}
          className="w-full h-full object-cover"
        />
        {rank === 1 && (
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.1) 0%, transparent 70%)' }}
          />
        )}
      </div>

      {/* 3D Skin - Fixed container to prevent layout shift */}
      <div
        className="mb-4"
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: 220,
          height: 220,
          flexShrink: 0
        }}
      >
        {skinUrl ? (
          <PlayerSkin3D skinUrl={skinUrl} size={220} />
        ) : (
          <div
            style={{
              width: 220,
              height: 220,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: `2px solid ${accent}44`,
              borderRadius: '8px',
              color: '#666',
              fontSize: '10px',
              fontFamily: 'monospace'
            }}
          >
            Loading...
          </div>
        )}
      </div>

      {/* Player info */}
      <div
        className="flex items-center gap-1 px-3 py-1"
        style={{
          background: '#0e0d1399',
          border: `2px solid ${accent}66`,
        }}
      >
        <PlayerHead nick={competitor.player_nick} size={16} />
        <span style={{ fontFamily: "'Press Start 2P'", fontSize: '8px', color: accent }}>
          {competitor.player_nick}
        </span>
      </div>

      {/* Vote count */}
      <div style={{ fontFamily: "'Press Start 2P'", fontSize: '7px', color: '#555', marginTop: '4px' }}>
        {competitor.vote_count} votos ({competitor.vote_percentage}%)
      </div>

      {/* Podium base */}
      <div
        className={`w-40 mt-2 ${heights[rank]} flex items-end justify-center pb-2`}
        style={{
          background: rank === 1
            ? 'linear-gradient(180deg, #2a2000, #1a1400)'
            : rank === 2
              ? 'linear-gradient(180deg, #1a1a20, #0e0e18)'
              : 'linear-gradient(180deg, #1a0a00, #100800)',
          border: `2px solid ${accent}44`,
          borderBottom: 'none',
        }}
      >
        <span
          style={{
            fontFamily: "'Press Start 2P'",
            fontSize: rank === 1 ? '32px' : '24px',
            color: accent,
            opacity: 0.3,
          }}
        >
          {rank}°
        </span>
      </div>
    </motion.div>
  )
}

function OverlayCena() {
  const [round, setRound] = useState<Round | null>(null)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    async function init() {
      const data = await loadRoundWithCompetitors()
      if (!data) return
      setRound(data.round)
      setCompetitors(data.competitors)
      setVotes(data.votes)
    }

    init()
  }, [])

  useEffect(() => {
    if (round && competitors.length > 0) {
      const timer = setTimeout(() => setRevealed(true), 300)
      return () => clearTimeout(timer)
    }
  }, [round, competitors.length])

  const ranked = computeVoteStats(competitors, votes)
  const top3: Array<{ competitor: CompetitorWithVotes; rank: 1 | 2 | 3 }> = [
    ...(ranked[2] ? [{ competitor: ranked[2], rank: 3 as const }] : []),
    ...(ranked[0] ? [{ competitor: ranked[0], rank: 1 as const }] : []),
    ...(ranked[1] ? [{ competitor: ranked[1], rank: 2 as const }] : []),
  ]

  const rest = computeVoteStats(competitors, votes).slice(3)

  return (
    <div
      className="w-full h-screen overflow-hidden flex flex-col items-center justify-center relative"
      style={{
        background: 'linear-gradient(180deg, #060510 0%, #0e0d13 50%, #100a1a 100%)',
        fontFamily: "'Press Start 2P', monospace",
      }}
    >
      {/* Particle effects */}
      {Array.from({ length: 12 }).map((_, i) => (
        <Particle key={i} delay={i * 0.3} />
      ))}

      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 80%, rgba(255,120,0,0.05) 0%, transparent 60%)',
        }}
      />

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-20 relative z-10"
      >
        <div
          style={{
            fontSize: '22px',
            color: '#ff7800',
            textShadow: '0 0 30px #ff780080',
            letterSpacing: '2px',
            marginBottom: '4px',
          }}
        >
          🎃 Halloween Build Battle
        </div>
        {round && (
          <div style={{ fontSize: '10px', color: '#555' }}>{round.title}</div>
        )}
      </motion.div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-6 relative z-10 mb-6">
        {top3.map(({ competitor, rank }) => (
          <PodiumCard
            key={competitor.id}
            competitor={competitor}
            rank={rank}
            revealed={revealed}
          />
        ))}
        {top3.length === 0 && (
          <div style={{ fontSize: '10px', color: '#444' }}>Aguardando resultados...</div>
        )}
      </div>

      {/* Rest of the ranking (4th+) - Vertical list below podium */}
      {revealed && rest.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="flex flex-col gap-2 relative z-10 w-full max-w-md"
          style={{ marginTop: '60px', padding: '0 16px' }}
        >
          <div style={{
            fontSize: '8px',
            color: '#ff7800',
            letterSpacing: '1px',
            marginBottom: '8px',
            fontFamily: "'Press Start 2P', monospace",
            textAlign: 'center'
          }}>
            📋 CLASSIFICAÇÃO COMPLETA
          </div>

          {rest.map((competitor, i) => (
            <motion.div
              key={competitor.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.6 + i * 0.1, type: 'spring', damping: 20, stiffness: 300 }}
              className="flex items-center gap-3 p-2"
              style={{
                background: 'linear-gradient(90deg, rgba(255,120,0,0.08) 0%, rgba(14,13,19,0.9) 100%)',
                border: '1px solid #ff780022',
                borderRadius: '8px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
              }}
            >
              <span style={{
                fontSize: '8px',
                color: '#ff7800',
                fontFamily: "'Press Start 2P', monospace",
                minWidth: '28px',
                textAlign: 'right',
              }}>
                {i + 4}°
              </span>
              <PlayerHead nick={competitor.player_nick} size={20} />
              <span style={{
                fontSize: '8px',
                color: '#ccc',
                fontFamily: "'Press Start 2P', monospace",
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {competitor.player_nick}
              </span>
              <span style={{
                fontSize: '7px',
                color: '#ff7800',
                fontFamily: "'Press Start 2P', monospace",
                fontWeight: 'bold',
              }}>
                {competitor.vote_count} votos
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
