// components/dashboard/VehicleCostsTab.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Loader2, Calendar, DollarSign } from "lucide-react"
import toast from "react-hot-toast"
import { getVehicleCosts, addVehicleCost, type VehicleCost } from "@/lib/vehicles.api"
import { format } from "date-fns"

interface VehicleCostsTabProps {
  vehicleId: string
}

export function VehicleCostsTab({ vehicleId }: VehicleCostsTabProps) {
  const [costs, setCosts] = useState<VehicleCost[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [totalCost, setTotalCost] = useState(0)
  const [filters, setFilters] = useState({
    cost_type: "all",
    start_date: "",
    end_date: "",
  })
  const [formData, setFormData] = useState({
    cost_type: "maintenance" as VehicleCost['cost_type'],
    amount: 0,
    incurred_date: new Date().toISOString().split('T')[0],
    description: "",
  })

  // Fetch costs
  const fetchCosts = async () => {
    setLoading(true)
    try {
      const response = await getVehicleCosts(vehicleId, {
        cost_type: filters.cost_type !== "all" ? filters.cost_type : undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
      })

      if (response.success) {
        setCosts(response.data.costs)
        setTotalCost(response.data.total_cost)
      }
    } catch (error: any) {
      console.error('Failed to fetch costs:', error)
      toast.error('Failed to load vehicle costs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCosts()
  }, [vehicleId, filters.cost_type, filters.start_date, filters.end_date])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.amount <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }

    setSubmitting(true)
    try {
      const response = await addVehicleCost(vehicleId, {
        ...formData,
        amount: Number(formData.amount),
      })

      if (response.success) {
        toast.success('Cost added successfully!')
        setShowAddForm(false)
        setFormData({
          cost_type: "maintenance",
          amount: 0,
          incurred_date: new Date().toISOString().split('T')[0],
          description: "",
        })
        fetchCosts() // Refresh list
      }
    } catch (error: any) {
      console.error('Add cost error:', error)
      toast.error(error.details || error.message || 'Failed to add cost')
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

  const costTypeColors: Record<VehicleCost['cost_type'], string> = {
    fuel: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    maintenance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    insurance: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    registration: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    cleaning: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
    repair: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  }

  return (
    <div className="space-y-6">
      {/* Header with Total */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vehicle Costs</h2>
          <p className="text-muted-foreground">Track maintenance and operational expenses</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Costs</p>
          <p className="text-2xl font-bold text-primary">{totalCost.toLocaleString()} DZD</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <select
          className="px-3 py-2 border border-border rounded-md bg-background"
          value={filters.cost_type}
          onChange={(e) => setFilters({ ...filters, cost_type: e.target.value })}
        >
          <option value="all">All Types</option>
          <option value="fuel">Fuel</option>
          <option value="maintenance">Maintenance</option>
          <option value="insurance">Insurance</option>
          <option value="registration">Registration</option>
          <option value="cleaning">Cleaning</option>
          <option value="repair">Repair</option>
          <option value="other">Other</option>
        </select>

        <Input
          type="date"
          value={filters.start_date}
          onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
          placeholder="Start date"
          className="max-w-xs"
        />

        <Input
          type="date"
          value={filters.end_date}
          onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
          placeholder="End date"
          className="max-w-xs"
        />

        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="ml-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Cost
        </Button>
      </div>

      {/* Add Cost Form */}
      {showAddForm && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Add New Cost</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Cost Type <span className="text-destructive">*</span>
                </label>
                <select
                  name="cost_type"
                  value={formData.cost_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  required
                >
                  <option value="fuel">Fuel</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="insurance">Insurance</option>
                  <option value="registration">Registration</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="repair">Repair</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Amount (DZD) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  min={0}
                  step={100}
                  placeholder="e.g., 5000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Date <span className="text-destructive">*</span>
                </label>
                <Input
                  type="date"
                  name="incurred_date"
                  value={formData.incurred_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background min-h-[80px]"
                  placeholder="e.g., Oil change and filter replacement"
                />
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
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
                    Adding...
                  </>
                ) : (
                  'Add Cost'
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
      {!loading && costs.length === 0 && (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground mb-4">No costs recorded yet</p>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Cost
          </Button>
        </div>
      )}

      {/* Costs List */}
      {!loading && costs.length > 0 && (
        <div className="space-y-3">
          {costs.map((cost) => (
            <div
              key={cost.id}
              className="rounded-lg border border-border bg-card p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${costTypeColors[cost.cost_type]}`}>
                      {cost.cost_type.charAt(0).toUpperCase() + cost.cost_type.slice(1)}
                    </span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(cost.incurred_date), 'PPP')}
                    </span>
                  </div>
                  {cost.description && (
                    <p className="text-sm text-muted-foreground">{cost.description}</p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className="text-lg font-bold flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {Number(cost.amount).toLocaleString()} DZD
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