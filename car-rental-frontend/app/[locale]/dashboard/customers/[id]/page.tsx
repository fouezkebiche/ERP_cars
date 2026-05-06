// app/[locale]/dashboard/customers/[id]/page.tsx (FULLY LOCALIZED)
"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { CustomerTierBadge } from "@/components/dashboard/CustomerTierBadge"
import {
  ArrowLeft, Edit2, Mail, Phone, MapPin, Calendar,
  CreditCard, AlertTriangle, User, Building2, FileText,
} from "lucide-react"
import { customerApi, Customer, CustomerHistory } from "@/lib/customerApi"
import { customerTierApi } from "@/lib/customerTierApi"
import toast from "react-hot-toast"

/* ─── design tokens ─────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"
const MUTED   = "rgba(255,255,255,0.4)"

/* ─── helpers ────────────────────────────────────────────────── */
function SectionCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ padding: "24px 26px", borderRadius: 14, background: SURFACE, border: `1px solid ${BORDER}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
        {icon && <span style={{ color: MUTED }}>{icon}</span>}
        <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.015em", color: "#fff" }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: MUTED, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      {value && <p style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{value}</p>}
      {children}
    </div>
  )
}

function ContactRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
      <div style={{ marginTop: 2, color: MUTED, flexShrink: 0 }}>{icon}</div>
      <div>
        <p style={{ fontSize: 11, color: MUTED, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{value}</p>
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div style={{ padding: "16px 18px", borderRadius: 11, background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}>
      <p style={{ fontSize: 11, color: MUTED, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.035em", color: accent || "#fff" }}>{value}</p>
    </div>
  )
}

export default function CustomerDetailPage() {
  const t = useTranslations("customers")
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [history, setHistory] = useState<CustomerHistory | null>(null)
  const [tierInfo, setTierInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"details" | "history">("details")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [customerRes, historyRes] = await Promise.all([
          customerApi.getById(customerId),
          customerApi.getHistory(customerId),
        ])
        setCustomer(customerRes.data.customer)
        setHistory(historyRes.data)
        try {
          const tierRes = await customerTierApi.getTierInfo(customerId)
          setTierInfo(tierRes.data)
        } catch (err) { console.error('Failed to fetch tier:', err) }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("failedToLoad"))
        router.push("/dashboard/customers")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [customerId, router, t])

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${BORDER}`, borderTopColor: GREEN, animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!customer) return null

  return (
    <div style={{ fontFamily: FONT, color: "#fff", minHeight: "100vh", padding: "32px 0" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => router.back()}
            style={{
              width: 36, height: 36, borderRadius: 10, border: `1px solid ${BORDER}`,
              background: SURFACE, color: MUTED, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)"; e.currentTarget.style.color = "#fff" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, letterSpacing: "-0.035em", marginBottom: 4 }}>
              {customer.full_name}
            </h1>
            <p style={{ fontSize: 13, color: MUTED }}>
              {customer.customer_type === "corporate" ? t("corporate") : t("individual")}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/dashboard/customers/${customerId}/edit`)}
          style={{
            fontFamily: FONT, fontSize: 13, fontWeight: 600,
            padding: "9px 18px", borderRadius: 9,
            border: `1px solid ${BORDER}`, background: SURFACE, color: MUTED,
            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7,
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)"; e.currentTarget.style.color = "#fff" }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED }}
        >
          <Edit2 size={14} /> {t("edit")}
        </button>
      </div>

      {/* ── Blacklist Alert ── */}
      {customer.is_blacklisted && (
        <div style={{
          padding: "14px 16px", borderRadius: 10, marginBottom: 20,
          background: "rgba(239,68,68,0.07)", borderLeft: "3px solid #EF4444",
          border: "1px solid rgba(239,68,68,0.2)",
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <AlertTriangle size={16} style={{ color: "#EF4444", marginTop: 1, flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#F87171", marginBottom: 3 }}>{t("blacklistedLabel")}</p>
            <p style={{ fontSize: 12, color: MUTED }}>Cannot create new contracts for this customer</p>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, marginBottom: 24, display: "flex", gap: 4 }}>
        {([
          { key: "details", label: t("customerDetails") },
          { key: "history", label: `${t("rentalHistory")} (${history?.stats.total_contracts || 0})` },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              fontFamily: FONT, fontSize: 13, fontWeight: 600,
              padding: "10px 18px", background: "transparent", border: "none",
              borderBottom: `2px solid ${activeTab === tab.key ? GREEN : "transparent"}`,
              color: activeTab === tab.key ? GREEN : MUTED,
              cursor: "pointer", transition: "all 0.2s", marginBottom: -1,
            }}
            onMouseEnter={e => { if (activeTab !== tab.key) e.currentTarget.style.color = "#fff" }}
            onMouseLeave={e => { if (activeTab !== tab.key) e.currentTarget.style.color = MUTED }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════ DETAILS TAB ════════ */}
      {activeTab === "details" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, alignItems: "start" }}>

          {/* ── Left ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Loyalty */}
            {tierInfo && (
              <SectionCard title="Loyalty Program">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: MUTED }}>Apply tier discount:</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: customer.apply_tier_discount !== false ? GREEN : MUTED }}>
                      {customer.apply_tier_discount !== false ? "Yes" : "No"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: MUTED }}>Current Tier:</span>
                    <CustomerTierBadge tier={tierInfo.tier} tierName={tierInfo.name} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: MUTED }}>Overage Rate:</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{tierInfo.overage_rate} DZD/km</span>
                  </div>
                  {tierInfo.km_bonus > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: MUTED }}>KM Bonus:</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: GREEN }}>+{tierInfo.km_bonus} km/day</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: MUTED }}>Discount:</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{tierInfo.discount_percentage}% on overages</span>
                  </div>

                  {tierInfo.progress && !tierInfo.progress.is_max_tier && (
                    <div style={{ marginTop: 4, padding: "12px 14px", borderRadius: 10, background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.18)" }}>
                      <p style={{ fontSize: 12, color: "#38BDF8", marginBottom: 8 }}>
                        {tierInfo.progress.rentals_to_next_tier} more rental{tierInfo.progress.rentals_to_next_tier > 1 ? 's' : ''} to reach {tierInfo.progress.next_tier_name}!
                      </p>
                      <div style={{ width: "100%", height: 5, background: "rgba(56,189,248,0.15)", borderRadius: 999 }}>
                        <div style={{ height: "100%", background: "#38BDF8", borderRadius: 999, width: `${tierInfo.progress.progress_percentage}%`, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 4, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Benefits:</p>
                    <ul style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {tierInfo.benefits.map((benefit: string, i: number) => (
                        <li key={i} style={{ fontSize: 13, color: MUTED, display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: GREEN, display: "inline-block", flexShrink: 0 }} />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Contact */}
            <SectionCard title={t("contactInfo")} icon={<User size={15} />}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {customer.email && <ContactRow icon={<Mail size={15} />} label={t("email")} value={customer.email} />}
                <ContactRow icon={<Phone size={15} />} label={t("phone")} value={customer.phone} />
                {customer.address && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <MapPin size={15} style={{ color: MUTED, marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 11, color: MUTED, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("address")}</p>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{customer.address}</p>
                      {customer.city && <p style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{customer.city}</p>}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Corporate */}
            {customer.customer_type === "corporate" && customer.company_name && (
              <SectionCard title={t("companyInfo")} icon={<Building2 size={15} />}>
                <InfoRow label={t("companyName")} value={customer.company_name} />
              </SectionCard>
            )}

            {/* License */}
            {customer.drivers_license_number && (
              <SectionCard title={t("documents")} icon={<CreditCard size={15} />}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <InfoRow label={t("licenseNumber")} value={customer.drivers_license_number} />
                  {customer.license_expiry_date && (
                    <InfoRow label={t("licenseExpiry")} value={new Date(customer.license_expiry_date).toLocaleDateString()} />
                  )}
                </div>
              </SectionCard>
            )}

            {/* Emergency Contact */}
            {customer.emergency_contact_name && (
              <SectionCard title={t("emergencyContact")}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <InfoRow label={t("emergencyContactName")} value={customer.emergency_contact_name} />
                  {customer.emergency_contact_phone && (
                    <InfoRow label={t("emergencyContactPhone")} value={customer.emergency_contact_phone} />
                  )}
                </div>
              </SectionCard>
            )}

            {/* Notes */}
            {customer.notes && (
              <SectionCard title="Notes" icon={<FileText size={15} />}>
                <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{customer.notes}</p>
              </SectionCard>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <div style={{ position: "sticky", top: 24 }}>
            <div style={{ padding: "22px", borderRadius: 14, background: SURFACE, border: `1px solid ${BORDER}` }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.015em", marginBottom: 16 }}>Customer Statistics</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <StatCard label={t("totalRentals")} value={customer.total_rentals} />
                <StatCard label={t("lifetimeValue")} value={`${parseFloat(customer.lifetime_value).toLocaleString()} DZD`} accent={GREEN} />
                <StatCard label={t("customerSince")} value={new Date(customer.created_at).toLocaleDateString()} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════ HISTORY TAB ════════ */}
      {activeTab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
            {[
              { label: "Total Contracts", value: history?.stats.total_contracts || 0 },
              { label: "Active", value: history?.stats.active_contracts || 0, accent: GREEN },
              { label: "Completed", value: history?.stats.completed_contracts || 0 },
              { label: t("totalSpent"), value: `${(history?.stats.total_spent || 0).toLocaleString()} DZD` },
            ].map((s, i) => (
              <StatCard key={i} label={s.label} value={s.value} accent={s.accent} />
            ))}
          </div>

          {/* Table */}
          {history && history.contracts.length > 0 ? (
            <div style={{ borderRadius: 14, border: `1px solid ${BORDER}`, background: SURFACE, overflow: "hidden" }}>
              <DataTable
                columns={[
                  {
                    key: "contract_number", label: "Contract #", sortable: true,
                    render: (value) => <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: GREEN }}>{value}</span>,
                  },
                  {
                    key: "vehicle", label: "Vehicle",
                    render: (vehicle) => <span style={{ fontSize: 13 }}>{vehicle.brand} {vehicle.model} ({vehicle.registration_number})</span>,
                  },
                  {
                    key: "start_date", label: "Period",
                    render: (value, row) => (
                      <span style={{ fontSize: 12 }}>
                        {new Date(value).toLocaleDateString()} → {new Date(row.end_date).toLocaleDateString()}
                      </span>
                    ),
                  },
                  {
                    key: "total_amount", label: "Amount", sortable: true,
                    render: (value) => <span style={{ fontWeight: 700, fontSize: 13 }}>{parseFloat(value).toLocaleString()} DZD</span>,
                  },
                  {
                    key: "status", label: t("status"),
                    render: (status) => <StatusBadge status={status} />,
                  },
                ]}
                data={history.contracts}
              />
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "56px 0" }}>
              <FileText size={44} style={{ color: "rgba(255,255,255,0.1)", display: "block", margin: "0 auto 14px" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: MUTED, marginBottom: 6 }}>{t("noRentalHistory")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}