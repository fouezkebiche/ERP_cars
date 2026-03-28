"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import {
  Car, TrendingUp, RefreshCw, AlertTriangle,
  DollarSign, FileText, Building2, ChevronLeft, ChevronRight,
  Flame, Award, BarChart2, MapPin, X,
} from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

interface Wilaya {
  id: string; code: string; name: string; ar_name: string
  longitude: string; latitude: string
}
interface Commune {
  id: string; post_code: string; name: string; wilaya_id: string
  ar_name: string; longitude: string; latitude: string
}

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : ""
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
}
async function apiFetch(path: string) {
  const res = await fetch(`${API}${path}`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()).data
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg ${className}`} style={{ background: "rgba(255,255,255,0.05)" }} />
}

function HBar({ label, sublabel, value, max, color, rank, revenue }: {
  label: string; sublabel?: string; value: number; max: number
  color: string; rank: number; revenue?: number
}) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className={`relative rounded-xl p-4 transition-all ${rank === 1 ? "ring-1" : ""}`}
      style={{ background: rank === 1 ? `${color}0d` : "rgba(255,255,255,0.02)", border: `1px solid ${rank === 1 ? color + "30" : "rgba(255,255,255,0.05)"}` }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black"
          style={{ background: rank <= 3 ? `${color}20` : "rgba(255,255,255,0.05)", color: rank <= 3 ? color : "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
          {rank <= 3 ? ["🥇","🥈","🥉"][rank-1] : `#${rank}`}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{label}</p>
          {sublabel && <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>{sublabel}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-black" style={{ color, fontFamily: "monospace" }}>{value}</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>rentals</p>
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
      </div>
      {revenue !== undefined && (
        <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
          {revenue.toLocaleString("fr-DZ")} DZD revenue
        </p>
      )}
    </div>
  )
}

