// components/dashboard/VehicleCostsTab.tsx
"use client"

import { useState, useEffect } from "react"
import { Plus, Loader2, Calendar, DollarSign } from "lucide-react"
import toast from "react-hot-toast"
import { getVehicleCosts, addVehicleCost, type VehicleCost } from "@/lib/vehicles.api"
import { format } from "date-fns"

/* ─── tokens ─────────────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const G_DIM   = "rgba(34,197,94,0.10)"
const G_GLOW  = "rgba(34,197,94,0.22)"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"

interface VehicleCostsTabProps {
  vehicleId: string
}

/* ── cost-type chip colours ──────────────────────────────────── */
const COST_TYPE_STYLE: Record<VehicleCost["cost_type"], { bg: string; border: string; color: string }> = {
  fuel:         { bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.3)",  color: "#93C5FD" },
  maintenance:  { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  color: "#FCD34D" },
  insurance:    { bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.3)",   color: "#4ADE80" },
  registration: { bg: "rgba(168,85,247,0.12)",  border: "rgba(168,85,247,0.3)",  color: "#D8B4FE" },
  cleaning:     { bg: "rgba(34,211,238,0.12)",  border: "rgba(34,211,238,0.3)",  color: "#67E8F9" },
  repair:       { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   color: "#F87171" },
  other:        { bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.25)",color: "#9CA3AF" },
}

/* ── shared dark field ───────────────────────────────────────── */
function DarkInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focus, setFocus] = useState(false)
  return (
    <input
      {...props}
      onFocus={e => { setFocus(true); props.onFocus?.(e) }}
      onBlur={e => { setFocus(false); props.onBlur?.(e) }}
      style={{
        width: "100%", padding: "10px 13px", borderRadius: 10,
        background: focus ? "rgba(255,255,255,0.07)" : SURFACE,
        border: `1px solid ${focus ? "rgba(34,197,94,0.45)" : BORDER}`,
        color: "#fff", fontFamily: FONT, fontSize: 13,
        outline: "none", transition: "all 0.2s", boxSizing: "border-box",
      }}
    />
  )
}

function DarkSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [focus, setFocus] = useState(false)
  return (
    <select
      {...props}
      onFocus={e => { setFocus(true); props.onFocus?.(e) }}
      onBlur={e => { setFocus(false); props.onBlur?.(e) }}
      style={{
        width: "100%", padding: "10px 13px", borderRadius: 10,
        background: focus ? "#0E1117" : "#0A0E14",
        border: `1px solid ${focus ? "rgba(34,197,94,0.45)" : BORDER}`,
        color: "#fff", fontFamily: FONT, fontSize: 13,
        outline: "none", transition: "all 0.2s", cursor: "pointer",
        appearance: "none",
      }}
    />
  )
}

function DarkTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [focus, setFocus] = useState(false)
  return (
    <textarea
      {...props}
      onFocus={e => { setFocus(true); props.onFocus?.(e) }}
      onBlur={e => { setFocus(false); props.onBlur?.(e) }}
      style={{
        width: "100%", padding: "10px 13px", borderRadius: 10, minHeight: 80, resize: "vertical",
        background: focus ? "rgba(255,255,255,0.07)" : SURFACE,
        border: `1px solid ${focus ? "rgba(34,197,94,0.45)" : BORDER}`,
        color: "#fff", fontFamily: FONT, fontSize: 13,
        outline: "none", transition: "all 0.2s", boxSizing: "border-box",
      }}
    />
  )
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9CA3AF", marginBottom: 7, letterSpacing: "0.03em", textTransform: "uppercase" as const, fontFamily: FONT }}>
      {children}{required && <span style={{ color: "#F87171", marginLeft: 3 }}>*</span>}
    </label>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
