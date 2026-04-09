// app/[locale]/dashboard/vehicles/page.tsx (FULLY LOCALIZED)
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Plus, Search, Grid2X2, List, Eye, Edit2, Trash2, Loader2, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"
import { getVehicles, deleteVehicle, type Vehicle } from "@/lib/vehicles.api"
import { useNotifications } from "@/hooks/useNotifications"
import { useTranslations } from "next-intl"

export default function VehiclesPage() {
  const t = useTranslations("vehicles")
  const router = useRouter()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
  })

  // Fetch maintenance alerts for all vehicles
  const { data: vehicleAlertsData, loading: alertsLoading } = useNotifications({ 
    type: 'vehicle_maintenance', 
    limit: 100, 
    unread: true 
  })
  const alertsByVehicle = vehicleAlertsData?.notifications.reduce((acc: { [key: string]: number }, notif) => {
    const vid = notif.data?.vehicle_id;
    if (vid) acc[vid] = (acc[vid] || 0) + 1;
    return acc;
  }, {}) || {}

  // Fetch vehicles from API
  const fetchVehicles = async () => {
    setLoading(true)
    try {
      const response = await getVehicles({
        status: filters.status !== "all" ? filters.status : undefined,
        search: filters.search || undefined,
        page: pagination.page,
        limit: pagination.limit,
        sort_by: 'created_at',
        sort_order: 'DESC',
      })
      if (response.success) {
        setVehicles(response.data.vehicles)
        if (response.meta?.pagination) {
          setPagination(prev => ({
            ...prev,
            total: response.meta!.pagination.total,
            total_pages: response.meta!.pagination.total_pages,
          }))
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch vehicles:', error)
      toast.error(error.message || t("failedToLoad"))
    } finally {
      setLoading(false)
    }
  }

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchVehicles()
  }, [filters.status, pagination.page])

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search !== undefined) {
        fetchVehicles()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [filters.search])

  // Handle delete
  const handleDelete = async (vehicleId: string) => {
    if (!confirm(t("deleteConfirm"))) {
      return
    }
    try {
      const response = await deleteVehicle(vehicleId)
      if (response.success) {
        toast.success(t("vehicleDeleted"))
        fetchVehicles() // Refresh list
      }
    } catch (error: any) {
      toast.error(error.details || t("failedToDelete"))
    }
  }

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
          onClick={() => router.push('/dashboard/vehicles/new')}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("addVehicle")}
        </Button>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-1 gap-4 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              className="pl-10"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <select
            className="px-3 py-2 border border-border rounded-md bg-background"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="all">{t("allStatus")}</option>
            <option value="available">{t("available")}</option>
            <option value="rented">{t("rented")}</option>
            <option value="maintenance">{t("maintenance")}</option>
            <option value="retired">{t("retired")}</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-md transition-colors ${
              viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <Grid2X2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-md transition-colors ${
              viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {(loading || alertsLoading) && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!loading && vehicles.length === 0 && (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground mb-4">{t("noVehiclesFound")}</p>
          <Button onClick={() => router.push('/dashboard/vehicles/new')}>
            <Plus className="w-4 h-4 mr-2" />
            {t("addYourFirstVehicle")}
          </Button>
        </div>
      )}

      {/* Grid View */}
      {!loading && viewMode === "grid" && vehicles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="rounded-lg border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="h-40 bg-muted flex items-center justify-center">
                {vehicle.photos && vehicle.photos.length > 0 ? (
                  <img
                    src={vehicle.photos[0]}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground text-sm">{t("noImage")}</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    <p className="text-sm text-muted-foreground">{t("registration")}: {vehicle.registration_number}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={vehicle.status as any} />
                    {alertsByVehicle[vehicle.id] > 0 && (
                      <StatusBadge 
                        status="critical" 
                        label={`(${alertsByVehicle[vehicle.id]})`}
                      />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t("year")}</p>
                    <p className="font-semibold">{vehicle.year}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("dailyRate")}</p>
                    <p className="font-semibold">{vehicle.daily_rate.toLocaleString()} DZD</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("transmission")}</p>
                    <p className="font-semibold capitalize">{vehicle.transmission}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("fuel")}</p>
                    <p className="font-semibold capitalize">{vehicle.fuel_type}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => router.push(`/dashboard/vehicles/${vehicle.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {t("view")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => router.push(`/dashboard/vehicles/${vehicle.id}/edit`)}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    {t("edit")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent text-destructive hover:text-destructive"
                    onClick={() => handleDelete(vehicle.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {!loading && viewMode === "list" && vehicles.length > 0 && (
        <DataTable
          columns={[
            {
              key: "brand",
              label: t("vehicle"),
              render: (value, row: any) => (
                <div>
                  <p className="font-semibold">
                    {row.brand} {row.model}
                  </p>
                  <p className="text-sm text-muted-foreground">{t("registration")}: {row.registration_number}</p>
                </div>
              ),
              sortable: true,
            },
            {
              key: "year",
              label: t("year"),
              sortable: true,
            },
            {
              key: "daily_rate",
              label: t("dailyRate"),
              render: (value) => `${Number(value).toLocaleString()} DZD`,
              sortable: true,
            },
            {
              key: "transmission",
              label: t("transmission"),
              render: (value) => <span className="capitalize">{value}</span>,
            },
            {
              key: "status",
              label: t("status"),
              render: (status) => <StatusBadge status={status as any} />,
              sortable: true,
            },
            {
              key: "alerts",
              label: t("alerts"),
              render: (_, row) => (
                <div className="flex items-center gap-1">
                  {alertsByVehicle[row.id] > 0 ? (
                    <StatusBadge status="critical" label={`(${alertsByVehicle[row.id]})`} />
                  ) : (
                    <span className="text-xs text-muted-foreground">{t("none")}</span>
                  )}
                </div>
              ),
            },
            {
              key: "id",
              label: t("actions"),
              render: (id) => (
                <div className="flex gap-2">
                  <button
                    className="p-1 hover:bg-muted rounded"
                    onClick={() => router.push(`/dashboard/vehicles/${id}`)}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1 hover:bg-muted rounded"
                    onClick={() => router.push(`/dashboard/vehicles/${id}/edit`)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1 hover:bg-muted rounded"
                    onClick={() => handleDelete(id as string)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              ),
            },
          ]}
          data={vehicles}
        />
      )}

      {/* Pagination */}
      {!loading && vehicles.length > 0 && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("showing")} {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} {t("of")} {pagination.total} {t("vehicles")}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              {t("previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.total_pages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              {t("next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
