// app/[locale]/dashboard/vehicles/[id]/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Edit2, Trash2, X, AlertCircle, Car, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { getVehicleById, deleteVehicle, type Vehicle } from "@/lib/vehicles.api"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { format } from "date-fns"
import { VehicleCostsTab }       from "@/components/dashboard/VehicleCostsTab"
import { VehiclePhotosTab }      from "@/components/dashboard/VehiclePhotosTab"
import { VehicleMaintenanceTab } from "@/components/dashboard/VehicleMaintenanceTab"
import { useNotifications } from "@/hooks/useNotifications"
import { useTranslations } from "next-intl"

/* ─── tokens ─────────────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const G_DIM   = "rgba(34,197,94,0.10)"
const G_GLOW  = "rgba(34,197,94,0.22)"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"

/* ── helpers ─────────────────────────────────────────────────── */
function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <p style={{ fontSize:11, color:"#9CA3AF", fontWeight:600, textTransform:"uppercase" as const, letterSpacing:"0.05em", marginBottom:4, fontFamily:FONT }}>{label}</p>
      <p style={{ fontSize:14, fontWeight:600, color:"#fff", textTransform:"capitalize" as const, fontFamily:mono?"monospace":FONT }}>{value}</p>
    </div>
  )
}
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding:"20px 22px", borderRadius:14, background:SURFACE, border:`1px solid ${BORDER}`, fontFamily:FONT, color:"#fff" }}>
      <h3 style={{ fontSize:14, fontWeight:700, letterSpacing:"-0.01em", marginBottom:16, color:"#fff" }}>{title}</h3>
      {children}
    </div>
  )
}

type Tab = "details"|"maintenance"|"costs"|"photos"

