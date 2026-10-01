/**
 * DateTimePicker — shadcn/ui Date Picker + Time inputs
 * Usa Popover + Calendar do shadcn com estilo escuro do painel admin.
 */
import React, { useState, useEffect } from 'react'
import { format, addMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/shadcn/popover'
import { Calendar } from '~/components/shadcn/calendar'
import { cn } from '~/lib/cn'

interface DateTimePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  label?: string
  minDate?: Date
}

export function DateTimePicker({
  value,
  onChange,
  label = 'Data e Hora de Encerramento',
  minDate,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false)
  const [timeH, setTimeH] = useState(value ? value.getHours() : 23)
  const [timeM, setTimeM] = useState(value ? value.getMinutes() : 59)

  useEffect(() => {
    if (value) {
      setTimeH(value.getHours())
      setTimeM(value.getMinutes())
    }
  }, [value])

  function buildDate(day: Date, h: number, m: number): Date {
    const d = new Date(day)
    d.setHours(h, m, 0, 0)
    return d
  }

  function handleDaySelect(day: Date | undefined) {
    if (!day) { onChange(undefined); return }
    onChange(buildDate(day, timeH, timeM))
  }

  function handleHourChange(raw: string) {
    const h = Math.max(0, Math.min(23, parseInt(raw) || 0))
    setTimeH(h)
    if (value) onChange(buildDate(value, h, timeM))
  }

  function handleMinChange(raw: string) {
    const m = Math.max(0, Math.min(59, parseInt(raw) || 0))
    setTimeM(m)
    if (value) onChange(buildDate(value, timeH, m))
  }

  function applyQuickAdd(mins: number) {
    const base = value ?? new Date()
    const next = addMinutes(base, mins)
    setTimeH(next.getHours())
    setTimeM(next.getMinutes())
    onChange(next)
  }

  const displayText = value
    ? format(value, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : null

  return (
    <div>
      {label && (
        <label className="text-[7px] text-[#aaa] block mb-1.5 font-['Press_Start_2P']">
          {label}
        </label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        {/* Trigger */}
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "w-full flex items-center gap-2 text-left text-[8px] p-2.5",
              "bg-[#1a1825] border border-[#555] font-['Press_Start_2P']",
              "hover:border-[#ff7800] transition-colors",
              !value && "text-[#555]",
              value && "text-[#ffcc66]",
            )}
          >
            <CalendarIcon size={13} className="text-[#ff9a3c] shrink-0" />
            <span>{displayText ?? 'Escolher data e hora...'}</span>
          </button>
        </PopoverTrigger>

        {/* Popover Content */}
        <PopoverContent
          className="w-auto p-0 border-2 border-[#ff780066] bg-[#0e0d13] shadow-[0_8px_32px_rgba(0,0,0,0.95)]"
          align="start"
        >
          {/* Calendário shadcn — estilo override inline */}
          <style>{`
            .admin-cal { --rdp-accent-color: #ff7800; }
            .admin-cal .rdp-month_caption { color: #ff9a3c; font-family: 'Press Start 2P', monospace; font-size: 9px; }
            .admin-cal .rdp-nav button { background: #1a1825; border: 1px solid #333; color: #aaa; }
            .admin-cal .rdp-nav button:hover { border-color: #ff7800; color: #ff9a3c; }
            .admin-cal .rdp-weekday { color: #555; font-family: 'Press Start 2P', monospace; font-size: 7px; }
            .admin-cal .rdp-day_button {
              font-family: 'Press Start 2P', monospace; font-size: 7px;
              color: #ccc; background: transparent; border: 1px solid transparent; border-radius: 2px; cursor: pointer;
            }
            .admin-cal .rdp-day_button:hover { background: #2a1705; border-color: #ff780066; color: #ff9a3c; }
            .admin-cal .rdp-selected .rdp-day_button { background: #ff7800 !important; color: #000 !important; border-color: #ffcc66 !important; }
            .admin-cal .rdp-today .rdp-day_button { border-color: #ff780088; color: #ff9a3c; }
            .admin-cal .rdp-outside .rdp-day_button { color: #333; }
            .admin-cal .rdp-disabled .rdp-day_button { color: #2a2a2a; cursor: not-allowed; }
          `}</style>

          <Calendar
            className="admin-cal"
            mode="single"
            selected={value}
            onSelect={handleDaySelect}
            locale={ptBR}
            disabled={minDate ? { before: minDate } : undefined}
            initialFocus
          />

          {/* Separador */}
          <div className="border-t border-[#333] mx-3" />

          {/* Time Picker */}
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-center gap-2">
              <span className="text-[7px] text-[#888] font-['Press_Start_2P']">HORA:</span>
              <input
                type="number"
                min={0}
                max={23}
                value={String(timeH).padStart(2, '0')}
                onChange={(e) => handleHourChange(e.target.value)}
                className="w-12 text-center text-[10px] py-1.5 bg-[#1a1825] border border-[#555] text-[#ffcc00] font-['Press_Start_2P'] focus:outline-none focus:border-[#ff7800]"
              />
              <span className="text-[#ff9a3c] font-bold text-lg">:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={String(timeM).padStart(2, '0')}
                onChange={(e) => handleMinChange(e.target.value)}
                className="w-12 text-center text-[10px] py-1.5 bg-[#1a1825] border border-[#555] text-[#ffcc00] font-['Press_Start_2P'] focus:outline-none focus:border-[#ff7800]"
              />
              <span className="text-[7px] text-[#666] font-['Press_Start_2P']">HH:MM</span>
            </div>

            {/* Atalhos */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#222]">
              <span className="text-[6px] text-[#555] w-full font-['Press_Start_2P']">ATALHOS:</span>
              {[
                { label: '+15min', mins: 15 },
                { label: '+30min', mins: 30 },
                { label: '+1h', mins: 60 },
                { label: '+2h', mins: 120 },
              ].map(({ label: lbl, mins }) => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => applyQuickAdd(mins)}
                  className="text-[7px] px-2 py-1 bg-[#1a1825] border border-[#ff780055] text-[#ff9a3c] hover:bg-[#2a1705] transition-colors font-['Press_Start_2P']"
                >
                  {lbl}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { onChange(undefined); setOpen(false) }}
                className="text-[7px] px-2 py-1 bg-[#200] border border-[#600] text-[#f66] hover:bg-[#300] transition-colors font-['Press_Start_2P'] ml-auto"
              >
                Limpar
              </button>
            </div>

            {/* Confirmar */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full text-[8px] py-2 bg-[#ff7800] text-black font-['Press_Start_2P'] border-2 border-[#ffcc66] hover:bg-[#ff9a3c] transition-colors shadow-[0_2px_0_#803300]"
            >
              ✓ Confirmar
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
