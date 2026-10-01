// DatePickerTime — padrão exato shadcn/ui date-picker com time input
// Adaptado de https://ui.shadcn.com/docs/components/base/date-picker
import * as React from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronDownIcon } from 'lucide-react'
import { addMinutes } from 'date-fns'

import { Button } from '~/components/shadcn/button'
import { Calendar } from '~/components/shadcn/calendar'
import { Field, FieldGroup, FieldLabel } from '~/components/shadcn/field'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/shadcn/popover'
import { cn } from '~/lib/cn'

interface DateTimePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  label?: string
  minDate?: Date
  disabled?: boolean
}

export function DateTimePicker({ value, onChange, label, minDate, disabled = false }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Valor de hora no formato HH:MM para o input nativo
  const timeValue = value ? format(value, 'HH:mm') : '23:59'

  function handleDaySelect(day: Date | undefined) {
    if (!day) { onChange(undefined); setOpen(false); return }
    // Preserva a hora atual ao mudar o dia
    const [h, m] = timeValue.split(':').map(Number)
    const merged = new Date(day)
    merged.setHours(h, m, 0, 0)
    onChange(merged)
    setOpen(false)
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
        {/* Campo de Data */}
        <Field className="flex-1">
          <FieldLabel htmlFor="date-field" className="font-['Press_Start_2P']">
            DATA
          </FieldLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                id="date-field"
                variant="outline"
                disabled={disabled}
                className={cn(
                  'w-full justify-between font-normal text-[8px] font-["Press_Start_2P"]',
                  'bg-[#1a1825] border-[#555] text-left hover:bg-[#1a1825] hover:border-[#ff7800]',
                  'h-auto py-2.5 px-2.5',
                  !value && 'text-[#555]',
                  value && 'text-[#ffcc66]',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {value ? format(value, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar...'}
                <ChevronDownIcon className="h-3 w-3 text-[#ff9a3c] shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 border-2 border-[#ff7800] bg-[#0e0d13] shadow-[0_8px_32px_rgba(0,0,0,0.95)]"
              align="start"
            >
              <Calendar
                mode="single"
                selected={value}
                defaultMonth={value}
                onSelect={handleDaySelect}
                locale={ptBR}
                disabled={minDate ? { before: minDate } : undefined}
              />
            </PopoverContent>
          </Popover>
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
              'bg-[#1a1825] border border-[#555] text-[#ffcc00]',
              'focus:outline-none focus:border-[#ff7800]',
              'appearance-none',
              '[&::-webkit-calendar-picker-indicator]:hidden',
              '[&::-webkit-calendar-picker-indicator]:appearance-none',
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
              'text-[7px] px-2 py-1 bg-[#1a1825] border border-[#ff780055] text-[#ff9a3c] hover:bg-[#2a1705] transition-colors font-["Press_Start_2P"]',
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
          ✓ Encerramento: {format(value, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </div>
      )}
    </div>
  )
}
