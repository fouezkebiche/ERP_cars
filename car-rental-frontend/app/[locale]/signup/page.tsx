"use client"
import type React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

interface Plan {
  id: string
  name: string
  description?: string
  priceMonthly: number
  maxVehicles: number
  maxUsers?: number
  features?: string[]
}

export default function SignupPage() {
  const t = useTranslations("signup")
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    company: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    plan: "professional",
    termsAccepted: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [plans, setPlans] = useState<Plan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  // Fetch available plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`${API_URL}/api/pricing/plans`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const availablePlans: Plan[] = json?.data?.plans ?? []
        // Sort by price ascending
        setPlans(availablePlans.sort((a, b) => a.priceMonthly - b.priceMonthly))
        
        // Set default plan to the first available plan if current default doesn't exist
        if (availablePlans.length > 0 && !availablePlans.find(p => p.id === formData.plan)) {
          setFormData(prev => ({ ...prev, plan: availablePlans[0].id }))
        }
      } catch (e) {
        console.error("Failed to load plans:", e)
      } finally {
        setPlansLoading(false)
      }
    }
    fetchPlans()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target instanceof HTMLInputElement) {
      const { name, type, checked, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
    } else if (e.target instanceof HTMLSelectElement) {
      const { name, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    setError("")

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      if (step === 1) {
        setStep(2)
        clearTimeout(timeoutId)
        setLoading(false)
        return
      }

      if (formData.password !== formData.confirmPassword) throw new Error(t("errorPasswordMatch"))
      if (!formData.termsAccepted) throw new Error(t("errorTerms"))
      if (formData.password.length < 6) throw new Error(t("errorPasswordLength"))

      const companyResponse = await fetch("http://localhost:5000/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.company,
          email: formData.email,
          phone: formData.phone,
          subscription_plan: formData.plan,
          subscription_status: "trial",
        }),
        signal: controller.signal,
      })

      if (!companyResponse.ok) {
        const companyData = await companyResponse.json()
        clearTimeout(timeoutId)
        throw new Error(companyData.message || "Failed to create company")
      }

      const companyData = await companyResponse.json()
      clearTimeout(timeoutId)

      let companyId = companyData?.data?.company?.id || companyData?.company?.id || companyData?.data?.id || companyData?.id

      if (!companyId) throw new Error("Server did not return a company ID")

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(companyId)) throw new Error(`Invalid company ID format: ${companyId}`)

      const registerResponse = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.company,
          email: formData.email,
          password: formData.password,
          company_id: companyId,
          role: "admin",
        }),
        signal: controller.signal,
      })

      const registerData = await registerResponse.json()
      if (!registerResponse.ok) throw new Error(registerData.message || "Registration failed")

      const loginResponse = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
        signal: controller.signal,
      })

      const loginData = await loginResponse.json()
      if (!loginResponse.ok) throw new Error(loginData.message || "Auto-login failed")

      localStorage.setItem("accessToken", loginData.data.accessToken)
      localStorage.setItem("refreshToken", loginData.data.refreshToken)

      router.push("/dashboard")
    } catch (err: any) {
      clearTimeout(timeoutId)
      setError(err.name === "AbortError" ? t("errorTimeout") : err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleButtonClick = (e: React.MouseEvent) => handleSubmit(e as any)

  const benefits = [
    { title: t("benefit1Title"), desc: t("benefit1Desc") },
    { title: t("benefit2Title"), desc: t("benefit2Desc") },
    { title: t("benefit3Title"), desc: t("benefit3Desc") },
    { title: t("benefit4Title"), desc: t("benefit4Desc") },
  ]

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-accent to-accent/80 flex-col justify-center items-center p-12 text-accent-foreground">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-8">Join CarManager</h1>
          <div className="space-y-6">
            {benefits.map((b, i) => (
              <div key={i}>
                <div className="text-2xl mb-2">✓</div>
                <h3 className="font-semibold mb-1">{b.title}</h3>
                <p className="text-accent-foreground/90">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12">
        <Link
          href={`/${locale}`}
          className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{t("back")}</span>
        </Link>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex gap-2 mb-6">
              <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-primary" : "bg-border"}`} />
              <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-primary" : "bg-border"}`} />
            </div>
            <h2 className="text-3xl font-bold mb-2">{step === 1 ? t("step1Title") : t("step2Title")}</h2>
            <p className="text-muted-foreground">{step === 1 ? t("step1Subtitle") : t("step2Subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium mb-2">{t("companyName")}</label>
                  <Input id="company" name="company" placeholder={t("companyPlaceholder")} value={formData.company} onChange={handleChange} required disabled={loading} />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">{t("phone")}</label>
                  <Input id="phone" name="phone" placeholder={t("phonePlaceholder")} value={formData.phone} onChange={handleChange} required disabled={loading} />
                </div>
                <div>
                  <label htmlFor="plan" className="block text-sm font-medium mb-2">{t("selectPlan")}</label>
                  {plansLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading plans...</span>
                    </div>
                  ) : plans.length === 0 ? (
                    <div className="text-muted-foreground">No plans available</div>
                  ) : (
                    <select id="plan" name="plan" value={formData.plan} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground" disabled={loading}>
                      {plans.map(plan => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name.charAt(0).toUpperCase() + plan.name.slice(1)} - {plan.priceMonthly.toLocaleString("fr-DZ")} DZD/mo ({plan.maxVehicles === -1 ? "Unlimited" : plan.maxVehicles} vehicles)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">{t("email")}</label>
                  <Input id="email" name="email" type="email" placeholder={t("emailPlaceholder")} value={formData.email} onChange={handleChange} required disabled={loading} />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">{t("password")}</label>
                  <Input id="password" name="password" type="password" placeholder={t("passwordPlaceholder")} value={formData.password} onChange={handleChange} required disabled={loading} />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">{t("confirmPassword")}</label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" placeholder={t("passwordPlaceholder")} value={formData.confirmPassword} onChange={handleChange} required disabled={loading} />
                </div>
                <label className="flex items-center gap-2 mt-4">
                  <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} className="rounded border-border" required disabled={loading} />
                  <span className="text-sm">{t("terms")}</span>
                </label>
              </>
            )}

            {error && <p className="text-destructive text-sm p-2 bg-destructive/10 rounded">{error}</p>}

            <button
              type="submit"
              onClick={handleButtonClick}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={loading}
            >
              {loading ? t("processing") : step === 1 ? <>{t("next")} <ArrowRight className="ml-2 w-4 h-4" /></> : t("createAccount")}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground mb-4">{t("haveAccount")}</p>
            <Link href={`/${locale}/login`}>
              <Button variant="outline" className="w-full bg-transparent">{t("signIn")}</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}