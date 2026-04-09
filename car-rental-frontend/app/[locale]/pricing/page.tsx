"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Check, ArrowLeft, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

interface LivePlan {
  id: string
  name: string
  description?: string
  priceMonthly: number
  maxVehicles: number
  maxUsers?: number
  features?: string[]
}

// ── Color palette per plan name ──────────────────────────────────────────────
const PLAN_ACCENT: Record<string, string> = {
  basic: "#60a5fa", professional: "#818cf8", pro: "#818cf8", enterprise: "#c084fc",
}
function planAccent(name: string) {
  return PLAN_ACCENT[name?.toLowerCase()] || "#f59e0b"
}

// ── Determine "popular" plan (mid-tier by price) ──────────────────────────────
function getPopularId(plans: LivePlan[]): string | null {
  if (plans.length < 2) return null
  const sorted = [...plans].sort((a, b) => a.priceMonthly - b.priceMonthly)
  // mid-tier = index 1 in a sorted list (Professional / middle)
  return sorted[Math.floor(sorted.length / 2)]?.id ?? null
}

export default function PricingPage() {
  const t      = useTranslations("pricing")
  const params = useParams()
  const locale = params.locale as string

  const [plans, setPlans]     = useState<LivePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`${API_URL}/api/pricing/plans`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const livePlans: LivePlan[] = json?.data?.plans ?? []
        // Sort by price ascending (free first, then cheapest → most expensive)
        setPlans(livePlans.sort((a, b) => a.priceMonthly - b.priceMonthly))
      } catch (e) {
        console.error("Failed to load plans:", e)
        setError(true)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const popularId = getPopularId(plans)

  const comparisonRows = [
    { label: t("comparison.vehicleManagement"),  getValue: (p: LivePlan) => `${p.maxVehicles === -1 ? "Unlimited" : p.maxVehicles} vehicles` },
    { label: t("comparison.customerCRM"),        getValue: (_: LivePlan) => true },
    { label: t("comparison.contractManagement"), getValue: (_: LivePlan) => true },
    { label: t("comparison.paymentProcessing"),  getValue: (p: LivePlan) => p.priceMonthly > 0 },
    { label: t("comparison.advancedAnalytics"),  getValue: (p: LivePlan) => p.maxVehicles === -1 || p.priceMonthly >= 15000 },
    { label: t("comparison.dedicatedSupport"),   getValue: (p: LivePlan) => p.maxVehicles === -1 },
  ]

  const faqs = ["q1", "q2", "q3", "q4"] as const

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link href={`/${locale}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">{t("back")}</span>
          </Link>
        </div>
      </header>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">

          {/* Title */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("title")}</h1>
            <p className="text-xl text-muted-foreground">{t("subtitle")}</p>
          </div>

          {/* ── Loading ── */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading plans…</p>
            </div>
          )}

          {/* ── Error / fallback ── */}
          {!loading && error && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Could not load plans. Please try again later.</p>
            </div>
          )}

          {/* ── Plans grid ── */}
          {!loading && !error && plans.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                {plans.map(plan => {
                  const isPopular = plan.id === popularId
                  const accent    = planAccent(plan.name)
                  return (
                    <div
                      key={plan.id}
                      className={`rounded-lg border-2 p-8 flex flex-col transition-all ${
                        isPopular
                          ? "border-accent bg-gradient-to-b from-accent/10 to-background scale-105"
                          : "border-border bg-card hover:border-accent"
                      }`}
                    >
                      {isPopular && (
                        <span className="inline-block w-fit px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-semibold mb-4">
                          {t("popular")}
                        </span>
                      )}

                      <h3 className="text-2xl font-bold mb-2 capitalize">{plan.name}</h3>
                      <p className="text-muted-foreground mb-6">
                        {plan.description || ""}
                      </p>

                      {/* Price */}
                      <div className="mb-6">
                        {plan.priceMonthly === 0 ? (
                          <span className="text-4xl font-bold">Free</span>
                        ) : (
                          <>
                            <span className="text-4xl font-bold">
                              {plan.priceMonthly.toLocaleString("fr-DZ")}
                            </span>
                            <span className="text-muted-foreground"> DZD{" "}{t("perMonth")}</span>
                          </>
                        )}
                      </div>

                      <Button
                        className={`w-full mb-8 ${
                          isPopular
                            ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                            : "bg-primary hover:bg-primary/90"
                        }`}
                      >
                        {plan.priceMonthly === 0 ? t("getStarted") : t("getStarted")}
                      </Button>

                      {/* Limits */}
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: accent }} />
                          <span className="text-sm">
                            {plan.maxVehicles === -1 ? "Unlimited" : plan.maxVehicles} vehicles
                          </span>
                        </div>
                        {plan.maxUsers !== undefined && (
                          <div className="flex items-center gap-3">
                            <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: accent }} />
                            <span className="text-sm">
                              {plan.maxUsers === -1 ? "Unlimited" : plan.maxUsers} users
                            </span>
                          </div>
                        )}
                        {(plan.features || []).map((f, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: accent }} />
                            <span className="text-sm">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ── Comparison table ── */}
              {plans.length > 1 && (
                <div className="mb-16">
                  <h2 className="text-2xl font-bold mb-8 text-center">{t("comparisonTitle")}</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-start py-4 px-4 font-semibold">{t("comparison.feature")}</th>
                          {plans.map(p => (
                            <th key={p.id} className="text-center py-4 px-4 font-semibold capitalize">{p.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonRows.map((row, i) => (
                          <tr key={i} className="border-b border-border hover:bg-muted/50">
                            <td className="py-4 px-4">{row.label}</td>
                            {plans.map(p => {
                              const val = row.getValue(p)
                              return (
                                <td key={p.id} className="text-center py-4 px-4">
                                  {val === true
                                    ? <Check className="w-5 h-5 text-accent mx-auto" />
                                    : val === false
                                      ? <span className="text-muted-foreground">—</span>
                                      : <span className="text-sm text-muted-foreground">{val}</span>
                                  }
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Empty state ── */}
          {!loading && !error && plans.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No plans available yet. Please check back soon.</p>
            </div>
          )}

          {/* ── FAQ (static, from i18n) ── */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">{t("faqTitle")}</h2>
            <div className="space-y-4">
              {faqs.map(key => (
                <div key={key} className="p-4 rounded-lg border border-border">
                  <h4 className="font-semibold mb-2">{t(`faq.${key}`)}</h4>
                  <p className="text-muted-foreground text-sm">{t(`faq.${key.replace("q", "a")}`)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">{t("ctaTitle")}</h2>
          <p className="text-muted-foreground mb-8">{t("ctaSubtitle")}</p>
          <Link href={`/${locale}/signup`}>
            <Button size="lg" className="bg-primary hover:bg-primary/90">{t("ctaButton")}</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}