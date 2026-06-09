"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { Clock, AlertTriangle } from "lucide-react"
import { useTranslations } from "next-intl"
import { useCompany } from "@/context/CompanyContext"

const GREEN = "#22C55E"
const AMBER = "#F59E0B"
const FONT = "'Plus Jakarta Sans', system-ui, sans-serif"

export default function TrialBanner() {
  const { subscription } = useCompany()
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations("subscription")

  if (!subscription?.isTrial || subscription.isExpired) return null

  const days = subscription.daysRemaining ?? 0
  const urgent = days <= 3
  const color = urgent ? AMBER : GREEN

  return (
    <div style={{
      marginBottom: 20, padding: "12px 18px", borderRadius: 12,
      background: urgent ? "rgba(245,158,11,0.1)" : "rgba(34,197,94,0.08)",
      border: `1px solid ${urgent ? "rgba(245,158,11,0.3)" : "rgba(34,197,94,0.25)"}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 16, flexWrap: "wrap", fontFamily: FONT,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {urgent ? <AlertTriangle size={16} color={color} /> : <Clock size={16} color={color} />}
        <span style={{ fontSize: 13, color: "#fff" }}>
          {urgent
            ? t("trialEndingSoon", { days })
            : t("trialActive", { days })}
        </span>
      </div>
      <Link
        href={`/${locale}/dashboard/settings?tab=billing`}
        style={{
          fontSize: 12, fontWeight: 600, color: color, textDecoration: "none",
          padding: "6px 14px", borderRadius: 8,
          border: `1px solid ${color}44`, transition: "all 0.15s",
        }}
      >
        {t("subscribeNow")} →
      </Link>
    </div>
  )
}
