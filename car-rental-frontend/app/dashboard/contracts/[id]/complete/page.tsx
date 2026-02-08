// app/dashboard/contracts/[id]/complete/page.tsx (FULLY UPDATED)
"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, CheckCircle } from "lucide-react"
import { contractApi, Contract, OverageEstimate } from "@/lib/contractApi"
import { OverageCalculator } from "@/components/dashboard/OverageCalculator"
import { CustomerTierBadge } from "@/components/dashboard/CustomerTierBadge"
import toast from "react-hot-toast"
import { format } from "date-fns"

export default function CompleteContractPage() {
  const router = useRouter()
  const params = useParams()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [overageEstimate, setOverageEstimate] = useState<OverageEstimate | null>(null)
  
  const [formData, setFormData] = useState({
    actual_return_date: "",
    end_mileage: "",
    additional_charges: 0,
    notes: "",
  })

  useEffect(() => {
    if (params.id) {
      fetchContract()
    }
  }, [params.id])

  const fetchContract = async () => {
    try {
      setLoading(true)
      const response = await contractApi.getById(params.id as string)
      const fetchedContract = response.data.contract
      
      if (fetchedContract.status !== "active") {
        toast.error("Only active contracts can be completed")
        router.push(`/dashboard/contracts/${params.id}`)
        return
      }
      
      setContract(fetchedContract)
      
      // Set default actual return date to today
      const today = new Date().toISOString().split('T')[0]
      setFormData(prev => ({ ...prev, actual_return_date: today }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load contract")
      router.push("/dashboard/contracts")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!contract || !formData.actual_return_date || !formData.end_mileage) {
      toast.error("Please fill all required fields")
      return
    }

    const endMileageNum = parseInt(formData.end_mileage)
    if (contract.start_mileage && endMileageNum < contract.start_mileage) {
      toast.error(`End mileage cannot be less than start mileage (${contract.start_mileage} km)`)
      return
    }

    try {
      setSubmitting(true)
      
      // Use new endpoint with tier pricing
      await contractApi.completeWithMileage(contract.id, {
        end_mileage: endMileageNum,
        actual_return_date: formData.actual_return_date,
        additional_charges: formData.additional_charges,
        notes: formData.notes,
      })
      
      toast.success("Contract completed successfully!")
      router.push(`/dashboard/contracts/${contract.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to complete contract")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!contract) return null

  const totalKmAllowed = contract.total_km_allowed || 
    (contract.daily_km_limit && contract.total_days 
      ? contract.daily_km_limit * contract.total_days 
      : 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Complete Contract</h1>
          <p className="text-muted-foreground">{contract.contract_number}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Contract Info */}
            <Card>
              <CardHeader>
                <CardTitle>Current Contract Summary</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{contract.customer?.full_name}</p>
                  {contract.customer?.total_rentals !== undefined && (
                    <div className="mt-2">
                      <CustomerTierBadge
                        tier={
                          contract.customer.total_rentals >= 20 ? 'PLATINUM' :
                          contract.customer.total_rentals >= 10 ? 'GOLD' :
                          contract.customer.total_rentals >= 5 ? 'SILVER' :
                          contract.customer.total_rentals >= 1 ? 'BRONZE' : 'NEW'
                        }
                        size="sm"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Vehicle</p>
                  <p className="font-medium">
                    {contract.vehicle?.brand} {contract.vehicle?.model}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium">{format(new Date(contract.start_date), "PPP")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Scheduled End</p>
                  <p className="font-medium">{format(new Date(contract.end_date), "PPP")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Start Mileage</p>
                  <p className="font-medium">{contract.start_mileage?.toLocaleString() || "N/A"} km</p>
                </div>
                <div>
                  <p className="text-muted-foreground">KM Allowed</p>
                  <p className="font-medium">{totalKmAllowed.toLocaleString()} km</p>
                  {contract.daily_km_limit && (
                    <p className="text-xs text-muted-foreground">
                      ({contract.daily_km_limit} km/day × {contract.total_days} days)
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Completion Details */}
            <Card>
              <CardHeader>
                <CardTitle>Completion Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="actual_return_date">Actual Return Date *</Label>
                  <Input
                    id="actual_return_date"
                    type="date"
                    value={formData.actual_return_date}
                    onChange={(e) => setFormData({ ...formData, actual_return_date: e.target.value })}
                    required
                  />
                </div>

                {/* Overage Calculator */}
                <OverageCalculator
                  contractId={contract.id}
                  startMileage={contract.start_mileage || 0}
                  totalKmAllowed={totalKmAllowed}
                  currentEndMileage={formData.end_mileage ? parseInt(formData.end_mileage) : undefined}
                  onEstimateChange={(estimate) => {
                    setOverageEstimate(estimate)
                    setFormData(prev => ({
                      ...prev,
                      end_mileage: estimate ? estimate.estimated_end_mileage.toString() : prev.end_mileage
                    }))
                  }}
                />

                <div>
                  <Label htmlFor="additional_charges">Other Additional Charges (DZD)</Label>
                  <Input
                    id="additional_charges"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Late fees, damages, cleaning, etc."
                    value={formData.additional_charges}
                    onChange={(e) => setFormData({ ...formData, additional_charges: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Overage charges are calculated automatically above
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Final Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Final Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add notes about vehicle condition, damages, customer feedback, or any final comments..."
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={submitting || !formData.actual_return_date || !formData.end_mileage}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Contract
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Summary Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Final Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Total</span>
                  <span className="font-semibold">
                    {parseFloat(contract.total_amount).toLocaleString()} DZD
                  </span>
                </div>
                
                {formData.additional_charges > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Other Charges</span>
                    <span>+{formData.additional_charges.toLocaleString()} DZD</span>
                  </div>
                )}
                
                {overageEstimate?.estimated_overage?.km_overage && overageEstimate.estimated_overage.km_overage > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg space-y-1">
                    <p className="font-medium text-red-800 dark:text-red-200">
                      KM Overage Charges
                    </p>
                    <p className="text-xs">
                      {overageEstimate.estimated_overage?.km_overage?.toLocaleString()} km over limit
                    </p>
                    <p className="text-lg font-bold text-red-600">
                      +{overageEstimate.estimated_overage?.final_overage_charges?.toLocaleString()} DZD
                    </p>
                    {overageEstimate.estimated_overage?.discount_amount > 0 && (
                      <p className="text-xs text-green-600">
                        (Saved {overageEstimate.estimated_overage?.discount_amount?.toLocaleString()} DZD 
                        with {overageEstimate.estimated_overage?.tier_name} discount)
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Final Total</span>
                  <span className="text-primary">
                    {(
                      parseFloat(contract.total_amount) + 
                      formData.additional_charges + 
                      (overageEstimate?.estimated_overage.final_overage_charges || 0)
                    ).toLocaleString()} DZD
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}