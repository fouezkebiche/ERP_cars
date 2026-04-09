"use client"
import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { ChevronLeft, LayoutGrid, Car, Users, FileText, CreditCard, BarChart3, Users2, Settings, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

interface DashboardSidebarProps {
  open: boolean
  onToggle: () => void
}

export function DashboardSidebar({ open, onToggle }: DashboardSidebarProps) {
  const pathname = usePathname()
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations("nav_dashboard")

  const menuItems = [
    { label: t("dashboard"),  href: `/${locale}/dashboard`,            icon: LayoutGrid },
    { label: t("vehicles"),   href: `/${locale}/dashboard/vehicles`,   icon: Car },
    { label: t("customers"),  href: `/${locale}/dashboard/customers`,  icon: Users },
    { label: t("contracts"),  href: `/${locale}/dashboard/contracts`,  icon: FileText },
    { label: t("payments"),   href: `/${locale}/dashboard/payments`,   icon: CreditCard },
    { label: t("revenue"),    href: `/${locale}/dashboard/revenue`,    icon: BarChart3 },
    { label: t("hr"),         href: `/${locale}/dashboard/hr`,         icon: Users2 },
    { label: t("payroll"),    href: `/${locale}/dashboard/payroll`,    icon: Wallet },
    { label: t("settings"),   href: `/${locale}/dashboard/settings`,   icon: Settings },
  ]

  return (
    <>
      <div className={cn(
        "fixed md:relative top-0 left-0 z-40 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-300 flex flex-col",
        open ? "w-64 translate-x-0" : "w-64 -translate-x-full md:translate-x-0 md:w-20",
      )}>
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          {open ? (
            <Link href={`/${locale}/dashboard`} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-bold text-sm">CM</span>
              </div>
              <span className="font-bold text-lg">CarManager</span>
            </Link>
          ) : (
            <Link href={`/${locale}/dashboard`} className="flex items-center justify-center w-8 h-8">
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-bold text-xs">C</span>
              </div>
            </Link>
          )}
        </div>

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
                  isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/20",
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {open && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={onToggle}
            className="hidden md:flex w-full items-center justify-center p-2 hover:bg-sidebar-accent/20 rounded-md transition-colors"
          >
            <ChevronLeft className={cn("w-5 h-5 transition-transform", !open && "rotate-180")} />
          </button>
        </div>
      </div>

      {open && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onToggle} />}
    </>
  )
}