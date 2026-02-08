// components/dashboard/VehicleMaintenanceTab.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Wrench, Loader2, Calendar, DollarSign, AlertTriangle, CheckCircle } from "lucide-react"
import toast from "react-hot-toast"
import { completeMaintenanceService, getMaintenanceHistory, type Vehicle } from "@/lib/vehicles.api"
import { format } from "date-fns"

interface MaintenanceRecord {
  id: string
  vehicle_id: string
  cost_type: string
  amount: number
  incurred_date: string
  description: string
  metadata?: {
    service_type?: string
    mileage_at_service?: number
    parts_replaced?: string[]
    technician_name?: string
    service_center?: string
  }
  created_at: string
}

interface MaintenanceStats {
  total_maintenance_count: number
  total_maintenance_costs: number
  average_cost_per_service: number
  last_maintenance_date?: string
  last_maintenance_mileage: number
  next_maintenance_mileage?: number
  km_until_next_maintenance: number
  maintenance_interval_km: number
}

interface VehicleMaintenanceTabProps {
  vehicle: Vehicle
  onUpdate: () => void
}

export function VehicleMaintenanceTab({ vehicle, onUpdate }: VehicleMaintenanceTabProps) {
  const [records, setRecords] = useState<MaintenanceRecord[]>([])
  const [stats, setStats] = useState<MaintenanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCompleteForm, setShowCompleteForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    mileage: vehicle.mileage || 0,
    service_type: "oil_change" as 'oil_change' | 'full_service' | 'tire_change' | 'brake_service' | 'general_inspection' | 'other',
    cost: 0,
    performed_date: new Date().toISOString().split('T')[0],
    description: "",
    next_service_km: vehicle.maintenance_interval_km || 5000,
    parts_replaced: "",
    technician_name: "",
    service_center: "",
  })

  // Fetch maintenance history
  const fetchHistory = async () => {
  setLoading(true)
  try {
    const response = await getMaintenanceHistory(vehicle.id)
    
    if (response.success) {
      // Ensure description is always a string
      const records: MaintenanceRecord[] = response.data.maintenance_records.map((r: any) => ({
        ...r,
        description: r.description || "", // <-- fill undefined with empty string
      }))
      setRecords(records)
      setStats(response.data.stats)
    }
  } catch (error: any) {
    console.error('Failed to fetch maintenance history:', error)
    toast.error('Failed to load maintenance history')
  } finally {
    setLoading(false)
  }
}

  useEffect(() => {
    fetchHistory()
  }, [vehicle.id])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.mileage < vehicle.mileage) {
      toast.error('Mileage cannot be less than current vehicle mileage')
      return
    }

    if (formData.cost <= 0) {
      toast.error('Cost must be greater than 0')
      return
    }

    setSubmitting(true)
    try {
      const parts = formData.parts_replaced 
        ? formData.parts_replaced.split(',').map(p => p.trim()).filter(Boolean)
        : undefined

      const response = await completeMaintenanceService(vehicle.id, {
        mileage: Number(formData.mileage),
        service_type: formData.service_type,
        cost: Number(formData.cost),
        performed_date: formData.performed_date,
        description: formData.description,
        next_service_km: Number(formData.next_service_km),
        parts_replaced: parts,
        technician_name: formData.technician_name || undefined,
        service_center: formData.service_center || undefined,
      })

      if (response.success) {
        toast.success('Maintenance recorded successfully!')
        setShowCompleteForm(false)
        
        // Reset form
        setFormData({
          mileage: response.data.vehicle.mileage,
          service_type: "oil_change",
          cost: 0,
          performed_date: new Date().toISOString().split('T')[0],
          description: "",
          next_service_km: vehicle.maintenance_interval_km || 5000,
          parts_replaced: "",
          technician_name: "",
          service_center: "",
        })
        
        // Refresh data
        fetchHistory()
        onUpdate() // Update parent component (vehicle details)
      }
    } catch (error: any) {
      console.error('Complete maintenance error:', error)
      toast.error(error.details || error.message || 'Failed to record maintenance')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  // Calculate maintenance status
  const getMaintenanceStatus = () => {
    if (!stats) return null

    const kmUntilNext = stats.km_until_next_maintenance

    if (kmUntilNext <= 0) {
      return {
        status: 'overdue',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        icon: AlertTriangle,
        message: `Overdue by ${Math.abs(kmUntilNext).toLocaleString()} km`,
      }
    } else if (kmUntilNext <= 500) {
      return {
        status: 'due_soon',
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        icon: AlertTriangle,
        message: `Due in ${kmUntilNext.toLocaleString()} km`,
      }
    } else {
      return {
        status: 'ok',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        icon: CheckCircle,
        message: `Next service in ${kmUntilNext.toLocaleString()} km`,
      }
    }
  }

  const maintenanceStatus = getMaintenanceStatus()
  const StatusIcon = maintenanceStatus?.icon

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Maintenance</h2>
          <p className="text-muted-foreground">Track vehicle maintenance and service history</p>
        </div>
        <Button
          onClick={() => setShowCompleteForm(!showCompleteForm)}
          className="bg-primary hover:bg-primary/90"
        >
          <Wrench className="w-4 h-4 mr-2" />
          Complete Maintenance
        </Button>
      </div>

      {/* Maintenance Status Card */}
      {stats && maintenanceStatus && (
        <div className={`rounded-lg border p-6 ${maintenanceStatus.bgColor}`}>
          <div className="flex items-start gap-4">
            {StatusIcon && <StatusIcon className={`w-6 h-6 ${maintenanceStatus.color}`} />}
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${maintenanceStatus.color}`}>
                {maintenanceStatus.message}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Current Mileage</p>
                  <p className="font-semibold">{vehicle.mileage.toLocaleString()} km</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Service</p>
                  <p className="font-semibold">
                    {stats.last_maintenance_mileage.toLocaleString()} km
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Next Service</p>
                  <p className="font-semibold">
                    {stats.next_maintenance_mileage?.toLocaleString() || 'N/A'} km
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Service Interval</p>
                  <p className="font-semibold">{stats.maintenance_interval_km.toLocaleString()} km</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Services</p>
            <p className="text-2xl font-bold">{stats.total_maintenance_count}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Costs</p>
            <p className="text-2xl font-bold">{stats.total_maintenance_costs.toLocaleString()} DZD</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Average Cost</p>
            <p className="text-2xl font-bold">{Math.round(stats.average_cost_per_service).toLocaleString()} DZD</p>
          </div>
        </div>
      )}

      {/* Complete Maintenance Form */}
      {showCompleteForm && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Complete Maintenance Service</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Service Type <span className="text-destructive">*</span>
                </label>
                <select
                  name="service_type"
                  value={formData.service_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  required
                >
                  <option value="oil_change">Oil Change</option>
                  <option value="full_service">Full Service</option>
                  <option value="tire_change">Tire Change</option>
                  <option value="brake_service">Brake Service</option>
                  <option value="general_inspection">General Inspection</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Current Mileage (km) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleInputChange}
                  min={vehicle.mileage}
                  step={1}
                  placeholder="e.g., 55000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Cost (DZD) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  min={0}
                  step={100}
                  placeholder="e.g., 8000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Service Date <span className="text-destructive">*</span>
                </label>
                <Input
                  type="date"
                  name="performed_date"
                  value={formData.performed_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Next Service Interval (km)
                </label>
                <Input
                  type="number"
                  name="next_service_km"
                  value={formData.next_service_km}
                  onChange={handleInputChange}
                  min={1000}
                  step={1000}
                  placeholder="e.g., 5000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Technician Name</label>
                <Input
                  type="text"
                  name="technician_name"
                  value={formData.technician_name}
                  onChange={handleInputChange}
                  placeholder="e.g., Ahmed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Service Center</label>
                <Input
                  type="text"
                  name="service_center"
                  value={formData.service_center}
                  onChange={handleInputChange}
                  placeholder="e.g., AutoFix Garage"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Parts Replaced (comma-separated)
                </label>
                <Input
                  type="text"
                  name="parts_replaced"
                  value={formData.parts_replaced}
                  onChange={handleInputChange}
                  placeholder="e.g., Oil Filter, Air Filter"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background min-h-[80px]"
                  placeholder="e.g., Changed oil and filter, inspected brakes"
                  required
                />
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCompleteForm(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Recording...
                  </>
                ) : (
                  'Complete Service'
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!loading && records.length === 0 && (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Wrench className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No maintenance history yet</p>
          <Button onClick={() => setShowCompleteForm(true)}>
            <Wrench className="w-4 h-4 mr-2" />
            Record First Service
          </Button>
        </div>
      )}

      {/* Maintenance History */}
      {!loading && records.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Maintenance History</h3>
          {records.map((record) => (
            <div
              key={record.id}
              className="rounded-lg border border-border bg-card p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                      {record.metadata?.service_type?.replace('_', ' ').toUpperCase() || 'MAINTENANCE'}
                    </span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(record.incurred_date), 'PPP')}
                    </span>
                    {record.metadata?.mileage_at_service && (
                      <span className="text-sm text-muted-foreground">
                        @ {record.metadata.mileage_at_service.toLocaleString()} km
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm mb-2">{record.description}</p>
                  
                  {record.metadata && (
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      {record.metadata.technician_name && (
                        <span>👨‍🔧 {record.metadata.technician_name}</span>
                      )}
                      {record.metadata.service_center && (
                        <span>🏢 {record.metadata.service_center}</span>
                      )}
                      {record.metadata.parts_replaced && record.metadata.parts_replaced.length > 0 && (
                        <span>🔧 {record.metadata.parts_replaced.join(', ')}</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="text-right ml-4">
                  <p className="text-lg font-bold flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {Number(record.amount).toLocaleString()} DZD
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}