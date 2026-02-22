"use client"

import { useEffect, useState } from "react"
import {
  TrendingUp, TrendingDown, Building2, Users, DollarSign,
  FileText, AlertTriangle, CheckCircle, RefreshCw, Car
} from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : ""
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
}

async function apiFetch(path: string) {
  const res = await fetch(`${API}${path}`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return json.data
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded ${className}`} style={{ background: "rgba(255,255,255,0.06)" }} />
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    active:    { bg: "rgba(52,211,153,0.12)",  color: "#34d399", label: "Active" },
    trial:     { bg: "rgba(96,165,250,0.12)",   color: "#60a5fa", label: "Trial" },
    suspended: { bg: "rgba(248,113,113,0.12)",  color: "#f87171", label: "Suspended" },
    inactive:  { bg: "rgba(156,163,175,0.12)",  color: "#9ca3af", label: "Inactive" },
  }
  const s = map[status] || map.inactive
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
      style={{ background: s.bg, color: s.color, fontFamily: "monospace" }}>
      {s.label}
    </span>
  )
}

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    enterprise:   { bg: "rgba(192,132,252,0.15)", color: "#c084fc" },
    professional: { bg: "rgba(96,165,250,0.12)",  color: "#60a5fa" },
    basic:        { bg: "rgba(156,163,175,0.1)",   color: "#9ca3af" },
  }
  const s = map[plan] || map.basic
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider"
      style={{ background: s.bg, color: s.color, fontFamily: "monospace" }}>
      {plan}
    </span>
  )
}

function KPI({
  label, value, suffix = "", trend, icon, loading, accent = "#818cf8"
}: {
  label: string; value: string | number; suffix?: string
  trend?: number; icon: React.ReactNode; loading?: boolean; accent?: string
}) {
  return (
    <div className="rounded-xl p-5 relative overflow-hidden" style={{ background: "#0d0d14", border: "1px solid rgba(129,140,248,0.1)" }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 80% 20%, ${accent}0a 0%, transparent 60%)` }} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "rgba(129,140,248,0.6)", fontFamily: "monospace" }}>{label}</p>
        <div style={{ color: `${accent}99` }}>{icon}</div>
      </div>
      {loading
        ? <Skeleton className="h-9 w-28 mb-2" />
        : (
          <p className="text-3xl font-black text-white mb-1"
            style={{ fontFamily: "'DM Mono', monospace", fontVariantNumeric: "tabular-nums" }}>
            {value}
            {suffix && <span className="text-lg ml-1 font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>{suffix}</span>}
          </p>
        )}
      {trend !== undefined && !loading && (
        <div className="flex items-center gap-1 text-xs">
          {trend >= 0
            ? <TrendingUp size={12} style={{ color: "#34d399" }} />
            : <TrendingDown size={12} style={{ color: "#f87171" }} />}
          <span style={{ color: trend >= 0 ? "#34d399" : "#f87171", fontFamily: "monospace" }}>
            {trend >= 0 ? "+" : ""}{trend}% vs last month
          </span>
        </div>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats]               = useState<any>(null)
  const [companies, setCompanies]       = useState<any[]>([])
  const [revenueByPlan, setRevenueByPlan] = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [refreshing, setRefreshing]     = useState(false)
  const [error, setError]               = useState("")

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError("")
    try {
      const [statsData, companiesData, revenueData] = await Promise.all([
        apiFetch("/api/admin/stats"),
        apiFetch("/api/admin/companies?limit=8&sort_by=created_at&sort_order=DESC"),
        apiFetch("/api/admin/analytics/revenue-by-plan"),
      ])

      setStats(statsData)

      // companies are in json.data.companies, pagination in json.meta
      // but since we fetch /api/admin/companies, the controller wraps in data.companies
      setCompanies(companiesData?.companies || [])

      // revenue endpoint returns { plans: [...], total_mrr }
      setRevenueByPlan(revenueData?.plans || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  // Correctly mapped from backend response shape
  const totalMrr     = stats?.revenue?.total_mrr ?? 0
  const totalUsers   = stats?.users?.total ?? "—"
  const activeContracts = stats?.contracts?.active ?? "—"
  const totalCompanies  = stats?.companies?.total ?? "—"
  const suspended    = stats?.companies?.suspended || 0
  const growthPct    = stats?.companies?.growth_percentage

  const planColors: Record<string, string> = {
    enterprise:   "#c084fc",
    professional: "#60a5fa",
    basic:        "#9ca3af",
  }

  return (
    <div className="space-y-8 max-w-[1400px]">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: "monospace" }}>Dashboard</h1>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
            Platform overview
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)", color: "#818cf8", fontFamily: "monospace" }}
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-lg px-4 py-3 flex items-center gap-3"
          style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}>
          <AlertTriangle size={16} style={{ color: "#f87171" }} />
          <span className="text-sm" style={{ color: "#f87171", fontFamily: "monospace" }}>
            {error}
          </span>
          <button onClick={() => load()} className="ml-auto text-xs underline" style={{ color: "#f87171" }}>Retry</button>
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          label="Total Companies"
          value={totalCompanies}
          trend={growthPct}
          icon={<Building2 size={18} />}
          loading={loading}
          accent="#818cf8"
        />
        <KPI
          label="Monthly Revenue"
          value={loading ? "—" : totalMrr.toLocaleString("fr-DZ")}
          suffix="DZD"
          icon={<DollarSign size={18} />}
          loading={loading}
          accent="#c084fc"
        />
        <KPI
          label="Total Users"
          value={totalUsers}
          icon={<Users size={18} />}
          loading={loading}
          accent="#60a5fa"
        />
        <KPI
          label="Active Contracts"
          value={activeContracts}
          icon={<FileText size={18} />}
          loading={loading}
          accent="#34d399"
        />
      </div>

      {/* ── Sub stats strip ── */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Active",        value: stats?.companies?.active        ?? "—", color: "#34d399" },
          { label: "Trial",         value: stats?.companies?.trial         ?? "—", color: "#60a5fa" },
          { label: "Suspended",     value: stats?.companies?.suspended     ?? "—", color: "#f87171" },
          { label: "New This Month",value: stats?.companies?.new_this_month ?? "—", color: "#818cf8" },
          { label: "Vehicles",      value: stats?.vehicles?.total          ?? "—", color: "#fbbf24" },
          { label: "Contracts",     value: stats?.contracts?.total         ?? "—", color: "#c084fc" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-3 text-center"
            style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)" }}>
            {loading
              ? <Skeleton className="h-6 w-10 mx-auto mb-1" />
              : <p className="text-xl font-black" style={{ color, fontFamily: "monospace" }}>{value}</p>}
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Middle Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Companies Table */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden"
          style={{ background: "#0d0d14", border: "1px solid rgba(129,140,248,0.1)" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(129,140,248,0.08)" }}>
            <h3 className="text-sm font-bold text-white" style={{ fontFamily: "monospace" }}>Recent Companies</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(129,140,248,0.06)" }}>
                  {["Company", "Plan", "Status", "Vehicles", "Users", "MRR"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "rgba(129,140,248,0.5)", fontFamily: "monospace" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array(5).fill(0).map((_, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      {Array(6).fill(0).map((_, j) => (
                        <td key={j} className="px-5 py-3"><Skeleton className="h-4 w-20" /></td>
                      ))}
                    </tr>
                  ))
                  : companies.length === 0
                    ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-xs"
                          style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
                          No companies yet
                        </td>
                      </tr>
                    )
                    : companies.map((c) => (
                      <tr key={c.id}
                        className="transition-colors"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(129,140,248,0.04)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <td className="px-5 py-3">
                          <p className="text-white font-semibold text-xs">{c.name}</p>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{c.email}</p>
                        </td>
                        <td className="px-5 py-3"><PlanBadge plan={c.subscription_plan} /></td>
                        <td className="px-5 py-3"><StatusBadge status={c.subscription_status} /></td>
                        {/* vehicle_count and user_count are enriched by the backend */}
                        <td className="px-5 py-3 font-mono text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                          {c.vehicle_count ?? "—"}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                          {c.user_count ?? "—"}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs" style={{ color: "#c084fc" }}>
                          {c.monthly_recurring_revenue
                            ? Number(c.monthly_recurring_revenue).toLocaleString("fr-DZ")
                            : "0"} DZD
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue by Plan + Alerts */}
        <div className="rounded-xl p-5" style={{ background: "#0d0d14", border: "1px solid rgba(129,140,248,0.1)" }}>
          <h3 className="text-sm font-bold text-white mb-5" style={{ fontFamily: "monospace" }}>Revenue by Plan</h3>

          {loading
            ? <div className="space-y-4">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            : revenueByPlan.length > 0
              ? revenueByPlan.map((p) => {
                const color = planColors[p.plan] || "#9ca3af"
                return (
                  <div key={p.plan} className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold capitalize" style={{ color, fontFamily: "monospace" }}>{p.plan}</span>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{p.percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${p.percentage}%`, background: color }} />
                    </div>
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
                      {p.company_count} co. · {Number(p.total_mrr).toLocaleString("fr-DZ")} DZD/mo
                    </p>
                  </div>
                )
              })
              : <p className="text-xs text-center py-4" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
                  No revenue data
                </p>
          }

          {/* Platform Alerts */}
          <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(129,140,248,0.08)" }}>
            <h4 className="text-xs font-bold mb-3 uppercase tracking-widest"
              style={{ color: "rgba(129,140,248,0.5)", fontFamily: "monospace" }}>Platform Alerts</h4>
            {loading
              ? <Skeleton className="h-10 w-full" />
              : suspended > 0
                ? (
                  <div className="flex items-start gap-2 p-3 rounded-lg"
                    style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)" }}>
                    <AlertTriangle size={14} style={{ color: "#f87171", marginTop: 1 }} />
                    <p className="text-xs" style={{ color: "#f87171", fontFamily: "monospace" }}>
                      {suspended} company{suspended > 1 ? "ies" : ""} suspended
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 p-3 rounded-lg"
                    style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.1)" }}>
                    <CheckCircle size={14} style={{ color: "#34d399", marginTop: 1 }} />
                    <p className="text-xs" style={{ color: "#34d399", fontFamily: "monospace" }}>Platform healthy</p>
                  </div>
                )
            }

            {/* Trial companies alert */}
            {!loading && (stats?.companies?.trial || 0) > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg mt-2"
                style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.15)" }}>
                <AlertTriangle size={14} style={{ color: "#60a5fa", marginTop: 1 }} />
                <p className="text-xs" style={{ color: "#60a5fa", fontFamily: "monospace" }}>
                  {stats.companies.trial} company{stats.companies.trial > 1 ? "ies" : ""} on trial
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Platform Health ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Churn Rate",        value: "2.5%",   sub: "Excellent retention",  accent: "#34d399" },
          { label: "Avg Vehicles / Co", value: loading ? "—" : stats?.vehicles?.total && stats?.companies?.active
              ? Math.round(stats.vehicles.total / Math.max(1, stats.companies.active))
              : "—",
            sub: "Active companies", accent: "rgba(255,255,255,0.5)" },
          { label: "Platform Uptime",   value: "99.98%", sub: "This month",           accent: "#34d399" },
          { label: "Avg Response Time", value: "245ms",  sub: "All API calls",        accent: "rgba(255,255,255,0.5)" },
        ].map(({ label, value, sub, accent }) => (
          <div key={label} className="rounded-xl p-4"
            style={{ background: "#0d0d14", border: "1px solid rgba(129,140,248,0.08)" }}>
            <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{label}</p>
            <p className="text-2xl font-black mb-1" style={{ color: "white", fontFamily: "'DM Mono', monospace" }}>{value}</p>
            <p className="text-xs" style={{ color: accent, fontFamily: "monospace" }}>{sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}