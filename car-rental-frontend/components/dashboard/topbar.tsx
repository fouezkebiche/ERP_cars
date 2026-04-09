"use client"
import { Bell, Menu, Search, User, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogoutButton } from "@/components/LogoutButton"
import { useRouter, useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import LanguageSwitcher from "@/components/LanguageSwitcher"

interface DashboardTopbarProps {
  onMenuClick: () => void
}

export function DashboardTopbar({ onMenuClick }: DashboardTopbarProps) {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations("topbar")
  const [userName, setUserName] = useState("User")
  const [userEmail, setUserEmail] = useState("")

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setUserName(user.full_name || user.email || "User")
        setUserEmail(user.email || "")
      } catch (e) {
        console.error("Failed to parse user from localStorage")
      }
    }
  }, [])

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-4 flex-1">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
        <div className="relative hidden md:flex flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input type="search" placeholder={t("search")} className="pl-9 bg-background" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{userName}</span>
                <span className="text-xs text-muted-foreground">{userEmail}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/${locale}/dashboard/settings`)}>
              <Settings className="w-4 h-4 mr-2" />
              {t("profileSettings")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/${locale}/dashboard/settings?tab=company`)}>
              <User className="w-4 h-4 mr-2" />
              {t("companySettings")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <LogoutButton variant="ghost" size="sm" showIcon={true} showConfirm={true} className="w-full justify-start h-8" />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}