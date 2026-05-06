// app/[locale]/dashboard/contracts/[id]/extend/page.tsx (FULLY LOCALIZED)
"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Calendar, AlertCircle, Calculator } from "lucide-react"
import { contractApi, Contract } from "@/lib/contractApi"
import toast from "react-hot-toast"

/* ─── design tokens ─────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"
const MUTED   = "rgba(255,255,255,0.4)"

/* ─── shared ui helpers ──────────────────────────────────────── */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "24px 26px", borderRadius: 14, background: SURFACE, border: `1px solid ${BORDER}` }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.015em", marginBottom: 18, color: "#fff" }}>{title}</h2>
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
      {children}
    </label>
  )
}

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e) }}
      onBlur={e => { setFocused(false); props.onBlur?.(e) }}
      style={{
        width: "100%", padding: "10px 13px", borderRadius: 9,
        border: `1px solid ${focused ? "rgba(34,197,94,0.5)" : BORDER}`,
        background: "rgba(255,255,255,0.03)", color: "#fff",
        fontFamily: FONT, fontSize: 14, outline: "none",
        transition: "border-color 0.2s",
        boxShadow: focused ? "0 0 0 3px rgba(34,197,94,0.08)" : "none",
        ...props.style,
      }}
    />
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: MUTED, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{value}</p>
    </div>
  )
}

function SummaryRow({ label, value, accent, large, border }: { label: string; value: string; accent?: string; large?: boolean; border?: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      paddingTop: border ? 10 : 0, borderTop: border ? `1px solid ${BORDER}` : "none", marginTop: border ? 8 : 0,
    }}>
      <span style={{ fontSize: large ? 14 : 12, color: MUTED }}>{label}</span>
      <span style={{ fontSize: large ? 16 : 13, fontWeight: large ? 800 : 600, color: accent || "#fff" }}>{value}</span>
    </div>
  )
}

