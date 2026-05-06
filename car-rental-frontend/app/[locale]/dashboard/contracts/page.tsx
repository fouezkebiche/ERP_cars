// app/[locale]/dashboard/contracts/page.tsx (FULLY LOCALIZED)
"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Plus, Search, Eye, Edit2, FileText, CheckCircle, XCircle, Calendar, AlertCircle } from "lucide-react"
import { contractApi, Contract } from "@/lib/contractApi"
import { useNotifications } from "@/hooks/useNotifications"
import toast from "react-hot-toast"

/* ─── design tokens (match landing page) ───────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"
const MUTED   = "rgba(255,255,255,0.4)"

/* ─── tiny reusable pieces ──────────────────────────────────── */
function StatCard({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div style={{
      padding: "20px 22px", borderRadius: 14,
      background: SURFACE, border: `1px solid ${BORDER}`,
      transition: "border-color 0.2s",
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(34,197,94,0.28)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
    >
      <p style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.035em", color: accent || "#fff" }}>{value}</p>
    </div>
  )
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: FONT, fontSize: 13, fontWeight: 500,
      padding: "8px 16px", borderRadius: 8, cursor: "pointer",
      background: active ? GREEN : SURFACE,
      color: active ? "#fff" : MUTED,
      border: `1px solid ${active ? GREEN : BORDER}`,
      transition: "all 0.2s",
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = "rgba(34,197,94,0.4)"; e.currentTarget.style.color = "#fff" } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED } }}
    >
      {children}
    </button>
  )
}

