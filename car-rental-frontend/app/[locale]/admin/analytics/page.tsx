"use client"

import { useEffect, useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import {
  TrendingUp, Users, DollarSign, Activity,
  ArrowUpRight, ArrowDownRight, RefreshCw,
  Building2, FileText, Zap, UserCheck,
  TrendingDown, BarChart3, Repeat2
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
  return (
    <div className={`animate-pulse rounded-lg ${className}`}
      style={{ background: "rgba(255,255,255,0.05)" }} />
  )
}

function KPI({ label, value, suffix = "", trend, icon, loading, accent = "#818cf8", vsLastMonth }: {
  label: string; value: string | number; suffix?: string
  trend?: number; icon: React.ReactNode; loading?: boolean; accent?: string; vsLastMonth: string
}) {
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden flex flex-col gap-3"
      style={{ background: "#080810", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`, transform: "translate(30%, -30%)" }} />
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>{label}</p>
        <div className="p-2 rounded-lg" style={{ background: `${accent}18`, color: accent }}>{icon}</div>
      </div>
      {loading
        ? <Skeleton className="h-9 w-32" />
        : <p className="text-3xl font-black text-white"
            style={{ fontFamily: "'DM Mono', 'Courier New', monospace", fontVariantNumeric: "tabular-nums" }}>
            {value}
            {suffix && <span className="text-base ml-1.5 font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>{suffix}</span>}
          </p>
      }
      {trend !== undefined && !loading && (
        <div className="flex items-center gap-1.5 text-xs">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: trend >= 0 ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: trend >= 0 ? "#34d399" : "#f87171" }}>
            {trend >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            <span style={{ fontFamily: "monospace" }}>{trend >= 0 ? "+" : ""}{trend}%</span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>{vsLastMonth}</span>
        </div>
      )}
    </div>
  )
}

function Sparkline({ data, color = "#c084fc" }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null
  const w = 400; const h = 100; const pad = 12
  const max = Math.max(...data); const min = Math.min(...data); const range = max - min || 1
  const pts = data.map((v, i) => [
    pad + (i / (data.length - 1)) * (w - pad * 2),
    h - pad - ((v - min) / range) * (h - pad * 2)
  ])
  let d = `M ${pts[0][0]},${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const cx = (pts[i - 1][0] + pts[i][0]) / 2
    d += ` C ${cx},${pts[i - 1][1]} ${cx},${pts[i][1]} ${pts[i][0]},${pts[i][1]}`
  }
  const area = `${d} L ${pts[pts.length - 1][0]},${h - pad} L ${pts[0][0]},${h - pad} Z`
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace('#', '')})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill={color} opacity={i === pts.length - 1 ? 1 : 0.4} />
      ))}
    </svg>
  )
}

function BarChart({ data, color = "#818cf8" }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
          <span className="text-xs font-mono font-bold" style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>
            {d.value > 0 ? d.value : ""}
          </span>
          <div className="w-full rounded-t-md transition-all duration-700"
            style={{ height: `${Math.max((d.value / max) * 80, d.value > 0 ? 4 : 0)}%`, background: `linear-gradient(to top, ${color}aa, ${color})` }} />
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace", fontSize: 9 }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ segments, companiesLabel }: { segments: { label: string; value: number; color: string }[]; companiesLabel: string }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return null
  const r = 40; const cx = 60; const cy = 60; const strokeW = 14; let cumAngle = -90
  return (
    <svg width={120} height={120} viewBox="0 0 120 120">
      {segments.map((seg, i) => {
        const angle = (seg.value / total) * 360
        const startRad = (cumAngle * Math.PI) / 180
        const endRad = ((cumAngle + angle) * Math.PI) / 180
        const x1 = cx + r * Math.cos(startRad); const y1 = cy + r * Math.sin(startRad)
        const x2 = cx + r * Math.cos(endRad); const y2 = cy + r * Math.sin(endRad)
        const path = `M ${x1} ${y1} A ${r} ${r} 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2}`
        cumAngle += angle
        return <path key={i} d={path} fill="none" stroke={seg.color} strokeWidth={strokeW} strokeLinecap="round" opacity={0.85} />
      })}
      <circle cx={cx} cy={cy} r={r - strokeW / 2 - 2} fill="#080810" />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="monospace">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="monospace">{companiesLabel}</text>
    </svg>
  )
}

