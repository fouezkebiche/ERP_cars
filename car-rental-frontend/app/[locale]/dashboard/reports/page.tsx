// app/[locale]/dashboard/reports/page.tsx
"use client"

import { useState } from "react"
import { BarChart3, Users, Car, Download, CheckCircle2, AlertCircle, Calendar, TrendingUp } from "lucide-react"
import { useReports } from "@/hooks/useReports"
import { ReportFilters } from "@/components/reports/ReportFilters"
import { ExportButtons } from "@/components/reports/ExportButtons"
import type { ReportType, ReportFilters as Filters } from "@/lib/reports"
import {
  ExecutiveSummaryView,
  VehiclePerformanceView,
  CustomerInsightsView,
} from "@/components/reports/ReportViews"
import { useTranslations } from "next-intl"

// ── Design tokens ────────────────────────────────────────────────────────────
const BG           = '#080B10'
const SURFACE      = 'rgba(255,255,255,0.04)'
const SURFACE2     = 'rgba(255,255,255,0.06)'
const BORDER_COLOR = 'rgba(255,255,255,0.08)'
const GREEN        = '#22C55E'
const MUTED        = 'rgba(255,255,255,0.38)'
const MUTED2       = 'rgba(255,255,255,0.6)'
const TEXT         = '#FFFFFF'
const FONT         = "'Plus Jakarta Sans', system-ui, sans-serif"

const PERIOD_LABELS: Record<string, string> = {
  today: 'Today', week: 'This Week', month: 'This Month',
  quarter: 'This Quarter', year: 'This Year',
}

const globalStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  @keyframes _spin { to { transform: rotate(360deg); } }
  @keyframes _fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
  @keyframes _shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
