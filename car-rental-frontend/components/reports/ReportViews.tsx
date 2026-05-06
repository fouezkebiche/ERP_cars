// components/reports/ReportViews.tsx
"use client"

import { useState } from "react"
import {
  BarChart3,
  Users,
  Car,
  AlertCircle,
  LineChart,
  PieChart,
  TrendingUp,
} from "lucide-react"
import { KPICard } from "@/components/dashboard/kpi-card"
import { DataTable } from "@/components/dashboard/data-table"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2"
import type { ExecutiveReport, VehicleReport, CustomerReport } from "@/lib/reports"

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend, Filler,
)

// ── Design tokens ────────────────────────────────────────────────────────────
const FONT         = "'Plus Jakarta Sans', system-ui, sans-serif"
const SURFACE      = 'rgba(255,255,255,0.04)'
const BORDER_COLOR = 'rgba(255,255,255,0.07)'
const GREEN        = '#22C55E'
const MUTED        = 'rgba(255,255,255,0.4)'
const GRID_COLOR   = 'rgba(255,255,255,0.05)'
const TEXT         = '#FFFFFF'
const BG           = '#080B10'

// ── Chart theme helpers ──────────────────────────────────────────────────────
const tooltipDefaults = {
  backgroundColor: 'rgba(8,11,16,0.96)',
  borderColor: BORDER_COLOR,
  borderWidth: 1,
  titleColor: TEXT,
  bodyColor: MUTED,
  titleFont: { family: FONT, size: 13 },
  bodyFont: { family: FONT, size: 12 },
  padding: 12,
}

const axisDefaults = {
  ticks: { color: MUTED, font: { family: FONT, size: 11 } },
  grid: { color: GRID_COLOR },
  border: { color: 'transparent' },
}

// ── Shared layout components ─────────────────────────────────────────────────
const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: SURFACE,
  border: `1px solid ${BORDER_COLOR}`,
  borderRadius: 12,
  overflow: 'hidden',
  fontFamily: FONT,
  ...extra,
})

