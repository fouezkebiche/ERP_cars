"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/dashboard/data-table"
import { Search, Edit2, Trash2 } from "lucide-react"

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const users = [
    {
      id: 1,
      name: "John Doe",
      email: "john@eliterentals.com",
      company: "Elite Rentals",
      role: "Admin",
      joinDate: "2024-01-15",
    },
    {
      id: 2,
      name: "Sarah Ahmed",
      email: "sarah@speedmotors.com",
      company: "Speed Motors",
      role: "Manager",
      joinDate: "2024-02-20",
    },
    {
      id: 3,
      name: "Ali Hassan",
      email: "ali@premiumfleet.com",
      company: "Premium Fleet",
      role: "Staff",
      joinDate: "2023-12-01",
    },
    {
      id: 4,
      name: "Fatima Saadi",
      email: "fatima@eliterentals.com",
      company: "Elite Rentals",
      role: "Manager",
      joinDate: "2024-01-20",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Users</h1>
          <p className="text-muted-foreground">Manage platform users and permissions</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search users by name or email..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground mb-1">Total Users</p>
          <p className="text-2xl font-bold">4</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground mb-1">Admins</p>
          <p className="text-2xl font-bold">1</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground mb-1">Active This Month</p>
          <p className="text-2xl font-bold">4</p>
        </div>
      </div>

      {/* Users Table */}
      <DataTable
        columns={[
          { key: "name", label: "Name", sortable: true },
          { key: "email", label: "Email" },
          { key: "company", label: "Company", sortable: true },
          {
            key: "role",
            label: "Role",
            render: (role) => (
              <span className="px-2 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">{role}</span>
            ),
            sortable: true,
          },
          {
            key: "joinDate",
            label: "Join Date",
            render: (value) => new Date(value).toLocaleDateString(),
            sortable: true,
          },
          {
            key: "id",
            label: "Actions",
            render: () => (
              <div className="flex gap-2">
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
        data={users}
      />
    </div>
  )
}
