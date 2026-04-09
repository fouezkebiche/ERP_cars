// app/[locale]/dashboard/vehicles/new/page.tsx (FULLY LOCALIZED)
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { createVehicle } from "@/lib/vehicles.api"
import { useTranslations } from "next-intl"

export default function AddVehiclePage() {
  const t = useTranslations("vehicles")
  const router = useRouter()
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
    // Maintenance configuration (per vehicle)
    maintenance_interval_km: 5000,
    maintenance_alert_threshold: 100,
    last_maintenance_mileage: 0,
    next_maintenance_mileage: 5000,
    purchase_price: 0,
    purchase_date: "",
    notes: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.brand || !formData.model || !formData.registration_number) {
      toast.error(t("fillRequiredFields"))
      return
    }

    if (formData.daily_rate <= 0) {
      toast.error(t("dailyRateRequired"))
      return
    }

    setLoading(true)
    try {
      const response = await createVehicle({
        ...formData,
        year: Number(formData.year),
        seats: Number(formData.seats),
        daily_rate: Number(formData.daily_rate),
        mileage: Number(formData.mileage),
        maintenance_interval_km: Number(formData.maintenance_interval_km),
        maintenance_alert_threshold: Number(formData.maintenance_alert_threshold),
        last_maintenance_mileage: Number(formData.last_maintenance_mileage),
        next_maintenance_mileage: Number(formData.next_maintenance_mileage),
        purchase_price: formData.purchase_price ? Number(formData.purchase_price) : undefined,
      })

      if (response.success) {
        toast.success(t("vehicleCreated"))
        router.push('/dashboard/vehicles')
      }
    } catch (error: any) {
      console.error('Create vehicle error:', error)
      toast.error(error.details || error.message || t("failedToCreate"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("back")}
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t("addNewVehicle")}</h1>
          <p className="text-muted-foreground">{t("addNewVehicleDesc")}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">{t("basicInformation")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="brand" className="block text-sm font-medium mb-2">
                {t("brand")} *
              </label>
              <Input
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder={t("brand")}
              />
            </div>
            <div>
              <label htmlFor="model" className="block text-sm font-medium mb-2">
                {t("model")} *
              </label>
              <Input
                id="model"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                placeholder={t("model")}
              />
            </div>
            <div>
              <label htmlFor="year" className="block text-sm font-medium mb-2">
                {t("year")} *
              </label>
              <Input
                id="year"
                name="year"
                type="number"
                value={formData.year}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear() + 1}
              />
            </div>
            <div>
              <label htmlFor="registration_number" className="block text-sm font-medium mb-2">
                {t("registrationNumber")} *
              </label>
              <Input
                id="registration_number"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleInputChange}
                placeholder={t("registrationNumber")}
              />
            </div>
            <div>
              <label htmlFor="vin" className="block text-sm font-medium mb-2">
                {t("vin")}
              </label>
              <Input
                id="vin"
                name="vin"
                value={formData.vin}
                onChange={handleInputChange}
                placeholder={t("vin")}
              />
            </div>
            <div>
              <label htmlFor="color" className="block text-sm font-medium mb-2">
                {t("color")}
              </label>
              <Input
                id="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                placeholder={t("color")}
              />
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">{t("specifications")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="transmission" className="block text-sm font-medium mb-2">
                {t("transmission")}
              </label>
              <select
                id="transmission"
                name="transmission"
                value={formData.transmission}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="manual">{t("manual")}</option>
                <option value="automatic">{t("automatic")}</option>
              </select>
            </div>
            <div>
              <label htmlFor="fuel_type" className="block text-sm font-medium mb-2">
                {t("fuelType")}
              </label>
              <select
                id="fuel_type"
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="petrol">{t("petrol")}</option>
                <option value="diesel">{t("diesel")}</option>
                <option value="electric">{t("electric")}</option>
                <option value="hybrid">{t("hybrid")}</option>
              </select>
            </div>
            <div>
              <label htmlFor="seats" className="block text-sm font-medium mb-2">
                {t("seats")}
              </label>
              <Input
                id="seats"
                name="seats"
                type="number"
                value={formData.seats}
                onChange={handleInputChange}
                min="1"
                max="20"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-2">
                {t("status")}
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="available">{t("available")}</option>
                <option value="rented">{t("rented")}</option>
                <option value="maintenance">{t("maintenance")}</option>
                <option value="retired">{t("retired")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Maintenance Configuration */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">{t("maintenanceConfiguration")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="mileage" className="block text-sm font-medium mb-2">
                {t("currentMileage")}
              </label>
              <Input
                id="mileage"
                name="mileage"
                type="number"
                value={formData.mileage}
                onChange={handleInputChange}
                min="0"
              />
            </div>
            <div>
              <label htmlFor="maintenance_interval_km" className="block text-sm font-medium mb-2">
                {t("maintenanceInterval")}
              </label>
              <Input
                id="maintenance_interval_km"
                name="maintenance_interval_km"
                type="number"
                value={formData.maintenance_interval_km}
                onChange={handleInputChange}
                min="1000"
                step="100"
              />
            </div>
            <div>
              <label htmlFor="maintenance_alert_threshold" className="block text-sm font-medium mb-2">
                {t("alertThreshold")}
              </label>
              <Input
                id="maintenance_alert_threshold"
                name="maintenance_alert_threshold"
                type="number"
                value={formData.maintenance_alert_threshold}
                onChange={handleInputChange}
                min="50"
                step="10"
              />
            </div>
            <div>
              <label htmlFor="last_maintenance_mileage" className="block text-sm font-medium mb-2">
                {t("lastMaintenance")}
              </label>
              <Input
                id="last_maintenance_mileage"
                name="last_maintenance_mileage"
                type="number"
                value={formData.last_maintenance_mileage}
                onChange={handleInputChange}
                min="0"
              />
            </div>
            <div>
              <label htmlFor="next_maintenance_mileage" className="block text-sm font-medium mb-2">
                {t("nextMaintenance")}
              </label>
              <Input
                id="next_maintenance_mileage"
                name="next_maintenance_mileage"
                type="number"
                value={formData.next_maintenance_mileage}
                onChange={handleInputChange}
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Purchase */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">{t("pricingPurchase")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="daily_rate" className="block text-sm font-medium mb-2">
                {t("dailyRate")} *
              </label>
              <Input
                id="daily_rate"
                name="daily_rate"
                type="number"
                value={formData.daily_rate}
                onChange={handleInputChange}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label htmlFor="purchase_price" className="block text-sm font-medium mb-2">
                {t("purchasePrice")}
              </label>
              <Input
                id="purchase_price"
                name="purchase_price"
                type="number"
                value={formData.purchase_price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label htmlFor="purchase_date" className="block text-sm font-medium mb-2">
                {t("purchaseDate")}
              </label>
              <Input
                id="purchase_date"
                name="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">{t("notes")}</h2>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder={t("notes")}
            rows={4}
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("saving")}
              </>
            ) : (
              <>
                <Loader2 className="w-4 h-4 mr-2" />
                {t("saveVehicle")}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
