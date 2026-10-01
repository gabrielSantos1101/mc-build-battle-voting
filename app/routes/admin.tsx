import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, RefreshCw, Eye, EyeOff, Lock, ExternalLink, Image as ImageIcon, Clock } from 'lucide-react'
import { supabase, computeVoteStats, getRemainingSeconds, formatTimeMMSS } from '~/lib/supabase'
import type { Round, Competitor, Vote, FrameTheme } from '~/lib/supabase'
import { MinecraftHorrorFrame, FRAME_CONFIGS } from '~/components/MinecraftHorrorFrame'
import { MinecraftButton, PlayerHead, StatusBadge } from '~/components/ui'
import { DateTimePicker } from '~/components/DateTimePicker'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
})

const DEFAULT_PIN = import.meta.env.VITE_ADMIN_PIN || '1234'

const THEMES: { id: FrameTheme; name: string; icon: string }[] = [
  { id: 'jack-pumpkin', name: 'Jack-o-Lantern', icon: '🎃' },
  { id: 'warden-sculk', name: 'Deep Dark / Warden', icon: '💙' },
  { id: 'pale-garden', name: 'Pale Garden / Creaking', icon: '🪵' },
  { id: 'wither', name: 'Wither Boss', icon: '☠️' },
  { id: 'ender-dragon', name: 'Ender Dragon', icon: '🔮' },
]

