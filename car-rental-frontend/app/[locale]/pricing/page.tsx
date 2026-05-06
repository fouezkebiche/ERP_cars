"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Check, ArrowLeft, Loader2, Car, ArrowRight, Star, Zap, Shield } from "lucide-react"
import { useTranslations } from "next-intl"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

/* ─── tokens ─────────────────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const G_DIM   = "rgba(34,197,94,0.11)"
const G_GLOW  = "rgba(34,197,94,0.25)"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"

interface LivePlan {
  id: string; name: string; description?: string
  priceMonthly: number; maxVehicles: number; maxUsers?: number; features?: string[]
}

const PLAN_CONFIG: Record<string, { accent: string; icon: React.ElementType; tagline: string }> = {
  basic:        { accent: "#60A5FA", icon: Shield,  tagline: "Perfect for small fleets" },
  professional: { accent: "#818CF8", icon: Zap,     tagline: "Most popular choice" },
  pro:          { accent: "#818CF8", icon: Zap,     tagline: "Most popular choice" },
  enterprise:   { accent: "#C084FC", icon: Star,    tagline: "Unlimited scale" },
}
function planConfig(name: string) {
  return PLAN_CONFIG[name?.toLowerCase()] || { accent: "#F59E0B", icon: Zap, tagline: "Great value" }
}

function getPopularId(plans: LivePlan[]): string | null {
  if (plans.length < 2) return null
  const sorted = [...plans].sort((a, b) => a.priceMonthly - b.priceMonthly)
  return sorted[Math.floor(sorted.length / 2)]?.id ?? null
}

/* ─── ghost button ───────────────────────────────────────────────── */
function GhostBtn({ children, style = {}, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [hov, setHov] = useState(false)
  return (
    <button onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: FONT, fontSize: 14, fontWeight: 600, padding: "11px 22px", borderRadius: 10,
        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7,
        background: hov ? "rgba(255,255,255,0.07)" : "transparent",
        color: hov ? "#fff" : "rgba(255,255,255,0.58)",
        border: "1px solid rgba(255,255,255,0.1)", transition: "all 0.2s", ...style,
      }} {...rest}>
      {children}
    </button>
  )
}

/* ─── primary button ─────────────────────────────────────────────── */
function PrimaryBtn({ children, style = {}, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [hov, setHov] = useState(false)
  return (
    <button onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: FONT, fontSize: 14, fontWeight: 600, padding: "12px 22px", borderRadius: 10, border: "none",
        cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
        background: hov ? "#16A34A" : GREEN, color: "#fff",
        boxShadow: hov ? `0 0 32px ${G_GLOW}` : `0 0 18px rgba(34,197,94,0.18)`,
        transform: hov ? "translateY(-1px)" : "none", transition: "all 0.2s", ...style,
      }} {...rest}>
      {children}
    </button>
  )
}

