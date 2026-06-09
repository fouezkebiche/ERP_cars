"use client"
import type React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, ArrowRight, Car, Check, Loader2, Eye, EyeOff } from "lucide-react"
import { useTranslations } from "next-intl"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

/* ─── tokens ─────────────────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const G_DIM   = "rgba(34,197,94,0.11)"
const G_GLOW  = "rgba(34,197,94,0.25)"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"

interface Plan {
  id: string; name: string; description?: string
  priceMonthly: number; maxVehicles: number; maxUsers?: number; features?: string[]
}

/* ─── field ──────────────────────────────────────────────────────── */
function Field({
  label, id, type = "text", placeholder, value, onChange, disabled, rightEl,
}: {
  label: string; id: string; type?: string; placeholder?: string
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean; rightEl?: React.ReactNode
}) {
  const [focus, setFocus] = useState(false)
  return (
    <div style={{ marginBottom: 18 }}>
      <label htmlFor={id} style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 7, fontFamily: FONT }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={id} name={id} type={type} placeholder={placeholder} value={value}
          onChange={onChange} disabled={disabled}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            width: "100%", padding: "12px 16px", paddingRight: rightEl ? 44 : 16,
            background: focus ? "rgba(255,255,255,0.07)" : SURFACE,
            border: `1px solid ${focus ? "rgba(34,197,94,0.5)" : BORDER}`,
            borderRadius: 12, color: "#fff", fontFamily: FONT, fontSize: 14,
            outline: "none", transition: "all 0.2s", boxSizing: "border-box",
          }}
        />
        {rightEl && (
          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", cursor: "pointer" }}>
            {rightEl}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── primary button ─────────────────────────────────────────────── */
function PrimaryBtn({ children, style = {}, disabled, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onMouseEnter={() => !disabled && setHov(true)}
      onMouseLeave={() => setHov(false)}
      disabled={disabled}
      style={{
        fontFamily: FONT, fontSize: 15, fontWeight: 600,
        padding: "13px 22px", borderRadius: 12, border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
        background: disabled ? "rgba(34,197,94,0.35)" : hov ? "#16A34A" : GREEN,
        color: "#fff",
        boxShadow: hov && !disabled ? `0 0 32px ${G_GLOW}` : "none",
        transform: hov && !disabled ? "translateY(-1px)" : "none",
        transition: "all 0.2s",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ─── plan card ──────────────────────────────────────────────────── */
const PLAN_COLORS: Record<string, string> = {
  basic: "#60A5FA", professional: "#818CF8", pro: "#818CF8", enterprise: "#C084FC",
}
function planColor(name: string) { return PLAN_COLORS[name?.toLowerCase()] || "#F59E0B" }

function PlanCard({ plan, selected, onClick }: { plan: Plan; selected: boolean; onClick: () => void }) {
  const accent = planColor(plan.name)
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "16px 18px", borderRadius: 14, cursor: "pointer",
        background: selected ? `${accent}12` : hov ? SURFACE : "transparent",
        border: `1.5px solid ${selected ? accent : hov ? "rgba(255,255,255,0.12)" : BORDER}`,
        transition: "all 0.2s", position: "relative",
      }}
    >
      {selected && (
        <div style={{ position: "absolute", top: 12, right: 12, width: 20, height: 20, borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Check size={11} color="#fff" strokeWidth={3} />
        </div>
      )}
      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 3, textTransform: "capitalize" }}>{plan.name}</div>
      <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: accent }}>
        {plan.priceMonthly === 0 ? "Free" : `${plan.priceMonthly.toLocaleString("fr-DZ")} DZD`}
        {plan.priceMonthly > 0 && <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)" }}>/mo</span>}
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
        {plan.maxVehicles === -1 ? "Unlimited" : plan.maxVehicles} vehicles
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function SignupPage() {
  const t = useTranslations("signup")
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    company: "", email: "", phone: "", password: "", confirmPassword: "",
    plan: "professional", termsAccepted: false,
  })
  const [showPw, setShowPw] = useState(false)
  const [showCPw, setShowCPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [plans, setPlans] = useState<Plan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`${API_URL}/api/pricing/plans`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const available: Plan[] = (json?.data?.plans ?? []).sort((a: Plan, b: Plan) => a.priceMonthly - b.priceMonthly)
        setPlans(available)
        if (available.length > 0 && !available.find(p => p.id === formData.plan))
          setFormData(prev => ({ ...prev, plan: available[0].id }))
      } catch (e) { console.error("Plans failed:", e) }
      finally { setPlansLoading(false) }
    })()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
  }

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setLoading(true); setError("")
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    try {
      if (step === 1) { setStep(2); clearTimeout(timeoutId); setLoading(false); return }
      if (formData.password !== formData.confirmPassword) throw new Error(t("errorPasswordMatch"))
      if (!formData.termsAccepted) throw new Error(t("errorTerms"))
      if (formData.password.length < 6) throw new Error(t("errorPasswordLength"))

      const companyRes = await fetch(`${API_URL}/api/companies`, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ name: formData.company, email: formData.email, phone: formData.phone, subscription_plan: formData.plan, subscription_status: "trial" }),
      })
      if (!companyRes.ok) { const d = await companyRes.json(); throw new Error(d.message || "Failed to create company") }
      const companyData = await companyRes.json(); clearTimeout(timeoutId)
      let companyId = companyData?.data?.company?.id || companyData?.company?.id || companyData?.data?.id || companyData?.id
      if (!companyId) throw new Error("Server did not return a company ID")
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(companyId)) throw new Error(`Invalid company ID format: ${companyId}`)

      const regRes = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ full_name: formData.company, email: formData.email, password: formData.password, company_id: companyId, role: "admin" }),
      })
      const regData = await regRes.json()
      if (!regRes.ok) throw new Error(regData.message || "Registration failed")

      const loginRes = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      })
      const loginData = await loginRes.json()
      if (!loginRes.ok) throw new Error(loginData.message || "Auto-login failed")
      localStorage.setItem("accessToken", loginData.data.accessToken)
      localStorage.setItem("refreshToken", loginData.data.refreshToken)
      router.push(`/${locale}/dashboard`)
    } catch (err: any) {
      clearTimeout(timeoutId)
      setError(err.name === "AbortError" ? t("errorTimeout") : err.message)
    } finally { setLoading(false) }
  }

  const benefits = [
    { title: t("benefit1Title"), desc: t("benefit1Desc") },
    { title: t("benefit2Title"), desc: t("benefit2Desc") },
    { title: t("benefit3Title"), desc: t("benefit3Desc") },
    { title: t("benefit4Title"), desc: t("benefit4Desc") },
  ]

  return (
    <div style={{ minHeight: "100vh", background: "#080B10", color: "#fff", fontFamily: FONT, display: "flex", overflowX: "hidden" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media(min-width:1024px) { .lg-panel { display: flex !important; } }
        ::placeholder { color: rgba(255,255,255,0.2) !important; }
      `}</style>

      {/* ambient */}
      <div aria-hidden style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse 60% 50% at 5% 60%, rgba(34,197,94,0.07) 0%, transparent 60%),
                     radial-gradient(ellipse 45% 38% at 95% 15%, rgba(129,140,248,0.06) 0%, transparent 55%)`,
      }} />

      {/* ── LEFT PANEL ─────────────────────────────────────────── */}
      <div className="lg-panel" style={{
        display: "none", flex: "0 0 460px", position: "relative", zIndex: 1,
        background: "rgba(255,255,255,0.018)", borderRight: `1px solid ${BORDER}`,
        flexDirection: "column", justifyContent: "center", padding: "60px 52px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 52 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(140deg,#22C55E,#15803D)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 20px ${G_GLOW}` }}>
            <Car size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.025em" }}>CarManager</span>
        </div>

        <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 14 }}>
          Join 500+<br />
          <span style={{ background: "linear-gradient(120deg,#22C55E,#86EFAC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>rental agencies.</span>
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.38)", lineHeight: 1.65, marginBottom: 44 }}>
          Start your 30-day free trial. No credit card required.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {benefits.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: G_DIM, border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <Check size={12} color={GREEN} strokeWidth={3} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{b.title}</div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.38)", lineHeight: 1.6 }}>{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", position: "relative", zIndex: 1 }}>

        <Link href={`/${locale}`} style={{
          position: "absolute", top: 24, left: 24, display: "flex", alignItems: "center", gap: 6,
          color: "rgba(255,255,255,0.35)", textDecoration: "none", fontSize: 13, transition: "color 0.2s",
        }}
          onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>
          <ArrowLeft size={14} /> {t("back")}
        </Link>

        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* step indicator */}
          <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
            {[1, 2].map(n => (
              <div key={n} style={{
                height: 3, flex: 1, borderRadius: 99,
                background: step >= n ? GREEN : BORDER,
                transition: "background 0.4s",
              }} />
            ))}
          </div>

          {/* header */}
          <div style={{ marginBottom: 30 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 12px", borderRadius: 999, marginBottom: 20,
              background: G_DIM, border: "1px solid rgba(34,197,94,0.22)",
              fontSize: 11, fontWeight: 600, color: "#4ADE80",
            }}>
              Step {step} of 2
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.035em", marginBottom: 8 }}>
              {step === 1 ? t("step1Title") : t("step2Title")}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 14 }}>
              {step === 1 ? t("step1Subtitle") : t("step2Subtitle")}
            </p>
          </div>

          {/* form */}
          <form onSubmit={handleSubmit}>
            {step === 1 ? (
              <>
                <Field label={t("companyName")} id="company" placeholder={t("companyPlaceholder")} value={formData.company} onChange={handleChange} disabled={loading} />
                <Field label={t("phone")} id="phone" placeholder={t("phonePlaceholder")} value={formData.phone} onChange={handleChange} disabled={loading} />

                {/* plan selector */}
                <div style={{ marginBottom: 22 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 10, fontFamily: FONT }}>{t("selectPlan")}</label>
                  {plansLoading ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.38)", fontSize: 13 }}>
                      <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> Loading plans…
                    </div>
                  ) : plans.length === 0 ? (
                    <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13 }}>No plans available</p>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
                      {plans.map(plan => (
                        <PlanCard key={plan.id} plan={plan} selected={formData.plan === plan.id} onClick={() => setFormData(prev => ({ ...prev, plan: plan.id }))} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Field label={t("email")} id="email" type="email" placeholder={t("emailPlaceholder")} value={formData.email} onChange={handleChange} disabled={loading} />
                <Field
                  label={t("password")} id="password" type={showPw ? "text" : "password"}
                  placeholder={t("passwordPlaceholder")} value={formData.password} onChange={handleChange} disabled={loading}
                  rightEl={<span onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</span>}
                />
                <Field
                  label={t("confirmPassword")} id="confirmPassword" type={showCPw ? "text" : "password"}
                  placeholder={t("passwordPlaceholder")} value={formData.confirmPassword} onChange={handleChange} disabled={loading}
                  rightEl={<span onClick={() => setShowCPw(!showCPw)}>{showCPw ? <EyeOff size={15} /> : <Eye size={15} />}</span>}
                />

                {/* terms */}
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 22, cursor: "pointer" }}>
                  <div
                    style={{
                      width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${formData.termsAccepted ? GREEN : BORDER}`,
                      background: formData.termsAccepted ? GREEN : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: 1, transition: "all 0.2s",
                    }}
                    onClick={() => setFormData(prev => ({ ...prev, termsAccepted: !prev.termsAccepted }))}
                  >
                    {formData.termsAccepted && <Check size={10} color="#fff" strokeWidth={3.5} />}
                  </div>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{t("terms")}</span>
                </label>
              </>
            )}

            {error && (
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5", fontSize: 13, marginBottom: 18 }}>
                {error}
              </div>
            )}

            <PrimaryBtn type="submit" disabled={loading}>
              {loading ? (
                <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} /> {t("processing")}</>
              ) : step === 1 ? (
                <>{t("next")} <ArrowRight size={15} /></>
              ) : t("createAccount")}
            </PrimaryBtn>

            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ width: "100%", marginTop: 12, padding: "12px", borderRadius: 12, fontFamily: FONT, fontSize: 13, fontWeight: 500, background: "transparent", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "rgba(255,255,255,0.4)" }}
              >
                ← Back to step 1
              </button>
            )}
          </form>

          {/* sign in link */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
            <div style={{ flex: 1, height: 1, background: BORDER }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>or</span>
            <div style={{ flex: 1, height: 1, background: BORDER }} />
          </div>
          <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.38)", marginBottom: 14 }}>{t("haveAccount")}</p>
          <Link href={`/${locale}/login`}>
            <button style={{
              width: "100%", padding: "12px", borderRadius: 12, fontFamily: FONT, fontSize: 14, fontWeight: 600,
              background: "transparent", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.55)", cursor: "pointer", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#fff" }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.55)" }}>
              {t("signIn")}
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}