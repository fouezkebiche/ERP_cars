"use client"

import Link from "next/link"
import { useParams, useRouter, usePathname } from "next/navigation"
import {
  ArrowRight, BarChart3, Users, FileText,
  CreditCard, Shield, Car, Star,
  Menu, X, TrendingUp, Clock,
  Activity, Lock, CheckCircle2
} from "lucide-react"
import { useTranslations } from "next-intl"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { useState, useEffect } from "react"

/* ─── tokens ────────────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const G_DIM   = "rgba(34,197,94,0.11)"
const G_GLOW  = "rgba(34,197,94,0.25)"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"

/* ─── reusable buttons ───────────────────────────────────────── */
function PrimaryBtn({
  children, style = {}, ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: FONT, fontSize: 14, fontWeight: 600,
        padding: "11px 22px", borderRadius: 10, border: "none",
        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7,
        background: hov ? "#16A34A" : GREEN,
        color: "#fff",
        boxShadow: hov ? `0 0 32px ${G_GLOW}` : `0 0 18px rgba(34,197,94,0.18)`,
        transform: hov ? "translateY(-1px)" : "none",
        transition: "all 0.2s",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}

function GhostBtn({
  children, style = {}, ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: FONT, fontSize: 14, fontWeight: 500,
        padding: "11px 22px", borderRadius: 10,
        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7,
        background: hov ? "rgba(255,255,255,0.07)" : "transparent",
        color: hov ? "#fff" : "rgba(255,255,255,0.58)",
        border: "1px solid rgba(255,255,255,0.1)",
        transition: "all 0.2s",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ─── animated counter ───────────────────────────────────────── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let n = 0
    const step = to / 40
    const id = setInterval(() => {
      n += step
      if (n >= to) { setVal(to); clearInterval(id) }
      else setVal(Math.floor(n))
    }, 28)
    return () => clearInterval(id)
  }, [to])
  return <>{val}{suffix}</>
}

/* ─── feature list ───────────────────────────────────────────── */
const FEATURES = [
  { icon: Car,         key: "vehicle",   accent: "#22C55E" },
  { icon: Users,       key: "crm",       accent: "#818CF8" },
  { icon: FileText,    key: "contracts", accent: "#38BDF8" },
  { icon: CreditCard,  key: "payments",  accent: "#FB923C" },
  { icon: BarChart3,   key: "analytics", accent: "#F472B6" },
  { icon: Shield,      key: "multiUser", accent: "#34D399" },
] as const

