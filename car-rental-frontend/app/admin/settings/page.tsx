"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save } from "lucide-react"

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general")

  const tabs = [
    { id: "general", label: "General Settings" },
    { id: "billing", label: "Billing Settings" },
    { id: "security", label: "Security" },
    { id: "email", label: "Email Configuration" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Settings</h1>
        <p className="text-muted-foreground">Configure platform settings and preferences</p>
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
              <label className="block text-sm font-medium mb-2">Platform Name</label>
              <Input defaultValue="CarManager" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Support Email</label>
              <Input type="email" defaultValue="support@carmanager.com" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Support Phone</label>
              <Input defaultValue="+213 XXX XXX XXX" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Maintenance Mode</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Enable maintenance mode</span>
                </label>
              </div>
            </div>

            <Button className="bg-primary hover:bg-primary/90">
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        )}

        {activeTab === "billing" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Currency</label>
              <select className="w-full px-3 py-2 border border-border rounded-md bg-background">
                <option>DZD (Algerian Dinar)</option>
                <option>USD (US Dollar)</option>
                <option>EUR (Euro)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">VAT Rate (%)</label>
              <Input type="number" defaultValue="19" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Invoice Logo URL</label>
              <Input placeholder="https://..." />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Invoice Footer Text</label>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-md bg-background min-h-20"
                defaultValue="Thank you for using CarManager"
              />
            </div>

            <Button className="bg-primary hover:bg-primary/90">
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-muted">
              <h3 className="font-semibold mb-2">Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground mb-4">Require 2FA for all admin accounts</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-sm">Enabled</span>
              </label>
            </div>

            <div className="p-4 rounded-lg bg-muted">
              <h3 className="font-semibold mb-2">Session Timeout</h3>
              <p className="text-sm text-muted-foreground mb-4">Automatically logout inactive admin sessions after:</p>
              <div className="flex items-center gap-2">
                <Input type="number" defaultValue="30" className="w-20" />
                <span className="text-sm">minutes</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted">
              <h3 className="font-semibold mb-2">IP Whitelist</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Restrict admin access to specific IP addresses (comma separated)
              </p>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-md bg-background min-h-20"
                placeholder="192.168.1.1, 10.0.0.1"
              />
            </div>

            <Button className="bg-primary hover:bg-primary/90">
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        )}

        {activeTab === "email" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">SMTP Host</label>
              <Input placeholder="smtp.gmail.com" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">SMTP Port</label>
                <Input type="number" placeholder="587" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">SMTP User</label>
                <Input placeholder="your-email@gmail.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">SMTP Password</label>
              <Input type="password" placeholder="••••••••" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">From Email Address</label>
              <Input type="email" placeholder="noreply@carmanager.com" />
            </div>

            <Button className="bg-primary hover:bg-primary/90">
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
