// app/[locale]/dashboard/settings/page.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import SubscriptionBillingCard from "@/components/subscription/SubscriptionBillingCard"
import { Save, Bell, X } from "lucide-react"
import toast from "react-hot-toast"
import { useNotifications } from "@/hooks/useNotifications"
import { useTranslations } from "next-intl"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// ── Design tokens ────────────────────────────────────────────────────────────
const SURFACE      = 'rgba(255,255,255,0.04)'
const SURFACE2     = 'rgba(255,255,255,0.07)'
const BORDER_COLOR = 'rgba(255,255,255,0.07)'
const GREEN        = '#22C55E'
const MUTED        = 'rgba(255,255,255,0.4)'
const TEXT         = '#FFFFFF'
const FONT         = "'Plus Jakarta Sans', system-ui, sans-serif"

const globalStyle = `
  @keyframes _spin { to { transform: rotate(360deg); } }
  select option { background: #0D1117 !important; color: #FFFFFF !important; }
`

// ── Types ────────────────────────────────────────────────────────────────────
interface Wilaya  { id: string; code: string; name: string; ar_name: string; longitude: string; latitude: string }
interface Commune { id: string; post_code: string; name: string; wilaya_id: string; ar_name: string; longitude: string; latitude: string }
interface Settings {
  theme?: string; notificationsEnabled?: boolean
  defaultDailyKmLimit?: number; defaultOverageRate?: number
  wilaya?: string; wilaya_id?: string; commune?: string; commune_id?: string
  [key: string]: any
}

