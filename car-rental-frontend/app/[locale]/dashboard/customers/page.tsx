// app/[locale]/dashboard/customers/page.tsx (FULLY LOCALIZED)
"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Plus, Search, Eye, Edit2, Trash2, Users, Building2, AlertTriangle } from "lucide-react"
import { customerApi, Customer } from "@/lib/customerApi"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

export default function CustomersPage() {
  const t = useTranslations("customers")
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total_customers: 0,
    by_type: { individual: 0, corporate: 0 },
    blacklisted: 0,
    recent_customers_30d: 0,
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
  })
  const [filterType, setFilterType] = useState<"all" | "individual" | "corporate">("all")

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await customerApi.list({
        search: searchTerm || undefined,
        customer_type: filterType !== "all" ? filterType : undefined,
        page: pagination.page,
        limit: pagination.limit,
      })

      setCustomers(response.data.customers)
      setPagination({
        ...pagination,
        total: response.meta.pagination.total,
        total_pages: response.meta.pagination.total_pages,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failedToLoad"))
    } finally {
      setLoading(false)
    }
  }

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await customerApi.getStats()
      setStats(response.data.stats)
    } catch (error) {
      console.error("Failed to load stats:", error)
    }
  }

  // Delete customer
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t("deleteConfirm", { name }))) {
      return
    }

    try {
      await customerApi.delete(id)
      toast.success(t("customerDeleted"))
      fetchCustomers()
      fetchStats()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failedToDelete"))
    }
  }

  // View customer details
  const handleView = (id: string) => {
    router.push(`/dashboard/customers/${id}`)
  }

  // Edit customer
  const handleEdit = (id: string) => {
    router.push(`/dashboard/customers/${id}/edit`)
  }

  useEffect(() => {
    fetchCustomers()
    fetchStats()
  }, [searchTerm, filterType, pagination.page])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90"
          onClick={() => router.push("/dashboard/customers/new")}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("newCustomer")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">{t("totalCustomers")}</p>
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold">{stats.total_customers}</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">{t("individual")}</p>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-500">{stats.by_type.individual}</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">{t("corporate")}</p>
            <Building2 className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-500">{stats.by_type.corporate}</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">{t("blacklisted")}</p>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <p className="text-2xl font-bold text-destructive">{stats.blacklisted}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterType === "all" ? "default" : "outline"}
            onClick={() => setFilterType("all")}
          >
            {t("all")}
          </Button>
          <Button
            variant={filterType === "individual" ? "default" : "outline"}
            onClick={() => setFilterType("individual")}
          >
            <Users className="w-4 h-4 mr-2" />
            {t("individual")}
          </Button>
          <Button
            variant={filterType === "corporate" ? "default" : "outline"}
            onClick={() => setFilterType("corporate")}
          >
            <Building2 className="w-4 h-4 mr-2" />
            {t("corporate")}
          </Button>
        </div>
      </div>

      {/* Customers Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <DataTable
            columns={[
              {
                key: "full_name",
                label: t("name"),
                sortable: true,
                render: (value, row) => (
                  <div>
                    <p className="font-medium">{value}</p>
                    {row.company_name && (
                      <p className="text-xs text-muted-foreground">{row.company_name}</p>
                    )}
                  </div>
                ),
              },
              {
                key: "customer_type",
                label: t("type"),
                render: (value) => (
                  <div className="flex items-center gap-2">
                    {value === "individual" ? (
                      <Users className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Building2 className="w-4 h-4 text-purple-500" />
                    )}
                    <span className="capitalize">{value}</span>
                  </div>
                ),
              },
              {
                key: "email",
                label: t("contact"),
                render: (value, row) => (
                  <div>
                    <p className="text-sm">{value || "—"}</p>
                    <p className="text-xs text-muted-foreground">{row.phone}</p>
                  </div>
                ),
              },
              {
                key: "drivers_license_number",
                label: t("license"),
                render: (value) => value || "—",
              },
              {
                key: "total_rentals",
                label: t("rentals"),
                sortable: true,
                render: (value) => (
                  <span className="font-semibold">{value}</span>
                ),
              },
              {
                key: "lifetime_value",
                label: t("lifetimeValue"),
                sortable: true,
                render: (value) => (
                  <span className="font-semibold">
                    {parseFloat(value).toLocaleString()} DZD
                  </span>
                ),
              },
              {
                key: "is_blacklisted",
                label: t("status"),
                render: (value) =>
                  value ? (
                    <StatusBadge status="cancelled" label={t("blacklistedLabel")} />
                  ) : (
                    <StatusBadge status="active" label={t("active")} />
                  ),
              },
              {
                key: "actions",
                label: t("actions"),
                render: (_, row) => (
                  <div className="flex gap-2">
                    <button
                      className="p-1 hover:bg-muted rounded"
                      title={t("viewDetails")}
                      onClick={() => handleView(row.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1 hover:bg-muted rounded"
                      title={t("edit")}
                      onClick={() => handleEdit(row.id)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1 hover:bg-destructive/10 rounded text-destructive"
                      title={t("delete")}
                      onClick={() => handleDelete(row.id, row.full_name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={customers}
          />

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t("showing", { count: customers.length, total: pagination.total })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              >
                {t("previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.total_pages}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              >
                {t("next")}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
