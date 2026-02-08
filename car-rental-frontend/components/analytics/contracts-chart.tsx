// components/analytics/contracts-chart.tsx
"use client"

import { useMemo } from 'react'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

interface ContractsChartProps {
  data: {
    active: number
    completed: number
    cancelled: number
  }
}

export function ContractsChart({ data }: ContractsChartProps) {
  const chartData = useMemo(() => {
    return {
      labels: ['Active', 'Completed', 'Cancelled'],
      datasets: [
        {
          data: [data.active, data.completed, data.cancelled],
          backgroundColor: [
            'rgb(59, 130, 246)',
            'rgb(16, 185, 129)',
            'rgb(239, 68, 68)',
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
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Contract Status Distribution',
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
            return `${label}: ${value} (${percentage}%)`
          },
        },
      },
    },
  }

  return (
    <div className="h-80">
      <Pie data={chartData} options={options} />
    </div>
  )
}