// ── Shared primitives ────────────────────────────────────────────────────────
function SectionCard({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER_COLOR}`, borderRadius: 12, padding: 24 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: TEXT, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} style={{
      display: 'block', fontSize: 12, fontWeight: 500, color: MUTED,
      marginBottom: 6, fontFamily: FONT,
      textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>
      {children}
    </label>
  )
}

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { style, ...rest } = props
  return (
    <input
      {...rest}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 8,
        borderWidth: 1, borderStyle: 'solid', borderColor: BORDER_COLOR,
        background: SURFACE2, color: TEXT, fontFamily: FONT, fontSize: 13,
        outline: 'none', boxSizing: 'border-box', ...style,
      }}
      onFocus={e => { e.currentTarget.style.borderColor = GREEN; e.currentTarget.style.boxShadow = `0 0 0 2px ${GREEN}22` }}
      onBlur={e => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.boxShadow = 'none' }}
    />
  )
}

function StyledSelect(props: React.SelectHTMLAttributes<HTMLSelectElement> & { onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void }) {
  const { style, ...rest } = props
  return (
    <select
      {...rest}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 8,
        borderWidth: 1, borderStyle: 'solid',
        borderColor: props.disabled ? `${BORDER_COLOR}` : BORDER_COLOR,
        background: props.disabled ? 'rgba(255,255,255,0.02)' : '#0D1117',
        color: props.disabled ? MUTED : TEXT,
        fontFamily: FONT, fontSize: 13,
        outline: 'none', cursor: props.disabled ? 'not-allowed' : 'pointer',
        colorScheme: 'dark',
        ...style,
      } as React.CSSProperties}
      onFocus={e => { if (!props.disabled) { e.currentTarget.style.borderColor = GREEN; e.currentTarget.style.boxShadow = `0 0 0 2px ${GREEN}22` } }}
      onBlur={e => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.boxShadow = 'none' }}
    />
  )
}

function SaveBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '10px 22px', borderRadius: 8, border: 'none',
        background: disabled ? BORDER_COLOR : GREEN,
        color: disabled ? MUTED : '#000',
        fontFamily: FONT, fontSize: 14, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : `0 0 14px ${GREEN}44`,
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = '#16a34a' }}
      onMouseLeave={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = disabled ? BORDER_COLOR : GREEN }}
    >
      {children}
    </button>
  )
}

// ── Checkbox row ─────────────────────────────────────────────────────────────
function CheckRow({ label, description }: { label: string; description: string }) {
  const [checked, setChecked] = useState(true)
  return (
    <label
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14,
        borderRadius: 10, border: `1px solid ${checked ? GREEN + '33' : BORDER_COLOR}`,
        background: checked ? `${GREEN}08` : SURFACE,
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      {/* Custom checkbox */}
      <div
        onClick={() => setChecked(v => !v)}
        style={{
          width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
          borderWidth: 2, borderStyle: 'solid',
          borderColor: checked ? GREEN : BORDER_COLOR,
          background: checked ? GREEN : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: TEXT, margin: 0 }}>{label}</p>
        <p style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{description}</p>
      </div>
    </label>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function SettingsPage() {
  const t = useTranslations("settings")
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("company")
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "", address: "", phone: "", email: "", taxId: "", logoUrl: "",
  })
  const [settingsData, setSettingsData] = useState<Settings>({})
  const [token] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  )
  const [wilayas, setWilayas]   = useState<Wilaya[]>([])
  const [communes, setCommunes] = useState<Commune[]>([])
  const [geoLoading, setGeoLoading] = useState(true)
  const [selectedWilayaId, setSelectedWilayaId] = useState("")

  const { data: notificationsData, dismissNotification } = useNotifications({
    priority: 'critical', limit: 3, unread: true,
  })
  const criticalNotifications = notificationsData?.notifications || []

  useEffect(() => {
    async function loadGeoData() {
      try {
        const [wRes, cRes] = await Promise.all([fetch("/Wilaya_Of_Algeria.json"), fetch("/Commune_Of_Algeria.json")])
        if (!wRes.ok || !cRes.ok) throw new Error("Could not load geo data files")
        const [wData, cData]: [Wilaya[], Commune[]] = await Promise.all([wRes.json(), cRes.json()])
        setWilayas(wData.sort((a, b) => parseInt(a.id) - parseInt(b.id)))
        setCommunes(cData)
      } catch (e) {
        toast.error("Could not load wilaya/commune data")
      } finally {
        setGeoLoading(false)
      }
    }
    loadGeoData()
  }, [])

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab")
    if (tab && ["company", "settings", "billing", "notifications"].includes(tab)) {
      setActiveTab(tab)
    }
  }, [])

  useEffect(() => {
    if (!token) return
    async function loadCompanyData() {
      try {
        const res = await fetch(`${API_URL}/api/company/profile`, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error("Failed to load company profile")
        const response = await res.json()
        const data = response.data?.company || response.data || {}
        setFormData({ name: data.name || "", address: data.address || "", phone: data.phone || "", email: data.email || "", taxId: data.tax_id || "", logoUrl: data.logo_url || "" })
        setSettingsData(data.settings || {})
        if (data.settings?.wilaya_id) setSelectedWilayaId(data.settings.wilaya_id)
      } catch (e) {
        toast.error("Could not load company profile")
      }
    }
    loadCompanyData()
  }, [token])

  const filteredCommunes = selectedWilayaId ? communes.filter(c => c.wilaya_id === selectedWilayaId) : []

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setSettingsData(prev => ({ ...prev, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value }))
  }

  const handleSaveProfile = async () => {
    if (!token) return
    setIsLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/company/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      })
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || "Failed") }
      toast.success(t("profileSaved"))
    } catch (e) { toast.error(t("failedToSaveProfile")) }
    finally { setIsLoading(false) }
  }

  const handleSaveSettings = async () => {
    if (!token) return
    setIsLoading(true)
    try {
      const selectedWilaya  = wilayas.find(w => w.id === selectedWilayaId)
      const selectedCommune = filteredCommunes.find(c => c.id === settingsData.commune_id)
      const payload = { ...settingsData, wilaya: selectedWilaya?.name || "", wilaya_id: selectedWilayaId || "", commune: selectedCommune?.name || "", commune_id: settingsData.commune_id || "" }
      const res = await fetch(`${API_URL}/api/company/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to save settings")
      setSettingsData(payload)
      toast.success(t("settingsSaved"))
    } catch (e) { toast.error(t("failedToSaveSettings")) }
    finally { setIsLoading(false) }
  }

  const tabs = [
    { id: "company",       label: t("companyProfile") },
    { id: "settings",      label: t("companySettings") },
    { id: "billing",       label: t("billing") },
    { id: "notifications", label: t("notifications") },
  ]

  return (
    <>
      <style>{globalStyle}</style>
      <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 80, fontFamily: FONT, color: TEXT, display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ── Tab bar ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER_COLOR}`, overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 22px',
                background: 'transparent', border: 'none',
                borderBottom: activeTab === tab.id ? `2px solid ${GREEN}` : '2px solid transparent',
                color: activeTab === tab.id ? GREEN : MUTED,
                fontFamily: FONT, fontSize: 14,
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'color 0.15s', marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── COMPANY PROFILE ─────────────────────────────────────────────── */}
        {activeTab === "company" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SectionCard title={t("companyProfile")}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <FieldLabel htmlFor="name">{t("companyName")}</FieldLabel>
                    <StyledInput id="name" name="name" value={formData.name} onChange={handleProfileChange} placeholder="Your Company Name" />
                  </div>
                  <div>
                    <FieldLabel htmlFor="email">{t("companyEmail")}</FieldLabel>
                    <StyledInput id="email" name="email" type="email" value={formData.email} onChange={handleProfileChange} placeholder="contact@company.com" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <FieldLabel htmlFor="phone">{t("companyPhone")}</FieldLabel>
                    <StyledInput id="phone" name="phone" value={formData.phone} onChange={handleProfileChange} placeholder="+213 XXX XXX XXX" />
                  </div>
                </div>
              </div>
            </SectionCard>

            <div>
              <SaveBtn onClick={handleSaveProfile} disabled={isLoading}>
                <Save style={{ width: 15, height: 15 }} />
                {isLoading ? t("saving") : t("saveProfile")}
              </SaveBtn>
            </div>
          </div>
        )}

        {/* ── COMPANY SETTINGS ────────────────────────────────────────────── */}
        {activeTab === "settings" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Location */}
            <SectionCard title={<>📍 {t("location")}</>}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <FieldLabel htmlFor="wilaya_id">{t("wilaya")}</FieldLabel>
                    <StyledSelect
                      id="wilaya_id"
                      name="wilaya_id"
                      value={selectedWilayaId}
                      onChange={e => {
                        setSelectedWilayaId(e.target.value)
                        setSettingsData(prev => ({ ...prev, commune_id: "" }))
                      }}
                    >
                      <option value="">{t("selectWilaya")}</option>
                      {wilayas.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </StyledSelect>
                  </div>
                  <div>
                    <FieldLabel htmlFor="commune_id">{t("commune")}</FieldLabel>
                    <StyledSelect
                      id="commune_id"
                      name="commune_id"
                      value={settingsData.commune_id || ""}
                      onChange={handleSettingsChange}
                      disabled={!selectedWilayaId}
                    >
                      <option value="">{t("selectCommune")}</option>
                      {filteredCommunes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </StyledSelect>
                  </div>
                </div>

                {!settingsData.wilaya && (
                  <p style={{ fontSize: 12, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 6 }}>
                    ⚠️ {t("locationWarning")}
                  </p>
                )}
              </div>
            </SectionCard>

            {/* Rental policies */}
            <SectionCard title={<>🚗 {t("rentalPolicies")}</>}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Daily KM limit */}
                <div>
                  <FieldLabel htmlFor="defaultDailyKmLimit">
                    {t("defaultDailyKmLimit")} <span style={{ color: MUTED, fontWeight: 400, textTransform: 'none' }}>({t("perDay")})</span>
                  </FieldLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <StyledInput
                      id="defaultDailyKmLimit"
                      name="defaultDailyKmLimit"
                      type="number"
                      min="50" max="1000" step="50"
                      value={settingsData.defaultDailyKmLimit ?? 300}
                      onChange={handleSettingsChange}
                      style={{ width: 120 }}
                    />
                    <span style={{ fontSize: 13, color: MUTED }}>{t("kmPerDay")}</span>
                  </div>
                  <p style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>{t("kmLimitDescription")}</p>
                </div>

                {/* Overage rate */}
                <div>
                  <FieldLabel htmlFor="defaultOverageRate">
                    {t("defaultOverageRate")} <span style={{ color: MUTED, fontWeight: 400, textTransform: 'none' }}>({t("forNewCustomers")})</span>
                  </FieldLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <StyledInput
                      id="defaultOverageRate"
                      name="defaultOverageRate"
                      type="number"
                      min="5" max="50" step="1"
                      value={settingsData.defaultOverageRate ?? 20}
                      onChange={handleSettingsChange}
                      style={{ width: 120 }}
                    />
                    <span style={{ fontSize: 13, color: MUTED }}>{t("daPerKm")}</span>
                  </div>
                  <p style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>{t("overageRateDescription")}</p>
                </div>
              </div>
            </SectionCard>

            <div>
              <SaveBtn onClick={handleSaveSettings} disabled={isLoading}>
                <Save style={{ width: 15, height: 15 }} />
                {isLoading ? t("saving") : t("saveSettings")}
              </SaveBtn>
            </div>
          </div>
        )}

        {/* ── BILLING ─────────────────────────────────────────────────────── */}
        {activeTab === "billing" && (
          <SectionCard title={t("currentSubscription")}>
            <SubscriptionBillingCard />
          </SectionCard>
        )}

        {/* ── NOTIFICATIONS ───────────────────────────────────────────────── */}
        {activeTab === "notifications" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: TEXT, margin: 0 }}>{t("notificationPreferences")}</h3>
              <button
                onClick={() => router.push("/dashboard")}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  borderWidth: 1, borderStyle: 'solid', borderColor: BORDER_COLOR,
                  background: 'transparent', color: MUTED,
                  fontFamily: FONT, cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = GREEN; el.style.color = GREEN }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = BORDER_COLOR; el.style.color = MUTED }}
              >
                {t("viewAllInDashboard")}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: t("newContractCreated"), description: t("newContractDesc") },
                { label: t("paymentReceived"),    description: t("paymentReceivedDesc") },
                { label: t("maintenanceDue"),     description: t("maintenanceDueDesc") },
                { label: t("vehicleReturned"),    description: t("vehicleReturnedDesc") },
              ].map((notif, i) => (
                <CheckRow key={i} label={notif.label} description={notif.description} />
              ))}
            </div>

            {/* Critical alerts */}
            {criticalNotifications.length > 0 && (
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bell style={{ width: 15, height: 15, color: MUTED }} />
                  {t("criticalAlerts")}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto' }}>
                  {criticalNotifications.map(notif => (
                    <div
                      key={notif.id}
                      style={{
                        padding: 14, borderRadius: 10,
                        borderLeft: '3px solid #EF4444',
                        background: 'rgba(239,68,68,0.06)',
                        border: `1px solid rgba(239,68,68,0.2)`,
                        borderLeftWidth: 3,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#EF4444', marginBottom: 4 }}>
                            🚨 {notif.title}
                          </p>
                          <p style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>
                            {notif.message.slice(0, 100)}...
                          </p>
                          <p style={{ fontSize: 11, color: MUTED }}>
                            {new Date(notif.created_at).toLocaleDateString('fr-DZ')}
                          </p>
                        </div>
                        <button
                          onClick={() => dismissNotification(notif.id)}
                          title={t("dismiss")}
                          style={{
                            width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: 6, border: 'none', background: 'transparent',
                            color: '#EF4444', cursor: 'pointer', flexShrink: 0,
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.15)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                        >
                          <X style={{ width: 13, height: 13 }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </>
  )
}