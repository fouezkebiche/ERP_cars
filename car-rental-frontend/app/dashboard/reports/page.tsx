// app/dashboard/reports/page.tsx
"use client"

import { useState } from "react"
import { 
  BarChart3,
  Users, 
  Car, 
  AlertCircle, 
  Download, 
  LineChart,
  PieChart,
  TrendingUp
} from "lucide-react"
import { useReports } from "@/hooks/useReports"
import { ReportFilters } from "@/components/reports/ReportFilters"
import { ExportButtons } from "@/components/reports/ExportButtons"
import { KPICard } from "@/components/dashboard/kpi-card"
import { DataTable } from "@/components/dashboard/data-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
} from 'chart.js'
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'
import type { 
  ReportType, 
  ReportFilters as Filters, 
  ExecutiveReport, 
  VehicleReport, 
  CustomerReport 
} from "@/lib/reports"

// Register Chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
)

export default function ReportsPage() {
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

  if (loading && !reportData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Generating report...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Advanced Reports</h1>
          <p className="text-muted-foreground">
            Generate comprehensive business reports with interactive charts
          </p>
        </div>
        
        {reportData && (
          <ExportButtons
            onDownloadPDF={() => downloadPDF(reportType, currentFilters)}
            onDownloadExcel={() => downloadExcel(reportType, currentFilters)}
            onDownloadJSON={() => downloadJSON(reportType, currentFilters)}
            loading={loading}
          />
        )}
      </div>

      {/* Report Type Selector */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Select Report Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setReportType('executive')}
            className={`p-6 rounded-lg border-2 transition-all ${
              reportType === 'executive'
                ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-105'
                : 'bg-card border-border hover:border-primary/50 hover:shadow-md'
            }`}
          >
            <BarChart3 className="w-8 h-8 mx-auto mb-3" />
            <div className="font-semibold text-lg">Executive Summary</div>
            <div className="text-xs mt-2 opacity-80">Overall business KPIs & trends</div>
          </button>
          
          <button
            onClick={() => setReportType('vehicle')}
            className={`p-6 rounded-lg border-2 transition-all ${
              reportType === 'vehicle'
                ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-105'
                : 'bg-card border-border hover:border-primary/50 hover:shadow-md'
            }`}
          >
            <Car className="w-8 h-8 mx-auto mb-3" />
            <div className="font-semibold text-lg">Vehicle Performance</div>
            <div className="text-xs mt-2 opacity-80">Fleet analytics & P&L</div>
          </button>
          
          <button
            onClick={() => setReportType('customer')}
            className={`p-6 rounded-lg border-2 transition-all ${
              reportType === 'customer'
                ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-105'
                : 'bg-card border-border hover:border-primary/50 hover:shadow-md'
            }`}
          >
            <Users className="w-8 h-8 mx-auto mb-3" />
            <div className="font-semibold text-lg">Customer Insights</div>
            <div className="text-xs mt-2 opacity-80">Segmentation & retention</div>
          </button>
        </div>
      </div>

      {/* Filters */}
      <ReportFilters onApply={handleApplyFilters} onReset={handleResetFilters} />

      {/* Generate Button */}
      <Button
        onClick={handleGenerateReport}
        disabled={loading}
        className="w-full md:w-auto gap-2"
        size="lg"
      >
        <Download className="w-4 h-4" />
        {loading ? 'Generating...' : 'Generate Report'}
      </Button>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg border-l-4 border-l-destructive bg-destructive/10">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <p className="font-semibold">Error</p>
          </div>
          <p className="text-sm mt-2 text-muted-foreground">{error}</p>
        </div>
      )}

      {/* Report Preview */}
      {reportData && !error && (
        <div className="space-y-8">
          {/* Executive Summary Report */}
          {reportData.report_type === 'executive_summary' && (
            <ExecutiveSummaryView report={reportData as ExecutiveReport} formatCurrency={formatCurrency} />
          )}

          {/* Vehicle Performance Report */}
          {reportData.report_type === 'vehicle_performance' && (
            <VehiclePerformanceView report={reportData as VehicleReport} formatCurrency={formatCurrency} />
          )}

          {/* Customer Insights Report */}
          {reportData.report_type === 'customer_insights' && (
            <CustomerInsightsView report={reportData as CustomerReport} formatCurrency={formatCurrency} />
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// EXECUTIVE SUMMARY VIEW WITH CHARTS
// ============================================
function ExecutiveSummaryView({ 
  report, 
  formatCurrency 
}: { 
  report: ExecutiveReport
  formatCurrency: (v: number) => string 
}) {
  const [revenueChartType, setRevenueChartType] = useState<'bar' | 'line'>('line')
  const [paymentChartType, setPaymentChartType] = useState<'pie' | 'doughnut'>('doughnut')

  // Revenue Trend Chart Data
  const revenueChartData = report.trends && report.trends.length > 0 ? {
    labels: report.trends.map(t => new Date(t.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })),
    datasets: [{
      label: 'Daily Revenue (DZD)',
      data: report.trends.map(t => t.revenue),
      borderColor: '#3b82f6',
      backgroundColor: revenueChartType === 'bar' 
        ? 'rgba(59, 130, 246, 0.8)' 
        : 'rgba(59, 130, 246, 0.1)',
      borderWidth: revenueChartType === 'line' ? 3 : 1,
      fill: revenueChartType === 'line',
      tension: 0.4,
      pointRadius: revenueChartType === 'line' ? 4 : 0,
      pointHoverRadius: 6,
      pointBackgroundColor: '#3b82f6',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
    }],
  } : null

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          font: { size: 14, weight: 'bold' as const },
          color: '#111827',
          padding: 15,
        },
      },
      title: {
        display: true,
        text: 'Revenue Trend Analysis',
        font: { size: 18, weight: 'bold' as const },
        color: '#111827',
        padding: 20,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 13 },
        callbacks: {
          label: (context: any) => `Revenue: ${formatCurrency(context.parsed.y)} DA`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 12 },
          color: '#6b7280',
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#e5e7eb' },
        ticks: {
          font: { size: 12 },
          color: '#6b7280',
          callback: (value: any) => formatCurrency(value) + ' DA',
        },
      },
    },
  }

  // Payment Methods Chart Data
  const paymentChartData = report.revenue_breakdown?.by_method && report.revenue_breakdown.by_method.length > 0 ? {
    labels: report.revenue_breakdown.by_method.map(m => 
      m.method.charAt(0).toUpperCase() + m.method.slice(1)
    ),
    datasets: [{
      data: report.revenue_breakdown.by_method.map(m => m.amount),
      backgroundColor: [
        '#3b82f6', // Blue
        '#10b981', // Green
        '#f59e0b', // Amber
        '#ef4444', // Red
        '#8b5cf6', // Purple
      ],
      borderColor: '#ffffff',
      borderWidth: 3,
      hoverOffset: 10,
    }],
  } : null

  const paymentChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right' as const,
        labels: {
          font: { size: 14 },
          color: '#111827',
          padding: 15,
          generateLabels: (chart: any) => {
            const data = chart.data
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const value = data.datasets[0].data[i]
                const total = data.datasets[0].data.reduce((a: number, b: number) => a + b, 0)
                const percentage = ((value / total) * 100).toFixed(1)
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  index: i
                }
              })
            }
            return []
          }
        },
      },
      title: {
        display: true,
        text: 'Revenue by Payment Method',
        font: { size: 18, weight: 'bold' as const },
        color: '#111827',
        padding: 20,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: (context: any) => {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${formatCurrency(value)} DA (${percentage}%)`
          }
        }
      }
    },
  }

  // Fleet Status Chart Data
  const fleetChartData = report.fleet_overview ? {
    labels: ['Available', 'Rented', 'Maintenance'],
    datasets: [{
      data: [
        report.fleet_overview.available,
        report.fleet_overview.active_rentals,
        report.fleet_overview.maintenance,
      ],
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
      borderColor: '#ffffff',
      borderWidth: 3,
      hoverOffset: 10,
    }],
  } : null

  const fleetChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          font: { size: 14 },
          color: '#111827',
          padding: 15,
        },
      },
      title: {
        display: true,
        text: 'Fleet Status Distribution',
        font: { size: 18, weight: 'bold' as const },
        color: '#111827',
        padding: 20,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: (context: any) => {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${value} vehicles (${percentage}%)`
          }
        }
      }
    },
  }

  return (
    <>
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Executive Summary</h2>
          <span className="text-sm text-muted-foreground">
            {new Date(report.period.start).toLocaleDateString()} - {new Date(report.period.end).toLocaleDateString()}
          </span>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            label="Total Revenue"
            value={formatCurrency(report.summary.total_revenue)}
            suffix="DZD"
            trend={report.summary.revenue_growth}
          />
          <KPICard
            label="Fleet Utilization"
            value={`${report.summary.fleet_utilization.toFixed(1)}%`}
          />
          <KPICard
            label="Active Customers"
            value={report.summary.active_customers}
          />
          <KPICard
            label="Maintenance Alerts"
            value={report.summary.maintenance_alerts}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        {revenueChartData && (
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Revenue Trend
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={revenueChartType === 'line' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRevenueChartType('line')}
                  >
                    <LineChart className="w-4 h-4 mr-1" />
                    Line
                  </Button>
                  <Button
                    variant={revenueChartType === 'bar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRevenueChartType('bar')}
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Bar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {revenueChartType === 'line' ? (
                  <Line data={revenueChartData} options={revenueChartOptions} />
                ) : (
                  <Bar data={revenueChartData} options={revenueChartOptions} />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Methods Chart */}
        {paymentChartData && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Payment Methods
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={paymentChartType === 'pie' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentChartType('pie')}
                  >
                    Pie
                  </Button>
                  <Button
                    variant={paymentChartType === 'doughnut' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentChartType('doughnut')}
                  >
                    Doughnut
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {paymentChartType === 'pie' ? (
                  <Pie data={paymentChartData} options={paymentChartOptions} />
                ) : (
                  <Doughnut data={paymentChartData} options={paymentChartOptions} />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fleet Status Chart */}
        {fleetChartData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5" />
                Fleet Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Doughnut data={fleetChartData} options={fleetChartOptions} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Vehicles */}
      {report.top_vehicles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "vehicle", label: "Vehicle", render: (_, row) => `${row.brand} ${row.model}` },
                { key: "registration_number", label: "Registration" },
                { key: "utilization_rate", label: "Utilization", render: (v) => `${v.toFixed(1)}%` },
                { key: "total_revenue", label: "Revenue", render: (v) => `${formatCurrency(v)} DZD` },
              ]}
              data={report.top_vehicles}
            />
          </CardContent>
        </Card>
      )}

      {/* Top Customers */}
      {report.top_customers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "name", label: "Name" },
                { key: "type", label: "Type" },
                { key: "total_rentals", label: "Rentals" },
                { key: "lifetime_value", label: "Lifetime Value", render: (v) => `${formatCurrency(v)} DZD` },
              ]}
              data={report.top_customers}
            />
          </CardContent>
        </Card>
      )}
    </>
  )
}

