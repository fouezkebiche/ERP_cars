// app/[locale]/dashboard/contracts/new/page.tsx (FULLY LOCALIZED)
"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, Calculator, Info } from "lucide-react"
import { contractApi } from "@/lib/contractApi"
import { customerTierApi } from "@/lib/customerTierApi"
import { CustomerTierBadge } from "@/components/dashboard/CustomerTierBadge"
import toast from "react-hot-toast"

/* ─── design tokens ─────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"
const MUTED   = "rgba(255,255,255,0.4)"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Customer {
  id: string; full_name: string; email?: string; phone: string
  is_blacklisted: boolean; total_rentals?: number
}
interface Vehicle {
  id: string; brand: string; model: string; year: number
  registration_number: string; daily_rate: number; mileage: number; status: string
}

/* ─── small ui helpers ──────────────────────────────────────── */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      padding: "24px 26px", borderRadius: 14,
      background: SURFACE, border: `1px solid ${BORDER}`,
    }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.015em", marginBottom: 18, color: "#fff" }}>
        {title}
      </h2>
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

function StyledSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <select
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e) }}
      onBlur={e => { setFocused(false); props.onBlur?.(e) }}
      style={{
        width: "100%", padding: "10px 13px", borderRadius: 9,
        border: `1px solid ${focused ? "rgba(34,197,94,0.5)" : BORDER}`,
        background: "#0F1318", color: "#fff",
        fontFamily: FONT, fontSize: 14, outline: "none",
        transition: "border-color 0.2s",
        boxShadow: focused ? "0 0 0 3px rgba(34,197,94,0.08)" : "none",
        cursor: "pointer",
      }}
    />
  )
}

function CheckRow({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 14px", borderRadius: 9,
      background: checked ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${checked ? "rgba(34,197,94,0.3)" : BORDER}`,
      cursor: "pointer", transition: "all 0.2s",
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
        background: checked ? GREEN : "transparent",
        border: `2px solid ${checked ? GREEN : BORDER}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
      }}>
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ display: "none" }} />
      <span style={{ fontSize: 13, color: checked ? "#fff" : MUTED, transition: "color 0.15s" }}>{children}</span>
    </label>
  )
}

function SummaryRow({ label, value, accent, large, border }: { label: string; value: string; accent?: string; large?: boolean; border?: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      paddingTop: border ? 10 : 0, borderTop: border ? `1px solid ${BORDER}` : "none",
      marginTop: border ? 8 : 0,
    }}>
      <span style={{ fontSize: large ? 14 : 12, color: large ? MUTED : MUTED }}>{label}</span>
      <span style={{ fontSize: large ? 16 : 13, fontWeight: large ? 800 : 600, color: accent || "#fff" }}>{value}</span>
    </div>
  )
}

