"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/dashboard/data-table"
import { Plus, Search, CreditCard, Download, FileText } from "lucide-react"
import { RecordPaymentModal } from "@/components/dashboard/RecordPaymentModal"
import { paymentService } from "@/lib/payment.service"
import toast from "react-hot-toast"

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState("outstanding")
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<any>(null)
  
  // State for outstanding payments
  const [outstandingPayments, setOutstandingPayments] = useState<any[]>([])
  const [outstandingSummary, setOutstandingSummary] = useState<any>(null)
  const [outstandingLoading, setOutstandingLoading] = useState(true)
  
  // State for payment history
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyPagination, setHistoryPagination] = useState<any>(null)
  
  // State for stats
  const [stats, setStats] = useState<any>(null)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageLimit] = useState(20)

  // Fetch payment stats
  const fetchStats = async () => {
    try {
      const response = await paymentService.getPaymentStats()
      setStats(response.data.stats)
    } catch (error: any) {
      console.error("Failed to fetch stats:", error)
    }
  }

  // Fetch outstanding payments
  const fetchOutstandingPayments = async () => {
    setOutstandingLoading(true)
    try {
      const response = await paymentService.getOutstandingPayments({
        page: currentPage,
        limit: pageLimit,
      })
      
      setOutstandingPayments(response.data.outstanding_contracts)
      setOutstandingSummary(response.data.summary)
    } catch (error: any) {
      toast.error(error.message || "Failed to load outstanding payments")
      setOutstandingPayments([])
    } finally {
      setOutstandingLoading(false)
    }
  }

  // Fetch payment history
  const fetchPaymentHistory = async () => {
    setHistoryLoading(true)
    try {
      const response = await paymentService.getAllPayments({
        page: currentPage,
        limit: pageLimit,
        sort_by: "payment_date",
        sort_order: "DESC",
        status: "completed",
      })
      
      setPaymentHistory(response.data.payments)
      setHistoryPagination(response.meta.pagination)
    } catch (error: any) {
      toast.error(error.message || "Failed to load payment history")
      setPaymentHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchStats()
    fetchOutstandingPayments()
  }, [])

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === "outstanding") {
      fetchOutstandingPayments()
    } else if (activeTab === "history") {
      fetchPaymentHistory()
    }
  }, [activeTab, currentPage])

  // Handle recording payment
  const handleRecordPayment = (contract?: any) => {
    setSelectedContract(contract || null)
    setIsModalOpen(true)
  }

  const handlePaymentSuccess = () => {
    fetchStats()
    if (activeTab === "outstanding") {
      fetchOutstandingPayments()
    } else {
      fetchPaymentHistory()
    }
  }

  // Generate PDF for payment receipt
  const generatePaymentPDF = (payment: any) => {
    try {
      // Create PDF content
      const pdfContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Receipt - ${payment.reference_number || payment.id}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      color: #2563eb;
      font-size: 32px;
    }
    .header p {
      margin: 5px 0;
      color: #666;
    }
    .receipt-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .info-section {
      flex: 1;
    }
    .info-section h3 {
      color: #2563eb;
      margin-bottom: 10px;
      font-size: 14px;
      text-transform: uppercase;
    }
    .info-section p {
      margin: 5px 0;
      font-size: 14px;
    }
    .payment-details {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      margin: 30px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #64748b;
    }
    .detail-value {
      color: #1e293b;
    }
    .amount-section {
      background: #2563eb;
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 30px 0;
    }
    .amount-section h2 {
      margin: 0 0 10px 0;
      font-size: 16px;
      font-weight: normal;
      opacity: 0.9;
    }
    .amount-section .amount {
      font-size: 36px;
      font-weight: bold;
      margin: 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      background: #10b981;
      color: white;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>PAYMENT RECEIPT</h1>
    <p>Reference: ${payment.reference_number || payment.id}</p>
    <p>Date: ${new Date(payment.payment_date).toLocaleDateString('fr-DZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}</p>
  </div>

  <div class="receipt-info">
    <div class="info-section">
      <h3>Customer Information</h3>
      <p><strong>${payment.customer?.full_name || 'N/A'}</strong></p>
      <p>${payment.customer?.email || ''}</p>
      <p>${payment.customer?.phone || ''}</p>
    </div>
    <div class="info-section" style="text-align: right;">
      <h3>Contract Information</h3>
      <p><strong>${payment.contract?.contract_number || 'N/A'}</strong></p>
      <p>Status: <span class="status-badge">${payment.status.toUpperCase()}</span></p>
    </div>
  </div>

  <div class="amount-section">
    <h2>Amount Paid</h2>
    <p class="amount">${formatCurrency(payment.amount)}</p>
  </div>

  <div class="payment-details">
    <div class="detail-row">
      <span class="detail-label">Payment Method:</span>
      <span class="detail-value">${payment.payment_method.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Payment Date:</span>
      <span class="detail-value">${formatDate(payment.payment_date)}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Processed By:</span>
      <span class="detail-value">${payment.processor?.full_name || 'System'}</span>
    </div>
    ${payment.notes ? `
    <div class="detail-row">
      <span class="detail-label">Notes:</span>
      <span class="detail-value">${payment.notes}</span>
    </div>
    ` : ''}
  </div>

  <div class="footer">
    <p>This is an official payment receipt</p>
    <p>Generated on ${new Date().toLocaleString('fr-DZ')}</p>
  </div>
</body>
</html>
      `

      // Create blob and download
      const blob = new Blob([pdfContent], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Payment_Receipt_${payment.reference_number || payment.id}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success("Receipt downloaded successfully")
    } catch (error) {
      console.error("PDF generation error:", error)
      toast.error("Failed to generate receipt")
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-DZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Calculate collection rate
  const collectionRate = stats 
    ? ((stats.total_revenue / (stats.total_revenue + (outstandingSummary?.total_outstanding_amount || 0))) * 100).toFixed(1)
    : "0.0"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Payments</h1>
          <p className="text-muted-foreground">Track and manage customer payments</p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90"
          onClick={() => handleRecordPayment()}
        >
          <Plus className="w-4 h-4 mr-2" />
          Record Payment
        </Button>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground mb-2">Total Outstanding</p>
          <p className="text-3xl font-bold">
            {outstandingSummary 
              ? formatCurrency(outstandingSummary.total_outstanding_amount)
              : "Loading..."
            }
          </p>
          <p className="text-xs text-destructive mt-2">
            {outstandingSummary?.total_contracts || 0} contracts with outstanding balance
          </p>
        </div>
        
        <div className="p-6 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground mb-2">Total Revenue (All Time)</p>
          <p className="text-3xl font-bold text-accent">
            {stats ? formatCurrency(stats.total_revenue) : "Loading..."}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {stats?.by_status.completed || 0} completed payments
          </p>
        </div>
        
        <div className="p-6 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground mb-2">Collection Rate</p>
          <p className="text-3xl font-bold">{collectionRate}%</p>
          <p className="text-xs text-accent mt-2">
            {stats?.recent_payments_30d || 0} payments in last 30 days
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        <button
          onClick={() => {
            setActiveTab("outstanding")
            setCurrentPage(1)
          }}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "outstanding"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Outstanding Payments ({outstandingSummary?.total_contracts || 0})
        </button>
        <button
          onClick={() => {
            setActiveTab("history")
            setCurrentPage(1)
          }}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Payment History
        </button>
      </div>

      {/* Tab Content - Outstanding Payments */}
      {activeTab === "outstanding" && (
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by contract or customer..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {outstandingLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading outstanding payments...</p>
            </div>
          ) : outstandingPayments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No outstanding payments found</p>
            </div>
          ) : (
            <DataTable
              columns={[
                {
                  key: "contract_number",
                  label: "Contract",
                  sortable: true,
                },
                {
                  key: "customer",
                  label: "Customer",
                  render: (customer) => customer?.full_name || "N/A",
                  sortable: true,
                },
                {
                  key: "vehicle",
                  label: "Vehicle",
                  render: (vehicle) => 
                    vehicle ? `${vehicle.brand} ${vehicle.model}` : "N/A",
                },
                {
                  key: "total_amount",
                  label: "Total Amount",
                  render: (value) => formatCurrency(value),
                  sortable: true,
                },
                {
                  key: "total_paid",
                  label: "Paid",
                  render: (value) => formatCurrency(value),
                },
                {
                  key: "outstanding_amount",
                  label: "Outstanding",
                  render: (value) => (
                    <span className="font-semibold text-destructive">
                      {formatCurrency(value)}
                    </span>
                  ),
                  sortable: true,
                },
                {
                  key: "status",
                  label: "Status",
                  render: (status) => (
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        status === "active" 
                          ? "bg-accent/10 text-accent" 
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {status}
                    </span>
                  ),
                },
                {
                  key: "contract_id",
                  label: "Actions",
                  render: (_, row) => (
                    <Button 
                      size="sm" 
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => handleRecordPayment({
                        id: row.contract_id,
                        contract_number: row.contract_number,
                        customer: row.customer,
                        total_amount: row.total_amount,
                        outstanding_amount: row.outstanding_amount,
                      })}
                    >
                      <CreditCard className="w-4 h-4 mr-1" />
                      Record
                    </Button>
                  ),
                },
              ]}
              data={outstandingPayments.filter(payment => 
                !searchTerm || 
                payment.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                payment.customer?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
              )}
            />
          )}
        </div>
      )}

      {/* Tab Content - Payment History */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search payment history..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {historyLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading payment history...</p>
            </div>
          ) : paymentHistory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No payment history found</p>
            </div>
          ) : (
            <>
              <DataTable
                columns={[
                  {
                    key: "payment_date",
                    label: "Date",
                    render: (value) => formatDate(value),
                    sortable: true,
                  },
                  {
                    key: "customer",
                    label: "Customer",
                    render: (customer) => customer?.full_name || "N/A",
                    sortable: true,
                  },
                  {
                    key: "contract",
                    label: "Contract",
                    render: (contract) => contract?.contract_number || "N/A",
                  },
                  {
                    key: "amount",
                    label: "Amount",
                    render: (value) => formatCurrency(value),
                    sortable: true,
                  },
                  {
                    key: "payment_method",
                    label: "Method",
                    render: (value) => (
                      <span className="px-2 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                        {value.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </span>
                    ),
                  },
                  {
                    key: "reference_number",
                    label: "Reference",
                    render: (value) => value || "—",
                  },
                  {
                    key: "processor",
                    label: "Processed By",
                    render: (processor) => processor?.full_name || "System",
                  },
                  {
                    key: "id",
                    label: "Actions",
                    render: (_, payment) => (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generatePaymentPDF(payment)}
                        title="Download Receipt"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    ),
                  },
                ]}
                data={paymentHistory.filter(payment =>
                  !searchTerm ||
                  payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  payment.customer?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
                )}
              />
              
              {/* Pagination */}
              {historyPagination && historyPagination.total_pages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * pageLimit) + 1} to{" "}
                    {Math.min(currentPage * pageLimit, historyPagination.total)} of{" "}
                    {historyPagination.total} payments
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === historyPagination.total_pages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedContract(null)
        }}
        onSuccess={handlePaymentSuccess}
        preSelectedContract={selectedContract}
      />
    </div>
  )
}