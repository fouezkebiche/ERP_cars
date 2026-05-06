// app/[locale]/dashboard/vehicles/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Plus, Search, Grid2X2, List, Eye, Edit2, Trash2, Car } from "lucide-react"
import toast from "react-hot-toast"
import { getVehicles, deleteVehicle, type Vehicle } from "@/lib/vehicles.api"
import { useNotifications } from "@/hooks/useNotifications"
import { useTranslations } from "next-intl"

/* ─── tokens ─────────────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const G_DIM   = "rgba(34,197,94,0.10)"
const G_GLOW  = "rgba(34,197,94,0.22)"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"

/* ── tiny shared button helpers ─────────────────────────────── */
function PrimaryBtn({ children, onClick, style = {} }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"9px 18px", borderRadius:10, border:"none", fontFamily:FONT, fontSize:13, fontWeight:600, cursor:"pointer", background:hov?"#16A34A":GREEN, color:"#fff", boxShadow:hov?`0 0 20px ${G_GLOW}`:"none", transform:hov?"translateY(-1px)":"none", transition:"all 0.2s", ...style }}>
      {children}
    </button>
  )
}

function GhostBtn({ children, onClick, disabled, style = {} }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; style?: React.CSSProperties }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => !disabled && setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:9, fontFamily:FONT, fontSize:12, fontWeight:600, cursor:disabled?"not-allowed":"pointer", background:hov?"rgba(255,255,255,0.06)":"transparent", border:`1px solid ${BORDER}`, color:disabled?"#4B5563":hov?"#fff":"#9CA3AF", transition:"all 0.2s", ...style }}>
      {children}
    </button>
  )
}

