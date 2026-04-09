// app/[locale]/dashboard/analytics/page.tsx
"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/analytics/stat-card'
import { DataTable } from '@/components/dashboard/data-table'
import { RevenueChart } from '@/components/analytics/revenue-chart'
import { PaymentMethodsChart } from '@/components/analytics/payment-methods-chart'
import { UtilizationChart } from '@/components/analytics/utilization-chart'
import { ContractsChart } from '@/components/analytics/contracts-chart'
import { AnalyticsFilters } from '@/components/analytics/analytics-filters'
import {
  useDashboard,
  useRevenue,
  useVehiclePerformance,
  useCustomerSegmentation,
  useContractAnalytics,
  usePaymentAnalytics
} from '@/hooks/useAnalytics'
import { useReports } from '@/hooks/useReports'
import type { ReportType, ReportFilters as AdvancedReportFilters } from '@/lib/reports'
import { ReportFilters } from '@/components/reports/ReportFilters'
import { ExportButtons } from '@/components/reports/ExportButtons'
import {
  ExecutiveSummaryView,
  VehiclePerformanceView,
  CustomerInsightsView,
} from '@/components/reports/ReportViews'
import {
  BarChart3,
  TrendingUp,
  Users,
  Download,
  AlertCircle,
  DollarSign,
  Car,
  FileText,
  CreditCard,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslations } from 'next-intl'

