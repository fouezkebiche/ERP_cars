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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const FONT       = "'Plus Jakarta Sans', system-ui, sans-serif"
const MUTED      = 'rgba(255,255,255,0.4)'
const GRID_COLOR = 'rgba(255,255,255,0.05)'
const TEXT       = '#FFFFFF'

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
    if (!data || data.length === 0) return { labels: [], datasets: [] }

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
            if (rate >= 80) return 'rgba(34,197,94,0.8)'
            if (rate >= 60) return 'rgba(59,130,246,0.8)'
            if (rate >= 40) return 'rgba(245,158,11,0.8)'
            return 'rgba(239,68,68,0.8)'
          }),
          borderWidth: 0,
          borderRadius: 6,
        },
      ],
    }
  }, [data, limit])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Top Vehicles by Utilization',
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
          label: (context: any) => `${context.parsed.y.toFixed(1)}%`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: MUTED,
          font: { family: FONT, size: 11 },
          maxRotation: 45,
          minRotation: 45,
        },
        grid: { color: GRID_COLOR },
        border: { color: 'transparent' },
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: MUTED,
          font: { family: FONT, size: 11 },
          callback: (value: any) => `${value}%`,
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
        No utilization data available
      </div>
    )
  }

  return (
    <div style={{ height: 320 }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}