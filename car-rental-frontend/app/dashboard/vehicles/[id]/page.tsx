// app/dashboard/vehicles/[id]/page.tsx - UPDATED WITH MAINTENANCE TAB & ALERTS
"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Edit2, Trash2, X } from "lucide-react"  // STEP 3: Add X for dismiss
import toast from "react-hot-toast"
import { getVehicleById, deleteVehicle, type Vehicle } from "@/lib/vehicles.api"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { format } from "date-fns"
import { VehicleCostsTab } from "@/components/dashboard/VehicleCostsTab"
import { VehiclePhotosTab } from "@/components/dashboard/VehiclePhotosTab"
import { VehicleMaintenanceTab } from "@/components/dashboard/VehicleMaintenanceTab"
import { useNotifications } from "@/hooks/useNotifications"  // STEP 3: New import

export default function ViewVehiclePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<"details" | "maintenance" | "costs" | "photos">("details")

  // STEP 3: Fetch vehicle-specific maintenance alerts
  const { 
    data: vehicleNotifsData, 
    loading: notifsLoading, 
    dismissNotification, 
    restoreNotification 
  } = useNotifications({ 
    type: 'vehicle_maintenance', 
    vehicleId: id, 
    unread: true 
  })
  const vehicleNotifs = vehicleNotifsData?.notifications || []

  const fetchVehicle = async () => {
    if (!id) return
   
    setLoading(true)
    try {
      console.log('🔍 Fetching vehicle:', id)
      const response = await getVehicleById(id)
     
      console.log('✅ Vehicle response:', response)
     
      if (response.success && response.data?.vehicle) {
        setVehicle(response.data.vehicle)
      } else {
        console.error('❌ Invalid response format:', response)
        toast.error('Failed to load vehicle details')
        router.push('/dashboard/vehicles')
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch vehicle:', {
        name: error.name,
        message: error.message,
        details: error.details,
        statusCode: error.statusCode,
        stack: error.stack,
      })
     
      const errorMessage = error.details || error.message || 'Failed to load vehicle details'
      toast.error(errorMessage)
     
      // Only redirect if it's a 404 or critical error
      if (error.statusCode === 404) {
        router.push('/dashboard/vehicles')
      }
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchVehicle()
  }, [id])

  // STEP 3: Handlers for vehicle alerts
  const handleDismissNotif = (notifId: string) => dismissNotification(notifId)
  const handleRestoreNotif = (notifId: string) => restoreNotification(notifId)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      return
    }
    setDeleting(true)
    try {
      const response = await deleteVehicle(id)
      if (response.success) {
        toast.success('Vehicle deleted successfully')
        router.push('/dashboard/vehicles')
      }
    } catch (error: any) {
      console.error('❌ Delete error:', error)
      const errorMessage = error?.details || error?.message || 'Failed to delete vehicle'
      toast.error(errorMessage)
    } finally {
      setDeleting(false)
    }
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }
  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Vehicle not found</p>
        <Button onClick={() => router.push('/dashboard/vehicles')}>
          Back to Vehicles
        </Button>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {vehicle.brand} {vehicle.model}
            </h1>
            <p className="text-muted-foreground">Vehicle Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/vehicles/${id}/edit`)}
            disabled={deleting}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>
      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "details"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("maintenance")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "maintenance"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Maintenance
          </button>
          <button
            onClick={() => setActiveTab("costs")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "costs"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Costs
          </button>
          <button
            onClick={() => setActiveTab("photos")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "photos"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Photos
          </button>
        </div>
      </div>
      {/* Tab Content */}
      {activeTab === "details" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hero Image */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              {vehicle.photos && vehicle.photos.length > 0 ? (
                <img
                  src={vehicle.photos[0]}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="h-48 bg-muted flex items-center justify-center">
                  <div className="text-muted-foreground text-sm">No image</div>
                </div>
              )}
              <div className="p-4">
                <StatusBadge status={vehicle.status as any} />
              </div>
            </div>
          </div>
          {/* Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Brand</p>
                  <p className="font-semibold">{vehicle.brand}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Model</p>
                  <p className="font-semibold">{vehicle.model}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Year</p>
                  <p className="font-semibold">{vehicle.year}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Registration Number</p>
                  <p className="font-semibold">{vehicle.registration_number}</p>
                </div>
                {vehicle.vin && (
                  <div className="md:col-span-2">
                    <p className="text-muted-foreground">VIN</p>
                    <p className="font-mono">{vehicle.vin}</p>
                  </div>
                )}
                {vehicle.color && (
                  <div>
                    <p className="text-muted-foreground">Color</p>
                    <p className="font-semibold capitalize">{vehicle.color}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Transmission</p>
                  <p className="font-semibold capitalize">{vehicle.transmission}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fuel Type</p>
                  <p className="font-semibold capitalize">{vehicle.fuel_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Seats</p>
                  <p className="font-semibold">{vehicle.seats}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Mileage</p>
                  <p className="font-semibold">{vehicle.mileage.toLocaleString()} km</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Pricing & Purchase</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Daily Rate</p>
                  <p className="font-semibold">{vehicle.daily_rate.toLocaleString()} DZD</p>
                </div>
                {vehicle.purchase_price && (
                  <>
                    <div>
                      <p className="text-muted-foreground">Purchase Price</p>
                      <p className="font-semibold">{vehicle.purchase_price.toLocaleString()} DZD</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Purchase Date</p>
                      <p className="font-semibold">
                        {vehicle.purchase_date ? format(new Date(vehicle.purchase_date), 'PPP') : 'N/A'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
            {vehicle.notes && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4">Notes</h2>
                <p className="text-sm whitespace-pre-wrap">{vehicle.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab === "maintenance" && (
        <div className="space-y-6">  {/* STEP 3: Wrap to add alerts section */}
          <VehicleMaintenanceTab vehicle={vehicle} onUpdate={fetchVehicle} />
          {/* STEP 3: New Vehicle Alerts section */}
          {(notifsLoading || vehicleNotifs.length > 0) && (
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Vehicle Alerts ({vehicleNotifs.length})
              </h3>
              {notifsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                  Loading alerts...
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {vehicleNotifs.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-4 rounded-lg border-l-4 border-l-destructive bg-destructive/10"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-destructive mb-1">
                            🚨 {notif.title}
                          </p>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notif.message}
                          </p>
                          {notif.data && Object.keys(notif.data).length > 0 && (
                            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded mb-2">
                              <strong>Details:</strong> {JSON.stringify(notif.data, null, 2).slice(0, 150)}...
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(notif.created_at).toLocaleString('fr-DZ', {
                              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          {notif.dismissed && (
                            <button
                              onClick={() => handleRestoreNotif(notif.id)}
                              className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                              title="Restore"
                            >
                              Restore
                            </button>
                          )}
                          <button
                            onClick={() => handleDismissNotif(notif.id)}
                            className="p-1 text-destructive hover:bg-destructive/20 rounded"
                            title="Dismiss"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {vehicleNotifs.length === 0 && !notifsLoading && (
                    <p className="text-sm text-muted-foreground text-center py-4">No maintenance alerts for this vehicle.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {activeTab === "costs" && (
        <VehicleCostsTab vehicleId={id} />
      )}
      {activeTab === "photos" && (
        <VehiclePhotosTab vehicle={vehicle} onUpdate={fetchVehicle} />
      )}
    </div>
  )
}