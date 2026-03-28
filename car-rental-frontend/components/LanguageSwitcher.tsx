"use client"

import { useParams, useRouter, usePathname } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { Globe, ChevronDown, Check } from "lucide-react"

const languages = [
  { code: "en", label: "English", flag: "gb" },
  { code: "fr", label: "Français", flag: "fr" },
  { code: "ar", label: "العربية", flag: "dz" },
]

export default function LanguageSwitcher() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const locale = (params.locale as string) || "en"

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = languages.find((l) => l.code === locale) || languages[0]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const switchLocale = (code: string) => {
    const segments = pathname.split("/")
    const knownLocales = ["en", "fr", "ar"]
    if (knownLocales.includes(segments[1])) {
      segments[1] = code
    } else {
      segments.splice(1, 0, code)
    }
    router.push(segments.join("/") || "/")
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted transition text-sm font-medium"
      >
        <Globe className="w-4 h-4 text-muted-foreground" />
        <img
          src={`https://flagcdn.com/20x15/${current.flag}.png`}
          width={20}
          height={15}
          alt={current.label}
          className="rounded-sm"
        />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute end-0 mt-2 w-44 rounded-lg border border-border bg-background shadow-lg z-50 overflow-hidden">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLocale(lang.code)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition text-start"
            >
              <img
                src={`https://flagcdn.com/20x15/${lang.flag}.png`}
                width={20}
                height={15}
                alt={lang.label}
                className="rounded-sm"
              />
              <span className="flex-1">{lang.label}</span>
              {locale === lang.code && <Check className="w-4 h-4 text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}