// app/[locale]/dashboard/customers/page.tsx (FULLY LOCALIZED)
"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Plus, Search, Eye, Edit2, Trash2, Users, Building2, AlertTriangle } from "lucide-react"
import { customerApi, Customer } from "@/lib/customerApi"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

/* ─── design tokens ─────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"
const MUTED   = "rgba(255,255,255,0.4)"

function StatCard({ label, value, accent, icon }: { label: string; value: React.ReactNode; accent?: string; icon: React.ReactNode }) {
  return (
    <div style={{
      padding: "20px 22px", borderRadius: 14,
      background: SURFACE, border: `1px solid ${BORDER}`,
      transition: "border-color 0.2s",
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(34,197,94,0.28)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{ fontSize: 12, color: MUTED }}>{label}</p>
        <span style={{ color: accent || MUTED, opacity: 0.8 }}>{icon}</span>
      </div>
      <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.035em", color: accent || "#fff" }}>{value}</p>
    </div>
  )
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: FONT, fontSize: 13, fontWeight: 500,
      padding: "8px 16px", borderRadius: 8, cursor: "pointer",
      background: active ? GREEN : SURFACE,
      color: active ? "#fff" : MUTED,
      border: `1px solid ${active ? GREEN : BORDER}`,
      transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: 6,
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = "rgba(34,197,94,0.4)"; e.currentTarget.style.color = "#fff" } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED } }}
    >
      {children}
    </button>
  )
}

export default function CustomersPage() {
  const t = useTranslations("customers")
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total_customers: 0,
    by_type: { individual: 0, corporate: 0 },
    blacklisted: 0,
    recent_customers_30d: 0,
  })
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 0 })
  const [filterType, setFilterType] = useState<"all" | "individual" | "corporate">("all")

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await customerApi.list({
        search: searchTerm || undefined,
        customer_type: filterType !== "all" ? filterType : undefined,
        page: pagination.page,
        limit: pagination.limit,
      })
      setCustomers(response.data.customers)
      setPagination({ ...pagination, total: response.meta.pagination.total, total_pages: response.meta.pagination.total_pages })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failedToLoad"))
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await customerApi.getStats()
      setStats(response.data.stats)
    } catch (error) { console.error("Failed to load stats:", error) }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t("deleteConfirm", { name }))) return
    try {
      await customerApi.delete(id)
      toast.success(t("customerDeleted"))
      fetchCustomers(); fetchStats()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failedToDelete"))
    }
  }

  const handleView = (id: string) => router.push(`/dashboard/customers/${id}`)
  const handleEdit = (id: string) => router.push(`/dashboard/customers/${id}/edit`)

  useEffect(() => { fetchCustomers(); fetchStats() }, [searchTerm, filterType, pagination.page])

  return (
    <div style={{ fontFamily: FONT, color: "#fff", minHeight: "100vh", padding: "32px 0" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 800, letterSpacing: "-0.035em", marginBottom: 6 }}>
            {t("title")}
          </h1>
          <p style={{ fontSize: 14, color: MUTED }}>{t("subtitle")}</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/customers/new")}
          style={{
            fontFamily: FONT, fontSize: 14, fontWeight: 600,
            padding: "10px 20px", borderRadius: 10, border: "none",
            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
            background: GREEN, color: "#fff",
            boxShadow: "0 0 20px rgba(34,197,94,0.25)", transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#16A34A"; e.currentTarget.style.transform = "translateY(-1px)" }}
          onMouseLeave={e => { e.currentTarget.style.background = GREEN; e.currentTarget.style.transform = "none" }}
        >
          <Plus size={16} /> {t("newCustomer")}
        </button>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 28 }}>
        <StatCard label={t("totalCustomers")} value={stats.total_customers} icon={<Users size={16} />} />
        <StatCard label={t("individual")} value={stats.by_type.individual} accent="#38BDF8" icon={<Users size={16} />} />
        <StatCard label={t("corporate")} value={stats.by_type.corporate} accent="#818CF8" icon={<Building2 size={16} />} />
        <StatCard label={t("blacklisted")} value={stats.blacklisted} accent="#EF4444" icon={<AlertTriangle size={16} />} />
      </div>

      {/* ── Search & Filters ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24, alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 260px" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: MUTED }} />
          <input
            placeholder={t("searchPlaceholder")} value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px 10px 36px", borderRadius: 10,
              border: `1px solid ${BORDER}`, background: SURFACE, color: "#fff",
              fontFamily: FONT, fontSize: 13, outline: "none", transition: "border-color 0.2s",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "rgba(34,197,94,0.4)")}
            onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
          />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <FilterBtn active={filterType === "all"} onClick={() => setFilterType("all")}>{t("all")}</FilterBtn>
          <FilterBtn active={filterType === "individual"} onClick={() => setFilterType("individual")}>
            <Users size={13} /> {t("individual")}
          </FilterBtn>
          <FilterBtn active={filterType === "corporate"} onClick={() => setFilterType("corporate")}>
            <Building2 size={13} /> {t("corporate")}
          </FilterBtn>
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${BORDER}`, borderTopColor: GREEN, animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : (
        <>
          <div style={{ borderRadius: 14, border: `1px solid ${BORDER}`, background: SURFACE, overflow: "hidden", marginBottom: 20 }}>
            <DataTable
              columns={[
                {
                  key: "full_name", label: t("name"), sortable: true,
                  render: (value, row) => (
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 13 }}>{value}</p>
                      {row.company_name && <p style={{ fontSize: 11, color: MUTED }}>{row.company_name}</p>}
                    </div>
                  ),
                },
                {
                  key: "customer_type", label: t("type"),
                  render: (value) => (
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      {value === "individual"
                        ? <Users size={14} style={{ color: "#38BDF8" }} />
                        : <Building2 size={14} style={{ color: "#818CF8" }} />}
                      <span style={{ fontSize: 13, textTransform: "capitalize", color: value === "individual" ? "#38BDF8" : "#818CF8" }}>{value}</span>
                    </div>
                  ),
                },
                {
                  key: "email", label: t("contact"),
                  render: (value, row) => (
                    <div>
                      <p style={{ fontSize: 13 }}>{value || "—"}</p>
                      <p style={{ fontSize: 11, color: MUTED }}>{row.phone}</p>
                    </div>
                  ),
                },
                {
                  key: "drivers_license_number", label: t("license"),
                  render: (value) => <span style={{ fontSize: 13, fontFamily: "monospace", color: value ? "#fff" : MUTED }}>{value || "—"}</span>,
                },
                {
                  key: "total_rentals", label: t("rentals"), sortable: true,
                  render: (value) => <span style={{ fontWeight: 700, fontSize: 13 }}>{value}</span>,
                },
                {
                  key: "lifetime_value", label: t("lifetimeValue"), sortable: true,
                  render: (value) => <span style={{ fontWeight: 700, fontSize: 13 }}>{parseFloat(value).toLocaleString()} DZD</span>,
                },
                {
                  key: "is_blacklisted", label: t("status"),
                  render: (value) => value
                    ? <StatusBadge status="cancelled" label={t("blacklistedLabel")} />
                    : <StatusBadge status="active" label={t("active")} />,
                },
                {
                  key: "actions", label: t("actions"),
                  render: (_, row) => (
                    <div style={{ display: "flex", gap: 2 }}>
                      {[
                        { icon: <Eye size={15} />, title: t("viewDetails"), onClick: () => handleView(row.id), color: MUTED },
                        { icon: <Edit2 size={15} />, title: t("edit"), onClick: () => handleEdit(row.id), color: "#38BDF8" },
                        { icon: <Trash2 size={15} />, title: t("delete"), onClick: () => handleDelete(row.id, row.full_name), color: "#EF4444" },
                      ].map((btn, i) => (
                        <button key={i} title={btn.title} onClick={btn.onClick}
                          style={{
                            width: 28, height: 28, borderRadius: 7, border: "none",
                            background: "transparent", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: btn.color, transition: "background 0.15s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          {btn.icon}
                        </button>
                      ))}
                    </div>
                  ),
                },
              ]}
              data={customers}
            />
          </div>

          {/* ── Pagination ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontSize: 13, color: MUTED }}>{t("showing", { count: customers.length, total: pagination.total })}</p>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: t("previous"), disabled: pagination.page === 1, onClick: () => setPagination({ ...pagination, page: pagination.page - 1 }) },
                { label: t("next"), disabled: pagination.page === pagination.total_pages, onClick: () => setPagination({ ...pagination, page: pagination.page + 1 }) },
              ].map((btn, i) => (
                <button key={i} onClick={btn.onClick} disabled={btn.disabled}
                  style={{
                    fontFamily: FONT, fontSize: 13, fontWeight: 500,
                    padding: "8px 16px", borderRadius: 8,
                    cursor: btn.disabled ? "not-allowed" : "pointer",
                    background: SURFACE, color: btn.disabled ? "rgba(255,255,255,0.2)" : MUTED,
                    border: `1px solid ${BORDER}`, transition: "all 0.2s", opacity: btn.disabled ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { if (!btn.disabled) { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)" } }}
                  onMouseLeave={e => { e.currentTarget.style.color = btn.disabled ? "rgba(255,255,255,0.2)" : MUTED; e.currentTarget.style.borderColor = BORDER }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}