import { createFileRoute } from '@tanstack/react-router'
import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Clock } from 'lucide-react'
import {
  supabase,
  getDeviceId,
  hasVotedInRound,
  markVotedInRound,
  computeVoteStats,
  getRemainingSeconds,
  formatTimeMMSS,
} from '~/lib/supabase'
import type { Round, Competitor, Vote, CompetitorWithVotes, FrameTheme } from '~/lib/supabase'
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
  const deviceId = useRef(getDeviceId())

  // Sincronização do Timer em Tempo Real com o Relógio do Sistema
  useEffect(() => {
    if (!round?.ends_at) {
      setRemainingSeconds(0)
      return
    }

    function updateTimer() {
      const remaining = getRemainingSeconds(round?.ends_at ?? null)
      setRemainingSeconds(remaining)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [round?.ends_at])

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
    if (!round || hasVoted) return
    setError(null)

    const { error: voteErr } = await supabase.from('votes').insert({
      round_id: round.id,
      competitor_id: competitorId,
      device_id: deviceId.current,
    })

    if (voteErr) {
      if (voteErr.code === '23505') {
        setHasVoted(true)
        markVotedInRound(round.id)
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
          {/* HEADER MODULAR DE MADEIRA COM TIMER DINÂMICO BASEADO EM TIMESTAMP */}
          <header
            className="w-full relative z-20 shadow-2xl border-b-4 border-[#180c04]"
            style={{
              backgroundImage: 'url(/textures/wood-header-pattern.svg)',
              backgroundRepeat: 'repeat',
              backgroundSize: '64px 64px',
            }}
          >
            {/* Faixa decorativa de pedra no topo */}
            <div
              className="w-full h-2"
              style={{
                backgroundImage: 'url(/textures/stone-border-h.svg)',
                backgroundRepeat: 'repeat-x',
                backgroundSize: '64px 8px',
              }}
            />

            <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
              {/* Placa de Madeira Chanfrada (Título) */}
              <div
                className="px-5 py-2.5 rounded border-4 shadow-2xl flex-1 min-w-[280px]"
                style={{
                  background: 'linear-gradient(180deg, #4d280e 0%, #2e1605 100%)',
                  borderColor: '#7a4218 #1f0d03 #1f0d03 #7a4218',
                  boxShadow: 'inset 2px 2px 0 #9c5825, inset -2px -2px 0 #120701, 0 6px 16px rgba(0,0,0,0.8)',
                }}
              >
                <h1
                  className="text-xs sm:text-sm md:text-base text-[#ffaa00] tracking-wider"
                  style={{
                    textShadow: '2px 2px 0 #000, 4px 4px 0 #2b1303',
                  }}
                >
                  BUILD BATTLE: HALLOWEEN EDITION
                </h1>
                {round && (
                  <div className="text-[7px] text-[#ff9a3c] mt-1 opacity-90 truncate max-w-sm">
                    {round.title}
                  </div>
                )}
              </div>

              {/* Caixa Entalhada com o Timer Dinâmico / Status da Votação */}
              <div
                className="px-4 py-2.5 rounded border-4 flex items-center gap-3 shadow-2xl"
                style={{
                  background: '#0d0a14',
                  borderColor: '#3c200e #180b03 #180b03 #3c200e',
                  boxShadow: 'inset 2px 2px 0 #24140a, 0 4px 12px rgba(0,0,0,0.8)',
                }}
              >
                <Clock size={16} className="text-[#ff9a3c] animate-pulse" />
                <div>
                  <div className="text-[7px] text-[#888] mb-0.5">
                    {round?.ends_at ? 'VOTING ENDS IN:' : 'STATUS:'}
                  </div>
                  <div className="text-[11px] text-[#ffaa00] tracking-wider">
                    {round?.ends_at && round.status === 'active' ? (
                      <span className={remainingSeconds <= 30 ? 'text-[#ff4444] animate-ping' : 'text-[#ffcc00]'}>
                        {formatTimeMMSS(remainingSeconds)}
                      </span>
                    ) : round?.status === 'active' ? (
                      <span className="text-[#00ff88]">VOTAÇÃO ABERTA</span>
                    ) : (
                      <span className="text-[#ff9a3c] uppercase">{round?.status || 'FECHADA'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Borda chanfrada inferior do Header */}
            <div
              className="w-full h-3"
              style={{
                backgroundImage: 'url(/textures/stone-border-h.svg)',
                backgroundRepeat: 'repeat-x',
                backgroundSize: '64px 12px',
              }}
            />
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
        className="w-full mt-12 border-t-4 border-[#180c04] relative z-20"
        style={{
          backgroundImage: 'url(/textures/wood-header-pattern.svg)',
          backgroundRepeat: 'repeat',
          backgroundSize: '64px 64px',
        }}
      >
        <div
          className="w-full h-2"
          style={{
            backgroundImage: 'url(/textures/stone-border-h.svg)',
            backgroundRepeat: 'repeat-x',
            backgroundSize: '64px 8px',
          }}
        />

        <div className="max-w-5xl mx-auto px-4 py-6 text-center">
          <div className="text-[9px] text-[#ff9a3c] mb-2">
            🎃 MINECRAFT BUILD BATTLE • LIVE STREAM VOTING
          </div>
          <div className="text-[7px] text-[#888] flex items-center justify-center gap-4 flex-wrap">
            <span>Anti-fraude: 1 voto por dispositivo</span>
            <span>•</span>
            <a
              href="/admin"
              className="text-[#ffcc00] hover:underline"
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
