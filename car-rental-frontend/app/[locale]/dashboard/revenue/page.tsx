// app/[locale]/dashboard/revenue/page.tsx (FULLY LOCALIZED)
"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { KPICard } from "@/components/dashboard/kpi-card"
import { DataTable } from "@/components/dashboard/data-table"
import { BarChart3, TrendingUp, DollarSign, Download, AlertCircle } from "lucide-react"
import { useRevenue, useVehiclePerformance } from "@/hooks/useAnalytics"
import { Button } from "@/components/ui/button"

export default function RevenuePage() {
  const t = useTranslations("revenue")
  const [dateRange, setDateRange] = useState({
    period: 'month' as 'today' | 'week' | 'month' | 'quarter' | 'year',
    compare: true,
  })

  // Fetch revenue data with comparison
  const { 
    data: revenueData, 
    loading: revenueLoading, 
    error: revenueError 
  } = useRevenue({ 
    period: dateRange.period,
    compare: dateRange.compare 
  })

  // Fetch top revenue generating vehicles
  const { 
    data: vehicleData, 
    loading: vehicleLoading 
  } = useVehiclePerformance({ 
    period: dateRange.period,
    metric: 'revenue',
    limit: 10 
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handlePeriodChange = (period: 'today' | 'week' | 'month' | 'quarter' | 'year') => {
    setDateRange({ ...dateRange, period })
  }

  const handleExport = () => {
    if (!revenueData) return
    
    const csvContent = [
      ['Metric', 'Value'],
      [t("totalRevenue"), revenueData.total_revenue],
      [t("paymentCount"), revenueData.payment_count],
      [t("avgTransaction"), revenueData.average_transaction_value],
      ['', ''],
      [t("paymentMethod"), 'Amount', 'Count'],
      ...revenueData.revenue_by_method.map(m => [m.method, m.amount, m.count]),
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (revenueLoading || vehicleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("loadingData")}</p>
        </div>
      </div>
    )
  }

  if (revenueError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t("failedToLoad")}</h2>
          <p className="text-muted-foreground mb-4">{revenueError}</p>
        </div>
      </div>
    )
  }

  const currentPeriod = (revenueData as any)?.current_period || revenueData
  const previousPeriod = (revenueData as any)?.previous_period
  const growthPercentage = (revenueData as any)?.growth_percentage

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={handleExport} className="bg-primary hover:bg-primary/90">
          <Download className="w-4 h-4 mr-2" />
          {t("exportReport")}
        </Button>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 flex-wrap items-center">
        {(['today', 'week', 'month', 'quarter', 'year'] as const).map((period) => (
          <button
            key={period}
            onClick={() => handlePeriodChange(period)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              dateRange.period === period
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
        <label className="flex items-center gap-2 ml-4">
          <input
            type="checkbox"
            checked={dateRange.compare}
            onChange={(e) => setDateRange({ ...dateRange, compare: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-sm">{t("compareWithPrevious")}</span>
        </label>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label={t("totalRevenue")}
          value={formatCurrency(currentPeriod?.total_revenue || 0)}
          suffix="DZD"
          trend={growthPercentage}
          icon={<DollarSign className="w-6 h-6" />}
        />
        <KPICard
          label={t("paymentCount")}
          value={currentPeriod?.payment_count || 0}
          icon={<BarChart3 className="w-6 h-6" />}
        />
        <KPICard
          label={t("avgTransaction")}
          value={formatCurrency(currentPeriod?.average_transaction_value || 0)}
          suffix="DZD"
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <KPICard
          label={t("paymentMethods")}
          value={currentPeriod?.revenue_by_method?.length || 0}
          icon={<BarChart3 className="w-6 h-6" />}
        />
      </div>

      {/* Period Comparison */}
      {dateRange.compare && previousPeriod && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg border border-border bg-card">
            <h3 className="font-semibold mb-4">{t("currentPeriod")}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("revenue")}</span>
                <span className="font-semibold">
                  {formatCurrency(currentPeriod.total_revenue)} DZD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("payments")}</span>
                <span className="font-semibold">{currentPeriod.payment_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("avgTransactionValue")}</span>
                <span className="font-semibold">
                  {formatCurrency(currentPeriod.average_transaction_value)} DZD
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg border border-border bg-muted">
            <h3 className="font-semibold mb-4">{t("previousPeriod")}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("revenue")}</span>
                <span className="font-semibold">
                  {formatCurrency(previousPeriod.total_revenue)} DZD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("payments")}</span>
                <span className="font-semibold">{previousPeriod.payment_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("growth")}</span>
                <span className={`font-semibold ${
                  growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue by Payment Method */}
      {currentPeriod?.revenue_by_method && currentPeriod.revenue_by_method.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">{t("revenueByMethod")}</h2>
          <DataTable
            columns={[
              { 
                key: "method", 
                label: t("paymentMethod"), 
                sortable: true,
                render: (value) => value.charAt(0).toUpperCase() + value.slice(1)
              },
              { 
                key: "count", 
                label: t("transactions"), 
                sortable: true 
              },
              {
                key: "amount",
                label: t("totalAmount"),
                render: (value) => `${formatCurrency(value)} DZD`,
                sortable: true,
              },
              {
                key: "average",
                label: t("avgPerTransaction"),
                render: (_, row) => `${formatCurrency(row.amount / row.count)} DZD`,
                sortable: true,
              },
            ]}
            data={currentPeriod.revenue_by_method}
          />
        </div>
      )}

      {/* Top Revenue Generating Vehicles */}
      {vehicleData?.vehicles && vehicleData.vehicles.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">{t("topVehicles")}</h2>
          <DataTable
            columns={[
              { 
                key: "vehicle", 
                label: t("vehicle"), 
                sortable: true,
                render: (_, row) => `${row.brand} ${row.model}`
              },
              { 
                key: "registration_number", 
                label: t("registration"), 
                sortable: true 
              },
              { 
                key: "rental_count", 
                label: t("rentals"), 
                sortable: true 
              },
              {
                key: "total_revenue",
                label: t("revenue"),
                render: (value) => `${formatCurrency(value)} DZD`,
                sortable: true,
              },
              {
                key: "utilization_rate",
                label: t("utilization"),
                render: (value) => `${value.toFixed(1)}%`,
                sortable: true,
              },
            ]}
            data={vehicleData.vehicles}
          />
        </div>
      )}

      {/* Daily Revenue Trend */}
      {currentPeriod?.revenue_by_day && currentPeriod.revenue_by_day.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">{t("dailyTrend")}</h2>
          <div className="overflow-x-auto">
            <DataTable
              columns={[
                { 
                  key: "date", 
                  label: t("date"), 
                  sortable: true,
                  render: (value) => new Date(value).toLocaleDateString('fr-DZ')
                },
                { 
                  key: "transactions", 
                  label: t("transactions"), 
                  sortable: true 
                },
                {
                  key: "revenue",
                  label: t("revenue"),
                  render: (value) => `${formatCurrency(value)} DZD`,
                  sortable: true,
                },
                {
                  key: "average",
                  label: t("avgPerTransaction"),
                  render: (_, row) => `${formatCurrency(row.revenue / row.transactions)} DZD`,
                },
              ]}
              data={currentPeriod.revenue_by_day}
            />
          </div>
        </div>
      )}
    </div>
  )
}