function SectionCard({ title, icon, children, extra }: {
  title?: React.ReactNode
  icon?: React.ReactNode
  children: React.ReactNode
  extra?: React.ReactNode
}) {
  return (
    <div style={card()}>
      {title && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: `1px solid ${BORDER_COLOR}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: TEXT }}>
            {icon}
            {title}
          </div>
          {extra}
        </div>
      )}
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  )
}

function ChartToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 12px', borderRadius: 8,
        borderWidth: 1, borderStyle: 'solid',
        borderColor: active ? GREEN : BORDER_COLOR,
        background: active ? `${GREEN}18` : 'transparent',
        color: active ? GREEN : MUTED,
        fontFamily: FONT, fontSize: 12, fontWeight: active ? 600 : 400,
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

interface WithFormatter<T> {
  report: T
  formatCurrency: (v: number) => string
}

// ============================================================================
// EXECUTIVE SUMMARY VIEW
// ============================================================================

export function ExecutiveSummaryView({ report, formatCurrency }: WithFormatter<ExecutiveReport>) {
  const [revenueChartType, setRevenueChartType] = useState<'bar' | 'line'>('line')
  const [paymentChartType, setPaymentChartType] = useState<'pie' | 'doughnut'>('doughnut')

  const revenueChartData = report.trends && report.trends.length > 0
    ? {
        labels: report.trends.map((t) =>
          new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        ),
        datasets: [{
          label: 'Daily Revenue (DZD)',
          data: report.trends.map((t) => t.revenue),
          borderColor: GREEN,
          backgroundColor: revenueChartType === 'bar' ? `${GREEN}cc` : `${GREEN}12`,
          borderWidth: revenueChartType === 'line' ? 2 : 1,
          fill: revenueChartType === 'line',
          tension: 0.4,
          pointRadius: revenueChartType === 'line' ? 4 : 0,
          pointHoverRadius: 6,
          pointBackgroundColor: GREEN,
          pointBorderColor: BG,
          pointBorderWidth: 2,
          borderRadius: revenueChartType === 'bar' ? 6 : 0,
        }],
      }
    : null

  const revenueChartOptions: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true, position: 'top' as const,
        labels: { color: MUTED, font: { family: FONT, size: 12 }, padding: 12 },
      },
      title: {
        display: true, text: 'Revenue Trend Analysis', color: TEXT,
        font: { size: 15, weight: 'bold' as const, family: FONT },
        padding: { bottom: 16 },
      },
      tooltip: {
        ...tooltipDefaults,
        callbacks: { label: (ctx: any) => `Revenue: ${formatCurrency(ctx.parsed.y)} DA` },
      },
    },
    scales: {
      x: { ...axisDefaults, grid: { display: false } },
      y: {
        ...axisDefaults, beginAtZero: true,
        ticks: { ...axisDefaults.ticks, callback: (v: any) => `${formatCurrency(v)} DA` },
      },
    },
  }

  const paymentChartData = report.revenue_breakdown?.by_method?.length
    ? {
        labels: report.revenue_breakdown.by_method.map((m) =>
          m.method.charAt(0).toUpperCase() + m.method.slice(1)
        ),
        datasets: [{
          data: report.revenue_breakdown.by_method.map((m) => m.amount),
          backgroundColor: ['rgba(59,130,246,0.85)', 'rgba(34,197,94,0.85)', 'rgba(245,158,11,0.85)', 'rgba(239,68,68,0.85)', 'rgba(139,92,246,0.85)'],
          borderColor: BG,
          borderWidth: 2,
          hoverOffset: 8,
        }],
      }
    : null

  const paymentChartOptions: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true, position: 'right' as const,
        labels: {
          color: MUTED, font: { family: FONT, size: 12 }, padding: 14,
          generateLabels: (chart: any) => {
            const data = chart.data
            if (!data.labels?.length) return []
            return data.labels.map((label: string, i: number) => {
              const value = data.datasets[0].data[i]
              const total = data.datasets[0].data.reduce((a: number, b: number) => a + b, 0)
              const pct = ((value / total) * 100).toFixed(1)
              return {
                text: `${label} (${pct}%)`,
                fillStyle: data.datasets[0].backgroundColor[i],
                index: i,
              }
            })
          },
        },
      },
      title: {
        display: true, text: 'Revenue by Payment Method', color: TEXT,
        font: { size: 15, weight: 'bold' as const, family: FONT },
        padding: { bottom: 16 },
      },
      tooltip: {
        ...tooltipDefaults,
        callbacks: {
          label: (ctx: any) => {
            const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const pct = ((ctx.parsed / total) * 100).toFixed(1)
            return `${ctx.label}: ${formatCurrency(ctx.parsed)} DA (${pct}%)`
          },
        },
      },
    },
  }

  const fleetChartData = report.fleet_overview
    ? {
        labels: ['Available', 'Rented', 'Maintenance'],
        datasets: [{
          data: [report.fleet_overview.available, report.fleet_overview.active_rentals, report.fleet_overview.maintenance],
          backgroundColor: ['rgba(34,197,94,0.85)', 'rgba(59,130,246,0.85)', 'rgba(245,158,11,0.85)'],
          borderColor: BG,
          borderWidth: 2,
          hoverOffset: 8,
        }],
      }
    : null

  const fleetChartOptions: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true, position: 'bottom' as const,
        labels: { color: MUTED, font: { family: FONT, size: 12 }, padding: 14 },
      },
      title: {
        display: true, text: 'Fleet Status Distribution', color: TEXT,
        font: { size: 15, weight: 'bold' as const, family: FONT },
        padding: { bottom: 16 },
      },
      tooltip: {
        ...tooltipDefaults,
        callbacks: {
          label: (ctx: any) => {
            const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const pct = ((ctx.parsed / total) * 100).toFixed(1)
            return `${ctx.label}: ${ctx.parsed} vehicles (${pct}%)`
          },
        },
      },
    },
  }

  return (
    <>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: TEXT, fontFamily: FONT, margin: 0 }}>Executive Summary</h2>
        <span style={{ fontSize: 13, color: MUTED, fontFamily: FONT }}>
          {new Date(report.period.start).toLocaleDateString()} – {new Date(report.period.end).toLocaleDateString()}
        </span>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, margin: '20px 0 32px' }}>
        <KPICard label="Total Revenue" value={formatCurrency(report.summary.total_revenue)} suffix="DZD" trend={report.summary.revenue_growth} />
        <KPICard label="Fleet Utilization" value={`${report.summary.fleet_utilization.toFixed(1)}%`} />
        <KPICard label="Active Customers" value={report.summary.active_customers} />
        <KPICard label="Maintenance Alerts" value={report.summary.maintenance_alerts} />
      </div>

      {/* Revenue trend chart (full width) */}
      {revenueChartData && (
        <SectionCard
          title="Revenue Trend"
          icon={<TrendingUp style={{ width: 16, height: 16, color: GREEN }} />}
          extra={
            <div style={{ display: 'flex', gap: 6 }}>
              <ChartToggleBtn active={revenueChartType === 'line'} onClick={() => setRevenueChartType('line')}>
                <LineChart style={{ width: 13, height: 13 }} /> Line
              </ChartToggleBtn>
              <ChartToggleBtn active={revenueChartType === 'bar'} onClick={() => setRevenueChartType('bar')}>
                <BarChart3 style={{ width: 13, height: 13 }} /> Bar
              </ChartToggleBtn>
            </div>
          }
        >
          <div style={{ height: 320 }}>
            {revenueChartType === 'line'
              ? <Line data={revenueChartData} options={revenueChartOptions} />
              : <Bar  data={revenueChartData} options={revenueChartOptions} />}
          </div>
        </SectionCard>
      )}

      {/* Payment + Fleet charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginTop: 24 }}>
        {paymentChartData && (
          <SectionCard
            title="Payment Methods"
            icon={<PieChart style={{ width: 16, height: 16, color: MUTED }} />}
            extra={
              <div style={{ display: 'flex', gap: 6 }}>
                <ChartToggleBtn active={paymentChartType === 'pie'}     onClick={() => setPaymentChartType('pie')}>Pie</ChartToggleBtn>
                <ChartToggleBtn active={paymentChartType === 'doughnut'} onClick={() => setPaymentChartType('doughnut')}>Doughnut</ChartToggleBtn>
              </div>
            }
          >
            <div style={{ height: 280 }}>
              {paymentChartType === 'pie'
                ? <Pie     data={paymentChartData} options={paymentChartOptions} />
                : <Doughnut data={paymentChartData} options={paymentChartOptions} />}
            </div>
          </SectionCard>
        )}

        {fleetChartData && (
          <SectionCard
            title="Fleet Status"
            icon={<Car style={{ width: 16, height: 16, color: MUTED }} />}
          >
            <div style={{ height: 280 }}>
              <Doughnut data={fleetChartData} options={fleetChartOptions} />
            </div>
          </SectionCard>
        )}
      </div>

      {/* Top vehicles table */}
      {report.top_vehicles.length > 0 && (
        <div style={{ ...card(), marginTop: 24 }}>
          <div style={{ padding: '18px 24px', borderBottom: `1px solid ${BORDER_COLOR}`, fontSize: 15, fontWeight: 600, color: TEXT }}>
            Top Performing Vehicles
          </div>
          <DataTable
            columns={[
              { key: 'vehicle',           label: 'Vehicle',      render: (_: any, row: any) => `${row.brand} ${row.model}` },
              { key: 'registration_number', label: 'Registration' },
              { key: 'utilization_rate',  label: 'Utilization',  render: (v: number) => `${v.toFixed(1)}%` },
              { key: 'total_revenue',     label: 'Revenue',      render: (v: number) => `${formatCurrency(v)} DZD` },
            ]}
            data={report.top_vehicles}
          />
        </div>
      )}

      {/* Top customers table */}
      {report.top_customers.length > 0 && (
        <div style={{ ...card(), marginTop: 24 }}>
          <div style={{ padding: '18px 24px', borderBottom: `1px solid ${BORDER_COLOR}`, fontSize: 15, fontWeight: 600, color: TEXT }}>
            Top Customers
          </div>
          <DataTable
            columns={[
              { key: 'name',           label: 'Name' },
              { key: 'type',           label: 'Type' },
              { key: 'total_rentals',  label: 'Rentals' },
              { key: 'lifetime_value', label: 'Lifetime Value', render: (v: number) => `${formatCurrency(v)} DZD` },
            ]}
            data={report.top_customers}
          />
        </div>
      )}
    </>
  )
}

// ============================================================================
// VEHICLE PERFORMANCE VIEW
// ============================================================================

export function VehiclePerformanceView({ report, formatCurrency }: WithFormatter<VehicleReport>) {
  const [utilizationChartType, setUtilizationChartType] = useState<'bar' | 'line'>('bar')

  const utilizationChartData = report.top_performers?.length
    ? {
        labels: report.top_performers.slice(0, 10).map((v: any) => `${v.brand} ${v.model}\n${v.registration_number}`),
        datasets: [{
          label: 'Utilization Rate (%)',
          data: report.top_performers.slice(0, 10).map((v: any) => v.utilization_rate),
          backgroundColor: report.top_performers.slice(0, 10).map((v: any) => {
            if (v.utilization_rate >= 80) return 'rgba(34,197,94,0.8)'
            if (v.utilization_rate >= 60) return 'rgba(59,130,246,0.8)'
            if (v.utilization_rate >= 40) return 'rgba(245,158,11,0.8)'
            return 'rgba(239,68,68,0.8)'
          }),
          borderWidth: 0,
          borderRadius: 6,
        }],
      }
    : null

  const utilizationChartOptions: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true, text: 'Top 10 Vehicles by Utilization Rate', color: TEXT,
        font: { size: 15, weight: 'bold' as const, family: FONT },
        padding: { bottom: 16 },
      },
      tooltip: {
        ...tooltipDefaults,
        callbacks: { label: (ctx: any) => `Utilization: ${ctx.parsed.y.toFixed(1)}%` },
      },
    },
    scales: {
      x: { ...axisDefaults, grid: { display: false }, ticks: { ...axisDefaults.ticks, maxRotation: 45, minRotation: 45, font: { family: FONT, size: 10 } } },
      y: { ...axisDefaults, beginAtZero: true, max: 100, ticks: { ...axisDefaults.ticks, callback: (v: any) => `${v}%` } },
    },
  }

  const profitChartData = report.top_performers?.length
    ? {
        labels: report.top_performers.slice(0, 10).map((v: any) => `${v.brand} ${v.model}`),
        datasets: [
          {
            label: 'Revenue (DZD)',
            data: report.top_performers.slice(0, 10).map((v: any) => v.total_revenue),
            backgroundColor: 'rgba(59,130,246,0.75)',
            borderColor: '#3B82F6',
            borderWidth: 1,
            borderRadius: 6,
          },
          {
            label: 'Profit (DZD)',
            data: report.top_performers.slice(0, 10).map((v: any) => v.profit),
            backgroundColor: 'rgba(34,197,94,0.75)',
            borderColor: GREEN,
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      }
    : null

  const profitChartOptions: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true, position: 'top' as const,
        labels: { color: MUTED, font: { family: FONT, size: 12 }, padding: 12 },
      },
      title: {
        display: true, text: 'Revenue vs Profit Analysis', color: TEXT,
        font: { size: 15, weight: 'bold' as const, family: FONT },
        padding: { bottom: 16 },
      },
      tooltip: {
        ...tooltipDefaults,
        callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)} DA` },
      },
    },
    scales: {
      x: { ...axisDefaults, grid: { display: false }, ticks: { ...axisDefaults.ticks, maxRotation: 45, minRotation: 45, font: { family: FONT, size: 10 } } },
      y: { ...axisDefaults, beginAtZero: true, ticks: { ...axisDefaults.ticks, callback: (v: any) => `${formatCurrency(v)} DA` } },
    },
  }

  return (
    <>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: TEXT, fontFamily: FONT, marginBottom: 20 }}>Vehicle Performance Report</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        <KPICard label="Total Revenue"   value={formatCurrency(report.fleet_summary.total_revenue)}  suffix="DZD" />
        <KPICard label="Total Profit"    value={formatCurrency(report.fleet_summary.total_profit)}   suffix="DZD" />
        <KPICard label="Profit Margin"   value={`${report.fleet_summary.profit_margin.toFixed(1)}%`} />
        <KPICard label="Avg Utilization" value={`${report.fleet_summary.average_utilization.toFixed(1)}%`} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {utilizationChartData && (
          <SectionCard
            title="Vehicle Utilization"
            icon={<BarChart3 style={{ width: 16, height: 16, color: MUTED }} />}
            extra={
              <div style={{ display: 'flex', gap: 6 }}>
                <ChartToggleBtn active={utilizationChartType === 'bar'}  onClick={() => setUtilizationChartType('bar')}>
                  <BarChart3 style={{ width: 13, height: 13 }} /> Bar
                </ChartToggleBtn>
                <ChartToggleBtn active={utilizationChartType === 'line'} onClick={() => setUtilizationChartType('line')}>
                  <LineChart style={{ width: 13, height: 13 }} /> Line
                </ChartToggleBtn>
              </div>
            }
          >
            <div style={{ height: 380 }}>
              {utilizationChartType === 'bar'
                ? <Bar  data={utilizationChartData} options={utilizationChartOptions} />
                : <Line data={{
                    ...utilizationChartData,
                    datasets: [{
                      ...utilizationChartData.datasets[0],
                      backgroundColor: 'rgba(59,130,246,0.1)',
                      borderColor: '#3B82F6',
                      borderWidth: 2,
                      fill: true,
                      tension: 0.4,
                      pointRadius: 4,
                    }],
                  }} options={utilizationChartOptions} />}
            </div>
          </SectionCard>
        )}

        {profitChartData && (
          <SectionCard
            title="Revenue & Profit Analysis"
            icon={<TrendingUp style={{ width: 16, height: 16, color: GREEN }} />}
          >
            <div style={{ height: 380 }}>
              <Bar data={profitChartData} options={profitChartOptions} />
            </div>
          </SectionCard>
        )}

        {report.top_performers.length > 0 && (
          <div style={card()}>
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${BORDER_COLOR}`, fontSize: 15, fontWeight: 600, color: TEXT }}>
              Top Performers
            </div>
            <DataTable
              columns={[
                { key: 'vehicle',             label: 'Vehicle',      render: (_: any, row: any) => `${row.brand} ${row.model}` },
                { key: 'registration_number', label: 'Registration' },
                { key: 'utilization_rate',    label: 'Utilization',  render: (v: number) => `${v.toFixed(1)}%` },
                { key: 'total_revenue',       label: 'Revenue',      render: (v: number) => `${formatCurrency(v)} DZD` },
                { key: 'profit',              label: 'Profit',       render: (v: number) => `${formatCurrency(v)} DZD` },
              ]}
              data={report.top_performers}
            />
          </div>
        )}

        {report.maintenance_alerts.length > 0 && (
          <div style={card()}>
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${BORDER_COLOR}`, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: TEXT }}>
              <AlertCircle style={{ width: 16, height: 16, color: '#F59E0B' }} />
              Maintenance Alerts
            </div>
            <DataTable
              columns={[
                { key: 'vehicle',         label: 'Vehicle' },
                { key: 'registration',    label: 'Registration' },
                { key: 'current_mileage', label: 'Current KM', render: (v: number) => v.toLocaleString() + ' km' },
                {
                  key: 'km_overdue',
                  label: 'Status',
                  render: (v: number) => (
                    <span style={{ color: v > 0 ? '#EF4444' : GREEN, fontWeight: 600, fontSize: 13 }}>
                      {v > 0 ? `${v} km overdue` : 'On Time'}
                    </span>
                  ),
                },
              ]}
              data={report.maintenance_alerts}
            />
          </div>
        )}
      </div>
    </>
  )
}

