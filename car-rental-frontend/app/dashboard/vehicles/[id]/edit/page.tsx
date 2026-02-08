// app/dashboard/vehicles/[id]/edit/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import toast from "react-hot-toast"
import { getVehicleById, updateVehicle, type Vehicle } from "@/lib/vehicles.api"

export default function EditVehiclePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    registration_number: "",
    vin: "",
    color: "",
    transmission: "manual" as "manual" | "automatic",
    fuel_type: "petrol" as "petrol" | "diesel" | "electric" | "hybrid",
    seats: 5,
    daily_rate: 0,
    status: "available" as "available" | "rented" | "maintenance" | "retired",
    mileage: 0,
    purchase_price: 0,
    purchase_date: "",
    notes: "",
  })

  useEffect(() => {
    if (!id) return

    const fetchVehicle = async () => {
      setLoading(true)
      try {
        const response = await getVehicleById(id)
        if (response.success) {
          const vehicle = response.data.vehicle
          setFormData({
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            registration_number: vehicle.registration_number,
            vin: vehicle.vin || "",
            color: vehicle.color || "",
            transmission: vehicle.transmission,
            fuel_type: vehicle.fuel_type,
            seats: vehicle.seats,
            daily_rate: vehicle.daily_rate,
            status: vehicle.status,
            mileage: vehicle.mileage,
            purchase_price: vehicle.purchase_price || 0,
            purchase_date: vehicle.purchase_date || "",
            notes: vehicle.notes || "",
          })
        } else {
          toast.error('Failed to load vehicle details')
          router.push('/dashboard/vehicles')
        }
      } catch (error: any) {
        console.error('Failed to fetch vehicle:', error)
        toast.error(error.message || 'Failed to load vehicle details')
        router.push('/dashboard/vehicles')
      } finally {
        setLoading(false)
      }
    }

    fetchVehicle()
  }, [id, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.brand || !formData.model || !formData.registration_number) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.daily_rate <= 0) {
      toast.error('Daily rate must be greater than 0')
      return
    }

    setLoading(true)
    try {
      const response = await updateVehicle(id, {
        ...formData,
        year: Number(formData.year),
        seats: Number(formData.seats),
        daily_rate: Number(formData.daily_rate),
        mileage: Number(formData.mileage),
        purchase_price: formData.purchase_price ? Number(formData.purchase_price) : undefined,
      })

      if (response.success) {
        toast.success('Vehicle updated successfully!')
        router.back() // Back to view page
      }
    } catch (error: any) {
      console.error('Update vehicle error:', error)
      toast.error(error.details || error.message || 'Failed to update vehicle')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !formData.brand) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Vehicle</h1>
          <p className="text-muted-foreground">Update vehicle information</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Brand <span className="text-destructive">*</span>
              </label>
              <Input
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder="e.g., Toyota"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Model <span className="text-destructive">*</span>
              </label>
              <Input
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                placeholder="e.g., Corolla"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Year <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                min={1900}
                max={new Date().getFullYear() + 1}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Registration Number <span className="text-destructive">*</span>
              </label>
              <Input
                name="registration_number"
                value={formData.registration_number}
                onChange={handleInputChange}
                placeholder="e.g., ABC-123-45"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">VIN</label>
              <Input
                name="vin"
                value={formData.vin}
                onChange={handleInputChange}
                placeholder="17-character VIN"
                maxLength={17}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <Input
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                placeholder="e.g., White"
              />
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Specifications</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Transmission <span className="text-destructive">*</span>
              </label>
              <select
                name="transmission"
                value={formData.transmission}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                required
              >
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Fuel Type <span className="text-destructive">*</span>
              </label>
              <select
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                required
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Seats <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                name="seats"
                value={formData.seats}
                onChange={handleInputChange}
                min={1}
                max={50}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Status <span className="text-destructive">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                required
              >
                <option value="available">Available</option>
                <option value="rented">Rented</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pricing & Mileage */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Pricing & Mileage</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Daily Rate (DZD) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                name="daily_rate"
                value={formData.daily_rate}
                onChange={handleInputChange}
                min={0}
                step={100}
                placeholder="e.g., 25000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Current Mileage (km)</label>
              <Input
                type="number"
                name="mileage"
                value={formData.mileage}
                onChange={handleInputChange}
                min={0}
                placeholder="e.g., 15000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Purchase Price (DZD)</label>
              <Input
                type="number"
                name="purchase_price"
                value={formData.purchase_price}
                onChange={handleInputChange}
                min={0}
                step={1000}
                placeholder="e.g., 3500000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Purchase Date</label>
              <Input
                type="date"
                name="purchase_date"
                value={formData.purchase_date}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Additional Information</h2>
          
          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border rounded-md bg-background min-h-[100px]"
              placeholder="Any additional notes about this vehicle..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}