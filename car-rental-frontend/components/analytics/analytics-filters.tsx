// components/analytics/analytics-filters.tsx
"use client"

import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, Filter, X } from 'lucide-react'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { useTranslations } from 'next-intl'

const FONT         = "'Plus Jakarta Sans', system-ui, sans-serif"
const SURFACE      = 'rgba(255,255,255,0.04)'
const BORDER_COLOR = 'rgba(255,255,255,0.07)'
const GREEN        = '#22C55E'
const MUTED        = 'rgba(255,255,255,0.4)'
const TEXT         = '#FFFFFF'

interface AnalyticsFiltersProps {
  onPeriodChange: (period: 'today' | 'week' | 'month' | 'quarter' | 'year') => void
  onDateRangeChange: (range: { start_date?: string; end_date?: string }) => void
  onMetricChange?: (metric: 'utilization' | 'revenue' | 'profit') => void
  currentPeriod: string
  showMetricFilter?: boolean
}

// ── Shared filter button ─────────────────────────────────────────────────────
function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 14px',
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: active ? GREEN : BORDER_COLOR,
        background: active ? `${GREEN}18` : 'transparent',
        color: active ? GREEN : MUTED,
        fontFamily: FONT,
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: active ? `0 0 8px ${GREEN}33` : 'none',
      }}
    >
      {children}
    </button>
  )
}

export function AnalyticsFilters({
  onPeriodChange,
  onDateRangeChange,
  onMetricChange,
  currentPeriod,
  showMetricFilter = false,
}: AnalyticsFiltersProps) {
  const t = useTranslations('analytics')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [selectedMetric, setSelectedMetric] = useState<'utilization' | 'revenue' | 'profit'>('utilization')

  const periods = [
    { value: 'today',   label: t('periodSelector.today') },
    { value: 'week',    label: t('periodSelector.week') },
    { value: 'month',   label: t('periodSelector.month') },
    { value: 'quarter', label: t('periodSelector.quarter') },
    { value: 'year',    label: t('periodSelector.year') },
  ]

  const metrics = [
    { value: 'utilization', label: 'Utilization' },
    { value: 'revenue',     label: 'Revenue' },
    { value: 'profit',      label: 'Profit' },
  ]

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range)
    if (range?.from && range?.to) {
      onDateRangeChange({
        start_date: format(range.from, 'yyyy-MM-dd'),
        end_date: format(range.to, 'yyyy-MM-dd'),
      })
    }
  }

  const clearDateRange = () => {
    setDateRange(undefined)
    onDateRangeChange({})
  }

  const handleMetricChange = (metric: 'utilization' | 'revenue' | 'profit') => {
    setSelectedMetric(metric)
    onMetricChange?.(metric)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: FONT }}>

      {/* Period selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: MUTED }}>
          <Filter style={{ width: 14, height: 14 }} />
          {t('periodSelector.period')}:
        </div>
        {periods.map((p) => (
          <FilterBtn
            key={p.value}
            active={currentPeriod === p.value}
            onClick={() => onPeriodChange(p.value as any)}
          >
            {p.label}
          </FilterBtn>
        ))}
      </div>

      {/* Custom date range */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Popover>
          <PopoverTrigger asChild>
            <button
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 14px',
                borderRadius: 8,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: dateRange ? GREEN : BORDER_COLOR,
                background: dateRange ? `${GREEN}12` : SURFACE,
                color: dateRange ? GREEN : MUTED,
                fontFamily: FONT,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <CalendarIcon style={{ width: 14, height: 14 }} />
              {dateRange?.from ? (
                dateRange.to
                  ? `${format(dateRange.from, 'LLL dd, y')} – ${format(dateRange.to, 'LLL dd, y')}`
                  : format(dateRange.from, 'LLL dd, y')
              ) : (
                'Custom Range'
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0"
            align="start"
            style={{ background: '#0F1318', border: `1px solid ${BORDER_COLOR}`, borderRadius: 12 }}
          >
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleDateRangeSelect}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {dateRange && (
          <button
            onClick={clearDateRange}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: 8,
              borderWidth: 1, borderStyle: 'solid', borderColor: BORDER_COLOR,
              background: 'transparent',
              color: MUTED,
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = '#EF4444'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#EF4444'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = MUTED
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = BORDER_COLOR
            }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>

      {/* Metric selector (optional) */}
      {showMetricFilter && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: MUTED }}>Metric:</div>
          {metrics.map((m) => (
            <FilterBtn
              key={m.value}
              active={selectedMetric === m.value}
              onClick={() => handleMetricChange(m.value as any)}
            >
              {m.label}
            </FilterBtn>
          ))}
        </div>
      )}
    </div>
  )
}