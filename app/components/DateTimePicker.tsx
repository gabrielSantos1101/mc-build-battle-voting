/**
 * DateTimePicker — Componente de seleção de data e hora estilo shadcn/ui
 * Usa react-day-picker v9 + date-fns.
 * Estilizado com o tema escuro do painel admin (Press Start 2P).
 */
import React, { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, setHours, setMinutes, setSeconds } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'

// Estilos base do react-day-picker (injetados inline para não depender de CSS externo)
const dayPickerStyles = `
  .rdp-root {
    --rdp-accent-color: #ff7800;
    --rdp-accent-background-color: #2a1705;
    color: #e0e0e0;
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
  }
  .rdp-month_caption { display: flex; align-items: center; justify-content: space-between; padding: 0 4px 8px; }
  .rdp-caption_label { font-size: 9px; color: #ff9a3c; }
  .rdp-nav { display: flex; gap: 4px; }
  .rdp-button_previous, .rdp-button_next {
    background: #1a1825; border: 1px solid #333; color: #aaa;
    cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center;
  }
  .rdp-button_previous:hover, .rdp-button_next:hover { border-color: #ff7800; color: #ff9a3c; }
  .rdp-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 4px; }
  .rdp-weekday { text-align: center; color: #666; font-size: 7px; padding: 2px 0; }
  .rdp-month_grid { width: 100%; border-collapse: collapse; }
  .rdp-week { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
  .rdp-day { text-align: center; }
  .rdp-day_button {
    width: 28px; height: 28px; border: 1px solid transparent; background: transparent;
    color: #ccc; cursor: pointer; font-size: 8px; font-family: inherit;
    display: flex; align-items: center; justify-content: center; margin: auto;
    transition: all 0.1s;
  }
  .rdp-day_button:hover { background: #2a1705; border-color: #ff780066; color: #ff9a3c; }
  .rdp-selected .rdp-day_button { background: #ff7800; border-color: #ff9a3c; color: #000 !important; font-weight: bold; }
  .rdp-today .rdp-day_button { border-color: #ff780088; color: #ff9a3c; }
  .rdp-outside .rdp-day_button { color: #444; }
  .rdp-disabled .rdp-day_button { color: #333; cursor: not-allowed; }
`

interface DateTimePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  label?: string
  minDate?: Date
}

export function DateTimePicker({ value, onChange, label = 'Data e Hora de Encerramento', minDate }: DateTimePickerProps) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState<Date>(value ?? new Date())
  const [timeH, setTimeH] = useState(value ? value.getHours() : 23)
  const [timeM, setTimeM] = useState(value ? value.getMinutes() : 59)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Sincroniza hora/min quando value muda externamente
  useEffect(() => {
    if (value) {
      setTimeH(value.getHours())
      setTimeM(value.getMinutes())
      setMonth(value)
    }
  }, [value])

  function handleDaySelect(day: Date | undefined) {
    if (!day) { onChange(undefined); return }
    const merged = setSeconds(setMinutes(setHours(day, timeH), timeM), 0)
    onChange(merged)
  }

  function handleTimeChange(h: number, m: number) {
    const newH = Math.max(0, Math.min(23, h))
    const newM = Math.max(0, Math.min(59, m))
    setTimeH(newH)
    setTimeM(newM)
    if (value) {
      onChange(setSeconds(setMinutes(setHours(value, newH), newM), 0))
    }
  }

  const displayText = value
    ? format(value, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : 'Escolher data e hora...'

  return (
    <div className="relative" ref={popoverRef}>
      {/* Injetar estilos do react-day-picker */}
      <style>{dayPickerStyles}</style>

      <label className="text-[7px] text-[#aaa] block mb-1.5">{label}</label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 text-left text-[8px] p-2.5 bg-[#1a1825] border border-[#555] text-[#ffaa00] font-['Press_Start_2P'] hover:border-[#ff7800] transition-colors"
      >
        <CalendarIcon size={13} className="text-[#ff9a3c] shrink-0" />
        <span className={value ? 'text-[#ffcc66]' : 'text-[#555]'}>{displayText}</span>
      </button>

      {/* Popover Calendar */}
      {open && (
        <div
          className="absolute z-50 mt-1 left-0 bg-[#0e0d13] border-2 border-[#ff780066] shadow-[0_8px_32px_rgba(0,0,0,0.9)] p-3 min-w-[280px]"
          style={{ top: '100%' }}
        >
          {/* Calendar */}
          <DayPicker
            mode="single"
            selected={value}
            onSelect={handleDaySelect}
            month={month}
            onMonthChange={setMonth}
            locale={ptBR}
            disabled={minDate ? { before: minDate } : undefined}
            components={{
              PreviousMonthButton: (props) => (
                <button {...props} type="button" className="rdp-button_previous">
                  <ChevronLeft size={12} />
                </button>
              ),
              NextMonthButton: (props) => (
                <button {...props} type="button" className="rdp-button_next">
                  <ChevronRight size={12} />
                </button>
              ),
            }}
          />

          {/* Divisor */}
          <div className="border-t border-[#333] my-3" />

          {/* Time Picker */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-[7px] text-[#888]">HORA:</span>

            {/* Horas */}
            <input
              type="number"
              min={0}
              max={23}
              value={String(timeH).padStart(2, '0')}
              onChange={(e) => handleTimeChange(parseInt(e.target.value) || 0, timeM)}
              className="w-12 text-center text-[10px] py-1 bg-[#1a1825] border border-[#555] text-[#ffcc00] font-['Press_Start_2P'] focus:outline-none focus:border-[#ff7800]"
            />

            <span className="text-[#ff9a3c] text-sm font-bold">:</span>

            {/* Minutos */}
            <input
              type="number"
              min={0}
              max={59}
              value={String(timeM).padStart(2, '0')}
              onChange={(e) => handleTimeChange(timeH, parseInt(e.target.value) || 0)}
              className="w-12 text-center text-[10px] py-1 bg-[#1a1825] border border-[#555] text-[#ffcc00] font-['Press_Start_2P'] focus:outline-none focus:border-[#ff7800]"
            />

            <span className="text-[7px] text-[#888]">HH:MM</span>
          </div>

          {/* Atalhos rápidos */}
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#333] pt-3">
            <span className="text-[6px] text-[#666] w-full mb-1">ATALHOS:</span>
            {[
              { label: '+15min', mins: 15 },
              { label: '+30min', mins: 30 },
              { label: '+1h', mins: 60 },
              { label: '+2h', mins: 120 },
            ].map(({ label, mins }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  const base = value ?? new Date()
                  const next = new Date(base.getTime() + mins * 60 * 1000)
                  setTimeH(next.getHours())
                  setTimeM(next.getMinutes())
                  setMonth(next)
                  onChange(next)
                }}
                className="text-[7px] px-2 py-1 bg-[#1a1825] border border-[#ff780066] text-[#ff9a3c] hover:bg-[#2a1705] transition-colors font-['Press_Start_2P']"
              >
                {label}
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
            className="w-full mt-3 text-[8px] py-2 bg-[#ff7800] text-black font-['Press_Start_2P'] border-2 border-[#ffcc66] hover:bg-[#ff9a3c] transition-colors shadow-[0_2px_0_#803300]"
          >
            ✓ Confirmar
          </button>
        </div>
      )}
    </div>
  )
}
