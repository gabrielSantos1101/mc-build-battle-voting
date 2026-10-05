import {
  EMPTY_LABEL,
  FRAME_THEME_LABELS,
  ROUND_STATUS_LABELS,
  formatDateTimeBr,
  formatGeoLabel,
  type ReportCompetitorRow,
  type VoteReport,
} from './report'

const STATUS_COLORS: Record<VoteReport['round_status'], string> = {
  draft: '#888888',
  active: '#00ff88',
  paused: '#ffaa00',
  finished: '#00c9a7',
}

const PODIUM_MEDALS = ['🥇', '🥈', '🥉']

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR')
}

function formatDecimal(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function formatDuration(startIso: string | null, endIso: string | null): string {
  if (!startIso || !endIso) return EMPTY_LABEL
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return EMPTY_LABEL

  const totalSeconds = Math.floor((end - start) / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0 || hours > 0) parts.push(`${minutes}min`)
  parts.push(`${seconds}s`)
  return parts.join(' ')
}

function avatarBlock(row: ReportCompetitorRow, size: number): string {
  const initial = escapeHtml(row.player_nick.charAt(0).toUpperCase() || '?')
  return `
      <div class="avatar" style="width:${size}px;height:${size}px">
        <span class="avatar-fallback" style="font-size:${Math.round(size * 0.4)}px">${initial}</span>
        <img src="${escapeHtml(row.avatar_url)}" alt="Avatar de ${escapeHtml(row.player_nick)}" />
      </div>`
}

function podiumCard(row: ReportCompetitorRow): string {
  const isFirst = row.position === 1
  return `
      <div class="podium-card${isFirst ? ' podium-first' : ''}">
        <div class="podium-medal">${PODIUM_MEDALS[row.position - 1] ?? `#${row.position}`}</div>
        <div class="podium-shot">
          <span class="shot-fallback">sem foto</span>
          <img src="${escapeHtml(row.image_url)}" alt="Construção de ${escapeHtml(row.player_nick)}" />
        </div>
        <div class="podium-info">
          ${avatarBlock(row, 40)}
          <div class="podium-names">
            <div class="podium-nick">${escapeHtml(row.player_nick)}</div>
            <div class="podium-name">${escapeHtml(row.player_name || 'sem nome informado')}</div>
          </div>
        </div>
        <div class="podium-votes">
          <span class="podium-count">${formatNumber(row.vote_count)}</span>
          <span class="podium-pct">${formatDecimal(row.vote_percentage)}%</span>
        </div>
        <div class="bar"><div class="bar-fill bar-gold" style="width:${row.vote_percentage}%"></div></div>
      </div>`
}

function rankingRow(row: ReportCompetitorRow): string {
  return `
        <tr class="${row.position <= 3 ? 'row-podium' : ''}">
          <td class="cell-pos">#${row.position}</td>
          <td>
            <div class="cell-player-inner">
              ${avatarBlock(row, 32)}
              <div class="cell-names">
                <div class="cell-nick">${escapeHtml(row.player_nick)}</div>
                <div class="cell-name">${escapeHtml(row.player_name || EMPTY_LABEL)}</div>
              </div>
            </div>
          </td>
          <td class="cell-theme">${escapeHtml(FRAME_THEME_LABELS[row.frame_theme] ?? row.frame_theme)}</td>
          <td class="cell-votes">${formatNumber(row.vote_count)}</td>
          <td class="cell-pct">
            <div class="bar"><div class="bar-fill" style="width:${row.vote_percentage}%"></div></div>
            <span class="cell-pct-label">${formatDecimal(row.vote_percentage)}%</span>
          </td>
        </tr>`
}

function buildStyles(): string {
  return `
    * {
      box-sizing: border-box;
      /* Chrome so imprime fundos de elemento se isso estiver ligado. */
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    html, body { margin: 0; padding: 0; }
    /* O fundo precisa ficar no html: com ele so no body, o Chrome pinta
       apenas a primeira pagina e o resto sai branco. */
    html { background: #0e0d13; min-height: 100%; }
    body {
      background: #0e0d13;
      min-height: 100%;
      color: #e0e0e0;
      font-family: 'Press Start 2P', 'Courier New', monospace;
      font-size: 9px;
      line-height: 1.7;
    }
    .sheet { max-width: 1000px; margin: 0 auto; padding: 24px 20px 40px; }
    .toolbar { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 16px; background: #16141f; border-bottom: 3px solid #ff780055; }
    .toolbar button {
      font-family: 'Press Start 2P', monospace; font-size: 10px; text-transform: uppercase;
      padding: 10px 20px; cursor: pointer; color: #fff; background: #a04800;
      border: 3px solid #ff7800; box-shadow: 0 4px 0 #ff780088; letter-spacing: 0.5px;
    }
    .toolbar button:hover { background: #c05a00; }
    .toolbar button.ghost { background: #1a1825; border-color: #444; box-shadow: 0 4px 0 #0008; color: #aaa; }
    .toolbar button.ghost:hover { background: #262238; color: #fff; }
    .toolbar-hint { color: #777; font-size: 8px; }

    .report-head { text-align: center; padding: 24px 8px 18px; border-bottom: 3px solid #ff780033; }
    .report-kicker { color: #ff9a3c; font-size: 9px; letter-spacing: 1px; }
    .report-title { color: #fff; font-size: 18px; margin: 14px 0 10px; line-height: 1.5; }
    .report-status {
      display: inline-block; padding: 6px 12px; font-size: 8px;
      border: 2px solid #ff780066; background: #16141f;
    }
    .report-meta { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 8px 20px; justify-content: center; color: #8a8a8a; font-size: 8px; }

    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 22px 0; }
    .stat { background: #16141f; border: 2px solid #2a2a3a; padding: 12px 10px; text-align: center; }
    .stat-value { font-size: 16px; color: #ff9a3c; }
    .stat-label { font-size: 7px; color: #777; margin-top: 8px; }

    .section { margin: 26px 0; }
    .section-title {
      font-size: 11px; color: #ff7800; margin-bottom: 14px; padding-bottom: 10px;
      border-bottom: 2px solid #ff780044; display: flex; align-items: center; gap: 10px;
    }
    .section-title span { color: #666; font-size: 8px; }

    .podium { display: flex; align-items: flex-end; gap: 14px; justify-content: center; }
    .podium-card {
      flex: 1; background: #16141f; border: 2px solid #2a2a3a; padding: 12px;
      text-align: center; page-break-inside: avoid; break-inside: avoid;
    }
    .podium-first { border-color: #ffd700; box-shadow: 0 0 18px #ffd70033; padding-top: 18px; padding-bottom: 18px; }
    .podium-medal { font-size: 20px; margin-bottom: 10px; }
    .podium-shot { position: relative; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; background: #05050a; border: 2px solid #2a2a3a; }
    .podium-shot img { position: relative; width: 100%; height: 100%; object-fit: cover; display: block; }
    .shot-fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #444; font-size: 8px; }
    .podium-info { display: flex; align-items: center; gap: 10px; margin: 12px 0 10px; text-align: left; }
    .podium-nick { color: #ff9a3c; font-size: 10px; }
    .podium-name { color: #8a8a8a; font-size: 8px; margin-top: 6px; }
    .podium-votes { display: flex; align-items: baseline; justify-content: center; gap: 10px; }
    .podium-count { color: #fff; font-size: 16px; }
    .podium-pct { color: #00c9a7; font-size: 9px; }
    .podium-first .podium-pct { color: #ffd700; }

    .avatar { position: relative; flex: none; width: 40px; height: 40px; border: 2px solid #3a3a4a; background: #2a2a2a; }
    .avatar img { position: relative; width: 100%; height: 100%; display: block; image-rendering: pixelated; }
    .avatar-fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #ff7800; }

    .bar { display: block; height: 8px; background: #0a0912; border: 1px solid #2a2a3a; overflow: hidden; }
    .bar-fill { display: block; height: 100%; background: #ff7800; }
    .bar-gold { background: #ffd700; }

    table { width: 100%; border-collapse: collapse; font-size: 8px; }
    thead th {
      text-align: left; padding: 9px 8px; background: #1a1825; color: #ff9a3c;
      border: 1px solid #2a2a3a; font-size: 8px; text-transform: uppercase;
    }
    tbody td { padding: 8px; border: 1px solid #1f1f2c; vertical-align: middle; }
    tbody tr:nth-child(even) { background: #131119; }
    .row-podium { background: #1a1408; }
    .row-podium td { border-color: #4a3a12; }
    .cell-pos { color: #ff9a3c; width: 44px; }
    .cell-player-inner { display: flex; align-items: center; gap: 10px; }
    .cell-names { min-width: 0; }
    .cell-nick { color: #e0e0e0; font-size: 8px; }
    .cell-name { color: #6e6e5c; font-size: 7px; margin-top: 5px; }
    .cell-theme { color: #8a8a8a; }
    .cell-votes { color: #fff; text-align: center; width: 60px; }
    .cell-pct { width: 190px; }
    .cell-pct-label { display: block; color: #00c9a7; margin-top: 6px; }

    .geo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .geo-list { display: flex; flex-direction: column; gap: 7px; }
    .geo-row { display: flex; align-items: center; gap: 10px; font-size: 8px; }
    .geo-label { flex: 1; color: #b0b0b0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .geo-count { color: #ff9a3c; width: 42px; text-align: right; flex: none; }
    .geo-bar { flex: 2; display: block; }

    .empty { color: #555; font-size: 8px; padding: 14px; background: #16141f; border: 2px dashed #2a2a3a; text-align: center; }

    .report-foot {
      margin-top: 30px; padding-top: 14px; border-top: 2px solid #ff780033;
      display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; color: #555; font-size: 7px;
    }

    @media print {
      @page { size: A4 portrait; margin: 10mm; }
      /* !important porque o reset do * acima nao vence o fundo do navegador */
      html, body {
        background: #0e0d13 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .toolbar { display: none !important; }
      .sheet { max-width: none; padding: 0; }
      .section, .podium-card, .stats, .geo-grid { page-break-inside: avoid; break-inside: avoid; }
      .section-title { page-break-after: avoid; break-after: avoid; }
      thead { display: table-header-group; }
      tbody tr { page-break-inside: avoid; break-inside: avoid; }
    }
  `
}

export function buildReportHtml(report: VoteReport): string {
  const statusColor = STATUS_COLORS[report.round_status]
  const duration = formatDuration(report.round_starts_at ?? report.first_vote_at, report.round_ends_at ?? report.last_vote_at)
  const podium = report.ranking.slice(0, 3)
  const orderedPodium = [...podium].sort((a, b) => {
    const order = [2, 1, 3]
    const rankA = order.indexOf(a.position)
    const rankB = order.indexOf(b.position)
    return (rankA === -1 ? 9 : rankA) - (rankB === -1 ? 9 : rankB)
  })

  const stats = [
    { value: formatNumber(report.total_votes), label: 'VOTOS TOTAIS' },
    { value: formatNumber(report.total_competitors), label: 'CONSTRUCOES' },
    { value: formatNumber(report.unique_devices), label: 'DISPOSITIVOS' },
    { value: duration, label: 'DURACAO' },
  ]

  const geoLocality = report.geo.length
    ? `<div class="geo-list">${report.geo
        .slice(0, 18)
        .map(
          (row) => `
        <div class="geo-row">
          <span class="geo-label">${escapeHtml(formatGeoLabel(row))}</span>
          <span class="geo-bar"><span class="bar"><span class="bar-fill" style="width:${row.percentage}%"></span></span></span>
          <span class="geo-count">${formatNumber(row.count)}</span>
        </div>`,
        )
        .join('')}</div>`
    : '<div class="empty">Nenhum voto com geolocalização registrada.</div>'

  const geoCountries = report.countries.length
    ? `<div class="geo-list">${report.countries
        .slice(0, 18)
        .map(
          (row) => `
        <div class="geo-row">
          <span class="geo-label">${escapeHtml(row.country || EMPTY_LABEL)}</span>
          <span class="geo-bar"><span class="bar"><span class="bar-fill bar-gold" style="width:${row.percentage}%"></span></span></span>
          <span class="geo-count">${formatNumber(row.count)}</span>
        </div>`,
        )
        .join('')}</div>`
    : '<div class="empty">Nenhum voto com geolocalização registrada.</div>'

  const rankingTable = report.ranking.length
    ? `<table>
        <thead>
          <tr>
            <th>Pos</th><th>Jogador</th><th>Moldura</th><th style="text-align:center">Votos</th><th>Participação</th>
          </tr>
        </thead>
        <tbody>${report.ranking.map(rankingRow).join('')}</tbody>
      </table>`
    : '<div class="empty">Nenhum competidor registrado nesta rodada.</div>'

  const detailsTable = report.details.length
    ? `<table>
        <thead>
          <tr>
            <th>Data/hora</th><th>Jogador</th><th>Nome</th><th>Origem</th><th>Device</th><th>IP (parcial)</th>
          </tr>
        </thead>
        <tbody>${report.details
          .map(
            (row) => `
          <tr>
            <td>${escapeHtml(formatDateTimeBr(row.created_at))}</td>
            <td class="cell-theme">${escapeHtml(row.player_nick)}</td>
            <td class="cell-theme">${escapeHtml(row.player_name || EMPTY_LABEL)}</td>
            <td class="cell-theme">${escapeHtml(formatGeoLabel(row))}</td>
            <td class="cell-theme">${escapeHtml(row.device_id)}</td>
            <td class="cell-theme">${escapeHtml(row.ip)}</td>
          </tr>`,
          )
          .join('')}</tbody>
      </table>`
    : '<div class="empty">Nenhum voto registrado nesta rodada.</div>'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Relatório de Votação — ${escapeHtml(report.round_title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
<style>${buildStyles()}</style>
</head>
<body>
  <div class="toolbar">
    <button type="button" id="print-now">🖨 Imprimir / Salvar em PDF</button>
    <button type="button" class="ghost" onclick="window.close()">Fechar</button>
    <span class="toolbar-hint">Na janela de impressão escolha "Salvar como PDF" como destino.</span>
  </div>

  <div class="sheet">
    <div class="report-head">
      <div class="report-kicker">🎃 BUILD BATTLE — RELATÓRIO DE VOTAÇÃO</div>
      <h1 class="report-title">${escapeHtml(report.round_title)}</h1>
      <div class="report-status" style="color:${statusColor};border-color:${statusColor}66">
        ${escapeHtml(ROUND_STATUS_LABELS[report.round_status])}
      </div>
      <div class="report-meta">
        <span>Início: ${escapeHtml(formatDateTimeBr(report.round_starts_at))}</span>
        <span>Término: ${escapeHtml(formatDateTimeBr(report.round_ends_at))}</span>
        <span>Gerado em: ${escapeHtml(formatDateTimeBr(report.generated_at))}</span>
      </div>
    </div>

    <div class="stats">
      ${stats
        .map(
          (s) => `<div class="stat"><div class="stat-value">${escapeHtml(s.value)}</div><div class="stat-label">${escapeHtml(s.label)}</div></div>`,
        )
        .join('')}
    </div>

    <div class="section">
      <h2 class="section-title">🏆 PÓDIO <span>TOP ${podium.length} DA RODADA</span></h2>
      ${
        podium.length
          ? `<div class="podium">${orderedPodium.map(podiumCard).join('')}</div>`
          : '<div class="empty">Nenhum competidor registrado nesta rodada.</div>'
      }
    </div>

    <div class="section">
      <h2 class="section-title">📊 RANKING COMPLETO</h2>
      ${rankingTable}
    </div>

    <div class="section">
      <h2 class="section-title">🌍 DE ONDE VIERAM OS VOTOS <span>${formatNumber(report.unique_ips)} IPs ÚNICOS</span></h2>
      <div class="geo-grid">
        <div>
          <div class="section-title" style="font-size:8px">POR LOCALIDADE</div>
          ${geoLocality}
        </div>
        <div>
          <div class="section-title" style="font-size:8px">POR PAÍS</div>
          ${geoCountries}
        </div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">🗳 REGISTRO DE VOTOS <span>${formatNumber(report.total_votes)} REGISTROS</span></h2>
      ${detailsTable}
    </div>

    <div class="report-foot">
      <span>Build Battle — relatório interno do painel do streamer</span>
      <span>IPs exibidos parcialmente por privacidade</span>
    </div>
  </div>

  <script>
    document.getElementById('print-now')?.addEventListener('click', function () {
      window.focus()
      window.print()
    })
    document.querySelectorAll('img').forEach(function (img) {
      img.addEventListener('error', function () { img.style.visibility = 'hidden' })
    })
  </script>
</body>
</html>`
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([promise, delay(ms).then(() => fallback)])
}

async function whenDocumentReady(doc: Document): Promise<void> {
  const fonts = (doc as Document & { fonts?: FontFaceSet }).fonts
  if (fonts?.ready) {
    await withTimeout(fonts.ready.then(() => undefined), 4000, undefined)
  }

  const images = Array.from(doc.images)
  await withTimeout(
    Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve()
              return
            }
            img.addEventListener('load', () => resolve(), { once: true })
            img.addEventListener('error', () => resolve(), { once: true })
          }),
      ),
    ).then(() => undefined),
    8000,
    undefined,
  )

  await delay(150)
}

export async function openReportPrintWindow(report: VoteReport): Promise<boolean> {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return false

  printWindow.document.open()
  printWindow.document.write(buildReportHtml(report))
  printWindow.document.close()

  await withTimeout(whenDocumentReady(printWindow.document), 15000, undefined)

  printWindow.focus()
  printWindow.print()
  return true
}