`

// ── Report type definitions ──────────────────────────────────────────────────
const REPORT_TYPES = [
  {
    type: 'executive' as ReportType,
    icon: BarChart3,
    label: 'Executive Summary',
    desc: 'Revenue, fleet & customer KPIs in one view',
    accent: '#22C55E',
    gradient: 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.04) 100%)',
  },
  {
    type: 'vehicle' as ReportType,
    icon: Car,
    label: 'Vehicle Performance',
    desc: 'Utilization rates, profit & maintenance alerts',
    accent: '#60A5FA',
    gradient: 'linear-gradient(135deg, rgba(96,165,250,0.12) 0%, rgba(96,165,250,0.04) 100%)',
  },
  {
    type: 'customer' as ReportType,
    icon: Users,
    label: 'Customer Insights',
    desc: 'Segments, retention & booking patterns',
    accent: '#A78BFA',
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(167,139,250,0.04) 100%)',
  },
]

export default function ReportsPage() {
  const t = useTranslations("reports")

  const [reportType, setReportType] = useState<ReportType>('executive')
  const [currentFilters, setCurrentFilters] = useState<Filters>({ period: 'month' })

  const {
    data: reportData,
    loading,
    error,
    generateReport,
    downloadPDF,
    downloadExcel,
    downloadJSON
  } = useReports()

  const handleGenerateReport = async () => {
    await generateReport(reportType, currentFilters)
  }

  const handleApplyFilters = (filters: Filters) => {
    setCurrentFilters(filters)
  }

  const handleResetFilters = () => {
    setCurrentFilters({ period: 'month' })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const hasCustomRange = !!(currentFilters.startDate && currentFilters.endDate)
  const periodLabel = hasCustomRange
    ? `${currentFilters.startDate} → ${currentFilters.endDate}`
    : PERIOD_LABELS[currentFilters.period ?? 'month'] ?? 'Month'

  const activeReportType = REPORT_TYPES.find(r => r.type === reportType)!

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading && !reportData) {
    return (
      <>
        <style>{globalStyle}</style>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', fontFamily: FONT,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48,
              border: `3px solid ${BORDER_COLOR}`,
              borderTopColor: GREEN,
              borderRadius: '50%',
              animation: '_spin 0.75s linear infinite',
              margin: '0 auto 16px',
            }} />
            <p style={{ color: MUTED, fontSize: 14, letterSpacing: '0.02em' }}>
              Generating report…
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{globalStyle}</style>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 0,
        paddingBottom: 80, fontFamily: FONT, color: TEXT,
      }}>

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', flexWrap: 'wrap',
          alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 20, marginBottom: 36,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.06))',
                border: `1px solid rgba(34,197,94,0.25)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TrendingUp style={{ width: 18, height: 18, color: GREEN }} />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: TEXT, margin: 0, letterSpacing: '-0.02em' }}>
                Reports
              </h1>
            </div>
            <p style={{ color: MUTED, fontSize: 13, margin: 0, paddingLeft: 46 }}>
              Generate, preview, and export detailed business reports
            </p>
          </div>

          {reportData && !error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 99,
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                fontSize: 12, color: GREEN, fontWeight: 600,
              }}>
                <CheckCircle2 style={{ width: 12, height: 12 }} />
                Ready
              </div>
              <ExportButtons
                onDownloadPDF={() => downloadPDF(reportType, currentFilters)}
                onDownloadExcel={() => downloadExcel(reportType, currentFilters)}
                onDownloadJSON={() => downloadJSON(reportType, currentFilters)}
                loading={loading}
              />
            </div>
          )}
        </div>

        {/* ── Main layout: sidebar + content ───────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: 24,
          alignItems: 'start',
        }}>

          {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 24 }}>

            {/* Report Type Selector */}
            <div style={{
              background: SURFACE,
              border: `1px solid ${BORDER_COLOR}`,
              borderRadius: 14,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '14px 18px',
                borderBottom: `1px solid ${BORDER_COLOR}`,
                fontSize: 11, fontWeight: 700, color: MUTED,
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                Report Type
              </div>
              <div style={{ padding: 8 }}>
                {REPORT_TYPES.map(rt => {
                  const Icon = rt.icon
                  const active = reportType === rt.type
                  return (
                    <button
                      key={rt.type}
                      onClick={() => setReportType(rt.type)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        width: '100%', padding: '12px 14px', borderRadius: 10,
                        border: `1px solid ${active ? `${rt.accent}40` : 'transparent'}`,
                        background: active ? rt.gradient : 'transparent',
                        cursor: 'pointer', transition: 'all 0.15s',
                        textAlign: 'left', fontFamily: FONT,
                        marginBottom: 2,
                      }}
                      onMouseEnter={e => {
                        if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)'
                      }}
                      onMouseLeave={e => {
                        if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                      }}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                        background: active ? `${rt.accent}18` : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${active ? `${rt.accent}35` : BORDER_COLOR}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}>
                        <Icon style={{ width: 16, height: 16, color: active ? rt.accent : MUTED }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 600,
                          color: active ? rt.accent : TEXT,
                          marginBottom: 2, transition: 'color 0.15s',
                        }}>
                          {rt.label}
                        </div>
                        <div style={{
                          fontSize: 11, color: active ? `${rt.accent}99` : MUTED,
                          lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {rt.desc}
                        </div>
                      </div>
                      {active && (
                        <div style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: rt.accent, flexShrink: 0,
                        }} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Period Summary Card */}
            <div style={{
              background: SURFACE,
              border: `1px solid ${BORDER_COLOR}`,
              borderRadius: 14,
              padding: '14px 18px',
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: MUTED,
                letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12,
              }}>
                Selected Period
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar style={{ width: 14, height: 14, color: activeReportType.accent, flexShrink: 0 }} />
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  color: activeReportType.accent,
                  background: `${activeReportType.accent}12`,
                  padding: '4px 10px', borderRadius: 6,
                  border: `1px solid ${activeReportType.accent}25`,
                }}>
                  {periodLabel}
                </span>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px 0', borderRadius: 12,
                border: 'none',
                background: loading
                  ? 'rgba(255,255,255,0.06)'
                  : `linear-gradient(135deg, ${activeReportType.accent}, ${activeReportType.accent}cc)`,
                color: loading ? MUTED : (activeReportType.type === 'executive' ? '#000' : '#fff'),
                fontFamily: FONT, fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : `0 4px 20px ${activeReportType.accent}40`,
                transition: 'all 0.2s',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={e => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = 'none'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 15, height: 15,
                    border: `2px solid rgba(255,255,255,0.2)`,
                    borderTopColor: 'rgba(255,255,255,0.7)',
                    borderRadius: '50%',
                    animation: '_spin 0.75s linear infinite',
                  }} />
                  Generating…
                </>
              ) : (
                <>
                  <Download style={{ width: 15, height: 15 }} />
                  Generate Report
                </>
              )}
            </button>

          </div>

          {/* ── RIGHT CONTENT ─────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Filters Panel */}
            <div style={{
              background: SURFACE,
              border: `1px solid ${BORDER_COLOR}`,
              borderRadius: 14,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '14px 20px',
                borderBottom: `1px solid ${BORDER_COLOR}`,
                fontSize: 11, fontWeight: 700, color: MUTED,
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                Filters & Date Range
              </div>
              <div style={{ padding: 20 }}>
                <ReportFilters onApply={handleApplyFilters} onReset={handleResetFilters} />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '14px 18px', borderRadius: 12,
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.2)',
                display: 'flex', gap: 10, alignItems: 'flex-start',
                animation: '_fadeUp 0.25s ease',
              }}>
                <AlertCircle style={{ width: 16, height: 16, color: '#EF4444', marginTop: 1, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#EF4444', margin: '0 0 4px' }}>
                    Report generation failed
                  </p>
                  <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>{error}</p>
                </div>
              </div>
            )}

            {/* Empty state (no report yet) */}
            {!reportData && !error && !loading && (
              <div style={{
                background: SURFACE,
                border: `1px solid ${BORDER_COLOR}`,
                borderRadius: 14,
                padding: '48px 24px',
                textAlign: 'center',
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, margin: '0 auto 16px',
                  background: activeReportType.gradient,
                  border: `1px solid ${activeReportType.accent}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {(() => { const Icon = activeReportType.icon; return <Icon style={{ width: 24, height: 24, color: activeReportType.accent }} /> })()}
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: TEXT, margin: '0 0 6px' }}>
                  No report generated yet
                </p>
                <p style={{ fontSize: 13, color: MUTED, margin: '0 0 20px' }}>
                  Configure your filters and click <strong style={{ color: MUTED2 }}>Generate Report</strong> to get started
                </p>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 99, fontSize: 12,
                    background: `${activeReportType.accent}10`,
                    border: `1px solid ${activeReportType.accent}25`,
                    color: activeReportType.accent, fontWeight: 500,
                  }}>
                    <Calendar style={{ width: 11, height: 11 }} />
                    {periodLabel}
                  </div>
                </div>
              </div>
            )}

            {/* Report Output */}
            {reportData && !error && (
              <div style={{ animation: '_fadeUp 0.3s ease' }}>

                {/* Report metadata bar */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  flexWrap: 'wrap', gap: 12,
                  padding: '12px 18px', borderRadius: 12, marginBottom: 20,
                  background: SURFACE2,
                  border: `1px solid ${BORDER_COLOR}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 style={{ width: 13, height: 13, color: GREEN }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>Report ready</span>
                    </div>
                    <div style={{ width: 1, height: 14, background: BORDER_COLOR }} />
                    <span style={{ fontSize: 12, color: MUTED }}>
                      {activeReportType.label}
                    </span>
                    <div style={{ width: 1, height: 14, background: BORDER_COLOR }} />
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: activeReportType.accent,
                      background: `${activeReportType.accent}12`,
                      padding: '2px 8px', borderRadius: 5,
                      border: `1px solid ${activeReportType.accent}25`,
                    }}>
                      {periodLabel}
                    </span>
                  </div>
                  <ExportButtons
                    onDownloadPDF={() => downloadPDF(reportType, currentFilters)}
                    onDownloadExcel={() => downloadExcel(reportType, currentFilters)}
                    onDownloadJSON={() => downloadJSON(reportType, currentFilters)}
                    loading={loading}
                  />
                </div>

                {/* View */}
                <div style={{
                  background: SURFACE,
                  border: `1px solid ${BORDER_COLOR}`,
                  borderRadius: 14,
                  padding: 24,
                }}>
                  {reportData.report_type === "executive_summary" && (
                    <ExecutiveSummaryView report={reportData as any} formatCurrency={formatCurrency} />
                  )}
                  {reportData.report_type === "vehicle_performance" && (
                    <VehiclePerformanceView report={reportData as any} formatCurrency={formatCurrency} />
                  )}
                  {reportData.report_type === "customer_insights" && (
                    <CustomerInsightsView report={reportData as any} formatCurrency={formatCurrency} />
                  )}
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}