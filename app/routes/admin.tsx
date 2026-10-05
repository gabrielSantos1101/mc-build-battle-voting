import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Clock, ExternalLink, Eye, EyeOff, Image as ImageIcon, Lock, LogOut, Pencil, Plus, RefreshCw, Trash2, UserRound, X } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { DateTimePicker } from '~/components/DateTimePicker'
import { ExportMenu, MinecraftButton, PlayerHead, StatusBadge } from '~/components/custom'
import type { Competitor, FrameTheme, Round, Vote } from '~/lib/supabase/types'
import { computeVoteStats, formatTimeMMSS, getRemainingSeconds, supabase } from '~/lib'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
})

const ADMIN_EMAIL = 'admin@email.com'
const DEFAULT_PASSWORD = 'GiodLgQjH7w'

const EDGE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL?.replace('.supabase.co', '.supabase.co/functions/v1/get-skin')

async function fetchSkinUrl(nick: string): Promise<string | null> {
  try {
    if (!EDGE_FUNCTION_URL) return null
    
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick })
    })
    
    if (!res.ok) return null
    const data = await res.json()
    return data.skinUrl ?? null
  } catch {
    return null
  }
}

const THEMES: { id: FrameTheme; name: string; icon: string }[] = [
  { id: 'jack-pumpkin', name: 'Jack-o-Lantern', icon: '🎃' },
  { id: 'warden-sculk', name: 'Deep Dark / Warden', icon: '💙' },
  { id: 'pale-garden', name: 'Pale Garden / Creaking', icon: '🪵' },
  { id: 'wither', name: 'Wither Boss', icon: '☠️' },
  { id: 'ender-dragon', name: 'Ender Dragon', icon: '🔮' },
]