function CategoryChart({ data }: { data: { category: string; count: number; revenue: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (total === 0) return null
  const COLORS = ["#f59e0b","#818cf8","#34d399","#f87171","#60a5fa","#c084fc","#fb923c"]
  const r = 52; const cx = 64; const cy = 64; const strokeW = 16
  let cumAngle = -90
  return (
    <div className="flex items-center gap-6">
      <div className="shrink-0">
        <svg width={128} height={128} viewBox="0 0 128 128">
          {data.map((seg, i) => {
            const angle = (seg.count / total) * 360
            if (angle < 1) { cumAngle += angle; return null }
            const s = (cumAngle * Math.PI) / 180; const e = ((cumAngle + angle) * Math.PI) / 180
            const x1 = cx + r*Math.cos(s); const y1 = cy + r*Math.sin(s)
            const x2 = cx + r*Math.cos(e); const y2 = cy + r*Math.sin(e)
            const path = `M ${x1} ${y1} A ${r} ${r} 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2}`
            cumAngle += angle
            return <path key={i} d={path} fill="none" stroke={COLORS[i%COLORS.length]} strokeWidth={strokeW} strokeLinecap="butt" />
          })}
          <circle cx={cx} cy={cy} r={r - strokeW/2 - 2} fill="#080810" />
          <text x={cx} y={cy-5} textAnchor="middle" fill="white" fontSize="14" fontWeight="900" fontFamily="monospace">{total}</text>
          <text x={cx} y={cy+11} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="monospace">rentals</text>
        </svg>
      </div>
      <div className="flex-1 space-y-2">
        {data.map((d, i) => (
          <div key={d.category} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i%COLORS.length] }} />
              <span className="text-xs truncate capitalize" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>{d.category || "Other"}</span>
            </div>
            <span className="text-xs font-bold shrink-0" style={{ color: COLORS[i%COLORS.length], fontFamily: "monospace" }}>
              {Math.round((d.count/total)*100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PeriodBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
      style={{ background: active ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${active ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.08)"}`, color: active ? "#f59e0b" : "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
      {label}
    </button>
  )
}

function LocationTag({ wilaya, commune, onClear }: { wilaya: string; commune: string; onClear: () => void }) {
  if (!wilaya) return null
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
      style={{ background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.3)", color: "#60a5fa", fontFamily: "monospace" }}>
      <MapPin size={10} />
      {commune ? `${commune}, ${wilaya}` : wilaya}
      <button onClick={onClear} className="ml-1 opacity-60 hover:opacity-100 transition-opacity"><X size={10} /></button>
    </div>
  )
}

export default function TrendingVehiclesPage() {
  const [wilayas, setWilayas]       = useState<Wilaya[]>([])
  const [communes, setCommunes]     = useState<Commune[]>([])
  const [geoLoading, setGeoLoading] = useState(true)
  const [data, setData]             = useState<any>(null)
  const [companies, setCompanies]   = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError]           = useState("")
  const [period, setPeriod]         = useState<"7d"|"30d"|"90d"|"365d">("30d")
  const [companyFilter, setCompanyFilter] = useState("")
  const [companyPage, setCompanyPage]     = useState(0)
  const [selectedWilaya,  setSelectedWilaya]  = useState<Wilaya | null>(null)
  const [selectedCommune, setSelectedCommune] = useState<Commune | null>(null)
  const [appliedWilaya,  setAppliedWilaya]  = useState("")
  const [appliedCommune, setAppliedCommune] = useState("")

  // ✅ Ref holds the live filter values — fetchData always reads the latest
  // without needing them in its dependency array (avoids stale closure)
  const filterRef = useRef({ wilaya: "", commune: "" })

  const COMPANY_PAGE_SIZE = 5
  const RANK_COLORS = ["#f59e0b","#818cf8","#34d399","#60a5fa","#c084fc","#fb923c","#f87171","#34d399","#818cf8","#f59e0b"]
  const PERIOD_LABELS: Record<string,string> = { "7d":"Last 7 days","30d":"Last 30 days","90d":"Last 90 days","365d":"Last year" }

  // Load geo JSON
  useEffect(() => {
    async function load() {
      try {
        const [wRes, cRes] = await Promise.all([fetch("/Wilaya_Of_Algeria.json"), fetch("/Commune_Of_Algeria.json")])
        if (!wRes.ok) throw new Error("Wilaya_Of_Algeria.json not found in /public")
        if (!cRes.ok) throw new Error("Commune_Of_Algeria.json not found in /public")
        const [wData, cData]: [Wilaya[], Commune[]] = await Promise.all([wRes.json(), cRes.json()])
        setWilayas(wData.sort((a,b) => parseInt(a.id) - parseInt(b.id)))
        setCommunes(cData)
      } catch (e: any) {
        console.error("Geo data load failed:", e.message)
      } finally {
        setGeoLoading(false)
      }
    }
    load()
  }, [])

  const availableCommunes = selectedWilaya
    ? communes.filter(c => c.wilaya_id === selectedWilaya.id).sort((a,b) => a.name.localeCompare(b.name))
    : []

  // ✅ fetchData accepts explicit overrides so Apply can pass values directly
  // without waiting for setState to complete
  const fetchData = useCallback(async (overrides: { wilaya?: string; commune?: string; isRefresh?: boolean } = {}) => {
    const w = overrides.wilaya  !== undefined ? overrides.wilaya  : filterRef.current.wilaya
    const c = overrides.commune !== undefined ? overrides.commune : filterRef.current.commune

    overrides.isRefresh ? setRefreshing(true) : setLoading(true)
    setError("")

    try {
      const params = new URLSearchParams({ period, limit: "15" })
      if (companyFilter) params.set("company_id", companyFilter)
      if (w) params.set("wilaya",   w)
      if (c) params.set("baladiya", c)

      console.log("📡 Fetching:", params.toString())

      const [trendData, companiesData] = await Promise.all([
        apiFetch(`/api/admin/analytics/trending-vehicles?${params}`),
        apiFetch("/api/admin/companies?limit=100&sort_by=name&sort_order=ASC"),
      ])
      setData(trendData)
      setCompanies(companiesData?.companies || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [period, companyFilter])

  useEffect(() => { fetchData() }, [fetchData])

  // ✅ Apply: commit values to ref synchronously, then fetch immediately
  const handleApply = () => {
    const w = selectedWilaya?.name  ?? ""
    const c = selectedCommune?.name ?? ""
    filterRef.current = { wilaya: w, commune: c }
    setAppliedWilaya(w)
    setAppliedCommune(c)
    setCompanyPage(0)
    fetchData({ wilaya: w, commune: c, isRefresh: true })
  }

  const clearLocation = () => {
    setSelectedWilaya(null)
    setSelectedCommune(null)
    filterRef.current = { wilaya: "", commune: "" }
    setAppliedWilaya("")
    setAppliedCommune("")
    setCompanyPage(0)
    fetchData({ wilaya: "", commune: "", isRefresh: true })
  }

  const topVehicles: any[]       = data?.top_vehicles       || []
  const categoryBreakdown: any[] = data?.category_breakdown || []
  const companyLeaders: any[]    = data?.company_leaders    || []
  const stats                    = data?.stats
  const maxContracts = topVehicles[0]?.contract_count || 1
  const leaderPages  = Math.ceil(companyLeaders.length / COMPANY_PAGE_SIZE)
  const visibleLeaders = companyLeaders.slice(companyPage*COMPANY_PAGE_SIZE, (companyPage+1)*COMPANY_PAGE_SIZE)

  const subtitle = appliedCommune
    ? `Trending in ${appliedCommune}, ${appliedWilaya} · ${PERIOD_LABELS[period]}`
    : appliedWilaya ? `Trending in ${appliedWilaya} wilaya · ${PERIOD_LABELS[period]}`
    : `Most rented vehicles across the platform · ${PERIOD_LABELS[period]}`

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame size={18} style={{ color: "#f59e0b" }} />
            <h1 className="text-xl font-black text-white" style={{ fontFamily: "monospace" }}>Trending Vehicles</h1>
          </div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            {(["7d","30d","90d","365d"] as const).map(p => (
              <PeriodBtn key={p} active={period===p} label={p} onClick={() => setPeriod(p)} />
            ))}
          </div>
          <select value={companyFilter} onChange={e => { setCompanyFilter(e.target.value); setCompanyPage(0) }}
            className="h-8 rounded-lg px-3 text-xs outline-none"
            style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.1)", color: companyFilter ? "#f59e0b" : "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
            <option value="">All Companies</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => fetchData({ isRefresh: true })} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b", fontFamily: "monospace" }}>
            <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Location Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl px-4 py-3"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2 shrink-0">
          <MapPin size={13} style={{ color: "#60a5fa" }} />
          <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>Location</span>
        </div>

        {/* Wilaya */}
        <select value={selectedWilaya?.id ?? ""} disabled={geoLoading}
          onChange={e => { setSelectedWilaya(wilayas.find(w => w.id === e.target.value) ?? null); setSelectedCommune(null) }}
          className="h-8 rounded-lg px-3 text-xs outline-none"
          style={{ background: "#0d0d14", border: `1px solid ${selectedWilaya ? "rgba(96,165,250,0.4)" : "rgba(255,255,255,0.1)"}`, color: selectedWilaya ? "#60a5fa" : "rgba(255,255,255,0.5)", fontFamily: "monospace", minWidth: 210, opacity: geoLoading ? 0.4 : 1 }}>
          <option value="">{geoLoading ? "Loading wilayas…" : "All Wilayas"}</option>
          {wilayas.map(w => <option key={w.id} value={w.id}>{w.code.padStart(2,"0")} — {w.name}</option>)}
        </select>

        {/* Commune */}
        <select value={selectedCommune?.id ?? ""} disabled={!selectedWilaya || geoLoading}
          onChange={e => setSelectedCommune(availableCommunes.find(c => c.id === e.target.value) ?? null)}
          className="h-8 rounded-lg px-3 text-xs outline-none"
          style={{ background: "#0d0d14", border: `1px solid ${selectedCommune ? "rgba(96,165,250,0.4)" : "rgba(255,255,255,0.1)"}`, color: selectedCommune ? "#60a5fa" : "rgba(255,255,255,0.5)", fontFamily: "monospace", minWidth: 230, opacity: selectedWilaya ? 1 : 0.4, cursor: selectedWilaya ? "pointer" : "not-allowed" }}>
          <option value="">{!selectedWilaya ? "Select a wilaya first" : `All ${selectedWilaya.name} communes`}</option>
          {availableCommunes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {/* Apply */}
        <button onClick={handleApply} disabled={refreshing || geoLoading || !selectedWilaya}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={{ background: selectedWilaya ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${selectedWilaya ? "rgba(96,165,250,0.3)" : "rgba(255,255,255,0.1)"}`, color: selectedWilaya ? "#60a5fa" : "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
          <RefreshCw size={10} className={refreshing ? "animate-spin" : ""} />
          Apply
        </button>

        <LocationTag wilaya={appliedWilaya} commune={appliedCommune} onClear={clearLocation} />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}>
          <AlertTriangle size={14} style={{ color: "#f87171" }} />
          <span className="text-xs" style={{ color: "#f87171", fontFamily: "monospace" }}>{error}</span>
          <button onClick={() => fetchData()} className="ml-auto text-xs underline" style={{ color: "#f87171" }}>Retry</button>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Rentals",    value: stats?.total_contracts,  suffix: "",     icon: <FileText size={15} />,  accent: "#f59e0b" },
          { label: "Total Revenue",    value: stats?.total_revenue != null ? Math.round(stats.total_revenue).toLocaleString("fr-DZ") : "—", suffix: stats?.total_revenue != null ? " DZD" : "", icon: <DollarSign size={15} />, accent: "#34d399" },
          { label: "Active Vehicles",  value: stats?.unique_vehicles,  suffix: "",     icon: <Car size={15} />,       accent: "#818cf8" },
          { label: "Active Companies", value: stats?.unique_companies, suffix: "",     icon: <Building2 size={15} />, accent: "#60a5fa" },
        ].map(({ label, value, suffix, icon, accent }) => (
          <div key={label} className="rounded-xl p-4 relative overflow-hidden"
            style={{ background: "#080810", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none rounded-full"
              style={{ background: `radial-gradient(circle, ${accent}15 0%, transparent 70%)`, transform: "translate(30%,-30%)" }} />
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{label}</p>
              <div style={{ color: `${accent}99` }}>{icon}</div>
            </div>
            {loading ? <Skeleton className="h-8 w-20" />
              : <p className="text-2xl font-black text-white" style={{ fontFamily: "monospace" }}>{value ?? "—"}{value != null && suffix}</p>}
          </div>
        ))}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: "#080810", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2 mb-5">
            <Award size={15} style={{ color: "#f59e0b" }} />
            <h2 className="text-sm font-black text-white" style={{ fontFamily: "monospace" }}>Top Vehicles Ranking</h2>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", fontFamily: "monospace" }}>{PERIOD_LABELS[period]}</span>
          </div>
          {loading ? <div className="space-y-3">{Array(6).fill(0).map((_,i) => <Skeleton key={i} className="h-20" />)}</div>
            : topVehicles.length === 0
              ? <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Car className="opacity-10 text-white" size={40} />
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
                    No rental data for this period{appliedWilaya ? ` in ${appliedCommune || appliedWilaya}` : ""}
                  </p>
                </div>
              : <div className="space-y-2">
                  {topVehicles.map((v,i) => (
                    <HBar key={v.vehicle_id} rank={i+1}
                      label={`${v.make} ${v.model} ${v.year}`}
                      sublabel={`${v.license_plate}${v.company_name ? ` · ${v.company_name}` : ""}${v.category ? ` · ${v.category}` : ""}`}
                      value={v.contract_count} max={maxContracts}
                      color={RANK_COLORS[i%RANK_COLORS.length]} revenue={v.total_revenue} />
                  ))}
                </div>
          }
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl p-5" style={{ background: "#080810", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 size={14} style={{ color: "#818cf8" }} />
              <h3 className="text-sm font-black text-white" style={{ fontFamily: "monospace" }}>By Category</h3>
            </div>
            {loading ? <Skeleton className="h-32 w-full" />
              : categoryBreakdown.length > 0 ? <CategoryChart data={categoryBreakdown} />
              : <p className="text-xs text-center py-6" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>No category data</p>}
          </div>

          {!loading && topVehicles.length >= 3 && (
            <div className="rounded-2xl p-5" style={{ background: "#080810", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h3 className="text-sm font-black text-white mb-4" style={{ fontFamily: "monospace" }}>🏆 Podium</h3>
              <div className="space-y-2">
                {topVehicles.slice(0,3).map((v,i) => {
                  const medals = ["#f59e0b","#94a3b8","#cd7c3a"]
                  return (
                    <div key={v.vehicle_id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: `${medals[i]}08`, border: `1px solid ${medals[i]}20` }}>
                      <div className="text-lg">{["🥇","🥈","🥉"][i]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{v.make} {v.model}</p>
                        <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{v.license_plate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black" style={{ color: medals[i], fontFamily: "monospace" }}>{v.contract_count}</p>
                        <p className="text-xs" style={{ color: medals[i]+"80", fontFamily: "monospace" }}>{["Gold","Silver","Bronze"][i]}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Per-Company Leaders */}
      {!companyFilter && (
        <div className="rounded-2xl p-5" style={{ background: "#080810", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} style={{ color: "#60a5fa" }} />
              <h2 className="text-sm font-black text-white" style={{ fontFamily: "monospace" }}>#1 Vehicle per Company</h2>
              {appliedWilaya && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(96,165,250,0.1)", color: "#60a5fa", fontFamily: "monospace" }}>
                  {appliedCommune || appliedWilaya}
                </span>
              )}
            </div>
            {leaderPages > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => setCompanyPage(p => Math.max(0,p-1))} disabled={companyPage===0} className="p-1 rounded disabled:opacity-30" style={{ color: "rgba(255,255,255,0.4)" }}><ChevronLeft size={14} /></button>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{companyPage+1}/{leaderPages}</span>
                <button onClick={() => setCompanyPage(p => Math.min(leaderPages-1,p+1))} disabled={companyPage===leaderPages-1} className="p-1 rounded disabled:opacity-30" style={{ color: "rgba(255,255,255,0.4)" }}><ChevronRight size={14} /></button>
              </div>
            )}
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{Array(6).fill(0).map((_,i) => <Skeleton key={i} className="h-24" />)}</div>
          ) : companyLeaders.length === 0 ? (
            <p className="text-xs text-center py-8" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
              No data available{appliedWilaya ? ` in ${appliedCommune || appliedWilaya}` : ""}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {visibleLeaders.map(c => (
                <div key={c.company_id} className="rounded-xl p-4 cursor-default"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black shrink-0" style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa" }}>
                      {c.company_name?.charAt(0)?.toUpperCase()}
                    </div>
                    <p className="text-xs font-bold text-white truncate">{c.company_name}</p>
                  </div>
                  <p className="text-sm font-black text-white mb-0.5 truncate">{c.vehicle_label}</p>
                  <p className="text-xs mb-3 truncate" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{c.license_plate}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>rentals</span>
                    <span className="text-lg font-black" style={{ color: "#f59e0b", fontFamily: "monospace" }}>{c.contract_count}</span>
                  </div>
                  <div className="h-0.5 mt-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100,(c.contract_count/(companyLeaders[0]?.contract_count||1))*100)}%`, background: "#f59e0b" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Revenue Table */}
      {!loading && topVehicles.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#080810", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-sm font-black text-white" style={{ fontFamily: "monospace" }}>Revenue Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {["Rank","Vehicle","Company","Category","Rentals","Total Revenue","Avg / Rental"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topVehicles.map((v,i) => (
                  <tr key={v.vehicle_id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td className="px-5 py-3 text-xs font-black" style={{ color: RANK_COLORS[i%RANK_COLORS.length], fontFamily: "monospace" }}>#{i+1}</td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-bold text-white">{v.make} {v.model} {v.year}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{v.license_plate}</p>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{v.company_name || "—"}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-0.5 rounded capitalize" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{v.category || "—"}</span>
                    </td>
                    <td className="px-5 py-3 text-xs font-black" style={{ color: "#f59e0b", fontFamily: "monospace" }}>{v.contract_count}</td>
                    <td className="px-5 py-3 text-xs font-bold" style={{ color: "#34d399", fontFamily: "monospace" }}>{Math.round(v.total_revenue).toLocaleString("fr-DZ")} DZD</td>
                    <td className="px-5 py-3 text-xs" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{Math.round(v.avg_revenue).toLocaleString("fr-DZ")} DZD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}