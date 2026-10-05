import * as PopoverPrimitive from '@radix-ui/react-popover'
import { ChevronDown, FileSpreadsheet, FileText } from 'lucide-react'
import React from 'react'
import { buildVoteReport, downloadReportCsv, openReportPrintWindow } from '~/lib/export'
import type { Competitor, Round, Vote } from '~/lib/supabase/types'
import { cn } from '~/lib/cn'

interface ExportMenuProps {
  round: Round | null
  competitors: Competitor[]
  votes: Vote[]
  className?: string
}

type ExportFormat = 'pdf' | 'csv'

export function ExportMenu({ round, competitors, votes, className }: ExportMenuProps) {
  const [open, setOpen] = React.useState(false)
  const [busyFormat, setBusyFormat] = React.useState<ExportFormat | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const isDisabled = !round || (competitors.length === 0 && votes.length === 0)

  async function handleExport(format: ExportFormat) {
    if (!round || isDisabled) return

    setBusyFormat(format)
    setError(null)

    try {
      const report = buildVoteReport(round, competitors, votes)

      if (format === 'csv') {
        downloadReportCsv(report)
      } else {
        const opened = await openReportPrintWindow(report)
        if (!opened) {
          setError('O navegador bloqueou a janela. Libere pop-ups e tente de novo.')
        }
      }

      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar o relatório.')
    } finally {
      setBusyFormat(null)
    }
  }

  const totalVotes = votes.length

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild disabled={isDisabled}>
        <button
          type="button"
          className={cn(
            'flex items-center gap-1 bg-[#2a1a05] border border-[#ffd70066] px-2.5 py-1.5 text-[#ffd700] hover:bg-[#ffd70022] transition-colors disabled:bg-[#15151a] disabled:border-[#333] disabled:text-[#555] disabled:cursor-not-allowed',
            className,
          )}
          title={isDisabled ? 'Crie uma rodada com competidores para exportar' : 'Exportar relatório da votação'}
        >
          {busyFormat ? (
            <span className="animate-pulse">{busyFormat === 'pdf' ? '📄' : '📊'}</span>
          ) : (
            <FileText size={12} />
          )}
          Exportar
          <ChevronDown size={12} className={cn('transition-transform', open && 'rotate-180')} />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={6}
          className="z-50 w-72 border-2 border-[#ffd70066] bg-obsidian shadow-[0_0_25px_rgba(255,215,0,0.2)] outline-none animate-in fade-in-0 zoom-in-95"
        >
          <div className="px-3 py-2 border-b border-[#ffd70033] flex items-center justify-between gap-2">
            <span className="text-[8px] text-[#ffd700]">📤 EXPORTAR RELATÓRIO</span>
            <span className="text-[7px] text-[#666]">{totalVotes} votos</span>
          </div>

          <div className="p-1.5 space-y-1">
            <ExportOption
              icon={<FileText size={14} />}
              title="PDF (imprimir / salvar)"
              description="Relatório formatado com pódio, fotos, ranking e mapa de votos"
              accent="#ff7800"
              loading={busyFormat === 'pdf'}
              disabled={isDisabled}
              onClick={() => handleExport('pdf')}
            />
            <ExportOption
              icon={<FileSpreadsheet size={14} />}
              title="CSV (Excel)"
              description="Planilha com resumo, ranking, geografia e votos um a um"
              accent="#00c9a7"
              loading={busyFormat === 'csv'}
              disabled={isDisabled}
              onClick={() => handleExport('csv')}
            />
          </div>

          <div className="px-3 py-2 border-t border-[#ffd70033] text-[7px] text-[#555] leading-relaxed">
            O PDF abre numa aba nova — escolha &quot;Salvar como PDF&quot; no destino da impressão.
          </div>

          {error && (
            <div className="px-3 py-2 border-t border-[#ff444455] bg-[#200] text-[7px] text-[#ff6666]">
              {error}
            </div>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

interface ExportOptionProps {
  icon: React.ReactNode
  title: string
  description: string
  accent: string
  loading: boolean
  disabled: boolean
  onClick: () => void
}

function ExportOption({ icon, title, description, accent, loading, disabled, onClick }: ExportOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full text-left px-3 py-2.5 flex items-start gap-3 border border-transparent hover:bg-obsidian-light hover:border-[#ffd70033] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="mt-0.5 shrink-0" style={{ color: accent }}>
        {loading ? <span className="animate-pulse">…</span> : icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[8px] text-[#e0e0e0]">{loading ? 'Gerando…' : title}</span>
        <span className="block text-[7px] text-[#666] mt-1 leading-relaxed">{description}</span>
      </span>
    </button>
  )
}
