"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/dashboard/data-table"
import { Plus, Search, CreditCard, Download } from "lucide-react"
import { RecordPaymentModal } from "@/components/dashboard/RecordPaymentModal"
import { paymentService } from "@/lib/payment.service"
import toast from "react-hot-toast"
import { useTranslations } from "next-intl"

/* ─── design tokens ─────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"
const MUTED   = "rgba(255,255,255,0.4)"

/* ─── helpers ────────────────────────────────────────────────── */
function StatCard({ label, value, sub, subAccent }: { label: string; value: React.ReactNode; sub?: string; subAccent?: string }) {
  return (
    <div style={{
      padding: "22px 24px", borderRadius: 14,
      background: SURFACE, border: `1px solid ${BORDER}`,
      transition: "border-color 0.2s",
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(34,197,94,0.28)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
    >
      <p style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.035em", color: "#fff", marginBottom: 6 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: subAccent || MUTED }}>{sub}</p>}
    </div>
  )
}

export default function PaymentsPage() {
  const t = useTranslations("payments")

  const [activeTab, setActiveTab]                   = useState("outstanding")
  const [searchTerm, setSearchTerm]                 = useState("")
  const [isModalOpen, setIsModalOpen]               = useState(false)
  const [selectedContract, setSelectedContract]     = useState<any>(null)
  const [outstandingPayments, setOutstandingPayments] = useState<any[]>([])
  const [outstandingSummary, setOutstandingSummary] = useState<any>(null)
  const [outstandingLoading, setOutstandingLoading] = useState(true)
  const [paymentHistory, setPaymentHistory]         = useState<any[]>([])
  const [historyLoading, setHistoryLoading]         = useState(false)
  const [historyPagination, setHistoryPagination]   = useState<any>(null)
  const [stats, setStats]                           = useState<any>(null)
  const [currentPage, setCurrentPage]               = useState(1)
  const [pageLimit]                                 = useState(20)

  const fetchStats = async () => {
    try {
      const response = await paymentService.getPaymentStats()
      setStats(response.data.stats)
    } catch (error: any) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const fetchOutstandingPayments = async () => {
    setOutstandingLoading(true)
    try {
      const response = await paymentService.getOutstandingPayments({ page: currentPage, limit: pageLimit })
      setOutstandingPayments(response.data.outstanding_contracts)
      setOutstandingSummary(response.data.summary)
    } catch (error: any) {
      toast.error(error.message || t("failedToLoadOutstanding"))
      setOutstandingPayments([])
    } finally {
      setOutstandingLoading(false)
    }
  }

  const fetchPaymentHistory = async () => {
    setHistoryLoading(true)
    try {
      const response = await paymentService.getAllPayments({
        page: currentPage, limit: pageLimit,
        sort_by: "payment_date", sort_order: "DESC", status: "completed",
      })
      setPaymentHistory(response.data.payments)
      setHistoryPagination(response.meta.pagination)
    } catch (error: any) {
      toast.error(error.message || t("failedToLoadHistory"))
      setPaymentHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => { fetchStats(); fetchOutstandingPayments() }, [])

  useEffect(() => {
    if (activeTab === "outstanding") fetchOutstandingPayments()
    else if (activeTab === "history") fetchPaymentHistory()
  }, [activeTab, currentPage])

  const handleRecordPayment = (contract?: any) => {
    setSelectedContract(contract || null)
    setIsModalOpen(true)
  }

  const handlePaymentSuccess = () => {
    fetchStats()
    if (activeTab === "outstanding") fetchOutstandingPayments()
    else fetchPaymentHistory()
  }

  const generatePaymentPDF = (payment: any) => {
    try {
      const pdfContent = `
<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Payment Receipt - ${payment.reference_number || payment.id}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
  .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
  .header h1 { margin: 0; color: #2563eb; font-size: 32px; }
  .header p { margin: 5px 0; color: #666; }
  .receipt-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
  .info-section { flex: 1; }
  .info-section h3 { color: #2563eb; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; }
  .info-section p { margin: 5px 0; font-size: 14px; }
  .payment-details { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 30px 0; }
  .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
  .detail-row:last-child { border-bottom: none; }
  .detail-label { font-weight: 600; color: #64748b; }
  .detail-value { color: #1e293b; }
  .amount-section { background: #2563eb; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0; }
  .amount-section h2 { margin: 0 0 10px 0; font-size: 16px; font-weight: normal; opacity: 0.9; }
  .amount-section .amount { font-size: 36px; font-weight: bold; margin: 0; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; background: #10b981; color: white; }
</style></head><body>
<div class="header"><h1>PAYMENT RECEIPT</h1>
  <p>Reference: ${payment.reference_number || payment.id}</p>
  <p>Date: ${new Date(payment.payment_date).toLocaleDateString('fr-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
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
  <div class="detail-row"><span class="detail-label">Payment Method:</span><span class="detail-value">${payment.payment_method.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span></div>
  <div class="detail-row"><span class="detail-label">Payment Date:</span><span class="detail-value">${formatDate(payment.payment_date)}</span></div>
  <div class="detail-row"><span class="detail-label">Processed By:</span><span class="detail-value">${payment.processor?.full_name || 'System'}</span></div>
  ${payment.notes ? `<div class="detail-row"><span class="detail-label">Notes:</span><span class="detail-value">${payment.notes}</span></div>` : ''}
</div>
<div class="footer"><p>This is an official payment receipt</p><p>Generated on ${new Date().toLocaleString('fr-DZ')}</p></div>
</body></html>`

      const blob = new Blob([pdfContent], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Payment_Receipt_${payment.reference_number || payment.id}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success(t("receiptDownloaded"))
    } catch (error) {
      console.error("PDF generation error:", error)
      toast.error(t("failedToGenerateReceipt"))
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(amount)

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-DZ', { year: 'numeric', month: 'short', day: 'numeric' })

  const collectionRate = stats
    ? ((stats.total_revenue / (stats.total_revenue + (outstandingSummary?.total_outstanding_amount || 0))) * 100).toFixed(1)
    : "0.0"

  const isLoading = activeTab === "outstanding" ? outstandingLoading : historyLoading

  return (
    <div style={{ fontFamily: FONT, color: "#fff", minHeight: "100vh", padding: "32px 0" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 800, letterSpacing: "-0.035em", marginBottom: 6 }}>
            {t("title")}
          </h1>
          <p style={{ fontSize: 14, color: MUTED }}>{t("subtitle")}</p>
        </div>
        <button
          onClick={() => handleRecordPayment()}
          style={{
            fontFamily: FONT, fontSize: 14, fontWeight: 600,
            padding: "10px 20px", borderRadius: 10, border: "none",
            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
            background: GREEN, color: "#fff",
            boxShadow: "0 0 20px rgba(34,197,94,0.25)", transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#16A34A"; e.currentTarget.style.transform = "translateY(-1px)" }}
          onMouseLeave={e => { e.currentTarget.style.background = GREEN; e.currentTarget.style.transform = "none" }}
        >
          <Plus size={16} /> {t("recordPayment")}
        </button>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginBottom: 28 }}>
        <StatCard
          label={t("totalOutstanding")}
          value={outstandingSummary ? formatCurrency(outstandingSummary.total_outstanding_amount) : "—"}
          sub={`${outstandingSummary?.total_contracts || 0} ${t("contractsWithOutstanding")}`}
          subAccent="#EF4444"
        />
        <StatCard
          label={t("totalRevenue")}
          value={stats ? formatCurrency(stats.total_revenue) : "—"}
          sub={`${stats?.by_status.completed || 0} ${t("completedPayments")}`}
          subAccent={GREEN}
        />
        <StatCard
          label={t("collectionRate")}
          value={`${collectionRate}%`}
          sub={`${stats?.recent_payments_30d || 0} ${t("paymentsLast30Days")}`}
          subAccent={GREEN}
        />
      </div>

      {/* ── Tabs ── */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, marginBottom: 24, display: "flex", gap: 4 }}>
        {([
          { key: "outstanding", label: `${t("outstandingPayments")} (${outstandingSummary?.total_contracts || 0})` },
          { key: "history",     label: t("paymentHistory") },
        ] as const).map(tab => (
          <button key={tab.key}
            onClick={() => { setActiveTab(tab.key); setCurrentPage(1) }}
            style={{
              fontFamily: FONT, fontSize: 13, fontWeight: 600,
              padding: "10px 18px", background: "transparent", border: "none",
              borderBottom: `2px solid ${activeTab === tab.key ? GREEN : "transparent"}`,
              color: activeTab === tab.key ? GREEN : MUTED,
              cursor: "pointer", transition: "all 0.2s", marginBottom: -1,
            }}
            onMouseEnter={e => { if (activeTab !== tab.key) e.currentTarget.style.color = "#fff" }}
            onMouseLeave={e => { if (activeTab !== tab.key) e.currentTarget.style.color = MUTED }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Search ── */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: MUTED }} />
        <input
          placeholder={activeTab === "outstanding" ? t("searchOutstandingPlaceholder") : t("searchHistoryPlaceholder")}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: "100%", padding: "10px 12px 10px 36px", borderRadius: 10,
            border: `1px solid ${BORDER}`, background: SURFACE, color: "#fff",
            fontFamily: FONT, fontSize: 13, outline: "none", transition: "border-color 0.2s",
          }}
          onFocus={e => (e.currentTarget.style.borderColor = "rgba(34,197,94,0.4)")}
          onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
        />
      </div>

      {/* ════════════ OUTSTANDING TAB ════════════ */}
      {activeTab === "outstanding" && (
        <>
          {outstandingLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${BORDER}`, borderTopColor: GREEN, animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : outstandingPayments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "56px 0" }}>
              <CreditCard size={44} style={{ color: "rgba(255,255,255,0.1)", display: "block", margin: "0 auto 14px" }} />
              <p style={{ fontSize: 14, color: MUTED }}>{t("noOutstandingFound")}</p>
            </div>
          ) : (
            <div style={{ borderRadius: 14, border: `1px solid ${BORDER}`, background: SURFACE, overflow: "hidden" }}>
              <DataTable
                columns={[
                  {
                    key: "contract_number", label: t("contract"), sortable: true,
                    render: (value) => <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: GREEN }}>{value}</span>,
                  },
                  {
                    key: "customer", label: t("customer"), sortable: true,
                    render: (customer) => <span style={{ fontSize: 13, fontWeight: 600 }}>{customer?.full_name || "N/A"}</span>,
                  },
                  {
                    key: "vehicle", label: t("vehicle"),
                    render: (vehicle) => <span style={{ fontSize: 13 }}>{vehicle ? `${vehicle.brand} ${vehicle.model}` : "N/A"}</span>,
                  },
                  {
                    key: "total_amount", label: t("totalAmount"), sortable: true,
                    render: (value) => <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(value)}</span>,
                  },
                  {
                    key: "total_paid", label: t("paid"),
                    render: (value) => <span style={{ fontSize: 13, color: GREEN, fontWeight: 600 }}>{formatCurrency(value)}</span>,
                  },
                  {
                    key: "outstanding_amount", label: t("outstanding"), sortable: true,
                    render: (value) => <span style={{ fontSize: 13, fontWeight: 700, color: "#EF4444" }}>{formatCurrency(value)}</span>,
                  },
                  {
                    key: "status", label: t("status"),
                    render: (status) => (
                      <span style={{
                        padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                        background: status === "active" ? "rgba(34,197,94,0.1)" : SURFACE,
                        color: status === "active" ? GREEN : MUTED,
                        border: `1px solid ${status === "active" ? "rgba(34,197,94,0.25)" : BORDER}`,
                      }}>
                        {status}
                      </span>
                    ),
                  },
                  {
                    key: "contract_id", label: t("actions"),
                    render: (_, row) => (
                      <button
                        onClick={() => handleRecordPayment({
                          id: row.contract_id, contract_number: row.contract_number,
                          customer: row.customer, total_amount: row.total_amount,
                          outstanding_amount: row.outstanding_amount,
                        })}
                        style={{
                          fontFamily: FONT, fontSize: 12, fontWeight: 600,
                          padding: "6px 12px", borderRadius: 7, border: "none",
                          cursor: "pointer", background: GREEN, color: "#fff",
                          display: "inline-flex", alignItems: "center", gap: 5,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#16A34A"}
                        onMouseLeave={e => e.currentTarget.style.background = GREEN}
                      >
                        <CreditCard size={13} /> {t("record")}
                      </button>
                    ),
                  },
                ]}
                data={outstandingPayments.filter(p =>
                  !searchTerm ||
                  p.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  p.customer?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
                )}
              />
            </div>
          )}
        </>
      )}

      {/* ════════════ HISTORY TAB ════════════ */}
      {activeTab === "history" && (
        <>
          {historyLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${BORDER}`, borderTopColor: GREEN, animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : paymentHistory.length === 0 ? (
            <div style={{ textAlign: "center", padding: "56px 0" }}>
              <CreditCard size={44} style={{ color: "rgba(255,255,255,0.1)", display: "block", margin: "0 auto 14px" }} />
              <p style={{ fontSize: 14, color: MUTED }}>{t("noHistoryFound")}</p>
            </div>
          ) : (
            <>
              <div style={{ borderRadius: 14, border: `1px solid ${BORDER}`, background: SURFACE, overflow: "hidden", marginBottom: 16 }}>
                <DataTable
                  columns={[
                    {
                      key: "payment_date", label: t("date"), sortable: true,
                      render: (value) => <span style={{ fontSize: 13 }}>{formatDate(value)}</span>,
                    },
                    {
                      key: "customer", label: t("customer"), sortable: true,
                      render: (customer) => <span style={{ fontSize: 13, fontWeight: 600 }}>{customer?.full_name || "N/A"}</span>,
                    },
                    {
                      key: "contract", label: t("contract"),
                      render: (contract) => (
                        <span style={{ fontFamily: "monospace", fontSize: 13, color: GREEN, fontWeight: 700 }}>
                          {contract?.contract_number || "N/A"}
                        </span>
                      ),
                    },
                    {
                      key: "amount", label: t("amount"), sortable: true,
                      render: (value) => <span style={{ fontSize: 13, fontWeight: 700 }}>{formatCurrency(value)}</span>,
                    },
                    {
                      key: "payment_method", label: t("method"),
                      render: (value) => (
                        <span style={{
                          padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                          background: "rgba(34,197,94,0.08)", color: GREEN,
                          border: "1px solid rgba(34,197,94,0.2)",
                        }}>
                          {value.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </span>
                      ),
                    },
                    {
                      key: "reference_number", label: t("reference"),
                      render: (value) => <span style={{ fontSize: 12, fontFamily: "monospace", color: value ? "#fff" : MUTED }}>{value || "—"}</span>,
                    },
                    {
                      key: "processor", label: t("processedBy"),
                      render: (processor) => <span style={{ fontSize: 13, color: MUTED }}>{processor?.full_name || "System"}</span>,
                    },
                    {
                      key: "id", label: t("actions"),
                      render: (_, payment) => (
                        <button
                          onClick={() => generatePaymentPDF(payment)}
                          title={t("downloadReceipt")}
                          style={{
                            width: 30, height: 30, borderRadius: 7,
                            border: `1px solid ${BORDER}`, background: "transparent",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            color: MUTED, transition: "all 0.15s",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)"; e.currentTarget.style.color = GREEN }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED }}
                        >
                          <Download size={14} />
                        </button>
                      ),
                    },
                  ]}
                  data={paymentHistory.filter(p =>
                    !searchTerm ||
                    p.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.customer?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
                  )}
                />
              </div>

              {/* Pagination */}
              {historyPagination && historyPagination.total_pages > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <p style={{ fontSize: 13, color: MUTED }}>
                    {t("showing")} {((currentPage - 1) * pageLimit) + 1} to{" "}
                    {Math.min(currentPage * pageLimit, historyPagination.total)} {t("of")}{" "}
                    {historyPagination.total} {t("payments")}
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { label: t("previous"), disabled: currentPage === 1, onClick: () => setCurrentPage(currentPage - 1) },
                      { label: t("next"), disabled: currentPage === historyPagination.total_pages, onClick: () => setCurrentPage(currentPage + 1) },
                    ].map((btn, i) => (
                      <button key={i} onClick={btn.onClick} disabled={btn.disabled}
                        style={{
                          fontFamily: FONT, fontSize: 13, fontWeight: 500,
                          padding: "8px 16px", borderRadius: 8,
                          cursor: btn.disabled ? "not-allowed" : "pointer",
                          background: SURFACE, color: btn.disabled ? "rgba(255,255,255,0.2)" : MUTED,
                          border: `1px solid ${BORDER}`, transition: "all 0.2s", opacity: btn.disabled ? 0.5 : 1,
                        }}
                        onMouseEnter={e => { if (!btn.disabled) { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)" } }}
                        onMouseLeave={e => { e.currentTarget.style.color = btn.disabled ? "rgba(255,255,255,0.2)" : MUTED; e.currentTarget.style.borderColor = BORDER }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Modal (logic unchanged) ── */}
      <RecordPaymentModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedContract(null) }}
        onSuccess={handlePaymentSuccess}
        preSelectedContract={selectedContract}
      />
    </div>
  )
}