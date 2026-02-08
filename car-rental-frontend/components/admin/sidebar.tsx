"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, Building2, Users, CreditCard, BarChart3, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface AdminSidebarProps {
  open: boolean
  onToggle: () => void
}

export function AdminSidebar({ open, onToggle }: AdminSidebarProps) {
  const pathname = usePathname()
  const menuItems = [
    { label: "Platform Overview", href: "/admin", icon: BarChart3 },
    { label: "Companies", href: "/admin/companies", icon: Building2 },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ]

  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          "fixed md:relative top-0 left-0 z-40 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-300 flex flex-col",
          open ? "w-64 translate-x-0" : "w-64 -translate-x-full md:translate-x-0 md:w-20",
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          {open && (
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-bold text-sm">CA</span>
              </div>
              <span className="font-bold text-lg">CarManager Admin</span>
            </Link>
          )}
          {!open && (
            <Link href="/admin" className="flex items-center justify-center w-8 h-8">
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-bold text-xs">CA</span>
              </div>
            </Link>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/20",
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {open && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Collapse Button */}
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={onToggle}
            className="hidden md:flex w-full items-center justify-center p-2 hover:bg-sidebar-accent/20 rounded-md transition-colors"
          >
            <ChevronLeft className={cn("w-5 h-5 transition-transform", !open && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {open && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onToggle} />}
    </>
  )
}