// ============================================
// VEHICLE PERFORMANCE VIEW WITH CHARTS
// ============================================
function VehiclePerformanceView({ 
  report, 
  formatCurrency 
}: { 
  report: VehicleReport
  formatCurrency: (v: number) => string 
}) {
  const [utilizationChartType, setUtilizationChartType] = useState<'bar' | 'line'>('bar')

  // Vehicle Utilization Chart Data
  const utilizationChartData = report.top_performers && report.top_performers.length > 0 ? {
    labels: report.top_performers.slice(0, 10).map(v => 
      `${v.brand} ${v.model}\n${v.registration_number}`
    ),
    datasets: [{
      label: 'Utilization Rate (%)',
      data: report.top_performers.slice(0, 10).map(v => v.utilization_rate),
      backgroundColor: report.top_performers.slice(0, 10).map(v => {
        if (v.utilization_rate >= 80) return '#10b981' // Green - High
        if (v.utilization_rate >= 60) return '#3b82f6' // Blue - Medium
        if (v.utilization_rate >= 40) return '#f59e0b' // Amber - Low
        return '#ef4444' // Red - Very Low
      }),
      borderColor: '#ffffff',
      borderWidth: 2,
      borderRadius: 8,
    }],
  } : null

  const utilizationChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Top 10 Vehicles by Utilization Rate',
        font: { size: 18, weight: 'bold' as const },
        color: '#111827',
        padding: 20,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: (context: any) => `Utilization: ${context.parsed.y.toFixed(1)}%`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 10 },
          color: '#6b7280',
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: '#e5e7eb' },
        ticks: {
          font: { size: 12 },
          color: '#6b7280',
          callback: (value: any) => value + '%',
        },
      },
    },
  }

  // Profit Performance Chart Data
  const profitChartData = report.top_performers && report.top_performers.length > 0 ? {
    labels: report.top_performers.slice(0, 10).map(v => 
      `${v.brand} ${v.model}`
    ),
    datasets: [
      {
        label: 'Revenue (DZD)',
        data: report.top_performers.slice(0, 10).map(v => v.total_revenue),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: '#3b82f6',
        borderWidth: 2,
        borderRadius: 6,
      },
      {
        label: 'Profit (DZD)',
        data: report.top_performers.slice(0, 10).map(v => v.profit),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: '#10b981',
        borderWidth: 2,
        borderRadius: 6,
      }
    ],
  } : null

  const profitChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          font: { size: 14 },
          color: '#111827',
          padding: 15,
        },
      },
      title: {
        display: true,
        text: 'Revenue vs Profit Analysis',
        font: { size: 18, weight: 'bold' as const },
        color: '#111827',
        padding: 20,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)} DA`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 10 },
          color: '#6b7280',
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#e5e7eb' },
        ticks: {
          font: { size: 12 },
          color: '#6b7280',
          callback: (value: any) => formatCurrency(value) + ' DA',
        },
      },
    },
  }

  return (
    <>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Vehicle Performance Report</h2>

        {/* Fleet Summary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            label="Total Revenue"
            value={formatCurrency(report.fleet_summary.total_revenue)}
            suffix="DZD"
          />
          <KPICard
            label="Total Profit"
            value={formatCurrency(report.fleet_summary.total_profit)}
            suffix="DZD"
          />
          <KPICard
            label="Profit Margin"
            value={`${report.fleet_summary.profit_margin.toFixed(1)}%`}
          />
          <KPICard
            label="Avg Utilization"
            value={`${report.fleet_summary.average_utilization.toFixed(1)}%`}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Utilization Chart */}
        {utilizationChartData && (
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Vehicle Utilization
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={utilizationChartType === 'bar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUtilizationChartType('bar')}
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Bar
                  </Button>
                  <Button
                    variant={utilizationChartType === 'line' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUtilizationChartType('line')}
                  >
                    <LineChart className="w-4 h-4 mr-1" />
                    Line
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                {utilizationChartType === 'bar' ? (
                  <Bar data={utilizationChartData} options={utilizationChartOptions} />
                ) : (
                  <Line 
                    data={{
                      ...utilizationChartData,
                      datasets: [{
                        ...utilizationChartData.datasets[0],
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderColor: '#3b82f6',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                      }]
                    }} 
                    options={utilizationChartOptions} 
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profit Performance Chart */}
        {profitChartData && (
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Revenue & Profit Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <Bar data={profitChartData} options={profitChartOptions} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Performers Table */}
      {report.top_performers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "vehicle", label: "Vehicle", render: (_, row) => `${row.brand} ${row.model}` },
                { key: "registration_number", label: "Registration" },
                { key: "utilization_rate", label: "Utilization", render: (v) => `${v.toFixed(1)}%` },
                { key: "total_revenue", label: "Revenue", render: (v) => `${formatCurrency(v)} DZD` },
                { key: "profit", label: "Profit", render: (v) => `${formatCurrency(v)} DZD` },
              ]}
              data={report.top_performers}
            />
          </CardContent>
        </Card>
      )}

      {/* Maintenance Alerts */}
      {report.maintenance_alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Maintenance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "vehicle", label: "Vehicle" },
                { key: "registration", label: "Registration" },
                { key: "current_mileage", label: "Current KM", render: (v) => v.toLocaleString() + ' km' },
                { 
                  key: "km_overdue", 
                  label: "Status", 
                  render: (v) => (
                    <span className={v > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                      {v > 0 ? `${v} km overdue` : 'On Time'}
                    </span>
                  )
                },
              ]}
              data={report.maintenance_alerts}
            />
          </CardContent>
        </Card>
      )}
    </>
  )
}

// ============================================
// CUSTOMER INSIGHTS VIEW WITH CHARTS
// ============================================
function CustomerInsightsView({ 
  report, 
  formatCurrency 
}: { 
  report: CustomerReport
  formatCurrency: (v: number) => string 
}) {
  const [segmentChartType, setSegmentChartType] = useState<'bar' | 'doughnut'>('bar')

  const seg = report.customer_segmentation

  // Customer Segmentation Chart Data
  const segmentChartData = {
    labels: ['VIP', 'High Value', 'Medium Value', 'Low Value'],
    datasets: [{
      label: 'Customer Count',
      data: [
        seg.segments.vip.count,
        seg.segments.high_value.count,
        seg.segments.medium_value.count,
        seg.segments.low_value.count,
      ],
      backgroundColor: segmentChartType === 'bar' 
        ? ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b']
        : ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'],
      borderColor: '#ffffff',
      borderWidth: 3,
      borderRadius: segmentChartType === 'bar' ? 8 : 0,
    }],
  }

  const segmentBarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Customer Segmentation Distribution',
        font: { size: 18, weight: 'bold' as const },
        color: '#111827',
        padding: 20,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: (context: any) => `${context.label}: ${context.parsed.y} customers`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 12 }, color: '#6b7280' },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#e5e7eb' },
        ticks: { font: { size: 12 }, color: '#6b7280' },
      },
    },
  }

  const segmentDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right' as const,
        labels: {
          font: { size: 14 },
          color: '#111827',
          padding: 15,
        },
      },
      title: {
        display: true,
        text: 'Customer Segmentation Distribution',
        font: { size: 18, weight: 'bold' as const },
        color: '#111827',
        padding: 20,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: (context: any) => {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${value} customers (${percentage}%)`
          }
        }
      }
    },
  }

  // Booking Patterns Chart Data
  const bookingPatternsData = report.booking_patterns?.by_weekday ? {
    labels: report.booking_patterns.by_weekday.map(d => d.day),
    datasets: [{
      label: 'Number of Bookings',
      data: report.booking_patterns.by_weekday.map(d => d.count),
      backgroundColor: 'rgba(139, 92, 246, 0.7)',
      borderColor: '#8b5cf6',
      borderWidth: 2,
      borderRadius: 8,
    }],
  } : null

  const bookingPatternsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Booking Patterns by Day of Week',
        font: { size: 18, weight: 'bold' as const },
        color: '#111827',
        padding: 20,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 12 }, color: '#6b7280' },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#e5e7eb' },
        ticks: { font: { size: 12 }, color: '#6b7280' },
      },
    },
  }

  return (
    <>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Customer Insights Report</h2>

        {/* Segmentation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-6 rounded-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-purple-600">VIP Customers</p>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-900">{seg.segments.vip.count}</p>
            <p className="text-xs text-purple-600 mt-2">
              {formatCurrency(seg.segments.vip.total_value)} DZD total
            </p>
          </div>
          
          <div className="p-6 rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-blue-600">High Value</p>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-900">{seg.segments.high_value.count}</p>
            <p className="text-xs text-blue-600 mt-2">
              {formatCurrency(seg.segments.high_value.total_value)} DZD total
            </p>
          </div>
          
          <div className="p-6 rounded-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-green-600">Medium Value</p>
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-900">{seg.segments.medium_value.count}</p>
            <p className="text-xs text-green-600 mt-2">
              {formatCurrency(seg.segments.medium_value.total_value)} DZD total
            </p>
          </div>
          
          <div className="p-6 rounded-lg border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-amber-600">New Customers</p>
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-amber-900">{seg.segments.low_value.count}</p>
            <p className="text-xs text-amber-600 mt-2">
              {formatCurrency(seg.segments.low_value.total_value)} DZD total
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Segmentation Chart */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Customer Segments
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={segmentChartType === 'bar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSegmentChartType('bar')}
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Bar
                </Button>
                <Button
                  variant={segmentChartType === 'doughnut' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSegmentChartType('doughnut')}
                >
                  <PieChart className="w-4 h-4 mr-1" />
                  Doughnut
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {segmentChartType === 'bar' ? (
                <Bar data={segmentChartData} options={segmentBarChartOptions} />
              ) : (
                <Doughnut data={segmentChartData} options={segmentDoughnutOptions} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Booking Patterns Chart */}
        {bookingPatternsData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Booking Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Bar data={bookingPatternsData} options={bookingPatternsOptions} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Retention Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Retention Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-white rounded-lg border-2 border-blue-200">
              <p className="text-sm font-medium text-blue-600 mb-2">New Customers</p>
              <p className="text-4xl font-bold text-blue-900">{report.retention_metrics.new_customers}</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-white rounded-lg border-2 border-green-200">
              <p className="text-sm font-medium text-green-600 mb-2">Repeat Customers</p>
              <p className="text-4xl font-bold text-green-900">{report.retention_metrics.repeat_customers}</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-white rounded-lg border-2 border-purple-200">
              <p className="text-sm font-medium text-purple-600 mb-2">Retention Rate</p>
              <p className="text-4xl font-bold text-purple-900">{report.retention_metrics.retention_rate.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}