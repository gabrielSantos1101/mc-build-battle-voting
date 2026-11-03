import { addMinutes, format, parse } from 'date-fns'
import * as React from 'react'

import { Field, FieldGroup, FieldLabel } from '~/components/ui'
import { cn } from '~/lib/cn'

interface DateTimePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  label?: string
  minDate?: Date
  disabled?: boolean
}

function toInputDate(date: Date | undefined) {
  return date ? format(date, 'yyyy-MM-dd') : ''
}

export function DateTimePicker({ value, onChange, label, minDate, disabled = false }: DateTimePickerProps) {
  const timeValue = value ? format(value, 'HH:mm') : '23:59'
  const minDateValue = minDate ? format(minDate, 'yyyy-MM-dd') : undefined

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    if (!raw) {
      onChange(undefined)
      return
    }
    const [h, m] = timeValue.split(':').map(Number)
    const merged = parse(raw, 'yyyy-MM-dd', new Date())
    merged.setHours(h, m, 0, 0)
    onChange(merged)
  }

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const [h, m] = e.target.value.split(':').map(Number)
    const base = value ?? new Date()
    const merged = new Date(base)
    merged.setHours(h, m, 0, 0)
    onChange(merged)
  }

  function applyQuickAdd(mins: number) {
    const next = addMinutes(value ?? new Date(), mins)
    onChange(next)
  }

  return (
    <div>
      {label && (
        <p className="text-[7px] text-[#aaa] font-['Press_Start_2P'] mb-2">{label}</p>
      )}

      <FieldGroup className="flex-row items-end gap-2">
        {/* Campo de Data (calendário nativo) */}
        <Field className="flex-1">
          <FieldLabel htmlFor="date-field" className="font-['Press_Start_2P']">
            DATA
          </FieldLabel>
          <input
            id="date-field"
            type="date"
            value={toInputDate(value)}
            min={minDateValue}
            onChange={handleDateChange}
            disabled={disabled}
            className={cn(
              'w-full text-[8px] py-2.5 px-2.5 font-["Press_Start_2P"]',
              'bg-obsidian-light border border-[#555] text-[#ffcc66]',
              'focus:outline-none focus:border-pumpkin',
              '[color-scheme:dark]',
              '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
              !value && 'text-[#555]',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
        </Field>

        {/* Campo de Hora (input nativo type="time") */}
        <Field className="w-32">
          <FieldLabel htmlFor="time-field" className="font-['Press_Start_2P']">
            HORA
          </FieldLabel>
          <input
            id="time-field"
            type="time"
            value={timeValue}
            onChange={handleTimeChange}
            disabled={disabled}
            className={cn(
              'w-full text-[9px] py-2.5 px-2 font-["Press_Start_2P"]',
              'bg-obsidian-light border border-[#555] text-[#ffcc00]',
              'focus:outline-none focus:border-pumpkin',
              '[color-scheme:dark]',
              '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
        </Field>
      </FieldGroup>

      {/* Atalhos rápidos */}
      <div className="flex flex-wrap gap-1.5 mt-2">
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
            disabled={disabled}
            className={cn(
              'text-[7px] px-2 py-1 bg-obsidian-light border border-[#ff780055] text-pumpkin-light hover:bg-[#2a1705] transition-colors font-["Press_Start_2P"]',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {lbl}
          </button>
        ))}
        {value && !disabled && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-[7px] px-2 py-1 bg-[#200] border border-[#600] text-[#f66] hover:bg-[#300] transition-colors font-['Press_Start_2P'] ml-auto"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Preview do valor final */}
      {value && (
        <div className="mt-2 text-[7px] text-[#00ff88] font-['Press_Start_2P'] flex items-center gap-1.5">
          ✓ Encerramento: {format(value, "dd/MM/yyyy 'às' HH:mm")}
        </div>
      )}
    </div>
  )
}