function IconBtn({ children, onClick, danger }: { children: React.ReactNode; onClick?: () => void; danger?: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:8, border:"none", cursor:"pointer", background:hov?(danger?"rgba(239,68,68,0.15)":"rgba(255,255,255,0.07)"):"transparent", color:danger?(hov?"#F87171":"#EF4444"):(hov?"#fff":"#9CA3AF"), transition:"all 0.18s" }}>
      {children}
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
export default function VehiclesPage() {
  const t = useTranslations("vehicles")
  const router = useRouter()

  // ── all state & logic unchanged ──────────────────────────────
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading]   = useState(true)
  const [filters, setFilters]   = useState({ status: "all", search: "" })
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 0 })
  const [searchFocus, setSearchFocus] = useState(false)

  const { data: vehicleAlertsData, loading: alertsLoading } = useNotifications({ type: "vehicle_maintenance", limit: 100, unread: true })
  const alertsByVehicle = vehicleAlertsData?.notifications.reduce((acc: { [key: string]: number }, notif) => {
    const vid = notif.data?.vehicle_id
    if (vid) acc[vid] = (acc[vid] || 0) + 1
    return acc
  }, {}) || {}

  const fetchVehicles = async () => {
    setLoading(true)
    try {
      const response = await getVehicles({
        status: filters.status !== "all" ? filters.status : undefined,
        search: filters.search || undefined,
        page: pagination.page, limit: pagination.limit,
        sort_by: "created_at", sort_order: "DESC",
      })
      if (response.success) {
        setVehicles(response.data.vehicles)
        if (response.meta?.pagination) {
          setPagination(prev => ({ ...prev, total: response.meta!.pagination.total, total_pages: response.meta!.pagination.total_pages }))
        }
      }
    } catch (error: any) {
      console.error("Failed to fetch vehicles:", error)
      toast.error(error.message || t("failedToLoad"))
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchVehicles() }, [filters.status, pagination.page])
  useEffect(() => {
    const timer = setTimeout(() => { if (filters.search !== undefined) fetchVehicles() }, 500)
    return () => clearTimeout(timer)
  }, [filters.search])

  const handleDelete = async (vehicleId: string) => {
    if (!confirm(t("deleteConfirm"))) return
    try {
      const response = await deleteVehicle(vehicleId)
      if (response.success) { toast.success(t("vehicleDeleted")); fetchVehicles() }
    } catch (error: any) { toast.error(error.details || t("failedToDelete")) }
  }
  // ────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: FONT, color: "#fff", display: "flex", flexDirection: "column", gap: 28 }}>
      <style>{`
        @keyframes vp-spin { to { transform:rotate(360deg); } }
        @keyframes vp-fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        ::placeholder { color:#4B5563!important; }
      `}</style>

      {/* ── page header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.035em", marginBottom: 5 }}>{t("title")}</h1>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>{t("subtitle")}</p>
        </div>
        <PrimaryBtn onClick={() => router.push("/dashboard/vehicles/new")}>
          <Plus size={14} /> {t("addVehicle")}
        </PrimaryBtn>
      </div>

      {/* ── filters + view toggle ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 10, flex: 1, maxWidth: 480, flexWrap: "wrap" }}>

          {/* search */}
          <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
            <Search size={13} color="#6B7280" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              placeholder={t("searchPlaceholder")}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
              style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 10, background: searchFocus ? "rgba(255,255,255,0.07)" : SURFACE, border: `1px solid ${searchFocus ? "rgba(34,197,94,0.4)" : BORDER}`, color: "#fff", fontFamily: FONT, fontSize: 13, outline: "none", transition: "all 0.2s", boxSizing: "border-box" }}
            />
          </div>

          {/* status filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            style={{ padding: "9px 13px", borderRadius: 10, background: "#0A0E14", border: `1px solid ${BORDER}`, color: "#fff", fontFamily: FONT, fontSize: 13, outline: "none", cursor: "pointer", appearance: "none" as const }}
          >
            <option value="all">{t("allStatus")}</option>
            <option value="available">{t("available")}</option>
            <option value="rented">{t("rented")}</option>
            <option value="maintenance">{t("maintenance")}</option>
            <option value="retired">{t("retired")}</option>
          </select>
        </div>

        {/* view toggle */}
        <div style={{ display: "flex", gap: 4, padding: 4, borderRadius: 10, background: SURFACE, border: `1px solid ${BORDER}` }}>
          {(["grid", "list"] as const).map((mode) => {
            const active = viewMode === mode
            const Icon = mode === "grid" ? Grid2X2 : List
            return (
              <button key={mode} onClick={() => setViewMode(mode)}
                style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "none", cursor: "pointer", background: active ? GREEN : "transparent", color: active ? "#fff" : "#9CA3AF", transition: "all 0.18s" }}>
                <Icon size={15} />
              </button>
            )
          })}
        </div>
      </div>

      {/* ── loading ── */}
      {(loading || alertsLoading) && (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <div style={{ width: 34, height: 34, border: `3px solid ${GREEN}`, borderTopColor: "transparent", borderRadius: "50%", animation: "vp-spin 0.8s linear infinite" }} />
        </div>
      )}

      {/* ── empty state ── */}
      {!loading && vehicles.length === 0 && (
        <div style={{ textAlign: "center", padding: "56px 24px", borderRadius: 16, border: `1px dashed ${BORDER}` }}>
          <Car size={40} color="#4B5563" style={{ margin: "0 auto 14px" }} />
          <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 18 }}>{t("noVehiclesFound")}</p>
          <PrimaryBtn onClick={() => router.push("/dashboard/vehicles/new")}>
            <Plus size={14} /> {t("addYourFirstVehicle")}
          </PrimaryBtn>
        </div>
      )}

      {/* ── GRID VIEW ── */}
      {!loading && viewMode === "grid" && vehicles.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {vehicles.map((vehicle, i) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              alertCount={alertsByVehicle[vehicle.id] || 0}
              t={t}
              onView={() => router.push(`/dashboard/vehicles/${vehicle.id}`)}
              onEdit={() => router.push(`/dashboard/vehicles/${vehicle.id}/edit`)}
              onDelete={() => handleDelete(vehicle.id)}
              animDelay={i * 0.04}
            />
          ))}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {!loading && viewMode === "list" && vehicles.length > 0 && (
        <DataTable
          columns={[
            {
              key: "brand", label: t("vehicle"), sortable: true,
              render: (_: any, row: any) => (
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{row.brand} {row.model}</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>{t("registration")}: {row.registration_number}</p>
                </div>
              ),
            },
            { key: "year",  label: t("year"),  sortable: true },
            { key: "daily_rate", label: t("dailyRate"), sortable: true, render: (v: any) => `${Number(v).toLocaleString()} DZD` },
            { key: "transmission", label: t("transmission"), render: (v: any) => <span style={{ textTransform: "capitalize" as const }}>{v}</span> },
            { key: "status", label: t("status"), sortable: true, render: (s: any) => <StatusBadge status={s} /> },
            {
              key: "alerts", label: t("alerts"),
              render: (_: any, row: any) => (
                alertsByVehicle[row.id] > 0
                  ? <StatusBadge status="critical" label={`(${alertsByVehicle[row.id]})`} />
                  : <span style={{ fontSize: 12, color: "#6B7280" }}>{t("none")}</span>
              ),
            },
            {
              key: "id", label: t("actions"),
              render: (id: any) => (
                <div style={{ display: "flex", gap: 4 }}>
                  <IconBtn onClick={() => router.push(`/dashboard/vehicles/${id}`)}><Eye size={14} /></IconBtn>
                  <IconBtn onClick={() => router.push(`/dashboard/vehicles/${id}/edit`)}><Edit2 size={14} /></IconBtn>
                  <IconBtn onClick={() => handleDelete(id as string)} danger><Trash2 size={14} /></IconBtn>
                </div>
              ),
            },
          ]}
          data={vehicles}
        />
      )}

      {/* ── pagination ── */}
      {!loading && vehicles.length > 0 && pagination.total_pages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            {t("showing")} {((pagination.page - 1) * pagination.limit) + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} {t("of")} {pagination.total} {t("vehicles")}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <GhostBtn disabled={pagination.page === 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>
              {t("previous")}
            </GhostBtn>

            {/* page numbers */}
            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === pagination.total_pages || Math.abs(n - pagination.page) <= 1)
                .reduce<(number | "…")[]>((acc, n, i, arr) => {
                  if (i > 0 && (n as number) - (arr[i - 1] as number) > 1) acc.push("…")
                  acc.push(n); return acc
                }, [])
                .map((n, i) => n === "…"
                  ? <span key={`e${i}`} style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#6B7280" }}>…</span>
                  : <PageBtn key={n} num={n as number} active={pagination.page === n} onClick={() => setPagination(p => ({ ...p, page: n as number }))} />
                )}
            </div>

            <GhostBtn disabled={pagination.page === pagination.total_pages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>
              {t("next")}
            </GhostBtn>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── vehicle grid card ───────────────────────────────────────── */
function VehicleCard({ vehicle, alertCount, t, onView, onEdit, onDelete, animDelay }: {
  vehicle: Vehicle; alertCount: number; t: any
  onView: () => void; onEdit: () => void; onDelete: () => void; animDelay: number
}) {
  const [hov, setHov] = useState(false)
  const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
  const SURFACE = "rgba(255,255,255,0.04)"
  const BORDER  = "rgba(255,255,255,0.07)"

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 16, overflow: "hidden",
        background: SURFACE,
        border: `1px solid ${hov ? "rgba(255,255,255,0.12)" : BORDER}`,
        transition: "all 0.22s",
        transform: hov ? "translateY(-2px)" : "none",
        boxShadow: hov ? "0 8px 32px rgba(0,0,0,0.35)" : "none",
        animation: `vp-fadeIn 0.4s ease ${animDelay}s both`,
        fontFamily: FONT, color: "#fff",
      }}
    >
      {/* photo */}
      <div style={{ height: 156, background: "rgba(255,255,255,0.03)", overflow: "hidden", position: "relative" }}>
        {vehicle.photos && vehicle.photos.length > 0 ? (
          <img src={vehicle.photos[0]} alt={`${vehicle.brand} ${vehicle.model}`}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s", transform: hov ? "scale(1.04)" : "scale(1)" }} />
        ) : (
          <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Car size={28} color="#4B5563" />
            <span style={{ fontSize: 12, color: "#6B7280" }}>{t("noImage")}</span>
          </div>
        )}
        {/* year badge */}
        <div style={{ position: "absolute", bottom: 8, left: 8, padding: "2px 8px", borderRadius: 6, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", fontSize: 11, fontWeight: 700, color: "#D1D5DB" }}>
          {vehicle.year}
        </div>
      </div>

      {/* body */}
      <div style={{ padding: "16px 18px" }}>
        {/* title row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {vehicle.brand} {vehicle.model}
            </h3>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>{t("registration")}: {vehicle.registration_number}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <StatusBadge status={vehicle.status as any} />
            {alertCount > 0 && <StatusBadge status="critical" label={`${alertCount}`} />}
          </div>
        </div>

        {/* specs grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px", marginBottom: 14 }}>
          {[
            { label: t("dailyRate"),    val: `${vehicle.daily_rate.toLocaleString()} DZD` },
            { label: t("transmission"), val: vehicle.transmission },
            { label: t("fuel"),         val: vehicle.fuel_type },
            { label: t("year"),         val: vehicle.year },
          ].map(({ label, val }) => (
            <div key={label}>
              <p style={{ fontSize: 10, color: "#6B7280", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>{label}</p>
              <p style={{ fontSize: 13, fontWeight: 600, textTransform: "capitalize" as const }}>{val}</p>
            </div>
          ))}
        </div>

        {/* action buttons */}
        <div style={{ display: "flex", gap: 7 }}>
          <CardActionBtn flex onClick={onView}><Eye size={13} /> {t("view")}</CardActionBtn>
          <CardActionBtn flex onClick={onEdit}><Edit2 size={13} /> {t("edit")}</CardActionBtn>
          <CardActionBtn danger onClick={onDelete}><Trash2 size={13} /></CardActionBtn>
        </div>
      </div>
    </div>
  )
}

