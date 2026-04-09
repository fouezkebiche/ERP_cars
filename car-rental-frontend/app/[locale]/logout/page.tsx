// app/[locale]/logout/page.tsx (FULLY LOCALIZED)
"use client"

import { useTranslations } from "next-intl"
import {LogoutButton} from "@/components/LogoutButton"

export default function LogoutPage() {
  const t = useTranslations("logout")
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{t("title")}</h1>
      <p className="text-muted-foreground mb-6">{t("message")}</p>
      <LogoutButton showConfirm={false} />
    </div>
  )
}