/* ─── FAQ accordion ──────────────────────────────────────────────── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "18px 0", cursor: "pointer" }} onClick={() => setOpen(!open)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <h4 style={{ fontSize: 15, fontWeight: 600, margin: 0, lineHeight: 1.4 }}>{q}</h4>
        <div style={{
          width: 22, height: 22, borderRadius: 6, background: open ? G_DIM : "transparent",
          border: `1px solid ${open ? "rgba(34,197,94,0.3)" : BORDER}`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s",
          fontSize: 14, color: open ? GREEN : "rgba(255,255,255,0.4)", fontWeight: 700,
        }}>
          {open ? "−" : "+"}
        </div>
      </div>
      {open && (
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginTop: 12, marginBottom: 0 }}>{a}</p>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function PricingPage() {
  const t      = useTranslations("pricing")
  const params = useParams()
  const locale = params.locale as string

  const [plans, setPlans]     = useState<LivePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`${API_URL}/api/pricing/plans`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const livePlans: LivePlan[] = (json?.data?.plans ?? []).sort((a: LivePlan, b: LivePlan) => a.priceMonthly - b.priceMonthly)
        setPlans(livePlans)
      } catch (e) { console.error("Plans failed:", e); setError(true) }
      finally { setLoading(false) }
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
    <div style={{ minHeight: "100vh", background: "#080B10", color: "#fff", fontFamily: FONT, overflowX: "hidden" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ambient */}
      <div aria-hidden style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse 65% 40% at 12% -5%, rgba(34,197,94,0.09) 0%, transparent 62%),
                     radial-gradient(ellipse 50% 38% at 88% 12%, rgba(129,140,248,0.07) 0%, transparent 58%)`,
      }} />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: scrolled ? "rgba(8,11,16,0.9)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: `1px solid ${scrolled ? BORDER : "transparent"}`,
        transition: "all 0.3s",
      }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(140deg,#22C55E,#15803D)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 16px ${G_GLOW}` }}>
              <Car size={15} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.025em" }}>CarManager</span>
          </div>
          <Link href={`/${locale}`} style={{ textDecoration: "none" }}>
            <GhostBtn style={{ padding: "8px 16px", fontSize: 13 }}>
              <ArrowLeft size={14} /> {t("back")}
            </GhostBtn>
          </Link>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px 64px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "5px 14px", borderRadius: 999, marginBottom: 28,
          background: G_DIM, border: "1px solid rgba(34,197,94,0.22)",
          fontSize: 12, fontWeight: 500, color: "#4ADE80",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", display: "inline-block" }} />
          Simple, transparent pricing
        </div>
        <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.8rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.08, maxWidth: 640, margin: "0 auto 18px" }}>
          {t("title")}{" "}
          <span style={{ background: "linear-gradient(120deg,#22C55E,#86EFAC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            your fleet
          </span>
        </h1>
        <p style={{ fontSize: "clamp(0.95rem, 1.7vw, 1.1rem)", color: "rgba(255,255,255,0.42)", maxWidth: 460, margin: "0 auto", lineHeight: 1.65 }}>
          {t("subtitle")}
        </p>
      </section>

      {/* ── PLAN CARDS ─────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 80px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 16 }}>
              <Loader2 size={28} style={{ animation: "spin 0.8s linear infinite", color: "rgba(255,255,255,0.3)" }} />
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>Loading plans…</p>
            </div>
          )}

          {!loading && error && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15 }}>Could not load plans. Please try again later.</p>
            </div>
          )}

          {!loading && !error && plans.length > 0 && (
            <>
              {/* cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 72 }}>
                {plans.map((plan, i) => {
                  const isPopular = plan.id === popularId
                  const cfg = planConfig(plan.name)
                  const Icon = cfg.icon
                  return (
                    <div key={plan.id} style={{
                      padding: "32px 30px", borderRadius: 20, position: "relative",
                      background: isPopular ? `${cfg.accent}0A` : SURFACE,
                      border: `${isPopular ? "1.5px" : "1px"} solid ${isPopular ? cfg.accent + "55" : BORDER}`,
                      transform: isPopular ? "scale(1.03)" : "none",
                      boxShadow: isPopular ? `0 0 60px ${cfg.accent}18` : "none",
                      animation: `fadeUp 0.5s ease ${i * 0.1}s both`,
                      display: "flex", flexDirection: "column",
                    }}>
                      {isPopular && (
                        <div style={{
                          position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                          padding: "4px 16px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                          background: cfg.accent, color: "#fff", letterSpacing: "0.04em", textTransform: "uppercase",
                        }}>
                          {t("popular")}
                        </div>
                      )}

                      {/* plan header */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 11, background: `${cfg.accent}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon size={18} color={cfg.accent} />
                        </div>
                        <div>
                          <div style={{ fontSize: 17, fontWeight: 700, textTransform: "capitalize" }}>{plan.name}</div>
                          <div style={{ fontSize: 11, color: cfg.accent, fontWeight: 600 }}>{cfg.tagline}</div>
                        </div>
                      </div>

                      {/* price */}
                      <div style={{ marginBottom: 28 }}>
                        {plan.priceMonthly === 0 ? (
                          <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1 }}>Free</div>
                        ) : (
                          <>
                            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1 }}>
                              {plan.priceMonthly.toLocaleString("fr-DZ")}
                              <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.35)" }}> DZD</span>
                            </div>
                            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{t("perMonth")}</div>
                          </>
                        )}
                      </div>

                      {/* CTA */}
                      <Link href={`/${locale}/signup`} style={{ marginBottom: 28 }}>
                        {isPopular ? (
                          <PrimaryBtn style={{ width: "100%" }}>
                            {t("getStarted")} <ArrowRight size={15} />
                          </PrimaryBtn>
                        ) : (
                          <button style={{
                            width: "100%", padding: "12px", borderRadius: 10, fontFamily: FONT, fontSize: 14, fontWeight: 600,
                            background: "transparent", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.6)", cursor: "pointer", transition: "all 0.2s",
                          }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = `${cfg.accent}55`; e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = `${cfg.accent}08` }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; e.currentTarget.style.background = "transparent" }}>
                            {t("getStarted")}
                          </button>
                        )}
                      </Link>

                      {/* divider */}
                      <div style={{ height: 1, background: BORDER, marginBottom: 22 }} />

                      {/* features */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 18, height: 18, borderRadius: 5, background: `${cfg.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Check size={10} color={cfg.accent} strokeWidth={3} />
                          </div>
                          <span style={{ fontSize: 13.5, color: "rgba(255,255,255,0.65)" }}>
                            {plan.maxVehicles === -1 ? "Unlimited" : plan.maxVehicles} vehicles
                          </span>
                        </div>
                        {plan.maxUsers !== undefined && (
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 18, height: 18, borderRadius: 5, background: `${cfg.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Check size={10} color={cfg.accent} strokeWidth={3} />
                            </div>
                            <span style={{ fontSize: 13.5, color: "rgba(255,255,255,0.65)" }}>
                              {plan.maxUsers === -1 ? "Unlimited" : plan.maxUsers} users
                            </span>
                          </div>
                        )}
                        {(plan.features || []).map((f, j) => (
                          <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                            <div style={{ width: 18, height: 18, borderRadius: 5, background: `${cfg.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                              <Check size={10} color={cfg.accent} strokeWidth={3} />
                            </div>
                            <span style={{ fontSize: 13.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* comparison table */}
              {plans.length > 1 && (
                <div style={{ marginBottom: 72 }}>
                  <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: "-0.035em", textAlign: "center", marginBottom: 36 }}>
                    {t("comparisonTitle")}
                  </h2>
                  <div style={{ overflowX: "auto", borderRadius: 16, border: `1px solid ${BORDER}`, background: SURFACE }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <th style={{ textAlign: "left", padding: "16px 20px", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>
                            {t("comparison.feature")}
                          </th>
                          {plans.map(p => {
                            const cfg = planConfig(p.name)
                            return (
                              <th key={p.id} style={{ textAlign: "center", padding: "16px 20px", fontSize: 13, fontWeight: 700, textTransform: "capitalize", color: cfg.accent }}>
                                {p.name}
                              </th>
                            )
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonRows.map((row, i) => (
                          <tr key={i} style={{ borderBottom: i < comparisonRows.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                            <td style={{ padding: "14px 20px", fontSize: 14, color: "rgba(255,255,255,0.6)" }}>{row.label}</td>
                            {plans.map(p => {
                              const val = row.getValue(p)
                              const cfg = planConfig(p.name)
                              return (
                                <td key={p.id} style={{ textAlign: "center", padding: "14px 20px" }}>
                                  {val === true ? (
                                    <div style={{ width: 22, height: 22, borderRadius: 6, background: `${cfg.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                                      <Check size={12} color={cfg.accent} strokeWidth={3} />
                                    </div>
                                  ) : val === false ? (
                                    <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 16 }}>—</span>
                                  ) : (
                                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", padding: "3px 10px", borderRadius: 6, background: SURFACE, border: `1px solid ${BORDER}` }}>{val}</span>
                                  )}
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

          {!loading && !error && plans.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15 }}>No plans available yet. Please check back soon.</p>
            </div>
          )}

          {/* FAQ */}
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: "-0.035em", textAlign: "center", marginBottom: 40 }}>
              {t("faqTitle")}
            </h2>
            <div>
              {faqs.map(key => (
                <FAQItem key={key} q={t(`faq.${key}`)} a={t(`faq.${key.replace("q", "a")}`)} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ────────────────────────────────────────── */}
      <section style={{ padding: "96px 24px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div aria-hidden style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: 560, height: 280, pointerEvents: "none",
          background: "radial-gradient(ellipse, rgba(34,197,94,0.09) 0%, transparent 70%)",
        }} />
        <div style={{
          maxWidth: 520, margin: "0 auto", position: "relative",
          padding: "52px 40px", borderRadius: 20,
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(34,197,94,0.17)",
          boxShadow: "0 0 60px rgba(34,197,94,0.06)",
        }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, marginBottom: 20, background: G_DIM, border: "1px solid rgba(34,197,94,0.22)", fontSize: 11, fontWeight: 600, color: "#4ADE80" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ADE80", display: "inline-block" }} />
            No credit card required
          </div>
          <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 800, letterSpacing: "-0.035em", marginBottom: 14 }}>
            {t("ctaTitle")}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.42)", fontSize: 15, marginBottom: 32, lineHeight: 1.65 }}>
            {t("ctaSubtitle")}
          </p>
          <Link href={`/${locale}/signup`}>
            <PrimaryBtn style={{ fontSize: 15, padding: "13px 30px" }}>
              {t("ctaButton")} <ArrowRight size={16} />
            </PrimaryBtn>
          </Link>
          <p style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.22)" }}>14-day free trial · Cancel anytime</p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "32px 24px", position: "relative", zIndex: 1, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, marginBottom: 12 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(140deg,#22C55E,#15803D)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Car size={12} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>CarManager</span>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", margin: 0 }}>
          © {new Date().getFullYear()} CarManager. All rights reserved.
        </p>
      </footer>
    </div>
  )
}