export default function ContractsPage() {
  const t = useTranslations("contracts")
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total_contracts: 0,
    by_status: { active: 0, completed: 0, cancelled: 0 },
    total_revenue: 0,
    recent_contracts_30d: 0,
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
  })
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed" | "cancelled">("all")

  const { data: kmAlertsData } = useNotifications({ type: 'km_limit_*', limit: 100, unread: true })

  const alertsByContract = kmAlertsData?.notifications.reduce((acc: { [key: string]: number }, notif) => {
    const cid = notif.data?.contract_id
    if (cid) acc[cid] = (acc[cid] || 0) + 1
    return acc
  }, {}) || {}

  const fetchContracts = async () => {
    try {
      setLoading(true)
      const response = await contractApi.list({
        search: searchTerm || undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
        page: pagination.page,
        limit: pagination.limit,
      })
      setContracts(response.data.contracts)
      setPagination({ ...pagination, total: response.meta.pagination.total, total_pages: response.meta.pagination.total_pages })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failedToLoad"))
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await contractApi.getStats()
      setStats(response.data.stats)
    } catch (error) {
      console.error("Failed to load stats:", error)
    }
  }

  const handleComplete = async (id: string) => { router.push(`/dashboard/contracts/${id}/complete`) }

  const handleCancel = async (id: string, contractNumber: string) => {
    if (!confirm(t("deleteConfirm", { contractNumber }))) return
    try {
      await contractApi.cancel(id)
      toast.success(t("cancelSuccess"))
      fetchContracts()
      fetchStats()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("cancelFailed"))
    }
  }

  const handleExtend = async (id: string) => { router.push(`/dashboard/contracts/${id}/extend`) }

  useEffect(() => { fetchContracts(); fetchStats() }, [searchTerm, filterStatus, pagination.page])

  const generateContractHTML = (contract: Contract) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Contract ${contract.contract_number}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          
          body {
            font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
            margin: 0;
            padding: 40px;
            line-height: 1.6;
            color: #1F2937;
            background: #FFFFFF;
          }
          
          .header {
            text-align: center;
            margin-bottom: 48px;
            padding-bottom: 32px;
            border-bottom: 3px solid #E5E7EB;
            position: relative;
          }
          
          .header::before {
            content: '';
            position: absolute;
            bottom: -3px;
            left: 50%;
            transform: translateX(-50%);
            width: 100px;
            height: 3px;
            background: #22C55E;
            border-radius: 2px;
          }
          
          .header h1 {
            margin: 0 0 16px 0;
            font-size: 36px;
            font-weight: 800;
            color: #1F2937;
            letter-spacing: -0.02em;
          }
          
          .header .contract-number {
            font-size: 20px;
            font-weight: 600;
            color: #6B7280;
            margin-bottom: 8px;
          }
          
          .header .status {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          
          .status.active {
            background: rgba(34, 197, 94, 0.1);
            color: #22C55E;
          }
          
          .status.completed {
            background: rgba(34, 197, 94, 0.1);
            color: #22C55E;
          }
          
          .status.cancelled {
            background: rgba(239, 68, 68, 0.1);
            color: #EF4444;
          }
          
          .section {
            margin: 40px 0;
            background: #F9FAFB;
            border-radius: 16px;
            padding: 24px;
            border: 1px solid #E5E7EB;
          }
          
          .section-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 20px;
            color: #1F2937;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .section-title::before {
            content: '';
            width: 4px;
            height: 20px;
            background: #22C55E;
            border-radius: 2px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 16px;
            margin-bottom: 16px;
          }
          
          .info-item {
            padding: 12px;
            background: #FFFFFF;
            border-radius: 8px;
            border: 1px solid #E5E7EB;
          }
          
          .info-label {
            font-weight: 600;
            color: #6B7280;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 4px;
          }
          
          .info-value {
            color: #1F2937;
            font-size: 14px;
            font-weight: 500;
          }
          
          .financial-summary {
            background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
            padding: 32px;
            border-radius: 16px;
            margin-top: 32px;
            border: 1px solid #E5E7EB;
            position: relative;
            overflow: hidden;
          }
          
          .financial-summary::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #22C55E 0%, #16A34A 100%);
          }
          
          .total-amount {
            font-size: 32px;
            font-weight: 800;
            color: #22C55E;
            text-align: center;
            margin-top: 24px;
            letter-spacing: -0.02em;
          }
          
          .footer {
            margin-top: 64px;
            padding-top: 24px;
            border-top: 1px solid #E5E7EB;
            text-align: center;
            font-size: 12px;
            color: #6B7280;
            background: #F9FAFB;
            border-radius: 8px;
            padding: 16px;
          }
          
          .additional-services {
            list-style: none;
            padding: 0;
            margin: 16px 0;
          }
          
          .additional-services li {
            padding: 8px 12px;
            margin: 4px 0;
            background: #FFFFFF;
            border-radius: 6px;
            border-left: 3px solid #22C55E;
            font-size: 13px;
          }
          
          @media print {
            body { margin: 20px; }
            .section { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Rental Contract</h1>
          <div class="contract-number">#${contract.contract_number}</div>
          <div class="status ${contract.status.toLowerCase()}">${contract.status}</div>
        </div>
        <div class="section">
          <div class="section-title">${t("customerInformation")}</div>
          <div class="info-grid">
            <div class="info-item"><div class="info-label">${t("name")}:</div><div class="info-value">${contract.customer?.full_name || 'N/A'}</div></div>
            <div class="info-item"><div class="info-label">${t("phone")}:</div><div class="info-value">${contract.customer?.phone || 'N/A'}</div></div>
            ${contract.customer?.email ? `<div class="info-item"><div class="info-label">${t("email")}:</div><div class="info-value">${contract.customer.email}</div></div>` : ''}
            <div class="info-item"><div class="info-label">${t("customerType")}:</div><div class="info-value">${contract.customer?.customer_type || 'N/A'}</div></div>
          </div>
        </div>
        <div class="section">
          <div class="section-title">🚗 ${t("vehicleInformation")}</div>
          <div class="info-grid">
            <div class="info-item"><div class="info-label">${t("vehicle")}:</div><div class="info-value">${contract.vehicle?.brand} ${contract.vehicle?.model} (${contract.vehicle?.year})</div></div>
            <div class="info-item"><div class="info-label">${t("registrationNumber")}:</div><div class="info-value">${contract.vehicle?.registration_number || 'N/A'}</div></div>
            <div class="info-item"><div class="info-label">${t("startMileage")}:</div><div class="info-value">${contract.start_mileage?.toLocaleString() || 'N/A'} km</div></div>
            ${contract.end_mileage ? `<div class="info-item"><div class="info-label">${t("endMileage")}:</div><div class="info-value">${contract.end_mileage.toLocaleString()} km</div></div>` : ''}
          </div>
        </div>
        <div class="section">
          <div class="section-title">📅 ${t("rentalPeriod")}</div>
          <div class="info-grid">
            <div class="info-item"><div class="info-label">${t("startDate")}:</div><div class="info-value">${new Date(contract.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div></div>
            <div class="info-item"><div class="info-label">${t("endDate")}:</div><div class="info-value">${new Date(contract.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div></div>
            <div class="info-item"><div class="info-label">${t("totalDays")}:</div><div class="info-value">${contract.total_days} days</div></div>
            ${contract.actual_return_date ? `<div class="info-item"><div class="info-label">${t("actualReturn")}:</div><div class="info-value">${new Date(contract.actual_return_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div></div>` : ''}
          </div>
        </div>
        ${contract.extras && Object.values(contract.extras).some(v => v) ? `
        <div class="section">
          <div class="section-title">⭐ ${t("additionalServices")}</div>
          <ul class="additional-services">
            ${contract.extras.gps ? `<li>📍 ${t("gpsNavigation")}</li>` : ''}
            ${contract.extras.child_seat ? `<li>👶 ${t("childSeat")}</li>` : ''}
            ${contract.extras.additional_driver ? `<li>👤 ${t("additionalDriver")}</li>` : ''}
            ${contract.extras.insurance_premium ? `<li>🛡️ ${t("premiumInsurance")}</li>` : ''}
          </ul>
        </div>` : ''}
        <div class="financial-summary">
          <div class="section-title">💰 ${t("financialSummary")}</div>
          <div class="info-grid">
            <div class="info-item"><div class="info-label">${t("dailyRate")}:</div><div class="info-value">${parseFloat(contract.daily_rate).toLocaleString()} DZD</div></div>
            <div class="info-item"><div class="info-label">${t("baseAmount")}:</div><div class="info-value">${parseFloat(contract.base_amount).toLocaleString()} DZD</div></div>
            ${parseFloat(contract.additional_charges) > 0 ? `<div class="info-item"><div class="info-label">${t("additionalCharges")}:</div><div class="info-value">${parseFloat(contract.additional_charges).toLocaleString()} DZD</div></div>` : ''}
            ${parseFloat(contract.discount_amount) > 0 ? `<div class="info-item"><div class="info-label">${t("discount")}:</div><div class="info-value" style="color: #22C55E;">-${parseFloat(contract.discount_amount).toLocaleString()} DZD</div></div>` : ''}
            <div class="info-item"><div class="info-label">${t("tax")}:</div><div class="info-value">${parseFloat(contract.tax_amount).toLocaleString()} DZD</div></div>
            <div class="info-item"><div class="info-label">${t("deposit")}:</div><div class="info-value">${parseFloat(contract.deposit_amount).toLocaleString()} DZD</div></div>
          </div>
          <div class="total-amount">${t("totalAmount")}: ${parseFloat(contract.total_amount).toLocaleString()} DZD</div>
        </div>
        ${contract.notes ? `<div class="section"><div class="section-title">📝 ${t("notes")}</div><p style="background: #FFFFFF; padding: 16px; border-radius: 8px; border: 1px solid #E5E7EB;">${contract.notes.replace(/\n/g, '<br>')}</p></div>` : ''}
        <div class="footer">
          <div style="margin-bottom: 8px; font-weight: 600;">🏢 Car Manager - Professional Car Rental System</div>
          <p>${t("generatedOn")} ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          <p><strong>${t("contractNumber")}:</strong> ${contract.contract_number}</p>
          ${contract.creator ? `<p><strong>${t("createdBy")}:</strong> ${contract.creator.full_name}</p>` : ''}
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #9CA3AF;">
            This is a legally binding rental contract. Please keep it for your records.
          </div>
        </div>
      </body>
      </html>
    `
  }

  const handleDownloadPDF = (contract: Contract) => {
    try {
      // Create HTML content
      const htmlContent = generateContractHTML(contract)
      
      // Open in new window and trigger print dialog for PDF download
      const printWindow = window.open('', '_blank')
      if (!printWindow) { 
        toast.error(t("allowPopups")); 
        return 
      }
      
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      
      // Wait for content to load, then trigger print dialog
      setTimeout(() => {
        printWindow.print()
        // Close window after print dialog
        setTimeout(() => {
          printWindow.close()
        }, 1000)
      }, 500)
      
      toast.success(t("contractDownloaded"))
    } catch (error) {
      console.error('Download error:', error)
      toast.error(t("downloadFailed"))
    }
  }

  const handleViewPDF = (contract: Contract) => {
    const viewWindow = window.open('', '_blank')
    if (!viewWindow) { toast.error(t("allowPopups")); return }
    viewWindow.document.write(generateContractHTML(contract))
    viewWindow.document.close()
    viewWindow.focus()
    toast.success(t("pdfOpened"))
  }

  return (
    <div style={{ fontFamily: FONT, color: "#fff", minHeight: "100vh", padding: "32px 0" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 800, letterSpacing: "-0.035em", marginBottom: 6 }}>
            {t("title")}
          </h1>
          <p style={{ fontSize: 14, color: MUTED }}>{t("subtitle")}</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/contracts/new")}
          style={{
            fontFamily: FONT, fontSize: 14, fontWeight: 600,
            padding: "10px 20px", borderRadius: 10, border: "none",
            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
            background: GREEN, color: "#fff",
            boxShadow: "0 0 20px rgba(34,197,94,0.25)",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#16A34A"; e.currentTarget.style.transform = "translateY(-1px)" }}
          onMouseLeave={e => { e.currentTarget.style.background = GREEN; e.currentTarget.style.transform = "none" }}
        >
          <Plus size={16} />
          {t("newContract")}
        </button>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 28 }}>
        <StatCard label={t("totalContracts")} value={stats.total_contracts} />
        <StatCard label={t("active")} value={stats.by_status.active} accent={GREEN} />
        <StatCard label={t("completed")} value={stats.by_status.completed} />
        <StatCard
          label={t("totalRevenue")}
          value={`${(stats.total_revenue / 1000000).toFixed(2)}M DZD`}
        />
      </div>

      {/* ── Search & Filters ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24, alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 260px" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: MUTED }} />
          <input
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px 10px 36px",
              borderRadius: 10, border: `1px solid ${BORDER}`,
              background: SURFACE, color: "#fff",
              fontFamily: FONT, fontSize: 13,
              outline: "none", transition: "border-color 0.2s",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "rgba(34,197,94,0.4)")}
            onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
          />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["all", "active", "completed", "cancelled"] as const).map(s => (
            <FilterBtn key={s} active={filterStatus === s} onClick={() => setFilterStatus(s)}>
              {t(s)}
            </FilterBtn>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            border: `3px solid ${BORDER}`, borderTopColor: GREEN,
            animation: "spin 0.8s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <>
          {/* table wrapper */}
          <div style={{
            borderRadius: 14, border: `1px solid ${BORDER}`,
            background: SURFACE, overflow: "hidden", marginBottom: 20,
          }}>
            <DataTable
              columns={[
                {
                  key: "contract_number",
                  label: t("contractNumber"),
                  sortable: true,
                  render: (value) => (
                    <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: GREEN }}>{value}</span>
                  ),
                },
                {
                  key: "customer",
                  label: t("customer"),
                  render: (customer) => (
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 13 }}>{customer?.full_name}</p>
                      <p style={{ fontSize: 11, color: MUTED }}>{customer?.phone}</p>
                    </div>
                  ),
                },
                {
                  key: "vehicle",
                  label: t("vehicle"),
                  render: (vehicle) =>
                    vehicle ? (
                      <span style={{ fontSize: 13 }}>{vehicle.brand} {vehicle.model} ({vehicle.registration_number})</span>
                    ) : "—",
                },
                {
                  key: "start_date",
                  label: t("period"),
                  render: (value, row) => (
                    <div style={{ fontSize: 12 }}>
                      <p style={{ fontWeight: 500 }}>{new Date(value).toLocaleDateString()}</p>
                      <p style={{ color: MUTED }}>→ {new Date(row.end_date).toLocaleDateString()}</p>
                    </div>
                  ),
                },
                {
                  key: "total_days",
                  label: t("days"),
                  render: (value) => <span style={{ fontWeight: 700, fontSize: 13 }}>{value}</span>,
                },
                {
                  key: "total_amount",
                  label: t("amount"),
                  sortable: true,
                  render: (value) => (
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>
                      {parseFloat(value).toLocaleString()} DZD
                    </span>
                  ),
                },
                {
                  key: "status",
                  label: t("status"),
                  render: (status) => <StatusBadge status={status} />,
                },
                {
                  key: "alerts",
                  label: t("alerts"),
                  render: (_, row) => (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {alertsByContract[row.id] > 0 ? (
                        <>
                          <StatusBadge status="critical" label={`(${alertsByContract[row.id]})`} />
                          <AlertCircle size={13} style={{ color: "#EF4444" }} aria-label="View Alerts" />
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: MUTED }}>{t("none")}</span>
                      )}
                    </div>
                  ),
                },
                {
                  key: "actions",
                  label: t("actions"),
                  render: (_, row) => (
                    <div style={{ display: "flex", gap: 2 }}>
                      {[
                        { icon: <Eye size={15} />, title: t("view"), onClick: () => router.push(`/dashboard/contracts/${row.id}`), color: MUTED },
                        ...(row.status === "active" ? [
                          { icon: <CheckCircle size={15} />, title: t("complete"), onClick: () => handleComplete(row.id), color: GREEN },
                          { icon: <Calendar size={15} />, title: t("extend"), onClick: () => handleExtend(row.id), color: "#38BDF8" },
                          { icon: <XCircle size={15} />, title: t("cancelContract"), onClick: () => handleCancel(row.id, row.contract_number), color: "#EF4444" },
                        ] : []),
                        { icon: <FileText size={15} />, title: t("downloadPDF"), onClick: () => handleDownloadPDF(row), color: "#FB923C" },
                      ].map((btn, i) => (
                        <button key={i} title={btn.title} onClick={btn.onClick}
                          style={{
                            width: 28, height: 28, borderRadius: 7, border: "none",
                            background: "transparent", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: btn.color, transition: "background 0.15s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          {btn.icon}
                        </button>
                      ))}
                    </div>
                  ),
                },
              ]}
              data={contracts}
            />
          </div>

          {/* ── Pagination ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontSize: 13, color: MUTED }}>
              {t("showing", { count: contracts.length, total: pagination.total })}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: t("previous"), disabled: pagination.page === 1, onClick: () => setPagination({ ...pagination, page: pagination.page - 1 }) },
                { label: t("next"), disabled: pagination.page === pagination.total_pages, onClick: () => setPagination({ ...pagination, page: pagination.page + 1 }) },
              ].map((btn, i) => (
                <button key={i} onClick={btn.onClick} disabled={btn.disabled}
                  style={{
                    fontFamily: FONT, fontSize: 13, fontWeight: 500,
                    padding: "8px 16px", borderRadius: 8, cursor: btn.disabled ? "not-allowed" : "pointer",
                    background: SURFACE, color: btn.disabled ? "rgba(255,255,255,0.2)" : MUTED,
                    border: `1px solid ${BORDER}`, transition: "all 0.2s",
                    opacity: btn.disabled ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { if (!btn.disabled) { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)" } }}
                  onMouseLeave={e => { e.currentTarget.style.color = btn.disabled ? "rgba(255,255,255,0.2)" : MUTED; e.currentTarget.style.borderColor = BORDER }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}