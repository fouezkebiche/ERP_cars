"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Calendar, AlertCircle, Calculator } from "lucide-react"
import { contractApi, Contract } from "@/lib/contractApi"
import toast from "react-hot-toast"

export default function ExtendContractPage() {
  const router = useRouter()
  const params = useParams()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    new_end_date: "",
    notes: "",
  })

  const [calculations, setCalculations] = useState({
    current_days: 0,
    extension_days: 0,
    new_total_days: 0,
    extension_cost: 0,
    new_base_amount: 0,
    new_tax_amount: 0,
    new_total_amount: 0,
    additional_payment: 0,
  })

  useEffect(() => {
    if (params?.id) {
      fetchContract()
    }
  }, [params?.id])

  useEffect(() => {
    if (contract && formData.new_end_date) {
      calculateExtension()
    }
  }, [formData.new_end_date, contract])

  const fetchContract = async () => {
    try {
      setLoading(true)
      const response = await contractApi.getById(params.id as string)
      const fetchedContract = response.data.contract

      if (fetchedContract.status !== "active") {
        toast.error("Only active contracts can be extended")
        router.push(`/dashboard/contracts/${params.id}`)
        return
      }

      setContract(fetchedContract)

      // Set minimum date to current end date + 1 day
      const currentEndDate = new Date(fetchedContract.end_date)
      currentEndDate.setDate(currentEndDate.getDate() + 1)
      setFormData(prev => ({
        ...prev,
        new_end_date: currentEndDate.toISOString().split('T')[0],
      }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load contract")
      router.push("/dashboard/contracts")
    } finally {
      setLoading(false)
    }
  }

  const calculateExtension = () => {
    if (!contract) return

    const currentEndDate = new Date(contract.end_date)
    const newEndDate = new Date(formData.new_end_date)

    // Calculate extension days
    const extensionDays = Math.ceil((newEndDate.getTime() - currentEndDate.getTime()) / (1000 * 60 * 60 * 24))

    if (extensionDays <= 0) {
      return
    }

    // Calculate new totals
    const startDate = new Date(contract.start_date)
    const newTotalDays = Math.ceil((newEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    const dailyRate = parseFloat(contract.daily_rate)
    const newBaseAmount = dailyRate * newTotalDays

    const additionalCharges = parseFloat(contract.additional_charges)
    const discountAmount = parseFloat(contract.discount_amount)

    const newSubtotal = newBaseAmount + additionalCharges - discountAmount
    const newTaxAmount = newSubtotal * 0.19
    const newTotalAmount = newSubtotal + newTaxAmount

    const extensionCost = dailyRate * extensionDays
    const currentTotal = parseFloat(contract.total_amount)
    const additionalPayment = newTotalAmount - currentTotal

    setCalculations({
      current_days: contract.total_days,
      extension_days: extensionDays,
      new_total_days: newTotalDays,
      extension_cost: extensionCost,
      new_base_amount: newBaseAmount,
      new_tax_amount: newTaxAmount,
      new_total_amount: newTotalAmount,
      additional_payment: additionalPayment,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!contract) return

    // Validation
    if (new Date(formData.new_end_date) <= new Date(contract.end_date)) {
      toast.error("New end date must be after current end date")
      return
    }

    try {
      setSubmitting(true)

      await contractApi.extend(contract.id, {
        new_end_date: formData.new_end_date,
        notes: formData.notes,
      })

      toast.success("Contract extended successfully!")
      router.push(`/dashboard/contracts/${contract.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to extend contract")
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!contract) return null

  const minDate = new Date(contract.end_date)
  minDate.setDate(minDate.getDate() + 1)
  const minDateString = minDate.toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Extend Contract</h1>
          <p className="text-muted-foreground">{contract.contract_number}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Contract Info */}
            <div className="p-6 rounded-lg border bg-card">
              <h2 className="text-lg font-semibold mb-4">Current Contract Information</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{contract.customer?.full_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vehicle</p>
                  <p className="font-medium">
                    {contract.vehicle?.brand} {contract.vehicle?.model}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formatDate(contract.start_date)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current End Date</p>
                  <p className="font-medium">{formatDate(contract.end_date)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Duration</p>
                  <p className="font-medium">{contract.total_days} days</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Daily Rate</p>
                  <p className="font-medium">{parseFloat(contract.daily_rate).toLocaleString()} DZD</p>
                </div>
              </div>
            </div>

            {/* Extension Details */}
            <div className="p-6 rounded-lg border bg-card">
              <h2 className="text-lg font-semibold mb-4">Extension Details</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new_end_date">New End Date *</Label>
                  <Input
                    id="new_end_date"
                    type="date"
                    min={minDateString}
                    value={formData.new_end_date}
                    onChange={(e) => setFormData({ ...formData, new_end_date: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be after {formatDate(contract.end_date)}
                  </p>
                </div>

                {calculations.extension_days > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 font-medium">
                      <Calculator className="w-4 h-4" />
                      <span>Extension Summary</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-blue-600 dark:text-blue-400">Extension Days:</p>
                        <p className="font-semibold text-blue-900 dark:text-blue-100">
                          {calculations.extension_days} days
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-600 dark:text-blue-400">Extension Cost:</p>
                        <p className="font-semibold text-blue-900 dark:text-blue-100">
                          {calculations.extension_cost.toLocaleString()} DZD
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-600 dark:text-blue-400">New Total Days:</p>
                        <p className="font-semibold text-blue-900 dark:text-blue-100">
                          {calculations.new_total_days} days
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-600 dark:text-blue-400">Additional Payment:</p>
                        <p className="font-semibold text-blue-900 dark:text-blue-100">
                          {calculations.additional_payment.toLocaleString()} DZD
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Availability Check Info */}
            <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Availability Check
                </p>
                <p className="text-amber-700 dark:text-amber-300">
                  The system will verify that this vehicle has no conflicting reservations during the 
                  extended period before confirming the extension.
                </p>
              </div>
            </div>

            {/* Extension Notes */}
            <div className="p-6 rounded-lg border bg-card">
              <h2 className="text-lg font-semibold mb-4">Extension Notes</h2>
              <Textarea
                placeholder="Add notes about the extension reason, any special terms, or additional comments..."
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              disabled={submitting || calculations.extension_days <= 0}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Extending...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Extend Contract
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Summary Panel */}
        <div className="lg:col-span-1">
          <div className="p-6 rounded-lg border bg-card sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Financial Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="pb-3 border-b">
                <p className="text-muted-foreground mb-2">Current Contract</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Total:</span>
                  <span className="font-medium">{parseFloat(contract.total_amount).toLocaleString()} DZD</span>
                </div>
              </div>

              {calculations.extension_days > 0 && (
                <>
                  <div className="pb-3 border-b">
                    <p className="text-muted-foreground mb-2">Extension</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Daily Rate:</span>
                        <span>{parseFloat(contract.daily_rate).toLocaleString()} DZD</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Extension Days:</span>
                        <span className="font-medium">{calculations.extension_days}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Extension Cost:</span>
                        <span className="font-medium">{calculations.extension_cost.toLocaleString()} DZD</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-muted-foreground mb-2">New Contract Total</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">New Base Amount:</span>
                        <span>{calculations.new_base_amount.toLocaleString()} DZD</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax (19%):</span>
                        <span>{calculations.new_tax_amount.toLocaleString()} DZD</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between text-lg font-bold">
                        <span>New Total:</span>
                        <span className="text-primary">{calculations.new_total_amount.toLocaleString()} DZD</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg mt-4">
                    <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                      Additional Payment Required
                    </p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {calculations.additional_payment.toLocaleString()} DZD
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}