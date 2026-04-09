"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import {
  Save, Plus, Trash2, Edit2, X, Check,
  Settings, CreditCard, Bell, AlertTriangle,
  Car, Users, Zap, Loader2,
} from "lucide-react"
import toast from "react-hot-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

interface AdminPlan {
  id: string
  name: string
  description?: string
  priceMonthly: number
  maxVehicles: number
  maxUsers?: number
  features?: string[]
}

interface AdminSettings {
  platformName?: string
  supportEmail?: string
  supportPhone?: string
  maintenanceMode?: boolean
  plans?: AdminPlan[]
  [key: string]: any
}

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : ""
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-widest"
        style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>{hint}</p>
      )}
    </div>
  )
}

// ── Styled inputs ─────────────────────────────────────────────────────────────
function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-4 py-2.5 rounded-xl text-sm transition-all outline-none"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#ffffff",
        fontFamily: "monospace",
        ...(props.style || {}),
      }}
      onFocus={e => {
        e.currentTarget.style.borderColor = "rgba(129,140,248,0.5)"
        e.currentTarget.style.background  = "rgba(129,140,248,0.06)"
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"
        e.currentTarget.style.background  = "rgba(255,255,255,0.04)"
      }}
    />
  )
}

function StyledTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full px-4 py-2.5 rounded-xl text-sm transition-all outline-none resize-none"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#ffffff",
        fontFamily: "monospace",
        minHeight: 72,
      }}
      onFocus={e => {
        e.currentTarget.style.borderColor = "rgba(129,140,248,0.5)"
        e.currentTarget.style.background  = "rgba(129,140,248,0.06)"
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"
        e.currentTarget.style.background  = "rgba(255,255,255,0.04)"
      }}
    />
  )
}

// ── Save button ───────────────────────────────────────────────────────────────
function SaveBtn({ loading, label, loadingLabel, onClick }: {
  loading: boolean; label: string; loadingLabel: string; onClick: () => void
}) {
  return (
    <button onClick={onClick} disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
      style={{ background: "rgba(129,140,248,0.2)", border: "1px solid rgba(129,140,248,0.4)", color: "#818cf8", fontFamily: "monospace" }}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
      {loading ? loadingLabel : label}
    </button>
  )
}

// ── Plan card ─────────────────────────────────────────────────────────────────
const PLAN_COLORS: Record<string, string> = {
  basic: "#60a5fa", professional: "#818cf8", pro: "#818cf8", enterprise: "#c084fc",
}
function getPlanColor(name: string) {
  return PLAN_COLORS[name?.toLowerCase()] || "#f59e0b"
}

