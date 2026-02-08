// app/dashboard/contracts/new/page.tsx (UPDATED WITH KM LIMITS)
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, Calculator, Info } from "lucide-react"
import { contractApi } from "@/lib/contractApi"
import { customerTierApi } from "@/lib/customerTierApi"
import { CustomerTierBadge } from "@/components/dashboard/CustomerTierBadge"
import toast from "react-hot-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Customer {
  id: string
  full_name: string
  email?: string
  phone: string
  is_blacklisted: boolean
  total_rentals?: number
}

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  registration_number: string
  daily_rate: number
  mileage: number
  status: string
}

export default function NewContractPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [customerTier, setCustomerTier] = useState<any>(null)
  const [loadingTier, setLoadingTier] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    customer_id: "",
    vehicle_id: "",
    start_date: "",
    end_date: "",
    daily_rate: 0,
    daily_km_limit: 300, // NEW: Default 300 km/day
    deposit_amount: 0,
    additional_charges: 0,
    discount_amount: 0,
    notes: "",
    // Extras
    gps: false,
    child_seat: false,
    additional_driver: false,
    insurance_premium: false,
  })

  // Calculated values
  const [calculations, setCalculations] = useState({
    total_days: 0,
    base_amount: 0,
    extras_cost: 0,
    subtotal: 0,
    tax_amount: 0,
    total_amount: 0,
    // NEW: KM calculations
    total_km_allowed: 0,
    tier_km_bonus: 0,
    effective_daily_limit: 0,
  })

  // Fetch customers and available vehicles
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }

        const [customersRes, vehiclesRes, profileRes] = await Promise.all([
          fetch(`${API_URL}/api/customers`, { headers }),
          fetch(`${API_URL}/api/vehicles?status=available`, { headers }),
          fetch(`${API_URL}/api/company/profile`, { headers }),
        ])

        const customersData = await customersRes.json()
        const vehiclesData = await vehiclesRes.json()
        const profileData = await profileRes.json()

        setCustomers(customersData.data.customers.filter((c: Customer) => !c.is_blacklisted))
        setVehicles(vehiclesData.data.vehicles)

        // Default Daily KM Limit from company settings (Settings → Company Settings)
        const defaultDailyKmLimit = profileData?.data?.company?.settings?.defaultDailyKmLimit
        const dailyLimit = (typeof defaultDailyKmLimit === 'number' && defaultDailyKmLimit >= 50 && defaultDailyKmLimit <= 1000)
          ? defaultDailyKmLimit
          : 300
        setFormData(prev => ({ ...prev, daily_km_limit: dailyLimit }))
      } catch (error) {
        toast.error("Failed to load data")
        console.error(error)
      } finally {
        setLoadingData(false)
      }
    }

    fetchData()
  }, [])

  // Fetch customer tier when customer changes
  useEffect(() => {
    const fetchCustomerTier = async () => {
      if (!formData.customer_id) {
        setCustomerTier(null)
        return
      }

      try {
        setLoadingTier(true)
        const response = await customerTierApi.getTierInfo(formData.customer_id)
        setCustomerTier(response.data)
      } catch (error) {
        console.error('Failed to fetch tier:', error)
        setCustomerTier(null)
      } finally {
        setLoadingTier(false)
      }
    }

    fetchCustomerTier()
  }, [formData.customer_id])

  // Auto-fill daily rate when vehicle is selected
  useEffect(() => {
    if (formData.vehicle_id) {
      const selectedVehicle = vehicles.find(v => v.id === formData.vehicle_id)
      if (selectedVehicle) {
        setFormData(prev => ({
          ...prev,
          daily_rate: selectedVehicle.daily_rate,
        }))
      }
    }
  }, [formData.vehicle_id, vehicles])

  // Calculate totals whenever relevant fields change
  useEffect(() => {
    calculateTotals()
  }, [
    formData.start_date,
    formData.end_date,
    formData.daily_rate,
    formData.daily_km_limit,
    formData.additional_charges,
    formData.discount_amount,
    formData.gps,
    formData.child_seat,
    formData.additional_driver,
    formData.insurance_premium,
    customerTier,
  ])

  const calculateTotals = () => {
    if (!formData.start_date || !formData.end_date || !formData.daily_rate) {
      return
    }

    const start = new Date(formData.start_date)
    const end = new Date(formData.end_date)
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    if (totalDays <= 0) {
      return
    }

    const baseAmount = formData.daily_rate * totalDays

    // Calculate extras costs (per day)
    let extrasCost = 0
    if (formData.gps) extrasCost += 500 * totalDays
    if (formData.child_seat) extrasCost += 300 * totalDays
    if (formData.additional_driver) extrasCost += 1000 * totalDays
    if (formData.insurance_premium) extrasCost += 2000 * totalDays

    const subtotal = baseAmount + extrasCost + formData.additional_charges - formData.discount_amount
    const taxAmount = subtotal * 0.19
    const totalAmount = subtotal + taxAmount

    // NEW: Calculate KM allowances with tier bonus
    const tierKmBonus = customerTier?.km_bonus || 0
    const effectiveDailyLimit = formData.daily_km_limit + tierKmBonus
    const totalKmAllowed = effectiveDailyLimit * totalDays

    setCalculations({
      total_days: totalDays,
      base_amount: baseAmount,
      extras_cost: extrasCost,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      total_km_allowed: totalKmAllowed,
      tier_km_bonus: tierKmBonus,
      effective_daily_limit: effectiveDailyLimit,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customer_id || !formData.vehicle_id) {
      toast.error("Please select customer and vehicle")
      return
    }

    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      toast.error("End date must be after start date")
      return
    }

    try {
      setLoading(true)

      const extras = {
        gps: formData.gps,
        child_seat: formData.child_seat,
        additional_driver: formData.additional_driver,
        insurance_premium: formData.insurance_premium,
      }

      const contractData = {
        customer_id: formData.customer_id,
        vehicle_id: formData.vehicle_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        daily_rate: formData.daily_rate,
        daily_km_limit: formData.daily_km_limit, // NEW
        deposit_amount: formData.deposit_amount,
        additional_charges: formData.additional_charges + calculations.extras_cost,
        discount_amount: formData.discount_amount,
        extras,
        notes: formData.notes,
      }

      await contractApi.create(contractData)
      toast.success("Contract created successfully!")
      router.push("/dashboard/contracts")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create contract")
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Contract</h1>
          <p className="text-muted-foreground">Create a new rental contract</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Vehicle Selection */}
          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-4">Contract Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer */}
              <div>
                <Label htmlFor="customer_id">Customer *</Label>
                <select
                  id="customer_id"
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  required
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.full_name} - {customer.phone}
                      {customer.total_rentals ? ` (${customer.total_rentals} rentals)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle */}
              <div>
                <Label htmlFor="vehicle_id">Vehicle *</Label>
                <select
                  id="vehicle_id"
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                  required
                >
                  <option value="">Select vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} ({vehicle.registration_number}) - {vehicle.daily_rate.toLocaleString()} DZD/day
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Customer Tier Display */}
            {customerTier && (
              <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Customer Loyalty Tier:</span>
                  <CustomerTierBadge 
                    tier={customerTier.tier}
                    tierName={customerTier.name}
                  />
                </div>
                {customerTier.km_bonus > 0 && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    ✨ This customer gets +{customerTier.km_bonus} km/day bonus!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Dates & Rates */}
          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-4">Rental Period & Rates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="daily_rate">Daily Rate (DZD) *</Label>
                <Input
                  id="daily_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.daily_rate}
                  onChange={(e) => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="daily_km_limit">
                  Daily KM Limit (km/day) *
                </Label>
                <Input
                  id="daily_km_limit"
                  type="number"
                  min="50"
                  step="50"
                  value={formData.daily_km_limit}
                  onChange={(e) => setFormData({ ...formData, daily_km_limit: parseInt(e.target.value) || formData.daily_km_limit })}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  From company settings (Base limit before tier bonuses)
                </p>
              </div>
            </div>

            {/* KM Allowance Info */}
            {calculations.total_days > 0 && (
              <Alert className="mt-4">
                <Info className="w-4 h-4" />
                <AlertDescription>
                  <div className="text-sm space-y-1">
                    <p className="font-semibold">Total KM Allowance:</p>
                    <p>
                      Base: {formData.daily_km_limit} km/day × {calculations.total_days} days = 
                      <strong> {(formData.daily_km_limit * calculations.total_days).toLocaleString()} km</strong>
                    </p>
                    {calculations.tier_km_bonus > 0 && (
                      <>
                        <p className="text-blue-600">
                          Tier Bonus: +{calculations.tier_km_bonus} km/day × {calculations.total_days} days = 
                          <strong> +{(calculations.tier_km_bonus * calculations.total_days).toLocaleString()} km</strong>
                        </p>
                        <p className="font-bold text-lg pt-2">
                          Total Allowed: {calculations.total_km_allowed.toLocaleString()} km
                        </p>
                      </>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Extras */}
          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-4">Additional Services</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.gps}
                  onChange={(e) => setFormData({ ...formData, gps: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>GPS Navigation (+500 DZD/day)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.child_seat}
                  onChange={(e) => setFormData({ ...formData, child_seat: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Child Seat (+300 DZD/day)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.additional_driver}
                  onChange={(e) => setFormData({ ...formData, additional_driver: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Additional Driver (+1,000 DZD/day)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.insurance_premium}
                  onChange={(e) => setFormData({ ...formData, insurance_premium: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Premium Insurance (+2,000 DZD/day)</span>
              </label>
            </div>
          </div>

          {/* Financial Details */}
          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-4">Financial Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="deposit_amount">Deposit Amount (DZD)</Label>
                <Input
                  id="deposit_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.deposit_amount}
                  onChange={(e) => setFormData({ ...formData, deposit_amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="additional_charges">Additional Charges (DZD)</Label>
                <Input
                  id="additional_charges"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.additional_charges}
                  onChange={(e) => setFormData({ ...formData, additional_charges: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="discount_amount">Discount (DZD)</Label>
                <Input
                  id="discount_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-4">Additional Notes</h2>
            <Textarea
              placeholder="Add any special terms, conditions, or notes..."
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        {/* Summary Panel */}
        <div className="lg:col-span-1">
          <div className="p-6 rounded-lg border bg-card sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Contract Summary</h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rental Days:</span>
                <span className="font-semibold">{calculations.total_days || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Amount:</span>
                <span>{calculations.base_amount.toLocaleString()} DZD</span>
              </div>
              {calculations.extras_cost > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Extras:</span>
                  <span>{calculations.extras_cost.toLocaleString()} DZD</span>
                </div>
              )}
              {formData.additional_charges > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Additional Charges:</span>
                  <span>{formData.additional_charges.toLocaleString()} DZD</span>
                </div>
              )}
              {formData.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-{formData.discount_amount.toLocaleString()} DZD</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{calculations.subtotal.toLocaleString()} DZD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (19%):</span>
                <span>{calculations.tax_amount.toLocaleString()} DZD</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span className="text-primary">{calculations.total_amount.toLocaleString()} DZD</span>
              </div>
              {formData.deposit_amount > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Deposit Required:</span>
                  <span>{formData.deposit_amount.toLocaleString()} DZD</span>
                </div>
              )}

              {/* KM Summary */}
              {calculations.total_days > 0 && (
                <div className="border-t pt-3 mt-3">
                  <p className="font-semibold text-blue-600 mb-2">KM Allowance</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Daily Limit:</span>
                      <span>{formData.daily_km_limit} km/day</span>
                    </div>
                    {calculations.tier_km_bonus > 0 && (
                      <div className="flex justify-between text-blue-600">
                        <span>Tier Bonus:</span>
                        <span>+{calculations.tier_km_bonus} km/day</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold">
                      <span>Total Allowed:</span>
                      <span>{calculations.total_km_allowed.toLocaleString()} km</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Contract
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}