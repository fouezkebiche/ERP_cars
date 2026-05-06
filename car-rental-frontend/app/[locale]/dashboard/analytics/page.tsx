// app/[locale]/dashboard/analytics/page.tsx
"use client"

import { useState } from 'react'
import { StatCard } from '@/components/analytics/stat-card'
import { DataTable } from '@/components/dashboard/data-table'
import { RevenueChart } from '@/components/analytics/revenue-chart'
import { PaymentMethodsChart } from '@/components/analytics/payment-methods-chart'
import { UtilizationChart } from '@/components/analytics/utilization-chart'
import { ContractsChart } from '@/components/analytics/contracts-chart'
import { AnalyticsFilters } from '@/components/analytics/analytics-filters'
import {
  useDashboard,
  useRevenue,
  useVehiclePerformance,
  useCustomerSegmentation,
  useContractAnalytics,
  usePaymentAnalytics
} from '@/hooks/useAnalytics'
import { useReports } from '@/hooks/useReports'
import type { ReportType, ReportFilters as AdvancedReportFilters } from '@/lib/reports'
import { ReportFilters } from '@/components/reports/ReportFilters'
import { ExportButtons } from '@/components/reports/ExportButtons'
import {
  ExecutiveSummaryView,
  VehiclePerformanceView,
  CustomerInsightsView,
} from '@/components/reports/ReportViews'
import {
  BarChart3,
  Users,
  Download,
  AlertCircle,
  DollarSign,
  Car,
  FileText,
  CheckCircle2,
  Calendar,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

// ── Design tokens ────────────────────────────────────────────────────────────
const BG           = '#080B10'
const SURFACE      = 'rgba(255,255,255,0.04)'
const SURFACE2     = 'rgba(255,255,255,0.07)'
const BORDER       = '1px solid rgba(255,255,255,0.07)'
const BORDER_COLOR = 'rgba(255,255,255,0.07)'
const GREEN        = '#22C55E'
const MUTED        = 'rgba(255,255,255,0.4)'
const TEXT         = '#FFFFFF'
const FONT         = "'Plus Jakarta Sans', system-ui, sans-serif"

const card: React.CSSProperties = {
  background: SURFACE, border: BORDER, borderRadius: 12, padding: 24, fontFamily: FONT,
}
const emptyBox: React.CSSProperties = {
  height: 320, display: 'flex', alignItems: 'center',
  justifyContent: 'center', color: MUTED, fontFamily: FONT,
}
const miniCard: React.CSSProperties = {
  background: SURFACE, border: BORDER, borderRadius: 12, padding: 24, fontFamily: FONT,
}

// ── Report type card styles ───────────────────────────────────────────────────
const reportCardBase: React.CSSProperties = {
  padding: 24, borderRadius: 12, borderWidth: 2, borderStyle: 'solid',
  borderColor: BORDER_COLOR, cursor: 'pointer', textAlign: 'center',
  transition: 'border-color 0.15s, background 0.15s, transform 0.15s',
  fontFamily: FONT, background: SURFACE, color: TEXT, width: '100%',
}
const reportCardActive: React.CSSProperties = {
  ...reportCardBase, background: GREEN, borderColor: GREEN,
  color: '#000', transform: 'scale(1.03)', boxShadow: `0 0 18px ${GREEN}55`,
}

// ── Period labels for the reports tab summary ─────────────────────────────────
const PERIOD_LABELS: Record<string, string> = {
  today: 'Today', week: 'This Week', month: 'This Month',
  quarter: 'This Quarter', year: 'This Year',
}

const globalStyle = `
  @keyframes _spin { to { transform: rotate(360deg); } }
  @keyframes _fade { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
`

export default function AnalyticsPage() {
  const t = useTranslations('analytics')

  // ── Analytics date range ──────────────────────────────────────────────────
  const [dateRange, setDateRange] = useState<{
    period: 'today' | 'week' | 'month' | 'quarter' | 'year'
    start_date?: string
    end_date?: string
  }>({ period: 'month' })

  const [vehicleMetric, setVehicleMetric] = useState<'utilization' | 'revenue' | 'profit'>('utilization')
  const [activeTab, setActiveTab] = useState('overview')

  // ── Reports tab: single source of truth for ALL report filter state ───────
  // BUG FIX: Previously `advancedFilters` defaulted to `{ period:'month' }` and
  // was only updated on "Apply Filters". So exports always sent 'month' regardless
  // of what the user selected. Now ONE state covers period + all advanced fields.
  const [reportType, setReportType]       = useState<ReportType>('executive')
  const [reportFilters, setReportFilters] = useState<AdvancedReportFilters>({ period: 'month' })

  const {
    data: reportData, loading: reportLoading, error: reportError,
    generateReport, downloadPDF, downloadExcel, downloadJSON,
  } = useReports()

  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useDashboard(dateRange)
  const { data: revenueData,   loading: revenueLoading }   = useRevenue({ ...dateRange, compare: true })
  const { data: vehicleData,   loading: vehicleLoading }   = useVehiclePerformance({ ...dateRange, metric: vehicleMetric, limit: 10 })
  const { data: customerData,  loading: customerLoading }  = useCustomerSegmentation()
  const { data: contractData,  loading: contractLoading }  = useContractAnalytics(dateRange)
  const { data: paymentData,   loading: paymentLoading }   = usePaymentAnalytics(dateRange)

  const isLoading = dashboardLoading || revenueLoading || vehicleLoading || customerLoading || contractLoading || paymentLoading

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-DZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)

  // ── Analytics filter handlers ─────────────────────────────────────────────
  const handlePeriodChange = (period: 'today' | 'week' | 'month' | 'quarter' | 'year') => {
    setDateRange({ period })
    // Sync with report filters for export functionality
    setReportFilters(prev => ({ ...prev, period }))
  }
  const handleDateRangeChange = (range: { start_date?: string; end_date?: string }) => {
    if (range.start_date && range.end_date) {
      setDateRange({ period: 'month', ...range })
      // Sync with report filters for export functionality
      setReportFilters(prev => ({ ...prev, startDate: range.start_date, endDate: range.end_date, period: undefined }))
    } else {
      setDateRange({ period: 'month' })
      // Sync with report filters for export functionality
      setReportFilters(prev => ({ ...prev, startDate: undefined, endDate: undefined, period: 'month' }))
    }
  }

  // ── Reports tab handlers — all read from `reportFilters` ─────────────────
  const handleReportPeriodChange = (period: AdvancedReportFilters['period']) => {
    setReportFilters(prev => ({ ...prev, period, startDate: undefined, endDate: undefined }))
  }
  const handleAdvancedFiltersApply = (filters: AdvancedReportFilters) => {
    setReportFilters(filters)
  }
  const handleAdvancedFiltersReset = () => {
    setReportFilters({ period: 'month' })
  }

  // Generate and exports all read from the same `reportFilters`
  const handleGenerateReport = () => generateReport(reportType, reportFilters)
  const handleDownloadPDF    = () => downloadPDF(reportType, reportFilters)
  const handleDownloadExcel  = () => downloadExcel(reportType, reportFilters)
  const handleDownloadJSON   = () => downloadJSON(reportType, reportFilters)

  // The "Export Report" button in the page header exports an executive PDF
  // using the current analytics dateRange — kept as-is (no change to logic)
  const handleExportReport = async () => {
    try {
      await downloadPDF(reportType, reportFilters)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  // ── Derived display ───────────────────────────────────────────────────────
  const hasCustomRange  = !!(reportFilters.startDate && reportFilters.endDate)
  const periodLabel     = hasCustomRange
    ? `${reportFilters.startDate} → ${reportFilters.endDate}`
    : PERIOD_LABELS[reportFilters.period ?? 'month'] ?? 'Month'

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <>
        <style>{globalStyle}</style>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:BG, fontFamily:FONT }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ width:56, height:56, border:`4px solid ${BORDER_COLOR}`, borderTopColor:GREEN, borderRadius:'50%', animation:'_spin 0.8s linear infinite', margin:'0 auto 16px' }} />
            <p style={{ color:MUTED, fontSize:14 }}>{t('loading')}</p>
          </div>
        </div>
      </>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (dashboardError) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:BG, fontFamily:FONT }}>
        <div style={{ textAlign:'center', maxWidth:400 }}>
          <AlertCircle style={{ width:56, height:56, color:'#EF4444', margin:'0 auto 16px' }} />
          <h2 style={{ fontSize:20, fontWeight:600, color:TEXT, marginBottom:8 }}>{t('failedTitle')}</h2>
          <p style={{ color:MUTED, marginBottom:20, fontSize:14 }}>{dashboardError}</p>
          <button onClick={() => window.location.reload()} style={{ padding:'10px 24px', borderRadius:8, border:`1px solid ${GREEN}`, background:'transparent', color:GREEN, fontFamily:FONT, fontSize:14, fontWeight:600, cursor:'pointer' }}>
            {t('retry')}
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { value:'overview',  label:t('tabs.overview') },
    { value:'revenue',   label:t('tabs.revenue') },
    { value:'vehicles',  label:t('tabs.vehicles') },
    { value:'contracts', label:t('tabs.contracts') },
    { value:'customers', label:t('tabs.customers') },
    { value:'reports',   label:t('tabs.reports') },
  ]

  return (
    <>
      <style>{globalStyle}</style>
      <div style={{ display:'flex', flexDirection:'column', gap:32, fontFamily:FONT, color:TEXT }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:16 }}>
          <div>
            <h1 style={{ fontSize:28, fontWeight:700, color:TEXT, marginBottom:6 }}>{t('title')}</h1>
            <p style={{ color:MUTED, fontSize:14 }}>{t('subtitle')}</p>
          </div>
          <button
            onClick={handleExportReport}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:8, background:GREEN, border:'none', color:'#000', fontFamily:FONT, fontSize:14, fontWeight:600, cursor:'pointer', boxShadow:`0 0 16px ${GREEN}55` }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#16a34a' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = GREEN }}
          >
            <Download style={{ width:16, height:16 }} />
            {t('exportReport')}
          </button>
        </div>

        {/* ── Analytics filters ──────────────────────────────────────────── */}
        <AnalyticsFilters
          onPeriodChange={handlePeriodChange}
          onDateRangeChange={handleDateRangeChange}
          onMetricChange={setVehicleMetric}
          currentPeriod={dateRange.period}
          showMetricFilter={false}
        />

        {/* ── KPI grid ──────────────────────────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16 }}>
          <StatCard title={t('kpi.totalRevenue')} value={`${formatCurrency(dashboardData?.revenue.total || 0)} DZD`} change={revenueData?.growth_percentage} icon={DollarSign} iconColor="text-green-600" subtitle={t('kpi.fromLastPeriod')} />
          <StatCard title={t('kpi.activeContracts')} value={dashboardData?.fleet.active_rentals || 0} icon={FileText} iconColor="text-blue-600" subtitle={`${dashboardData?.fleet.total_vehicles || 0} ${t('kpi.totalVehicles')}`} />
          <StatCard title={t('kpi.fleetUtilization')} value={`${(dashboardData?.fleet.average_utilization || 0).toFixed(1)}%`} icon={Car} iconColor="text-purple-600" subtitle={t('kpi.avgAcrossFleet')} />
          <StatCard title={t('kpi.totalCustomers')} value={dashboardData?.customers.total || 0} icon={Users} iconColor="text-orange-600" subtitle={`${dashboardData?.customers.new || 0} ${t('kpi.newThisPeriod')}`} />
        </div>

        {/* ── Tab bar ───────────────────────────────────────────────────── */}
        <div>
          <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${BORDER_COLOR}`, overflowX:'auto' }}>
            {tabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                style={{
                  padding:'10px 20px', background:'transparent', border:'none',
                  borderBottom: activeTab === tab.value ? `2px solid ${GREEN}` : '2px solid transparent',
                  color: activeTab === tab.value ? GREEN : MUTED,
                  fontFamily:FONT, fontSize:14, fontWeight: activeTab === tab.value ? 600 : 400,
                  cursor:'pointer', whiteSpace:'nowrap', transition:'color 0.15s', marginBottom:-1,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ────────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div style={{ display:'flex', flexDirection:'column', gap:24, paddingTop:24 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:24 }}>
                <div style={card}>{revenueData?.revenue_by_day?.length ? <RevenueChart data={revenueData.revenue_by_day} /> : <div style={emptyBox}>{t('noRevenueData')}</div>}</div>
                <div style={card}>{revenueData?.revenue_by_method?.length ? <PaymentMethodsChart data={revenueData.revenue_by_method} /> : <div style={emptyBox}>{t('noPaymentData')}</div>}</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:24 }}>
                <div style={card}>{vehicleData?.vehicles?.length ? <UtilizationChart data={vehicleData.vehicles} /> : <div style={emptyBox}>{t('noVehicleData')}</div>}</div>
                <div style={card}>{contractData?.by_status ? <ContractsChart data={contractData.by_status} /> : <div style={emptyBox}>{t('noContractData')}</div>}</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16 }}>
                {[
                  { label:t('overview.avgTransaction'), icon:<DollarSign style={{ width:18, height:18, color:GREEN }} />,       value:`${formatCurrency(revenueData?.average_transaction_value || 0)} DZD` },
                  { label:t('overview.retentionRate'),  icon:<Users      style={{ width:18, height:18, color:'#3B82F6' }} />,   value:`${(dashboardData?.customers.retention_rate || 0).toFixed(1)}%` },
                  { label:t('overview.completionRate'), icon:<FileText   style={{ width:18, height:18, color:'#A855F7' }} />,   value:`${(contractData?.completion_rate || 0).toFixed(1)}%` },
                ].map(item => (
                  <div key={item.label} style={miniCard}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <p style={{ fontSize:12, fontWeight:500, color:MUTED }}>{item.label}</p>
                      {item.icon}
                    </div>
                    <p style={{ fontSize:24, fontWeight:700, color:TEXT, marginTop:4 }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── REVENUE ─────────────────────────────────────────────────── */}
          {activeTab === 'revenue' && (
            <div style={{ display:'flex', flexDirection:'column', gap:24, paddingTop:24 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16 }}>
                <StatCard title={t('revenue.totalRevenue')} value={`${formatCurrency(revenueData?.total_revenue || 0)} DZD`} change={revenueData?.growth_percentage} subtitle={t('revenue.vsLastPeriod')} />
                <StatCard title={t('revenue.totalPayments')} value={revenueData?.payment_count || 0} subtitle={t('revenue.completedTransactions')} />
                <StatCard title={t('revenue.avgTransaction')} value={`${formatCurrency(revenueData?.average_transaction_value || 0)} DZD`} subtitle={t('revenue.perPayment')} />
              </div>
              <div style={card}>{revenueData?.revenue_by_day?.length ? <RevenueChart data={revenueData.revenue_by_day} title={t('revenue.revenueOverTime')} /> : <div style={emptyBox}>{t('noRevenueTrend')}</div>}</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:24 }}>
                <div style={card}>{revenueData?.revenue_by_method?.length ? <PaymentMethodsChart data={revenueData.revenue_by_method} /> : <div style={emptyBox}>{t('noPaymentMethod')}</div>}</div>
                <div style={card}>
                  <h3 style={{ fontSize:16, fontWeight:600, color:TEXT, marginBottom:16 }}>{t('revenue.paymentBreakdown')}</h3>
                  <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    {revenueData?.revenue_by_method?.map(method => (
                      <div key={method.method} style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                          <span style={{ fontWeight:500, color:TEXT }}>{method.method.replace('_',' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                          <span style={{ color:MUTED }}>{method.count} {t('revenue.payments')}</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ flex:1, height:6, background:BORDER_COLOR, borderRadius:99, overflow:'hidden' }}>
                            <div style={{ height:'100%', background:GREEN, borderRadius:99, width:`${(method.amount / (revenueData?.total_revenue || 1)) * 100}%` }} />
                          </div>
                          <span style={{ fontSize:13, fontWeight:500, color:TEXT }}>{formatCurrency(method.amount)} DZD</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── VEHICLES ────────────────────────────────────────────────── */}
          {activeTab === 'vehicles' && (
            <div style={{ display:'flex', flexDirection:'column', gap:24, paddingTop:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                <h3 style={{ fontSize:16, fontWeight:600, color:TEXT }}>{t('vehicles.performance')}</h3>
                <div style={{ display:'flex', gap:8 }}>
                  {(['utilization','revenue','profit'] as const).map(metric => (
                    <button key={metric} onClick={() => setVehicleMetric(metric)} style={{ padding:'6px 14px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:FONT, transition:'all 0.15s', background: vehicleMetric===metric ? GREEN : 'transparent', color: vehicleMetric===metric ? '#000' : MUTED, border: vehicleMetric===metric ? `1px solid ${GREEN}` : `1px solid ${BORDER_COLOR}`, boxShadow: vehicleMetric===metric ? `0 0 10px ${GREEN}44` : 'none' }}>
                      {t(`vehicles.${metric}` as any)}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:16 }}>
                <StatCard title={t('vehicles.fleetSize')} value={vehicleData?.fleet_summary.total_vehicles || 0} subtitle={t('vehicles.totalVehicles')} />
                <StatCard title={t('vehicles.avgUtilization')} value={`${(vehicleData?.fleet_summary.average_utilization || 0).toFixed(1)}%`} subtitle={t('vehicles.fleetWide')} />
                <StatCard title={t('vehicles.totalRentals')} value={vehicleData?.fleet_summary.total_rentals || 0} subtitle={t('vehicles.inPeriod')} />
                <StatCard title={t('vehicles.fleetRevenue')} value={`${formatCurrency(vehicleData?.fleet_summary.total_revenue || 0)} DZD`} subtitle={t('vehicles.totalEarned')} />
              </div>
              <div style={card}>{vehicleData?.vehicles?.length ? <UtilizationChart data={vehicleData.vehicles} limit={15} /> : <div style={emptyBox}>{t('noVehiclePerf')}</div>}</div>
              {vehicleData?.vehicles?.length && (
                <div style={{ background:SURFACE, border:BORDER, borderRadius:12, overflow:'hidden' }}>
                  <DataTable
                    columns={[
                      { key:'vehicle', label:t('vehicles.vehicle'), sortable:true, render:(_:any,row:any) => (<div><p style={{ fontWeight:500,color:TEXT,fontSize:14 }}>{row.brand} {row.model}</p><p style={{ fontSize:12,color:MUTED }}>{row.registration_number}</p></div>) },
                      { key:'utilization_rate', label:t('vehicles.utilization_col'), sortable:true, render:(value:number) => (<div style={{ display:'flex',alignItems:'center',gap:8 }}><div style={{ width:72,height:6,background:BORDER_COLOR,borderRadius:99,overflow:'hidden' }}><div style={{ height:'100%',background:GREEN,borderRadius:99,width:`${Math.min(value,100)}%` }} /></div><span style={{ fontSize:13,fontWeight:500,color:TEXT }}>{value.toFixed(1)}%</span></div>) },
                      { key:'rental_count', label:t('vehicles.rentals'), sortable:true },
                      { key:'total_revenue', label:t('vehicles.revenue'), sortable:true, render:(v:number) => `${formatCurrency(v)} DZD` },
                      { key:'revenue_per_day', label:t('vehicles.avgDay'), sortable:true, render:(v:number) => `${formatCurrency(v)} DZD` },
                      { key:'current_status', label:t('vehicles.status'), render:(value:string) => { const colors:Record<string,{bg:string;color:string}> = { available:{bg:'rgba(34,197,94,0.15)',color:'#22C55E'}, rented:{bg:'rgba(59,130,246,0.15)',color:'#60A5FA'} }; const s = colors[value] ?? {bg:'rgba(234,179,8,0.15)',color:'#EAB308'}; return <span style={{ display:'inline-flex',alignItems:'center',padding:'2px 10px',borderRadius:99,fontSize:12,fontWeight:500,background:s.bg,color:s.color }}>{value==='available'?t('vehicles.available'):value==='rented'?t('vehicles.rented'):value}</span> } },
                    ]}
                    data={vehicleData.vehicles}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── CONTRACTS ───────────────────────────────────────────────── */}
          {activeTab === 'contracts' && (
            <div style={{ display:'flex', flexDirection:'column', gap:24, paddingTop:24 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:16 }}>
                <StatCard title={t('contracts.totalContracts')} value={contractData?.total_contracts || 0} subtitle={t('contracts.allTime')} />
                <StatCard title={t('contracts.activeNow')} value={contractData?.by_status.active || 0} subtitle={t('contracts.currentlyActive')} />
                <StatCard title={t('contracts.completed')} value={contractData?.by_status.completed || 0} subtitle={t('contracts.successfullyFinished')} />
                <StatCard title={t('contracts.completionRate')} value={`${(contractData?.completion_rate || 0).toFixed(1)}%`} subtitle={t('contracts.successRate')} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:24 }}>
                <div style={card}>{contractData?.by_status ? <ContractsChart data={contractData.by_status} /> : <div style={emptyBox}>{t('noContractData')}</div>}</div>
                <div style={card}>
                  <h3 style={{ fontSize:16, fontWeight:600, color:TEXT, marginBottom:24 }}>{t('contracts.metrics')}</h3>
                  <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:13 }}><span style={{ fontWeight:500,color:TEXT }}>{t('contracts.avgValue')}</span><span style={{ color:MUTED }}>{formatCurrency(contractData?.avg_contract_value || 0)} DZD</span></div>
                      <div style={{ height:6, background:BORDER_COLOR, borderRadius:99 }}><div style={{ height:'100%', width:'75%', background:'#3B82F6', borderRadius:99 }} /></div>
                    </div>
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:13 }}><span style={{ fontWeight:500,color:TEXT }}>{t('contracts.avgDuration')}</span><span style={{ color:MUTED }}>{contractData?.avg_duration_days || 0} {t('contracts.days')}</span></div>
                      <div style={{ height:6, background:BORDER_COLOR, borderRadius:99 }}><div style={{ height:'100%', width:'50%', background:GREEN, borderRadius:99 }} /></div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, paddingTop:8 }}>
                      {[
                        { label:t('contracts.active'),    value:contractData?.by_status.active    || 0, color:'#3B82F6', bg:'rgba(59,130,246,0.1)' },
                        { label:t('contracts.completed'), value:contractData?.by_status.completed  || 0, color:GREEN,     bg:'rgba(34,197,94,0.1)'  },
                        { label:t('contracts.cancelled'), value:contractData?.by_status.cancelled  || 0, color:'#EF4444', bg:'rgba(239,68,68,0.1)'  },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign:'center', padding:'14px 8px', borderRadius:10, background:s.bg }}>
                          <p style={{ fontSize:24, fontWeight:700, color:s.color, margin:0 }}>{s.value}</p>
                          <p style={{ fontSize:12, color:MUTED, marginTop:4 }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── CUSTOMERS ───────────────────────────────────────────────── */}
          {activeTab === 'customers' && (
            <div style={{ display:'flex', flexDirection:'column', gap:24, paddingTop:24 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:16 }}>
                <StatCard title={t('customers.totalCustomers')} value={customerData?.total_customers || 0} subtitle={t('customers.allCustomers')} />
                <StatCard title={t('customers.vipCustomers')} value={customerData?.segments.vip.count || 0} subtitle={`${formatCurrency(customerData?.segments.vip.total_value || 0)} ${t('customers.value')}`} />
                <StatCard title={t('customers.newCustomers')} value={dashboardData?.customers.new || 0} subtitle={t('customers.thisPeriod')} />
                <StatCard title={t('customers.retentionRate')} value={`${(dashboardData?.customers.retention_rate || 0).toFixed(1)}%`} subtitle={t('customers.customerLoyalty')} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:16 }}>
                {[
                  { title:t('customers.vip'),         data:customerData?.segments.vip,          accent:'#A855F7' },
                  { title:t('customers.highValue'),   data:customerData?.segments.high_value,   accent:'#3B82F6' },
                  { title:t('customers.mediumValue'), data:customerData?.segments.medium_value, accent:GREEN     },
                  { title:t('customers.lowValue'),    data:customerData?.segments.low_value,    accent:MUTED     },
                ].map(seg => (
                  <div key={seg.title} style={{ background:SURFACE, border:`1px solid ${seg.accent}33`, borderRadius:12, padding:24 }}>
                    <p style={{ fontSize:13, fontWeight:500, color:seg.accent, marginBottom:8 }}>{seg.title}</p>
                    <p style={{ fontSize:30, fontWeight:700, color:TEXT, margin:0 }}>{seg.data?.count || 0}</p>
                    <p style={{ fontSize:12, color:MUTED, marginTop:4 }}>{formatCurrency(seg.data?.total_value || 0)} DZD</p>
                  </div>
                ))}
              </div>
              {customerData?.segments.vip.customers?.length && (
                <div style={{ background:SURFACE, border:BORDER, borderRadius:12, overflow:'hidden' }}>
                  <div style={{ padding:'20px 24px', borderBottom:BORDER }}>
                    <h3 style={{ fontSize:16, fontWeight:600, color:TEXT, margin:0 }}>{t('customers.topVip')}</h3>
                  </div>
                  <DataTable
                    columns={[
                      { key:'full_name', label:t('customers.customer'), sortable:true, render:(value:string,row:any) => (<div><p style={{ fontWeight:500,color:TEXT,fontSize:14 }}>{value}</p><p style={{ fontSize:12,color:MUTED }}>{row.email}</p></div>) },
                      { key:'customer_type', label:t('customers.type'), sortable:true, render:(value:string) => <span style={{ textTransform:'capitalize',color:TEXT }}>{value}</span> },
                      { key:'total_rentals', label:t('customers.rentals'), sortable:true },
                      { key:'lifetime_value', label:t('customers.lifetimeValue'), sortable:true, render:(value:string) => `${formatCurrency(parseFloat(value))} DZD` },
                    ]}
                    data={customerData.segments.vip.customers}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── REPORTS ─────────────────────────────────────────────────── */}
          {activeTab === 'reports' && (
            <div style={{ display:'flex', flexDirection:'column', gap:28, paddingTop:24 }}>

              {/* Sub-header with live filter summary */}
              <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:16 }}>
                <div>
                  <h2 style={{ fontSize:20, fontWeight:700, color:TEXT, margin:0 }}>{t('reports.title')}</h2>
                  <p style={{ color:MUTED, fontSize:13, marginTop:4 }}>{t('reports.subtitle')}</p>
                </div>
                {/* Live filter pill */}
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 14px', borderRadius:99, background:SURFACE2, border:`1px solid ${BORDER_COLOR}`, fontSize:12 }}>
                  <Calendar style={{ width:13, height:13, color:GREEN }} />
                  <span style={{ color:TEXT, fontWeight:600 }}>{reportType.charAt(0).toUpperCase() + reportType.slice(1)}</span>
                  <span style={{ color:MUTED }}>·</span>
                  <span style={{ color:GREEN, fontWeight:600 }}>{periodLabel}</span>
                </div>
              </div>

              {/* Report type cards */}
              <div>
                <h3 style={{ fontSize:14, fontWeight:600, color:MUTED, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:14 }}>{t('reports.selectType')}</h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:14 }}>
                  {[
                    { type:'executive' as ReportType, icon:<BarChart3 style={{ width:28,height:28,margin:'0 auto 12px' }} />, label:t('reports.executive'),       desc:t('reports.executiveDesc'),       accent:'#22C55E' },
                    { type:'vehicle'   as ReportType, icon:<Car        style={{ width:28,height:28,margin:'0 auto 12px' }} />, label:t('reports.vehiclePerf'),    desc:t('reports.vehiclePerfDesc'),     accent:'#60A5FA' },
                    { type:'customer'  as ReportType, icon:<Users      style={{ width:28,height:28,margin:'0 auto 12px' }} />, label:t('reports.customerInsights'), desc:t('reports.customerInsightsDesc'), accent:'#A855F7' },
                  ].map(rt => {
                    const active = reportType === rt.type
                    return (
                      <button
                        key={rt.type}
                        onClick={() => setReportType(rt.type)}
                        style={{
                          textAlign:'center', padding:20, borderRadius:12, cursor:'pointer',
                          borderWidth: active ? 2 : 1, borderStyle:'solid',
                          borderColor: active ? rt.accent : BORDER_COLOR,
                          background: active ? `${rt.accent}10` : SURFACE,
                          color: active ? rt.accent : TEXT,
                          transition:'all 0.15s', fontFamily:FONT,
                          boxShadow: active ? `0 0 16px ${rt.accent}22` : 'none',
                        }}
                      >
                        {rt.icon}
                        <div style={{ fontWeight:600, fontSize:15 }}>{rt.label}</div>
                        <div style={{ fontSize:11, marginTop:6, color: active ? rt.accent : MUTED, opacity:0.8 }}>{rt.desc}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Period quick-select */}
              <div>
                <h3 style={{ fontSize:14, fontWeight:600, color:MUTED, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:14 }}>Period</h3>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {(['today','week','month','quarter','year'] as const).map(p => {
                    const active = reportFilters.period === p && !hasCustomRange
                    return (
                      <button
                        key={p}
                        onClick={() => handleReportPeriodChange(p)}
                        style={{
                          padding:'8px 16px', borderRadius:8, cursor:'pointer', fontFamily:FONT, fontSize:13, fontWeight: active ? 600 : 400,
                          borderWidth:1, borderStyle:'solid',
                          borderColor: active ? GREEN : BORDER_COLOR,
                          background: active ? `${GREEN}12` : SURFACE,
                          color: active ? GREEN : MUTED,
                          transition:'all 0.15s',
                          boxShadow: active ? `0 0 10px ${GREEN}22` : 'none',
                        }}
                      >
                        {PERIOD_LABELS[p]}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Advanced filters */}
              <div>
                <h3 style={{ fontSize:14, fontWeight:600, color:MUTED, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:14 }}>Advanced Filters</h3>
                <ReportFilters onApply={handleAdvancedFiltersApply} onReset={handleAdvancedFiltersReset} />
              </div>

              {/* Generate + export row */}
              <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:12 }}>
                <button
                  onClick={handleGenerateReport}
                  disabled={reportLoading}
                  style={{
                    display:'inline-flex', alignItems:'center', gap:8,
                    padding:'11px 24px', borderRadius:8, border:'none',
                    background: reportLoading ? BORDER_COLOR : GREEN,
                    color: reportLoading ? MUTED : '#000',
                    fontFamily:FONT, fontSize:14, fontWeight:600,
                    cursor: reportLoading ? 'not-allowed' : 'pointer',
                    boxShadow: reportLoading ? 'none' : `0 0 16px ${GREEN}44`,
                    transition:'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!reportLoading) (e.currentTarget as HTMLButtonElement).style.background = '#16a34a' }}
                  onMouseLeave={e => { if (!reportLoading) (e.currentTarget as HTMLButtonElement).style.background = reportLoading ? BORDER_COLOR : GREEN }}
                >
                  {reportLoading
                    ? <div style={{ width:15,height:15,border:`2px solid ${MUTED}`,borderTopColor:TEXT,borderRadius:'50%',animation:'_spin 0.8s linear infinite' }} />
                    : <Download style={{ width:15, height:15 }} />}
                  {reportLoading ? t('reports.generating') : t('reports.generate')}
                </button>

                {/* Export buttons appear once report exists */}
                {reportData && !reportError && (
                  <ExportButtons
                    onDownloadPDF={handleDownloadPDF}
                    onDownloadExcel={handleDownloadExcel}
                    onDownloadJSON={handleDownloadJSON}
                    loading={reportLoading}
                  />
                )}
              </div>

              {/* Error */}
              {reportError && (
                <div style={{ padding:14, borderRadius:8, borderLeft:'3px solid #EF4444', background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)', borderLeftWidth:3 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <AlertCircle style={{ width:16, height:16, color:'#EF4444' }} />
                    <span style={{ fontWeight:600, color:'#EF4444', fontSize:14 }}>{t('reports.error')}</span>
                  </div>
                  <p style={{ fontSize:13, color:MUTED, margin:0 }}>{reportError}</p>
                </div>
              )}

              {/* Report output */}
              {reportData && !reportError && (
                <div style={{ animation:'_fade 0.3s ease', display:'flex', flexDirection:'column', gap:28 }}>
                  {/* Ready bar */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, padding:'12px 18px', borderRadius:10, background:SURFACE2, border:`1px solid ${BORDER_COLOR}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <CheckCircle2 style={{ width:14, height:14, color:GREEN }} />
                      <span style={{ fontSize:13, fontWeight:600, color:TEXT }}>Report ready</span>
                      <span style={{ fontSize:12, color:MUTED }}>· {reportType} · {periodLabel}</span>
                    </div>
                    <ExportButtons
                      onDownloadPDF={handleDownloadPDF}
                      onDownloadExcel={handleDownloadExcel}
                      onDownloadJSON={handleDownloadJSON}
                      loading={reportLoading}
                    />
                  </div>

                  {reportData.report_type === 'executive_summary'   && <ExecutiveSummaryView  report={reportData as any} formatCurrency={formatCurrency} />}
                  {reportData.report_type === 'vehicle_performance'  && <VehiclePerformanceView report={reportData as any} formatCurrency={formatCurrency} />}
                  {reportData.report_type === 'customer_insights'    && <CustomerInsightsView  report={reportData as any} formatCurrency={formatCurrency} />}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}