function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  const [rounds, setRounds] = useState<Round[]>([])
  const [currentRound, setCurrentRound] = useState<Round | null>(null)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [loading, setLoading] = useState(false)

  // Form states
  const [newRoundTitle, setNewRoundTitle] = useState('')
  const [endsAtDate, setEndsAtDate] = useState<Date | undefined>(undefined)
  const [playerNick, setPlayerNick] = useState('')
  const [selectedTheme, setSelectedTheme] = useState<FrameTheme>('jack-pumpkin')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [remainingTime, setRemainingTime] = useState<number>(0)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Timer updater
  useEffect(() => {
    if (!currentRound?.ends_at) {
      setRemainingTime(0)
      return
    }
    const tick = () => setRemainingTime(getRemainingSeconds(currentRound.ends_at))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [currentRound?.ends_at])

  // Load rounds on auth
  useEffect(() => {
    if (isAuthenticated) {
      loadRounds()
    }
  }, [isAuthenticated])

  async function loadRounds() {
    setLoading(true)
    const { data } = await supabase
      .from('rounds')
      .select('*')
      .order('created_at', { ascending: false })

    if (data && data.length > 0) {
      setRounds(data)
      const active = data.find((r) => r.status === 'active') || data[0]
      selectRound(active)
    } else {
      setRounds([])
      setCurrentRound(null)
    }
    setLoading(false)
  }

  async function selectRound(round: Round) {
    setCurrentRound(round)
    await Promise.all([loadCompetitors(round.id), loadVotes(round.id)])
  }

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

  // Realtime
  useEffect(() => {
    if (!currentRound) return

    const channel = supabase
      .channel(`admin-round-${currentRound.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes', filter: `round_id=eq.${currentRound.id}` }, (payload) => {
        setVotes((prev) => [...prev, payload.new as Vote])
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'votes', filter: `round_id=eq.${currentRound.id}` }, () => {
        loadVotes(currentRound.id)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competitors', filter: `round_id=eq.${currentRound.id}` }, () => {
        loadCompetitors(currentRound.id)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rounds', filter: `id=eq.${currentRound.id}` }, (payload) => {
        setCurrentRound(payload.new as Round)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentRound?.id])

  // Login handler
  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (pinInput === DEFAULT_PIN) {
      setIsAuthenticated(true)
      setPinError(false)
    } else {
      setPinError(true)
    }
  }

  // Create round
  async function handleCreateRound(e: React.FormEvent) {
    e.preventDefault()
    if (!newRoundTitle.trim()) return

    const { data, error } = await supabase
      .from('rounds')
      .insert({
        title: newRoundTitle.trim(),
        status: 'draft',
        show_live_results: true,
        ends_at: null,
      })
      .select()
      .single()

    if (!error && data) {
      setNewRoundTitle('')
      await loadRounds()
      selectRound(data)
    }
  }

  // Change round status with exact timestamp from the date picker
  async function updateRoundStatus(status: 'draft' | 'active' | 'paused' | 'finished') {
    if (!currentRound) return

    let endsAt: string | null = currentRound.ends_at
    if (status === 'active') {
      // Usa o timestamp exato escolhido no DateTimePicker
      endsAt = endsAtDate ? endsAtDate.toISOString() : null
    } else if (status === 'finished' || status === 'draft') {
      endsAt = null
    }

    const { error } = await supabase
      .from('rounds')
      .update({ status, ends_at: endsAt })
      .eq('id', currentRound.id)

    if (!error) {
      const updated = { ...currentRound, status, ends_at: endsAt }
      setCurrentRound(updated)
      setRounds((prev) => prev.map((r) => (r.id === currentRound.id ? updated : r)))
    }
  }

  // Toggle suspense mode
  async function toggleLiveResults() {
    if (!currentRound) return
    const updated = !currentRound.show_live_results
    const { error } = await supabase
      .from('rounds')
      .update({ show_live_results: updated })
      .eq('id', currentRound.id)

    if (!error) {
      setCurrentRound({ ...currentRound, show_live_results: updated })
      setRounds((prev) => prev.map((r) => (r.id === currentRound.id ? { ...r, show_live_results: updated } : r)))
    }
  }

  // Reset votes
  async function handleResetVotes() {
    if (!currentRound) return
    if (!confirm('Tem certeza que deseja zerar todos os votos desta rodada?')) return

    await supabase.from('votes').delete().eq('round_id', currentRound.id)
    setVotes([])
  }

  // File selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  // Add competitor
  async function handleAddCompetitor(e: React.FormEvent) {
    e.preventDefault()
    if (!currentRound) return
    if (!playerNick.trim()) {
      setFormError('Digite o Nick do jogador!')
      return
    }

    setUploading(true)
    setFormError(null)

    let finalImageUrl = imageUrlInput.trim()

    if (imageFile) {
      const ext = imageFile.name.split('.').pop() || 'png'
      const fileName = `${currentRound.id}/${Date.now()}_${playerNick.trim()}.${ext}`

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('builds')
        .upload(fileName, imageFile, { upsert: true })

      if (uploadErr) {
        if (imagePreview) {
          finalImageUrl = imagePreview
        } else {
          setFormError('Erro ao subir imagem para o Storage.')
          setUploading(false)
          return
        }
      } else if (uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from('builds')
          .getPublicUrl(uploadData.path)
        finalImageUrl = publicUrlData.publicUrl
      }
    }

    if (!finalImageUrl) {
      setFormError('Selecione uma imagem ou cole uma URL!')
      setUploading(false)
      return
    }

    const { error } = await supabase.from('competitors').insert({
      round_id: currentRound.id,
      player_nick: playerNick.trim(),
      image_url: finalImageUrl,
      frame_theme: selectedTheme,
    })

    if (error) {
      setFormError('Erro ao cadastrar: ' + error.message)
    } else {
      setPlayerNick('')
      setImageFile(null)
      setImageUrlInput('')
      setImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadCompetitors(currentRound.id)
    }

    setUploading(false)
  }

  // Delete competitor
  async function handleDeleteCompetitor(id: string) {
    if (!confirm('Remover este participante da rodada?')) return
    await supabase.from('competitors').delete().eq('id', id)
    setCompetitors((prev) => prev.filter((c) => c.id !== id))
  }

  // PIN Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0912]">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm p-6 bg-[#0e0d13] border-4 border-[#ff7800] shadow-[0_0_30px_rgba(255,120,0,0.3)] text-center"
        >
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="text-sm text-[#ff7800] mb-2 font-['Press_Start_2P']">ADMIN PANEL</h1>
          <p className="text-[9px] text-[#888] mb-6 font-['Press_Start_2P']">Digite o PIN do Streamer</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="PIN"
              autoFocus
              className="w-full text-center tracking-widest text-lg py-3 px-4 bg-[#1a1825] border-2 border-[#ff780066] text-[#ff9a3c] font-['Press_Start_2P'] focus:outline-none focus:border-[#ff7800]"
            />

            {pinError && (
              <p className="text-[8px] text-[#ff4444] font-['Press_Start_2P']">PIN incorreto!</p>
            )}

            <MinecraftButton variant="pumpkin" type="submit" className="w-full">
              Entrar no Painel
            </MinecraftButton>
          </form>
        </motion.div>
      </div>
    )
  }

  const competitorsWithVotes = computeVoteStats(competitors, votes)

  return (
    <div className="min-h-screen bg-[#0a0912] text-[#e0e0e0] font-['Press_Start_2P'] p-4 md:p-6 pb-24">
      {/* Header */}
      <header className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b-2 border-[#ff780044]">
        <div>
          <h1 className="text-base md:text-lg text-[#ff7800] flex items-center gap-2">
            🎃 PAINEL DO STREAMER
          </h1>
          <p className="text-[8px] text-[#888] mt-1">Controle de Votação Minecraft Build Battle</p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-2 text-[8px]">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 bg-[#1a1825] border border-[#ff780066] px-2.5 py-1.5 text-[#ff9a3c] hover:bg-[#ff780022] transition-colors"
          >
            <ExternalLink size={12} /> Votação (/)
          </a>
          <a
            href="/overlay/top3"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 bg-[#1a1825] border border-[#00c9a766] px-2.5 py-1.5 text-[#00c9a7] hover:bg-[#00c9a722] transition-colors"
          >
            <ExternalLink size={12} /> Overlay Top 3 (OBS)
          </a>
          <a
            href="/overlay/cena"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 bg-[#1a1825] border border-[#ffd70066] px-2.5 py-1.5 text-[#ffd700] hover:bg-[#ffd70022] transition-colors"
          >
            <ExternalLink size={12} /> Cena OBS Pódio
          </a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Rounds & Round Controls */}
        <div className="space-y-6">
          {/* Create Round */}
          <div className="p-4 bg-[#0e0d13] border-2 border-[#ff780066]">
            <h2 className="text-xs text-[#ff9a3c] mb-3 flex items-center gap-2">
              <Plus size={14} /> NOVA RODADA
            </h2>
            <form onSubmit={handleCreateRound} className="space-y-3">
              <input
                type="text"
                value={newRoundTitle}
                onChange={(e) => setNewRoundTitle(e.target.value)}
                placeholder="Ex: Mansão Assombrada"
                className="w-full text-[9px] p-2.5 bg-[#1a1825] border border-[#444] text-white focus:outline-none focus:border-[#ff7800]"
              />
              <MinecraftButton variant="pumpkin" type="submit" size="sm" className="w-full">
                Criar Rodada
              </MinecraftButton>
            </form>
          </div>

          {/* Rounds List */}
          <div className="p-4 bg-[#0e0d13] border-2 border-[#333]">
            <h2 className="text-xs text-[#aaa] mb-3">RODADAS</h2>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {rounds.map((r) => (
                <button
                  key={r.id}
                  onClick={() => selectRound(r)}
                  className={`w-full text-left p-2.5 border text-[8px] flex items-center justify-between transition-colors ${
                    currentRound?.id === r.id
                      ? 'bg-[#2a1705] border-[#ff7800] text-[#ff9a3c]'
                      : 'bg-[#14121d] border-[#222] text-[#888] hover:bg-[#1a1825]'
                  }`}
                >
                  <span className="truncate pr-2">{r.title}</span>
                  <StatusBadge status={r.status} />
                </button>
              ))}
              {rounds.length === 0 && (
                <p className="text-[8px] text-[#555] text-center py-4">Nenhuma rodada criada.</p>
              )}
            </div>
          </div>

          {/* Current Round Controls */}
          {currentRound && (
            <div className="p-4 bg-[#0e0d13] border-2 border-[#ff7800]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs text-[#ff7800] truncate">{currentRound.title}</h2>
                <StatusBadge status={currentRound.status} />
              </div>

              {/* Timer Config — DateTimePicker exato */}
              <div className="mb-3 p-2.5 bg-[#14121d] border border-[#333]">
                <DateTimePicker
                  value={endsAtDate}
                  onChange={setEndsAtDate}
                  label="ENCERRAMENTO DA VOTAÇÃO:"
                  minDate={new Date()}
                />
                {currentRound.ends_at && currentRound.status === 'active' && (
                  <div className="mt-2 text-[8px] text-[#00ff88] flex items-center gap-1.5">
                    <Clock size={12} className="animate-pulse" />
                    <span>Resta: {formatTimeMMSS(remainingTime)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-[#333]">
                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <MinecraftButton
                    variant={currentRound.status === 'active' ? 'danger' : 'warden'}
                    size="sm"
                    onClick={() => updateRoundStatus(currentRound.status === 'active' ? 'paused' : 'active')}
                  >
                    {currentRound.status === 'active' ? '⏸ Pausar' : '▶ Abrir Voto'}
                  </MinecraftButton>

                  <MinecraftButton
                    variant="pale"
                    size="sm"
                    onClick={() => updateRoundStatus('finished')}
                  >
                    🏆 Encerrar
                  </MinecraftButton>
                </div>

                {/* Suspense Mode */}
                <button
                  onClick={toggleLiveResults}
                  className={`w-full text-[8px] p-2 border flex items-center justify-center gap-2 transition-colors ${
                    currentRound.show_live_results
                      ? 'bg-[#1a2e1d] border-[#00c9a7] text-[#00c9a7]'
                      : 'bg-[#2e1a25] border-[#9d50db] text-[#9d50db]'
                  }`}
                >
                  {currentRound.show_live_results ? (
                    <>
                      <Eye size={12} /> Placar Ao Vivo: VISÍVEL
                    </>
                  ) : (
                    <>
                      <EyeOff size={12} /> Modo Suspense: ATIVADO
                    </>
                  )}
                </button>

                {/* Reset Votes */}
                <button
                  onClick={handleResetVotes}
                  className="w-full text-[8px] p-2 bg-[#200] border border-[#600] text-[#f66] hover:bg-[#300] flex items-center justify-center gap-1 mt-2"
                >
                  <RefreshCw size={12} /> Zerar Votos ({votes.length})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (2 cols): Add Competitor & Competitor List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Competitor Form */}
          {currentRound ? (
            <div className="p-4 bg-[#0e0d13] border-2 border-[#ff780066]">
              <h2 className="text-xs text-[#ff9a3c] mb-4 flex items-center gap-2">
                ⚔ ADICIONAR CONSTRUÇÃO / COMPETIDOR
              </h2>

              <form onSubmit={handleAddCompetitor} className="space-y-4">
                {/* Nick & Skin Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[8px] text-[#aaa] block mb-1.5">NICK NO MINECRAFT:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={playerNick}
                        onChange={(e) => setPlayerNick(e.target.value)}
                        placeholder="Ex: Dark_Shadow11"
                        className="w-full text-[9px] p-2 bg-[#1a1825] border border-[#444] text-white focus:outline-none focus:border-[#ff7800]"
                      />
                    </div>
                  </div>

                  {/* Skin Preview Box */}
                  <div className="flex items-center gap-3 bg-[#14121d] p-2 border border-[#333]">
                    {playerNick.trim() ? (
                      <>
                        <PlayerHead nick={playerNick.trim()} size={36} />
                        <div>
                          <div className="text-[9px] text-[#ff9a3c]">{playerNick.trim()}</div>
                          <div className="text-[7px] text-[#00c9a7]">Skin detectada ✓</div>
                        </div>
                      </>
                    ) : (
                      <div className="text-[7px] text-[#666]">Digite o nick para ver a skin</div>
                    )}
                  </div>
                </div>

                {/* Theme Selector with Preview */}
                <div>
                  <label className="text-[8px] text-[#aaa] block mb-2">MOLDURA TEMÁTICA:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {THEMES.map((theme) => (
                      <button
                        type="button"
                        key={theme.id}
                        onClick={() => setSelectedTheme(theme.id)}
                        className={`p-2 border text-center transition-all ${
                          selectedTheme === theme.id
                            ? 'bg-[#2a1705] border-[#ff7800] text-[#ff9a3c] shadow-[0_0_10px_rgba(255,120,0,0.4)]'
                            : 'bg-[#14121d] border-[#333] text-[#777] hover:border-[#555]'
                        }`}
                      >
                        <div className="text-base mb-1">{theme.icon}</div>
                        <div className="text-[7px] leading-tight">{theme.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="text-[8px] text-[#aaa] block mb-1.5">SCREENSHOT DA CONSTRUÇÃO:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="text-[8px] text-[#888] file:mr-2 file:py-1.5 file:px-3 file:border-0 file:text-[8px] file:font-['Press_Start_2P'] file:bg-[#ff7800] file:text-black cursor-pointer"
                      />
                      <div className="text-[7px] text-[#555] mt-1">Ou cole uma URL direta:</div>
                      <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => {
                          setImageUrlInput(e.target.value)
                          setImagePreview(e.target.value)
                        }}
                        placeholder="https://..."
                        className="w-full text-[8px] p-1.5 mt-1 bg-[#1a1825] border border-[#444] text-white focus:outline-none focus:border-[#ff7800]"
                      />
                    </div>

                    {/* Image Preview */}
                    <div className="aspect-video bg-[#050508] border border-[#333] flex items-center justify-center overflow-hidden">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-[7px] text-[#444] flex flex-col items-center gap-1">
                          <ImageIcon size={18} />
                          <span>Preview da Foto</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {formError && (
                  <p className="text-[8px] text-[#ff4444] bg-[#200] p-2 border border-[#600]">{formError}</p>
                )}

                <MinecraftButton
                  variant="pumpkin"
                  type="submit"
                  isLoading={uploading}
                  className="w-full"
                >
                  ⚔ Adicionar à Batalha
                </MinecraftButton>
              </form>
            </div>
          ) : (
            <div className="p-8 bg-[#0e0d13] border-2 border-[#333] text-center text-[9px] text-[#666]">
              Crie ou selecione uma rodada ao lado para gerenciar os competidores.
            </div>
          )}

          {/* Competitors List */}
          {currentRound && (
            <div className="p-4 bg-[#0e0d13] border-2 border-[#333]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs text-[#aaa]">
                  COMPETIDORES NA RODADA ({competitors.length})
                </h2>
                <span className="text-[8px] text-[#ff7800]">Total: {votes.length} votos</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {competitorsWithVotes.map((c, i) => (
                  <div
                    key={c.id}
                    className="p-3 bg-[#14121d] border-2 border-[#2a2a3a] flex flex-col justify-between gap-3 relative group"
                  >
                    {/* Top Row: Place, Skin, Nick, Delete */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-[#ff7800]">#{i + 1}</span>
                        <PlayerHead nick={c.player_nick} size={24} />
                        <div>
                          <div className="text-[9px] text-[#ff9a3c]">{c.player_nick}</div>
                          <div className="text-[7px] text-[#666]">{c.frame_theme}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteCompetitor(c.id)}
                        className="text-[#f55] hover:text-[#f22] p-1 transition-colors"
                        title="Remover competidor"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Image Thumbnail */}
                    <div className="aspect-video overflow-hidden border border-[#333]">
                      <img src={c.image_url} alt={c.player_nick} className="w-full h-full object-cover" />
                    </div>

                    {/* Vote stats */}
                    <div className="flex justify-between items-center text-[8px] border-t border-[#222] pt-2">
                      <span className="text-[#888]">{c.vote_count} votos</span>
                      <span className="text-[#00c9a7]">{c.vote_percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {competitors.length === 0 && (
                <p className="text-[8px] text-[#555] text-center py-6">
                  Nenhum competidor cadastrado nesta rodada ainda.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
