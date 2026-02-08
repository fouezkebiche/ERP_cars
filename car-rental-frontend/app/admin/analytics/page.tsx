"use client"

import { KPICard } from "@/components/dashboard/kpi-card"
import { DataTable } from "@/components/dashboard/data-table"
import { TrendingUp, Users, CreditCard, Activity } from "lucide-react"

export default function AdminAnalyticsPage() {
  const platformStats = [
    {
      metric: "Platform Growth",
      value: "+15%",
      description: "New companies this month",
    },
    {
      metric: "MRR Growth",
      value: "+22%",
      description: "Month over month",
    },
    {
      metric: "User Retention",
      value: "97.5%",
      description: "Monthly active users",
    },
    {
      metric: "System Health",
      value: "99.98%",
      description: "Platform uptime",
    },
  ]

  const featureUsage = [
    { feature: "Vehicle Management", usage: 92, activeCompanies: 4 },
    { feature: "Customer CRM", usage: 88, activeCompanies: 4 },
    { feature: "Contract Management", usage: 81, activeCompanies: 3 },
    { feature: "Payment Tracking", usage: 75, activeCompanies: 3 },
    { feature: "Analytics & Reports", usage: 68, activeCompanies: 2 },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Platform Analytics</h1>
        <p className="text-muted-foreground">Detailed insights into platform usage and performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Platform Growth" value="+15%" trend={15} icon={<TrendingUp className="w-6 h-6" />} />
        <KPICard
          label="Monthly Recurring Revenue"
          value="65,000"
          suffix="DZD"
          trend={22}
          icon={<CreditCard className="w-6 h-6" />}
        />
        <KPICard label="Active Users" value={20} trend={12} icon={<Users className="w-6 h-6" />} />
        <KPICard label="System Health" value="99.98%" icon={<Activity className="w-6 h-6" />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg border border-border bg-card">
          <h3 className="font-semibold mb-4">Platform Growth Trend</h3>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            [Line Chart - Companies and MRR over time]
          </div>
        </div>
        <div className="p-6 rounded-lg border border-border bg-card">
          <h3 className="font-semibold mb-4">Revenue by Plan Tier</h3>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            [Pie Chart - Revenue distribution]
          </div>
        </div>
      </div>

      {/* Feature Usage */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Feature Adoption</h2>
        <DataTable
          columns={[
            { key: "feature", label: "Feature", sortable: true },
            {
              key: "usage",
              label: "Usage Rate",
              render: (value) => (
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${value}%` }} />
                  </div>
                  <span className="text-sm">{value}%</span>
                </div>
              ),
              sortable: true,
            },
            { key: "activeCompanies", label: "Active Companies", sortable: true },
          ]}
          data={featureUsage}
        />
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg border border-border bg-card">
          <h3 className="font-semibold mb-4">Geographic Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Algeria</span>
              <span className="font-semibold">4 companies</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg border border-border bg-card">
          <h3 className="font-semibold mb-4">API Usage</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total API Calls (This Month)</p>
              <p className="text-2xl font-bold">1,284,500</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg Response Time</p>
              <p className="text-xl font-semibold">245ms</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
