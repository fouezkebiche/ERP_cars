// app/(dashboard)/analytics/page.tsx
"use client"

import { useState, useMemo } from 'react'
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
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Download,
  AlertCircle,
  DollarSign,
  Car,
  FileText,
  CreditCard,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<{
    period: 'today' | 'week' | 'month' | 'quarter' | 'year'
    start_date?: string
    end_date?: string
  }>({
    period: 'month',
  })

  const [vehicleMetric, setVehicleMetric] = useState<'utilization' | 'revenue' | 'profit'>('utilization')

  // Fetch all analytics data
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

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

  const handleExportReport = async () => {
    try {
      const reportData = {
        period: dateRange,
        dashboard: dashboardData,
        revenue: revenueData,
        vehicles: vehicleData,
        customers: customerData,
        contracts: contractData,
        payments: paymentData,
        generated_at: new Date().toISOString(),
      }
      
      const jsonStr = JSON.stringify(reportData, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (dashboardError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Analytics</h2>
          <p className="text-muted-foreground mb-4">{dashboardError}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics & Insights</h1>
          <p className="text-muted-foreground">
            Comprehensive business metrics and performance analysis
          </p>
        </div>
        <Button onClick={handleExportReport} className="bg-primary hover:bg-primary/90">
          <Download className="w-4 h-4 mr-2" />
          Export Report
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
          title="Total Revenue"
          value={`${formatCurrency(dashboardData?.revenue.total || 0)} DZD`}
          change={revenueData?.growth_percentage}
          icon={DollarSign}
          iconColor="text-green-600"
          subtitle="from last period"
        />
        <StatCard
          title="Active Contracts"
          value={dashboardData?.fleet.active_rentals || 0}
          icon={FileText}
          iconColor="text-blue-600"
          subtitle={`${dashboardData?.fleet.total_vehicles || 0} total vehicles`}
        />
        <StatCard
          title="Fleet Utilization"
          value={`${(dashboardData?.fleet.average_utilization || 0).toFixed(1)}%`}
          icon={Car}
          iconColor="text-purple-600"
          subtitle="average across fleet"
        />
        <StatCard
          title="Total Customers"
          value={dashboardData?.customers.total || 0}
          icon={Users}
          iconColor="text-orange-600"
          subtitle={`${dashboardData?.customers.new || 0} new this period`}
        />
      </div>

      {/* Tabs for Different Analytics Views */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Revenue & Payment Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border bg-card p-6">
              {revenueData?.revenue_by_day && revenueData.revenue_by_day.length > 0 ? (
                <RevenueChart data={revenueData.revenue_by_day} />
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No revenue data available
                </div>
              )}
            </div>
            <div className="rounded-lg border bg-card p-6">
              {revenueData?.revenue_by_method && revenueData.revenue_by_method.length > 0 ? (
                <PaymentMethodsChart data={revenueData.revenue_by_method} />
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No payment method data available
                </div>
              )}
            </div>
          </div>

          {/* Utilization & Contracts Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border bg-card p-6">
              {vehicleData?.vehicles && vehicleData.vehicles.length > 0 ? (
                <UtilizationChart data={vehicleData.vehicles} />
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No vehicle data available
                </div>
              )}
            </div>
            <div className="rounded-lg border bg-card p-6">
              {contractData?.by_status ? (
                <ContractsChart data={contractData.by_status} />
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No contract data available
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Avg Transaction</p>
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(revenueData?.average_transaction_value || 0)} DZD
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Retention Rate</p>
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">
                {(dashboardData?.customers.retention_rate || 0).toFixed(1)}%
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold">
                {(contractData?.completion_rate || 0).toFixed(1)}%
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Total Revenue"
              value={`${formatCurrency(revenueData?.total_revenue || 0)} DZD`}
              change={revenueData?.growth_percentage}
              subtitle="vs last period"
            />
            <StatCard
              title="Total Payments"
              value={revenueData?.payment_count || 0}
              subtitle="completed transactions"
            />
            <StatCard
              title="Average Transaction"
              value={`${formatCurrency(revenueData?.average_transaction_value || 0)} DZD`}
              subtitle="per payment"
            />
          </div>

          <div className="rounded-lg border bg-card p-6">
            {revenueData?.revenue_by_day && revenueData.revenue_by_day.length > 0 ? (
              <RevenueChart data={revenueData.revenue_by_day} title="Revenue Over Time" />
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                No revenue trend data available
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border bg-card p-6">
              {revenueData?.revenue_by_method && revenueData.revenue_by_method.length > 0 ? (
                <PaymentMethodsChart data={revenueData.revenue_by_method} />
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No payment method data
                </div>
              )}
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-semibold mb-4">Payment Breakdown</h3>
              <div className="space-y-4">
                {revenueData?.revenue_by_method?.map((method) => (
                  <div key={method.method} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {method.method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="text-muted-foreground">
                        {method.count} payments
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${((method.amount / (revenueData?.total_revenue || 1)) * 100)}%`
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(method.amount)} DZD
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Vehicles Tab */}
        <TabsContent value="vehicles" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Vehicle Performance</h3>
            <div className="flex gap-2">
              {(['utilization', 'revenue', 'profit'] as const).map((metric) => (
                <Button
                  key={metric}
                  onClick={() => setVehicleMetric(metric)}
                  variant={vehicleMetric === metric ? 'default' : 'outline'}
                  size="sm"
                >
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Fleet Size"
              value={vehicleData?.fleet_summary.total_vehicles || 0}
              subtitle="total vehicles"
            />
            <StatCard
              title="Average Utilization"
              value={`${(vehicleData?.fleet_summary.average_utilization || 0).toFixed(1)}%`}
              subtitle="fleet-wide"
            />
            <StatCard
              title="Total Rentals"
              value={vehicleData?.fleet_summary.total_rentals || 0}
              subtitle="in period"
            />
            <StatCard
              title="Fleet Revenue"
              value={`${formatCurrency(vehicleData?.fleet_summary.total_revenue || 0)} DZD`}
              subtitle="total earned"
            />
          </div>

          <div className="rounded-lg border bg-card p-6">
            {vehicleData?.vehicles && vehicleData.vehicles.length > 0 ? (
              <UtilizationChart data={vehicleData.vehicles} limit={15} />
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                No vehicle performance data
              </div>
            )}
          </div>

          {vehicleData?.vehicles && vehicleData.vehicles.length > 0 && (
            <div className="rounded-lg border bg-card">
              <DataTable
                columns={[
                  {
                    key: 'vehicle',
                    label: 'Vehicle',
                    sortable: true,
                    render: (_, row) => (
                      <div>
                        <p className="font-medium">{row.brand} {row.model}</p>
                        <p className="text-sm text-muted-foreground">{row.registration_number}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'utilization_rate',
                    label: 'Utilization',
                    sortable: true,
                    render: (value) => (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(value, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{value.toFixed(1)}%</span>
                      </div>
                    ),
                  },
                  {
                    key: 'rental_count',
                    label: 'Rentals',
                    sortable: true,
                  },
                  {
                    key: 'total_revenue',
                    label: 'Revenue',
                    sortable: true,
                    render: (value) => `${formatCurrency(value)} DZD`,
                  },
                  {
                    key: 'revenue_per_day',
                    label: 'Avg/Day',
                    sortable: true,
                    render: (value) => `${formatCurrency(value)} DZD`,
                  },
                  {
                    key: 'current_status',
                    label: 'Status',
                    render: (value) => (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        value === 'available' ? 'bg-green-100 text-green-800' :
                        value === 'rented' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {value}
                      </span>
                    ),
                  },
                ]}
                data={vehicleData.vehicles}
              />
            </div>
          )}
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Contracts"
              value={contractData?.total_contracts || 0}
              subtitle="all time"
            />
            <StatCard
              title="Active Now"
              value={contractData?.by_status.active || 0}
              subtitle="currently active"
            />
            <StatCard
              title="Completed"
              value={contractData?.by_status.completed || 0}
              subtitle="successfully finished"
            />
            <StatCard
              title="Completion Rate"
              value={`${(contractData?.completion_rate || 0).toFixed(1)}%`}
              subtitle="success rate"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border bg-card p-6">
              {contractData?.by_status ? (
                <ContractsChart data={contractData.by_status} />
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No contract data
                </div>
              )}
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-semibold mb-6">Contract Metrics</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Average Contract Value</span>
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
                    <span className="text-sm font-medium">Average Duration</span>
                    <span className="text-sm text-muted-foreground">
                      {contractData?.avg_duration_days || 0} days
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full">
                    <div className="h-full w-1/2 bg-green-600 rounded-full" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center p-4 rounded-lg bg-blue-50">
                    <p className="text-2xl font-bold text-blue-600">
                      {contractData?.by_status.active || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-green-50">
                    <p className="text-2xl font-bold text-green-600">
                      {contractData?.by_status.completed || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-red-50">
                    <p className="text-2xl font-bold text-red-600">
                      {contractData?.by_status.cancelled || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Cancelled</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Customers"
              value={customerData?.total_customers || 0}
              subtitle="all customers"
            />
            <StatCard
              title="VIP Customers"
              value={customerData?.segments.vip.count || 0}
              subtitle={`${formatCurrency(customerData?.segments.vip.total_value || 0)} DZD value`}
            />
            <StatCard
              title="New Customers"
              value={dashboardData?.customers.new || 0}
              subtitle="this period"
            />
            <StatCard
              title="Retention Rate"
              value={`${(dashboardData?.customers.retention_rate || 0).toFixed(1)}%`}
              subtitle="customer loyalty"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { 
                title: 'VIP', 
                data: customerData?.segments.vip,
                color: 'bg-purple-100 border-purple-200 text-purple-800'
              },
              { 
                title: 'High Value', 
                data: customerData?.segments.high_value,
                color: 'bg-blue-100 border-blue-200 text-blue-800'
              },
              { 
                title: 'Medium Value', 
                data: customerData?.segments.medium_value,
                color: 'bg-green-100 border-green-200 text-green-800'
              },
              { 
                title: 'Low Value', 
                data: customerData?.segments.low_value,
                color: 'bg-gray-100 border-gray-200 text-gray-800'
              },
            ].map((segment) => (
              <div key={segment.title} className={`rounded-lg border p-6 ${segment.color}`}>
                <p className="text-sm font-medium mb-2">{segment.title}</p>
                <p className="text-3xl font-bold mb-1">{segment.data?.count || 0}</p>
                <p className="text-xs opacity-80">
                  {formatCurrency(segment.data?.total_value || 0)} DZD
                </p>
              </div>
            ))}
          </div>

          {customerData?.segments.vip.customers && customerData.segments.vip.customers.length > 0 && (
            <div className="rounded-lg border bg-card">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Top VIP Customers</h3>
              </div>
              <DataTable
                columns={[
                  {
                    key: 'full_name',
                    label: 'Customer',
                    sortable: true,
                    render: (value, row) => (
                      <div>
                        <p className="font-medium">{value}</p>
                        <p className="text-sm text-muted-foreground">{row.email}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'customer_type',
                    label: 'Type',
                    sortable: true,
                    render: (value) => (
                      <span className="capitalize">{value}</span>
                    ),
                  },
                  {
                    key: 'total_rentals',
                    label: 'Rentals',
                    sortable: true,
                  },
                  {
                    key: 'lifetime_value',
                    label: 'Lifetime Value',
                    sortable: true,
                    render: (value) => `${formatCurrency(parseFloat(value))} DZD`,
                  },
                ]}
                data={customerData.segments.vip.customers}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}