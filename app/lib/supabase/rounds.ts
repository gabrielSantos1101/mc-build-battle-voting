import { supabase } from './client'
import type { Competitor, Round, Vote } from './types'

interface RoundWithCompetitorCount extends Round {
  competitors: { count: number }[]
}

export interface RoundData {
  round: Round
  competitors: Competitor[]
  votes: Vote[]
}

function competitorCount(round: RoundWithCompetitorCount): number {
  return round.competitors?.[0]?.count ?? 0
}

/**
 * Carrega a rodada que os overlays devem exibir, junto dos competidores e votos.
 *
 * A ordem importa: as telas de voting e de overlay usavam criterios diferentes e
 * por isso discordavam sobre qual rodada era a atual. A tela de votacao pegava a
 * `active`, o podium pegava a mais recente entre `active` e `finished` - e quando
 * a `finished` era a mais nova e tinha menos competidores, o podium exibia a
 * rodada errada sem nenhum erro no console.
 *
 * Aqui a `active` sempre ganha, e so caimos para outra rodada se a `active` nao
 * tiver nenhum competidor - por exemplo a `active` recem-criada e ainda vazia.
 */
export async function loadRoundWithCompetitors(
  preferredStatuses: string[] = ['active']
): Promise<RoundData | null> {
  const { data, error } = await supabase
    .from('rounds')
    .select('*, competitors(count)')
    .in('status', ['active', 'finished', 'paused', 'draft'])
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[loadRoundWithCompetitors] falha ao buscar rodadas:', error.message)
    return null
  }

  const rounds = (data ?? []) as RoundWithCompetitorCount[]

  const chosen =
    rounds.find((r) => preferredStatuses.includes(r.status) && competitorCount(r) > 0) ??
    rounds.find((r) => competitorCount(r) > 0)

  if (!chosen) return null

  const [competitorsRes, votesRes] = await Promise.all([
    supabase.from('competitors').select('*').eq('round_id', chosen.id),
    supabase.from('votes').select('*').eq('round_id', chosen.id),
  ])

  if (competitorsRes.error) {
    console.error('[loadRoundWithCompetitors] falha ao buscar competidores:', competitorsRes.error.message)
  }
  if (votesRes.error) {
    console.error('[loadRoundWithCompetitors] falha ao buscar votos:', votesRes.error.message)
  }

  const { competitors: _count, ...round } = chosen

  return {
    round: round as Round,
    competitors: competitorsRes.data ?? [],
    votes: votesRes.data ?? [],
  }
}