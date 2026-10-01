// shadcn/ui — Calendar (react-day-picker v10)
import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import { ptBR } from 'date-fns/locale'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '~/lib/cn'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <div className="select-none p-3 bg-[#0e0d13] font-['Press_Start_2P']">
      <style>{`
        /* Reset e layout do DayPicker */
        .rdp-root {
          --rdp-accent-color: #ff7800;
          --rdp-accent-background-color: #2a1705;
          margin: 0;
          width: 100%;
        }
        .rdp-months {
          display: flex;
          flex-direction: column;
        }
        .rdp-month {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .rdp-month_caption {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 4px;
          height: 28px;
          position: relative;
        }
        .rdp-caption_label {
          font-family: 'Press Start 2P', monospace;
          font-size: 9px;
          color: #ffaa00;
          text-transform: capitalize;
          letter-spacing: 0.5px;
          margin: 0 auto;
        }
        .rdp-nav {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          pointer-events: none;
        }
        .rdp-button_previous, .rdp-button_next {
          pointer-events: auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: #1a1825;
          border: 1px solid #444;
          color: #ff9a3c;
          cursor: pointer;
          border-radius: 2px;
          transition: all 0.15s;
        }
        .rdp-button_previous:hover, .rdp-button_next:hover {
          background: #2a1705;
          border-color: #ff7800;
          color: #ffcc00;
          transform: translateY(-1px);
        }
        .rdp-button_previous:active, .rdp-button_next:active {
          transform: translateY(1px);
        }
        .rdp-month_grid {
          width: 100%;
          border-collapse: separate;
          border-spacing: 4px;
        }
        .rdp-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-bottom: 4px;
          border-bottom: 1px solid #222;
          padding-bottom: 6px;
        }
        .rdp-weekday {
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Press Start 2P', monospace;
          font-size: 8px;
          font-weight: normal;
          color: #888;
          text-align: center;
          height: 20px;
        }
        .rdp-weeks {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .rdp-week {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        .rdp-day {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rdp-day_button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          font-family: 'Press Start 2P', monospace;
          font-size: 8px;
          color: #ddd;
          background: #14121d;
          border: 1px solid #2a2a38;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.1s;
        }
        .rdp-day_button:hover {
          background: #2a1705;
          border-color: #ff780088;
          color: #ffaa00;
        }
        .rdp-selected .rdp-day_button {
          background: #ff7800 !important;
          border-color: #ffcc66 !important;
          color: #000 !important;
          font-weight: bold;
          box-shadow: 0 0 10px rgba(255, 120, 0, 0.6);
        }
        .rdp-today:not(.rdp-selected) .rdp-day_button {
          border-color: #ff7800;
          color: #ff9a3c;
        }
        .rdp-outside .rdp-day_button {
          color: #383548;
          background: transparent;
          border-color: transparent;
        }
        .rdp-outside .rdp-day_button:hover {
          color: #666;
          border-color: #222;
        }
        .rdp-disabled .rdp-day_button {
          color: #222;
          background: transparent;
          border-color: transparent;
          cursor: not-allowed;
          opacity: 0.3;
        }
      `}</style>

      <DayPicker
        showOutsideDays={showOutsideDays}
        locale={ptBR}
        formatters={{
          // Formata os dias da semana com 1 única letra limpa (D, S, T, Q, Q, S, S)
          formatWeekdayName: (date) => {
            const letter = format(date, 'EEEEE', { locale: ptBR })
            return letter.toUpperCase()
          },
          // Formata o mês no cabeçalho
          formatCaption: (date) => {
            return format(date, 'MMMM yyyy', { locale: ptBR })
          },
        }}
        components={{
          Chevron: ({ orientation }) =>
            orientation === 'left' ? (
              <ChevronLeft size={14} />
            ) : (
              <ChevronRight size={14} />
            ),
        }}
        {...props}
      />
    </div>
  )
}

Calendar.displayName = 'Calendar'
