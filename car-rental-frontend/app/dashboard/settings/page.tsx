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

  // Communes for currently selected wilaya, sorted alphabetically
  const availableCommunes: Commune[] = selectedWilayaId
    ? communes
        .filter(c => c.wilaya_id === selectedWilayaId)
        .sort((a, b) => a.name.localeCompare(b.name))
    : []

  // ── Sync selectedWilayaId when settingsData loads ──
  // (so dropdowns reflect the saved value)
  useEffect(() => {
    if (settingsData.wilaya_id) {
      setSelectedWilayaId(settingsData.wilaya_id)
    } else if (settingsData.wilaya && wilayas.length > 0) {
      // Fallback: match by name if only name was saved
      const found = wilayas.find(
        w => w.name.toLowerCase() === settingsData.wilaya?.toLowerCase()
      )
      if (found) setSelectedWilayaId(found.id)
    }
  }, [settingsData.wilaya_id, settingsData.wilaya, wilayas])

  // ── Fetch company profile ─────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!token) return
    try {
      setIsLoading(true)
      const res = await fetch(`${API_URL}/api/company/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Session expired. Please log in again.")
          localStorage.removeItem('accessToken')
          setToken(null)
          return
        }
        throw new Error(`HTTP ${res.status}`)
      }
      const { data } = await res.json()
      const { company } = data || {}
      if (!company) throw new Error('No company data in response')

      setFormData({
        name:    company.name     || '',
        address: company.address  || '',
        phone:   company.phone    || '',
        email:   company.email    || '',
        taxId:   company.tax_id   || '',
        logoUrl: company.logo_url || '',
      })
      setSettingsData(company.settings || {})
      toast.success("Profile loaded")
    } catch (error) {
      console.error("Fetch profile error:", error)
      toast.error("Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      toast.error("Please log in to view settings")
      return
    }
    fetchProfile()
  }, [token, fetchProfile])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSettingsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const input = e.target
    const name  = input.name
    let value: any

    if (input.type === 'checkbox') {
      value = (input as HTMLInputElement).checked
    } else if (input.type === 'number') {
      const n = parseFloat(input.value)
      value = isNaN(n) ? 0 : (name === 'defaultDailyKmLimit' ? Math.round(n) : n)
    } else {
      value = input.value
    }

    setSettingsData(prev => ({ ...prev, [name]: value }))
  }

  // Called when wilaya dropdown changes
  const handleWilayaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wilayaId = e.target.value
    const found    = wilayas.find(w => w.id === wilayaId) ?? null

    setSelectedWilayaId(wilayaId)
    // Reset commune when wilaya changes
    setSettingsData(prev => ({
      ...prev,
      wilaya_id: wilayaId,
      wilaya:    found?.name ?? '',
      commune_id: '',
      commune:   '',
    }))
  }

  // Called when commune dropdown changes
  const handleCommuneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const communeId = e.target.value
    const found     = availableCommunes.find(c => c.id === communeId) ?? null

    setSettingsData(prev => ({
      ...prev,
      commune_id: communeId,
      commune:    found?.name ?? '',
    }))
  }

  const handleSaveProfile = async () => {
    if (!token) return toast.error("No auth token")
    try {
      setIsLoading(true)
      const res = await fetch(`${API_URL}/api/company/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    formData.name,
          address: formData.address,
          phone:   formData.phone,
          email:   formData.email,
          tax_id:  formData.taxId,
          logo_url: formData.logoUrl,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        if (res.status === 422) {
          toast.error(`Validation error: ${err.details?.[0]?.msg || 'Invalid input'}`)
          return
        }
        if (res.status === 401) {
          toast.error("Session expired")
          localStorage.removeItem('accessToken')
          setToken(null)
          return
        }
        throw new Error(`HTTP ${res.status}`)
      }
      toast.success("Profile updated successfully")
      fetchProfile()
    } catch (error) {
      console.error("Update profile error:", error)
      toast.error("Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!token) return toast.error("No auth token")

    // Warn if location hasn't been set yet
    if (!settingsData.wilaya) {
      toast("⚠️ Please select your wilaya so your data appears in platform reports.", {
        icon: "📍",
        duration: 4000,
      })
    }

    try {
      setIsLoading(true)
      const res = await fetch(`${API_URL}/api/company/settings`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsData }),
      })
      if (!res.ok) {
        const err = await res.json()
        if (res.status === 422) {
          toast.error(`Validation error: ${err.details?.[0]?.msg || 'Invalid settings'}`)
          return
        }
        if (res.status === 401) {
          toast.error("Session expired")
          localStorage.removeItem('accessToken')
          setToken(null)
          return
        }
        throw new Error(`HTTP ${res.status}`)
      }
      toast.success("Settings saved successfully")
      fetchProfile()
    } catch (error) {
      console.error("Update settings error:", error)
      toast.error("Failed to update settings")
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: "company",       label: "Company Profile" },
    { id: "settings",      label: "Company Settings" },
    { id: "billing",       label: "Billing & Subscription" },
    { id: "notifications", label: "Notifications" },
  ]

  if (isLoading && activeTab === "company" && !formData.name) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and system preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="max-w-2xl">

        {/* ── Company Profile tab ───────────────────────────────────────────── */}
        {activeTab === "company" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Company Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border bg-muted flex items-center justify-center">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Logo"
                      className="w-full h-full object-cover rounded"
                      onError={e => { e.currentTarget.src = '/placeholder.svg' }}
                    />
                  ) : (
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <Input
                  type="url"
                  name="logoUrl"
                  placeholder="Paste logo URL"
                  value={formData.logoUrl}
                  onChange={handleChange}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Company Name
              </label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium mb-2">
                Address
              </label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter full address"
                className="min-h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">Phone</label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
              </div>
            </div>

            <div>
              <label htmlFor="taxId" className="block text-sm font-medium mb-2">Tax ID</label>
              <Input id="taxId" name="taxId" value={formData.taxId} onChange={handleChange} />
            </div>

            <Button onClick={handleSaveProfile} disabled={isLoading} className="bg-primary hover:bg-primary/90">
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}

        {/* ── Company Settings tab ──────────────────────────────────────────── */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Customize company-wide settings and rental policies.
            </p>

            {/* ── Location section ──────────────────────────────────────────── */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold mb-1 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Company Location
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                📍 Please enter your wilaya and commune — this is used by the platform to
                show your rental activity in regional reports and trending vehicle analytics.
              </p>

              {/* Location already set → show saved badge */}
              {settingsData.wilaya && settingsData.commune && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 w-fit">
                  <MapPin className="w-3 h-3 text-primary" />
                  <span className="text-xs font-medium text-primary">
                    {settingsData.commune}, {settingsData.wilaya}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Wilaya */}
                <div>
                  <label htmlFor="wilayaSelect" className="block text-sm font-medium mb-2">
                    Wilaya <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="wilayaSelect"
                    value={selectedWilayaId}
                    disabled={geoLoading}
                    onChange={handleWilayaChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    style={{ opacity: geoLoading ? 0.5 : 1 }}
                  >
                    <option value="">
                      {geoLoading ? "Loading wilayas…" : "— Select your wilaya —"}
                    </option>
                    {wilayas.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.code.padStart(2, '0')} — {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Commune — only enabled after wilaya is chosen */}
                <div>
                  <label htmlFor="communeSelect" className="block text-sm font-medium mb-2">
                    Commune <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="communeSelect"
                    value={settingsData.commune_id || ''}
                    disabled={!selectedWilayaId || geoLoading}
                    onChange={handleCommuneChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!selectedWilayaId
                        ? "Select a wilaya first"
                        : `— All ${settingsData.wilaya || ''} communes —`}
                    </option>
                    {availableCommunes.map(c => (
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
                  Your location is not set. Platform-wide reports won't include your data
                  in location filters until you save a wilaya and commune.
                </p>
              )}
            </div>

            {/* ── Rental Policies section ───────────────────────────────────── */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="text-lg">🚗</span>
                Rental Policies
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="defaultDailyKmLimit" className="block text-sm font-medium mb-2">
                    Default Daily KM Limit <span className="text-muted-foreground">(per day)</span>
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
                    <span className="text-sm text-muted-foreground">km/day</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Applied to all new contracts. Customers can drive this many
                    kilometers per day before overage charges apply.
                  </p>
                </div>

                <div>
                  <label htmlFor="defaultOverageRate" className="block text-sm font-medium mb-2">
                    Default Overage Rate <span className="text-muted-foreground">(for new customers)</span>
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
                    <span className="text-sm text-muted-foreground">DA/km</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Base charge per kilometer over the limit (before tier discounts).
                  </p>
                </div>
              </div>
            </div>

            {/* ── General Settings section ──────────────────────────────────── */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold mb-4">General Settings</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="theme" className="block text-sm font-medium mb-2">
                    Theme
                  </label>
                  <select
                    id="theme"
                    name="theme"
                    value={settingsData.theme || ''}
                    onChange={handleSettingsChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="">Default</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="notificationsEnabled"
                      checked={!!settingsData.notificationsEnabled}
                      onChange={handleSettingsChange}
                      className="rounded"
                    />
                    <span className="text-sm">Enable Email Notifications</span>
                  </label>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSaveSettings}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        )}

        {/* ── Billing tab ───────────────────────────────────────────────────── */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold mb-4">Current Subscription</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="font-semibold">Professional</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Billing Cycle</p>
                  <p className="font-semibold">Monthly</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-semibold">15,000 DZD</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Renewal Date</p>
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
              <h3 className="font-semibold">Notification Preferences</h3>
              <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
                View All in Dashboard
              </Button>
            </div>

            <div className="space-y-4">
              {[
                { label: "New Contract Created",  description: "Notify when a new contract is created" },
                { label: "Payment Received",       description: "Notify when a payment is received" },
                { label: "Maintenance Due",        description: "Notify when vehicle maintenance is due" },
                { label: "Vehicle Returned",       description: "Notify when a vehicle is returned" },
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
                  Critical Alerts (Preview)
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
                          title="Dismiss"
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
    </div>
  )
}