// ============================================================================
// CUSTOMER INSIGHTS VIEW
// ============================================================================

export function CustomerInsightsView({ report, formatCurrency }: WithFormatter<CustomerReport>) {
  const [segmentChartType, setSegmentChartType] = useState<'bar' | 'doughnut'>('bar')

  const seg = report.customer_segmentation

  const segmentChartData = {
    labels: ['VIP', 'High Value', 'Medium Value', 'Low Value'],
    datasets: [{
      label: 'Customer Count',
      data: [seg.segments.vip.count, seg.segments.high_value.count, seg.segments.medium_value.count, seg.segments.low_value.count],
      backgroundColor: ['rgba(139,92,246,0.8)', 'rgba(59,130,246,0.8)', 'rgba(34,197,94,0.8)', 'rgba(245,158,11,0.8)'],
      borderColor: BG,
      borderWidth: segmentChartType === 'doughnut' ? 2 : 0,
      borderRadius: segmentChartType === 'bar' ? 8 : 0,
      hoverOffset: segmentChartType === 'doughnut' ? 6 : 0,
    }],
  }

  const segmentBarOptions: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true, text: 'Customer Segmentation Distribution', color: TEXT,
        font: { size: 15, weight: 'bold' as const, family: FONT }, padding: { bottom: 16 },
      },
      tooltip: {
        ...tooltipDefaults,
        callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.parsed.y} customers` },
      },
    },
    scales: {
      x: { ...axisDefaults, grid: { display: false } },
      y: { ...axisDefaults, beginAtZero: true },
    },
  }

  const segmentDoughnutOptions: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true, position: 'right' as const,
        labels: { color: MUTED, font: { family: FONT, size: 12 }, padding: 14 },
      },
      title: {
        display: true, text: 'Customer Segmentation Distribution', color: TEXT,
        font: { size: 15, weight: 'bold' as const, family: FONT }, padding: { bottom: 16 },
      },
      tooltip: {
        ...tooltipDefaults,
        callbacks: {
          label: (ctx: any) => {
            const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const pct = ((ctx.parsed / total) * 100).toFixed(1)
            return `${ctx.label}: ${ctx.parsed} customers (${pct}%)`
          },
        },
      },
    },
  }

  const bookingPatternsData = report.booking_patterns?.by_weekday
    ? {
        labels: report.booking_patterns.by_weekday.map((d) => d.day),
        datasets: [{
          label: 'Number of Bookings',
          data: report.booking_patterns.by_weekday.map((d) => d.count),
          backgroundColor: 'rgba(139,92,246,0.75)',
          borderColor: '#8B5CF6',
          borderWidth: 1,
          borderRadius: 8,
        }],
      }
    : null

  const bookingPatternsOptions: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true, text: 'Booking Patterns by Day of Week', color: TEXT,
        font: { size: 15, weight: 'bold' as const, family: FONT }, padding: { bottom: 16 },
      },
      tooltip: { ...tooltipDefaults },
    },
    scales: {
      x: { ...axisDefaults, grid: { display: false } },
      y: { ...axisDefaults, beginAtZero: true },
    },
  }

  const segmentTiles = [
    { label: 'VIP Customers', data: seg.segments.vip,          accent: '#A855F7' },
    { label: 'High Value',    data: seg.segments.high_value,   accent: '#3B82F6' },
    { label: 'Medium Value',  data: seg.segments.medium_value, accent: GREEN },
    { label: 'New Customers', data: seg.segments.low_value,    accent: '#F59E0B' },
  ]

  return (
    <>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: TEXT, fontFamily: FONT, marginBottom: 20 }}>Customer Insights Report</h2>

      {/* Segment KPI tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {segmentTiles.map(({ label, data, accent }) => (
          <div key={label} style={{
            background: `${accent}10`,
            border: `1px solid ${accent}33`,
            borderRadius: 12, padding: 24, fontFamily: FONT,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: accent }}>{label}</p>
              <Users style={{ width: 16, height: 16, color: accent }} />
            </div>
            <p style={{ fontSize: 28, fontWeight: 700, color: TEXT, margin: 0 }}>{data.count}</p>
            <p style={{ fontSize: 12, color: accent, marginTop: 6, opacity: 0.8 }}>{formatCurrency(data.total_value)} DZD total</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        <SectionCard
          title="Customer Segments"
          icon={<Users style={{ width: 16, height: 16, color: MUTED }} />}
          extra={
            <div style={{ display: 'flex', gap: 6 }}>
              <ChartToggleBtn active={segmentChartType === 'bar'}      onClick={() => setSegmentChartType('bar')}>
                <BarChart3 style={{ width: 13, height: 13 }} /> Bar
              </ChartToggleBtn>
              <ChartToggleBtn active={segmentChartType === 'doughnut'} onClick={() => setSegmentChartType('doughnut')}>
                <PieChart style={{ width: 13, height: 13 }} /> Doughnut
              </ChartToggleBtn>
            </div>
          }
        >
          <div style={{ height: 280 }}>
            {segmentChartType === 'bar'
              ? <Bar      data={segmentChartData} options={segmentBarOptions} />
              : <Doughnut data={segmentChartData} options={segmentDoughnutOptions} />}
          </div>
        </SectionCard>

        {bookingPatternsData && (
          <SectionCard
            title="Booking Patterns"
            icon={<BarChart3 style={{ width: 16, height: 16, color: MUTED }} />}
          >
            <div style={{ height: 280 }}>
              <Bar data={bookingPatternsData} options={bookingPatternsOptions} />
            </div>
          </SectionCard>
        )}
      </div>

      {/* Retention metrics */}
      <div style={{ ...card(), marginTop: 24 }}>
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${BORDER_COLOR}`, fontSize: 15, fontWeight: 600, color: TEXT }}>
          Retention Metrics
        </div>
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {[
            { label: 'New Customers',    value: report.retention_metrics.new_customers,                    accent: '#3B82F6' },
            { label: 'Repeat Customers', value: report.retention_metrics.repeat_customers,                 accent: GREEN },
            { label: 'Retention Rate',   value: `${report.retention_metrics.retention_rate.toFixed(1)}%`, accent: '#A855F7' },
          ].map(({ label, value, accent }) => (
            <div key={label} style={{
              textAlign: 'center', padding: 24, borderRadius: 10,
              background: `${accent}10`, border: `1px solid ${accent}33`,
            }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: accent, marginBottom: 8 }}>{label}</p>
              <p style={{ fontSize: 32, fontWeight: 700, color: TEXT, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}