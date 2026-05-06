// components/analytics/revenue-chart.tsx
"use client"
import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
)

const FONT        = "'Plus Jakarta Sans', system-ui, sans-serif"
const MUTED       = 'rgba(255,255,255,0.4)'
const GRID_COLOR  = 'rgba(255,255,255,0.05)'
const TEXT        = '#FFFFFF'
const GREEN       = '#22C55E'

interface RevenueChartProps {
  data: Array<{ date: string; revenue: number; transactions: number }>
  title?: string
}

export function RevenueChart({ data, title = 'Revenue Trend' }: RevenueChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { labels: [], datasets: [] }

    const labels = data.map((d) =>
      new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    )
    const revenueData = data.map((d) => d.revenue)

    return {
      labels,
      datasets: [
        {
          label: 'Revenue (DZD)',
          data: revenueData,
          borderColor: GREEN,
          backgroundColor: 'rgba(34,197,94,0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: GREEN,
          pointBorderColor: '#080B10',
          pointBorderWidth: 2,
        },
      ],
    }
  }, [data])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: title,
        color: TEXT,
        font: { size: 15, weight: 'bold' as const, family: FONT },
        padding: { bottom: 16 },
      },
      tooltip: {
        backgroundColor: 'rgba(8,11,16,0.95)',
        borderColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        titleColor: TEXT,
        bodyColor: MUTED,
        titleFont: { family: FONT },
        bodyFont: { family: FONT },
        callbacks: {
          label: (context: any) => `Revenue: ${context.parsed.y.toLocaleString()} DZD`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: MUTED, font: { family: FONT, size: 11 } },
        grid: { color: GRID_COLOR },
        border: { color: 'transparent' },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: MUTED,
          font: { family: FONT, size: 11 },
          callback: (value: any) => `${(value / 1000).toFixed(0)}K`,
        },
        grid: { color: GRID_COLOR },
        border: { color: 'transparent' },
      },
    },
  }

  if (!data || data.length === 0) {
    return (
      <div style={{
        height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: MUTED, fontFamily: FONT, fontSize: 14,
      }}>
        No revenue data available
      </div>
    )
  }

  return (
    <div style={{ height: 320 }}>
      <Line data={chartData} options={options} />
    </div>
  )
}