/* ═══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const t = useTranslations()
  const params   = useParams()
  const router   = useRouter()
  const pathname = usePathname()
  const locale   = params.locale as string
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled,   setScrolled]   = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  const switchLocale = (newLocale: string) => {
    const segs = pathname.split("/")
    segs[1] = newLocale
    router.push(segs.join("/"))
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080B10", color: "#fff", fontFamily: FONT, overflowX: "hidden" }}>

      {/* ambient glow */}
      <div aria-hidden style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: `
          radial-gradient(ellipse 65% 40% at 12% -5%, rgba(34,197,94,0.09) 0%, transparent 62%),
          radial-gradient(ellipse 50% 38% at 88% 12%, rgba(129,140,248,0.07) 0%, transparent 58%)
        `,
      }} />

      {/* ════════════════════════ HEADER */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: scrolled ? "rgba(8,11,16,0.9)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: `1px solid ${scrolled ? BORDER : "transparent"}`,
        transition: "all 0.3s",
      }}>
        <div style={{
          maxWidth: 1120, margin: "0 auto", padding: "0 24px",
          height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: "linear-gradient(140deg, #22C55E 0%, #15803D 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 16px ${G_GLOW}`,
            }}>
              <Car size={15} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.025em" }}>CarManager</span>
          </div>

          {/* nav */}
          <nav className="hidden md:flex" style={{ display: "flex", gap: 32 }}>
            {(["features", "pricing", "howItWorks"] as const).map(k => (
              <a key={k}
                href={`#${k === "howItWorks" ? "how-it-works" : k}`}
                style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>
                {t(`nav.${k}`)}
              </a>
            ))}
          </nav>

          {/* actions */}
          <div className="hidden md:flex" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <LanguageSwitcher />
            <Link href={`/${locale}/login`}>
              <GhostBtn style={{ padding: "8px 16px" }}>{t("nav.signIn")}</GhostBtn>
            </Link>
            <Link href={`/${locale}/signup`}>
              <PrimaryBtn style={{ padding: "8px 18px" }}>{t("nav.getStarted")}</PrimaryBtn>
            </Link>
          </div>

          {/* mobile toggle */}
          <button className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 4 }}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* mobile menu */}
        {mobileOpen && (
          <div style={{ background: "rgba(8,11,16,0.98)", backdropFilter: "blur(20px)", borderTop: `1px solid ${BORDER}`, padding: "16px 24px 24px" }}>
            {(["features", "pricing", "howItWorks"] as const).map(k => (
              <a key={k}
                href={`#${k === "howItWorks" ? "how-it-works" : k}`}
                onClick={() => setMobileOpen(false)}
                style={{ display: "block", padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.65)", textDecoration: "none", fontSize: 15 }}>
                {t(`nav.${k}`)}
              </a>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <Link href={`/${locale}/login`} style={{ flex: 1 }}>
                <GhostBtn style={{ width: "100%", justifyContent: "center" }}>{t("nav.signIn")}</GhostBtn>
              </Link>
              <Link href={`/${locale}/signup`} style={{ flex: 1 }}>
                <PrimaryBtn style={{ width: "100%", justifyContent: "center" }}>{t("nav.getStarted")}</PrimaryBtn>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ════════════════════════ HERO */}
      <section style={{ position: "relative", zIndex: 1, padding: "88px 24px 72px", textAlign: "center" }}>

        {/* badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "5px 14px", borderRadius: 999, marginBottom: 32,
          background: G_DIM, border: "1px solid rgba(34,197,94,0.22)",
          fontSize: 12, fontWeight: 500, color: "#4ADE80",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", display: "inline-block" }} />
          Trusted by 500+ rental agencies worldwide
        </div>

        {/* headline */}
        <h1 style={{
          fontSize: "clamp(2.4rem, 5.5vw, 4.2rem)", fontWeight: 800,
          letterSpacing: "-0.04em", lineHeight: 1.08,
          maxWidth: 720, margin: "0 auto 20px",
        }}>
          {t("hero.title")}{" "}
          <span style={{
            background: "linear-gradient(120deg, #22C55E 0%, #86EFAC 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            {t("hero.highlight")}
          </span>
        </h1>

        {/* subtitle */}
        <p style={{
          fontSize: "clamp(1rem, 1.8vw, 1.12rem)",
          color: "rgba(255,255,255,0.44)",
          maxWidth: 500, margin: "0 auto 36px", lineHeight: 1.65, fontWeight: 400,
        }}>
          {t("hero.subtitle")}
        </p>

        {/* single CTA */}
        <div style={{ marginBottom: 64 }}>
          <Link href={`/${locale}/signup`}>
            <PrimaryBtn style={{ fontSize: 15, padding: "13px 28px" }}>
              {t("hero.startTrial")} <ArrowRight size={16} />
            </PrimaryBtn>
          </Link>
          <p style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.24)" }}>
            Free 30-day trial · No credit card required
          </p>
        </div>

        {/* stat cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
          gap: 12, maxWidth: 800, margin: "0 auto",
        }}>
          {([
            { Icon: TrendingUp,   label: "Fleet utilization", to: 38,  suffix: "%",  note: "+8% this month" },
            { Icon: Clock,        label: "Hours saved / week", to: 12,  suffix: "h",  note: "per manager" },
            { Icon: Activity,     label: "Uptime",             to: 99,  suffix: ".9%",note: "SLA guaranteed" },
            { Icon: CheckCircle2, label: "Active fleets",      to: 500, suffix: "+",  note: "worldwide" },
          ] as const).map(({ Icon, label, to, suffix, note }, i) => (
            <div key={i}
              style={{
                padding: "20px 22px", borderRadius: 14,
                background: SURFACE, border: `1px solid ${BORDER}`,
                textAlign: "left", transition: "border-color 0.22s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
            >
              <Icon size={15} color={GREEN} style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>
                <Counter to={to} suffix={suffix} />
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginTop: 4 }}>{label}</div>
              <div style={{ fontSize: 11, color: GREEN, marginTop: 6, fontWeight: 600 }}>{note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════ FEATURES */}
      <section id="features" style={{ padding: "90px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Features</p>
            <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.035em", marginBottom: 14 }}>
              {t("features.title")}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, maxWidth: 420, margin: "0 auto", lineHeight: 1.6 }}>
              {t("features.subtitle")}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 14 }}>
            {FEATURES.map(({ icon: Icon, key, accent }, i) => (
              <div key={i}
                style={{
                  padding: "26px 28px", borderRadius: 16,
                  background: SURFACE, border: `1px solid ${BORDER}`,
                  transition: "all 0.22s", cursor: "default",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${accent}44`
                  e.currentTarget.style.background   = `${accent}08`
                  e.currentTarget.style.transform    = "translateY(-2px)"
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = BORDER
                  e.currentTarget.style.background   = SURFACE
                  e.currentTarget.style.transform    = "none"
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 10, marginBottom: 16,
                  background: `${accent}14`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={18} color={accent} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8 }}>
                  {t(`features.items.${key}.title`)}
                </h3>
                <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.44)", lineHeight: 1.65, margin: 0 }}>
                  {t(`features.items.${key}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ HOW IT WORKS */}
      <section id="how-it-works" style={{
        padding: "90px 24px",
        background: "rgba(255,255,255,0.018)",
        borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`,
        position: "relative", zIndex: 1,
      }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Process</p>
            <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.035em", marginBottom: 14 }}>
              {t("howItWorks.title")}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, maxWidth: 360, margin: "0 auto" }}>
              {t("howItWorks.subtitle")}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 28 }}>
            {(["signup", "fleet", "manage"] as const).map((key, i) => (
              <div key={i}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: i === 0 ? GREEN : SURFACE,
                  border: `1px solid ${i === 0 ? "transparent" : BORDER}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 800,
                  color: i === 0 ? "#fff" : "rgba(255,255,255,0.38)",
                  marginBottom: 18,
                }}>
                  {i + 1}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 10 }}>
                  {t(`howItWorks.steps.${key}.title`)}
                </h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.42)", lineHeight: 1.65, margin: 0 }}>
                  {t(`howItWorks.steps.${key}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ PRICING */}
      <section id="pricing" style={{ padding: "90px 24px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Pricing</p>
          <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.035em", marginBottom: 14 }}>
            {t("pricing.title")}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>
            {t("pricing.subtitle")}
          </p>
          <Link href={`/${locale}/pricing`}>
            <GhostBtn style={{ fontSize: 14, padding: "11px 24px" }}>
              {t("pricing.viewPlans")} <ArrowRight size={15} />
            </GhostBtn>
          </Link>
        </div>
      </section>

      {/* ════════════════════════ TESTIMONIALS */}
      <section style={{
        padding: "72px 24px",
        background: "rgba(255,255,255,0.018)",
        borderTop: `1px solid ${BORDER}`,
        position: "relative", zIndex: 1,
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.27)", marginBottom: 44 }}>
            {t("social.trusted")}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 14 }}>
            {(["elite", "speed", "premium"] as const).map((key, i) => (
              <div key={i}
                style={{ padding: "26px 28px", borderRadius: 16, background: SURFACE, border: `1px solid ${BORDER}`, transition: "border-color 0.22s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(34,197,94,0.24)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
              >
                <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
                  {[...Array(5)].map((_, j) => <Star key={j} size={13} fill={GREEN} color={GREEN} />)}
                </div>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.54)", lineHeight: 1.7, marginBottom: 20, fontStyle: "italic" }}>
                  "{t(`social.testimonials.${key}.quote`)}"
                </p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.78)", margin: 0 }}>
                  {t(`social.testimonials.${key}.name`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ CTA */}
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
          <Lock size={20} color={GREEN} style={{ marginBottom: 20 }} />
          <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.3rem)", fontWeight: 800, letterSpacing: "-0.035em", marginBottom: 16 }}>
            {t("cta.title")}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.44)", fontSize: 15, marginBottom: 36, lineHeight: 1.65 }}>
            {t("cta.subtitle")}
          </p>
          <Link href={`/${locale}/signup`}>
            <PrimaryBtn style={{ fontSize: 15, padding: "13px 30px" }}>
              {t("cta.button")} <ArrowRight size={16} />
            </PrimaryBtn>
          </Link>
          <p style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.24)" }}>
            No credit card required · 30-day free trial
          </p>
        </div>
      </section>

      {/* ════════════════════════ FOOTER */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "52px 24px 32px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(140deg,#22C55E,#15803D)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Car size={13} color="#fff" />
                </div>
                <span style={{ fontWeight: 700, fontSize: 15 }}>CarManager</span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.33)", lineHeight: 1.7, maxWidth: 210 }}>
                Modern car rental management. Streamline your fleet, delight your clients.
              </p>
            </div>

            {[
              { heading: t("footer.product"), links: [{ label: t("nav.features"), href: "#features" }, { label: t("nav.pricing"), href: "#pricing" }] },
              { heading: t("footer.company"), links: [{ label: t("footer.about"), href: "#" }, { label: t("footer.contact"), href: "#" }] },
              { heading: t("footer.legal"),   links: [{ label: t("footer.terms"), href: "#" }, { label: t("footer.privacy"), href: "#" }] },
            ].map((col, i) => (
              <div key={i}>
                <h4 style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {col.heading}
                </h4>
                {col.links.map((link, j) => (
                  <a key={j} href={link.href}
                    style={{ display: "block", fontSize: 13.5, color: "rgba(255,255,255,0.36)", textDecoration: "none", marginBottom: 9, transition: "color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.36)")}>
                    {link.label}
                  </a>
                ))}
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.24)", margin: 0 }}>{t("footer.copyright")}</p>
            <div style={{ display: "flex", gap: 20 }}>
              {["Twitter", "LinkedIn", "Facebook"].map(s => (
                <a key={s} href="#"
                  style={{ fontSize: 12, color: "rgba(255,255,255,0.26)", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.26)")}>
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}