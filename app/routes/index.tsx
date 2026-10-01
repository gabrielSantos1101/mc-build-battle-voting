import { createFileRoute } from '@tanstack/react-router'
import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Clock, AlertCircle } from 'lucide-react'
import {
  supabase,
  getDeviceId,
  hasVotedInRound,
  markVotedInRound,
  computeVoteStats,
  getRemainingSeconds,
  formatTimeMMSS,
  initializeAuth,
  canVote,
  getAuthPayload,
  getVotingTimeStatus,
  getVotingTimeStatusText,
  canVoteByTime,
  getSecondsUntilStart,
} from '~/lib/supabase'
import type { Round, Competitor, Vote, CompetitorWithVotes, FrameTheme, IPInfo, VotingTimeStatus } from '~/lib/supabase'
import { MinecraftHorrorFrame, FRAME_CONFIGS } from '~/components/MinecraftHorrorFrame'
import { PlayerHead, VoteBar } from '~/components/ui'

export const Route = createFileRoute('/')({
  component: VotingPage,
})

interface CompetitorCardProps {
  competitor: CompetitorWithVotes
  roundId: string
  roundStatus: string
  hasVoted: boolean
  votedFor: string | null
  showResults: boolean
  onVote: (competitorId: string) => void
  onZoom: (competitor: CompetitorWithVotes) => void
}

function CompetitorCard({
  competitor,
  roundStatus,
  hasVoted,
  votedFor,
  showResults,
  onVote,
  onZoom,
}: CompetitorCardProps) {
  const isMyVote = votedFor === competitor.id
  const frameConfig = FRAME_CONFIGS[competitor.frame_theme as FrameTheme] || FRAME_CONFIGS['jack-pumpkin']

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-[500px] mx-auto"
    >
      <MinecraftHorrorFrame
        theme={competitor.frame_theme as FrameTheme}
        selected={isMyVote}
      >
        {/* Janela Central Segura */}
        <div className="w-full h-full flex flex-col justify-between py-1">
          {/* 1. Screenshot da Construção — clique para zoom */}
          <div
            className="relative w-full aspect-[4/3] rounded-sm overflow-hidden border-2 border-black/95 bg-black/90 shadow-md group shrink-0 cursor-zoom-in"
            onClick={(e) => {
              e.stopPropagation()
              onZoom(competitor)
            }}
          >
            <img
              src={competitor.image_url}
              alt={`${competitor.player_nick}'s build`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {isMyVote && (
              <div className="absolute top-1 left-1 bg-[#00ff88] text-black px-1.5 py-0.5 text-[6px] font-bold tracking-wider rounded border border-black shadow">
                ✓ SEU VOTO
              </div>
            )}
          </div>

          {/* 2. Nick e Skin do Jogador */}
          <div className="flex items-center gap-2 px-1 my-0.5">
            <div className="border border-black/80 bg-black/60 p-0.5 rounded shadow shrink-0">
              <PlayerHead nick={competitor.player_nick} size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-[9px] text-white truncate drop-shadow"
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  textShadow: '1px 1px 0 #000, 2px 2px 0 #000',
                }}
              >
                {competitor.player_nick}
              </div>
            </div>
            {showResults && roundStatus !== 'draft' && (
              <div className="text-[7px] text-[#ff9a3c] font-['Press_Start_2P'] shrink-0">
                {competitor.vote_count}v
              </div>
            )}
          </div>

          {/* Placar se ativo */}
          {showResults && roundStatus !== 'draft' && (
            <div className="mb-0.5 px-0.5">
              <VoteBar
                percentage={competitor.vote_percentage}
                count={competitor.vote_count}
                color={frameConfig.borderColor}
              />
            </div>
          )}

          {/* 3. Botão de Votação ou Status (Centralizado e Fit-Content) */}
          <div className="w-full mt-auto flex justify-center py-0.5">
            {roundStatus === 'draft' ? (
              <div
                className="w-fit py-1.5 px-4 text-center text-[7px] font-['Press_Start_2P'] rounded border-2 select-none shadow-inner"
                style={{
                  background: '#151320',
                  borderColor: '#3c2b18',
                  color: '#ff9a3c',
                }}
              >
                ⏳ AGUARDE LIBERAÇÃO
              </div>
            ) : roundStatus === 'paused' ? (
              <div
                className="w-fit py-1.5 px-4 text-center text-[7px] font-['Press_Start_2P'] rounded border-2 select-none shadow-inner"
                style={{
                  background: '#241418',
                  borderColor: '#552222',
                  color: '#ff6666',
                }}
              >
                ⏸ VOTAÇÃO PAUSADA
              </div>
            ) : roundStatus === 'finished' ? (
              <div
                className="w-fit py-1.5 px-4 text-center text-[7px] font-['Press_Start_2P'] rounded border-2 select-none shadow-inner"
                style={{
                  background: isMyVote ? '#1a3320' : '#141418',
                  borderColor: isMyVote ? '#00ff88' : '#333333',
                  color: isMyVote ? '#00ff88' : '#777777',
                }}
              >
                {isMyVote ? '✓ SEU VOTO' : '🏆 ENCERRADO'}
              </div>
            ) : hasVoted ? (
              <div
                className="w-fit py-1.5 px-4 text-center text-[7px] font-['Press_Start_2P'] rounded border-2 shadow-inner"
                style={{
                  background: isMyVote ? '#1a3320' : '#141418',
                  borderColor: isMyVote ? '#00ff88' : '#2a2a2a',
                  color: isMyVote ? '#00ff88' : '#555',
                }}
              >
                {isMyVote ? '✓ VOTADO' : 'COMPUTADO'}
              </div>
            ) : (
              <button
                onClick={() => onVote(competitor.id)}
                className="w-fit min-w-[140px] py-2 px-6 rounded font-['Press_Start_2P'] text-[10px] tracking-wider uppercase text-white cursor-pointer active:translate-y-0.5 transition-all shadow-[0_3px_0_#803300,0_0_12px_rgba(255,120,0,0.4)]"
                style={{
                  background: 'linear-gradient(180deg, #ff9a3c 0%, #d85a00 100%)',
                  border: '2px solid #ffcc66',
                  textShadow: '1px 1px 0 #4a1d00, 2px 2px 0 #000',
                }}
              >
                VOTAR
              </button>
            )}
          </div>
        </div>
      </MinecraftHorrorFrame>
    </motion.div>
  )
}

