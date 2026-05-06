// components/dashboard/OverageCalculator.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { Calculator, AlertCircle, TrendingDown, Gauge } from "lucide-react"
import { contractApi, type OverageEstimate } from "@/lib/contractApi"
import { CustomerTierBadge } from "./CustomerTierBadge"

/* ─── tokens ─────────────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"

interface OverageCalculatorProps {
  contractId: string
  startMileage: number
  totalKmAllowed: number
  currentEndMileage?: number
  onEstimateChange?: (estimate: OverageEstimate | null) => void
}

/* ─── reusable dark field ────────────────────────────────────── */
function DarkInput({
  id, type = "text", min, placeholder, value, onChange,
}: {
  id?: string; type?: string; min?: number; placeholder?: string
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const [focus, setFocus] = useState(false)
  return (
    <input
      id={id} type={type} min={min} placeholder={placeholder} value={value}
      onChange={onChange}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{
        width: "100%", padding: "11px 14px",
        background: focus ? "rgba(255,255,255,0.07)" : SURFACE,
        border: `1px solid ${focus ? "rgba(34,197,94,0.5)" : BORDER}`,
        borderRadius: 10, color: "#fff", fontFamily: FONT, fontSize: 14,
        outline: "none", transition: "all 0.2s", boxSizing: "border-box",
      }}
    />
  )
}

/* ─── row inside result cards ────────────────────────────────── */
function InfoRow({ label, value, valueColor }: { label: string; value: React.ReactNode; valueColor?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
      <span style={{ color: "#9CA3AF" }}>{label}</span>
      <span style={{ fontWeight: 700, color: valueColor || "#fff" }}>{value}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
export function OverageCalculator({
  contractId,
  startMileage,
  totalKmAllowed,
  currentEndMileage,
  onEstimateChange,
}: OverageCalculatorProps) {
  const [endMileage, setEndMileage]   = useState(currentEndMileage?.toString() || "")
  const [estimate, setEstimate]       = useState<OverageEstimate | null>(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const onEstimateChangeRef           = useRef(onEstimateChange)

  // ── logic unchanged ──────────────────────────────────────────
  useEffect(() => { onEstimateChangeRef.current = onEstimateChange }, [onEstimateChange])

  useEffect(() => {
    const fetchEstimate = async () => {
      const endMileageNum = parseInt(endMileage)
      if (!endMileage || isNaN(endMileageNum) || endMileageNum <= startMileage) {
        setEstimate(null)
        onEstimateChangeRef.current?.(null)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const response = await contractApi.estimateOverage(contractId, endMileageNum)
        setEstimate(response.data)
        onEstimateChangeRef.current?.(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to calculate estimate")
        setEstimate(null)
        onEstimateChangeRef.current?.(null)
      } finally {
        setLoading(false)
      }
    }
    const debounce = setTimeout(fetchEstimate, 1000)
    return () => clearTimeout(debounce)
  }, [endMileage, contractId, startMileage])

  const kmDriven  = estimate?.estimated_km_driven || 0
  const kmOverage = estimate?.estimated_overage.km_overage || 0
  const hasOverage = kmOverage > 0
  // ────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: FONT, color: "#fff" }}>

      {/* ── input ── */}
      <div>
        <label htmlFor="end-mileage-estimate" style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#9CA3AF", marginBottom: 8 }}>
          Estimated End Mileage (km) *
        </label>
        <DarkInput
          id="end-mileage-estimate"
          type="number"
          min={startMileage}
          placeholder="Enter estimated odometer reading"
          value={endMileage}
          onChange={(e) => setEndMileage(e.target.value)}
        />
        <p style={{ fontSize: 11, color: "#6B7280", marginTop: 6 }}>
          Start mileage: {startMileage.toLocaleString()} km
        </p>
      </div>

      {/* ── loading ── */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#9CA3AF" }}>
          <div style={{
            width: 14, height: 14, border: `2px solid ${GREEN}`, borderTopColor: "transparent",
            borderRadius: "50%", animation: "oc-spin 0.7s linear infinite", flexShrink: 0,
          }} />
          <style>{`@keyframes oc-spin { to { transform: rotate(360deg); } }`}</style>
          Calculating…
        </div>
      )}

      {/* ── error ── */}
      {error && (
        <div style={{
          padding: "12px 14px", borderRadius: 10, borderLeft: "3px solid #EF4444",
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          display: "flex", alignItems: "flex-start", gap: 9,
        }}>
          <AlertCircle size={15} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13, color: "#FCA5A5" }}>{error}</span>
        </div>
      )}

      {/* ── results ── */}
      {estimate && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* mileage summary card */}
          <div style={{
            padding: "16px 18px", borderRadius: 12,
            background: "rgba(96,165,250,0.07)", border: "1px solid rgba(96,165,250,0.2)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(96,165,250,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Calculator size={13} color="#60A5FA" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#93C5FD" }}>Mileage Summary</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <InfoRow label="Estimated KM Driven:" value={`${kmDriven.toLocaleString()} km`} />
              <InfoRow
                label="KM Allowed:"
                value={`${estimate.allowed_km.total_km_allowed.toLocaleString()} km`}
              />
              {estimate.allowed_km.bonus_km_per_day > 0 && (
                <InfoRow
                  label="Tier Bonus (per day):"
                  value={`+${estimate.allowed_km.bonus_km_per_day} km`}
                  valueColor="#60A5FA"
                />
              )}
            </div>
          </div>

          {/* customer tier row */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "11px 14px", borderRadius: 10, background: SURFACE, border: `1px solid ${BORDER}`,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF" }}>Customer Tier:</span>
            <CustomerTierBadge
              tier={estimate.estimated_overage.tier as any}
              tierName={estimate.estimated_overage.tier_name}
            />
          </div>

          {/* overage / no-overage */}
          {hasOverage ? (
            <div style={{
              padding: "16px 18px", borderRadius: 12, borderLeft: "3px solid #EF4444",
              background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertCircle size={15} color="#F87171" />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#FCA5A5" }}>Overage Detected!</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <InfoRow label="KM over limit:" value={`${kmOverage.toLocaleString()} km`} valueColor="#F87171" />
                <InfoRow
                  label="Base charge:"
                  value={`${estimate.estimated_overage.base_overage_charges.toLocaleString()} DZD`}
                />
                {estimate.estimated_overage.discount_amount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                    <span style={{ color: "#9CA3AF" }}>
                      {estimate.estimated_overage.tier_name} discount (-{estimate.estimated_overage.discount_percentage}%):
                    </span>
                    <span style={{ fontWeight: 700, color: "#4ADE80", display: "flex", alignItems: "center", gap: 4 }}>
                      <TrendingDown size={12} />
                      -{estimate.estimated_overage.discount_amount.toLocaleString()} DZD
                    </span>
                  </div>
                )}
                {/* final charge */}
                <div style={{
                  marginTop: 6, padding: "10px 14px", borderRadius: 8,
                  background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontSize: 13, color: "#FCA5A5", fontWeight: 600 }}>Final overage charge:</span>
                  <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: "#F87171" }}>
                    {estimate.estimated_overage.final_overage_charges.toLocaleString()} DZD
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              padding: "12px 16px", borderRadius: 10,
              background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)",
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 13, fontWeight: 600, color: "#4ADE80",
            }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                ✅
              </div>
              Within limit! No overage charges.
            </div>
          )}
        </div>
      )}
    </div>
  )
}