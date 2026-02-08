"use client"
import type React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [error, setError] = useState("")

  const router = useRouter()
  const { login, user, loading } = useAuth()

  /**
   * ✅ Prevent auto-logout / redirect loop
   * Only redirect AFTER auth loading is finished
   */
  useEffect(() => {
    console.log("🔍 Login page auth check:", { user: !!user, loading })

    if (loading) return

    if (user) {
      console.log("✅ User already authenticated, redirecting to /dashboard")
      router.push("/dashboard")
    }
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    console.log("🚀 Submit triggered from FORM! Payload:", { email, password })
    setError("")
    setLoadingSubmit(true)

    try {
      console.log("📤 Calling AuthContext.login()...")
      await login(email, password)
      console.log("✅ Login success (AuthContext handled tokens)")
      // Redirect handled by useEffect
    } catch (err: any) {
      console.error("💥 Login error:", err)
      setError(err?.message || "Login failed")
    } finally {
      setLoadingSubmit(false)
    }
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    console.log("🖱️ Button clicked directly!")
    handleSubmit(e as any)
  }

  /**
   * ✅ Show loading screen while auth state initializes
   */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  /**
   * ✅ Prevent form flash when already logged in
   */
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary/80 flex-col justify-center items-center p-12 text-primary-foreground">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-primary-foreground/20 rounded-lg flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🚗</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">CarManager</h1>
          <p className="text-primary-foreground/90 mb-8">
            Manage your car rental business with confidence and ease.
          </p>
          <img
            src="/car-rental-illustration.jpg"
            alt="Login illustration"
            className="rounded-lg opacity-90 mb-6"
          />
          <p className="text-sm text-primary-foreground/70">
            Trusted by 150+ rental companies
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12">
        <Link
          href="/"
          className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </Link>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">
              Sign in to your CarManager account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loadingSubmit}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loadingSubmit}
                required
              />
            </div>

            {error && (
              <p className="text-destructive text-sm p-2 bg-destructive/10 rounded">
                {error}
              </p>
            )}

            <button
              type="submit"
              onClick={handleButtonClick}
              disabled={loadingSubmit}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingSubmit ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground mb-4">
              Don't have an account?
            </p>
            <Link href="/signup">
              <Button variant="outline" className="w-full bg-transparent">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
