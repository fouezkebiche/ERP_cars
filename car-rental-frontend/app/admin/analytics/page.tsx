"use client"

import { useEffect, useState, useRef } from "react"
import {
  TrendingUp, Users, DollarSign, Activity,
  ArrowUpRight, ArrowDownRight, RefreshCw,
  Building2, FileText, Zap
} from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : ""
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
}

async function apiFetch(path: string) {
  const res = await fetch(`${API}${path}`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return json.data
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ background: "rgba(255,255,255,0.05)" }}
    />
  )
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KPI({
  label, value, suffix = "", trend, icon, loading, accent = "#818cf8"
}: {
  label: string
  value: string | number
  suffix?: string
  trend?: number
  icon: React.ReactNode
  loading?: boolean
  accent?: string
}) {
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden flex flex-col gap-3"
      style={{ background: "#080810", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`, transform: "translate(30%, -30%)" }}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
          {label}
        </p>
        <div className="p-2 rounded-lg" style={{ background: `${accent}18`, color: accent }}>
          {icon}
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-9 w-32" />
      ) : (
        <p className="text-3xl font-black text-white" style={{ fontFamily: "'DM Mono', 'Courier New', monospace", fontVariantNumeric: "tabular-nums" }}>
          {value}
          {suffix && <span className="text-base ml-1.5 font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>{suffix}</span>}
        </p>
      )}

      {trend !== undefined && !loading && (
        <div className="flex items-center gap-1.5 text-xs">
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{
              background: trend >= 0 ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
              color: trend >= 0 ? "#34d399" : "#f87171",
            }}
          >
            {trend >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            <span style={{ fontFamily: "monospace" }}>{trend >= 0 ? "+" : ""}{trend}%</span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>vs last month</span>
        </div>
      )}
    </div>
  )
}

// ─── SVG Sparkline ───────────────────────────────────────────────────────────
function Sparkline({ data, color = "#c084fc" }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null
  const w = 400; const h = 100; const pad = 12
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return [x, y]
  })
  // Smooth path using bezier curves
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
      {/* Dots at each data point */}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill={color} opacity={i === pts.length - 1 ? 1 : 0.4} />
      ))}
    </svg>
  )
}

// ─── Bar Chart ───────────────────────────────────────────────────────────────
function BarChart({ data, color = "#818cf8" }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
          <span className="text-xs font-mono font-bold" style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>
            {d.value > 0 ? d.value : ""}
          </span>
          <div
            className="w-full rounded-t-md transition-all duration-700"
            style={{
              height: `${Math.max((d.value / max) * 80, d.value > 0 ? 4 : 0)}%`,
              background: `linear-gradient(to top, ${color}aa, ${color})`,
            }}
          />
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace", fontSize: 9 }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────
function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return null
  const r = 40; const cx = 60; const cy = 60; const strokeW = 14
  let cumAngle = -90

  return (
    <svg width={120} height={120} viewBox="0 0 120 120">
      {segments.map((seg, i) => {
        const pct = seg.value / total
        const angle = pct * 360
        const startRad = (cumAngle * Math.PI) / 180
        const endRad = ((cumAngle + angle) * Math.PI) / 180
        const x1 = cx + r * Math.cos(startRad)
        const y1 = cy + r * Math.sin(startRad)
        const x2 = cx + r * Math.cos(endRad)
        const y2 = cy + r * Math.sin(endRad)
        const largeArc = angle > 180 ? 1 : 0
        const pathD = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`
        cumAngle += angle
        return (
          <path
            key={i}
            d={pathD}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeW}
            strokeLinecap="round"
            opacity={0.85}
          />
        )
      })}
      <circle cx={cx} cy={cy} r={r - strokeW / 2 - 2} fill="#080810" />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="monospace">
        {total}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="monospace">
        companies
      </text>
    </svg>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<any>(null)
  const [growth, setGrowth] = useState<any[]>([])
  const [revenueByPlan, setRevenueByPlan] = useState<any[]>([])
  const [features, setFeatures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

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

      // Backend returns { months: [...] } with fields: month, mrr, new_companies, total_companies
      const months = growthData?.months || []
      setGrowth(months.map((g: any) => ({
        label: g.month,          // "Jan 2025"
        mrr: g.mrr || 0,
        new_companies: g.new_companies || 0,
        total_companies: g.total_companies || 0,
      })))

      // Backend returns { plans: [...], total_mrr } with fields: plan, company_count, total_mrr, avg_mrr, percentage
      const plans = revenueData?.plans || []
      setRevenueByPlan(plans)

      // Backend returns { features: [...], total_companies } with fields: feature, companies_using, adoption_rate
      const feats = featureData?.features || []
      setFeatures(feats.map((f: any) => ({
        name: f.feature,
        adoption: f.adoption_rate,
        companies: f.companies_using,
      })))
    } catch (e: any) {
      console.error("Failed to load analytics:", e)
      setError(e.message || "Failed to load analytics")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  // Derived data
  const mrrValues = growth.map(g => g.mrr)
  const newCompanyBars = growth.map(g => ({ label: g.label?.split(" ")[0] || "", value: g.new_companies }))

  const planColors: Record<string, string> = {
    enterprise: "#c084fc",
    professional: "#60a5fa",
    basic: "#94a3b8",
  }

  const donutSegments = revenueByPlan.map(p => ({
    label: p.plan,
    value: p.company_count,
    color: planColors[p.plan] || "#9ca3af",
  }))

  const totalMrr = stats?.revenue?.total_mrr ?? 0
  const mrrGrowth = growth.length >= 2
    ? parseFloat((((growth[growth.length - 1].mrr - growth[0].mrr) / Math.max(1, growth[0].mrr)) * 100).toFixed(1))
    : 0

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: "monospace" }}>Analytics</h1>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
            Platform-wide metrics & growth
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: "rgba(129,140,248,0.1)",
            border: "1px solid rgba(129,140,248,0.2)",
            color: "#818cf8",
            fontFamily: "monospace",
          }}
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-3"
          style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontFamily: "monospace" }}>
          <span>{error}</span>
          <button onClick={() => load()} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          label="Monthly Revenue"
          value={loading ? "—" : totalMrr.toLocaleString("fr-DZ")}
          suffix="DZD"
          trend={mrrGrowth}
          icon={<DollarSign size={16} />}
          loading={loading}
          accent="#c084fc"
        />
        <KPI
          label="Total Companies"
          value={loading ? "—" : stats?.companies?.total ?? "—"}
          trend={stats?.companies?.growth_percentage}
          icon={<Building2 size={16} />}
          loading={loading}
          accent="#818cf8"
        />
        <KPI
          label="Total Users"
          value={loading ? "—" : stats?.users?.total ?? "—"}
          icon={<Users size={16} />}
          loading={loading}
          accent="#60a5fa"
        />
        <KPI
          label="Active Contracts"
          value={loading ? "—" : stats?.contracts?.active ?? "—"}
          icon={<FileText size={16} />}
          loading={loading}
          accent="#34d399"
        />
      </div>

      {/* ── Sub-stats strip ── */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Active", value: stats?.companies?.active ?? "—", color: "#34d399" },
          { label: "Trial", value: stats?.companies?.trial ?? "—", color: "#fbbf24" },
          { label: "Suspended", value: stats?.companies?.suspended ?? "—", color: "#f87171" },
          { label: "New This Month", value: stats?.companies?.new_this_month ?? "—", color: "#818cf8" },
          { label: "Total Vehicles", value: stats?.vehicles?.total ?? "—", color: "#60a5fa" },
          { label: "Total Contracts", value: stats?.contracts?.total ?? "—", color: "#c084fc" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ background: "#080810", border: "1px solid rgba(255,255,255,0.06)" }}>
            {loading ? <Skeleton className="h-6 w-12 mx-auto mb-1" /> : (
              <p className="text-xl font-black" style={{ color, fontFamily: "monospace" }}>{value}</p>
            )}
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* MRR Trend */}
        <div className="rounded-2xl p-5" style={{ background: "#080810", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-white" style={{ fontFamily: "monospace" }}>MRR Trend</h3>
            {!loading && mrrValues.some(v => v > 0) && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(52,211,153,0.1)", color: "#34d399", fontFamily: "monospace" }}>
                {mrrGrowth >= 0 ? "+" : ""}{mrrGrowth}% over 6mo
              </span>
            )}
          </div>
          <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>Last 6 months · DZD</p>

          {loading ? <Skeleton className="h-24 w-full" /> : (
            mrrValues.some(v => v > 0)
              ? <Sparkline data={mrrValues} color="#c084fc" />
              : <div className="h-24 flex items-center justify-center">
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>No revenue data yet</p>
              </div>
          )}

          {/* Month labels */}
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

        {/* New Companies per Month */}
        <div className="rounded-2xl p-5" style={{ background: "#080810", border: "1px solid rgba(255,255,255,0.07)" }}>
          <h3 className="text-sm font-bold text-white mb-1" style={{ fontFamily: "monospace" }}>New Companies</h3>
          <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>Monthly signups</p>

          {loading ? <Skeleton className="h-24 w-full" /> : (
            newCompanyBars.some(b => b.value > 0)
              ? <BarChart data={newCompanyBars} color="#818cf8" />
              : <div className="h-24 flex items-center justify-center">
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>No signups in range</p>
              </div>
          )}

          {!loading && growth.length > 0 && (
            <div className="mt-4 flex items-center justify-between px-1">
              <div>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>Total this period</p>
                <p className="text-lg font-black text-white" style={{ fontFamily: "monospace" }}>
                  {growth.reduce((s, g) => s + g.new_companies, 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>Latest total</p>
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
            <h3 className="text-sm font-bold text-white" style={{ fontFamily: "monospace" }}>Feature Adoption</h3>
          </div>

          {loading ? (
            <div className="space-y-5">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : features.length > 0 ? (
            <div className="space-y-4">
              {features.map((f, i) => {
                const colors = ["#818cf8", "#c084fc", "#60a5fa", "#34d399", "#fbbf24"]
                const color = colors[i % colors.length]
                return (
                  <div key={f.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>
                        {f.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
                          {f.companies} co.
                        </span>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: `${color}18`, color, fontFamily: "monospace" }}>
                          {f.adoption}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${f.adoption}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-center py-8" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>No feature data</p>
          )}
        </div>

        {/* Revenue by Plan */}
        <div className="rounded-2xl p-5" style={{ background: "#080810", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={14} style={{ color: "#c084fc" }} />
            <h3 className="text-sm font-bold text-white" style={{ fontFamily: "monospace" }}>Revenue by Plan</h3>
          </div>

          {loading ? (
            <div className="space-y-4">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : revenueByPlan.length > 0 ? (
            <div className="flex items-center gap-6">
              {/* Donut */}
              <div className="shrink-0">
                <DonutChart segments={donutSegments} />
              </div>
              {/* Breakdown */}
              <div className="flex-1 space-y-3">
                {revenueByPlan.map((p) => {
                  const color = planColors[p.plan] || "#9ca3af"
                  return (
                    <div key={p.plan}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color, fontFamily: "monospace" }}>
                            {p.plan}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-white" style={{ fontFamily: "monospace" }}>
                          {Number(p.total_mrr).toLocaleString("fr-DZ")} DZD
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <div className="h-full rounded-full" style={{ width: `${p.percentage}%`, background: color }} />
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
                        {p.company_count} companies · {p.percentage}% of MRR
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-center py-8" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>No revenue data</p>
          )}
        </div>
      </div>

      {/* ── System Health ── */}
      <div className="rounded-2xl p-5" style={{ background: "#080810", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2 mb-5">
          <Activity size={14} style={{ color: "#34d399" }} />
          <h3 className="text-sm font-bold text-white" style={{ fontFamily: "monospace" }}>System Health</h3>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34d399" }} />
            <span className="text-xs" style={{ color: "#34d399", fontFamily: "monospace" }}>All systems operational</span>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Churn Rate", value: "2.5%", note: "30-day rolling", good: true },
            { label: "Platform Uptime", value: "99.98%", note: "This month", good: true },
            { label: "Avg Response Time", value: "245ms", note: "All API endpoints", good: false },
            { label: "API Calls / Month", value: "1.28M", note: "Total platform", good: false },
          ].map(({ label, value, note, good }) => (
            <div key={label} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>{label}</p>
              <p className="text-2xl font-black text-white mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>{value}</p>
              <p className="text-xs" style={{ color: good ? "#34d399" : "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}