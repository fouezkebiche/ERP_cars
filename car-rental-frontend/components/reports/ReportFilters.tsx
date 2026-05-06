// components/reports/ReportFilters.tsx
"use client"

import { useState } from "react"
import { Calendar, Filter, X } from "lucide-react"
import { ReportFilters as Filters } from "@/lib/reports"

const FONT         = "'Plus Jakarta Sans', system-ui, sans-serif"
const SURFACE      = 'rgba(255,255,255,0.04)'
const SURFACE2     = 'rgba(255,255,255,0.07)'
const BORDER_COLOR = 'rgba(255,255,255,0.07)'
const GREEN        = '#22C55E'
const MUTED        = 'rgba(255,255,255,0.4)'
const TEXT         = '#FFFFFF'

// ── Reusable sub-components ──────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontSize: 13, fontWeight: 600, color: MUTED,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      marginBottom: 12, fontFamily: FONT,
    }}>
      {children}
    </h3>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: 'block', fontSize: 12, fontWeight: 500,
      color: MUTED, marginBottom: 6, fontFamily: FONT,
      textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>
      {children}
    </label>
  )
}

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        padding: '8px 12px',
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: BORDER_COLOR,
        background: SURFACE2,
        color: TEXT,
        fontFamily: FONT,
        fontSize: 13,
        outline: 'none',
        boxSizing: 'border-box',
        ...props.style,
      }}
      onFocus={e => { e.currentTarget.style.borderColor = GREEN; e.currentTarget.style.boxShadow = `0 0 0 2px ${GREEN}22` }}
      onBlur={e => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.boxShadow = 'none' }}
    />
  )
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 14px', borderRadius: 8,
        borderWidth: 1, borderStyle: 'solid',
        borderColor: active ? GREEN : BORDER_COLOR,
        background: active ? `${GREEN}18` : 'transparent',
        color: active ? GREEN : MUTED,
        fontFamily: FONT, fontSize: 13,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer', transition: 'all 0.15s',
        boxShadow: active ? `0 0 8px ${GREEN}33` : 'none',
      }}
    >
      {children}
    </button>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

interface ReportFiltersProps {
  onApply: (filters: Filters) => void
  onReset: () => void
}

export function ReportFilters({ onApply, onReset }: ReportFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({ period: 'month' })

  const handleApply = () => {
    onApply(filters)
    setShowFilters(false)
  }

  const handleReset = () => {
    setFilters({ period: 'month' })
    onReset()
    setShowFilters(false)
  }

  const periods = ['today', 'week', 'month', 'quarter', 'year'] as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: FONT }}>

      {/* Toggle button */}
      <div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 8,
            borderWidth: 1, borderStyle: 'solid',
            borderColor: showFilters ? GREEN : BORDER_COLOR,
            background: showFilters ? `${GREEN}12` : SURFACE,
            color: showFilters ? GREEN : MUTED,
            fontFamily: FONT, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          <Filter style={{ width: 14, height: 14 }} />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div style={{
          background: SURFACE,
          border: `1px solid ${BORDER_COLOR}`,
          borderRadius: 12,
          padding: 24,
          display: 'flex', flexDirection: 'column', gap: 28,
        }}>

          {/* Date Range */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Calendar style={{ width: 15, height: 15, color: MUTED }} />
              <SectionTitle>Date Range</SectionTitle>
            </div>

            {/* Period presets */}
            <div style={{ marginBottom: 16 }}>
              <FieldLabel>Quick Select</FieldLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {periods.map((period) => (
                  <FilterBtn
                    key={period}
                    active={filters.period === period && !filters.startDate}
                    onClick={() => setFilters({ ...filters, period, startDate: undefined, endDate: undefined })}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </FilterBtn>
                ))}
              </div>
            </div>

            {/* Custom date inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <FieldLabel>Start Date</FieldLabel>
                <StyledInput
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value, period: undefined })}
                />
              </div>
              <div>
                <FieldLabel>End Date</FieldLabel>
                <StyledInput
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value, period: undefined })}
                />
              </div>
            </div>
          </div>

          {/* Revenue Range */}
          <div>
            <SectionTitle>Revenue Range (DZD)</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <FieldLabel>Minimum</FieldLabel>
                <StyledInput
                  type="number"
                  placeholder="0"
                  value={filters.minRevenue || ''}
                  onChange={(e) => setFilters({ ...filters, minRevenue: parseFloat(e.target.value) || undefined })}
                />
              </div>
              <div>
                <FieldLabel>Maximum</FieldLabel>
                <StyledInput
                  type="number"
                  placeholder="1000000"
                  value={filters.maxRevenue || ''}
                  onChange={(e) => setFilters({ ...filters, maxRevenue: parseFloat(e.target.value) || undefined })}
                />
              </div>
            </div>
          </div>

          {/* Utilization Rate */}
          <div>
            <SectionTitle>Utilization Rate (%)</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <FieldLabel>Minimum</FieldLabel>
                <StyledInput
                  type="number"
                  placeholder="0"
                  min="0"
                  max="100"
                  value={filters.minUtilization || ''}
                  onChange={(e) => setFilters({ ...filters, minUtilization: parseFloat(e.target.value) || undefined })}
                />
              </div>
              <div>
                <FieldLabel>Maximum</FieldLabel>
                <StyledInput
                  type="number"
                  placeholder="100"
                  min="0"
                  max="100"
                  value={filters.maxUtilization || ''}
                  onChange={(e) => setFilters({ ...filters, maxUtilization: parseFloat(e.target.value) || undefined })}
                />
              </div>
            </div>
          </div>

          {/* Customer Type */}
          <div>
            <SectionTitle>Customer Type</SectionTitle>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { label: 'All',        value: undefined },
                { label: 'Individual', value: 'individual' as const },
                { label: 'Corporate',  value: 'corporate' as const },
              ].map(({ label, value }) => (
                <FilterBtn
                  key={label}
                  active={filters.customerType === value}
                  onClick={() => setFilters({ ...filters, customerType: value })}
                >
                  {label}
                </FilterBtn>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <SectionTitle>Sort By</SectionTitle>
            <select
              value={filters.sortBy || 'profit'}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: BORDER_COLOR,
                background: SURFACE2,
                color: TEXT,
                fontFamily: FONT,
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="profit">Profit</option>
              <option value="revenue">Revenue</option>
              <option value="utilization">Utilization</option>
            </select>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex', gap: 10,
            paddingTop: 20,
            borderTop: `1px solid ${BORDER_COLOR}`,
          }}>
            <button
              onClick={handleApply}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 8,
                border: 'none', background: GREEN, color: '#000',
                fontFamily: FONT, fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
                boxShadow: `0 0 14px ${GREEN}44`,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#16a34a' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = GREEN }}
            >
              Apply Filters
            </button>
            <button
              onClick={handleReset}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 20px', borderRadius: 8,
                borderWidth: 1, borderStyle: 'solid', borderColor: BORDER_COLOR,
                background: 'transparent', color: MUTED,
                fontFamily: FONT, fontSize: 14, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.borderColor = '#EF4444'
                el.style.color = '#EF4444'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.borderColor = BORDER_COLOR
                el.style.color = MUTED
              }}
            >
              <X style={{ width: 14, height: 14 }} />
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  )
}