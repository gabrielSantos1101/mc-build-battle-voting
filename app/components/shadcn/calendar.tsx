// shadcn/ui — Calendar (react-day-picker v10)
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <div className="w-[300px] select-none p-3.5 bg-obsidian text-[#e0e0e0] font-sans">
      <style>{`
        .admin-calendar {
          --rdp-accent-color: #ff7800;
          --rdp-accent-background-color: #2a1705;
          margin: 0;
          width: 100%;
        }
        .admin-calendar .rdp-months {
          width: 100%;
        }
        .admin-calendar .rdp-month {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .admin-calendar .rdp-month_caption {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 32px;
          position: relative;
          padding: 0 4px;
        }
        .admin-calendar .rdp-caption_label {
          font-size: 14px;
          font-weight: 600;
          color: #ffaa00;
          text-transform: capitalize;
          margin: 0 auto;
        }
        .admin-calendar .rdp-nav {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          pointer-events: none;
        }
        .admin-calendar .rdp-button_previous,
        .admin-calendar .rdp-button_next {
          pointer-events: auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: #1a1825;
          border: 1px solid #3c3850;
          color: #ff9a3c;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .admin-calendar .rdp-button_previous:hover,
        .admin-calendar .rdp-button_next:hover {
          background: #2a1705;
          border-color: #ff7800;
          color: #ffcc00;
        }
        .admin-calendar .rdp-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-bottom: 2px;
          border-bottom: 1px solid #222030;
          padding-bottom: 8px;
        }
        .admin-calendar .rdp-weekday {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 500;
          color: #8e8a9f;
          text-transform: capitalize;
          height: 20px;
        }
        .admin-calendar .rdp-weeks {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .admin-calendar .rdp-week {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        .admin-calendar .rdp-day {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .admin-calendar .rdp-day_button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          font-size: 13px;
          font-weight: 500;
          color: #e6e6e6;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .admin-calendar .rdp-day_button:hover {
          background: #252033;
          border-color: #ff780066;
          color: #ffaa00;
        }
        .admin-calendar .rdp-selected .rdp-day_button {
          background: #ff7800 !important;
          border-color: #ffaa33 !important;
          color: #000000 !important;
          font-weight: 700;
          box-shadow: 0 0 12px rgba(255, 120, 0, 0.4);
        }
        .admin-calendar .rdp-today:not(.rdp-selected) .rdp-day_button {
          border-color: #ff7800aa;
          color: #ff9a3c;
          font-weight: 600;
        }
        .admin-calendar .rdp-outside .rdp-day_button {
          color: #4a4658;
        }
        .admin-calendar .rdp-outside .rdp-day_button:hover {
          color: #777;
          background: #181524;
        }
        .admin-calendar .rdp-disabled .rdp-day_button {
          color: #2a2836;
          cursor: not-allowed;
          opacity: 0.3;
        }
      `}</style>

      <DayPicker
        className="admin-calendar"
        showOutsideDays={showOutsideDays}
        locale={ptBR}
        components={{
          Chevron: ({ orientation }) =>
            orientation === 'left' ? (
              <ChevronLeft size={16} />
            ) : (
              <ChevronRight size={16} />
            ),
        }}
        {...props}
      />
    </div>
  )
}

Calendar.displayName = 'Calendar'
