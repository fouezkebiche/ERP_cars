"use client"

import { KPICard } from "@/components/dashboard/kpi-card"
import { DataTable } from "@/components/dashboard/data-table"
import { TrendingUp, Building2, Users, CreditCard } from "lucide-react"

export default function AdminDashboard() {
  const companies = [
    { id: 1, name: "Elite Rentals", plan: "Professional", status: "active", users: 5, vehicles: 40, mrr: "15,000 DZD" },
    { id: 2, name: "Speed Motors", plan: "Basic", status: "active", users: 2, vehicles: 15, mrr: "5,000 DZD" },
    { id: 3, name: "Premium Fleet", plan: "Enterprise", status: "active", users: 12, vehicles: 120, mrr: "45,000 DZD" },
    { id: 4, name: "Budget Rentals", plan: "Basic", status: "inactive", users: 1, vehicles: 8, mrr: "0 DZD" },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Platform Overview</h1>
        <p className="text-muted-foreground">Monitor the overall health and performance of the CarManager platform</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Companies" value={4} trend={15} icon={<Building2 className="w-6 h-6" />} />
        <KPICard label="Active Subscriptions" value={3} icon={<CreditCard className="w-6 h-6" />} />
        <KPICard
          label="Monthly Recurring Revenue"
          value="65,000"
          suffix="DZD"
          trend={8}
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <KPICard label="Total Users" value={20} trend={12} icon={<Users className="w-6 h-6" />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg border border-border bg-card">
          <h3 className="font-semibold mb-4">Platform Growth (Last 6 Months)</h3>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            [Line Chart - Company and MRR growth]
          </div>
        </div>
        <div className="p-6 rounded-lg border border-border bg-card">
          <h3 className="font-semibold mb-4">Revenue by Plan</h3>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            [Pie Chart - Revenue breakdown by subscription tier]
          </div>
        </div>
      </div>

      {/* Companies Table */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Active Companies</h2>
        <DataTable
          columns={[
            { key: "name", label: "Company Name", sortable: true },
            { key: "plan", label: "Plan", sortable: true },
            {
              key: "status",
              label: "Status",
              render: (status) => (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    status === "active" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {status === "active" ? "Active" : "Inactive"}
                </span>
              ),
            },
            { key: "users", label: "Users", sortable: true },
            { key: "vehicles", label: "Vehicles", sortable: true },
            { key: "mrr", label: "MRR", sortable: true },
          ]}
          data={companies}
        />
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground mb-2">Churn Rate</p>
          <p className="text-2xl font-bold">2.5%</p>
          <p className="text-xs text-accent mt-2">Excellent retention</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground mb-2">Avg. Vehicles/Company</p>
          <p className="text-2xl font-bold">45.8</p>
          <p className="text-xs text-muted-foreground mt-2">Total: 183 vehicles</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground mb-2">Platform Uptime</p>
          <p className="text-2xl font-bold">99.98%</p>
          <p className="text-xs text-accent mt-2">This month</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground mb-2">Avg. Response Time</p>
          <p className="text-2xl font-bold">245ms</p>
          <p className="text-xs text-muted-foreground mt-2">All API calls</p>
        </div>
      </div>
    </div>
  )
}