function HealthCard({
  label, value, note, icon, accent, loading, status,
}: {
  label: string; value: string; note: string; icon: React.ReactNode
  accent: string; loading: boolean; status: "good" | "warn" | "bad" | "neutral"
}) {
  const statusColor = {
    good:    "#34d399",
    warn:    "#fbbf24",
    bad:     "#f87171",
    neutral: "rgba(255,255,255,0.4)",
  }[status]

  return (
    <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{label}</p>
        <div style={{ color: accent }}>{icon}</div>
      </div>
      {loading
        ? <Skeleton className="h-8 w-20 mb-2" />
        : <p className="text-2xl font-black text-white mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>{value}</p>
      }
      {loading
        ? <Skeleton className="h-3 w-28" />
        : <div className="flex items-center gap-1.5">
            {status !== "neutral" && <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />}
            <p className="text-xs" style={{ color: statusColor, fontFamily: "monospace" }}>{note}</p>
          </div>
      }
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
  const t = useTranslations("adminAnalytics")

  const [stats, setStats]                   = useState<any>(null)
  const [growth, setGrowth]                 = useState<any[]>([])
  const [revenueByPlan, setRevenueByPlan]   = useState<any[]>([])
  const [features, setFeatures]             = useState<any[]>([])
  const [health, setHealth]                 = useState<any>(null)
  const [loading, setLoading]               = useState(true)
  const [healthLoading, setHealthLoading]   = useState(true)
  const [error, setError]                   = useState<string | null>(null)
  const [refreshing, setRefreshing]         = useState(false)

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const [statsData, growthData, revenueData, featureData] = await Promise.all([
        apiFetch("/api/admin/stats"),
        apiFetch("/api/admin/analytics/growth?months=6"),
        apiFetch("/api/admin/analytics/revenue-by-plan"),
        apiFetch("/api/admin/analytics/feature-usage"),
      ])
      setStats(statsData)
      const months = growthData?.months || []
      setGrowth(months.map((g: any) => ({
        label: g.month, mrr: g.mrr || 0,
        new_companies: g.new_companies || 0, total_companies: g.total_companies || 0,
      })))
      setRevenueByPlan(revenueData?.plans || [])
      setFeatures((featureData?.features || []).map((f: any) => ({
        name: f.feature, adoption: f.adoption_rate, companies: f.companies_using,
      })))
    } catch (e: any) {
      setError(e.message || t("loadError"))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function loadHealth(isRefresh = false) {
    if (!isRefresh) setHealthLoading(true)
    try {
      const data = await apiFetch("/api/admin/analytics/system-health")
      setHealth(data)
    } catch (e) {
      console.error("Health fetch failed:", e)
    } finally {
      setHealthLoading(false)
    }
  }

  useEffect(() => { load(); loadHealth() }, [])

  async function handleRefresh() {
    setRefreshing(true)
    await Promise.all([load(true), loadHealth(true)])
    setRefreshing(false)
  }

  // Derived
  const mrrValues      = growth.map(g => g.mrr)
  const newCompanyBars = growth.map(g => ({ label: g.label?.split(" ")[0] || "", value: g.new_companies }))
  const planColors: Record<string, string> = { enterprise: "#c084fc", professional: "#60a5fa", basic: "#94a3b8" }
  const donutSegments  = revenueByPlan.map(p => ({ label: p.plan, value: p.company_count, color: planColors[p.plan] || "#9ca3af" }))
  const totalMrr       = stats?.revenue?.total_mrr ?? 0
  const mrrGrowth      = growth.length >= 2
    ? parseFloat((((growth[growth.length - 1].mrr - growth[0].mrr) / Math.max(1, growth[0].mrr)) * 100).toFixed(1))
    : 0

  const churnRate      = health?.churn_rate ?? 0
  const convRate       = health?.conversion_rate ?? 0
  const engagementRate = health?.engagement_rate ?? 0
  const avgContracts   = health?.avg_contracts_per_co ?? 0

  const healthCards = [
    {
      label:  t("health.churnRate"),
      value:  healthLoading ? "—" : `${churnRate}%`,
      note:   churnRate === 0 ? t("health.noChurns") : churnRate <= 3 ? t("health.churnHealthy") : churnRate <= 7 ? t("health.churnMonitor") : t("health.churnHigh"),
      icon:   <TrendingDown size={14} />,
      accent: "#f87171",
      status: (churnRate === 0 || churnRate <= 3 ? "good" : churnRate <= 7 ? "warn" : "bad") as "good"|"warn"|"bad"|"neutral",
    },
    {
      label:  t("health.trialToPaid"),
      value:  healthLoading ? "—" : `${convRate}%`,
      note:   convRate === 0 ? t("health.noConversions") : convRate >= 30 ? t("health.convExcellent") : convRate >= 15 ? t("health.convGood") : t("health.convImprove"),
      icon:   <Repeat2 size={14} />,
      accent: "#34d399",
      status: (convRate >= 30 ? "good" : convRate >= 15 ? "warn" : convRate === 0 ? "neutral" : "bad") as "good"|"warn"|"bad"|"neutral",
    },
    {
      label:  t("health.engagement"),
      value:  healthLoading ? "—" : `${engagementRate}%`,
      note:   t("health.engagementNote", { engaged: health?.engaged_companies ?? "—", active: health?.active_companies ?? "—" }),
      icon:   <UserCheck size={14} />,
      accent: "#60a5fa",
      status: (engagementRate >= 70 ? "good" : engagementRate >= 40 ? "warn" : engagementRate === 0 ? "neutral" : "bad") as "good"|"warn"|"bad"|"neutral",
    },
    {
      label:  t("health.avgContracts"),
      value:  healthLoading ? "—" : String(avgContracts),
      note:   t("health.avgContractsNote", { count: health?.contracts_this_month ?? "—" }),
      icon:   <BarChart3 size={14} />,
      accent: "#fbbf24",
      status: (avgContracts >= 5 ? "good" : avgContracts >= 2 ? "warn" : avgContracts === 0 ? "neutral" : "bad") as "good"|"warn"|"bad"|"neutral",
    },
    {
      label:  t("health.revenue30d"),
      value:  healthLoading ? "—" : `${Math.round(health?.revenue_this_month ?? 0).toLocaleString("fr-DZ")}`,
      note:   t("health.revenue30dNote"),
      icon:   <DollarSign size={14} />,
      accent: "#c084fc",
      status: ((health?.revenue_this_month ?? 0) > 0 ? "good" : "neutral") as "good"|"warn"|"bad"|"neutral",
    },
    {
      label:  t("health.contracts7d"),
      value:  healthLoading ? "—" : String(health?.recent_contracts_7d ?? "—"),
      note:   t("health.contracts7dNote"),
      icon:   <Activity size={14} />,
      accent: "#818cf8",
      status: ((health?.recent_contracts_7d ?? 0) > 0 ? "good" : "neutral") as "good"|"warn"|"bad"|"neutral",
    },
  ]

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: "monospace" }}>{t("title")}</h1>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
            {t("subtitle")}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)", color: "#818cf8", fontFamily: "monospace" }}
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
          {t("refresh")}
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm flex items-center gap-3"
          style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontFamily: "monospace" }}
        >
          <span>{error}</span>
          <button onClick={() => load()} className="ml-auto underline text-xs">{t("retry")}</button>
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          label={t("kpi.monthlyRevenue")}
          value={loading ? "—" : totalMrr.toLocaleString("fr-DZ")}
          suffix="DZD"
          trend={mrrGrowth}
          icon={<DollarSign size={16} />}
          loading={loading}
          accent="#c084fc"
          vsLastMonth={t("vsLastMonth")}
        />
        <KPI
          label={t("kpi.totalCompanies")}
          value={loading ? "—" : stats?.companies?.total ?? "—"}
          trend={stats?.companies?.growth_percentage}
          icon={<Building2 size={16} />}
          loading={loading}
          accent="#818cf8"
          vsLastMonth={t("vsLastMonth")}
        />
        <KPI
          label={t("kpi.totalUsers")}
          value={loading ? "—" : stats?.users?.total ?? "—"}
          icon={<Users size={16} />}
          loading={loading}
          accent="#60a5fa"
          vsLastMonth={t("vsLastMonth")}
        />
        <KPI
          label={t("kpi.activeContracts")}
          value={loading ? "—" : stats?.contracts?.active ?? "—"}
          icon={<FileText size={16} />}
          loading={loading}
          accent="#34d399"
          vsLastMonth={t("vsLastMonth")}
        />
      </div>

      {/* ── Sub-stats ── */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { labelKey: "subStats.active",         value: stats?.companies?.active ?? "—",        color: "#34d399" },
          { labelKey: "subStats.trial",           value: stats?.companies?.trial ?? "—",         color: "#fbbf24" },
          { labelKey: "subStats.suspended",       value: stats?.companies?.suspended ?? "—",     color: "#f87171" },
          { labelKey: "subStats.newThisMonth",    value: stats?.companies?.new_this_month ?? "—", color: "#818cf8" },
          { labelKey: "subStats.totalVehicles",   value: stats?.vehicles?.total ?? "—",          color: "#60a5fa" },
          { labelKey: "subStats.totalContracts",  value: stats?.contracts?.total ?? "—",         color: "#c084fc" },
        ].map(({ labelKey, value, color }) => (
          <div key={labelKey} className="rounded-xl p-3 text-center"
            style={{ background: "#080810", border: "1px solid rgba(255,255,255,0.06)" }}>
            {loading
              ? <Skeleton className="h-6 w-12 mx-auto mb-1" />
              : <p className="text-xl font-black" style={{ color, fontFamily: "monospace" }}>{value}</p>
            }
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{t(labelKey as any)}</p>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* MRR Trend */}
        <div className="rounded-2xl p-5" style={{ background: "#080810", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-white" style={{ fontFamily: "monospace" }}>{t("charts.mrrTrend")}</h3>
            {!loading && mrrValues.some(v => v > 0) && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(52,211,153,0.1)", color: "#34d399", fontFamily: "monospace" }}>
                {mrrGrowth >= 0 ? "+" : ""}{mrrGrowth}% {t("charts.over6mo")}
              </span>
            )}
          </div>
          <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
            {t("charts.mrrSubtitle")}
          </p>
          {loading
            ? <Skeleton className="h-24 w-full" />
            : mrrValues.some(v => v > 0)
              ? <Sparkline data={mrrValues} color="#c084fc" />
              : <div className="h-24 flex items-center justify-center">
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>{t("charts.noRevenueData")}</p>
                </div>
          }
          {!loading && growth.length > 0 && (
            <div className="mt-3 grid gap-0" style={{ gridTemplateColumns: `repeat(${growth.length}, 1fr)` }}>
              {growth.map((g, i) => (
                <div key={i} className="text-center">
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: 9 }}>{g.label?.split(" ")[0]}</p>
                  <p className="text-xs font-bold" style={{ color: "#c084fc", fontFamily: "monospace", fontSize: 10 }}>
                    {g.mrr > 0 ? (g.mrr >= 1000 ? `${(g.mrr / 1000).toFixed(0)}K` : g.mrr) : "—"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Companies */}
        <div className="rounded-2xl p-5" style={{ background: "#080810", border: "1px solid rgba(255,255,255,0.07)" }}>
          <h3 className="text-sm font-bold text-white mb-1" style={{ fontFamily: "monospace" }}>{t("charts.newCompanies")}</h3>
          <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
            {t("charts.newCompaniesSubtitle")}
          </p>
          {loading
            ? <Skeleton className="h-24 w-full" />
            : newCompanyBars.some(b => b.value > 0)
              ? <BarChart data={newCompanyBars} color="#818cf8" />
              : <div className="h-24 flex items-center justify-center">
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>{t("charts.noSignups")}</p>
                </div>
          }
          {!loading && growth.length > 0 && (
            <div className="mt-4 flex items-center justify-between px-1">
              <div>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>{t("charts.totalThisPeriod")}</p>
                <p className="text-lg font-black text-white" style={{ fontFamily: "monospace" }}>
                  {growth.reduce((s, g) => s + g.new_companies, 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>{t("charts.latestTotal")}</p>
                <p className="text-lg font-black text-white" style={{ fontFamily: "monospace" }}>
                  {growth[growth.length - 1]?.total_companies ?? "—"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Feature Adoption + Revenue by Plan ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Feature Adoption */}
        <div className="rounded-2xl p-5" style={{ background: "#080810", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2 mb-5">
            <Zap size={14} style={{ color: "#818cf8" }} />
            <h3 className="text-sm font-bold text-white" style={{ fontFamily: "monospace" }}>{t("charts.featureAdoption")}</h3>
          </div>
          {loading ? (
            <div className="space-y-5">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : features.length > 0 ? (
            <div className="space-y-4">
              {features.map((f, i) => {
                const colors = ["#818cf8","#c084fc","#60a5fa","#34d399","#fbbf24"]
                const color = colors[i % colors.length]
                return (
                  <div key={f.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>{f.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
                          {t("charts.companiesCount", { count: f.companies })}
                        </span>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{ background: `${color}18`, color, fontFamily: "monospace" }}>
                          {f.adoption}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${f.adoption}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-center py-8" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
              {t("charts.noFeatureData")}
            </p>
          )}
        </div>

        {/* Revenue by Plan */}
        <div className="rounded-2xl p-5" style={{ background: "#080810", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={14} style={{ color: "#c084fc" }} />
            <h3 className="text-sm font-bold text-white" style={{ fontFamily: "monospace" }}>{t("charts.revenueByPlan")}</h3>
          </div>
          {loading ? (
            <div className="space-y-4">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : revenueByPlan.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="shrink-0">
                <DonutChart segments={donutSegments} companiesLabel={t("charts.companiesLabel")} />
              </div>
              <div className="flex-1 space-y-3">
                {revenueByPlan.map((p) => {
                  const color = planColors[p.plan] || "#9ca3af"
                  return (
                    <div key={p.plan}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color, fontFamily: "monospace" }}>{p.plan}</span>
                        </div>
                        <span className="text-xs font-bold text-white" style={{ fontFamily: "monospace" }}>
                          {Number(p.total_mrr).toLocaleString("fr-DZ")} DZD
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <div className="h-full rounded-full" style={{ width: `${p.percentage}%`, background: color }} />
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
                        {t("charts.planMeta", { count: p.company_count, pct: p.percentage })}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-center py-8" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
              {t("charts.noRevenueData")}
            </p>
          )}
        </div>
      </div>

      {/* ── System Health ── */}
      <div className="rounded-2xl p-5" style={{ background: "#080810", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2 mb-5">
          <Activity size={14} style={{ color: "#34d399" }} />
          <h3 className="text-sm font-bold text-white" style={{ fontFamily: "monospace" }}>{t("health.title")}</h3>
          {!healthLoading && health && (
            <div className="ml-auto flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: (health.churn_rate ?? 0) <= 5 ? "#34d399" : "#fbbf24" }}
              />
              <span className="text-xs" style={{
                color: (health.churn_rate ?? 0) <= 5 ? "#34d399" : "#fbbf24",
                fontFamily: "monospace"
              }}>
                {(health.churn_rate ?? 0) <= 5 ? t("health.statusHealthy") : t("health.statusAttention")}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {healthCards.map(card => (
            <HealthCard key={card.label} {...card} loading={healthLoading} />
          ))}
        </div>

        {!healthLoading && (
          <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.15)", fontFamily: "monospace" }}>
            📊 {t("health.liveNote", { time: new Date().toLocaleTimeString() })}
          </p>
        )}
      </div>
    </div>
  )
}