import {
  EMPTY_LABEL,
  FRAME_THEME_LABELS,
  ROUND_STATUS_LABELS,
  buildReportFileName,
  formatDateTimeBr,
  formatGeoLabel,
  type VoteReport,
} from './report'

const SEPARATOR = ';'
const EOL = '\r\n'

function escapeCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  if (!/[;"\r\n]/.test(text)) return text
  return `"${text.replace(/"/g, '""')}"`
}

function toRow(cells: unknown[]): string {
  return cells.map(escapeCell).join(SEPARATOR)
}

function section(title: string): string[] {
  return ['', toRow([title])]
}

export function buildReportCsv(report: VoteReport): string {
  const rows: string[] = []

  rows.push(
    toRow(['RELATORIO DE VOTACAO - BUILD BATTLE']),
    toRow(['Rodada', report.round_title]),
    toRow(['Status', ROUND_STATUS_LABELS[report.round_status]]),
    toRow(['Inicio da votacao', formatDateTimeBr(report.round_starts_at)]),
    toRow(['Termino da votacao', formatDateTimeBr(report.round_ends_at)]),
    toRow(['Relatorio gerado em', formatDateTimeBr(report.generated_at)]),
    toRow(['Total de votos', report.total_votes]),
    toRow(['Total de competidores', report.total_competitors]),
    toRow(['Devices unicos', report.unique_devices]),
    toRow(['IPs unicos', report.unique_ips]),
    toRow(['Primeiro voto', formatDateTimeBr(report.first_vote_at)]),
    toRow(['Ultimo voto', formatDateTimeBr(report.last_vote_at)]),
  )

  rows.push(
    ...section('RANKING'),
    toRow([
      'Posicao',
      'Nick Minecraft',
      'Nome',
      'Votos',
      '% do total',
      'Moldura',
      'Primeiro voto',
      'Ultimo voto',
      'Avatar',
      'Foto da construcao',
    ]),
  )
  for (const row of report.ranking) {
    rows.push(
      toRow([
        row.position,
        row.player_nick,
        row.player_name || EMPTY_LABEL,
        row.vote_count,
        `${row.vote_percentage}%`,
        FRAME_THEME_LABELS[row.frame_theme] ?? row.frame_theme,
        formatDateTimeBr(row.first_vote_at),
        formatDateTimeBr(row.last_vote_at),
        row.avatar_url,
        row.image_url,
      ]),
    )
  }

  rows.push(
    ...section('ORIGEM DOS VOTOS (CIDADE/UF/PAIS)'),
    toRow(['Localidade', 'Cidade', 'UF', 'Pais', 'Votos', '% do total']),
  )
  if (report.geo.length === 0) {
    rows.push(toRow(['Sem geolocalizacao registrada', EMPTY_LABEL, EMPTY_LABEL, EMPTY_LABEL, 0, '0%']))
  } else {
    for (const row of report.geo) {
      rows.push(
        toRow([
          formatGeoLabel(row),
          row.city || EMPTY_LABEL,
          row.region || EMPTY_LABEL,
          row.country || EMPTY_LABEL,
          row.count,
          `${row.percentage}%`,
        ]),
      )
    }
  }

  rows.push(...section('VOTOS POR PAIS'), toRow(['Pais', 'Votos', '% do total']))
  if (report.countries.length === 0) {
    rows.push(toRow([EMPTY_LABEL, 0, '0%']))
  } else {
    for (const row of report.countries) {
      rows.push(toRow([row.country || EMPTY_LABEL, row.count, `${row.percentage}%`]))
    }
  }

  rows.push(
    ...section('VOTOS DETALHADOS (UM POR LINHA)'),
    toRow(['Data/hora', 'Nick Minecraft', 'Nome', 'Localidade', 'Pais', 'Device', 'IP (parcial)']),
  )
  if (report.details.length === 0) {
    rows.push(toRow([EMPTY_LABEL, EMPTY_LABEL, EMPTY_LABEL, EMPTY_LABEL, EMPTY_LABEL, EMPTY_LABEL, EMPTY_LABEL]))
  } else {
    for (const row of report.details) {
      rows.push(
        toRow([
          formatDateTimeBr(row.created_at),
          row.player_nick,
          row.player_name || EMPTY_LABEL,
          formatGeoLabel(row),
          row.country || EMPTY_LABEL,
          row.device_id,
          row.ip,
        ]),
      )
    }
  }

  return `\uFEFF${rows.join(EOL)}`
}

export function downloadReportCsv(report: VoteReport): void {
  const csv = buildReportCsv(report)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = buildReportFileName(report, 'csv')
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
