"use client"
import type React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useTranslations } from "next-intl"

export default function LoginPage() {
  const t = useTranslations("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
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

  const handleButtonClick = (e: React.MouseEvent) => {
    handleSubmit(e as any)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t("checking")}</p>
        </div>
      </div>
    )
  }

  if (user) return null

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary/80 flex-col justify-center items-center p-12 text-primary-foreground">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-primary-foreground/20 rounded-lg flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🚗</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">CarManager</h1>
          <p className="text-primary-foreground/90 mb-8">{t("tagline")}</p>
          <img src="/car-rental-illustration.jpg" alt="Login illustration" className="rounded-lg opacity-90 mb-6" />
          <p className="text-sm text-primary-foreground/70">{t("trusted")}</p>
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
            <h2 className="text-3xl font-bold mb-2">{t("welcome")}</h2>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">{t("email")}</label>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loadingSubmit}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">{t("password")}</label>
              <Input
                id="password"
                type="password"
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loadingSubmit}
                required
              />
            </div>

            {error && (
              <p className="text-destructive text-sm p-2 bg-destructive/10 rounded">{error}</p>
            )}

            <button
              type="submit"
              onClick={handleButtonClick}
              disabled={loadingSubmit}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingSubmit ? t("signingIn") : t("signIn")}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground mb-4">{t("noAccount")}</p>
            <Link href={`/${locale}/signup`}>
              <Button variant="outline" className="w-full bg-transparent">{t("createAccount")}</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}