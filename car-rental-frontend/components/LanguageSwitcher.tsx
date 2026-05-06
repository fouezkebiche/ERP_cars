"use client"

import { useParams, useRouter, usePathname } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { Globe, ChevronDown, Check } from "lucide-react"

/* ─── tokens (match landing page) ──────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"

const languages = [
  { code: "en", label: "English", flag: "gb" },
  { code: "fr", label: "Français", flag: "fr" },
  { code: "ar", label: "العربية", flag: "dz" },
]

export default function LanguageSwitcher() {
  const params   = useParams()
  const router   = useRouter()
  const pathname = usePathname()
  const locale   = (params.locale as string) || "en"

  const [open, setOpen] = useState(false)
  const [hov,  setHov]  = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = languages.find((l) => l.code === locale) || languages[0]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const switchLocale = (code: string) => {
    const segments = pathname.split("/")
    const knownLocales = ["en", "fr", "ar"]
    if (knownLocales.includes(segments[1])) segments[1] = code
    else segments.splice(1, 0, code)
    router.push(segments.join("/") || "/")
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: "relative", fontFamily: FONT }}>

      {/* ── trigger button ── */}
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "7px 13px", borderRadius: 10,
          background: open ? "rgba(255,255,255,0.07)" : hov ? "rgba(255,255,255,0.06)" : SURFACE,
          border: `1px solid ${open ? "rgba(34,197,94,0.35)" : hov ? "rgba(255,255,255,0.12)" : BORDER}`,
          cursor: "pointer", transition: "all 0.2s",
          boxShadow: open ? "0 0 0 3px rgba(34,197,94,0.08)" : "none",
        }}
      >
        <Globe size={13} color={open ? GREEN : "rgba(255,255,255,0.45)"} style={{ transition: "color 0.2s", flexShrink: 0 }} />

        <img
          src={`https://flagcdn.com/20x15/${current.flag}.png`}
          width={18} height={13}
          alt={current.label}
          style={{ borderRadius: 3, display: "block", flexShrink: 0 }}
        />

        <span style={{
          fontSize: 13, fontWeight: 500,
          color: open ? "#fff" : "rgba(255,255,255,0.55)",
          transition: "color 0.2s",
          /* hide on very small screens */
          display: "inline",
        }}
          className="hidden sm:inline"
        >
          {current.label}
        </span>

        <ChevronDown
          size={11}
          color="rgba(255,255,255,0.35)"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.22s", flexShrink: 0 }}
        />
      </button>

      {/* ── dropdown ── */}
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 8px)",
          width: 172, borderRadius: 12, overflow: "hidden", zIndex: 50,
          background: "#0E1117",
          border: `1px solid rgba(255,255,255,0.09)`,
          boxShadow: "0 16px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.2)",
        }}>
          {/* subtle top accent line */}
          <div style={{ height: 2, background: `linear-gradient(90deg, ${GREEN}, transparent)` }} />

          {languages.map((lang, i) => {
            const isActive = locale === lang.code
            return (
              <ItemRow
                key={lang.code}
                lang={lang}
                isActive={isActive}
                isLast={i === languages.length - 1}
                onClick={() => switchLocale(lang.code)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── dropdown row (needs own hover state) ────────────────────────── */
function ItemRow({
  lang, isActive, isLast, onClick,
}: {
  lang: { code: string; label: string; flag: string }
  isActive: boolean; isLast: boolean; onClick: () => void
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "9px 14px",
        background: isActive ? "rgba(34,197,94,0.08)" : hov ? "rgba(255,255,255,0.05)" : "transparent",
        border: "none",
        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)",
        cursor: "pointer", transition: "background 0.15s", textAlign: "left",
        fontFamily: FONT,
      }}
    >
      <img
        src={`https://flagcdn.com/20x15/${lang.flag}.png`}
        width={18} height={13} alt={lang.label}
        style={{ borderRadius: 3, display: "block", flexShrink: 0 }}
      />
      <span style={{
        flex: 1, fontSize: 13, fontWeight: isActive ? 600 : 400,
        color: isActive ? "#fff" : "rgba(255,255,255,0.55)",
        transition: "color 0.15s",
      }}>
        {lang.label}
      </span>
      {isActive && (
        <div style={{
          width: 16, height: 16, borderRadius: 5,
          background: "rgba(34,197,94,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Check size={9} color={GREEN} strokeWidth={3} />
        </div>
      )}
    </button>
  )
}