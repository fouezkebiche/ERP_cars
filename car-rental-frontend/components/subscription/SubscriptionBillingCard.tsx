"use client"

import { useState, useEffect } from "react"
import { Loader2, Mail, CheckCircle, AlertCircle, Check } from "lucide-react"
import { useTranslations } from "next-intl"
import toast from "react-hot-toast"
import { useCompany, type PricingPlan } from "@/context/CompanyContext"

const SURFACE2 = "rgba(255,255,255,0.07)"
const BORDER = "rgba(255,255,255,0.07)"
const GREEN = "#22C55E"
const MUTED = "rgba(255,255,255,0.4)"
const TEXT = "#FFFFFF"
const FONT = "'Plus Jakarta Sans', system-ui, sans-serif"

const PLAN_COLORS: Record<string, string> = {
  basic: "#60A5FA",
  professional: "#818CF8",
  enterprise: "#C084FC",
}

function StatusBadge({ status, isExpired }: { status: string; isExpired: boolean }) {
  const t = useTranslations("subscription")
  const colors: Record<string, { bg: string; color: string; label: string }> = {
    trial: { bg: "rgba(34,197,94,0.12)", color: GREEN, label: t("statusTrial") },
    active: { bg: "rgba(34,197,94,0.12)", color: GREEN, label: t("statusActive") },
    suspended: { bg: "rgba(239,68,68,0.12)", color: "#F87171", label: t("statusSuspended") },
    inactive: { bg: "rgba(107,114,128,0.12)", color: "#9CA3AF", label: t("statusInactive") },
  }
  const key = isExpired && status === "trial" ? "suspended" : status
  const style = colors[key] || colors.inactive

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: style.bg, color: style.color,
    }}>
      {isExpired ? <AlertCircle size={11} /> : <CheckCircle size={11} />}
      {isExpired && status === "trial" ? t("statusExpired") : style.label}
    </span>
  )
}

