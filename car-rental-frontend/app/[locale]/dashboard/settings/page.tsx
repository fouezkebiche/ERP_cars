// app/[locale]/dashboard/settings/page.tsx (FULLY LOCALIZED)
"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Save, Upload, Bell, X, MapPin } from "lucide-react"
import toast from "react-hot-toast"
import { useNotifications } from "@/hooks/useNotifications"
import { useTranslations } from "next-intl"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Wilaya {
  id: string
  code: string
  name: string
  ar_name: string
  longitude: string
  latitude: string
}

interface Commune {
  id: string
  post_code: string
  name: string
  wilaya_id: string
  ar_name: string
  longitude: string
  latitude: string
}

interface Settings {
  theme?: string
  notificationsEnabled?: boolean
  defaultDailyKmLimit?: number
  defaultOverageRate?: number
  wilaya?: string
  wilaya_id?: string
  commune?: string
  commune_id?: string
  [key: string]: any
}

// ─── Settings Page ────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const t = useTranslations("settings")
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("company")
  const [isLoading, setIsLoading] = useState(false)

  // ── Company profile form ──
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    taxId: "",
    logoUrl: "",
  })

  // ── Company settings (stored in company.settings JSON) ──
  const [settingsData, setSettingsData] = useState<Settings>({})

  const [token, setToken] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  )

  // ── Algeria geo data from /public ──
  const [wilayas, setWilayas]     = useState<Wilaya[]>([])
  const [communes, setCommunes]   = useState<Commune[]>([])
  const [geoLoading, setGeoLoading] = useState(true)

  // UI selections (may differ from what's saved until Save is clicked)
  const [selectedWilayaId, setSelectedWilayaId] = useState("")

  const { data: notificationsData, dismissNotification } = useNotifications({
    priority: 'critical', limit: 3, unread: true,
  })
  const criticalNotifications = notificationsData?.notifications || []

  // ── Load wilaya + commune JSON from /public on mount ──────────────────────
  useEffect(() => {
    async function loadGeoData() {
      try {
        const [wRes, cRes] = await Promise.all([
          fetch("/Wilaya_Of_Algeria.json"),
          fetch("/Commune_Of_Algeria.json"),
        ])
        if (!wRes.ok || !cRes.ok) throw new Error("Could not load geo data files")
        const [wData, cData]: [Wilaya[], Commune[]] = await Promise.all([
          wRes.json(), cRes.json(),
        ])
        setWilayas(wData.sort((a, b) => parseInt(a.id) - parseInt(b.id)))
        setCommunes(cData)
      } catch (e) {
        console.error("Failed to load Algeria geo data:", e)
        toast.error("Could not load wilaya/commune data")
      } finally {
        setGeoLoading(false)
      }
    }
    loadGeoData()
  }, [])

  // ── Load company profile + settings on mount ───────────────────────────────
  useEffect(() => {
    if (!token) return
    async function loadCompanyData() {
      try {
        const res = await fetch(`${API_URL}/api/company/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error("Failed to load company profile")
        const response = await res.json()
        const data = response.data?.company || response.data || {} // Handle nested response
        console.log('🔍 Loaded company data:', data)
        setFormData({
          name: data.name || "",
          address: data.address || "",
          phone: data.phone || "",
          email: data.email || "",
          taxId: data.tax_id || "",
          logoUrl: data.logo_url || "",
        })
        // Settings stored in JSON column
        setSettingsData(data.settings || {})
        // Set UI selections from saved data
        if (data.settings?.wilaya_id) {
          setSelectedWilayaId(data.settings.wilaya_id)
        }
      } catch (e) {
        console.error("Failed to load company profile:", e)
        toast.error("Could not load company profile")
      }
    }
    loadCompanyData()
  }, [token])

  // ── When a wilaya is selected, filter communes ───────────────────────────
  const filteredCommunes = selectedWilayaId
    ? communes.filter((c) => c.wilaya_id === selectedWilayaId)
    : []

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setSettingsData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSaveProfile = async () => {
    if (!token) return
    setIsLoading(true)
    try {
      console.log('🔍 Saving profile data:', formData)
      const res = await fetch(`${API_URL}/api/company/profile`, {
        method: "PUT", // Changed from PATCH to PUT to match backend
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('❌ Save profile error:', errorData)
        throw new Error(errorData.message || "Failed to save company profile")
      }
      toast.success(t("profileSaved"))
    } catch (e) {
      console.error(e)
      toast.error(t("failedToSaveProfile"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!token) return
    setIsLoading(true)
    try {
      // Build the settings object with selected wilaya/commune names + IDs
      const selectedWilaya = wilayas.find((w) => w.id === selectedWilayaId)
      const selectedCommune = filteredCommunes.find((c) => c.id === settingsData.commune_id)
      const payload = {
        ...settingsData,
        wilaya: selectedWilaya?.name || "",
        wilaya_id: selectedWilayaId || "",
        commune: selectedCommune?.name || "",
        commune_id: settingsData.commune_id || "",
      }
      const res = await fetch(`${API_URL}/api/company/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to save company settings")
      setSettingsData(payload)
      toast.success(t("settingsSaved"))
    } catch (e) {
      console.error(e)
      toast.error(t("failedToSaveSettings"))
    } finally {
      setIsLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Tab Navigation */}
      <div className="flex border-b border-border">
        {[
          { id: "company", label: t("companyProfile") },
          { id: "settings", label: t("companySettings") },
          { id: "billing", label: t("billing") },
          { id: "notifications", label: t("notifications") },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Company Profile tab ─────────────────────────────────────────────── */}
      {activeTab === "company" && (
        <div className="space-y-6">
          <div className="p-6 rounded-lg border border-border bg-card">
            <h3 className="font-semibold mb-4">{t("companyProfile")}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    {t("companyName")}
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleProfileChange}
                    placeholder="Your Company Name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    {t("companyEmail")}
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleProfileChange}
                    placeholder="contact@company.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">
                    {t("companyPhone")}
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleProfileChange}
                    placeholder="+213 XXX XXX XXX"
                  />
                </div>
                
              </div>
              
              
            </div>
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? t("saving") : t("saveProfile")}
          </Button>
        </div>
      )}

      {/* ── Company Settings tab ─────────────────────────────────────────────── */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          {/* ── Location section ───────────────────────────────────── */}
          <div className="p-6 rounded-lg border border-border bg-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="text-lg">📍</span>
              {t("location")}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="wilaya_id" className="block text-sm font-medium mb-2">
                    {t("wilaya")}
                  </label>
                  <select
                    id="wilaya_id"
                    name="wilaya_id"
                    value={selectedWilayaId}
                    onChange={(e) => {
                      setSelectedWilayaId(e.target.value)
                      setSettingsData((prev) => ({ ...prev, commune_id: "" }))
                    }}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="">{t("selectWilaya")}</option>
                    {wilayas.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="commune_id" className="block text-sm font-medium mb-2">
                    {t("commune")}
                  </label>
                  <select
                    id="commune_id"
                    name="commune_id"
                    value={settingsData.commune_id || ""}
                    onChange={handleSettingsChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    disabled={!selectedWilayaId}
                  >
                    <option value="">{t("selectCommune")}</option>
                    {filteredCommunes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Missing location warning */}
              {!settingsData.wilaya && (
                <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <span>⚠️</span>
                  {t("locationWarning")}
                </p>
              )}
            </div>
          </div>

          {/* ── Rental Policies section ───────────────────────────────────── */}
          <div className="p-6 rounded-lg border border-border bg-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="text-lg">🚗</span>
              {t("rentalPolicies")}
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="defaultDailyKmLimit" className="block text-sm font-medium mb-2">
                  {t("defaultDailyKmLimit")} <span className="text-muted-foreground">({t("perDay")})</span>
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    id="defaultDailyKmLimit"
                    name="defaultDailyKmLimit"
                    type="number"
                    min="50"
                    max="1000"
                    step="50"
                    value={settingsData.defaultDailyKmLimit ?? 300}
                    onChange={handleSettingsChange}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">{t("kmPerDay")}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("kmLimitDescription")}
                </p>
              </div>

              <div>
                <label htmlFor="defaultOverageRate" className="block text-sm font-medium mb-2">
                  {t("defaultOverageRate")} <span className="text-muted-foreground">({t("forNewCustomers")})</span>
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    id="defaultOverageRate"
                    name="defaultOverageRate"
                    type="number"
                    min="5"
                    max="50"
                    step="1"
                    value={settingsData.defaultOverageRate ?? 20}
                    onChange={handleSettingsChange}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">{t("daPerKm")}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("overageRateDescription")}
                </p>
              </div>
            </div>
          </div>

          

          <Button
            onClick={handleSaveSettings}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? t("saving") : t("saveSettings")}
          </Button>
        </div>
      )}

      {/* ── Billing tab ───────────────────────────────────────────────────── */}
      {activeTab === "billing" && (
        <div className="space-y-6">
          <div className="p-6 rounded-lg border border-border bg-card">
            <h3 className="font-semibold mb-4">{t("currentSubscription")}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("plan")}</p>
                <p className="font-semibold">Professional</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("billingCycle")}</p>
                <p className="font-semibold">Monthly</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("amount")}</p>
                <p className="font-semibold">15,000 DZD</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("renewalDate")}</p>
                <p className="font-semibold">Feb 4, 2025</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Notifications tab ─────────────────────────────────────────────── */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{t("notificationPreferences")}</h3>
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
              {t("viewAllInDashboard")}
            </Button>
          </div>

          <div className="space-y-4">
            {[
              { label: t("newContractCreated"), description: t("newContractDesc") },
              { label: t("paymentReceived"), description: t("paymentReceivedDesc") },
              { label: t("maintenanceDue"), description: t("maintenanceDueDesc") },
              { label: t("vehicleReturned"), description: t("vehicleReturnedDesc") },
            ].map((notif, i) => (
              <label
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted"
              >
                <input type="checkbox" defaultChecked className="rounded" />
                <div>
                  <p className="font-semibold text-sm">{notif.label}</p>
                  <p className="text-xs text-muted-foreground">{notif.description}</p>
                </div>
              </label>
            ))}
          </div>

          {criticalNotifications.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                {t("criticalAlerts")}
              </h4>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {criticalNotifications.map(notif => (
                  <div
                    key={notif.id}
                    className="p-3 rounded-lg border-l-4 border-l-destructive bg-destructive/5"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-xs text-destructive mb-1">
                          🚨 {notif.title}
                        </p>
                        <p className="text-xs text-muted-foreground mb-1">
                          {notif.message.slice(0, 100)}...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notif.created_at).toLocaleDateString('fr-DZ')}
                        </p>
                      </div>
                      <button
                        onClick={() => dismissNotification(notif.id)}
                        className="p-1 text-destructive hover:bg-destructive/20 rounded"
                        title={t("dismiss")}
                      >
                        <X className="w-3 h-3" />
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
  )
}
