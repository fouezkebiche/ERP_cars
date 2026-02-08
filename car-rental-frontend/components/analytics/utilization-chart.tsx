// components/analytics/utilization-chart.tsx
"use client"

import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface UtilizationChartProps {
  data: Array<{
    brand: string
    model: string
    registration_number: string
    utilization_rate: number
  }>
  limit?: number
}

export function UtilizationChart({ data, limit = 10 }: UtilizationChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: [],
      }
    }

    const topVehicles = data.slice(0, limit)
    const labels = topVehicles.map((v) => `${v.brand} ${v.model}`)
    const utilizationData = topVehicles.map((v) => v.utilization_rate)

    return {
      labels,
      datasets: [
        {
          label: 'Utilization Rate (%)',
          data: utilizationData,
          backgroundColor: utilizationData.map((rate) => {
            if (rate >= 80) return 'rgb(16, 185, 129)'
            if (rate >= 60) return 'rgb(59, 130, 246)'
            if (rate >= 40) return 'rgb(245, 158, 11)'
            return 'rgb(239, 68, 68)'
          }),
          borderWidth: 0,
          borderRadius: 4,
        },
      ],
    }
  }, [data, limit])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Top Vehicles by Utilization',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.parsed.y.toFixed(1)}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value: any) => `${value}%`,
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground">
        No utilization data available
      </div>
    )
  }

  return (
    <div className="h-80">
      <Bar data={chartData} options={options} />
    </div>
  )
}