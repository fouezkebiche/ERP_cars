"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Save, Upload, Bell, X } from "lucide-react"
import toast from "react-hot-toast"
import { useNotifications } from "@/hooks/useNotifications"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Settings {
  theme?: string;
  notificationsEnabled?: boolean;
  defaultDailyKmLimit?: number;
  defaultOverageRate?: number;
  [key: string]: any;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company")
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    taxId: "",
    logoUrl: "",
  })
  const [settingsData, setSettingsData] = useState<Settings>({})
  const [token, setToken] = useState<string | null>(typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null)

  const { data: notificationsData, dismissNotification } = useNotifications({ priority: 'critical', limit: 3, unread: true })
  const criticalNotifications = notificationsData?.notifications || []

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
      const responseData = await res.json()
      const { data } = responseData
      const { company } = data || {}
      if (!company) throw new Error('No company data in response')
      
      setFormData({
        name: company.name || '',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        taxId: company.tax_id || '',
        logoUrl: company.logo_url || '',
      })
      
      // 🔍 DEBUG: Log what we received
      console.log('📥 Fetched settings:', company.settings);
      console.log('📥 defaultDailyKmLimit:', company.settings?.defaultDailyKmLimit, 'type:', typeof company.settings?.defaultDailyKmLimit);
      
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const input = e.target as HTMLInputElement | HTMLSelectElement;
    const name = input.name;
    
    let value: any;
    
    if (input.type === 'checkbox') {
      value = (input as HTMLInputElement).checked;
    } else if (input.type === 'number') {
      // Parse number properly
      const numValue = parseFloat(input.value);
      value = isNaN(numValue) ? 0 : numValue;
      
      // Round KM limit to integer
      if (name === 'defaultDailyKmLimit') {
        value = Math.round(value);
      }
      
      // 🔍 DEBUG
      console.log(`📝 Setting ${name} = ${value} (type: ${typeof value})`);
    } else {
      value = input.value;
    }
    
    setSettingsData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  const handleSaveProfile = async () => {
    if (!token) return toast.error("No auth token")
    try {
      setIsLoading(true)
      const res = await fetch(`${API_URL}/api/company/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          tax_id: formData.taxId,
          logo_url: formData.logoUrl,
        }),
      })
      if (!res.ok) {
        const errorData = await res.json()
        if (res.status === 422) {
          toast.error(`Validation error: ${errorData.details?.[0]?.msg || 'Invalid input'}`)
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
    
    // 🔍 DEBUG: Log what we're about to save
    console.log('💾 Saving settings:', settingsData);
    console.log('💾 defaultDailyKmLimit:', settingsData.defaultDailyKmLimit, 'type:', typeof settingsData.defaultDailyKmLimit);
    console.log('💾 defaultOverageRate:', settingsData.defaultOverageRate, 'type:', typeof settingsData.defaultOverageRate);
    
    try {
      setIsLoading(true)
      const res = await fetch(`${API_URL}/api/company/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: settingsData }),
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        console.error('❌ Save failed:', errorData);
        if (res.status === 422) {
          toast.error(`Validation error: ${errorData.details?.[0]?.msg || 'Invalid settings'}`)
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
      
      const responseData = await res.json();
      console.log('✅ Save response:', responseData);
      
      toast.success("Settings updated successfully")
      fetchProfile() // Refetch to confirm
    } catch (error) {
      console.error("Update settings error:", error)
      toast.error("Failed to update settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismissNotification = (id: string) => {
    dismissNotification(id)
  }

  const tabs = [
    { id: "company", label: "Company Profile" },
    { id: "settings", label: "Company Settings" },
    { id: "billing", label: "Billing & Subscription" },
    { id: "users", label: "Users & Permissions" },
    { id: "templates", label: "Contract Templates" },
    { id: "notifications", label: "Notifications" },
    { id: "language", label: "Language & Regional" },
  ]

  if (isLoading && activeTab === "company") {
    return <div className="flex items-center justify-center h-64"><div>Loading...</div></div>
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
                      onError={(e) => { e.currentTarget.src = '/placeholder.svg' }}
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
                <label htmlFor="phone" className="block text-sm font-medium mb-2">
                  Phone
                </label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
              </div>
            </div>
            <div>
              <label htmlFor="taxId" className="block text-sm font-medium mb-2">
                Tax ID
              </label>
              <Input id="taxId" name="taxId" value={formData.taxId} onChange={handleChange} />
            </div>
            <Button onClick={handleSaveProfile} disabled={isLoading} className="bg-primary hover:bg-primary/90">
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Customize company-wide settings and rental policies.
            </p>
            
            {/* 🔍 DEBUG PANEL - Remove this after debugging */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <p className="font-bold mb-2">DEBUG INFO (remove later):</p>
              <p>defaultDailyKmLimit: {settingsData.defaultDailyKmLimit} (type: {typeof settingsData.defaultDailyKmLimit})</p>
              <p>defaultOverageRate: {settingsData.defaultOverageRate} (type: {typeof settingsData.defaultOverageRate})</p>
            </div>
            
            <div className="space-y-6">
              {/* Rental Policies Section */}
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
                      Applied to all new contracts. Customers can drive this many kilometers per day before overage charges apply.
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

              {/* General Settings Section */}
              <div className="p-6 rounded-lg border border-border bg-card">
                <h3 className="font-semibold mb-4">General Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="theme" className="block text-sm font-medium mb-2">Theme</label>
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
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="notificationsEnabled"
                        checked={!!settingsData.notificationsEnabled}
                        onChange={handleSettingsChange}
                        className="rounded"
                      />
                      Enable Email Notifications
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <Button onClick={handleSaveSettings} disabled={isLoading} className="bg-primary hover:bg-primary/90">
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        )}

        {/* Other tabs remain the same... */}
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

        {activeTab === "users" && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Team Members</h3>
                <Button className="bg-primary hover:bg-primary/90">Add User</Button>
              </div>
              <div className="space-y-3">
                {[
                  { name: "John Doe", email: "john@company.com", role: "Admin" },
                  { name: "Sarah Ahmed", email: "sarah@company.com", role: "Manager" },
                  { name: "Ali Hassan", email: "ali@company.com", role: "Staff" },
                ].map((user, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg border border-border bg-card flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select className="px-2 py-1 text-sm border border-border rounded bg-background">
                        <option>{user.role}</option>
                      </select>
                      <Button variant="outline" size="sm">
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "templates" && (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Manage your contract templates here. You can create custom templates for different rental types.
            </p>
            <Button className="bg-primary hover:bg-primary/90">Create Template</Button>
            <div className="space-y-3">
              {["Standard Rental", "Long-term Rental", "Business Fleet"].map((template, i) => (
                <div key={i} className="p-4 rounded-lg border border-border bg-card flex items-center justify-between">
                  <p className="font-semibold text-sm">{template}</p>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Notification Preferences</h3>
              <Button variant="outline" size="sm">View All in Dashboard</Button>
            </div>
            <div className="space-y-4">
              {[
                { label: "New Contract Created", description: "Notify when a new contract is created" },
                { label: "Payment Received", description: "Notify when a payment is received" },
                { label: "Maintenance Due", description: "Notify when vehicle maintenance is due" },
                { label: "Vehicle Returned", description: "Notify when a vehicle is returned" },
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
                  {criticalNotifications.map((notif) => (
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
                          onClick={() => handleDismissNotification(notif.id)}
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

        {activeTab === "language" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Language</label>
              <select className="w-full px-3 py-2 border border-border rounded-md bg-background">
                <option>English</option>
                <option>العربية (Arabic)</option>
                <option>Français (French)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Time Zone</label>
              <select className="w-full px-3 py-2 border border-border rounded-md bg-background">
                <option>Africa/Algiers (GMT+1)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date Format</label>
              <select className="w-full px-3 py-2 border border-border rounded-md bg-background">
                <option>DD/MM/YYYY</option>
                <option>MM/DD/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
            <Button className="bg-primary hover:bg-primary/90">
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}