// components/analytics/payment-methods-chart.tsx
"use client"

import { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

interface PaymentMethodsChartProps {
  data: Array<{ method: string; amount: number; count: number }>
}

export function PaymentMethodsChart({ data }: PaymentMethodsChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: [],
      }
    }

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
            'rgb(59, 130, 246)',
            'rgb(16, 185, 129)',
            'rgb(245, 158, 11)',
            'rgb(239, 68, 68)',
            'rgb(139, 92, 246)',
          ],
          borderWidth: 2,
          borderColor: '#fff',
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
      },
      title: {
        display: true,
        text: 'Payment Methods Distribution',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
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
      <div className="h-80 flex items-center justify-center text-muted-foreground">
        No payment method data available
      </div>
    )
  }

  return (
    <div className="h-80">
      <Doughnut data={chartData} options={options} />
    </div>
  )
}