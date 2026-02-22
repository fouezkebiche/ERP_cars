"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Search, Users, Shield, UserCheck,
  ChevronLeft, ChevronRight, X, RefreshCw, AlertTriangle, Building2
} from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : ""
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
}

async function apiFetch(path: string) {
  const res = await fetch(`${API}${path}`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded ${className}`} style={{ background: "rgba(255,255,255,0.06)" }} />
}

const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
  admin:   { bg: "rgba(192,132,252,0.15)", color: "#c084fc" },
  manager: { bg: "rgba(96,165,250,0.12)",  color: "#60a5fa" },
  staff:   { bg: "rgba(52,211,153,0.12)",  color: "#34d399" },
}

function RoleBadge({ role }: { role: string }) {
  const s = ROLE_STYLES[role?.toLowerCase()] || { bg: "rgba(156,163,175,0.12)", color: "#9ca3af" }
  return (
    <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold capitalize"
      style={{ background: s.bg, color: s.color, fontFamily: "monospace" }}>
      {role}
    </span>
  )
}

function fmtDate(d?: string) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

export default function AdminUsersPage() {
  const [users, setUsers]           = useState<any[]>([])
  const [stats, setStats]           = useState<any>(null)
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError]           = useState("")

  // Filters
  const [search, setSearch]         = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal]           = useState(0)
  const LIMIT = 15

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [roleFilter])

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(roleFilter && { role: roleFilter }),
      })

      const [usersJson, statsJson] = await Promise.all([
        apiFetch(`/api/admin/users?${params}`),
        apiFetch("/api/admin/stats"),
      ])

      setUsers(usersJson.data?.users || [])
      setTotal(usersJson.meta?.pagination?.total || 0)
      setTotalPages(usersJson.meta?.pagination?.total_pages || 1)
      setStats(statsJson.data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, debouncedSearch, roleFilter])

  useEffect(() => { load() }, [load])

  const hasFilters = search || roleFilter

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: "monospace" }}>Users</h1>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
            All users across the platform
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
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
          <AlertTriangle size={14} style={{ color: "#f87171" }} />
          <span className="text-xs" style={{ color: "#f87171", fontFamily: "monospace" }}>{error}</span>
          <button onClick={() => load()} className="ml-auto text-xs underline" style={{ color: "#f87171" }}>Retry</button>
        </div>
      )}

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Users",    value: stats?.users?.total          ?? "—", icon: <Users size={16} />,     accent: "#818cf8" },
          { label: "Total Companies",value: stats?.companies?.total      ?? "—", icon: <Building2 size={16} />, accent: "#c084fc" },
          { label: "Active Companies",value: stats?.companies?.active    ?? "—", icon: <UserCheck size={16} />, accent: "#34d399" },
        ].map(({ label, value, icon, accent }) => (
          <div key={label} className="rounded-xl p-5 relative overflow-hidden"
            style={{ background: "#0d0d14", border: "1px solid rgba(129,140,248,0.1)" }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 80% 20%, ${accent}0a 0%, transparent 60%)` }} />
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "rgba(129,140,248,0.6)", fontFamily: "monospace" }}>{label}</p>
              <div style={{ color: `${accent}99` }}>{icon}</div>
            </div>
            {loading
              ? <Skeleton className="h-8 w-20" />
              : <p className="text-3xl font-black text-white" style={{ fontFamily: "'DM Mono', monospace" }}>{value}</p>}
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "rgba(255,255,255,0.3)" }} />
          <input
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg pl-9 pr-3 text-sm outline-none"
            style={{
              background: "#0d0d14",
              border: "1px solid rgba(129,140,248,0.15)",
              color: "white",
              fontFamily: "monospace",
            }}
          />
        </div>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="h-9 rounded-lg px-3 text-sm outline-none"
          style={{
            background: "#0d0d14",
            border: "1px solid rgba(129,140,248,0.15)",
            color: "white",
            fontFamily: "monospace",
          }}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="staff">Staff</option>
        </select>

        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setRoleFilter(""); setPage(1) }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}
          >
            <X size={12} /> Clear
          </button>
        )}

        <p className="ml-auto text-xs" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
          {loading ? "Loading…" : `${total} users`}
        </p>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#0d0d14", border: "1px solid rgba(129,140,248,0.1)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(129,140,248,0.08)" }}>
                {["User", "Company", "Role", "Status", "Last Login", "Joined"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "rgba(129,140,248,0.5)", fontFamily: "monospace" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(8).fill(0).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    {Array(6).fill(0).map((_, j) => (
                      <td key={j} className="px-5 py-3.5"><Skeleton className="h-4 w-24" /></td>
                    ))}
                  </tr>
                ))
                : users.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <Users className="w-8 h-8 mx-auto mb-3 opacity-20 text-white" />
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>No users found</p>
                      </td>
                    </tr>
                  )
                  : users.map((u) => (
                    <tr key={u.id}
                      className="transition-colors"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(129,140,248,0.04)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* User */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black"
                            style={{ background: "rgba(129,140,248,0.15)", color: "#818cf8" }}>
                            {u.full_name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="text-white text-xs font-semibold">{u.full_name}</p>
                            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="px-5 py-3.5">
                        {u.company ? (
                          <div>
                            <p className="text-xs text-white font-medium">{u.company.name}</p>
                            <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
                              {u.company.subscription_plan}
                            </p>
                          </div>
                        ) : (
                          <span style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }} className="text-xs">—</span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5"><RoleBadge role={u.role} /></td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs" style={{ fontFamily: "monospace" }}>
                          <div className="w-1.5 h-1.5 rounded-full"
                            style={{ background: u.is_active ? "#34d399" : "#9ca3af" }} />
                          <span style={{ color: u.is_active ? "#34d399" : "#9ca3af" }}>
                            {u.is_active ? "Active" : "Inactive"}
                          </span>
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="px-5 py-3.5 text-xs" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
                        {fmtDate(u.last_login_at)}
                      </td>

                      {/* Joined */}
                      <td className="px-5 py-3.5 text-xs" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
                        {fmtDate(u.created_at)}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: "1px solid rgba(129,140,248,0.08)" }}>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const n = totalPages <= 5 ? i + 1
                  : page <= 3 ? i + 1
                  : page >= totalPages - 2 ? totalPages - 4 + i
                  : page - 2 + i
                return (
                  <button key={n} onClick={() => setPage(n)}
                    className="w-7 h-7 rounded-lg text-xs font-bold transition-colors"
                    style={{
                      background: n === page ? "rgba(129,140,248,0.2)" : "transparent",
                      color: n === page ? "#818cf8" : "rgba(255,255,255,0.4)",
                      fontFamily: "monospace",
                    }}>
                    {n}
                  </button>
                )
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}