export default function SubscriptionBillingCard() {
  const { subscription, loading, requestUpgrade, changePlan, fetchPlans } = useCompany()
  const t = useTranslations("subscription")
  const [submitting, setSubmitting] = useState(false)
  const [changingPlan, setChangingPlan] = useState<string | null>(null)
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)

  useEffect(() => {
    fetchPlans()
      .then(setPlans)
      .finally(() => setPlansLoading(false))
  }, [fetchPlans])

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: MUTED, fontSize: 13, fontFamily: FONT }}>
        <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />
        {t("loading")}
      </div>
    )
  }

  if (!subscription) return null

  const planName = subscription.subscription_plan
    ? subscription.subscription_plan.charAt(0).toUpperCase() + subscription.subscription_plan.slice(1)
    : "—"

  const price = subscription.plan_price_monthly
    ? `${subscription.plan_price_monthly.toLocaleString("fr-DZ")} DZD`
    : "—"

  const trialEnd = subscription.trial_ends_at
    ? new Date(subscription.trial_ends_at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
    : "—"

  const canChangePlan = subscription.subscription_status !== "active"

  const handleSubscribe = async () => {
    setSubmitting(true)
    try {
      await requestUpgrade()
      toast.success(t("requestSent"))
    } catch (e: any) {
      toast.error(e.message || t("requestFailed"))
    } finally {
      setSubmitting(false)
    }
  }

  const handleChangePlan = async (planId: string) => {
    setChangingPlan(planId)
    try {
      await changePlan(planId)
      toast.success(t("planChanged"))
    } catch (e: any) {
      toast.error(e.message || t("planChangeFailed"))
    } finally {
      setChangingPlan(null)
    }
  }

  return (
    <div style={{ fontFamily: FONT }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {subscription.isTrial && !subscription.isExpired && (
        <div style={{
          padding: "14px 16px", borderRadius: 10, marginBottom: 20,
          background: subscription.daysRemaining! <= 3 ? "rgba(245,158,11,0.08)" : "rgba(34,197,94,0.08)",
          border: `1px solid ${subscription.daysRemaining! <= 3 ? "rgba(245,158,11,0.25)" : "rgba(34,197,94,0.2)"}`,
        }}>
          <p style={{ fontSize: 13, color: "#fff", margin: 0 }}>
            {subscription.daysRemaining! <= 3
              ? t("trialEndingSoon", { days: subscription.daysRemaining! })
              : t("trialActive", { days: subscription.daysRemaining! })}
          </p>
        </div>
      )}

      {subscription.isExpired && (
        <div style={{
          padding: "14px 16px", borderRadius: 10, marginBottom: 20,
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
        }}>
          <p style={{ fontSize: 13, color: "#FCA5A5", margin: 0 }}>{t("trialEndedDesc")}</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
        {[
          { label: t("plan"), value: planName },
          { label: t("status"), value: <StatusBadge status={subscription.subscription_status} isExpired={subscription.isExpired} /> },
          { label: t("monthlyPrice"), value: price },
          { label: subscription.isTrial ? t("trialEnds") : t("renewalDate"), value: trialEnd },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: SURFACE2, borderRadius: 10, padding: "14px 16px",
            border: `1px solid ${BORDER}`,
          }}>
            <p style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>{label}</p>
            <div style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Plan picker */}
      {canChangePlan && (
        <div style={{ marginBottom: 28 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 6 }}>{t("changePlan")}</h4>
          <p style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>{t("changePlanDesc")}</p>

          {plansLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: MUTED, fontSize: 13 }}>
              <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />
              {t("loadingPlans")}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              {plans.map((plan) => {
                const isCurrent = plan.tier === subscription.subscription_plan
                const accent = PLAN_COLORS[plan.tier] || GREEN
                const isChanging = changingPlan === plan.id

                return (
                  <div
                    key={plan.id}
                    style={{
                      padding: "16px", borderRadius: 12, position: "relative",
                      background: isCurrent ? `${accent}12` : "rgba(255,255,255,0.02)",
                      border: `1.5px solid ${isCurrent ? accent : BORDER}`,
                      transition: "all 0.2s",
                    }}
                  >
                    {isCurrent && (
                      <div style={{
                        position: "absolute", top: 10, right: 10,
                        width: 20, height: 20, borderRadius: "50%", background: accent,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Check size={11} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                    <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 4 }}>{plan.name}</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: accent, marginBottom: 8 }}>
                      {plan.priceMonthly === 0 ? "Free" : `${plan.priceMonthly.toLocaleString("fr-DZ")} DZD`}
                      {plan.priceMonthly > 0 && <span style={{ fontSize: 11, fontWeight: 500, color: MUTED }}>/mo</span>}
                    </div>
                    <p style={{ fontSize: 11, color: MUTED, marginBottom: 12 }}>
                      {plan.maxVehicles === -1 ? "Unlimited" : plan.maxVehicles} vehicles
                    </p>
                    {!isCurrent && (
                      <button
                        onClick={() => handleChangePlan(plan.id)}
                        disabled={!!changingPlan}
                        style={{
                          width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${accent}44`,
                          background: "transparent", color: accent, fontSize: 12, fontWeight: 600,
                          cursor: changingPlan ? "not-allowed" : "pointer", fontFamily: FONT,
                        }}
                      >
                        {isChanging
                          ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite", margin: "0 auto", display: "block" }} />
                          : t("switchToPlan")}
                      </button>
                    )}
                    {isCurrent && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: accent }}>{t("currentPlan")}</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {(subscription.isTrial || subscription.isExpired) && (
        <button
          onClick={handleSubscribe}
          disabled={submitting}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "11px 22px", borderRadius: 10, border: "none",
            background: submitting ? "rgba(34,197,94,0.4)" : GREEN,
            color: "#fff", fontFamily: FONT, fontSize: 14, fontWeight: 600,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting
            ? <><Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} /> {t("sending")}</>
            : <><Mail size={15} /> {t("subscribeNow")}</>}
        </button>
      )}

      {subscription.subscription_status === "active" && (
        <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>{t("activePlanMessage")}</p>
      )}
    </div>
  )
}
