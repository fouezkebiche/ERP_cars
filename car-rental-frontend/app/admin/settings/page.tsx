"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save } from "lucide-react"
import toast from "react-hot-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

interface AdminPlan {
  id: string
  name: string
  description?: string
  priceMonthly: number
  maxVehicles: number
}

interface AdminSettings {
  platformName?: string
  supportEmail?: string
  supportPhone?: string
  maintenanceMode?: boolean
  plans?: AdminPlan[]
  [key: string]: any
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "plans" | "notifications">("general")
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<AdminSettings>({})

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("accessToken")
            : null
        if (!token) return

        const res = await fetch(`${API_URL}/api/admin/settings`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!res.ok) {
          if (res.status === 401) {
            toast.error("Session expired. Please log in again.")
            if (typeof window !== "undefined") {
              localStorage.removeItem("accessToken")
              window.location.href = "/login"
            }
            return
          }
          throw new Error(`HTTP ${res.status}`)
        }

        const json = await res.json()
        const loaded = json?.data?.settings ?? {}
        setSettings(loaded)
      } catch (err) {
        console.error("Admin settings load error:", err)
        toast.error("Failed to load admin settings")
      }
    }

    fetchSettings()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, type, value, checked } = e.target as HTMLInputElement

    let next: any = value
    if (type === "checkbox") {
      next = checked
    } else if (type === "number") {
      const parsed = parseFloat(value)
      next = isNaN(parsed) ? 0 : parsed
    }

    setSettings((prev) => ({
      ...prev,
      [name]: next,
    }))
  }

  const handlePlanChange = (index: number, field: keyof AdminPlan, value: string | number) => {
    setSettings((prev) => {
      const plans: AdminPlan[] = Array.isArray(prev.plans) ? [...prev.plans] : []
      const plan = plans[index]
      if (!plan) return prev
      plans[index] = { ...plan, [field]: value }
      return { ...prev, plans }
    })
  }

  const handleAddPlan = () => {
    setSettings((prev) => {
      const plans: AdminPlan[] = Array.isArray(prev.plans) ? [...prev.plans] : []
      plans.push({
        id: `plan_${Date.now()}`,
        name: "",
        description: "",
        priceMonthly: 0,
        maxVehicles: 10,
      })
      return { ...prev, plans }
    })
  }

  const handleRemovePlan = (index: number) => {
    setSettings((prev) => {
      const plans: AdminPlan[] = Array.isArray(prev.plans) ? [...prev.plans] : []
      plans.splice(index, 1)
      return { ...prev, plans }
    })
  }

  const handleSave = async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null
      if (!token) {
        toast.error("No auth token")
        return
      }

      setIsSaving(true)
      const res = await fetch(`${API_URL}/api/admin/settings`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        if (res.status === 422) {
          toast.error(
            errorData.message || "Validation error while saving settings",
          )
          return
        }
        if (res.status === 401) {
          toast.error("Session expired. Please log in again.")
          if (typeof window !== "undefined") {
            localStorage.removeItem("accessToken")
            window.location.href = "/login"
          }
          return
        }
        throw new Error(`HTTP ${res.status}`)
      }

      toast.success("Admin settings saved successfully")
    } catch (err) {
      console.error("Admin settings save error:", err)
      toast.error("Failed to save admin settings")
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: "general", label: "General" },
    { id: "plans", label: "Plans & Pricing" },
    { id: "notifications", label: "Notifications" },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 text-white">Admin Settings</h1>
        <p className="text-sm" style={{ color: "rgba(148,163,184,0.9)" }}>
          Configure platform-wide preferences for all companies.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-0">
        {tabs.map((tab) => (
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
        {activeTab === "general" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-100">
                Platform Name
              </label>
              <Input
                name="platformName"
                value={settings.platformName ?? ""}
                onChange={handleChange}
                placeholder="CarManager"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-100">
                Support Email
              </label>
              <Input
                type="email"
                name="supportEmail"
                value={settings.supportEmail ?? ""}
                onChange={handleChange}
                placeholder="support@carmanager.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-100">
                Support Phone
              </label>
              <Input
                name="supportPhone"
                value={settings.supportPhone ?? ""}
                onChange={handleChange}
                placeholder="+213 XXX XXX XXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-100">
                Maintenance Mode
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  name="maintenanceMode"
                  checked={!!settings.maintenanceMode}
                  onChange={handleChange}
                  className="rounded"
                />
                <span>
                  Put all tenant dashboards into read-only mode when enabled.
                </span>
              </label>
            </div>

            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        )}

        {activeTab === "plans" && (
          <div className="space-y-6">
            <p className="text-sm" style={{ color: "rgba(148,163,184,0.9)" }}>
              Define subscription plans that companies can choose when they sign up.
            </p>

            <div className="space-y-4">
              {(settings.plans ?? []).map((plan, index) => (
                <div
                  key={plan.id || index}
                  className="border border-border rounded-lg p-4 bg-card"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">
                      Plan #{index + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleRemovePlan(index)}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-slate-100">
                        Name
                      </label>
                      <Input
                        value={plan.name}
                        onChange={(e) =>
                          handlePlanChange(index, "name", e.target.value)
                        }
                        placeholder="e.g. Basic, Professional, Enterprise"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-slate-100">
                        Description
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-border rounded-md bg-background min-h-16 text-sm"
                        value={plan.description ?? ""}
                        onChange={(e) =>
                          handlePlanChange(index, "description", e.target.value)
                        }
                        placeholder="Short description shown to companies"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-slate-100">
                          Price / month (DZD)
                        </label>
                        <Input
                          type="number"
                          min={0}
                          value={plan.priceMonthly}
                          onChange={(e) =>
                            handlePlanChange(
                              index,
                              "priceMonthly",
                              parseFloat(e.target.value || "0"),
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-slate-100">
                          Max vehicles
                        </label>
                        <Input
                          type="number"
                          min={1}
                          value={plan.maxVehicles}
                          onChange={(e) =>
                            handlePlanChange(
                              index,
                              "maxVehicles",
                              parseInt(e.target.value || "1", 10),
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleAddPlan}
            >
              Add Plan
            </Button>

            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Plans"}
            </Button>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "rgba(148,163,184,0.9)" }}>
              Use the Companies page to review new signups, confirm their accounts,
              or suspend tenants. This tab is a quick reminder of where to manage
              registration notifications.
            </p>
            <p className="text-xs" style={{ color: "rgba(148,163,184,0.8)" }}>
              (In the future, we can surface pending companies directly here, using
              the existing <code>/api/admin/companies</code> endpoints.)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
