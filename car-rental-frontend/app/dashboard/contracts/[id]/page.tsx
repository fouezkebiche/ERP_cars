"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { KmUsageProgress } from "@/components/dashboard/KmUsageProgress"
import { ArrowLeft, CheckCircle, XCircle, Calendar, Download, AlertCircle, X, Loader2 } from "lucide-react"
import { contractApi, Contract } from "@/lib/contractApi"
import { useNotifications } from "@/hooks/useNotifications"
import toast from "react-hot-toast"

// Helper to render notification details (reuse from dashboard)
const renderNotificationDetails = (data: any) => {
  if (!data || typeof data !== 'object') return null
  
  return (
    <div className="text-xs space-y-1 mt-2">
      {data.km_driven && (
        <p>
          <span className="font-semibold">KM Driven:</span> {data.km_driven.toLocaleString()} km
        </p>
      )}
      {data.km_allowed && (
        <p>
          <span className="font-semibold">KM Allowed:</span> {data.km_allowed.toLocaleString()} km
        </p>
      )}
      {data.km_remaining !== undefined && (
        <p>
          <span className="font-semibold">KM Remaining:</span> {data.km_remaining.toLocaleString()} km
        </p>
      )}
      {data.percentage !== undefined && (
        <p>
          <span className="font-semibold">Usage:</span> {data.percentage.toFixed(1)}%
        </p>
      )}
      {data.contract_number && (
        <p>
          <span className="font-semibold">Contract:</span> {data.contract_number}
        </p>
      )}
      {data.vehicle_registration && (
        <p>
          <span className="font-semibold">Vehicle:</span> {data.vehicle_registration}
        </p>
      )}
    </div>
  )
}

