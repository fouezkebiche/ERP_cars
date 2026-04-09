"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search,
  Eye,
  Ban,
  RefreshCw,
  Building2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users,
  Car,
  DollarSign,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Loader2,
  CreditCard,
} from "lucide-react"
import {
  fetchAllCompanies,
  fetchPlatformStats,
  suspendCompany,
  reactivateCompany,
  type Company,
  type PlatformStats,
  type CompaniesQuery,
} from "@/lib/admin"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PLAN_STYLES: Record<string, string> = {
  basic:        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  professional: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  enterprise:   "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
}

// STATUS_META is now a function that receives `t` so hooks are never called at module level
function getStatusMeta(t: (key: string) => string) {
  return {
    active: {
      label: t("active"),
      icon: CheckCircle,
      className: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
    },
    trial: {
      label: t("trial"),
      icon: Clock,
      className: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400",
    },
    suspended: {
      label: t("suspended"),
      icon: XCircle,
      className: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
    },
    inactive: {
      label: t("inactive"),
      icon: AlertCircle,
      className: "text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400",
    },
  }
}

function fmt(n: number) {
  return new Intl.NumberFormat("fr-DZ").format(n)
}

function fmtDate(d?: string) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4 shadow-sm">
      <div className={`rounded-xl p-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Company Detail Drawer ────────────────────────────────────────────────────

function CompanyDrawer({
  company,
  onClose,
  onSuspend,
  onReactivate,
  actionLoading,
}: {
  company: Company
  onClose: () => void
  onSuspend: (id: string) => void
  onReactivate: (id: string) => void
  actionLoading: string | null
}) {
  const t = useTranslations("admin")
  const STATUS_META = getStatusMeta(t)
  const status = STATUS_META[company.subscription_status] ?? STATUS_META.inactive
  const StatusIcon = status.icon

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-base">{company.name}</h2>
              <p className="text-xs text-muted-foreground">{company.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status + Plan */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground mb-2">{t("status")}</p>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.className}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {status.label}
              </span>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground mb-2">{t("plan")}</p>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${PLAN_STYLES[company.subscription_plan] ?? ""}`}>
                {company.subscription_plan}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="rounded-xl border border-border divide-y divide-border">
            {[
              { label: t("companyId"),   value: company.id.slice(0, 18) + "…" },
              { label: t("phone"),       value: company.phone || "—" },
              { label: t("joined"),      value: fmtDate(company.created_at) },
              { label: t("trialEnds"),   value: fmtDate(company.trial_ends_at) },
              { label: "MRR",            value: `${fmt(company.monthly_recurring_revenue)} DZD` },
              { label: t("users"),       value: company.user_count ?? "—" },
              { label: t("vehicles"),    value: company.vehicle_count ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-border px-6 py-4 flex gap-3">
          {company.subscription_status === "suspended" ? (
            <Button
              className="flex-1"
              variant="default"
              onClick={() => onReactivate(company.id)}
              disabled={actionLoading === company.id}
            >
              {actionLoading === company.id
                ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                : <RefreshCw className="w-4 h-4 mr-2" />}
              {t("reactivate")}
            </Button>
          ) : (
            <Button
              className="flex-1"
              variant="destructive"
              onClick={() => onSuspend(company.id)}
              disabled={actionLoading === company.id}
            >
              {actionLoading === company.id
                ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                : <Ban className="w-4 h-4 mr-2" />}
              {t("suspend")}
            </Button>
          )}
          <Button variant="outline" onClick={onClose} className="flex-1">
            {t("close")}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CompaniesPage() {
  const t = useTranslations("admin")
  const STATUS_META = getStatusMeta(t)

  const [companies, setCompanies]           = useState<Company[]>([])
  const [stats, setStats]                   = useState<PlatformStats | null>(null)
  const [statsLoading, setStatsLoading]     = useState(true)
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState<string | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [actionLoading, setActionLoading]   = useState<string | null>(null)
  const [page, setPage]                     = useState(1)
  const [totalPages, setTotalPages]         = useState(1)
  const [total, setTotal]                   = useState(0)
  const [search, setSearch]                 = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter]     = useState<"" | "active" | "trial" | "suspended" | "inactive">("")
  const [planFilter, setPlanFilter]         = useState<"" | "basic" | "professional" | "enterprise">("")

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  const loadCompanies = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const query: CompaniesQuery = {
        page,
        limit: 20,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter    && { status: statusFilter }),
        ...(planFilter      && { plan: planFilter }),
      }
      const result = await fetchAllCompanies(query)
      setCompanies(result.companies)
      setTotalPages(result.pagination.total_pages)
      setTotal(result.pagination.total)
    } catch (e: any) {
      setError(e.message || t("noCompaniesFound"))
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, statusFilter, planFilter, t])

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  // Fetch stats once
  useEffect(() => {
    fetchPlatformStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false))
  }, [])

  // Actions
  const handleSuspend = async (id: string) => {
    setActionLoading(id)
    try {
      const updated = await suspendCompany(id, "Suspended by admin")
      setCompanies((prev) =>
        prev.map((c) => (c.id === id ? { ...c, subscription_status: updated.subscription_status } : c))
      )
      if (selectedCompany?.id === id)
        setSelectedCompany((s) => s && { ...s, subscription_status: updated.subscription_status })
    } catch (e: any) {
      alert(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReactivate = async (id: string) => {
    setActionLoading(id)
    try {
      const updated = await reactivateCompany(id)
      setCompanies((prev) =>
        prev.map((c) => (c.id === id ? { ...c, subscription_status: updated.subscription_status } : c))
      )
      if (selectedCompany?.id === id)
        setSelectedCompany((s) => s && { ...s, subscription_status: updated.subscription_status })
    } catch (e: any) {
      alert(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("")
    setPlanFilter("")
    setPage(1)
  }

  const hasFilters = search || statusFilter || planFilter

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("companies")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {statsLoading ? t("loading") : `${fmt(stats?.companies.total ?? 0)} ${t("registeredCompanies")}`}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadCompanies} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {t("refresh")}
          </Button>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Building2}
            label={t("totalCompaniesStat")}
            value={statsLoading ? "…" : fmt(stats?.companies.total ?? 0)}
            sub={`+${stats?.companies.new_this_month ?? 0} ${t("newThisMonth")}`}
            color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          />
          <StatCard
            icon={CheckCircle}
            label={t("activeStat")}
            value={statsLoading ? "…" : fmt(stats?.companies.active ?? 0)}
            sub={`${stats?.companies.trial ?? 0} ${t("trial")}`}
            color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          />
          <StatCard
            icon={Car}
            label={t("totalVehiclesStat")}
            value={statsLoading ? "…" : fmt(stats?.vehicles.total ?? 0)}
            color="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
          />
          <StatCard
            icon={DollarSign}
            label={t("monthlyRevenueStat")}
            value={statsLoading ? "…" : `${fmt(stats?.revenue.total_mrr ?? 0)} DZD`}
            sub={`${stats?.revenue.by_plan.length ?? 0} ${t("activePlans")}`}
            color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          />
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={t("searchPlaceholder")}
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t("allStatuses")}</option>
            <option value="active">{t("active")}</option>
            <option value="trial">{t("trial")}</option>
            <option value="suspended">{t("suspended")}</option>
            <option value="inactive">{t("inactive")}</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value as any)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t("allPlans")}</option>
            <option value="basic">Basic</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="w-3.5 h-3.5" />
              {t("clear")}
            </Button>
          )}

          <p className="ml-auto text-sm text-muted-foreground">
            {loading ? t("loading") : `${fmt(total)} ${t("results")}`}
          </p>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <Button variant="ghost" size="sm" className="ml-auto" onClick={loadCompanies}>
              {t("retry")}
            </Button>
          </div>
        )}

        {/* ── Table ── */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {[t("company"), t("plan"), t("status"), t("vehicles"), t("users"), "MRR", t("joined"), t("actions")].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3.5">
                          <div className="h-3.5 bg-muted rounded w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : companies.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-muted-foreground">
                      <Building2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      {t("noCompaniesFound")}
                    </td>
                  </tr>
                ) : (
                  companies.map((company) => {
                    const status = STATUS_META[company.subscription_status] ?? STATUS_META.inactive
                    const StatusIcon = status.icon
                    return (
                      <tr key={company.id} className="hover:bg-muted/30 transition-colors group">
                        {/* Company */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary">
                                {company.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium leading-tight">{company.name}</p>
                              <p className="text-xs text-muted-foreground">{company.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${PLAN_STYLES[company.subscription_plan] ?? ""}`}>
                            {company.subscription_plan}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${status.className}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </td>

                        {/* Vehicles */}
                        <td className="px-4 py-3.5 text-muted-foreground">{company.vehicle_count ?? "—"}</td>

                        {/* Users */}
                        <td className="px-4 py-3.5 text-muted-foreground">{company.user_count ?? "—"}</td>

                        {/* MRR */}
                        <td className="px-4 py-3.5 font-medium tabular-nums">
                          {fmt(company.monthly_recurring_revenue)}{" "}
                          <span className="text-xs text-muted-foreground font-normal">DZD</span>
                        </td>

                        {/* Joined */}
                        <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                          {fmtDate(company.created_at)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSelectedCompany(company)}
                              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                              title={t("viewDetails")}
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {company.subscription_status === "suspended" ? (
                              <button
                                onClick={() => handleReactivate(company.id)}
                                disabled={actionLoading === company.id}
                                className="p-1.5 rounded-md hover:bg-emerald-100 transition-colors text-muted-foreground hover:text-emerald-600 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400"
                                title={t("reactivate")}
                              >
                                {actionLoading === company.id
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <RefreshCw className="w-4 h-4" />}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSuspend(company.id)}
                                disabled={actionLoading === company.id}
                                className="p-1.5 rounded-md hover:bg-red-100 transition-colors text-muted-foreground hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                                title={t("suspend")}
                              >
                                {actionLoading === company.id
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <Ban className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
              <p className="text-xs text-muted-foreground">
                {t("pageOf", { current: page, total: totalPages })}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const n =
                    totalPages <= 5 ? i + 1
                    : page <= 3 ? i + 1
                    : page >= totalPages - 2 ? totalPages - 4 + i
                    : page - 2 + i
                  return (
                    <Button
                      key={n}
                      variant={n === page ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setPage(n)}
                      className="h-8 w-8 p-0 text-xs"
                    >
                      {n}
                    </Button>
                  )
                })}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Drawer ── */}
      {selectedCompany && (
        <CompanyDrawer
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
          onSuspend={handleSuspend}
          onReactivate={handleReactivate}
          actionLoading={actionLoading}
        />
      )}
    </div>
  )
}