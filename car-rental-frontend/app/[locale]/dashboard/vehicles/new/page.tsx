// app/[locale]/dashboard/vehicles/new/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Car } from "lucide-react"
import toast from "react-hot-toast"
import { createVehicle } from "@/lib/vehicles.api"
import { useTranslations } from "next-intl"

/* ─── tokens ─────────────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const G_GLOW  = "rgba(34,197,94,0.22)"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"

/* ── primitives ──────────────────────────────────────────────── */
function DarkInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [f, setF] = useState(false)
  return (
    <input {...props}
      onFocus={e => { setF(true); props.onFocus?.(e) }}
      onBlur={e => { setF(false); props.onBlur?.(e) }}
      style={{ width:"100%", padding:"10px 13px", borderRadius:10, background:f?"rgba(255,255,255,0.07)":SURFACE, border:`1px solid ${f?"rgba(34,197,94,0.45)":BORDER}`, color:"#fff", fontFamily:FONT, fontSize:13, outline:"none", transition:"all 0.2s", boxSizing:"border-box" as const }} />
  )
}
function DarkSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [f, setF] = useState(false)
  return (
    <select {...props}
      onFocus={e => { setF(true); props.onFocus?.(e) }}
      onBlur={e => { setF(false); props.onBlur?.(e) }}
      style={{ width:"100%", padding:"10px 13px", borderRadius:10, background:f?"#0E1117":"#0A0E14", border:`1px solid ${f?"rgba(34,197,94,0.45)":BORDER}`, color:"#fff", fontFamily:FONT, fontSize:13, outline:"none", transition:"all 0.2s", cursor:"pointer", appearance:"none" as const }} />
  )
}
function DarkTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [f, setF] = useState(false)
  return (
    <textarea {...props}
      onFocus={e => { setF(true); props.onFocus?.(e) }}
      onBlur={e => { setF(false); props.onBlur?.(e) }}
      style={{ width:"100%", padding:"10px 13px", borderRadius:10, minHeight:100, resize:"vertical" as const, background:f?"rgba(255,255,255,0.07)":SURFACE, border:`1px solid ${f?"rgba(34,197,94,0.45)":BORDER}`, color:"#fff", fontFamily:FONT, fontSize:13, outline:"none", transition:"all 0.2s", boxSizing:"border-box" as const }} />
  )
}
function FL({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#9CA3AF", marginBottom:7, letterSpacing:"0.03em", textTransform:"uppercase" as const, fontFamily:FONT }}>{children}{req && <span style={{ color:"#F87171", marginLeft:3 }}>*</span>}</label>
}
function SectionCard({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div style={{ padding:"24px 26px", borderRadius:16, background:SURFACE, border:`1px solid ${BORDER}`, fontFamily:FONT, color:"#fff" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        {icon && <div style={{ width:30, height:30, borderRadius:8, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>{icon}</div>}
        <h2 style={{ fontSize:15, fontWeight:700, letterSpacing:"-0.02em" }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16 }}>{children}</div>
}
function PrimaryBtn({ children, type="button", disabled, onClick }: { children: React.ReactNode; type?: "button"|"submit"; disabled?: boolean; onClick?: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => !disabled && setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"10px 20px", borderRadius:10, border:"none", fontFamily:FONT, fontSize:14, fontWeight:600, cursor:disabled?"not-allowed":"pointer", background:disabled?"rgba(34,197,94,0.35)":hov?"#16A34A":GREEN, color:"#fff", boxShadow:hov&&!disabled?`0 0 20px ${G_GLOW}`:"none", transition:"all 0.2s" }}>
      {children}
    </button>
  )
}
function GhostBtn({ children, type="button", disabled, onClick }: { children: React.ReactNode; type?: "button"|"submit"; disabled?: boolean; onClick?: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => !disabled && setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"10px 20px", borderRadius:10, fontFamily:FONT, fontSize:14, fontWeight:600, cursor:disabled?"not-allowed":"pointer", background:hov?"rgba(255,255,255,0.06)":"transparent", border:`1px solid ${BORDER}`, color:hov?"#fff":"#9CA3AF", transition:"all 0.2s" }}>
      {children}
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
export default function AddVehiclePage() {
  const t = useTranslations("vehicles")
  const router = useRouter()

  // ── all state & logic unchanged ──────────────────────────────
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    brand: "", model: "", year: new Date().getFullYear(),
    registration_number: "", vin: "", color: "",
    transmission: "manual" as "manual"|"automatic",
    fuel_type: "petrol" as "petrol"|"diesel"|"electric"|"hybrid",
    seats: 5, daily_rate: 0,
    status: "available" as "available"|"rented"|"maintenance"|"retired",
    mileage: 0, maintenance_interval_km: 5000, maintenance_alert_threshold: 100,
    last_maintenance_mileage: 0, next_maintenance_mileage: 5000,
    purchase_price: 0, purchase_date: "", notes: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.brand || !formData.model || !formData.registration_number) { toast.error(t("fillRequiredFields")); return }
    if (formData.daily_rate <= 0) { toast.error(t("dailyRateRequired")); return }
    setLoading(true)
    try {
      const response = await createVehicle({
        ...formData,
        year: Number(formData.year), seats: Number(formData.seats),
        daily_rate: Number(formData.daily_rate), mileage: Number(formData.mileage),
        maintenance_interval_km: Number(formData.maintenance_interval_km),
        maintenance_alert_threshold: Number(formData.maintenance_alert_threshold),
        last_maintenance_mileage: Number(formData.last_maintenance_mileage),
        next_maintenance_mileage: Number(formData.next_maintenance_mileage),
        purchase_price: formData.purchase_price ? Number(formData.purchase_price) : undefined,
      })
      if (response.success) { toast.success(t("vehicleCreated")); router.push("/dashboard/vehicles") }
    } catch (error: any) {
      console.error("Create vehicle error:", error)
      toast.error(error.details || error.message || t("failedToCreate"))
    } finally { setLoading(false) }
  }
  // ────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", fontFamily: FONT, color: "#fff", display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`@keyframes av-spin { to { transform:rotate(360deg); } } ::placeholder { color:#4B5563!important; }`}</style>

      {/* header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <button onClick={() => router.back()}
          style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:9, background:"transparent", border:`1px solid ${BORDER}`, color:"#9CA3AF", fontFamily:FONT, fontSize:13, fontWeight:600, cursor:"pointer", flexShrink:0, transition:"all 0.18s" }}
          onMouseEnter={e => { e.currentTarget.style.color="#fff"; e.currentTarget.style.borderColor="rgba(255,255,255,0.18)" }}
          onMouseLeave={e => { e.currentTarget.style.color="#9CA3AF"; e.currentTarget.style.borderColor=BORDER }}>
          <ArrowLeft size={14} /> {t("back")}
        </button>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, letterSpacing:"-0.035em", marginBottom:4 }}>{t("addNewVehicle")}</h1>
          <p style={{ fontSize:13, color:"#9CA3AF" }}>{t("addNewVehicleDesc")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>

        {/* basic info */}
        <SectionCard title={t("basicInformation")} icon={<Car size={14} color={GREEN} />}>
          <Grid>
            <div><FL req>{t("brand")}</FL><DarkInput id="brand" name="brand" value={formData.brand} onChange={handleInputChange} placeholder={t("brand")} /></div>
            <div><FL req>{t("model")}</FL><DarkInput id="model" name="model" value={formData.model} onChange={handleInputChange} placeholder={t("model")} /></div>
            <div><FL req>{t("year")}</FL><DarkInput id="year" name="year" type="number" value={formData.year} onChange={handleInputChange} min="1900" max={new Date().getFullYear() + 1} /></div>
            <div><FL req>{t("registrationNumber")}</FL><DarkInput id="registration_number" name="registration_number" value={formData.registration_number} onChange={handleInputChange} placeholder={t("registrationNumber")} /></div>
            <div><FL>{t("vin")}</FL><DarkInput id="vin" name="vin" value={formData.vin} onChange={handleInputChange} placeholder={t("vin")} /></div>
            <div><FL>{t("color")}</FL><DarkInput id="color" name="color" value={formData.color} onChange={handleInputChange} placeholder={t("color")} /></div>
          </Grid>
        </SectionCard>

        {/* specs */}
        <SectionCard title={t("specifications")}>
          <Grid>
            <div><FL>{t("transmission")}</FL>
              <DarkSelect id="transmission" name="transmission" value={formData.transmission} onChange={handleInputChange}>
                <option value="manual">{t("manual")}</option>
                <option value="automatic">{t("automatic")}</option>
              </DarkSelect>
            </div>
            <div><FL>{t("fuelType")}</FL>
              <DarkSelect id="fuel_type" name="fuel_type" value={formData.fuel_type} onChange={handleInputChange}>
                <option value="petrol">{t("petrol")}</option>
                <option value="diesel">{t("diesel")}</option>
                <option value="electric">{t("electric")}</option>
                <option value="hybrid">{t("hybrid")}</option>
              </DarkSelect>
            </div>
            <div><FL>{t("seats")}</FL><DarkInput id="seats" name="seats" type="number" value={formData.seats} onChange={handleInputChange} min="1" max="20" /></div>
            <div><FL>{t("status")}</FL>
              <DarkSelect id="status" name="status" value={formData.status} onChange={handleInputChange}>
                <option value="available">{t("available")}</option>
                <option value="rented">{t("rented")}</option>
                <option value="maintenance">{t("maintenance")}</option>
                <option value="retired">{t("retired")}</option>
              </DarkSelect>
            </div>
          </Grid>
        </SectionCard>

        {/* maintenance config */}
        <SectionCard title={t("maintenanceConfiguration")}>
          <Grid>
            <div><FL>{t("currentMileage")}</FL><DarkInput id="mileage" name="mileage" type="number" value={formData.mileage} onChange={handleInputChange} min="0" /></div>
            <div><FL>{t("maintenanceInterval")}</FL><DarkInput id="maintenance_interval_km" name="maintenance_interval_km" type="number" value={formData.maintenance_interval_km} onChange={handleInputChange} min="1000" step="100" /></div>
            <div><FL>{t("alertThreshold")}</FL><DarkInput id="maintenance_alert_threshold" name="maintenance_alert_threshold" type="number" value={formData.maintenance_alert_threshold} onChange={handleInputChange} min="50" step="10" /></div>
            <div><FL>{t("lastMaintenance")}</FL><DarkInput id="last_maintenance_mileage" name="last_maintenance_mileage" type="number" value={formData.last_maintenance_mileage} onChange={handleInputChange} min="0" /></div>
            <div><FL>{t("nextMaintenance")}</FL><DarkInput id="next_maintenance_mileage" name="next_maintenance_mileage" type="number" value={formData.next_maintenance_mileage} onChange={handleInputChange} min="0" /></div>
          </Grid>
        </SectionCard>

        {/* pricing */}
        <SectionCard title={t("pricingPurchase")}>
          <Grid>
            <div><FL req>{t("dailyRate")}</FL><DarkInput id="daily_rate" name="daily_rate" type="number" value={formData.daily_rate} onChange={handleInputChange} min="0" step="0.01" /></div>
            <div><FL>{t("purchasePrice")}</FL><DarkInput id="purchase_price" name="purchase_price" type="number" value={formData.purchase_price} onChange={handleInputChange} min="0" step="0.01" /></div>
            <div><FL>{t("purchaseDate")}</FL><DarkInput id="purchase_date" name="purchase_date" type="date" value={formData.purchase_date} onChange={handleInputChange} /></div>
          </Grid>
        </SectionCard>

        {/* notes */}
        <SectionCard title={t("notes")}>
          <DarkTextarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder={t("notes")} rows={4} />
        </SectionCard>

        {/* actions */}
        <div style={{ display:"flex", gap:10 }}>
          <GhostBtn type="button" onClick={() => router.back()} disabled={loading}>{t("cancel")}</GhostBtn>
          <PrimaryBtn type="submit" disabled={loading}>
            {loading
              ? <><span style={{ width:13, height:13, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", display:"inline-block", animation:"av-spin 0.7s linear infinite" }} /> {t("saving")}</>
              : <><span style={{ width:13, height:13, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", display:"inline-block" }} /> {t("saveVehicle")}</>}
          </PrimaryBtn>
        </div>
      </form>
    </div>
  )
}