function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [rounds, setRounds] = useState<Round[]>([])
  const [currentRound, setCurrentRound] = useState<Round | null>(null)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [loading, setLoading] = useState(false)

  // Form states (Add competitor)
  const [newRoundTitle, setNewRoundTitle] = useState('')
  const [startsAtDate, setStartsAtDate] = useState<Date | undefined>(undefined)
  const [playerNick, setPlayerNick] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [selectedTheme, setSelectedTheme] = useState<FrameTheme>('jack-pumpkin')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [remainingTime, setRemainingTime] = useState<number>(0)

  // Form states (Edit competitor)
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null)
  const [editNick, setEditNick] = useState('')
  const [editName, setEditName] = useState('')
  const [editTheme, setEditTheme] = useState<FrameTheme>('jack-pumpkin')
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [editImageUrlInput, setEditImageUrlInput] = useState('')
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [editUploading, setEditUploading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsAuthenticated(true)
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(!!session)
        if (!session) {
          setPassword('')
        }
      })

      return () => subscription.unsubscribe()
    }
    checkAuth()
  }, [])

  useEffect(() => {
    if (!currentRound?.ends_at || currentRound.status !== 'active') {
      setRemainingTime(0)
      return
    }
    const syncTime = () => setRemainingTime(getRemainingSeconds(currentRound.ends_at))
    syncTime()
    const interval = setInterval(syncTime, 1000)

    window.addEventListener('focus', syncTime)
    document.addEventListener('visibilitychange', syncTime)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', syncTime)
      document.removeEventListener('visibilitychange', syncTime)
    }
  }, [currentRound?.ends_at, currentRound?.status])

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
    if (round.starts_at) {
      setStartsAtDate(new Date(round.starts_at))
    } else {
      setStartsAtDate(undefined)
    }
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
        const updatedRound = payload.new as Round
        setCurrentRound(updatedRound)
        if (updatedRound.starts_at) {
          setStartsAtDate(new Date(updatedRound.starts_at))
        } else {
          setStartsAtDate(undefined)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentRound?.id])

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password
      })
      if (error) throw error
      setIsAuthenticated(true)
    } catch (err: any) {
      setAuthError(err.message || 'Erro na autenticação')
    }
    setAuthLoading(false)
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      setAuthError('Senhas não conferem')
      return
    }
    if (newPassword.length < 6) {
      setAuthError('Senha deve ter pelo menos 6 caracteres')
      return
    }

    setAuthLoading(true)
    setAuthError(null)

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setShowChangePassword(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao alterar senha')
    }
    setAuthLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setIsAuthenticated(false)
    setShowChangePassword(false)
    setNewPassword('')
    setConfirmPassword('')
  }

  async function handleCreateRound(e: React.FormEvent) {
    e.preventDefault()
    if (!newRoundTitle.trim()) return

    const { data, error } = await supabase
      .from('rounds')
      .insert({
        title: newRoundTitle.trim(),
        status: 'draft',
        show_live_results: true,
        starts_at: startsAtDate?.toISOString() ?? null,
        ends_at: null,
      })
      .select()
      .single()

    if (!error && data) {
      setNewRoundTitle('')
      setStartsAtDate(undefined)
      await loadRounds()
      selectRound(data)
    }
  }

  async function updateRoundStatus(status: 'draft' | 'active' | 'paused' | 'finished') {
    if (!currentRound) return

    const updatePayload: Record<string, any> = { status }

    if (status === 'active') {
      if (startsAtDate) {
        updatePayload.starts_at = startsAtDate.toISOString()
      } else {
        updatePayload.starts_at = new Date().toISOString()
      }
    } else if (status === 'finished') {
      updatePayload.ends_at = new Date().toISOString()
    } else if (status === 'draft') {
      updatePayload.starts_at = null
      updatePayload.ends_at = null
    }

    const { error } = await supabase
      .from('rounds')
      .update(updatePayload)
      .eq('id', currentRound.id)

    if (error) {
      const { error: fallbackErr } = await supabase
        .from('rounds')
        .update({ status })
        .eq('id', currentRound.id)

      if (!fallbackErr) {
        const updated = { ...currentRound, status }
        setCurrentRound(updated)
        setRounds((prev) => prev.map((r) => (r.id === currentRound.id ? updated : r)))
        return
      }

      alert('Erro ao atualizar status: ' + (error.message || 'Verifique sua conexão com o banco.'))
      return
    }

    const updated = { ...currentRound, ...updatePayload }
    setCurrentRound(updated)
    setRounds((prev) => prev.map((r) => (r.id === currentRound.id ? updated : r)))
    if (status === 'draft') {
      setStartsAtDate(undefined)
    }
  }

  async function handleStartsAtChange(date: Date | undefined) {
    setStartsAtDate(date)
    if (!currentRound || !date) return
    if (currentRound.status === 'active' || currentRound.status === 'finished') return

    const { error } = await supabase
      .from('rounds')
      .update({ starts_at: date.toISOString() })
      .eq('id', currentRound.id)

    if (!error) {
      setCurrentRound({ ...currentRound, starts_at: date.toISOString() })
      setRounds((prev) => prev.map((r) => (r.id === currentRound.id ? { ...r, starts_at: date.toISOString() } : r)))
    }
  }

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

  async function handleResetVotes() {
    if (!currentRound) return
    if (!confirm('Tem certeza que deseja zerar todos os votos desta rodada?')) return

    await supabase.from('votes').delete().eq('round_id', currentRound.id)
    setVotes([])
  }

  async function handlePopulateSkinUrls() {
    if (!currentRound) return
    if (!confirm('Buscar e salvar skins dos competidores que não têm skin_url?')) return

    const { data: competitors } = await supabase
      .from('competitors')
      .select('id, player_nick')
      .eq('round_id', currentRound.id)
      .is('skin_url', null)

    if (!competitors || competitors.length === 0) {
      alert('Todos os competidores já têm skin_url!')
      return
    }

    let success = 0
    for (const c of competitors) {
      const skinUrl = await fetchSkinUrl(c.player_nick)
      if (skinUrl) {
        const { error } = await supabase
          .from('competitors')
          .update({ skin_url: skinUrl })
          .eq('id', c.id)
        if (!error) success++
      }
      await new Promise(r => setTimeout(r, 200))
    }

    alert(`Skins atualizadas: ${success}/${competitors.length}`)
    await loadCompetitors(currentRound.id)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

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

    const skinUrl = await fetchSkinUrl(playerNick.trim())
    
    const { error } = await supabase.from('competitors').insert({
      round_id: currentRound.id,
      player_nick: playerNick.trim(),
      player_name: playerName.trim() || null,
      image_url: finalImageUrl,
      skin_url: skinUrl,
      frame_theme: selectedTheme,
    })

    if (error) {
      setFormError('Erro ao cadastrar: ' + error.message)
    } else {
      setPlayerNick('')
      setPlayerName('')
      setImageFile(null)
      setImageUrlInput('')
      setImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadCompetitors(currentRound.id)
    }

    setUploading(false)
  }

  async function handleDeleteCompetitor(id: string) {
    if (!confirm('Remover este participante da rodada?')) return
    await supabase.from('competitors').delete().eq('id', id)
    setCompetitors((prev) => prev.filter((c) => c.id !== id))
    if (editingCompetitor?.id === id) {
      setEditingCompetitor(null)
    }
  }

  function handleStartEdit(c: Competitor) {
    setEditingCompetitor(c)
    setEditNick(c.player_nick)
    setEditName(c.player_name ?? '')
    setEditTheme(c.frame_theme as FrameTheme)
    setEditImageUrlInput(c.image_url)
    setEditImagePreview(c.image_url)
    setEditImageFile(null)
    setEditError(null)
    if (editFileInputRef.current) editFileInputRef.current.value = ''
  }

  function handleCancelEdit() {
    setEditingCompetitor(null)
    setEditNick('')
    setEditName('')
    setEditImageFile(null)
    setEditImageUrlInput('')
    setEditImagePreview(null)
    setEditError(null)
  }

  function handleEditFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setEditImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setEditImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingCompetitor || !currentRound) return
    if (!editNick.trim()) {
      setEditError('O Nick não pode ficar vazio!')
      return
    }

    setEditUploading(true)
    setEditError(null)

    let finalImageUrl = editImageUrlInput.trim()

    if (editImageFile) {
      const ext = editImageFile.name.split('.').pop() || 'png'
      const fileName = `${currentRound.id}/${Date.now()}_${editNick.trim()}.${ext}`

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('builds')
        .upload(fileName, editImageFile, { upsert: true })

      if (uploadErr) {
        if (editImagePreview) {
          finalImageUrl = editImagePreview
        } else {
          setEditError('Erro ao subir nova imagem: ' + uploadErr.message)
          setEditUploading(false)
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
      setEditError('A imagem não pode ficar vazia!')
      setEditUploading(false)
      return
    }

    let skinUrl = editingCompetitor.skin_url
    if (editNick.trim() !== editingCompetitor.player_nick) {
      skinUrl = await fetchSkinUrl(editNick.trim())
    }
    
    const { error: updateErr } = await supabase
      .from('competitors')
      .update({
        player_nick: editNick.trim(),
        player_name: editName.trim() || null,
        frame_theme: editTheme,
        image_url: finalImageUrl,
        skin_url: skinUrl,
      })
      .eq('id', editingCompetitor.id)

    if (updateErr) {
      setEditError('Erro ao atualizar: ' + updateErr.message)
    } else {
      await loadCompetitors(currentRound.id)
      handleCancelEdit()
    }

    setEditUploading(false)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0912]">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm p-6 bg-[#0e0d13] border-4 border-[#ff7800] shadow-[0_0_30px_rgba(255,120,0,0.3)] text-center"
        >
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-sm text-pumpkin mb-2 font-['Press_Start_2P']">ADMIN PANEL</h1>
          <p className="text-[9px] text-[#888] mb-6 font-['Press_Start_2P']">
            Usuário: <span className="text-pumpkin-light">{ADMIN_EMAIL}</span>
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="text-left space-y-2">
              <label className="text-[8px] text-[#aaa] block mb-1.5 flex items-center gap-1">
                <Lock size={12} /> Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha do admin"
                autoComplete="current-password"
                autoFocus
                className="w-full text-[9px] py-3 px-4 bg-obsidian-light border-2 border-[#ff780066] text-pumpkin-light font-['Press_Start_2P'] focus:outline-none focus:border-pumpkin"
              />
            </div>

            {authError && (
              <p className="text-[8px] text-[#ff4444] font-['Press_Start_2P']">{authError}</p>
            )}

            <MinecraftButton variant="pumpkin" type="submit" className="w-full" isLoading={authLoading}>
              Entrar no Painel
            </MinecraftButton>
          </form>
        </motion.div>
      </div >
    )
  }

  const competitorsWithVotes = computeVoteStats(competitors, votes)

  return (
    <div className="min-h-screen bg-[#0a0912] text-[#e0e0e0] font-['Press_Start_2P'] p-4 md:p-6 pb-24">
      {/* Header */}
      <header className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b-2 border-[#ff780044]">
        <div>
          <h1 className="text-base md:text-lg text-pumpkin flex items-center gap-2">
            🎃 PAINEL DO STREAMER
          </h1>
          <p className="text-[8px] text-[#888] mt-1">Controle de Votação Minecraft Build Battle</p>
        </div>

        {/* Quick Links + Logout */}
        <div className="flex flex-wrap gap-2 text-[8px]">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 bg-obsidian-light border border-[#ff780066] px-2.5 py-1.5 text-pumpkin-light hover:bg-[#ff780022] transition-colors"
          >
            <ExternalLink size={12} /> Votação (/)
          </a>
          <a
            href="/overlay/top3"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 bg-obsidian-light border border-[#00c9a766] px-2.5 py-1.5 text-warden-teal hover:bg-[#00c9a722] transition-colors"
          >
            <ExternalLink size={12} /> Overlay Top 3 (OBS)
          </a>
          <a
            href="/overlay/cena"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 bg-obsidian-light border border-[#ffd70066] px-2.5 py-1.5 text-[#ffd700] hover:bg-[#ffd70022] transition-colors"
          >
            <ExternalLink size={12} /> Cena OBS Pódio
          </a>
          <ExportMenu round={currentRound} competitors={competitors} votes={votes} />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 bg-[#2a1010] border border-[#ff444466] px-2.5 py-1.5 text-[#ff6666] hover:bg-[#3a1010] transition-colors"
          >
            <LogOut size={12} /> Sair
          </button>
          <button
            onClick={() => setShowChangePassword(true)}
            className="flex items-center gap-1 bg-[#1a2a10] border border-[#00c9a766] px-2.5 py-1.5 text-warden-teal hover:bg-[#1a3a10] transition-colors"
          >
            <Lock size={12} /> Alterar Senha
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Rounds & Round Controls */}
        <div className="space-y-6">
          {/* Create Round */}
          <div className="p-4 bg-obsidian border-2 border-[#ff780066]">
            <h2 className="text-xs text-pumpkin-light mb-3 flex items-center gap-2">
              <Plus size={14} /> NOVA RODADA
            </h2>
            <form onSubmit={handleCreateRound} className="space-y-3">
              <input
                type="text"
                value={newRoundTitle}
                onChange={(e) => setNewRoundTitle(e.target.value)}
                placeholder="Ex: Mansão Assombrada"
                className="w-full text-[9px] p-2.5 bg-obsidian-light border border-[#444] text-white focus:outline-none focus:border-pumpkin"
              />
              <MinecraftButton variant="pumpkin" type="submit" size="sm" className="w-full">
                Criar Rodada
              </MinecraftButton>
            </form>
          </div>

          {/* Rounds List */}
          <div className="p-4 bg-obsidian border-2 border-[#333]">
            <h2 className="text-xs text-[#aaa] mb-3">RODADAS</h2>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {rounds.map((r) => (
                <button
                  key={r.id}
                  onClick={() => selectRound(r)}
                  className={`w-full text-left p-2.5 border text-[8px] flex items-center justify-between transition-colors ${currentRound?.id === r.id
                    ? 'bg-[#2a1705] border-pumpkin text-pumpkin-light'
                    : 'bg-[#14121d] border-[#222] text-[#888] hover:bg-obsidian-light'
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
            <div className="p-4 bg-obsidian border-2 border-pumpkin">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs text-pumpkin truncate">{currentRound.title}</h2>
                <StatusBadge status={currentRound.status} />
              </div>

              {/* Timer Config — DateTimePicker para início da votação */}
              <div className="mb-3 p-2.5 bg-[#14121d] border border-[#333]">
                <DateTimePicker
                  value={startsAtDate}
                  onChange={handleStartsAtChange}
                  label="INÍCIO DA VOTAÇÃO:"
                  minDate={new Date()}
                  disabled={currentRound?.status === 'active' || currentRound?.status === 'finished'}
                />
                {currentRound.starts_at && currentRound.status === 'draft' && (
                  <div className="mt-2 text-[8px] text-pumpkin-light flex items-center gap-1.5">
                    <Clock size={12} className="animate-pulse" />
                    <span>Inicia: {new Date(currentRound.starts_at).toLocaleString('pt-BR')}</span>
                  </div>
                )}
                {currentRound.starts_at && currentRound.status === 'active' && currentRound.ends_at && (
                  <div className="mt-2 text-[8px] text-[#00ff88] flex items-center gap-1.5">
                    <Clock size={12} className="animate-pulse" />
                    <span>Resta: {formatTimeMMSS(remainingTime)}</span>
                  </div>
                )}
{(currentRound?.status === 'active' || currentRound?.status === 'finished') && currentRound.starts_at && (
                    <div className="mt-2 text-[8px] text-[#ff5555] flex items-center gap-1.5">
                      <span>⚠ Data/hora de início travada (votação já iniciada/encerrada)</span>
                    </div>
                  )}
                  {/* Populate Skin URLs Button */}
                  <button
                    onClick={handlePopulateSkinUrls}
                    className="mt-2 w-full text-[8px] p-2 border flex items-center justify-center gap-2 transition-colors bg-[#1a1a2e] border-[#7928ca] text-[#9d50db] hover:bg-[#2a1a3e] hover:border-[#9d50db]"
                  >
                    <span>🎭 Popular Skins (Mojang API)</span>
                  </button>
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
                  className={`w-full text-[8px] p-2 border flex items-center justify-center gap-2 transition-colors ${currentRound.show_live_results
                    ? 'bg-[#1a2e1d] border-[#00c9a7] text-warden-teal'
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
            <div className="p-4 bg-obsidian border-2 border-[#ff780066]">
              <h2 className="text-xs text-pumpkin-light mb-4 flex items-center gap-2">
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
                        className="w-full text-[9px] p-2 bg-obsidian-light border border-[#444] text-white focus:outline-none focus:border-pumpkin"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[8px] text-[#aaa] block mb-1.5 flex items-center gap-1">
                      <UserRound size={11} /> NOME REAL (opcional)
                    </label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Ex: Gabriel Santos"
                      className="w-full text-[9px] p-2 bg-obsidian-light border border-[#444] text-white focus:outline-none focus:border-pumpkin"
                    />
                    <p className="text-[7px] text-[#555] mt-1">Só para identificar no painel e no relatório exportado.</p>
                  </div>
                </div>

                {/* Skin Preview Box */}
                <div className="flex items-center gap-3 bg-[#14121d] p-2 border border-[#333]">
                  {playerNick.trim() ? (
                    <>
                      <PlayerHead nick={playerNick.trim()} size={36} />
                      <div>
                        <div className="text-[9px] text-pumpkin-light">{playerNick.trim()}</div>
                        <div className="text-[7px] text-warden-teal">Skin detectada ✓</div>
                        {playerName.trim() && (
                          <div className="text-[7px] text-[#888] mt-1">{playerName.trim()}</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-[7px] text-[#666]">Digite o nick para ver a skin</div>
                  )}
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
                        className={`p-2 border text-center transition-all ${selectedTheme === theme.id
                          ? 'bg-[#2a1705] border-pumpkin text-pumpkin-light shadow-[0_0_10px_rgba(255,120,0,0.4)]'
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
                        className="w-full text-[8px] p-1.5 mt-1 bg-obsidian-light border border-[#444] text-white focus:outline-none focus:border-pumpkin"
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
            <div className="p-8 bg-obsidian border-2 border-[#333] text-center text-[9px] text-[#666]">
              Crie ou selecione uma rodada ao lado para gerenciar os competidores.
            </div>
          )}

          {/* Competitors List */}
          {currentRound && (
            <div className="p-4 bg-obsidian border-2 border-[#333]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs text-[#aaa]">
                  COMPETIDORES NA RODADA ({competitors.length})
                </h2>
                <span className="text-[8px] text-pumpkin">Total: {votes.length} votos</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {competitorsWithVotes.map((c, i) => (
                  <div
                    key={c.id}
                    className="p-3 bg-[#14121d] border-2 border-[#2a2a3a] flex flex-col justify-between gap-3 relative group"
                  >
                    {/* Top Row: Place, Skin, Nick, Edit & Delete Actions */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-pumpkin-light">#{i + 1}</span>
                        <PlayerHead nick={c.player_nick} size={24} />
                        <div>
                          <div className="text-[9px] text-pumpkin-light">{c.player_nick}</div>
                          {c.player_name && (
                            <div className="text-[7px] text-[#888]">{c.player_name}</div>
                          )}
                          <div className="text-[7px] text-[#666]">{c.frame_theme}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(c)}
                          className="text-pumpkin-light hover:text-[#ffcc00] p-1.5 transition-colors bg-obsidian-light border border-[#ff780044] rounded hover:border-[#ff7800]"
                          title="Editar competidor"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteCompetitor(c.id)}
                          className="text-[#f55] hover:text-[#f22] p-1.5 transition-colors bg-obsidian-light border border-[#f554] rounded hover:border-[#f55]"
                          title="Remover competidor"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Image Thumbnail */}
                    <div className="aspect-video overflow-hidden border border-[#333] bg-black">
                      <img src={c.image_url} alt={c.player_nick} className="w-full h-full object-cover" />
                    </div>

                    {/* Vote stats */}
                    <div className="flex justify-between items-center text-[8px] border-t border-[#222] pt-2">
                      <span className="text-[#888]">{c.vote_count} votos</span>
                      <span className="text-warden-teal">{c.vote_percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {
                competitors.length === 0 && (
                  <p className="text-[8px] text-[#555] text-center py-6">
                    Nenhum competidor cadastrado nesta rodada ainda.
                  </p>
                )
              }
            </div >
          )
          }
        </div >
      </div >

      {/* Modal de Edição de Competidor */}
      {
        editingCompetitor && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
            onClick={handleCancelEdit}
          >
            <div
              className="relative max-w-xl w-full bg-obsidian border-4 border-pumpkin p-5 shadow-[0_0_50px_rgba(255,120,0,0.5)] max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header do Modal */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#ff780044]">
                <h2 className="text-xs text-pumpkin-light flex items-center gap-2">
                  <Pencil size={14} /> EDITAR COMPETIDOR
                </h2>
                <button
                  onClick={handleCancelEdit}
                  className="text-[#888] hover:text-white p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                {/* Nick & Skin Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[8px] text-[#aaa] block mb-1.5">NICK NO MINECRAFT:</label>
                    <input
                      type="text"
                      value={editNick}
                      onChange={(e) => setEditNick(e.target.value)}
                      placeholder="Ex: Dark_Shadow11"
                      className="w-full text-[9px] p-2 bg-obsidian-light border border-[#444] text-white focus:outline-none focus:border-pumpkin"
                    />
                  </div>

                  <div>
                    <label className="text-[8px] text-[#aaa] block mb-1.5 flex items-center gap-1">
                      <UserRound size={11} /> NOME REAL (opcional)
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Ex: Gabriel Santos"
                      className="w-full text-[9px] p-2 bg-obsidian-light border border-[#444] text-white focus:outline-none focus:border-pumpkin"
                    />
                  </div>
                </div>

                {/* Skin Preview Box */}
                <div className="flex items-center gap-3 bg-[#14121d] p-2 border border-[#333]">
                  {editNick.trim() ? (
                    <>
                      <PlayerHead nick={editNick.trim()} size={36} />
                      <div>
                        <div className="text-[9px] text-pumpkin-light">{editNick.trim()}</div>
                        <div className="text-[7px] text-warden-teal">Skin atualizada ✓</div>
                        {editName.trim() && (
                          <div className="text-[7px] text-[#888] mt-1">{editName.trim()}</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-[7px] text-[#666]">Digite o nick</div>
                  )}
                </div>

                {/* Theme Selector */}
                <div>
                  <label className="text-[8px] text-[#aaa] block mb-2">MOLDURA TEMÁTICA:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {THEMES.map((theme) => (
                      <button
                        type="button"
                        key={theme.id}
                        onClick={() => setEditTheme(theme.id)}
                        className={`p-2 border text-center transition-all ${editTheme === theme.id
                          ? 'bg-[#2a1705] border-pumpkin text-pumpkin-light shadow-[0_0_10px_rgba(255,120,0,0.4)]'
                          : 'bg-[#14121d] border-[#333] text-[#777] hover:border-[#555]'
                          }`}
                      >
                        <div className="text-base mb-1">{theme.icon}</div>
                        <div className="text-[7px] leading-tight">{theme.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Upload / Replacement */}
                <div>
                  <label className="text-[8px] text-[#aaa] block mb-1.5">SUBSTITUIR FOTO / SCREENSHOT:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        ref={editFileInputRef}
                        onChange={handleEditFileChange}
                        className="text-[8px] text-[#888] file:mr-2 file:py-1.5 file:px-3 file:border-0 file:text-[8px] file:font-['Press_Start_2P'] file:bg-[#ff7800] file:text-black cursor-pointer"
                      />
                      <div className="text-[7px] text-[#555] mt-1.5">Ou cole nova URL:</div>
                      <input
                        type="url"
                        value={editImageUrlInput}
                        onChange={(e) => {
                          setEditImageUrlInput(e.target.value)
                          setEditImagePreview(e.target.value)
                        }}
                        placeholder="https://..."
                        className="w-full text-[8px] p-1.5 mt-1 bg-obsidian-light border border-[#444] text-white focus:outline-none focus:border-pumpkin"
                      />
                    </div>

                    {/* Preview da Imagem no Modal */}
                    <div className="aspect-video bg-[#050508] border border-[#333] flex items-center justify-center overflow-hidden">
                      {editImagePreview ? (
                        <img src={editImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-[7px] text-[#444]">Sem foto</div>
                      )}
                    </div>
                  </div>
                </div>

                {editError && (
                  <p className="text-[8px] text-[#ff4444] bg-[#200] p-2 border border-[#600]">{editError}</p>
                )}

                {/* Ações do Formulário */}
                <div className="flex gap-2 pt-2 border-t border-[#333]">
                  <MinecraftButton
                    variant="pumpkin"
                    type="submit"
                    isLoading={editUploading}
                    className="flex-1"
                  >
                    ✓ Salvar Alterações
                  </MinecraftButton>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-[#200] border-2 border-[#600] text-[#ff8888] text-[8px] hover:bg-[#300] transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Change Password Modal */}
      {
        showChangePassword && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
            onClick={() => setShowChangePassword(false)}
          >
            <div
              className="relative max-w-md w-full bg-obsidian border-4 border-[#00c9a7] p-5 shadow-[0_0_50px_rgba(0,201,167,0.5)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#00c9a744]">
                <h2 className="text-xs text-warden-teal flex items-center gap-2">
                  <Lock size={14} /> ALTERAR SENHA
                </h2>
                <button
                  onClick={() => { setShowChangePassword(false); setNewPassword(''); setConfirmPassword(''); }}
                  className="text-[#888] hover:text-white p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="text-left space-y-2">
                  <label className="text-[8px] text-[#aaa] block mb-1.5 flex items-center gap-1">
                    <Lock size={12} /> Nova Senha
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    className="w-full text-[9px] py-3 px-4 bg-obsidian-light border-2 border-[#00c9a766] text-warden-teal font-['Press_Start_2P'] focus:outline-none focus:border-[#00c9a7]"
                  />
                </div>

                <div className="text-left space-y-2">
                  <label className="text-[8px] text-[#aaa] mb-1.5 flex items-center gap-1">
                    <Lock size={12} /> Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme a nova senha"
                    autoComplete="new-password"
                    className="w-full text-[9px] py-3 px-4 bg-obsidian-light border-2 border-[#00c9a766] text-warden-teal font-['Press_Start_2P'] focus:outline-none focus:border-[#00c9a7]"
                  />
                </div>

                {authError && (
                  <p className="text-[8px] text-[#ff4444] bg-[#200] p-2 border border-[#600]">{authError}</p>
                )}

                <div className="flex gap-2 pt-2 border-t border-[#333]">
                  <MinecraftButton
                    variant="pale"
                    type="submit"
                    isLoading={authLoading}
                    className="flex-1"
                  >
                    ✓ Salvar Nova Senha
                  </MinecraftButton>
                  <button
                    type="button"
                    onClick={() => { setShowChangePassword(false); setNewPassword(''); setConfirmPassword(''); }}
                    className="px-4 py-2 bg-[#200] border-2 border-[#600] text-[#ff8888] text-[8px] hover:bg-[#300] transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </div >
  )
}