export default function ContractDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [activeTab, setActiveTab] = useState<"details" | "alerts">("details")

  // NEW: Fetch KM alerts for this contract
  // FIXED: Don't filter by vehicleId in hook - filter by contract_id after
  const {
    data: kmAlertsData,
    loading: alertsLoading,
    dismissNotification,
    restoreNotification,
  } = useNotifications({
    type: 'km_limit_*',
    // vehicleId: contract?.vehicle_id || '', // REMOVED - causes empty results
    unread: true,
    limit: 100  // Get more to ensure we catch all for this contract
  })

  // Filter alerts specific to this contract by contract_id
  const kmAlerts = (kmAlertsData?.notifications || []).filter(
    notif => notif.data?.contract_id === params.id
  )

  useEffect(() => {
    if (params?.id) {
      fetchContract()
    }
  }, [params?.id])

  const fetchContract = async () => {
    try {
      setLoading(true)
      const response = await contractApi.getById(params.id as string)
      setContract(response.data.contract)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load contract")
      router.push("/dashboard/contracts")
    } finally {
      setLoading(false)
    }
  }

  const handleDismissAlert = async (id: string) => {
    await dismissNotification(id)
    toast.success("Alert dismissed")
  }

  const handleRestoreAlert = async (id: string) => {
    await restoreNotification(id)
    toast.success("Alert restored")
  }

  const handleComplete = () => {
    router.push(`/dashboard/contracts/${params.id}/complete`)
  }

  const handleExtend = () => {
    router.push(`/dashboard/contracts/${params.id}/extend`)
  }

  const handleCancel = async () => {
    if (!contract) return

    const reason = prompt(`Cancel contract ${contract.contract_number}?\n\nEnter cancellation reason:`)
    if (!reason) return

    try {
      await contractApi.cancel(contract.id, reason)
      toast.success("Contract cancelled successfully")
      fetchContract()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel contract")
    }
  }

  const handleDownloadPDF = async () => {
    if (!contract) return

    try {
      setGeneratingPDF(true)
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('Please allow pop-ups to download PDF')
      }

      const contractHTML = generateContractHTML(contract)
      printWindow.document.write(contractHTML)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
      
      toast.success("PDF generation initiated. Use 'Save as PDF' in the print dialog.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate PDF")
    } finally {
      setGeneratingPDF(false)
    }
  }

  const generateContractHTML = (contract: Contract) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Contract ${contract.contract_number}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.6;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .section {
            margin: 20px 0;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2563eb;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }
          .info-item {
            padding: 8px;
          }
          .info-label {
            font-weight: bold;
            color: #666;
          }
          .info-value {
            color: #000;
          }
          .financial-summary {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
          }
          .total-amount {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            text-align: right;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #333;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          @media print {
            body { margin: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>RENTAL CONTRACT</h1>
          <p style="font-size: 20px; margin: 10px 0;">${contract.contract_number}</p>
          <p style="margin: 0; color: #666;">Status: ${contract.status.toUpperCase()}</p>
        </div>
        <div class="section">
          <div class="section-title">Customer Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Name:</div>
              <div class="info-value">${contract.customer?.full_name || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Phone:</div>
              <div class="info-value">${contract.customer?.phone || 'N/A'}</div>
            </div>
            ${contract.customer?.email ? `
            <div class="info-item">
              <div class="info-label">Email:</div>
              <div class="info-value">${contract.customer.email}</div>
            </div>
            ` : ''}
            <div class="info-item">
              <div class="info-label">Customer Type:</div>
              <div class="info-value">${contract.customer?.customer_type || 'N/A'}</div>
            </div>
          </div>
        </div>
        <div class="section">
          <div class="section-title">Vehicle Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Vehicle:</div>
              <div class="info-value">${contract.vehicle?.brand} ${contract.vehicle?.model} (${contract.vehicle?.year})</div>
            </div>
            <div class="info-item">
              <div class="info-label">Registration Number:</div>
              <div class="info-value">${contract.vehicle?.registration_number || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Start Mileage:</div>
              <div class="info-value">${contract.start_mileage?.toLocaleString() || 'N/A'} km</div>
            </div>
            ${contract.end_mileage ? `
            <div class="info-item">
              <div class="info-label">End Mileage:</div>
              <div class="info-value">${contract.end_mileage.toLocaleString()} km</div>
            </div>
            ` : ''}
          </div>
        </div>
        <div class="section">
          <div class="section-title">Rental Period</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Start Date:</div>
              <div class="info-value">${new Date(contract.start_date).toLocaleDateString()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">End Date:</div>
              <div class="info-value">${new Date(contract.end_date).toLocaleDateString()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Total Days:</div>
              <div class="info-value">${contract.total_days}</div>
            </div>
            ${contract.actual_return_date ? `
            <div class="info-item">
              <div class="info-label">Actual Return:</div>
              <div class="info-value">${new Date(contract.actual_return_date).toLocaleDateString()}</div>
            </div>
            ` : ''}
          </div>
        </div>
        ${contract.extras && Object.values(contract.extras).some(v => v) ? `
        <div class="section">
          <div class="section-title">Additional Services</div>
          <ul>
            ${contract.extras.gps ? '<li>GPS Navigation</li>' : ''}
            ${contract.extras.child_seat ? '<li>Child Seat</li>' : ''}
            ${contract.extras.additional_driver ? '<li>Additional Driver</li>' : ''}
            ${contract.extras.insurance_premium ? '<li>Premium Insurance</li>' : ''}
          </ul>
        </div>
        ` : ''}
        <div class="financial-summary">
          <div class="section-title">Financial Summary</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Daily Rate:</div>
              <div class="info-value">${parseFloat(contract.daily_rate).toLocaleString()} DZD</div>
            </div>
            <div class="info-item">
              <div class="info-label">Base Amount:</div>
              <div class="info-value">${parseFloat(contract.base_amount).toLocaleString()} DZD</div>
            </div>
            ${parseFloat(contract.additional_charges) > 0 ? `
            <div class="info-item">
              <div class="info-label">Additional Charges:</div>
              <div class="info-value">${parseFloat(contract.additional_charges).toLocaleString()} DZD</div>
            </div>
            ` : ''}
            ${parseFloat(contract.discount_amount) > 0 ? `
            <div class="info-item">
              <div class="info-label">Discount:</div>
              <div class="info-value" style="color: green;">-${parseFloat(contract.discount_amount).toLocaleString()} DZD</div>
            </div>
            ` : ''}
            <div class="info-item">
              <div class="info-label">Tax (19%):</div>
              <div class="info-value">${parseFloat(contract.tax_amount).toLocaleString()} DZD</div>
            </div>
            <div class="info-item">
              <div class="info-label">Deposit:</div>
              <div class="info-value">${parseFloat(contract.deposit_amount).toLocaleString()} DZD</div>
            </div>
          </div>
          <div class="total-amount">
            Total Amount: ${parseFloat(contract.total_amount).toLocaleString()} DZD
          </div>
        </div>
        ${contract.notes ? `
        <div class="section">
          <div class="section-title">Notes</div>
          <p>${contract.notes.replace(/\n/g, '<br>')}</p>
        </div>
        ` : ''}
        <div class="footer">
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p>Contract Number: ${contract.contract_number}</p>
          ${contract.creator ? `<p>Created by: ${contract.creator.full_name}</p>` : ''}
        </div>
      </body>
      </html>
    `
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{contract.contract_number}</h1>
            <p className="text-muted-foreground">Contract Details</p>
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {contract.status === "active" && (
            <>
              <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete
              </Button>
              <Button onClick={handleExtend} variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Extend
              </Button>
              <Button onClick={handleCancel} variant="destructive">
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            disabled={generatingPDF}
          >
            {generatingPDF ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Save PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* NEW: Tabs */}
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
            onClick={() => setActiveTab("alerts")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "alerts"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Alerts ({kmAlerts.length})
          </button>
        </div>
      </div>

      {/* Details Tab */}
      {activeTab === "details" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status & Basic Info */}
            <div className="p-6 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Contract Information</h2>
                <StatusBadge status={contract.status} />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Contract Number</p>
                  <p className="font-mono font-semibold">{contract.contract_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created Date</p>
                  <p className="font-medium">{formatDate(contract.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formatDate(contract.start_date)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">End Date</p>
                  <p className="font-medium">{formatDate(contract.end_date)}</p>
                </div>
                {contract.actual_return_date && (
                  <div>
                    <p className="text-muted-foreground">Actual Return Date</p>
                    <p className="font-medium">{formatDate(contract.actual_return_date)}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Total Days</p>
                  <p className="font-medium">{contract.total_days}</p>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="p-6 rounded-lg border bg-card">
              <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
              {contract.customer ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Full Name</p>
                    <p className="font-medium">{contract.customer.full_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{contract.customer.phone}</p>
                  </div>
                  {contract.customer.email && (
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{contract.customer.email}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Customer Type</p>
                    <p className="font-medium capitalize">{contract.customer.customer_type}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No customer information</p>
              )}
            </div>

            {/* Vehicle Information */}
            <div className="p-6 rounded-lg border bg-card">
              <h2 className="text-lg font-semibold mb-4">Vehicle Information</h2>
              {contract.vehicle ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Vehicle</p>
                    <p className="font-medium">
                      {contract.vehicle.brand} {contract.vehicle.model} ({contract.vehicle.year})
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Registration Number</p>
                    <p className="font-medium font-mono">{contract.vehicle.registration_number}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Start Mileage</p>
                    <p className="font-medium">{contract.start_mileage?.toLocaleString() || "—"} km</p>
                  </div>
                  {contract.end_mileage && (
                    <div>
                      <p className="text-muted-foreground">End Mileage</p>
                      <p className="font-medium">{contract.end_mileage.toLocaleString()} km</p>
                    </div>
                  )}
                  {contract.mileage_limit && (
                    <div>
                      <p className="text-muted-foreground">Mileage Limit</p>
                      <p className="font-medium">{contract.mileage_limit.toLocaleString()} km</p>
                    </div>
                  )}
                  
                  {contract.total_km_allowed && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground mb-2">KM Usage</p>
                      {contract.end_mileage ? (
                        <KmUsageProgress
                          kmDriven={contract.actual_km_driven || (contract.end_mileage - (contract.start_mileage || 0))}
                          kmAllowed={contract.total_km_allowed}
                          dailyLimit={contract.daily_km_limit}
                          tierBonus={contract.total_km_allowed - ((contract.daily_km_limit || 0) * contract.total_days)}
                        />
                      ) : (
                        <p className="text-sm">
                          Allowed: {contract.total_km_allowed.toLocaleString()} km 
                          {contract.daily_km_limit && ` (${contract.daily_km_limit} km/day)`}
                        </p>
                      )}
                    </div>
                  )}

                  {(contract.km_overage ?? 0) > 0 && (
                    <div className="col-span-2 p-3 bg-red-50 dark:bg-red-950 rounded">
                      <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                        KM Overage: {(contract.km_overage ?? 0).toLocaleString()} km
                      </p>
                      <p className="text-xs text-red-600">
                        Charge: {parseFloat(contract.overage_charges ?? '0').toLocaleString()} DZD
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No vehicle information</p>
              )}
            </div>

            {/* Extras */}
            {contract.extras && Object.keys(contract.extras).length > 0 && (
              <div className="p-6 rounded-lg border bg-card">
                <h2 className="text-lg font-semibold mb-4">Additional Services</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {contract.extras.gps && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>GPS Navigation</span>
                    </div>
                  )}
                  {contract.extras.child_seat && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Child Seat</span>
                    </div>
                  )}
                  {contract.extras.additional_driver && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Additional Driver</span>
                    </div>
                  )}
                  {contract.extras.insurance_premium && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Premium Insurance</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment History */}
            {contract.payments && contract.payments.length > 0 && (
              <div className="p-6 rounded-lg border bg-card">
                <h2 className="text-lg font-semibold mb-4">Payment History</h2>
                <div className="space-y-3">
                  {contract.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{parseFloat(payment.amount).toLocaleString()} DZD</p>
                        <p className="text-xs text-muted-foreground">
                          {payment.payment_method} • {formatDate(payment.payment_date)}
                        </p>
                      </div>
                      <StatusBadge status={payment.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {contract.notes && (
              <div className="p-6 rounded-lg border bg-card">
                <h2 className="text-lg font-semibold mb-4">Notes</h2>
                <p className="text-sm whitespace-pre-wrap">{contract.notes}</p>
              </div>
            )}
          </div>

          {/* Financial Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="p-6 rounded-lg border bg-card sticky top-6">
              <h2 className="text-lg font-semibold mb-4">Financial Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Rate:</span>
                  <span>{parseFloat(contract.daily_rate).toLocaleString()} DZD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Amount:</span>
                  <span>{parseFloat(contract.base_amount).toLocaleString()} DZD</span>
                </div>
                {parseFloat(contract.additional_charges) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Additional Charges:</span>
                    <span>{parseFloat(contract.additional_charges).toLocaleString()} DZD</span>
                  </div>
                )}
                {parseFloat(contract.discount_amount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{parseFloat(contract.discount_amount).toLocaleString()} DZD</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-muted-foreground">Tax (19%):</span>
                  <span>{parseFloat(contract.tax_amount).toLocaleString()} DZD</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-primary">{parseFloat(contract.total_amount).toLocaleString()} DZD</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-muted-foreground">Deposit:</span>
                  <span>{parseFloat(contract.deposit_amount).toLocaleString()} DZD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deposit Status:</span>
                  <span className={contract.deposit_returned ? "text-green-600" : "text-amber-600"}>
                    {contract.deposit_returned ? "Returned" : "Held"}
                  </span>
                </div>
              </div>

              {contract.creator && (
                <div className="mt-6 pt-6 border-t text-xs text-muted-foreground">
                  <p>Created by: {contract.creator.full_name}</p>
                  <p>{formatDate(contract.created_at)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NEW: Alerts Tab */}
      {activeTab === "alerts" && (
        <div className="space-y-6">
          <div className="p-6 rounded-lg border border-border bg-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Contract Alerts ({kmAlerts.length})
            </h3>
            {alertsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                Loading alerts...
              </div>
            ) : kmAlerts.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {kmAlerts.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-4 rounded-lg border-l-4 border-l-destructive bg-destructive/10"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-destructive mb-1">
                          {notif.title}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notif.message}
                        </p>
                        {renderNotificationDetails(notif.data)}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notif.created_at).toLocaleString('fr-DZ', {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        {notif.dismissed && (
                          <button
                            onClick={() => handleRestoreAlert(notif.id)}
                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                            title="Restore"
                          >
                            Restore
                          </button>
                        )}
                        <button
                          onClick={() => handleDismissAlert(notif.id)}
                          className="p-1 text-destructive hover:bg-destructive/20 rounded"
                          title="Dismiss"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No alerts for this contract</p>
                <p className="text-sm">All good—no issues detected.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}