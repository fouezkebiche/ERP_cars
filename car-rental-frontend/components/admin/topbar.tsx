"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, Bell, LogOut, Settings, Shield } from "lucide-react"

interface AdminTopbarProps {
  onMenuClick: () => void
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <div className="h-16 border-b border-border bg-card flex items-center justify-between px-6 md:px-8">
      {/* Left Section */}
      <div className="flex items-center gap-4 flex-1">
        <button onClick={onMenuClick} className="md:hidden p-2 hover:bg-muted rounded-md transition-colors">
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">
          <Shield className="w-3 h-3" />
          Admin Panel
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-muted rounded-md transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-2 hover:bg-muted rounded-md transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
              AD
            </div>
            <span className="hidden md:inline text-sm font-medium">Admin</span>
          </button>

          {/* Dropdown Menu */}
          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg z-50 overflow-hidden">
                <div className="p-4 border-b border-border">
                  <p className="font-semibold text-sm">Admin User</p>
                  <p className="text-xs text-muted-foreground">admin@carmanager.com</p>
                </div>
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors text-destructive border-t border-border">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
