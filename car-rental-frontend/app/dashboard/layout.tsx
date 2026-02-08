// app/dashboard/layout.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Car,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  UserCircle,
  ChevronDown,
  FileBarChart, // NEW ICON FOR REPORTS
  Wallet, // ICON FOR PAYROLL
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { PermissionGate, RoleDisplay } from "@/components/auth/ProtectedRoute"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  permissions?: string[]
  roles?: string[]
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  // Define navigation items with their required permissions
  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      permissions: ["view_dashboard"],
    },
    {
      label: "Vehicles",
      href: "/dashboard/vehicles",
      icon: <Car className="w-5 h-5" />,
      permissions: ["view_vehicles"],
    },
    {
      label: "Customers",
      href: "/dashboard/customers",
      icon: <Users className="w-5 h-5" />,
      permissions: ["view_customers"],
    },
    {
      label: "Contracts",
      href: "/dashboard/contracts",
      icon: <FileText className="w-5 h-5" />,
      permissions: ["view_contracts"],
    },
    {
      label: "Payments",
      href: "/dashboard/payments",
      icon: <CreditCard className="w-5 h-5" />,
      permissions: ["view_payments"],
    },
    {
      label: "Analytics",
      href: "/dashboard/analytics",
      icon: <BarChart3 className="w-5 h-5" />,
      permissions: ["view_analytics"],
    },
    // ============================================
    // NEW: REPORTS NAVIGATION ITEM
    // ============================================
    {
      label: "Reports",
      href: "/dashboard/reports",
      icon: <FileBarChart className="w-5 h-5" />,
      roles: ["owner", "admin", "manager"],
    },
    // ============================================
    {
      label: "HR & Employees",
      href: "/dashboard/hr",
      icon: <UserCircle className="w-5 h-5" />,
      roles: ["owner", "admin", "manager"],
    },
    {
      label: "Attendance",
      href: "/dashboard/attendance",
      icon: <UserCircle className="w-5 h-5" />,
      roles: ['owner', 'admin', 'manager', 'receptionist'],
    },
    {
      label: "Payroll",
      href: "/dashboard/payroll",
      icon: <Wallet className="w-5 h-5" />,
      roles: ["owner", "admin", "accountant"],
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="w-5 h-5" />,
      permissions: ["manage_settings"],
    },
  ]

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Car className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold">CarRental</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <PermissionGate
                  key={item.href}
                  permissions={item.permissions}
                  roles={item.roles}
                >
                  <li>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive(item.href)
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      {item.icon}
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                </PermissionGate>
              ))}
            </ul>
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">{user?.full_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <RoleDisplay />
                  </div>
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* User dropdown menu */}
              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                  <div className="p-3 border-b border-border">
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <Link
                    href="/dashboard/settings/profile"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-muted transition-colors"
                    onClick={() => {
                      setUserMenuOpen(false)
                      setSidebarOpen(false)
                    }}
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Profile Settings</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-muted transition-colors text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-card border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            <div className="flex-1 lg:flex-none">
              <h2 className="text-lg font-semibold lg:hidden">
                {navItems.find((item) => isActive(item.href))?.label || "Dashboard"}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Logged in as
                </span>
                <RoleDisplay />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}