export default function AnalyticsPage() {
  const t = useTranslations('analytics')

  const [dateRange, setDateRange] = useState<{
    period: 'today' | 'week' | 'month' | 'quarter' | 'year'
    start_date?: string
    end_date?: string
  }>({ period: 'month' })

  const [vehicleMetric, setVehicleMetric] = useState<'utilization' | 'revenue' | 'profit'>('utilization')

  const [reportType, setReportType] = useState<ReportType>('executive')
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedReportFilters>({ period: 'month' })

  const {
    data: reportData,
    loading: reportLoading,
    error: reportError,
    generateReport,
    downloadPDF,
    downloadExcel,
    downloadJSON,
  } = useReports()

  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useDashboard(dateRange)
  const { data: revenueData, loading: revenueLoading } = useRevenue({ ...dateRange, compare: true })
  const { data: vehicleData, loading: vehicleLoading } = useVehiclePerformance({
    ...dateRange,
    metric: vehicleMetric,
    limit: 10
  })
  const { data: customerData, loading: customerLoading } = useCustomerSegmentation()
  const { data: contractData, loading: contractLoading } = useContractAnalytics(dateRange)
  const { data: paymentData, loading: paymentLoading } = usePaymentAnalytics(dateRange)

  const isLoading = dashboardLoading || revenueLoading || vehicleLoading || customerLoading || contractLoading || paymentLoading

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-DZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)

  const handlePeriodChange = (period: 'today' | 'week' | 'month' | 'quarter' | 'year') => {
    setDateRange({ period })
  }

  const handleDateRangeChange = (range: { start_date?: string; end_date?: string }) => {
    if (range.start_date && range.end_date) {
      setDateRange({ period: 'month', ...range })
    } else {
      setDateRange({ period: 'month' })
    }
  }

  const handleAdvancedFiltersApply = (filters: AdvancedReportFilters) => {
    setAdvancedFilters(filters)
  }

  const handleAdvancedFiltersReset = () => {
    setAdvancedFilters({ period: 'month' })
  }

  const handleGenerateReport = async () => {
    await generateReport(reportType, advancedFilters)
  }

  const handleExportReport = async () => {
    try {
      await downloadPDF('executive', {
        period: dateRange.period,
        startDate: dateRange.start_date,
        endDate: dateRange.end_date,
      })
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (dashboardError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('failedTitle')}</h2>
          <p className="text-muted-foreground mb-4">{dashboardError}</p>
          <Button onClick={() => window.location.reload()}>{t('retry')}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button onClick={handleExportReport} className="bg-primary hover:bg-primary/90">
          <Download className="w-4 h-4 mr-2" />
          {t('exportReport')}
        </Button>
      </div>

      {/* Filters */}
      <AnalyticsFilters
        onPeriodChange={handlePeriodChange}
        onDateRangeChange={handleDateRangeChange}
        onMetricChange={setVehicleMetric}
        currentPeriod={dateRange.period}
        showMetricFilter={false}
      />

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('kpi.totalRevenue')}
          value={`${formatCurrency(dashboardData?.revenue.total || 0)} DZD`}
          change={revenueData?.growth_percentage}
          icon={DollarSign}
          iconColor="text-green-600"
          subtitle={t('kpi.fromLastPeriod')}
        />
        <StatCard
          title={t('kpi.activeContracts')}
          value={dashboardData?.fleet.active_rentals || 0}
          icon={FileText}
          iconColor="text-blue-600"
          subtitle={`${dashboardData?.fleet.total_vehicles || 0} ${t('kpi.totalVehicles')}`}
        />
        <StatCard
          title={t('kpi.fleetUtilization')}
          value={`${(dashboardData?.fleet.average_utilization || 0).toFixed(1)}%`}
          icon={Car}
          iconColor="text-purple-600"
          subtitle={t('kpi.avgAcrossFleet')}
        />
        <StatCard
          title={t('kpi.totalCustomers')}
          value={dashboardData?.customers.total || 0}
          icon={Users}
          iconColor="text-orange-600"
          subtitle={`${dashboardData?.customers.new || 0} ${t('kpi.newThisPeriod')}`}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
          <TabsTrigger value="revenue">{t('tabs.revenue')}</TabsTrigger>
          <TabsTrigger value="vehicles">{t('tabs.vehicles')}</TabsTrigger>
          <TabsTrigger value="contracts">{t('tabs.contracts')}</TabsTrigger>
          <TabsTrigger value="customers">{t('tabs.customers')}</TabsTrigger>
          <TabsTrigger value="reports">{t('tabs.reports')}</TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW ── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border bg-card p-6">
              {revenueData?.revenue_by_day && revenueData.revenue_by_day.length > 0 ? (
                <RevenueChart data={revenueData.revenue_by_day} />
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  {t('noRevenueData')}
                </div>
              )}
            </div>
            <div className="rounded-lg border bg-card p-6">
              {revenueData?.revenue_by_method && revenueData.revenue_by_method.length > 0 ? (
                <PaymentMethodsChart data={revenueData.revenue_by_method} />
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  {t('noPaymentData')}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border bg-card p-6">
              {vehicleData?.vehicles && vehicleData.vehicles.length > 0 ? (
                <UtilizationChart data={vehicleData.vehicles} />
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  {t('noVehicleData')}
                </div>
              )}
            </div>
            <div className="rounded-lg border bg-card p-6">
              {contractData?.by_status ? (
                <ContractsChart data={contractData.by_status} />
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  {t('noContractData')}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">{t('overview.avgTransaction')}</p>
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(revenueData?.average_transaction_value || 0)} DZD
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">{t('overview.retentionRate')}</p>
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">
                {(dashboardData?.customers.retention_rate || 0).toFixed(1)}%
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">{t('overview.completionRate')}</p>
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold">
                {(contractData?.completion_rate || 0).toFixed(1)}%
              </p>
            </div>
          </div>
        </TabsContent>

        {/* ── REVENUE ── */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title={t('revenue.totalRevenue')}
              value={`${formatCurrency(revenueData?.total_revenue || 0)} DZD`}
              change={revenueData?.growth_percentage}
              subtitle={t('revenue.vsLastPeriod')}
            />
            <StatCard
              title={t('revenue.totalPayments')}
              value={revenueData?.payment_count || 0}
              subtitle={t('revenue.completedTransactions')}
            />
            <StatCard
              title={t('revenue.avgTransaction')}
              value={`${formatCurrency(revenueData?.average_transaction_value || 0)} DZD`}
              subtitle={t('revenue.perPayment')}
            />
          </div>

          <div className="rounded-lg border bg-card p-6">
            {revenueData?.revenue_by_day && revenueData.revenue_by_day.length > 0 ? (
              <RevenueChart data={revenueData.revenue_by_day} title={t('revenue.revenueOverTime')} />
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                {t('noRevenueTrend')}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border bg-card p-6">
              {revenueData?.revenue_by_method && revenueData.revenue_by_method.length > 0 ? (
                <PaymentMethodsChart data={revenueData.revenue_by_method} />
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  {t('noPaymentMethod')}
                </div>
              )}
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-semibold mb-4">{t('revenue.paymentBreakdown')}</h3>
              <div className="space-y-4">
                {revenueData?.revenue_by_method?.map((method) => (
                  <div key={method.method} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {method.method.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </span>
                      <span className="text-muted-foreground">
                        {method.count} {t('revenue.payments')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${((method.amount / (revenueData?.total_revenue || 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(method.amount)} DZD</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── VEHICLES ── */}
        <TabsContent value="vehicles" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{t('vehicles.performance')}</h3>
            <div className="flex gap-2">
              {(['utilization', 'revenue', 'profit'] as const).map((metric) => (
                <Button
                  key={metric}
                  onClick={() => setVehicleMetric(metric)}
                  variant={vehicleMetric === metric ? 'default' : 'outline'}
                  size="sm"
                >
                  {t(`vehicles.${metric}` as any)}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title={t('vehicles.fleetSize')}
              value={vehicleData?.fleet_summary.total_vehicles || 0}
              subtitle={t('vehicles.totalVehicles')}
            />
            <StatCard
              title={t('vehicles.avgUtilization')}
              value={`${(vehicleData?.fleet_summary.average_utilization || 0).toFixed(1)}%`}
              subtitle={t('vehicles.fleetWide')}
            />
            <StatCard
              title={t('vehicles.totalRentals')}
              value={vehicleData?.fleet_summary.total_rentals || 0}
              subtitle={t('vehicles.inPeriod')}
            />
            <StatCard
              title={t('vehicles.fleetRevenue')}
              value={`${formatCurrency(vehicleData?.fleet_summary.total_revenue || 0)} DZD`}
              subtitle={t('vehicles.totalEarned')}
            />
          </div>

          <div className="rounded-lg border bg-card p-6">
            {vehicleData?.vehicles && vehicleData.vehicles.length > 0 ? (
              <UtilizationChart data={vehicleData.vehicles} limit={15} />
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                {t('noVehiclePerf')}
              </div>
            )}
          </div>

          {vehicleData?.vehicles && vehicleData.vehicles.length > 0 && (
            <div className="rounded-lg border bg-card">
              <DataTable
                columns={[
                  {
                    key: 'vehicle',
                    label: t('vehicles.vehicle'),
                    sortable: true,
                    render: (_: any, row: any) => (
                      <div>
                        <p className="font-medium">{row.brand} {row.model}</p>
                        <p className="text-sm text-muted-foreground">{row.registration_number}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'utilization_rate',
                    label: t('vehicles.utilization_col'),
                    sortable: true,
                    render: (value: number) => (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(value, 100)}%` }} />
                        </div>
                        <span className="text-sm font-medium">{value.toFixed(1)}%</span>
                      </div>
                    ),
                  },
                  { key: 'rental_count', label: t('vehicles.rentals'), sortable: true },
                  {
                    key: 'total_revenue',
                    label: t('vehicles.revenue'),
                    sortable: true,
                    render: (value: number) => `${formatCurrency(value)} DZD`,
                  },
                  {
                    key: 'revenue_per_day',
                    label: t('vehicles.avgDay'),
                    sortable: true,
                    render: (value: number) => `${formatCurrency(value)} DZD`,
                  },
                  {
                    key: 'current_status',
                    label: t('vehicles.status'),
                    render: (value: string) => (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        value === 'available' ? 'bg-green-100 text-green-800' :
                        value === 'rented' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {value === 'available' ? t('vehicles.available') : value === 'rented' ? t('vehicles.rented') : value}
                      </span>
                    ),
                  },
                ]}
                data={vehicleData.vehicles}
              />
            </div>
          )}
        </TabsContent>

        {/* ── CONTRACTS ── */}
        <TabsContent value="contracts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title={t('contracts.totalContracts')}
              value={contractData?.total_contracts || 0}
              subtitle={t('contracts.allTime')}
            />
            <StatCard
              title={t('contracts.activeNow')}
              value={contractData?.by_status.active || 0}
              subtitle={t('contracts.currentlyActive')}
            />
            <StatCard
              title={t('contracts.completed')}
              value={contractData?.by_status.completed || 0}
              subtitle={t('contracts.successfullyFinished')}
            />
            <StatCard
              title={t('contracts.completionRate')}
              value={`${(contractData?.completion_rate || 0).toFixed(1)}%`}
              subtitle={t('contracts.successRate')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border bg-card p-6">
              {contractData?.by_status ? (
                <ContractsChart data={contractData.by_status} />
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  {t('noContractData')}
                </div>
              )}
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-semibold mb-6">{t('contracts.metrics')}</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{t('contracts.avgValue')}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(contractData?.avg_contract_value || 0)} DZD
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full">
                    <div className="h-full w-3/4 bg-blue-600 rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{t('contracts.avgDuration')}</span>
                    <span className="text-sm text-muted-foreground">
                      {contractData?.avg_duration_days || 0} {t('contracts.days')}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full">
                    <div className="h-full w-1/2 bg-green-600 rounded-full" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center p-4 rounded-lg bg-blue-50">
                    <p className="text-2xl font-bold text-blue-600">{contractData?.by_status.active || 0}</p>
                    <p className="text-sm text-muted-foreground">{t('contracts.active')}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-green-50">
                    <p className="text-2xl font-bold text-green-600">{contractData?.by_status.completed || 0}</p>
                    <p className="text-sm text-muted-foreground">{t('contracts.completed')}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-red-50">
                    <p className="text-2xl font-bold text-red-600">{contractData?.by_status.cancelled || 0}</p>
                    <p className="text-sm text-muted-foreground">{t('contracts.cancelled')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── CUSTOMERS ── */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title={t('customers.totalCustomers')}
              value={customerData?.total_customers || 0}
              subtitle={t('customers.allCustomers')}
            />
            <StatCard
              title={t('customers.vipCustomers')}
              value={customerData?.segments.vip.count || 0}
              subtitle={`${formatCurrency(customerData?.segments.vip.total_value || 0)} ${t('customers.value')}`}
            />
            <StatCard
              title={t('customers.newCustomers')}
              value={dashboardData?.customers.new || 0}
              subtitle={t('customers.thisPeriod')}
            />
            <StatCard
              title={t('customers.retentionRate')}
              value={`${(dashboardData?.customers.retention_rate || 0).toFixed(1)}%`}
              subtitle={t('customers.customerLoyalty')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: t('customers.vip'),
                data: customerData?.segments.vip,
                color: 'bg-purple-100 border-purple-200 text-purple-800'
              },
              {
                title: t('customers.highValue'),
                data: customerData?.segments.high_value,
                color: 'bg-blue-100 border-blue-200 text-blue-800'
              },
              {
                title: t('customers.mediumValue'),
                data: customerData?.segments.medium_value,
                color: 'bg-green-100 border-green-200 text-green-800'
              },
              {
                title: t('customers.lowValue'),
                data: customerData?.segments.low_value,
                color: 'bg-gray-100 border-gray-200 text-gray-800'
              },
            ].map((segment) => (
              <div key={segment.title} className={`rounded-lg border p-6 ${segment.color}`}>
                <p className="text-sm font-medium mb-2">{segment.title}</p>
                <p className="text-3xl font-bold mb-1">{segment.data?.count || 0}</p>
                <p className="text-xs opacity-80">{formatCurrency(segment.data?.total_value || 0)} DZD</p>
              </div>
            ))}
          </div>

          {customerData?.segments.vip.customers && customerData.segments.vip.customers.length > 0 && (
            <div className="rounded-lg border bg-card">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">{t('customers.topVip')}</h3>
              </div>
              <DataTable
                columns={[
                  {
                    key: 'full_name',
                    label: t('customers.customer'),
                    sortable: true,
                    render: (value: string, row: any) => (
                      <div>
                        <p className="font-medium">{value}</p>
                        <p className="text-sm text-muted-foreground">{row.email}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'customer_type',
                    label: t('customers.type'),
                    sortable: true,
                    render: (value: string) => <span className="capitalize">{value}</span>,
                  },
                  { key: 'total_rentals', label: t('customers.rentals'), sortable: true },
                  {
                    key: 'lifetime_value',
                    label: t('customers.lifetimeValue'),
                    sortable: true,
                    render: (value: string) => `${formatCurrency(parseFloat(value))} DZD`,
                  },
                ]}
                data={customerData.segments.vip.customers}
              />
            </div>
          )}
        </TabsContent>

        {/* ── ADVANCED REPORTS ── */}
        <TabsContent value="reports" className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">{t('reports.title')}</h2>
              <p className="text-muted-foreground">{t('reports.subtitle')}</p>
            </div>
            {reportData && (
              <ExportButtons
                onDownloadPDF={() => downloadPDF(reportType, advancedFilters)}
                onDownloadExcel={() => downloadExcel(reportType, advancedFilters)}
                onDownloadJSON={() => downloadJSON(reportType, advancedFilters)}
                loading={reportLoading}
              />
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">{t('reports.selectType')}</h3>
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
                <div className="font-semibold text-lg">{t('reports.executive')}</div>
                <div className="text-xs mt-2 opacity-80">{t('reports.executiveDesc')}</div>
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
                <div className="font-semibold text-lg">{t('reports.vehiclePerf')}</div>
                <div className="text-xs mt-2 opacity-80">{t('reports.vehiclePerfDesc')}</div>
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
                <div className="font-semibold text-lg">{t('reports.customerInsights')}</div>
                <div className="text-xs mt-2 opacity-80">{t('reports.customerInsightsDesc')}</div>
              </button>
            </div>
          </div>

          <ReportFilters onApply={handleAdvancedFiltersApply} onReset={handleAdvancedFiltersReset} />

          <Button
            onClick={handleGenerateReport}
            disabled={reportLoading}
            className="w-full md:w-auto gap-2"
            size="lg"
          >
            <Download className="w-4 h-4" />
            {reportLoading ? t('reports.generating') : t('reports.generate')}
          </Button>

          {reportError && (
            <div className="p-4 rounded-lg border-l-4 border-l-destructive bg-destructive/10">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <p className="font-semibold">{t('reports.error')}</p>
              </div>
              <p className="text-sm mt-2 text-muted-foreground">{reportError}</p>
            </div>
          )}

          {reportData && !reportError && (
            <div className="space-y-8">
              {reportData.report_type === 'executive_summary' && (
                <ExecutiveSummaryView report={reportData as any} formatCurrency={formatCurrency} />
              )}
              {reportData.report_type === 'vehicle_performance' && (
                <VehiclePerformanceView report={reportData as any} formatCurrency={formatCurrency} />
              )}
              {reportData.report_type === 'customer_insights' && (
                <CustomerInsightsView report={reportData as any} formatCurrency={formatCurrency} />
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}