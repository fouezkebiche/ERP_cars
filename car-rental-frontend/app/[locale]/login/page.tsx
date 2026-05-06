"use client"
import type React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Car, Eye, EyeOff, ArrowRight } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useTranslations } from "next-intl"

/* ─── design tokens (matches landing page) ─────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const G_DIM   = "rgba(34,197,94,0.11)"
const G_GLOW  = "rgba(34,197,94,0.25)"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"

/* ─── primary button ─────────────────────────────────────────────── */
function PrimaryBtn({
  children, style = {}, disabled, ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
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
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        width: "100%",
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

/* ─── input field ─────────────────────────────────────────────────── */
function Field({
  label, id, type = "text", placeholder, value, onChange, disabled,
  rightEl,
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
          id={id} type={type} placeholder={placeholder} value={value}
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

/* ═══════════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const t = useTranslations("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [error, setError] = useState("")

  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const { login, user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user) return
    router.push(user.role === "owner" ? "/admin" : "/dashboard")
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setError("")
    setLoadingSubmit(true)
    try {
      await login(email, password)
    } catch (err: any) {
      setError(err?.message || "Login failed")
    } finally {
      setLoadingSubmit(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#080B10", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 44, height: 44, border: `3px solid ${GREEN}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>{t("checking")}</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (user) return null

  return (
    <div style={{ minHeight: "100vh", background: "#080B10", color: "#fff", fontFamily: FONT, display: "flex", overflowX: "hidden" }}>
      {/* ambient */}
      <div aria-hidden style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse 65% 55% at 0% 50%, rgba(34,197,94,0.07) 0%, transparent 60%),
                     radial-gradient(ellipse 50% 40% at 100% 10%, rgba(129,140,248,0.06) 0%, transparent 55%)`,
      }} />

      {/* ── LEFT PANEL ─────────────────────────────────────────── */}
      <div style={{
        display: "none", flex: "0 0 480px", position: "relative", zIndex: 1,
        background: "rgba(255,255,255,0.018)", borderRight: `1px solid ${BORDER}`,
        flexDirection: "column", justifyContent: "center", padding: "60px 56px",
      }} className="lg-panel">

        <style>{`
          @media(min-width:1024px) { .lg-panel { display: flex !important; } }
          .stat-row { display:flex; gap:12px; margin-top:12px; }
        `}</style>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 52 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(140deg,#22C55E,#15803D)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 20px ${G_GLOW}` }}>
            <Car size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.025em" }}>CarManager</span>
        </div>

        <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 16 }}>
          Welcome<br />
          <span style={{ background: "linear-gradient(120deg,#22C55E,#86EFAC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>back.</span>
        </h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", lineHeight: 1.65, marginBottom: 48, maxWidth: 320 }}>
          {t("tagline")}
        </p>

        {/* mini stats */}
        {/* <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { val: "500+", label: "Agencies worldwide" },
            { val: "99.9%", label: "Uptime SLA" },
            { val: "38%", label: "Better utilization" },
            { val: "12h", label: "Saved per week" },
          ].map(({ val, label }) => (
            <div key={label} style={{ padding: "18px 20px", borderRadius: 14, background: SURFACE, border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.04em", color: GREEN, marginBottom: 4 }}>{val}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{label}</div>
            </div>
          ))}
        </div> */}
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", position: "relative", zIndex: 1 }}>

        {/* back */}
        <Link href={`/${locale}`} style={{
          position: "absolute", top: 24, left: 24,
          display: "flex", alignItems: "center", gap: 6,
          color: "rgba(255,255,255,0.35)", textDecoration: "none", fontSize: 13,
          transition: "color 0.2s",
        }}
          onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>
          <ArrowLeft size={14} /> {t("back")}
        </Link>

        <div style={{ width: "100%", maxWidth: 400 }}>

          {/* header */}
          <div style={{ marginBottom: 36 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 12px", borderRadius: 999, marginBottom: 22,
              background: G_DIM, border: "1px solid rgba(34,197,94,0.22)",
              fontSize: 11, fontWeight: 600, color: "#4ADE80",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ADE80", display: "inline-block" }} />
              Secure sign-in
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.035em", marginBottom: 8 }}>{t("welcome")}</h1>
            <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 14 }}>{t("subtitle")}</p>
          </div>

          {/* form */}
          <form onSubmit={handleSubmit}>
            <Field label={t("email")} id="email" type="email" placeholder={t("emailPlaceholder")} value={email} onChange={e => setEmail(e.target.value)} disabled={loadingSubmit} />
            <Field
              label={t("password")} id="password" type={showPw ? "text" : "password"}
              placeholder={t("passwordPlaceholder")} value={password}
              onChange={e => setPassword(e.target.value)} disabled={loadingSubmit}
              rightEl={
                <span onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </span>
              }
            />

            {error && (
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5", fontSize: 13, marginBottom: 18 }}>
                {error}
              </div>
            )}

            <PrimaryBtn type="submit" disabled={loadingSubmit} style={{ marginTop: 4 }}>
              {loadingSubmit ? (
                <>
                  <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  {t("signingIn")}
                </>
              ) : (
                <>{t("signIn")} <ArrowRight size={15} /></>
              )}
            </PrimaryBtn>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </form>

          {/* divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "28px 0" }}>
            <div style={{ flex: 1, height: 1, background: BORDER }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>or</span>
            <div style={{ flex: 1, height: 1, background: BORDER }} />
          </div>

          {/* signup CTA */}
          <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.38)", marginBottom: 14 }}>{t("noAccount")}</p>
          <Link href={`/${locale}/signup`}>
            <button style={{
              width: "100%", padding: "12px", borderRadius: 12, fontFamily: FONT, fontSize: 14, fontWeight: 600,
              background: "transparent", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.55)", cursor: "pointer",
              transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#fff" }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.55)" }}>
              {t("createAccount")}
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}