/* ═══════════════════════════════════════════════════════════════ */
export default function ViewVehiclePage() {
  const t = useTranslations("vehicles")
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  // ── all state & logic unchanged ──────────────────────────────
  const [vehicle, setVehicle]   = useState<Vehicle | null>(null)
  const [loading, setLoading]   = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("details")

  const { data: vehicleNotifsData, loading: notifsLoading, dismissNotification, restoreNotification } =
    useNotifications({ type: "vehicle_maintenance", vehicleId: id, unread: true })
  const vehicleNotifs = vehicleNotifsData?.notifications || []

  const fetchVehicle = async () => {
    if (!id) return
    setLoading(true)
    try {
      const response = await getVehicleById(id)
      if (response.success && response.data?.vehicle) {
        setVehicle(response.data.vehicle)
      } else {
        toast.error(t("failedToLoadDetails")); router.push("/dashboard/vehicles")
      }
    } catch (error: any) {
      const msg = error.details || error.message || t("failedToLoadDetails")
      toast.error(msg)
      if (error.statusCode === 404) router.push("/dashboard/vehicles")
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchVehicle() }, [id])

  const handleDismissNotif = (notifId: string) => dismissNotification(notifId)
  const handleRestoreNotif = (notifId: string) => restoreNotification(notifId)

  const handleDelete = async () => {
    if (!confirm(t("deleteConfirmDetailed"))) return
    setDeleting(true)
    try {
      const response = await deleteVehicle(id)
      if (response.success) { toast.success(t("deleteSuccess")); router.push("/dashboard/vehicles") }
    } catch (error: any) {
      toast.error(error?.details || error?.message || t("deleteError"))
    } finally { setDeleting(false) }
  }
  // ────────────────────────────────────────────────────────────

  /* ── loading ── */
  if (loading) return (
    <div style={{ display:"flex", justifyContent:"center", padding:"64px 0", fontFamily:FONT }}>
      <div style={{ width:34, height:34, border:`3px solid ${GREEN}`, borderTopColor:"transparent", borderRadius:"50%", animation:"vv-spin 0.8s linear infinite" }} />
      <style>{`@keyframes vv-spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  )

  /* ── not found ── */
  if (!vehicle) return (
    <div style={{ textAlign:"center", padding:"64px 24px", fontFamily:FONT, color:"#fff" }}>
      <Car size={40} color="#4B5563" style={{ margin:"0 auto 14px" }} />
      <p style={{ fontSize:14, color:"#9CA3AF", marginBottom:18 }}>Vehicle not found</p>
      <button onClick={() => router.push("/dashboard/vehicles")}
        style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"10px 18px", borderRadius:10, border:"none", background:GREEN, color:"#fff", fontFamily:FONT, fontSize:13, fontWeight:600, cursor:"pointer" }}>
        Back to Vehicles
      </button>
    </div>
  )

  const TABS: { key: Tab; label: string }[] = [
    { key:"details",     label:"Details" },
    { key:"maintenance", label:t("maintenance") },
    { key:"costs",       label:t("costs") },
    { key:"photos",      label:t("photos") },
  ]

  return (
    <div style={{ fontFamily:FONT, color:"#fff", display:"flex", flexDirection:"column", gap:24 }}>
      <style>{`@keyframes vv-spin { to { transform:rotate(360deg); } } @keyframes vv-fade { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }`}</style>

      {/* ── page header ── */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:14 }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
          <button onClick={() => router.back()}
            style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:9, background:"transparent", border:`1px solid ${BORDER}`, color:"#9CA3AF", fontFamily:FONT, fontSize:13, fontWeight:600, cursor:"pointer", flexShrink:0, transition:"all 0.18s" }}
            onMouseEnter={e => { e.currentTarget.style.color="#fff"; e.currentTarget.style.borderColor="rgba(255,255,255,0.18)" }}
            onMouseLeave={e => { e.currentTarget.style.color="#9CA3AF"; e.currentTarget.style.borderColor=BORDER }}>
            <ArrowLeft size={14} /> {t("back")}
          </button>
          <div>
            <h1 style={{ fontSize:24, fontWeight:800, letterSpacing:"-0.035em", marginBottom:4 }}>{vehicle.brand} {vehicle.model}</h1>
            <p style={{ fontSize:13, color:"#9CA3AF" }}>{t("vehicleDetails")}</p>
          </div>
        </div>

        {/* actions */}
        <div style={{ display:"flex", gap:8 }}>
          <EditBtn onClick={() => router.push(`/dashboard/vehicles/${id}/edit`)} disabled={deleting} label={t("edit")} />
          <DeleteBtn onClick={handleDelete} disabled={deleting} loading={deleting} label={t("delete")} labelLoading={t("deleting")} />
        </div>
      </div>

      {/* ── tab bar ── */}
      <div style={{ borderBottom:`1px solid ${BORDER}`, display:"flex", gap:0 }}>
        {TABS.map(tab => {
          const active = activeTab === tab.key
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ padding:"10px 18px", background:"none", border:"none", borderBottom:`2px solid ${active?GREEN:"transparent"}`, color:active?"#fff":"#9CA3AF", fontFamily:FONT, fontSize:13, fontWeight:active?700:500, cursor:"pointer", transition:"all 0.18s", marginBottom:-1 }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color="#fff" }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color="#9CA3AF" }}>
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── DETAILS TAB ── */}
      {activeTab === "details" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:14, animation:"vv-fade 0.3s ease" }}>

          {/* hero card */}
          <div style={{ borderRadius:14, overflow:"hidden", background:SURFACE, border:`1px solid ${BORDER}` }}>
            {vehicle.photos && vehicle.photos.length > 0 ? (
              <img src={vehicle.photos[0]} alt={`${vehicle.brand} ${vehicle.model}`} style={{ width:"100%", height:200, objectFit:"cover", display:"block" }} />
            ) : (
              <div style={{ height:200, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, background:"rgba(255,255,255,0.02)" }}>
                <Car size={32} color="#4B5563" />
                <span style={{ fontSize:12, color:"#6B7280" }}>{t("noImage")}</span>
              </div>
            )}
            <div style={{ padding:"14px 16px" }}>
              <StatusBadge status={vehicle.status as any} />
            </div>
          </div>

          {/* basic info */}
          <SectionCard title="Basic Information">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <InfoRow label={t("brand")} value={vehicle.brand} />
              <InfoRow label={t("model")} value={vehicle.model} />
              <InfoRow label={t("year")}  value={vehicle.year} />
              <InfoRow label="Registration" value={vehicle.registration_number} />
              {vehicle.vin   && <div style={{ gridColumn:"1/-1" }}><InfoRow label={t("vin")} value={vehicle.vin} mono /></div>}
              {vehicle.color && <InfoRow label={t("color")} value={vehicle.color} />}
            </div>
          </SectionCard>

          {/* specs */}
          <SectionCard title="Specifications">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <InfoRow label={t("transmission")} value={vehicle.transmission} />
              <InfoRow label="Fuel Type"         value={vehicle.fuel_type} />
              <InfoRow label={t("seats")}         value={`${vehicle.seats} seats`} />
              <InfoRow label="Current Mileage"    value={`${vehicle.mileage.toLocaleString()} km`} />
            </div>
          </SectionCard>

          {/* pricing */}
          <SectionCard title="Pricing & Purchase">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <InfoRow label={t("dailyRate")} value={`${vehicle.daily_rate.toLocaleString()} DZD`} />
              {vehicle.purchase_price && <>
                <InfoRow label={t("purchasePrice")} value={`${vehicle.purchase_price.toLocaleString()} DZD`} />
                <InfoRow label={t("purchaseDate")} value={vehicle.purchase_date ? format(new Date(vehicle.purchase_date), "PPP") : "N/A"} />
              </>}
            </div>
          </SectionCard>

          {/* notes */}
          {vehicle.notes && (
            <SectionCard title={t("notes")}>
              <p style={{ fontSize:13, color:"#D1D5DB", lineHeight:1.65, whiteSpace:"pre-wrap" }}>{vehicle.notes}</p>
            </SectionCard>
          )}
        </div>
      )}

      {/* ── MAINTENANCE TAB ── */}
      {activeTab === "maintenance" && (
        <div style={{ display:"flex", flexDirection:"column", gap:20, animation:"vv-fade 0.3s ease" }}>
          <VehicleMaintenanceTab vehicle={vehicle} onUpdate={fetchVehicle} />

          {(notifsLoading || vehicleNotifs.length > 0) && (
            <div style={{ padding:"20px 22px", borderRadius:14, background:SURFACE, border:`1px solid ${BORDER}` }}>
              <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
                <AlertCircle size={15} color="#F87171" />
                {t("vehicleAlerts", { count: vehicleNotifs.length })}
              </h3>

              {notifsLoading ? (
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"16px 0", fontSize:13, color:"#9CA3AF" }}>
                  <Loader2 size={14} style={{ animation:"vv-spin 0.8s linear infinite" }} />
                  {t("loadingAlerts")}
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10, maxHeight:280, overflowY:"auto" }}>
                  {vehicleNotifs.map((notif) => (
                    <div key={notif.id} style={{ padding:"14px 16px", borderRadius:10, background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.2)", borderLeft:"3px solid #EF4444" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:13, fontWeight:700, color:"#FCA5A5", marginBottom:5 }}>🚨 {notif.title}</p>
                          <p style={{ fontSize:12, color:"#9CA3AF", marginBottom:8 }}>{notif.message}</p>
                          {notif.data && Object.keys(notif.data).length > 0 && (
                            <div style={{ fontSize:11, color:"#6B7280", background:"rgba(255,255,255,0.03)", border:`1px solid ${BORDER}`, borderRadius:7, padding:"6px 10px", marginBottom:8, fontFamily:"monospace" }}>
                              {JSON.stringify(notif.data, null, 2).slice(0, 150)}…
                            </div>
                          )}
                          <p style={{ fontSize:11, color:"#6B7280" }}>
                            {new Date(notif.created_at).toLocaleString("fr-DZ", { year:"numeric", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}
                          </p>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                          {notif.dismissed && (
                            <button onClick={() => handleRestoreNotif(notif.id)}
                              style={{ padding:"4px 10px", background:"rgba(34,197,94,0.15)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:7, color:GREEN, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:FONT }}>
                              {t("restore")}
                            </button>
                          )}
                          <button onClick={() => handleDismissNotif(notif.id)} title={t("dismiss")}
                            style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:5, background:"transparent", border:"none", cursor:"pointer", color:"#F87171", borderRadius:6 }}>
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {vehicleNotifs.length === 0 && !notifsLoading && (
                    <p style={{ fontSize:13, color:"#9CA3AF", textAlign:"center", padding:"16px 0" }}>{t("noMaintenanceAlerts")}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "costs"  && <div style={{ animation:"vv-fade 0.3s ease" }}><VehicleCostsTab vehicleId={id} /></div>}
      {activeTab === "photos" && <div style={{ animation:"vv-fade 0.3s ease" }}><VehiclePhotosTab vehicle={vehicle} onUpdate={fetchVehicle} /></div>}
    </div>
  )
}

/* ── header action buttons ───────────────────────────────────── */
function EditBtn({ onClick, disabled, label }: { onClick: () => void; disabled?: boolean; label: string }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => !disabled && setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"9px 16px", borderRadius:10, fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif", fontSize:13, fontWeight:600, cursor:disabled?"not-allowed":"pointer", background:hov?"rgba(255,255,255,0.07)":"transparent", border:`1px solid ${hov?"rgba(255,255,255,0.18)":"rgba(255,255,255,0.07)"}`, color:hov?"#fff":"#9CA3AF", transition:"all 0.18s" }}>
      <Edit2 size={13} /> {label}
    </button>
  )
}
function DeleteBtn({ onClick, disabled, loading, label, labelLoading }: { onClick: () => void; disabled?: boolean; loading?: boolean; label: string; labelLoading: string }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => !disabled && setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"9px 16px", borderRadius:10, fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif", fontSize:13, fontWeight:600, cursor:disabled?"not-allowed":"pointer", background:hov?"rgba(239,68,68,0.1)":"transparent", border:`1px solid ${hov?"rgba(239,68,68,0.35)":"rgba(239,68,68,0.2)"}`, color:hov?"#F87171":"#EF4444", transition:"all 0.18s" }}>
      {loading
        ? <><span style={{ width:12, height:12, border:"2px solid rgba(248,113,113,0.3)", borderTopColor:"#F87171", borderRadius:"50%", display:"inline-block", animation:"vv-spin 0.7s linear infinite" }} /> {labelLoading}</>
        : <><Trash2 size={13} /> {label}</>}
    </button>
  )
}