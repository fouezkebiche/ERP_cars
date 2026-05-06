// components/dashboard/VehicleMaintenanceTab.tsx
"use client"

import { useState, useEffect } from "react"
import { Wrench, Loader2, Calendar, DollarSign, AlertTriangle, CheckCircle, Plus } from "lucide-react"
import toast from "react-hot-toast"
import { completeMaintenanceService, getMaintenanceHistory, type Vehicle } from "@/lib/vehicles.api"
import { format } from "date-fns"

/* ─── tokens ─────────────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"

/* ── interfaces — unchanged ──────────────────────────────────── */
interface MaintenanceRecord {
  id: string; vehicle_id: string; cost_type: string; amount: number
  incurred_date: string; description: string
  metadata?: { service_type?: string; mileage_at_service?: number; parts_replaced?: string[]; technician_name?: string; service_center?: string }
  created_at: string
}
interface MaintenanceStats {
  total_maintenance_count: number; total_maintenance_costs: number; average_cost_per_service: number
  last_maintenance_date?: string; last_maintenance_mileage: number; next_maintenance_mileage?: number
  km_until_next_maintenance: number; maintenance_interval_km: number
}
interface VehicleMaintenanceTabProps { vehicle: Vehicle; onUpdate: () => void }

/* ── shared form primitives ──────────────────────────────────── */
function DarkInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [f, setF] = useState(false)
  return <input {...props} onFocus={e => { setF(true); props.onFocus?.(e) }} onBlur={e => { setF(false); props.onBlur?.(e) }} style={{ width:"100%", padding:"10px 13px", borderRadius:10, background:f?"rgba(255,255,255,0.07)":SURFACE, border:`1px solid ${f?"rgba(34,197,94,0.45)":BORDER}`, color:"#fff", fontFamily:FONT, fontSize:13, outline:"none", transition:"all 0.2s", boxSizing:"border-box" as const }} />
}
function DarkSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [f, setF] = useState(false)
  return <select {...props} onFocus={e => { setF(true); props.onFocus?.(e) }} onBlur={e => { setF(false); props.onBlur?.(e) }} style={{ width:"100%", padding:"10px 13px", borderRadius:10, background:f?"#0E1117":"#0A0E14", border:`1px solid ${f?"rgba(34,197,94,0.45)":BORDER}`, color:"#fff", fontFamily:FONT, fontSize:13, outline:"none", transition:"all 0.2s", cursor:"pointer", appearance:"none" as const }} />
}
function DarkTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [f, setF] = useState(false)
  return <textarea {...props} onFocus={e => { setF(true); props.onFocus?.(e) }} onBlur={e => { setF(false); props.onBlur?.(e) }} style={{ width:"100%", padding:"10px 13px", borderRadius:10, minHeight:80, resize:"vertical" as const, background:f?"rgba(255,255,255,0.07)":SURFACE, border:`1px solid ${f?"rgba(34,197,94,0.45)":BORDER}`, color:"#fff", fontFamily:FONT, fontSize:13, outline:"none", transition:"all 0.2s", boxSizing:"border-box" as const }} />
}
function FL({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#9CA3AF", marginBottom:7, letterSpacing:"0.03em", textTransform:"uppercase" as const, fontFamily:FONT }}>{children}{req && <span style={{ color:"#F87171", marginLeft:3 }}>*</span>}</label>
}
function PrimaryBtn({ children, type="button", disabled, onClick }: { children: React.ReactNode; type?: "button"|"submit"; disabled?: boolean; onClick?: () => void }) {
  const [hov, setHov] = useState(false)
  return <button type={type} onClick={onClick} disabled={disabled} onMouseEnter={() => !disabled && setHov(true)} onMouseLeave={() => setHov(false)} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"9px 18px", borderRadius:10, border:"none", fontFamily:FONT, fontSize:13, fontWeight:600, cursor:disabled?"not-allowed":"pointer", background:disabled?"rgba(34,197,94,0.35)":hov?"#16A34A":"#22C55E", color:"#fff", transition:"all 0.2s" }}>{children}</button>
}
function GhostBtn({ children, type="button", disabled, onClick }: { children: React.ReactNode; type?: "button"|"submit"; disabled?: boolean; onClick?: () => void }) {
  const [hov, setHov] = useState(false)
  return <button type={type} onClick={onClick} disabled={disabled} onMouseEnter={() => !disabled && setHov(true)} onMouseLeave={() => setHov(false)} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"9px 18px", borderRadius:10, fontFamily:FONT, fontSize:13, fontWeight:600, cursor:disabled?"not-allowed":"pointer", background:hov?"rgba(255,255,255,0.06)":"transparent", border:"1px solid rgba(255,255,255,0.1)", color:hov?"#fff":"#9CA3AF", transition:"all 0.2s" }}>{children}</button>
}
function Spin() { return <span style={{ width:13, height:13, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", display:"inline-block", animation:"vm-spin 0.7s linear infinite" }} /> }

/* ═══════════════════════════════════════════════════════════════ */
export function VehicleMaintenanceTab({ vehicle, onUpdate }: VehicleMaintenanceTabProps) {
  // ── all state & logic unchanged ──────────────────────────────
  const [records, setRecords]               = useState<MaintenanceRecord[]>([])
  const [stats, setStats]                   = useState<MaintenanceStats | null>(null)
  const [loading, setLoading]               = useState(true)
  const [showCompleteForm, setShowCompleteForm] = useState(false)
  const [submitting, setSubmitting]         = useState(false)
  const [formData, setFormData]             = useState({
    mileage: vehicle.mileage || 0,
    service_type: "oil_change" as "oil_change"|"full_service"|"tire_change"|"brake_service"|"general_inspection"|"other",
    cost: 0, performed_date: new Date().toISOString().split("T")[0],
    description: "", next_service_km: vehicle.maintenance_interval_km || 5000,
    parts_replaced: "", technician_name: "", service_center: "",
  })

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const response = await getMaintenanceHistory(vehicle.id)
      if (response.success) {
        const records: MaintenanceRecord[] = response.data.maintenance_records.map((r: any) => ({ ...r, description: r.description || "" }))
        setRecords(records); setStats(response.data.stats)
      }
    } catch (error: any) {
      console.error("Failed to fetch maintenance history:", error)
      toast.error("Failed to load maintenance history")
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchHistory() }, [vehicle.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.mileage < vehicle.mileage) { toast.error("Mileage cannot be less than current vehicle mileage"); return }
    if (formData.cost <= 0) { toast.error("Cost must be greater than 0"); return }
    setSubmitting(true)
    try {
      const parts = formData.parts_replaced ? formData.parts_replaced.split(",").map(p => p.trim()).filter(Boolean) : undefined
      const response = await completeMaintenanceService(vehicle.id, { mileage: Number(formData.mileage), service_type: formData.service_type, cost: Number(formData.cost), performed_date: formData.performed_date, description: formData.description, next_service_km: Number(formData.next_service_km), parts_replaced: parts, technician_name: formData.technician_name || undefined, service_center: formData.service_center || undefined })
      if (response.success) {
        toast.success("Maintenance recorded successfully!")
        setShowCompleteForm(false)
        setFormData({ mileage: response.data.vehicle.mileage, service_type: "oil_change", cost: 0, performed_date: new Date().toISOString().split("T")[0], description: "", next_service_km: vehicle.maintenance_interval_km || 5000, parts_replaced: "", technician_name: "", service_center: "" })
        fetchHistory(); onUpdate()
      }
    } catch (error: any) {
      console.error("Complete maintenance error:", error)
      toast.error(error.details || error.message || "Failed to record maintenance")
    } finally { setSubmitting(false) }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const getMaintenanceStatus = () => {
    if (!stats) return null
    const km = stats.km_until_next_maintenance
    if (km <= 0)   return { status:"overdue",   textColor:"#F87171", borderColor:"rgba(239,68,68,0.35)",  bgColor:"rgba(239,68,68,0.07)",  icon:AlertTriangle, iconColor:"#F87171", message:`Overdue by ${Math.abs(km).toLocaleString()} km` }
    if (km <= 500) return { status:"due_soon",  textColor:"#FCD34D", borderColor:"rgba(245,158,11,0.35)", bgColor:"rgba(245,158,11,0.07)", icon:AlertTriangle, iconColor:"#FCD34D", message:`Due in ${km.toLocaleString()} km` }
    return           { status:"ok",           textColor:"#4ADE80", borderColor:"rgba(34,197,94,0.3)",   bgColor:"rgba(34,197,94,0.06)",  icon:CheckCircle,   iconColor:"#4ADE80", message:`Next service in ${km.toLocaleString()} km` }
  }

  const ms = getMaintenanceStatus()
  const StatusIcon = ms?.icon
  // ────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: FONT, color: "#fff", display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`@keyframes vm-spin { to { transform:rotate(360deg); } } ::placeholder { color:#4B5563!important; }`}</style>

      {/* header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.035em", marginBottom: 4 }}>Maintenance</h2>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>Track vehicle maintenance and service history</p>
        </div>
        <PrimaryBtn onClick={() => setShowCompleteForm(!showCompleteForm)}>
          <Wrench size={14} /> Complete Maintenance
        </PrimaryBtn>
      </div>

      {/* status card */}
      {stats && ms && StatusIcon && (
        <div style={{ padding: "18px 20px", borderRadius: 14, background: ms.bgColor, border: `1px solid ${ms.borderColor}` }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <StatusIcon size={20} color={ms.iconColor} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: ms.textColor, marginBottom: 14 }}>{ms.message}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 12 }}>
                {[
                  { label: "Current Mileage", val: `${vehicle.mileage.toLocaleString()} km` },
                  { label: "Last Service",    val: `${stats.last_maintenance_mileage.toLocaleString()} km` },
                  { label: "Next Service",    val: stats.next_maintenance_mileage ? `${stats.next_maintenance_mileage.toLocaleString()} km` : "N/A" },
                  { label: "Service Interval",val: `${stats.maintenance_interval_km.toLocaleString()} km` },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 3 }}>{label}</p>
                    <p style={{ fontSize: 14, fontWeight: 700 }}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* stat mini-cards */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
          {[
            { label: "Total Services", val: stats.total_maintenance_count },
            { label: "Total Costs",    val: `${stats.total_maintenance_costs.toLocaleString()} DZD` },
            { label: "Average Cost",   val: `${Math.round(stats.average_cost_per_service).toLocaleString()} DZD` },
          ].map(({ label, val }) => (
            <div key={label} style={{ padding: "16px 18px", borderRadius: 12, background: SURFACE, border: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.05em", fontWeight: 600 }}>{label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.04em" }}>{val}</p>
            </div>
          ))}
        </div>
      )}

      {/* form */}
      {showCompleteForm && (
        <div style={{ padding: "22px 24px", borderRadius: 14, background: SURFACE, border: `1px solid ${BORDER}` }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Complete Maintenance Service</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginBottom: 16 }}>
              <div><FL req>Service Type</FL>
                <DarkSelect name="service_type" value={formData.service_type} onChange={handleInputChange} required>
                  <option value="oil_change">Oil Change</option>
                  <option value="full_service">Full Service</option>
                  <option value="tire_change">Tire Change</option>
                  <option value="brake_service">Brake Service</option>
                  <option value="general_inspection">General Inspection</option>
                  <option value="other">Other</option>
                </DarkSelect>
              </div>
              <div><FL req>Current Mileage (km)</FL><DarkInput type="number" name="mileage" value={formData.mileage} onChange={handleInputChange} min={vehicle.mileage} step={1} placeholder="e.g., 55000" required /></div>
              <div><FL req>Cost (DZD)</FL><DarkInput type="number" name="cost" value={formData.cost} onChange={handleInputChange} min={0} step={100} placeholder="e.g., 8000" required /></div>
              <div><FL req>Service Date</FL><DarkInput type="date" name="performed_date" value={formData.performed_date} onChange={handleInputChange} required /></div>
              <div><FL>Next Service Interval (km)</FL><DarkInput type="number" name="next_service_km" value={formData.next_service_km} onChange={handleInputChange} min={1000} step={1000} placeholder="e.g., 5000" /></div>
              <div><FL>Technician Name</FL><DarkInput type="text" name="technician_name" value={formData.technician_name} onChange={handleInputChange} placeholder="e.g., Ahmed" /></div>
              <div><FL>Service Center</FL><DarkInput type="text" name="service_center" value={formData.service_center} onChange={handleInputChange} placeholder="e.g., AutoFix Garage" /></div>
              <div><FL>Parts Replaced (comma-separated)</FL><DarkInput type="text" name="parts_replaced" value={formData.parts_replaced} onChange={handleInputChange} placeholder="e.g., Oil Filter, Air Filter" /></div>
              <div style={{ gridColumn: "1 / -1" }}><FL req>Description</FL><DarkTextarea name="description" value={formData.description} onChange={handleInputChange} placeholder="e.g., Changed oil and filter, inspected brakes" required /></div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <GhostBtn type="button" onClick={() => setShowCompleteForm(false)} disabled={submitting}>Cancel</GhostBtn>
              <PrimaryBtn type="submit" disabled={submitting}>{submitting ? <><Spin />&nbsp;Recording…</> : "Complete Service"}</PrimaryBtn>
            </div>
          </form>
        </div>
      )}

      {/* loading */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <div style={{ width: 32, height: 32, border: `3px solid ${GREEN}`, borderTopColor: "transparent", borderRadius: "50%", animation: "vm-spin 0.8s linear infinite" }} />
        </div>
      )}

      {/* empty */}
      {!loading && records.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 24px", borderRadius: 14, border: `1px dashed ${BORDER}` }}>
          <Wrench size={36} color="#4B5563" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "#9CA3AF", fontSize: 14, marginBottom: 16 }}>No maintenance history yet</p>
          <PrimaryBtn onClick={() => setShowCompleteForm(true)}><Wrench size={13} /> Record First Service</PrimaryBtn>
        </div>
      )}

      {/* history list */}
      {!loading && records.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Maintenance History</h3>
          {records.map((record) => (
            <div key={record.id} style={{ padding: "16px 18px", borderRadius: 12, background: SURFACE, border: `1px solid ${BORDER}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, transition: "border-color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" as const }}>
                  <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 99, fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" as const, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#FCD34D" }}>
                    {record.metadata?.service_type?.replace("_", " ").toUpperCase() || "MAINTENANCE"}
                  </span>
                  <span style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
                    <Calendar size={11} /> {format(new Date(record.incurred_date), "PPP")}
                  </span>
                  {record.metadata?.mileage_at_service && (
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>@ {record.metadata.mileage_at_service.toLocaleString()} km</span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: "#D1D5DB", marginBottom: 8 }}>{record.description}</p>
                {record.metadata && (
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 12 }}>
                    {record.metadata.technician_name && <span style={{ fontSize: 11, color: "#9CA3AF" }}>👨‍🔧 {record.metadata.technician_name}</span>}
                    {record.metadata.service_center   && <span style={{ fontSize: 11, color: "#9CA3AF" }}>🏢 {record.metadata.service_center}</span>}
                    {record.metadata.parts_replaced?.length && <span style={{ fontSize: 11, color: "#9CA3AF" }}>🔧 {record.metadata.parts_replaced.join(", ")}</span>}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: 4 }}>
                  <DollarSign size={13} color="#9CA3AF" /> {Number(record.amount).toLocaleString()} DZD
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}