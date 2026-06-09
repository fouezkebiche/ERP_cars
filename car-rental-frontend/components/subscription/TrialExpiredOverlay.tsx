"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { Lock, Mail, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import toast from "react-hot-toast"
import { useCompany } from "@/context/CompanyContext"

const GREEN = "#22C55E"
const FONT = "'Plus Jakarta Sans', system-ui, sans-serif"

export default function TrialExpiredOverlay({ children }: { children: React.ReactNode }) {
  const { subscription, requestUpgrade } = useCompany()
  const pathname = usePathname()
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations("subscription")
  const [loading, setLoading] = useState(false)

  const isExpired = subscription && !subscription.allowed && subscription.isExpired
  const isBillingPage = pathname.includes("/dashboard/settings") || pathname.includes("/dashboard/billing")

  const handleRequestUpgrade = async () => {
    setLoading(true)
    try {
      await requestUpgrade()
      toast.success(t("requestSent"))
    } catch (e: any) {
      toast.error(e.message || t("requestFailed"))
    } finally {
      setLoading(false)
    }
  }

  if (!isExpired || isBillingPage) {
    return <>{children}</>
  }

  return (
    <div style={{ position: "relative" }}>
      <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none", opacity: 0.35 }}>
        {children}
      </div>

      <div style={{
        position: "fixed", inset: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(8,11,16,0.75)", backdropFilter: "blur(8px)",
        padding: 24, fontFamily: FONT,
      }}>
        <div style={{
          maxWidth: 480, width: "100%", padding: "36px 32px", borderRadius: 20,
          background: "#0E1117", border: "1px solid rgba(255,255,255,0.08)",
          textAlign: "center", boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: "0 auto 20px",
            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Lock size={24} color="#F87171" />
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 10, letterSpacing: "-0.03em" }}>
            {t("trialEndedTitle")}
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.65, marginBottom: 28 }}>
            {subscription.reason === "TRIAL_EXPIRED"
              ? t("trialEndedDesc")
              : t("subscriptionInactiveDesc")}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link
              href={`/${locale}/dashboard/settings?tab=billing`}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "13px 22px", borderRadius: 12, background: GREEN, color: "#fff",
                fontWeight: 600, fontSize: 14, textDecoration: "none",
              }}
            >
              {t("viewPlans")}
            </Link>

            <button
              onClick={handleRequestUpgrade}
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "12px 22px", borderRadius: 12,
                background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.7)", fontWeight: 500, fontSize: 13,
                cursor: loading ? "not-allowed" : "pointer", fontFamily: FONT,
              }}
            >
              {loading ? <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} /> : <Mail size={15} />}
              {t("contactToSubscribe")}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