export default function NewContractPage() {
  const t = useTranslations("contracts")
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [customerTier, setCustomerTier] = useState<any>(null)
  const [loadingTier, setLoadingTier] = useState(false)

  const [formData, setFormData] = useState({
    customer_id: "", vehicle_id: "", start_date: "", end_date: "",
    daily_rate: 0, daily_km_limit: 300, deposit_amount: 0,
    additional_charges: 0, discount_amount: 0, notes: "",
    gps: false, child_seat: false, additional_driver: false, insurance_premium: false,
  })

  const [calculations, setCalculations] = useState({
    total_days: 0, base_amount: 0, extras_cost: 0, subtotal: 0,
    tax_amount: 0, total_amount: 0,
    total_km_allowed: 0, tier_km_bonus: 0, effective_daily_limit: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        const [customersRes, vehiclesRes, profileRes] = await Promise.all([
          fetch(`${API_URL}/api/customers`, { headers }),
          fetch(`${API_URL}/api/vehicles?status=available`, { headers }),
          fetch(`${API_URL}/api/company/profile`, { headers }),
        ])
        const customersData = await customersRes.json()
        const vehiclesData = await vehiclesRes.json()
        const profileData = await profileRes.json()
        setCustomers(customersData.data.customers.filter((c: Customer) => !c.is_blacklisted))
        setVehicles(vehiclesData.data.vehicles)
        const defaultDailyKmLimit = profileData?.data?.company?.settings?.defaultDailyKmLimit
        const dailyLimit = (typeof defaultDailyKmLimit === 'number' && defaultDailyKmLimit >= 50 && defaultDailyKmLimit <= 1000) ? defaultDailyKmLimit : 300
        setFormData(prev => ({ ...prev, daily_km_limit: dailyLimit }))
      } catch (error) {
        toast.error(t("failedToLoad"))
        console.error(error)
      } finally {
        setLoadingData(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const fetchCustomerTier = async () => {
      if (!formData.customer_id) { setCustomerTier(null); return }
      try {
        setLoadingTier(true)
        const response = await customerTierApi.getTierInfo(formData.customer_id)
        setCustomerTier(response.data)
      } catch (error) { console.error('Failed to fetch tier:', error); setCustomerTier(null) }
      finally { setLoadingTier(false) }
    }
    fetchCustomerTier()
  }, [formData.customer_id])

  useEffect(() => {
    if (formData.vehicle_id) {
      const sel = vehicles.find(v => v.id === formData.vehicle_id)
      if (sel) setFormData(prev => ({ ...prev, daily_rate: sel.daily_rate }))
    }
  }, [formData.vehicle_id, vehicles])

  useEffect(() => { calculateTotals() }, [
    formData.start_date, formData.end_date, formData.daily_rate, formData.daily_km_limit,
    formData.additional_charges, formData.discount_amount,
    formData.gps, formData.child_seat, formData.additional_driver, formData.insurance_premium,
    customerTier,
  ])

  const calculateTotals = () => {
    if (!formData.start_date || !formData.end_date || !formData.daily_rate) return
    const start = new Date(formData.start_date)
    const end = new Date(formData.end_date)
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    if (totalDays <= 0) return
    const baseAmount = formData.daily_rate * totalDays
    let extrasCost = 0
    if (formData.gps) extrasCost += 500 * totalDays
    if (formData.child_seat) extrasCost += 300 * totalDays
    if (formData.additional_driver) extrasCost += 1000 * totalDays
    if (formData.insurance_premium) extrasCost += 2000 * totalDays
    const subtotal = baseAmount + extrasCost + formData.additional_charges - formData.discount_amount
    const taxAmount = subtotal * 0.19
    const totalAmount = subtotal + taxAmount
    const tierKmBonus = customerTier?.km_bonus || 0
    const effectiveDailyLimit = formData.daily_km_limit + tierKmBonus
    const totalKmAllowed = effectiveDailyLimit * totalDays
    setCalculations({ total_days: totalDays, base_amount: baseAmount, extras_cost: extrasCost, subtotal, tax_amount: taxAmount, total_amount: totalAmount, total_km_allowed: totalKmAllowed, tier_km_bonus: tierKmBonus, effective_daily_limit: effectiveDailyLimit })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.customer_id || !formData.vehicle_id) { toast.error(t("fillRequiredFields")); return }
    if (new Date(formData.end_date) <= new Date(formData.start_date)) { toast.error(`${t("endDate")} ${t("mustBeAfter")} ${t("startDate")}`); return }
    try {
      setLoading(true)
      const extras = { gps: formData.gps, child_seat: formData.child_seat, additional_driver: formData.additional_driver, insurance_premium: formData.insurance_premium }
      const contractData = {
        customer_id: formData.customer_id, vehicle_id: formData.vehicle_id,
        start_date: formData.start_date, end_date: formData.end_date,
        daily_rate: formData.daily_rate, daily_km_limit: formData.daily_km_limit,
        deposit_amount: formData.deposit_amount,
        additional_charges: formData.additional_charges + calculations.extras_cost,
        discount_amount: formData.discount_amount, extras, notes: formData.notes,
      }
      await contractApi.create(contractData)
      toast.success(t("contractCreated"))
      router.push("/dashboard/contracts")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failedToCreate"))
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid rgba(255,255,255,0.07)`, borderTopColor: GREEN, animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

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
            {t("newContract")}
          </h1>
          <p style={{ fontSize: 13, color: MUTED }}>{t("createContract")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

          {/* ── Left column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Customer & Vehicle */}
            <SectionCard title={t("contractInformation")}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <FieldLabel>{t("customer")} *</FieldLabel>
                  <StyledSelect
                    id="customer_id" value={formData.customer_id} required
                    onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
                  >
                    <option value="">{t("selectCustomer")}</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} - {c.phone}{c.total_rentals ? ` (${c.total_rentals} rentals)` : ''}
                      </option>
                    ))}
                  </StyledSelect>
                </div>
                <div>
                  <FieldLabel>{t("vehicle")} *</FieldLabel>
                  <StyledSelect
                    id="vehicle_id" value={formData.vehicle_id} required
                    onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })}
                  >
                    <option value="">{t("selectVehicle")}</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} ({v.registration_number}) - {v.daily_rate.toLocaleString()} DZD/day
                      </option>
                    ))}
                  </StyledSelect>
                </div>
              </div>

              {customerTier && (
                <div style={{
                  marginTop: 14, padding: "12px 14px", borderRadius: 10,
                  background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.2)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: customerTier.km_bonus > 0 ? 8 : 0 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Customer Loyalty Tier:</span>
                    <CustomerTierBadge tier={customerTier.tier} tierName={customerTier.name} />
                  </div>
                  {customerTier.km_bonus > 0 && (
                    <p style={{ fontSize: 12, color: "#38BDF8" }}>
                      ✨ This customer gets +{customerTier.km_bonus} km/day bonus!
                    </p>
                  )}
                </div>
              )}
            </SectionCard>

            {/* Dates & Rates */}
            <SectionCard title={t("rentalDates")}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <FieldLabel>{t("pickupDate")} *</FieldLabel>
                  <StyledInput type="date" value={formData.start_date} required
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                </div>
                <div>
                  <FieldLabel>{t("returnDate")} *</FieldLabel>
                  <StyledInput type="date" value={formData.end_date} required
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
                </div>
                <div>
                  <FieldLabel>{t("dailyRate")} (DZD) *</FieldLabel>
                  <StyledInput type="number" min="0" step="0.01" value={formData.daily_rate} required
                    onChange={e => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <FieldLabel>Daily KM Limit (km/day) *</FieldLabel>
                  <StyledInput type="number" min="50" step="50" value={formData.daily_km_limit} required
                    onChange={e => setFormData({ ...formData, daily_km_limit: parseInt(e.target.value) || formData.daily_km_limit })} />
                  <p style={{ fontSize: 11, color: MUTED, marginTop: 5 }}>From company settings (Base limit before tier bonuses)</p>
                </div>
              </div>

              {calculations.total_days > 0 && (
                <div style={{
                  marginTop: 14, padding: "14px 16px", borderRadius: 10,
                  background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.15)",
                  display: "flex", alignItems: "flex-start", gap: 10,
                }}>
                  <Info size={15} style={{ color: "#38BDF8", marginTop: 1, flexShrink: 0 }} />
                  <div style={{ fontSize: 12, lineHeight: 1.7 }}>
                    <p style={{ fontWeight: 600, marginBottom: 4, color: "#fff" }}>Total KM Allowance:</p>
                    <p style={{ color: MUTED }}>
                      Base: {formData.daily_km_limit} km/day × {calculations.total_days} days =&nbsp;
                      <strong style={{ color: "#fff" }}>{(formData.daily_km_limit * calculations.total_days).toLocaleString()} km</strong>
                    </p>
                    {calculations.tier_km_bonus > 0 && (
                      <>
                        <p style={{ color: "#38BDF8" }}>
                          Tier Bonus: +{calculations.tier_km_bonus} km/day × {calculations.total_days} days =&nbsp;
                          <strong>+{(calculations.tier_km_bonus * calculations.total_days).toLocaleString()} km</strong>
                        </p>
                        <p style={{ fontWeight: 700, fontSize: 13, color: "#fff", marginTop: 4 }}>
                          Total Allowed: {calculations.total_km_allowed.toLocaleString()} km
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Extras */}
            <SectionCard title={t("extras")}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <CheckRow checked={formData.gps} onChange={v => setFormData({ ...formData, gps: v })}>
                  {t("gpsNavigation")} <span style={{ color: MUTED }}>+500 DZD/day</span>
                </CheckRow>
                <CheckRow checked={formData.child_seat} onChange={v => setFormData({ ...formData, child_seat: v })}>
                  {t("childSeat")} <span style={{ color: MUTED }}>+300 DZD/day</span>
                </CheckRow>
                <CheckRow checked={formData.additional_driver} onChange={v => setFormData({ ...formData, additional_driver: v })}>
                  {t("additionalDriver")} <span style={{ color: MUTED }}>+1,000 DZD/day</span>
                </CheckRow>
                <CheckRow checked={formData.insurance_premium} onChange={v => setFormData({ ...formData, insurance_premium: v })}>
                  {t("premiumInsurance")} <span style={{ color: MUTED }}>+2,000 DZD/day</span>
                </CheckRow>
              </div>
            </SectionCard>

            {/* Financial Details */}
            <SectionCard title="Financial Details">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div>
                  <FieldLabel>{t("deposit")} (DZD)</FieldLabel>
                  <StyledInput type="number" min="0" step="0.01" value={formData.deposit_amount}
                    onChange={e => setFormData({ ...formData, deposit_amount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <FieldLabel>{t("additionalCharges")} (DZD)</FieldLabel>
                  <StyledInput type="number" min="0" step="0.01" value={formData.additional_charges}
                    onChange={e => setFormData({ ...formData, additional_charges: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <FieldLabel>{t("discount")} (DZD)</FieldLabel>
                  <StyledInput type="number" min="0" step="0.01" value={formData.discount_amount}
                    onChange={e => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
            </SectionCard>

            {/* Notes */}
            <SectionCard title={t("notes")}>
              <textarea
                placeholder="Add any special terms, conditions, or notes..."
                rows={4}
                value={formData.notes}
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
          </div>

          {/* ── Right column — Summary ── */}
          <div style={{ position: "sticky", top: 24 }}>
            <div style={{ padding: "24px 22px", borderRadius: 14, background: SURFACE, border: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <Calculator size={16} style={{ color: GREEN }} />
                <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.015em" }}>{t("estimatedTotal")}</h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <SummaryRow label={`${t("totalDays")}:`} value={String(calculations.total_days || 0)} />
                <SummaryRow label={`${t("baseAmount")}:`} value={`${calculations.base_amount.toLocaleString()} DZD`} />
                {calculations.extras_cost > 0 && <SummaryRow label={`${t("extras")}:`} value={`${calculations.extras_cost.toLocaleString()} DZD`} />}
                {formData.additional_charges > 0 && <SummaryRow label={`${t("additionalCharges")}:`} value={`${formData.additional_charges.toLocaleString()} DZD`} />}
                {formData.discount_amount > 0 && <SummaryRow label={`${t("discount")}:`} value={`-${formData.discount_amount.toLocaleString()} DZD`} accent="#4ADE80" />}
                <SummaryRow label="Subtotal:" value={`${calculations.subtotal.toLocaleString()} DZD`} border />
                <SummaryRow label={`${t("tax")}:`} value={`${calculations.tax_amount.toLocaleString()} DZD`} />
                <SummaryRow label={`${t("totalAmount")}:`} value={`${calculations.total_amount.toLocaleString()} DZD`} accent={GREEN} large border />
                {formData.deposit_amount > 0 && (
                  <SummaryRow label={`${t("deposit")} ${t("required")}:`} value={`${formData.deposit_amount.toLocaleString()} DZD`} accent="#FB923C" />
                )}
              </div>

              {/* KM Summary */}
              {calculations.total_days > 0 && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#38BDF8", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    KM Allowance
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <SummaryRow label="Daily Limit:" value={`${formData.daily_km_limit} km/day`} />
                    {calculations.tier_km_bonus > 0 && (
                      <SummaryRow label="Tier Bonus:" value={`+${calculations.tier_km_bonus} km/day`} accent="#38BDF8" />
                    )}
                    <SummaryRow label="Total Allowed:" value={`${calculations.total_km_allowed.toLocaleString()} km`} />
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{
                  width: "100%", marginTop: 20, padding: "12px 0", borderRadius: 10,
                  border: "none", cursor: loading ? "not-allowed" : "pointer",
                  background: loading ? "rgba(34,197,94,0.4)" : GREEN,
                  color: "#fff", fontFamily: FONT, fontWeight: 600, fontSize: 14,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.2s",
                  boxShadow: "0 0 20px rgba(34,197,94,0.2)",
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#16A34A" }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = GREEN }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite" }} />
                    {t("saving")}
                  </>
                ) : (
                  <><Save size={15} />{t("createContract")}</>
                )}
              </button>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}