// Modal de Zoom
function ZoomModal({
  competitor,
  onClose,
}: {
  competitor: CompetitorWithVotes | null
  onClose: () => void
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!competitor) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full bg-[#0e0d13] border-4 border-[#ff7800] p-2 shadow-[0_0_50px_rgba(255,120,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-2 mb-2 bg-[#1a1825] border-b-2 border-[#ff780044]">
          <div className="flex items-center gap-2">
            <PlayerHead nick={competitor.player_nick} size={24} />
            <span className="text-xs text-[#ff9a3c] font-['Press_Start_2P']">
              {competitor.player_nick}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-[#ff4444] transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-hidden flex items-center justify-center bg-black">
          <img
            src={competitor.image_url}
            alt={`${competitor.player_nick}'s build`}
            className="max-h-[75vh] w-auto object-contain"
          />
        </div>
      </div>
    </div>
  )
}

// Tela de Espera
function WaitingScreen({ status }: { status: string }) {
  const configs: Record<string, { icon: string; title: string; desc: string }> = {
    draft: {
      icon: '🎃',
      title: 'AGUARDANDO O STREAMER',
      desc: 'A votação será aberta em instantes na live!',
    },
    paused: {
      icon: '⏸',
      title: 'VOTAÇÃO PAUSADA',
      desc: 'O streamer pausou a votação temporariamente.',
    },
    finished: {
      icon: '🏆',
      title: 'VOTAÇÃO ENCERRADA',
      desc: 'Confira os vencedores no pódio da live!',
    },
  }

  const current = configs[status] || configs['draft']

  return (
    <div className="text-center py-24 px-4">
      <div className="text-6xl mb-4 animate-bounce">{current.icon}</div>
      <h2 className="text-sm md:text-base text-[#ff7800] font-['Press_Start_2P'] mb-3">
        {current.title}
      </h2>
      <p className="text-[9px] text-[#888] font-['Press_Start_2P'] max-w-md mx-auto leading-relaxed">
        {current.desc}
      </p>
    </div>
  )
}

function VotingPage() {
  const [round, setRound] = useState<Round | null>(null)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [loading, setLoading] = useState(true)
  const [hasVoted, setHasVoted] = useState(false)
  const [votedForId, setVotedForId] = useState<string | null>(null)
  const [zoomedCompetitor, setZoomedCompetitor] = useState<CompetitorWithVotes | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)
  const [votingTimeStatus, setVotingTimeStatus] = useState<VotingTimeStatus>('ended')
  const [ipInfo, setIpInfo] = useState<IPInfo | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const deviceId = useRef(getDeviceId())

  // Timer sincronizado com timestamps do servidor (starts_at / ends_at)
  useEffect(() => {
    if (!round) {
      setVotingTimeStatus('ended')
      setRemainingSeconds(0)
      return
    }

    function syncTimer() {
      const status = getVotingTimeStatus(round.starts_at, round.ends_at)
      setVotingTimeStatus(status)

      if (status === 'not_started') {
        setRemainingSeconds(getSecondsUntilStart(round.starts_at))
      } else if (status === 'active') {
        setRemainingSeconds(getRemainingSeconds(round.ends_at))
      } else {
        setRemainingSeconds(0)
      }
    }

    syncTimer()
    const interval = setInterval(syncTimer, 1000)

    window.addEventListener('focus', syncTimer)
    document.addEventListener('visibilitychange', syncTimer)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', syncTimer)
      document.removeEventListener('visibilitychange', syncTimer)
    }
  }, [round?.starts_at, round?.ends_at])

  // Initialize auth (JWT + IP) on mount
  useEffect(() => {
    async function initAuth() {
      try {
        const auth = await initializeAuth()
        setIpInfo(auth.ipInfo)
        setAuthReady(true)
      } catch {
        setAuthReady(true)
      }
    }
    initAuth()
  }, [])

  useEffect(() => {
    async function loadActiveRound() {
      setLoading(true)
      // Prioriza rodada ativa ou busca a rodada mais recente (inclusive em draft para modo apresentação)
      const { data: activeRound } = await supabase
        .from('rounds')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      let targetRound = activeRound

      if (!targetRound) {
        const { data: latestRound } = await supabase
          .from('rounds')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        targetRound = latestRound
      }

      if (targetRound) {
        setRound(targetRound)
        setHasVoted(hasVotedInRound(targetRound.id))
        await Promise.all([loadCompetitors(targetRound.id), loadVotes(targetRound.id)])
      } else {
        setRound(null)
      }
      setLoading(false)
    }

    loadActiveRound()
  }, [])

  async function loadCompetitors(roundId: string) {
    const { data } = await supabase
      .from('competitors')
      .select('*')
      .eq('round_id', roundId)
      .order('created_at', { ascending: true })

    setCompetitors(data || [])
  }

  async function loadVotes(roundId: string) {
    const { data } = await supabase
      .from('votes')
      .select('*')
      .eq('round_id', roundId)

    setVotes(data || [])
  }

  // Realtime Subscriptions
  useEffect(() => {
    if (!round) return

    const channel = supabase
      .channel(`public-voting-${round.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes', filter: `round_id=eq.${round.id}` }, (payload) => {
        setVotes((prev) => [...prev, payload.new as Vote])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rounds', filter: `id=eq.${round.id}` }, (payload) => {
        setRound(payload.new as Round)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competitors', filter: `round_id=eq.${round.id}` }, () => {
        loadCompetitors(round.id)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [round?.id])

  async function handleVote(competitorId: string) {
    if (!round || hasVoted || !authReady) return
    setError(null)

    const { canVote: allowed, reason } = await canVote(round.id)
    if (!allowed) {
      if (reason === 'device') {
        setHasVoted(true)
        markVotedInRound(round.id)
        setError('Você já votou nesta rodada neste dispositivo.')
      } else if (reason === 'ip') {
        setHasVoted(true)
        markVotedInRound(round.id)
        setError('Este IP já votou nesta rodada.')
      }
      return
    }

    const { error: voteErr } = await supabase.from('votes').insert({
      round_id: round.id,
      competitor_id: competitorId,
      device_id: deviceId.current,
      ip: ipInfo?.ip || 'unknown',
      country: ipInfo?.country,
      region: ipInfo?.region,
      city: ipInfo?.city,
    })

    if (voteErr) {
      if (voteErr.code === '23505') {
        setHasVoted(true)
        markVotedInRound(round.id)
        setError(voteErr.message?.includes('ip') ? 'Este IP já votou nesta rodada.' : 'Você já votou nesta rodada.')
      } else {
        setError('Erro ao enviar voto. Tente novamente.')
      }
    } else {
      markVotedInRound(round.id)
      setHasVoted(true)
      setVotedForId(competitorId)
    }
  }

  const competitorsWithVotes = computeVoteStats(competitors, votes)

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center font-['Press_Start_2P'] text-xs text-[#ff7800]"
        style={{
          backgroundImage: 'url(/textures/deepslate-pattern.svg)',
          backgroundRepeat: 'repeat',
        }}
      >
        <div className="animate-pulse flex items-center gap-2 bg-black/80 px-6 py-4 border-2 border-[#ff7800] rounded">
          <span>🎃</span> CARREGANDO ARENA...
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen text-white font-['Press_Start_2P'] flex flex-col justify-between"
      style={{
        backgroundImage: 'url(/textures/deepslate-pattern.svg)',
        backgroundRepeat: 'repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Container Principal com as Bordas Laterais Replicáveis (Pilares) */}
      <div className="flex-1 flex w-full relative">
        {/* Pilar Esquerdo Replicável */}
        <div
          className="hidden md:block w-8 shrink-0 select-none pointer-events-none"
          style={{
            backgroundImage: 'url(/textures/side-pillar-pattern.svg)',
            backgroundRepeat: 'repeat-y',
            backgroundSize: '32px 64px',
            borderRight: '2px solid #000',
          }}
        />

        {/* Centro do Site (Header, Cards e Conteúdo) */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* HEADER COM A VIGA DE MADEIRA E PÍLULA INTEGRADA CONFORME MOCKUP */}
          <header
            className="w-full relative z-20 shadow-2xl border-t-2 border-[#7a3f1a] border-b-4 border-[#120702]"
            style={{
              backgroundImage: 'url(/textures/wood-header-pattern.svg)',
              backgroundRepeat: 'repeat',
              backgroundSize: '64px 64px',
              boxShadow: 'inset 0 2px 0 #8f4d22, inset 0 -2px 0 #241005, 0 8px 24px rgba(0,0,0,0.9)',
            }}
          >
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
              {/* Título com Relevo Voxel 3D e Brilho Dourado */}
              <div className="flex items-center gap-3">
                <h1
                  className="text-xs sm:text-sm md:text-base lg:text-lg tracking-wider select-none font-bold"
                  style={{
                    color: '#ffaa00',
                    textShadow: '0 3px 0 #3d1400, 0 4px 0 #120500, 0 0 16px rgba(255,140,0,0.5), 2px 2px 0 #000',
                  }}
                >
                  BUILD BATTLE: HALLOWEEN EDITION
                </h1>
                {round?.title && (
                  <span className="hidden xl:inline-block text-[8px] text-[#ff9a3c] opacity-80 border-l border-[#ff9a3c44] pl-3">
                    {round.title}
                  </span>
                )}
              </div>

{/* Pílula Entalhada Integrada na Madeira (Timer / Status) */}
              <div
                className="px-4 py-1.5 rounded-full flex items-center gap-2 border select-none shrink-0"
                style={{
                  background: '#190d05',
                  borderColor: '#381c0b',
                  boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.85), inset -1px -1px 0 #522710',
                }}
              >
                {votingTimeStatus === 'not_started' ? (
                  <span className="text-[9px] sm:text-[10px] text-[#ff9a3c] font-bold tracking-wider" style={{ textShadow: '0 0 8px rgba(255,154,60,0.6), 1px 1px 0 #000' }}>
                    ⏳ AGUARDANDO INÍCIO
                  </span>
                ) : votingTimeStatus === 'active' ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] sm:text-[9px] text-[#dcd7cb] tracking-wider" style={{ textShadow: '1px 1px 0 #000' }}>
                      VOTAÇÃO TERMINA EM:
                    </span>
                    <span
                      className={`text-[10px] sm:text-[11px] font-bold tracking-wider ${
                        remainingSeconds <= 30 ? 'text-[#ff3333] animate-pulse' : 'text-[#ffaa00]'}
                      `}
                      style={{ textShadow: '0 0 8px rgba(255,170,0,0.7), 1px 1px 0 #000' }}
                    >
                      {formatTimeMMSS(remainingSeconds)}
                    </span>
                  </div>
                ) : votingTimeStatus === 'ended' ? (
                  <span className="text-[9px] sm:text-[10px] text-[#ffaa00] font-bold tracking-wider" style={{ textShadow: '0 0 8px rgba(255,170,0,0.6), 1px 1px 0 #000' }}>
                    🏆 VOTAÇÃO ENCERRADA
                  </span>
                ) : round?.status === 'paused' ? (
                  <span className="text-[9px] sm:text-[10px] text-[#ff5555] font-bold tracking-wider" style={{ textShadow: '0 0 8px rgba(255,85,85,0.6), 1px 1px 0 #000' }}>
                    ⏸ VOTAÇÃO PAUSADA
                  </span>
                ) : round?.status === 'finished' ? (
                  <span className="text-[9px] sm:text-[10px] text-[#ffaa00] font-bold tracking-wider" style={{ textShadow: '0 0 8px rgba(255,170,0,0.6), 1px 1px 0 #000' }}>
                    🏆 VOTAÇÃO ENCERRADA
                  </span>
                ) : round?.status === 'draft' ? (
                  <span className="text-[9px] sm:text-[10px] text-[#ff9a3c] font-bold tracking-wider" style={{ textShadow: '0 0 8px rgba(255,154,60,0.6), 1px 1px 0 #000' }}>
                    ⏳ AGUARDANDO ABERTURA
                  </span>
                ) : (
                  <span className="text-[9px] sm:text-[10px] text-[#00ff88] font-bold tracking-wider" style={{ textShadow: '0 0 8px rgba(0,255,136,0.6), 1px 1px 0 #000' }}>
                    ● VOTAÇÃO ABERTA
                  </span>
                )}
              </div>
            </div>
          </header>

          {/* CONTEÚDO PRINCIPAL COM SCROLL LIVRE */}
          <main className="max-w-[1400px] mx-auto px-4 py-6 flex-1 w-full">
            {!round ? (
              <WaitingScreen status="draft" />
            ) : (
              <div>
                {/* Mensagem de Erro se houver */}
                {error && (
                  <div className="mb-6 p-3 bg-[#300] border-2 border-[#f00] text-[8px] text-[#ff6666] text-center max-w-md mx-auto rounded shadow">
                    {error}
                  </div>
                )}

                {/* Subtítulo Estilizado com Status Contextual */}
                <div className="text-center mb-8 bg-black/60 py-2.5 px-4 border-2 border-[#1c1828] max-w-xl mx-auto rounded shadow-lg backdrop-blur-sm">
                  <h2 className="text-xs sm:text-sm text-[#ff9a3c] mb-1">
                    {round.status === 'draft'
                      ? '👁️ MODO APRESENTAÇÃO'
                      : round.status === 'paused'
                      ? '⏸ VOTAÇÃO PAUSADA'
                      : round.status === 'finished'
                      ? '🏆 VOTAÇÃO ENCERRADA'
                      : hasVoted
                      ? 'SEU VOTO FOI REGISTRADO!'
                      : 'ESCOLHA SUA CONSTRUÇÃO FAVORITA'}
                  </h2>
                  <p className="text-[8px] text-[#888] leading-relaxed">
                    {round.status === 'draft'
                      ? 'Conheça as construções dos participantes! A votação será aberta em breve na live.'
                      : round.status === 'paused'
                      ? 'O streamer pausou a votação temporariamente.'
                      : round.status === 'finished'
                      ? 'Votação finalizada. Confira o pódio na live!'
                      : hasVoted
                      ? 'Aguarde o encerramento da rodada para ver o pódio final.'
                      : 'Clique em VOTAR abaixo da sua construção favorita.'}
                  </p>
                </div>

                {/* Grid dos Cards com as Molduras Ilustradas */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 justify-center">
                  {competitorsWithVotes.map((competitor) => (
                    <CompetitorCard
                      key={competitor.id}
                      competitor={competitor}
                      roundId={round.id}
                      roundStatus={round.status}
                      hasVoted={hasVoted}
                      votedFor={votedForId}
                      showResults={round.show_live_results}
                      onVote={handleVote}
                      onZoom={setZoomedCompetitor}
                    />
                  ))}
                </div>

                {competitors.length === 0 && (
                  <div className="text-center py-16 text-[9px] text-[#666]">
                    Nenhuma construção cadastrada nesta rodada ainda.
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        {/* Pilar Direito Replicável */}
        <div
          className="hidden md:block w-8 shrink-0 select-none pointer-events-none"
          style={{
            backgroundImage: 'url(/textures/side-pillar-pattern.svg)',
            backgroundRepeat: 'repeat-y',
            backgroundSize: '32px 64px',
            borderLeft: '2px solid #000',
          }}
        />
      </div>

      {/* FOOTER NÃO FIXO (ACOMPANHA O SCROLL NO FIM DA PÁGINA) */}
      <footer
        className="w-full mt-12 relative z-20 border-t-2 border-[#7a3f1a]"
        style={{
          backgroundImage: 'url(/textures/wood-header-pattern.svg)',
          backgroundRepeat: 'repeat',
          backgroundSize: '64px 64px',
          boxShadow: 'inset 0 2px 0 #8f4d22, 0 -6px 20px rgba(0,0,0,0.8)',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 py-5 text-center">
          <div className="text-[9px] text-[#ffaa00] mb-2 tracking-wider" style={{ textShadow: '1px 1px 0 #000' }}>
            🎃 MINECRAFT BUILD BATTLE • LIVE STREAM VOTING
          </div>
          <div className="text-[7px] text-[#aaa] flex items-center justify-center gap-4 flex-wrap">
            <span>Anti-fraude: 1 voto por dispositivo</span>
            {ipInfo && (
              <>
                <span>•</span>
                <span className="text-[#00c9a7]">{ipInfo.ip}</span>
              </>
            )}
            <span>•</span>
            <a
              href="/admin"
              className="text-[#ff9a3c] hover:text-[#ffcc00] hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Painel do Streamer (Admin)
            </a>
          </div>
        </div>
      </footer>

      {/* Modal de Zoom */}
      <ZoomModal
        competitor={zoomedCompetitor}
        onClose={() => setZoomedCompetitor(null)}
      />
    </div>
  )
}
