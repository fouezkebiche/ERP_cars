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
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface RevenueChartProps {
  data: Array<{ date: string; revenue: number; transactions: number }>
  title?: string
}

export function RevenueChart({ data, title = "Revenue Trend" }: RevenueChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: [],
      }
    }

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
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    }
  }, [data])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `Revenue: ${context.parsed.y.toLocaleString()} DZD`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `${(value / 1000).toFixed(0)}K`,
        },
      },
    },
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground">
        No revenue data available
      </div>
    )
  }

  return (
    <div className="h-80">
      <Line data={chartData} options={options} />
    </div>
  )
}