// app/[locale]/dashboard/contracts/[id]/page.tsx (FULLY LOCALIZED)
"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { KmUsageProgress } from "@/components/dashboard/KmUsageProgress"
import { ArrowLeft, CheckCircle, XCircle, Calendar, Download, AlertCircle, X, Loader2 } from "lucide-react"
import { contractApi, Contract } from "@/lib/contractApi"
import { useNotifications } from "@/hooks/useNotifications"
import toast from "react-hot-toast"

/* ─── design tokens ─────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"
const MUTED   = "rgba(255,255,255,0.4)"

/* ─── tiny helpers ───────────────────────────────────────────── */
function SectionCard({ title, children, headerRight }: { title: string; children: React.ReactNode; headerRight?: React.ReactNode }) {
  return (
    <div style={{ padding: "24px 26px", borderRadius: 14, background: SURFACE, border: `1px solid ${BORDER}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.015em", color: "#fff" }}>{title}</h2>
        {headerRight}
      </div>
      {children}
    </div>
  )
}

function InfoCell({ label, value, mono, children }: { label: string; value?: string; mono?: boolean; children?: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: MUTED, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      {value && (
        <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", fontFamily: mono ? "monospace" : FONT }}>
          {value}
        </p>
      )}
      {children}
    </div>
  )
}

function SummaryRow({ label, value, accent, large, border }: { label: string; value: string; accent?: string; large?: boolean; border?: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      paddingTop: border ? 10 : 0, borderTop: border ? `1px solid ${BORDER}` : "none", marginTop: border ? 8 : 0,
    }}>
      <span style={{ fontSize: large ? 14 : 13, color: MUTED }}>{label}</span>
      <span style={{ fontSize: large ? 17 : 13, fontWeight: large ? 800 : 600, color: accent || "#fff", letterSpacing: large ? "-0.02em" : "normal" }}>{value}</span>
    </div>
  )
}

function ActionBtn({
  onClick, children, color = GREEN, disabled = false,
}: { onClick: () => void; children: React.ReactNode; color?: string; disabled?: boolean }) {
  const [hov, setHov] = useState(false)
  const base = color === "destructive" ? "#EF4444" : color === "outline" ? "transparent" : color
  const hover = color === "destructive" ? "#DC2626" : color === "outline" ? "rgba(255,255,255,0.07)" : "#16A34A"
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: FONT, fontSize: 13, fontWeight: 600,
        padding: "9px 16px", borderRadius: 9, border: `1px solid ${color === "outline" ? BORDER : "transparent"}`,
        cursor: disabled ? "not-allowed" : "pointer",
        background: hov ? hover : base,
        color: color === "outline" ? (hov ? "#fff" : MUTED) : "#fff",
        display: "inline-flex", alignItems: "center", gap: 7,
        transition: "all 0.18s", opacity: disabled ? 0.5 : 1,
        boxShadow: color !== "outline" && color !== "destructive" && !disabled ? "0 0 16px rgba(34,197,94,0.2)" : "none",
      }}
    >
      {children}
    </button>
  )
}

/* ─── notification detail renderer (unchanged logic) ─────────── */
const renderNotificationDetails = (data: any) => {
  if (!data || typeof data !== 'object') return null
  return (
    <div style={{ fontSize: 12, lineHeight: 1.8, marginTop: 8 }}>
      {data.km_driven && <p><span style={{ fontWeight: 600 }}>KM Driven:</span> {data.km_driven.toLocaleString()} km</p>}
      {data.km_allowed && <p><span style={{ fontWeight: 600 }}>KM Allowed:</span> {data.km_allowed.toLocaleString()} km</p>}
      {data.km_remaining !== undefined && <p><span style={{ fontWeight: 600 }}>KM Remaining:</span> {data.km_remaining.toLocaleString()} km</p>}
      {data.percentage !== undefined && <p><span style={{ fontWeight: 600 }}>Usage:</span> {data.percentage.toFixed(1)}%</p>}
      {data.contract_number && <p><span style={{ fontWeight: 600 }}>Contract:</span> {data.contract_number}</p>}
      {data.vehicle_registration && <p><span style={{ fontWeight: 600 }}>Vehicle:</span> {data.vehicle_registration}</p>}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
export default function ContractDetailPage() {
  const t = useTranslations("contracts")
  const router = useRouter()
  const params = useParams()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [activeTab, setActiveTab] = useState<"details" | "alerts">("details")

  const {
    data: kmAlertsData,
    loading: alertsLoading,
    dismissNotification,
    restoreNotification,
  } = useNotifications({ type: 'km_limit_*', unread: true, limit: 100 })

  const kmAlerts = (kmAlertsData?.notifications || []).filter(
    notif => notif.data?.contract_id === params.id
  )

  useEffect(() => {
    if (params?.id) fetchContract()
  }, [params?.id])

  const fetchContract = async () => {
    try {
      setLoading(true)
      const response = await contractApi.getById(params.id as string)
      setContract(response.data.contract)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failedToLoad"))
      router.push("/dashboard/contracts")
    } finally {
      setLoading(false)
    }
  }

  const handleDismissAlert  = async (id: string) => { await dismissNotification(id);  toast.success("Alert dismissed") }
  const handleRestoreAlert  = async (id: string) => { await restoreNotification(id); toast.success("Alert restored") }
  const handleComplete = () => router.push(`/dashboard/contracts/${params.id}/complete`)
  const handleExtend   = () => router.push(`/dashboard/contracts/${params.id}/extend`)

  const handleCancel = async () => {
    if (!contract) return
    const reason = prompt(`${t("cancelContractTitle")} ${contract.contract_number}?\n\nEnter cancellation reason:`)
    if (!reason) return
    try {
      await contractApi.cancel(contract.id, reason)
      toast.success(t("cancelSuccess"))
      fetchContract()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("cancelFailed"))
    }
  }

  const handleDownloadPDF = async () => {
    if (!contract) return
    try {
      setGeneratingPDF(true)
      const printWindow = window.open('', '_blank')
      if (!printWindow) throw new Error(t("allowPopups"))
      printWindow.document.write(generateContractHTML(contract))
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => { printWindow.print(); printWindow.close() }, 250)
      toast.success(t("pdfOpened"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failedToLoad"))
    } finally {
      setGeneratingPDF(false)
    }
  }

  const generateContractHTML = (contract: Contract) => `
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Contract ${contract.contract_number}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
      .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
      .header h1 { margin: 0; font-size: 28px; }
      .section { margin: 20px 0; }
      .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #2563eb; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
      .info-item { padding: 8px; }
      .info-label { font-weight: bold; color: #666; }
      .info-value { color: #000; }
      .financial-summary { background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px; }
      .total-amount { font-size: 24px; font-weight: bold; color: #2563eb; text-align: right; margin-top: 10px; padding-top: 10px; border-top: 2px solid #333; }
      .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ccc; text-align: center; font-size: 12px; color: #666; }
      @media print { body { margin: 20px; } }
    </style></head><body>
    <div class="header"><h1>RENTAL CONTRACT</h1>
      <p style="font-size:20px;margin:10px 0;">${contract.contract_number}</p>
      <p style="margin:0;color:#666;">Status: ${contract.status.toUpperCase()}</p>
    </div>
    <div class="section"><div class="section-title">${t("customerInformation")}</div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">${t("name")}:</div><div class="info-value">${contract.customer?.full_name || 'N/A'}</div></div>
        <div class="info-item"><div class="info-label">${t("phone")}:</div><div class="info-value">${contract.customer?.phone || 'N/A'}</div></div>
        ${contract.customer?.email ? `<div class="info-item"><div class="info-label">${t("email")}:</div><div class="info-value">${contract.customer.email}</div></div>` : ''}
        <div class="info-item"><div class="info-label">${t("customerType")}:</div><div class="info-value">${contract.customer?.customer_type || 'N/A'}</div></div>
      </div></div>
    <div class="section"><div class="section-title">${t("vehicleInformation")}</div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">${t("vehicle")}:</div><div class="info-value">${contract.vehicle?.brand} ${contract.vehicle?.model} (${contract.vehicle?.year})</div></div>
        <div class="info-item"><div class="info-label">${t("registrationNumber")}:</div><div class="info-value">${contract.vehicle?.registration_number || 'N/A'}</div></div>
        <div class="info-item"><div class="info-label">${t("startMileage")}:</div><div class="info-value">${contract.start_mileage?.toLocaleString() || 'N/A'} km</div></div>
        ${contract.end_mileage ? `<div class="info-item"><div class="info-label">${t("endMileage")}:</div><div class="info-value">${contract.end_mileage.toLocaleString()} km</div></div>` : ''}
      </div></div>
    <div class="section"><div class="section-title">${t("rentalPeriod")}</div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">${t("startDate")}:</div><div class="info-value">${new Date(contract.start_date).toLocaleDateString()}</div></div>
        <div class="info-item"><div class="info-label">${t("endDate")}:</div><div class="info-value">${new Date(contract.end_date).toLocaleDateString()}</div></div>
        <div class="info-item"><div class="info-label">${t("totalDays")}:</div><div class="info-value">${contract.total_days}</div></div>
        ${contract.actual_return_date ? `<div class="info-item"><div class="info-label">${t("actualReturn")}:</div><div class="info-value">${new Date(contract.actual_return_date).toLocaleDateString()}</div></div>` : ''}
      </div></div>
    ${contract.extras && Object.values(contract.extras).some(v => v) ? `
    <div class="section"><div class="section-title">${t("additionalServices")}</div><ul>
      ${contract.extras.gps ? `<li>${t("gpsNavigation")}</li>` : ''}
      ${contract.extras.child_seat ? `<li>${t("childSeat")}</li>` : ''}
      ${contract.extras.additional_driver ? `<li>${t("additionalDriver")}</li>` : ''}
      ${contract.extras.insurance_premium ? `<li>${t("premiumInsurance")}</li>` : ''}
    </ul></div>` : ''}
    <div class="financial-summary"><div class="section-title">${t("financialSummary")}</div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">${t("dailyRate")}:</div><div class="info-value">${parseFloat(contract.daily_rate).toLocaleString()} DZD</div></div>
        <div class="info-item"><div class="info-label">${t("baseAmount")}:</div><div class="info-value">${parseFloat(contract.base_amount).toLocaleString()} DZD</div></div>
        ${parseFloat(contract.additional_charges) > 0 ? `<div class="info-item"><div class="info-label">${t("additionalCharges")}:</div><div class="info-value">${parseFloat(contract.additional_charges).toLocaleString()} DZD</div></div>` : ''}
        ${parseFloat(contract.discount_amount) > 0 ? `<div class="info-item"><div class="info-label">${t("discount")}:</div><div class="info-value" style="color:green;">-${parseFloat(contract.discount_amount).toLocaleString()} DZD</div></div>` : ''}
        <div class="info-item"><div class="info-label">${t("tax")}:</div><div class="info-value">${parseFloat(contract.tax_amount).toLocaleString()} DZD</div></div>
        <div class="info-item"><div class="info-label">${t("deposit")}:</div><div class="info-value">${parseFloat(contract.deposit_amount).toLocaleString()} DZD</div></div>
      </div>
      <div class="total-amount">${t("totalAmount")}: ${parseFloat(contract.total_amount).toLocaleString()} DZD</div>
    </div>
    ${contract.notes ? `<div class="section"><div class="section-title">${t("notes")}</div><p>${contract.notes.replace(/\n/g, '<br>')}</p></div>` : ''}
    <div class="footer">
      <p>${t("generatedOn")} ${new Date().toLocaleString()}</p>
      <p>${t("contractNumber")}: ${contract.contract_number}</p>
      ${contract.creator ? `<p>${t("createdBy")}: ${contract.creator.full_name}</p>` : ''}
    </div></body></html>
  `

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${BORDER}`, borderTopColor: GREEN, animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!contract) return null

  return (
    <div style={{ fontFamily: FONT, color: "#fff", minHeight: "100vh", padding: "32px 0" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => router.back()}
            style={{
              width: 36, height: 36, borderRadius: 10, border: `1px solid ${BORDER}`,
              background: SURFACE, color: MUTED, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)"; e.currentTarget.style.color = "#fff" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", fontWeight: 800, letterSpacing: "-0.035em", fontFamily: "monospace", marginBottom: 4 }}>
              {contract.contract_number}
            </h1>
            <p style={{ fontSize: 13, color: MUTED }}>{t("contractDetails")}</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {contract.status === "active" && (
            <>
              <ActionBtn onClick={handleComplete} color={GREEN}>
                <CheckCircle size={14} /> {t("complete")}
              </ActionBtn>
              <ActionBtn onClick={handleExtend} color="outline">
                <Calendar size={14} /> {t("extend")}
              </ActionBtn>
              <ActionBtn onClick={handleCancel} color="destructive">
                <XCircle size={14} /> {t("cancelContract")}
              </ActionBtn>
            </>
          )}
          <ActionBtn onClick={handleDownloadPDF} color="outline" disabled={generatingPDF}>
            {generatingPDF ? (
              <><div style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite" }} /> Generating...</>
            ) : (
              <><Download size={14} /> {t("viewPDF")}</>
            )}
          </ActionBtn>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, marginBottom: 28, display: "flex", gap: 4 }}>
        {([
          { key: "details", label: t("contractInformation") },
          { key: "alerts",  label: `${t("alerts")} (${kmAlerts.length})` },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
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

      {/* ════════════════════════ DETAILS TAB */}
      {activeTab === "details" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>

          {/* ── Left column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Status & Basic Info */}
            <SectionCard title={t("contractInformation")} headerRight={<StatusBadge status={contract.status} />}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <InfoCell label={t("contractNumber")} value={contract.contract_number} mono />
                <InfoCell label="Created Date" value={formatDate(contract.created_at)} />
                <InfoCell label={t("startDate")} value={formatDate(contract.start_date)} />
                <InfoCell label={t("endDate")} value={formatDate(contract.end_date)} />
                {contract.actual_return_date && (
                  <InfoCell label={t("actualReturn")} value={formatDate(contract.actual_return_date)} />
                )}
                <InfoCell label={t("totalDays")} value={String(contract.total_days)} />
              </div>
            </SectionCard>

            {/* Customer */}
            <SectionCard title={t("customerInformation")}>
              {contract.customer ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <InfoCell label={t("name")} value={contract.customer.full_name} />
                  <InfoCell label={t("phone")} value={contract.customer.phone} />
                  {contract.customer.email && <InfoCell label={t("email")} value={contract.customer.email} />}
                  <InfoCell label={t("customerType")}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", textTransform: "capitalize" }}>
                      {contract.customer.customer_type}
                    </p>
                  </InfoCell>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: MUTED }}>No customer information</p>
              )}
            </SectionCard>

            {/* Vehicle */}
            <SectionCard title={t("vehicleInformation")}>
              {contract.vehicle ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <InfoCell label={t("vehicle")} value={`${contract.vehicle.brand} ${contract.vehicle.model} (${contract.vehicle.year})`} />
                  <InfoCell label={t("registrationNumber")} value={contract.vehicle.registration_number} mono />
                  <InfoCell label={t("startMileage")} value={`${contract.start_mileage?.toLocaleString() || "—"} km`} />
                  {contract.end_mileage && <InfoCell label={t("endMileage")} value={`${contract.end_mileage.toLocaleString()} km`} />}
                  {contract.mileage_limit && <InfoCell label="Mileage Limit" value={`${contract.mileage_limit.toLocaleString()} km`} />}

                  {contract.total_km_allowed && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <p style={{ fontSize: 11, color: MUTED, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>KM Usage</p>
                      {contract.end_mileage ? (
                        <KmUsageProgress
                          kmDriven={contract.actual_km_driven || (contract.end_mileage - (contract.start_mileage || 0))}
                          kmAllowed={contract.total_km_allowed}
                          dailyLimit={contract.daily_km_limit}
                          tierBonus={contract.total_km_allowed - ((contract.daily_km_limit || 0) * contract.total_days)}
                        />
                      ) : (
                        <p style={{ fontSize: 13, color: MUTED }}>
                          Allowed: {contract.total_km_allowed.toLocaleString()} km
                          {contract.daily_km_limit && ` (${contract.daily_km_limit} km/day)`}
                        </p>
                      )}
                    </div>
                  )}

                  {(contract.km_overage ?? 0) > 0 && (
                    <div style={{
                      gridColumn: "1 / -1", padding: "12px 14px", borderRadius: 10,
                      background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
                    }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#F87171", marginBottom: 4 }}>
                        KM Overage: {(contract.km_overage ?? 0).toLocaleString()} km
                      </p>
                      <p style={{ fontSize: 12, color: "rgba(239,68,68,0.7)" }}>
                        Charge: {parseFloat(contract.overage_charges ?? '0').toLocaleString()} DZD
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: MUTED }}>No vehicle information</p>
              )}
            </SectionCard>

            {/* Extras */}
            {contract.extras && Object.keys(contract.extras).length > 0 && (
              <SectionCard title={t("extras")}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { key: "gps",               label: t("gpsNavigation") },
                    { key: "child_seat",         label: t("childSeat") },
                    { key: "additional_driver",  label: t("additionalDriver") },
                    { key: "insurance_premium",  label: t("premiumInsurance") },
                  ].filter(e => (contract.extras as any)[e.key]).map((e, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 13px", borderRadius: 9,
                      background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)",
                    }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: GREEN, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "#fff" }}>{e.label}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Payment History */}
            {contract.payments && contract.payments.length > 0 && (
              <SectionCard title="Payment History">
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {contract.payments.map(payment => (
                    <div key={payment.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 14px", borderRadius: 10,
                      background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}`,
                    }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 3 }}>
                          {parseFloat(payment.amount).toLocaleString()} DZD
                        </p>
                        <p style={{ fontSize: 11, color: MUTED }}>
                          {payment.payment_method} · {formatDate(payment.payment_date)}
                        </p>
                      </div>
                      <StatusBadge status={payment.status} />
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Notes */}
            {contract.notes && (
              <SectionCard title={t("notes")}>
                <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {contract.notes}
                </p>
              </SectionCard>
            )}
          </div>

          {/* ── Right — Financial Summary ── */}
          <div style={{ position: "sticky", top: 24 }}>
            <div style={{ padding: "24px 22px", borderRadius: 14, background: SURFACE, border: `1px solid ${BORDER}` }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.015em", marginBottom: 20 }}>{t("financialSummary")}</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <SummaryRow label={`${t("dailyRate")}:`}    value={`${parseFloat(contract.daily_rate).toLocaleString()} DZD`} />
                <SummaryRow label={`${t("baseAmount")}:`}   value={`${parseFloat(contract.base_amount).toLocaleString()} DZD`} />
                {parseFloat(contract.additional_charges) > 0 && (
                  <SummaryRow label={`${t("additionalCharges")}:`} value={`${parseFloat(contract.additional_charges).toLocaleString()} DZD`} />
                )}
                {parseFloat(contract.discount_amount) > 0 && (
                  <SummaryRow label={`${t("discount")}:`} value={`-${parseFloat(contract.discount_amount).toLocaleString()} DZD`} accent="#4ADE80" />
                )}
                <SummaryRow label={`${t("tax")}:`} value={`${parseFloat(contract.tax_amount).toLocaleString()} DZD`} border />
                <SummaryRow label={`${t("totalAmount")}:`}  value={`${parseFloat(contract.total_amount).toLocaleString()} DZD`} accent={GREEN} large border />
                <SummaryRow label={`${t("deposit")}:`}      value={`${parseFloat(contract.deposit_amount).toLocaleString()} DZD`} border />
                <SummaryRow
                  label="Deposit Status:"
                  value={contract.deposit_returned ? "Returned" : "Held"}
                  accent={contract.deposit_returned ? "#4ADE80" : "#FB923C"}
                />
              </div>

              {contract.creator && (
                <div style={{
                  marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BORDER}`,
                  fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.7,
                }}>
                  <p>{t("createdBy")}: {contract.creator.full_name}</p>
                  <p>{formatDate(contract.created_at)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════ ALERTS TAB */}
      {activeTab === "alerts" && (
        <div style={{ maxWidth: 760 }}>
          <div style={{ padding: "24px 26px", borderRadius: 14, background: SURFACE, border: `1px solid ${BORDER}` }}>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <AlertCircle size={16} style={{ color: "#EF4444" }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                {t("alerts")} ({kmAlerts.length})
              </h3>
            </div>

            {alertsLoading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "40px 0", gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${BORDER}`, borderTopColor: GREEN, animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontSize: 13, color: MUTED }}>Loading alerts...</span>
              </div>
            ) : kmAlerts.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 480, overflowY: "auto" }}>
                {kmAlerts.map(notif => (
                  <div key={notif.id} style={{
                    padding: "14px 16px", borderRadius: 10,
                    background: "rgba(239,68,68,0.06)",
                    borderLeft: "3px solid #EF4444",
                    border: "1px solid rgba(239,68,68,0.18)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#F87171", marginBottom: 4 }}>
                          {notif.title}
                        </p>
                        <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, marginBottom: 4 }}>
                          {notif.message}
                        </p>
                        {renderNotificationDetails(notif.data)}
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 8 }}>
                          {new Date(notif.created_at).toLocaleString('fr-DZ', {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                        {notif.dismissed && (
                          <button onClick={() => handleRestoreAlert(notif.id)}
                            style={{
                              fontFamily: FONT, fontSize: 11, fontWeight: 600,
                              padding: "5px 10px", borderRadius: 6, border: "none",
                              background: GREEN, color: "#fff", cursor: "pointer", transition: "background 0.15s",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#16A34A")}
                            onMouseLeave={e => (e.currentTarget.style.background = GREEN)}
                          >
                            Restore
                          </button>
                        )}
                        <button onClick={() => handleDismissAlert(notif.id)}
                          style={{
                            width: 28, height: 28, borderRadius: 7, border: "none",
                            background: "transparent", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#F87171", transition: "background 0.15s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.15)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <AlertCircle size={44} style={{ color: "rgba(255,255,255,0.12)", marginBottom: 14, display: "block", margin: "0 auto 14px" }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: MUTED, marginBottom: 6 }}>No alerts for this contract</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>All good — no issues detected.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}