// app/[locale]/dashboard/contracts/[id]/complete/page.tsx (FULLY LOCALIZED)
"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
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

/* ─── design tokens ─────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"
const MUTED   = "rgba(255,255,255,0.4)"

/* ─── shared helpers ─────────────────────────────────────────── */
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

function InfoRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: MUTED, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      {value && <p style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{value}</p>}
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
      <span style={{ fontSize: large ? 14 : 12, color: MUTED }}>{label}</span>
      <span style={{ fontSize: large ? 16 : 13, fontWeight: large ? 800 : 600, color: accent || "#fff" }}>{value}</span>
    </div>
  )
}

export default function CompleteContractPage() {
  const t = useTranslations("contracts")
  const router = useRouter()
  const params = useParams()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [overageEstimate, setOverageEstimate] = useState<OverageEstimate | null>(null)

  const [formData, setFormData] = useState({
    actual_return_date: "", end_mileage: "", additional_charges: 0, notes: "",
  })

  useEffect(() => { if (params.id) fetchContract() }, [params.id])

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
      const today = new Date().toISOString().split('T')[0]
      setFormData(prev => ({ ...prev, actual_return_date: today }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failedToLoad"))
      router.push("/dashboard/contracts")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contract || !formData.actual_return_date || !formData.end_mileage) { toast.error(t("fillRequiredFields")); return }
    const endMileageNum = parseInt(formData.end_mileage)
    if (contract.start_mileage && endMileageNum < contract.start_mileage) {
      toast.error(`${t("returnMileage")} cannot be less than start mileage (${contract.start_mileage} km)`)
      return
    }
    try {
      setSubmitting(true)
      await contractApi.complete(contract.id, {
        actual_return_date: formData.actual_return_date,
        end_mileage: endMileageNum,
        additional_charges: formData.additional_charges,
        notes: formData.notes,
      })
      toast.success(t("completeSuccess"))
      router.push(`/dashboard/contracts/${contract.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("completeFailed"))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${BORDER}`, borderTopColor: GREEN, animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!contract) return null

  const totalKmAllowed = contract.total_km_allowed ||
    (contract.daily_km_limit && contract.total_days ? contract.daily_km_limit * contract.total_days : 0)

  const totalFinal = parseFloat(contract.total_amount)
    + formData.additional_charges
    + (overageEstimate?.estimated_overage.final_overage_charges || 0)

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
            {t("completeContract")}
          </h1>
          <p style={{ fontSize: 13, color: MUTED, fontFamily: "monospace" }}>{contract.contract_number}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

        {/* ── Left ── */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Contract Info */}
          <SectionCard title={t("contractInformation")}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <InfoRow label={t("customer")}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: contract.customer?.total_rentals !== undefined ? 6 : 0 }}>
                  {contract.customer?.full_name}
                </p>
                {contract.customer?.total_rentals !== undefined && (
                  <CustomerTierBadge
                    tier={
                      contract.customer.total_rentals >= 20 ? 'PLATINUM' :
                      contract.customer.total_rentals >= 10 ? 'GOLD' :
                      contract.customer.total_rentals >= 5 ? 'SILVER' :
                      contract.customer.total_rentals >= 1 ? 'BRONZE' : 'NEW'
                    }
                    size="sm"
                  />
                )}
              </InfoRow>
              <InfoRow label={t("vehicle")} value={`${contract.vehicle?.brand} ${contract.vehicle?.model}`} />
              <InfoRow label={t("startDate")} value={format(new Date(contract.start_date), "PPP")} />
              <InfoRow label={t("endDate")} value={format(new Date(contract.end_date), "PPP")} />
              <InfoRow label={t("startMileage")} value={`${contract.start_mileage?.toLocaleString() || "N/A"} km`} />
              <InfoRow label={t("totalDays")} value={String(contract.total_days)} />
            </div>
          </SectionCard>

          {/* Completion Details */}
          <SectionCard title={t("completionDetails")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <FieldLabel>{t("actualReturn")} *</FieldLabel>
                <StyledInput type="date" value={formData.actual_return_date} required
                  onChange={e => setFormData({ ...formData, actual_return_date: e.target.value })} />
              </div>

              <div>
                <FieldLabel>{t("returnMileage")} (km) *</FieldLabel>
                <StyledInput
                  type="number" min={contract.start_mileage || 0}
                  placeholder="Enter actual odometer reading"
                  value={formData.end_mileage} required
                  onChange={e => setFormData({ ...formData, end_mileage: e.target.value })}
                />
                <p style={{ fontSize: 11, color: MUTED, marginTop: 5 }}>
                  {t("startMileage")}: {contract.start_mileage?.toLocaleString() || "N/A"} km
                </p>
              </div>

              {/* Overage Calculator — keeps original component, only wrapper styled */}
              <div style={{
                padding: "16px", borderRadius: 10,
                background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}`,
              }}>
                <OverageCalculator
                  contractId={contract.id}
                  startMileage={contract.start_mileage || 0}
                  totalKmAllowed={totalKmAllowed}
                  currentEndMileage={formData.end_mileage ? parseInt(formData.end_mileage) : undefined}
                  onEstimateChange={estimate => setOverageEstimate(estimate)}
                />
              </div>

              <div>
                <FieldLabel>{t("additionalCharges")} (DZD)</FieldLabel>
                <StyledInput
                  type="number" min="0" step="0.01"
                  placeholder="Late fees, damages, cleaning, etc."
                  value={formData.additional_charges}
                  onChange={e => setFormData({ ...formData, additional_charges: parseFloat(e.target.value) || 0 })}
                />
                <p style={{ fontSize: 11, color: MUTED, marginTop: 5 }}>
                  {t("overageCharges")} are calculated automatically above
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Notes */}
          <SectionCard title={t("notes")}>
            <textarea
              placeholder="Add notes about vehicle condition, damages, customer feedback, or any final comments..."
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
            disabled={submitting || !formData.actual_return_date || !formData.end_mileage}
            style={{
              width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
              cursor: (submitting || !formData.actual_return_date || !formData.end_mileage) ? "not-allowed" : "pointer",
              background: (submitting || !formData.actual_return_date || !formData.end_mileage) ? "rgba(34,197,94,0.35)" : GREEN,
              color: "#fff", fontFamily: FONT, fontWeight: 600, fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s", boxShadow: "0 0 20px rgba(34,197,94,0.2)",
            }}
            onMouseEnter={e => { if (!submitting && formData.actual_return_date && formData.end_mileage) e.currentTarget.style.background = "#16A34A" }}
            onMouseLeave={e => { if (!submitting && formData.actual_return_date && formData.end_mileage) e.currentTarget.style.background = GREEN }}
          >
            {submitting ? (
              <>
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite" }} />
                {t("saving")}
              </>
            ) : (
              <><CheckCircle size={15} />{t("completeContract")}</>
            )}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </form>

        {/* ── Right — Summary ── */}
        <div style={{ position: "sticky", top: 24 }}>
          <div style={{ padding: "24px 22px", borderRadius: 14, background: SURFACE, border: `1px solid ${BORDER}` }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.015em", marginBottom: 20 }}>{t("financialSummary")}</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SummaryRow label={`${t("totalAmount")}:`} value={`${parseFloat(contract.total_amount).toLocaleString()} DZD`} />

              {formData.additional_charges > 0 && (
                <SummaryRow label={`${t("additionalCharges")}:`} value={`+${formData.additional_charges.toLocaleString()} DZD`} accent="#FB923C" />
              )}
            </div>

            {overageEstimate?.estimated_overage?.km_overage && overageEstimate.estimated_overage.km_overage > 0 && (
              <div style={{
                marginTop: 14, padding: "14px 16px", borderRadius: 10,
                background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
              }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#F87171", marginBottom: 6 }}>
                  {t("additionalKm")} {overageEstimate.estimated_overage.km_overage?.toLocaleString()} km
                </p>
                <p style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>
                  {t("overageCharges")}: {overageEstimate.estimated_overage.final_overage_charges?.toLocaleString()} DZD
                </p>
                {overageEstimate.estimated_overage.discount_amount > 0 && (
                  <p style={{ fontSize: 11, color: GREEN }}>
                    (Saved {overageEstimate.estimated_overage.discount_amount?.toLocaleString()} DZD with {overageEstimate.estimated_overage.tier_name} discount)
                  </p>
                )}
              </div>
            )}

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
              <SummaryRow
                label={`${t("newTotalAmount")}:`}
                value={`${totalFinal.toLocaleString()} DZD`}
                accent={GREEN} large
              />
            </div>

            {/* visual divider */}
            <div style={{ marginTop: 20, padding: "14px 0", borderTop: `1px solid ${BORDER}`, textAlign: "center" }}>
              <p style={{ fontSize: 11, color: MUTED }}>
                Completing this contract will mark the vehicle as available and update all financials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}