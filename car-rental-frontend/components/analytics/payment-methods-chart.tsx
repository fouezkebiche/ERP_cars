// components/analytics/payment-methods-chart.tsx
"use client"
import { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const FONT  = "'Plus Jakarta Sans', system-ui, sans-serif"
const MUTED = 'rgba(255,255,255,0.4)'
const TEXT  = '#FFFFFF'

interface PaymentMethodsChartProps {
  data: Array<{ method: string; amount: number; count: number }>
}

export function PaymentMethodsChart({ data }: PaymentMethodsChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { labels: [], datasets: [] }

    const labels = data.map((d) =>
      d.method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    )
    const amounts = data.map((d) => d.amount)

    return {
      labels,
      datasets: [
        {
          data: amounts,
          backgroundColor: [
            'rgba(59,130,246,0.85)',
            'rgba(34,197,94,0.85)',
            'rgba(245,158,11,0.85)',
            'rgba(239,68,68,0.85)',
            'rgba(139,92,246,0.85)',
          ],
          borderWidth: 2,
          borderColor: '#080B10',
        },
      ],
    }
  }, [data])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: MUTED,
          font: { family: FONT, size: 12 },
          padding: 16,
          boxWidth: 12,
          boxHeight: 12,
        },
      },
      title: {
        display: true,
        text: 'Payment Methods Distribution',
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
          label: (context: any) => {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${value.toLocaleString()} DZD (${percentage}%)`
          },
        },
      },
    },
  }

  if (!data || data.length === 0) {
    return (
      <div style={{
        height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: MUTED, fontFamily: FONT, fontSize: 14,
      }}>
        No payment method data available
      </div>
    )
  }

  return (
    <div style={{ height: 320 }}>
      <Doughnut data={chartData} options={options} />
    </div>
  )
}