function PlanCard({ plan, onEdit, onDelete, deleting }: {
  plan: AdminPlan; onEdit: () => void; onDelete: () => void; deleting: boolean
}) {
  const color = getPlanColor(plan.name)
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden group transition-all"
      style={{ background: "#080810", border: `1px solid ${color}25` }}>
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`, transform: "translate(30%,-30%)" }} />

      {/* header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <h3 className="text-base font-black text-white capitalize" style={{ fontFamily: "monospace" }}>{plan.name}</h3>
          </div>
          {plan.description && (
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "monospace", maxWidth: 220 }}>{plan.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit}
            className="p-1.5 rounded-lg transition-all"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)" }}>
            <Edit2 size={13} />
          </button>
          <button onClick={onDelete} disabled={deleting}
            className="p-1.5 rounded-lg transition-all disabled:opacity-40"
            style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.2)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.1)"}>
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          </button>
        </div>
      </div>

      {/* price */}
      <div className="mb-4">
        <span className="text-3xl font-black" style={{ color, fontFamily: "monospace" }}>
          {plan.priceMonthly === 0 ? "Free" : plan.priceMonthly.toLocaleString("fr-DZ")}
        </span>
        {plan.priceMonthly > 0 && (
          <span className="text-xs ml-1.5" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>DZD/mo</span>
        )}
      </div>

      {/* limits */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
          <Car size={11} style={{ color }} />
          <span>{plan.maxVehicles === -1 ? "Unlimited" : plan.maxVehicles} vehicles</span>
        </div>
        {plan.maxUsers !== undefined && (
          <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
            <Users size={11} style={{ color }} />
            <span>{plan.maxUsers === -1 ? "Unlimited" : plan.maxUsers} users</span>
          </div>
        )}
        {plan.features && plan.features.length > 0 && (
          <div className="pt-2 mt-2 space-y-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {plan.features.slice(0, 4).map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
                <Check size={10} style={{ color, flexShrink: 0 }} />
                {f}
              </div>
            ))}
            {plan.features.length > 4 && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>+{plan.features.length - 4} more</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Plan modal ────────────────────────────────────────────────────────────────
function PlanModal({ plan, onClose, onSave, saving }: {
  plan: Partial<AdminPlan> | null
  onClose: () => void
  onSave: (plan: Partial<AdminPlan>) => Promise<void>
  saving: boolean
}) {
  const [form, setForm] = useState<Partial<AdminPlan>>(
    plan || { name: "", description: "", priceMonthly: 0, maxVehicles: 20, maxUsers: 5, features: [] }
  )
  const [featInput, setFeatInput] = useState("")
  const isEdit = !!plan?.id

  const addFeature = () => {
    if (!featInput.trim()) return
    setForm(p => ({ ...p, features: [...(p.features || []), featInput.trim()] }))
    setFeatInput("")
  }
  const removeFeature = (i: number) =>
    setForm(p => ({ ...p, features: (p.features || []).filter((_, idx) => idx !== i) }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: "#0d0d18", border: "1px solid rgba(255,255,255,0.1)" }}>

        {/* header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2">
            <CreditCard size={14} style={{ color: "#818cf8" }} />
            <h3 className="text-sm font-black text-white" style={{ fontFamily: "monospace" }}>
              {isEdit ? "Edit Plan" : "New Plan"}
            </h3>
          </div>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#fff"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"}>
            <X size={15} />
          </button>
        </div>

        {/* body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto" style={{ maxHeight: "65vh" }}>
          <Field label="Plan Name">
            <StyledInput
              value={form.name || ""}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Basic, Professional, Enterprise"
            />
          </Field>

          <Field label="Description">
            <StyledTextarea
              value={form.description || ""}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Short description shown to companies on the pricing page"
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Price/mo (DZD)">
              <StyledInput
                type="number" min={0}
                value={form.priceMonthly ?? 0}
                onChange={e => setForm(p => ({ ...p, priceMonthly: parseFloat(e.target.value || "0") }))}
              />
            </Field>
            <Field label="Max Vehicles" hint="-1 = unlimited">
              <StyledInput
                type="number" min={-1}
                value={form.maxVehicles ?? 20}
                onChange={e => setForm(p => ({ ...p, maxVehicles: parseInt(e.target.value || "1") }))}
              />
            </Field>
            <Field label="Max Users" hint="-1 = unlimited">
              <StyledInput
                type="number" min={-1}
                value={form.maxUsers ?? 5}
                onChange={e => setForm(p => ({ ...p, maxUsers: parseInt(e.target.value || "1") }))}
              />
            </Field>
          </div>

          <Field label="Features" hint="Press Enter or + to add a bullet">
            <div className="space-y-2">
              {(form.features || []).map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Check size={10} style={{ color: "#34d399", flexShrink: 0 }} />
                  <span className="flex-1 text-xs text-white" style={{ fontFamily: "monospace" }}>{f}</span>
                  <button onClick={() => removeFeature(i)} style={{ color: "#f87171" }}><X size={11} /></button>
                </div>
              ))}
              <div className="flex gap-2">
                <StyledInput
                  value={featInput}
                  onChange={e => setFeatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addFeature()}
                  placeholder="e.g. Advanced analytics"
                  style={{ flex: 1 }}
                />
                <button onClick={addFeature}
                  className="px-3 rounded-xl text-xs font-bold transition-all"
                  style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399" }}>
                  <Plus size={12} />
                </button>
              </div>
            </div>
          </Field>
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
            Cancel
          </button>
          <button onClick={() => onSave(form)} disabled={saving || !form.name?.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
            style={{ background: "rgba(129,140,248,0.2)", border: "1px solid rgba(129,140,248,0.4)", color: "#818cf8", fontFamily: "monospace" }}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            {saving ? "Saving..." : isEdit ? "Update Plan" : "Create Plan"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const t = useTranslations("adminSettings")

  const [activeTab, setActiveTab] = useState<"general" | "plans" | "notifications">("general")
  const [isSaving, setIsSaving]   = useState(false)
  const [settings, setSettings]   = useState<AdminSettings>({})
  const [plans, setPlans]         = useState<AdminPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [planModal, setPlanModal] = useState<{ open: boolean; plan: Partial<AdminPlan> | null }>({ open: false, plan: null })
  const [planSaving, setPlanSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Load settings (and plans embedded in settings) ──
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/settings`, { headers: authHeaders() })
        if (!res.ok) { if (res.status === 401) { toast.error(t("errors.sessionExpired")); return } throw new Error(`HTTP ${res.status}`) }
        const json  = await res.json()
        const s     = json?.data?.settings ?? {}
        setSettings(s)
        setPlans(s.plans ?? [])
      } catch (err) {
        toast.error(t("errors.loadFailed"))
      } finally {
        setPlansLoading(false)
      }
    })()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, type, value, checked } = e.target as HTMLInputElement
    setSettings(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
  }

  // ── Persist full settings (general fields + plans array) ──
  const persist = async (updatedPlans: AdminPlan[], showToast = true) => {
    const res = await fetch(`${API_URL}/api/admin/settings`, {
      method: "PUT", headers: authHeaders(),
      body: JSON.stringify({ settings: { ...settings, plans: updatedPlans } }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    if (showToast) toast.success(t("errors.saveSuccess"))
  }

  const handleSaveGeneral = async () => {
    setIsSaving(true)
    try { await persist(plans) } catch { toast.error(t("errors.saveFailed")) } finally { setIsSaving(false) }
  }

  // ── CRUD plans ──
  const handleSavePlan = async (form: Partial<AdminPlan>) => {
    setPlanSaving(true)
    try {
      const isEdit = !!form.id
      const updated = isEdit
        ? plans.map(p => p.id === form.id ? { ...p, ...form } as AdminPlan : p)
        : [...plans, { id: `plan_${Date.now()}`, name: form.name!, description: form.description || "", priceMonthly: form.priceMonthly ?? 0, maxVehicles: form.maxVehicles ?? 20, maxUsers: form.maxUsers ?? 5, features: form.features || [] }]
      await persist(updated, false)
      setPlans(updated)
      setPlanModal({ open: false, plan: null })
      toast.success(isEdit ? "Plan updated" : "Plan created")
    } catch { toast.error("Failed to save plan") } finally { setPlanSaving(false) }
  }

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm("Delete this plan?")) return
    setDeletingId(id)
    try {
      const updated = plans.filter(p => p.id !== id)
      await persist(updated, false)
      setPlans(updated)
      toast.success("Plan deleted")
    } catch { toast.error("Failed to delete plan") } finally { setDeletingId(null) }
  }

  const TABS = [
    { id: "general"       as const, icon: <Settings size={13} />,   label: t("tabs.general") },
    { id: "plans"         as const, icon: <CreditCard size={13} />, label: t("tabs.plans") },
    { id: "notifications" as const, icon: <Bell size={13} />,       label: t("tabs.notifications") },
  ]

  return (
    <div className="space-y-6 max-w-[1200px]">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings size={16} style={{ color: "#818cf8" }} />
          <h1 className="text-xl font-black text-white" style={{ fontFamily: "monospace" }}>{t("title")}</h1>
        </div>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>{t("subtitle")}</p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl w-fit"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: activeTab === tab.id ? "rgba(129,140,248,0.2)" : "transparent",
              border:     activeTab === tab.id ? "1px solid rgba(129,140,248,0.35)" : "1px solid transparent",
              color:      activeTab === tab.id ? "#818cf8" : "rgba(255,255,255,0.4)",
              fontFamily: "monospace",
            }}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ── GENERAL ── */}
      {activeTab === "general" && (
        <div className="rounded-2xl p-6 max-w-xl space-y-5"
          style={{ background: "#080810", border: "1px solid rgba(255,255,255,0.07)" }}>

          <Field label={t("general.platformName")}>
            <StyledInput name="platformName" value={settings.platformName ?? ""} onChange={handleChange} placeholder={t("placeholder.platformName")} />
          </Field>

          <Field label={t("general.supportEmail")}>
            <StyledInput type="email" name="supportEmail" value={settings.supportEmail ?? ""} onChange={handleChange} placeholder={t("placeholder.supportEmail")} />
          </Field>

          <Field label={t("general.supportPhone")}>
            <StyledInput name="supportPhone" value={settings.supportPhone ?? ""} onChange={handleChange} placeholder={t("placeholder.supportPhone")} />
          </Field>

          <Field label={t("general.maintenanceMode")} hint={t("general.maintenanceModeDesc")}>
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-all"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {/* Custom toggle */}
              <div className="relative shrink-0 cursor-pointer" onClick={() => setSettings(p => ({ ...p, maintenanceMode: !p.maintenanceMode }))}>
                <div className="w-10 h-5 rounded-full transition-all"
                  style={{ background: settings.maintenanceMode ? "rgba(248,113,113,0.4)" : "rgba(255,255,255,0.1)", border: `1px solid ${settings.maintenanceMode ? "rgba(248,113,113,0.6)" : "rgba(255,255,255,0.15)"}` }}>
                  <div className="w-4 h-4 rounded-full transition-all mt-px"
                    style={{ background: settings.maintenanceMode ? "#f87171" : "rgba(255,255,255,0.5)", marginLeft: settings.maintenanceMode ? "calc(100% - 1.1rem)" : "2px" }} />
                </div>
              </div>
              <span className="text-sm" style={{ color: settings.maintenanceMode ? "#f87171" : "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>
                {settings.maintenanceMode ? "Maintenance mode ON" : "Maintenance mode OFF"}
              </span>
              {settings.maintenanceMode && (
                <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)" }}>
                  <AlertTriangle size={10} style={{ color: "#f87171" }} />
                  <span className="text-xs font-black" style={{ color: "#f87171", fontFamily: "monospace" }}>ACTIVE</span>
                </div>
              )}
            </label>
          </Field>

          <div className="pt-1">
            <SaveBtn loading={isSaving} label={t("actions.save")} loadingLabel={t("actions.saving")} onClick={handleSaveGeneral} />
          </div>
        </div>
      )}

      {/* ── PLANS ── */}
      {activeTab === "plans" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>{t("plans.description")}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
                Changes here update what companies see on the public pricing page.
              </p>
            </div>
            <button onClick={() => setPlanModal({ open: true, plan: null })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399", fontFamily: "monospace" }}>
              <Plus size={13} />New Plan
            </button>
          </div>

          {plansLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-2xl h-52 animate-pulse" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }} />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="rounded-2xl p-16 flex flex-col items-center justify-center gap-3"
              style={{ background: "#080810", border: "1px dashed rgba(255,255,255,0.1)" }}>
              <CreditCard size={32} style={{ color: "rgba(255,255,255,0.1)" }} />
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>No plans yet. Create your first subscription plan.</p>
              <button onClick={() => setPlanModal({ open: true, plan: null })}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold mt-2"
                style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.3)", color: "#818cf8", fontFamily: "monospace" }}>
                <Plus size={12} />Create first plan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map(plan => (
                <PlanCard key={plan.id} plan={plan}
                  onEdit={() => setPlanModal({ open: true, plan })}
                  onDelete={() => handleDeletePlan(plan.id)}
                  deleting={deletingId === plan.id} />
              ))}
            </div>
          )}

          {plans.length > 0 && (
            <div className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)" }}>
              <Zap size={13} style={{ color: "#34d399", flexShrink: 0 }} />
              <p className="text-xs" style={{ color: "rgba(52,211,153,0.7)", fontFamily: "monospace" }}>
                {plans.length} plan{plans.length !== 1 ? "s" : ""} live — companies see these on the pricing page when signing up.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {activeTab === "notifications" && (
        <div className="rounded-2xl p-6 max-w-xl space-y-4"
          style={{ background: "#080810", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
            {t("notifications.description")}
          </p>
          <div className="text-xs px-4 py-3 rounded-xl" style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", fontFamily: "monospace" }}>
            {t("notifications.futureNote")}{" "}
            <code className="px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.07)", color: "#818cf8" }}>/api/admin/companies</code>
            {" "}{t("notifications.futureNoteEnd")}
          </div>
        </div>
      )}

      {/* Plan modal */}
      {planModal.open && (
        <PlanModal
          plan={planModal.plan}
          onClose={() => setPlanModal({ open: false, plan: null })}
          onSave={handleSavePlan}
          saving={planSaving}
        />
      )}
    </div>
  )
}