import { createFileRoute } from '@tanstack/react-router'
import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, ZoomIn, Clock } from 'lucide-react'
import { supabase, getDeviceId, hasVotedInRound, markVotedInRound, computeVoteStats } from '~/lib/supabase'
import type { Round, Competitor, Vote, CompetitorWithVotes, FrameTheme } from '~/lib/supabase'
import { MinecraftHorrorFrame, FRAME_CONFIGS } from '~/components/MinecraftHorrorFrame'
import { PlayerHead, VoteBar } from '~/components/ui'

export const Route = createFileRoute('/')({
  component: VotingPage,
})

// Card do Competidor dentro do Frame Temático
interface CompetitorCardProps {
  competitor: CompetitorWithVotes
  roundId: string
  hasVoted: boolean
  votedFor: string | null
  showResults: boolean
  onVote: (competitorId: string) => void
  onZoom: (competitor: CompetitorWithVotes) => void
}

function CompetitorCard({
  competitor,
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
      className="w-full max-w-[300px] mx-auto"
    >
      <MinecraftHorrorFrame
        theme={competitor.frame_theme as FrameTheme}
        selected={isMyVote}
      >
        {/* CONTEÚDO DO CARD: Totalmente protegido e contido no container */}
        <div className="flex flex-col gap-3">
          {/* 1. Screenshot da Construção com Borda e Botão de Zoom */}
          <div className="relative w-full aspect-[16/10] rounded overflow-hidden border-2 border-black/90 bg-black/80 shadow-md group shrink-0">
            <img
              src={competitor.image_url}
              alt={`${competitor.player_nick}'s build`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Botão de Zoom */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onZoom(competitor)
              }}
              className="absolute top-1.5 right-1.5 p-1 bg-black/80 text-white rounded border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
              title="Ver em tela cheia"
            >
              <ZoomIn size={12} />
            </button>

            {isMyVote && (
              <div className="absolute top-1.5 left-1.5 bg-[#00ff88] text-black px-1.5 py-0.5 text-[6px] font-bold tracking-wider rounded border border-black shadow">
                ✓ SEU VOTO
              </div>
            )}
          </div>

          {/* 2. Informações do Jogador (Skin + Nick) */}
          <div className="flex items-center gap-2 px-1 py-1 bg-black/40 border border-white/10 rounded">
            <div className="border border-black/80 bg-black/60 p-0.5 rounded shadow shrink-0">
              <PlayerHead nick={competitor.player_nick} size={24} />
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
            {showResults && (
              <div className="text-[7px] text-[#ff9a3c] font-['Press_Start_2P'] shrink-0">
                {competitor.vote_count}v
              </div>
            )}
          </div>

          {/* 3. Placar se ativo */}
          {showResults && (
            <div className="px-0.5">
              <VoteBar
                percentage={competitor.vote_percentage}
                count={competitor.vote_count}
                color={frameConfig.borderColor}
              />
            </div>
          )}

          {/* 4. Botão VOTAR Minecraft 3D Clássico */}
          <div className="w-full">
            {hasVoted ? (
              <div
                className="w-full py-2.5 text-center text-[8px] font-['Press_Start_2P'] rounded border-2 shadow-inner"
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
                className="w-full py-2.5 px-3 rounded font-['Press_Start_2P'] text-[10px] tracking-wider uppercase text-white cursor-pointer active:translate-y-0.5 transition-all shadow-[0_3px_0_#803300,0_0_12px_rgba(255,120,0,0.4)]"
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
  const deviceId = useRef(getDeviceId())

  useEffect(() => {
    async function loadActiveRound() {
      setLoading(true)
      const { data } = await supabase
        .from('rounds')
        .select('*')
        .in('status', ['active', 'paused', 'finished'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setRound(data)
        setHasVoted(hasVotedInRound(data.id))
        await Promise.all([loadCompetitors(data.id), loadVotes(data.id)])
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
          {/* HEADER COM A TEXTURA REAL DO MOCKUP DE MINECRAFT */}
          <header className="w-full relative z-20 shadow-2xl">
            <div className="max-w-5xl mx-auto px-2 pt-4 pb-2">
              <div className="relative w-full rounded overflow-hidden shadow-2xl border-4 border-[#2b1604]">
                <img
                  src="/textures/concept-header.png"
                  alt="Build Battle: Halloween Edition"
                  className="w-full h-auto object-cover select-none pointer-events-none"
                  style={{ imageRendering: 'pixelated' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>

              {round && (
                <div className="text-center mt-2 text-[8px] text-[#ff9a3c] drop-shadow">
                  {round.title} • {round.status === 'active' ? `${votes.length} votos computados` : 'Votação Pausada'}
                </div>
              )}
            </div>
          </header>

          {/* CONTEÚDO PRINCIPAL COM SCROLL LIVRE */}
          <main className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full">
            {!round || round.status === 'draft' ? (
              <WaitingScreen status={round?.status || 'draft'} />
            ) : round.status !== 'active' && !hasVoted ? (
              <WaitingScreen status={round.status} />
            ) : (
              <div>
                {/* Mensagem de Erro se houver */}
                {error && (
                  <div className="mb-6 p-3 bg-[#300] border-2 border-[#f00] text-[8px] text-[#ff6666] text-center max-w-md mx-auto rounded shadow">
                    {error}
                  </div>
                )}

                {/* Subtítulo Estilizado */}
                <div className="text-center mb-10 bg-black/60 py-3 px-4 border-2 border-[#1c1828] max-w-xl mx-auto rounded shadow-lg backdrop-blur-sm">
                  <h2 className="text-xs sm:text-sm text-[#ff9a3c] mb-1">
                    {hasVoted ? 'SEU VOTO FOI REGISTRADO!' : 'ESCOLHA SUA CONSTRUÇÃO FAVORITA'}
                  </h2>
                  <p className="text-[8px] text-[#888] leading-relaxed">
                    {hasVoted
                      ? 'Aguarde o encerramento da rodada para ver o pódio final.'
                      : 'Clique em VOTAR abaixo da sua construção favorita.'}
                  </p>
                </div>

                {/* Grid dos Cards com as Molduras Projetadas para Fora */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 justify-center mt-4">
                  {competitorsWithVotes.map((competitor) => (
                    <CompetitorCard
                      key={competitor.id}
                      competitor={competitor}
                      roundId={round.id}
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