export function VehicleCostsTab({ vehicleId }: VehicleCostsTabProps) {
  // ── state — unchanged ────────────────────────────────────────
  const [costs, setCosts]           = useState<VehicleCost[]>([])
  const [loading, setLoading]       = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [totalCost, setTotalCost]   = useState(0)
  const [filters, setFilters]       = useState({ cost_type: "all", start_date: "", end_date: "" })
  const [formData, setFormData]     = useState({
    cost_type: "maintenance" as VehicleCost["cost_type"],
    amount: 0,
    incurred_date: new Date().toISOString().split("T")[0],
    description: "",
  })

  const fetchCosts = async () => {
    setLoading(true)
    try {
      const response = await getVehicleCosts(vehicleId, {
        cost_type: filters.cost_type !== "all" ? filters.cost_type : undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
      })
      if (response.success) { setCosts(response.data.costs); setTotalCost(response.data.total_cost) }
    } catch (error: any) {
      console.error("Failed to fetch costs:", error)
      toast.error("Failed to load vehicle costs")
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchCosts() }, [vehicleId, filters.cost_type, filters.start_date, filters.end_date])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.amount <= 0) { toast.error("Amount must be greater than 0"); return }
    setSubmitting(true)
    try {
      const response = await addVehicleCost(vehicleId, { ...formData, amount: Number(formData.amount) })
      if (response.success) {
        toast.success("Cost added successfully!")
        setShowAddForm(false)
        setFormData({ cost_type: "maintenance", amount: 0, incurred_date: new Date().toISOString().split("T")[0], description: "" })
        fetchCosts()
      }
    } catch (error: any) {
      console.error("Add cost error:", error)
      toast.error(error.details || error.message || "Failed to add cost")
    } finally { setSubmitting(false) }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  // ────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: FONT, color: "#fff", display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`@keyframes vc-spin { to { transform:rotate(360deg); } } ::placeholder { color:#4B5563!important; }`}</style>

      {/* ── header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.035em", marginBottom: 4 }}>Vehicle Costs</h2>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>Track maintenance and operational expenses</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Total Costs</p>
          <p style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.04em", color: GREEN }}>{totalCost.toLocaleString()} DZD</p>
        </div>
      </div>

      {/* ── filters row ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <DarkSelect value={filters.cost_type} onChange={(e) => setFilters({ ...filters, cost_type: e.target.value })} style={{ maxWidth: 160 }}>
          <option value="all">All Types</option>
          <option value="fuel">Fuel</option>
          <option value="maintenance">Maintenance</option>
          <option value="insurance">Insurance</option>
          <option value="registration">Registration</option>
          <option value="cleaning">Cleaning</option>
          <option value="repair">Repair</option>
          <option value="other">Other</option>
        </DarkSelect>

        <DarkInput type="date" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} style={{ maxWidth: 160 }} />
        <DarkInput type="date" value={filters.end_date}   onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}   style={{ maxWidth: 160 }} />

        <AddCostBtn onClick={() => setShowAddForm(!showAddForm)} />
      </div>

      {/* ── add form ── */}
      {showAddForm && (
        <div style={{ padding: "22px 24px", borderRadius: 14, background: SURFACE, border: `1px solid ${BORDER}` }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Add New Cost</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginBottom: 16 }}>
              <div>
                <FieldLabel required>Cost Type</FieldLabel>
                <DarkSelect name="cost_type" value={formData.cost_type} onChange={handleInputChange} required>
                  <option value="fuel">Fuel</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="insurance">Insurance</option>
                  <option value="registration">Registration</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="repair">Repair</option>
                  <option value="other">Other</option>
                </DarkSelect>
              </div>
              <div>
                <FieldLabel required>Amount (DZD)</FieldLabel>
                <DarkInput type="number" name="amount" value={formData.amount} onChange={handleInputChange} min={0} step={100} placeholder="e.g., 5000" required />
              </div>
              <div>
                <FieldLabel required>Date</FieldLabel>
                <DarkInput type="date" name="incurred_date" value={formData.incurred_date} onChange={handleInputChange} required />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <FieldLabel>Description</FieldLabel>
                <DarkTextarea name="description" value={formData.description} onChange={handleInputChange} placeholder="e.g., Oil change and filter replacement" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <GhostBtn type="button" onClick={() => setShowAddForm(false)} disabled={submitting}>Cancel</GhostBtn>
              <PrimaryBtn type="submit" disabled={submitting}>
                {submitting ? <><Spin />&nbsp;Adding…</> : "Add Cost"}
              </PrimaryBtn>
            </div>
          </form>
        </div>
      )}

      {/* ── loading ── */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <div style={{ width: 32, height: 32, border: `3px solid ${GREEN}`, borderTopColor: "transparent", borderRadius: "50%", animation: "vc-spin 0.8s linear infinite" }} />
        </div>
      )}

      {/* ── empty ── */}
      {!loading && costs.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 24px", borderRadius: 14, border: `1px dashed ${BORDER}` }}>
          <DollarSign size={36} color="#4B5563" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "#9CA3AF", fontSize: 14, marginBottom: 16 }}>No costs recorded yet</p>
          <AddCostBtn onClick={() => setShowAddForm(true)} label="Add First Cost" />
        </div>
      )}

      {/* ── costs list ── */}
      {!loading && costs.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {costs.map((cost) => {
            const chip = COST_TYPE_STYLE[cost.cost_type] || COST_TYPE_STYLE.other
            return (
              <div key={cost.id} style={{
                padding: "16px 18px", borderRadius: 12,
                background: SURFACE, border: `1px solid ${BORDER}`,
                display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
                transition: "border-color 0.2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 99, fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" as const, background: chip.bg, border: `1px solid ${chip.border}`, color: chip.color }}>
                      {cost.cost_type.charAt(0).toUpperCase() + cost.cost_type.slice(1)}
                    </span>
                    <span style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
                      <Calendar size={11} />
                      {format(new Date(cost.incurred_date), "PPP")}
                    </span>
                  </div>
                  {cost.description && <p style={{ fontSize: 13, color: "#9CA3AF" }}>{cost.description}</p>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", display: "flex", alignItems: "center", gap: 4 }}>
                    <DollarSign size={13} color="#9CA3AF" />
                    {Number(cost.amount).toLocaleString()} DZD
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── local button helpers ──────────────────────────────────────── */
function AddCostBtn({ onClick, label = "Add Cost" }: { onClick: () => void; label?: string }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, border: "none", fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", marginLeft: "auto", background: hov ? "#16A34A" : "#22C55E", color: "#fff", boxShadow: hov ? "0 0 20px rgba(34,197,94,0.3)" : "none", transition: "all 0.2s" }}>
      <Plus size={14} /> {label}
    </button>
  )
}

function PrimaryBtn({ children, type = "button", disabled, onClick }: { children: React.ReactNode; type?: "button"|"submit"; disabled?: boolean; onClick?: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button type={type} onClick={onClick} disabled={disabled} onMouseEnter={() => !disabled && setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, border: "none", fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "rgba(34,197,94,0.35)" : hov ? "#16A34A" : "#22C55E", color: "#fff", transition: "all 0.2s" }}>
      {children}
    </button>
  )
}

function GhostBtn({ children, type = "button", disabled, onClick }: { children: React.ReactNode; type?: "button"|"submit"; disabled?: boolean; onClick?: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button type={type} onClick={onClick} disabled={disabled} onMouseEnter={() => !disabled && setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", background: hov ? "rgba(255,255,255,0.06)" : "transparent", border: "1px solid rgba(255,255,255,0.1)", color: hov ? "#fff" : "#9CA3AF", transition: "all 0.2s" }}>
      {children}
    </button>
  )
}

function Spin() {
  return <span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "vc-spin 0.7s linear infinite" }} />
}