"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/dashboard/data-table"
import { Search, Edit2, Trash2, Eye } from "lucide-react"

export default function AdminCompaniesPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const companies = [
    {
      id: 1,
      name: "Elite Rentals",
      email: "admin@eliterentals.com",
      plan: "Professional",
      joinDate: "2024-01-15",
      status: "active",
      vehicles: 40,
      mrr: "15,000 DZD",
    },
    {
      id: 2,
      name: "Speed Motors",
      email: "admin@speedmotors.com",
      plan: "Basic",
      joinDate: "2024-02-20",
      status: "active",
      vehicles: 15,
      mrr: "5,000 DZD",
    },
    {
      id: 3,
      name: "Premium Fleet",
      email: "admin@premiumfleet.com",
      plan: "Enterprise",
      joinDate: "2023-12-01",
      status: "active",
      vehicles: 120,
      mrr: "45,000 DZD",
    },
    {
      id: 4,
      name: "Budget Rentals",
      email: "admin@budgetrentals.com",
      plan: "Basic",
      joinDate: "2024-03-10",
      status: "inactive",
      vehicles: 8,
      mrr: "0 DZD",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Companies</h1>
          <p className="text-muted-foreground">Manage all registered companies</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search companies..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Companies Table */}
      <DataTable
        columns={[
          { key: "name", label: "Company Name", sortable: true },
          { key: "email", label: "Contact Email" },
          { key: "plan", label: "Plan", sortable: true },
          {
            key: "joinDate",
            label: "Join Date",
            render: (value) => new Date(value).toLocaleDateString(),
            sortable: true,
          },
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
            sortable: true,
          },
          { key: "vehicles", label: "Vehicles" },
          { key: "mrr", label: "MRR" },
          {
            key: "id",
            label: "Actions",
            render: () => (
              <div className="flex gap-2">
                <button className="p-1 hover:bg-muted rounded">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-1 hover:bg-muted rounded">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button className="p-1 hover:bg-muted rounded">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ),
          },
        ]}
        data={companies}
      />
    </div>
  )
}