function CardActionBtn({ children, onClick, flex, danger }: { children: React.ReactNode; onClick: () => void; flex?: boolean; danger?: boolean }) {
  const [hov, setHov] = useState(false)
  const BORDER = "rgba(255,255,255,0.07)"
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
        padding: "7px 12px", borderRadius: 9, border: `1px solid ${hov && danger ? "rgba(239,68,68,0.35)" : BORDER}`,
        fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer",
        flex: flex ? 1 : undefined,
        background: hov ? (danger ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.07)") : "transparent",
        color: danger ? (hov ? "#F87171" : "#EF4444") : (hov ? "#fff" : "#9CA3AF"),
        transition: "all 0.18s",
      }}>
      {children}
    </button>
  )
}

function PageBtn({ num, active, onClick }: { num: number; active: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  const GREEN = "#22C55E"
  const SURFACE = "rgba(255,255,255,0.04)"
  const BORDER = "rgba(255,255,255,0.07)"
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: `1px solid ${active ? "rgba(34,197,94,0.4)" : BORDER}`, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", fontSize: 13, fontWeight: active ? 700 : 500, cursor: "pointer", background: active ? "rgba(34,197,94,0.12)" : hov ? SURFACE : "transparent", color: active ? GREEN : hov ? "#fff" : "#9CA3AF", transition: "all 0.18s" }}>
      {num}
    </button>
  )
}