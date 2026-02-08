// components/dashboard/OverageCalculator.tsx
"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calculator, AlertCircle, TrendingDown } from "lucide-react"
import { contractApi, type OverageEstimate } from "@/lib/contractApi"
import { CustomerTierBadge } from "./CustomerTierBadge"

interface OverageCalculatorProps {
  contractId: string
  startMileage: number
  totalKmAllowed: number
  currentEndMileage?: number
  onEstimateChange?: (estimate: OverageEstimate | null) => void
}

export function OverageCalculator({ 
  contractId, 
  startMileage,
  totalKmAllowed,
  currentEndMileage,
  onEstimateChange 
}: OverageCalculatorProps) {
  const [endMileage, setEndMileage] = useState(currentEndMileage?.toString() || "")
  const [estimate, setEstimate] = useState<OverageEstimate | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEstimate = async () => {
      const endMileageNum = parseInt(endMileage)
      
      if (!endMileage || isNaN(endMileageNum) || endMileageNum <= startMileage) {
        setEstimate(null)
        onEstimateChange?.(null)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const response = await contractApi.estimateOverage(contractId, endMileageNum)
        setEstimate(response.data)
        onEstimateChange?.(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to calculate estimate')
        setEstimate(null)
        onEstimateChange?.(null)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(fetchEstimate, 500)
    return () => clearTimeout(debounce)
  }, [endMileage, contractId, startMileage, onEstimateChange])

  const kmDriven = estimate?.estimated_km_driven || 0
  const kmOverage = estimate?.estimated_overage.km_overage || 0
  const hasOverage = kmOverage > 0

  return (
    <div className="space-y-4">
      {/* Input */}
      <div>
        <Label htmlFor="end-mileage-estimate">
          Estimated End Mileage (km) *
        </Label>
        <Input
          id="end-mileage-estimate"
          type="number"
          min={startMileage}
          placeholder="Enter estimated odometer reading"
          value={endMileage}
          onChange={(e) => setEndMileage(e.target.value)}
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Start mileage: {startMileage.toLocaleString()} km
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Calculating...
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Estimate Results */}
      {estimate && !loading && (
        <div className="space-y-3">
          {/* KM Summary */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-blue-900 dark:text-blue-100">
                Mileage Summary
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated KM Driven:</span>
                <span className="font-semibold">{kmDriven.toLocaleString()} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">KM Allowed:</span>
                <span className="font-semibold">
                  {estimate.allowed_km.total_km_allowed.toLocaleString()} km
                </span>
              </div>
              {estimate.allowed_km.bonus_km_per_day > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Tier Bonus (per day):</span>
                  <span className="font-semibold">
                    +{estimate.allowed_km.bonus_km_per_day} km
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Tier */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <span className="text-sm font-medium">Customer Tier:</span>
            <CustomerTierBadge 
              tier={estimate.estimated_overage.tier as any}
              tierName={estimate.estimated_overage.tier_name}
            />
          </div>

          {/* Overage Warning */}
          {hasOverage ? (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Overage Detected!</p>
                  <div className="text-sm space-y-1">
                    <p>KM over limit: {kmOverage.toLocaleString()} km</p>
                    <p>
                      Base charge: {estimate.estimated_overage.base_overage_charges.toLocaleString()} DZD
                    </p>
                    {estimate.estimated_overage.discount_amount > 0 && (
                      <p className="text-green-600 flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        {estimate.estimated_overage.tier_name} discount (-
                        {estimate.estimated_overage.discount_percentage}%): -
                        {estimate.estimated_overage.discount_amount.toLocaleString()} DZD
                      </p>
                    )}
                    <p className="font-bold text-lg pt-2">
                      Final overage charge: {estimate.estimated_overage.final_overage_charges.toLocaleString()} DZD
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <AlertDescription className="text-green-700 dark:text-green-300">
                ✅ Within limit! No overage charges.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  )
}