export default function ExtendContractPage() {
  const t = useTranslations("contracts")
  const router = useRouter()
  const params = useParams()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({ new_end_date: "", notes: "" })

  const [calculations, setCalculations] = useState({
    current_days: 0, extension_days: 0, new_total_days: 0, extension_cost: 0,
    new_base_amount: 0, new_tax_amount: 0, new_total_amount: 0, additional_payment: 0,
  })

  useEffect(() => { if (params?.id) fetchContract() }, [params?.id])

  useEffect(() => { if (contract && formData.new_end_date) calculateExtension() }, [formData.new_end_date, contract])

  const fetchContract = async () => {
    try {
      setLoading(true)
      const response = await contractApi.getById(params.id as string)
      const fetchedContract = response.data.contract
      if (fetchedContract.status !== "active") {
        toast.error(t("noActiveContracts"))
        router.push(`/dashboard/contracts/${params.id}`)
        return
      }
      setContract(fetchedContract)
      const currentEndDate = new Date(fetchedContract.end_date)
      currentEndDate.setDate(currentEndDate.getDate() + 1)
      setFormData(prev => ({ ...prev, new_end_date: currentEndDate.toISOString().split('T')[0] }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failedToLoad"))
      router.push("/dashboard/contracts")
    } finally {
      setLoading(false)
    }
  }

  const calculateExtension = () => {
    if (!contract) return
    const currentEndDate = new Date(contract.end_date)
    const newEndDate = new Date(formData.new_end_date)
    const extensionDays = Math.ceil((newEndDate.getTime() - currentEndDate.getTime()) / (1000 * 60 * 60 * 24))
    if (extensionDays <= 0) return
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
    setCalculations({ current_days: contract.total_days, extension_days: extensionDays, new_total_days: newTotalDays, extension_cost: extensionCost, new_base_amount: newBaseAmount, new_tax_amount: newTaxAmount, new_total_amount: newTotalAmount, additional_payment: additionalPayment })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contract) return
    if (new Date(formData.new_end_date) <= new Date(contract.end_date)) {
      toast.error(`${t("newEndDate")} ${t("mustBeAfter")} ${t("endDate")}`)
      return
    }
    try {
      setSubmitting(true)
      await contractApi.extend(contract.id, { new_end_date: formData.new_end_date, notes: formData.notes })
      toast.success(t("extendSuccess"))
      router.push(`/dashboard/contracts/${contract.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("extendFailed"))
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${BORDER}`, borderTopColor: GREEN, animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!contract) return null

  const minDate = new Date(contract.end_date)
  minDate.setDate(minDate.getDate() + 1)
  const minDateString = minDate.toISOString().split('T')[0]

  return (
    <div style={{ fontFamily: FONT, color: "#fff", minHeight: "100vh", padding: "32px 0" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
        <button onClick={() => router.back()}
          style={{
            width: 36, height: 36, borderRadius: 10, border: `1px solid ${BORDER}`,
            background: SURFACE, color: MUTED, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)"; e.currentTarget.style.color = "#fff" }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, letterSpacing: "-0.035em", marginBottom: 4 }}>
            {t("extendContract")}
          </h1>
          <p style={{ fontSize: 13, color: MUTED, fontFamily: "monospace" }}>{contract.contract_number}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

        {/* ── Left ── */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Current Contract Info */}
          <SectionCard title={t("contractInformation")}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <InfoRow label={t("customer")} value={contract.customer?.full_name || "—"} />
              <InfoRow label={t("vehicle")} value={`${contract.vehicle?.brand} ${contract.vehicle?.model}`} />
              <InfoRow label={t("startDate")} value={formatDate(contract.start_date)} />
              <InfoRow label={t("endDate")} value={formatDate(contract.end_date)} />
              <InfoRow label={t("totalDays")} value={`${contract.total_days} days`} />
              <InfoRow label={t("dailyRate")} value={`${parseFloat(contract.daily_rate).toLocaleString()} DZD`} />
            </div>
          </SectionCard>

          {/* Extension Details */}
          <SectionCard title={t("extensionDetails")}>
            <div>
              <FieldLabel>{t("newEndDate")} *</FieldLabel>
              <StyledInput type="date" min={minDateString} value={formData.new_end_date} required
                onChange={e => setFormData({ ...formData, new_end_date: e.target.value })} />
              <p style={{ fontSize: 11, color: MUTED, marginTop: 6 }}>
                {t("mustBeAfter")} {formatDate(contract.end_date)}
              </p>
            </div>

            {calculations.extension_days > 0 && (
              <div style={{
                marginTop: 16, padding: "16px", borderRadius: 10,
                background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.18)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Calculator size={14} style={{ color: "#38BDF8" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#38BDF8" }}>{t("extensionDetails")}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { label: `${t("extensionDays")}:`, value: `${calculations.extension_days} days` },
                    { label: `${t("extensionCost")}:`, value: `${calculations.extension_cost.toLocaleString()} DZD` },
                    { label: `${t("newTotalDays")}:`, value: `${calculations.new_total_days} days` },
                    { label: `${t("additionalPayment")}:`, value: `${calculations.additional_payment.toLocaleString()} DZD` },
                  ].map((row, i) => (
                    <div key={i}>
                      <p style={{ fontSize: 11, color: "rgba(56,189,248,0.7)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{row.label}</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          {/* Warning */}
          <div style={{
            padding: "14px 16px", borderRadius: 10,
            background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)",
            display: "flex", alignItems: "flex-start", gap: 10,
          }}>
            <AlertCircle size={15} style={{ color: "#FBB324", marginTop: 1, flexShrink: 0 }} />
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
              <p style={{ fontWeight: 600, color: "#FBB324", marginBottom: 3 }}>{t("extensionDetails")}</p>
              <p style={{ color: "rgba(251,191,36,0.7)" }}>{t("availabilityCheck")}</p>
            </div>
          </div>

          {/* Notes */}
          <SectionCard title={t("notes")}>
            <textarea
              placeholder="Add notes about extension reason, any special terms, or additional comments..."
              rows={4} value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              style={{
                width: "100%", padding: "11px 13px", borderRadius: 9,
                border: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.03)",
                color: "#fff", fontFamily: FONT, fontSize: 13, resize: "vertical",
                outline: "none", transition: "border-color 0.2s", lineHeight: 1.6,
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(34,197,94,0.4)")}
              onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
            />
          </SectionCard>

          <button type="submit"
            disabled={submitting || calculations.extension_days <= 0}
            style={{
              width: "100%", padding: "13px 0", borderRadius: 10,
              border: "none", cursor: (submitting || calculations.extension_days <= 0) ? "not-allowed" : "pointer",
              background: (submitting || calculations.extension_days <= 0) ? "rgba(56,189,248,0.3)" : "#0EA5E9",
              color: "#fff", fontFamily: FONT, fontWeight: 600, fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s", boxShadow: "0 0 20px rgba(14,165,233,0.2)",
            }}
            onMouseEnter={e => { if (!submitting && calculations.extension_days > 0) e.currentTarget.style.background = "#0284C7" }}
            onMouseLeave={e => { if (!submitting && calculations.extension_days > 0) e.currentTarget.style.background = "#0EA5E9" }}
          >
            {submitting ? (
              <>
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite" }} />
                {t("saving")}
              </>
            ) : (
              <><Calendar size={15} />{t("extendContract")}</>
            )}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </form>

        {/* ── Right — Summary ── */}
        <div style={{ position: "sticky", top: 24 }}>
          <div style={{ padding: "24px 22px", borderRadius: 14, background: SURFACE, border: `1px solid ${BORDER}` }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.015em", marginBottom: 20 }}>{t("financialSummary")}</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 16, borderBottom: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{t("contractInformation")}</p>
              <SummaryRow label={`${t("totalAmount")}:`} value={`${parseFloat(contract.total_amount).toLocaleString()} DZD`} />
            </div>

            {calculations.extension_days > 0 && (
              <div style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{t("extensionDetails")}</p>
                <SummaryRow label={`${t("dailyRate")}:`} value={`${parseFloat(contract.daily_rate).toLocaleString()} DZD`} />
                <SummaryRow label={`${t("extensionDays")}:`} value={String(calculations.extension_days)} />
                <SummaryRow label={`${t("extensionCost")}:`} value={`${calculations.extension_cost.toLocaleString()} DZD`} />
                <SummaryRow label={`${t("newTotalDays")}:`} value={`${calculations.new_total_days} days`} />

                <div style={{ marginTop: 8, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
                  <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{t("newTotalAmount")}:</p>
                  <SummaryRow label={`${t("baseAmount")}:`} value={`${calculations.new_base_amount.toLocaleString()} DZD`} />
                  <div style={{ marginTop: 8 }}>
                    <SummaryRow label={`${t("tax")}:`} value={`${calculations.new_tax_amount.toLocaleString()} DZD`} />
                  </div>
                  <SummaryRow label={`${t("newTotalAmount")}:`} value={`${calculations.new_total_amount.toLocaleString()} DZD`} accent={GREEN} large border />
                </div>
              </div>
            )}

            {calculations.additional_payment > 0 && (
              <div style={{
                marginTop: 16, padding: "14px 16px", borderRadius: 10,
                background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.22)",
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: GREEN, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {t("additionalPayment")} {t("required")}
                </p>
                <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.04em", color: "#fff" }}>
                  {calculations.additional_payment.toLocaleString()} DZD
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}