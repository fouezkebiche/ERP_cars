"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ArrowRight } from "lucide-react"

export default function SignupPage() {
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
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target instanceof HTMLInputElement) {
      const { name, type, checked, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    } else if (e.target instanceof HTMLSelectElement) {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🚀 Signup submit! Step:', step, 'Data:', formData)
    setLoading(true)
    setError("")

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      if (step === 1) {
        // Advance to step 2 (no API call)
        setStep(2)
        clearTimeout(timeoutId)
        setLoading(false)
        return
      }

      // Step 2: Validate
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match")
      }
      if (!formData.termsAccepted) {
        throw new Error("You must accept the terms and conditions")
      }
      if (formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters")
      }

      console.log('📤 Creating company first...')

      // Step 1: Create Company
      const companyResponse = await fetch("http://localhost:5000/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.company,
          email: formData.email,
          phone: formData.phone,
          subscription_plan: formData.plan,
          subscription_status: 'trial',
        }),
        signal: controller.signal,
      })

      console.log('🏢 Company response status:', companyResponse.status)

      if (!companyResponse.ok) {
        const companyData = await companyResponse.json()
        clearTimeout(timeoutId)
        const msg = companyData.message || "Failed to create company"
        throw new Error(msg)
      }

      const companyData = await companyResponse.json()
      clearTimeout(timeoutId)
      
      console.log('🏢 Company response (full):', JSON.stringify(companyData, null, 2))
      console.log('🏢 typeof companyData:', typeof companyData)
      console.log('🏢 companyData keys:', Object.keys(companyData))
      console.log('🏢 data object:', companyData.data)
      console.log('🏢 data keys:', companyData.data ? Object.keys(companyData.data) : 'NO DATA')
      console.log('🏢 data.company object:', companyData.data?.company)
      console.log('🏢 data.company keys:', companyData.data?.company ? Object.keys(companyData.data.company) : 'NO COMPANY')
      console.log('🏢 data.company.id:', companyData.data?.company?.id)

      // Try multiple extraction paths as fallback
      let companyId = companyData?.data?.company?.id 
        || companyData?.company?.id 
        || companyData?.data?.id 
        || companyData?.id

      console.log('🏢 Extracted company_id:', companyId, '(type:', typeof companyId, ')')

      // Validate the ID exists and is a string (UUID format)
      if (!companyId) {
        console.error('❌ No company ID found in response:', companyData)
        throw new Error('Server did not return a company ID')
      }

      if (typeof companyId !== 'string' || companyId.trim() === '') {
        console.error('❌ Invalid company ID type:', typeof companyId, 'value:', companyId)
        throw new Error('Invalid company ID format received from server')
      }

      // UUID validation regex
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(companyId)) {
        console.error('❌ Company ID is not a valid UUID:', companyId)
        throw new Error(`Invalid company ID format: ${companyId}`)
      }

      console.log('✅ Valid company_id confirmed:', companyId)
      console.log('👤 Registering user with company_id:', companyId)

      // Step 2: Register User
      const registerPayload = {
        full_name: formData.company,
        email: formData.email,
        password: formData.password,
        company_id: companyId,
        role: "owner",
      }

      console.log('👤 Register payload:', JSON.stringify(registerPayload, null, 2))

      const registerResponse = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerPayload),
        signal: controller.signal,
      })

      const registerData = await registerResponse.json()
      console.log('👤 Register response:', registerData)

      if (!registerResponse.ok) {
        const msg = registerData.message || "Registration failed"
        console.error('👤 Registration failed:', registerData)
        if (registerData.details) {
          console.error('👤 Validation details:', registerData.details)
        }
        throw new Error(msg)
      }

      // Auto-login after signup
      console.log('🔐 Auto-logging in...')

      const loginResponse = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
        signal: controller.signal,
      })

      const loginData = await loginResponse.json()
      console.log('🔐 Login response:', loginData)

      if (!loginResponse.ok) {
        const msg = loginData.message || "Auto-login failed"
        throw new Error(msg)
      }

      // Save tokens
      localStorage.setItem("accessToken", loginData.data.accessToken)
      localStorage.setItem("refreshToken", loginData.data.refreshToken)

      console.log('✅ Signup success! Redirecting...')

      router.push("/dashboard")
    } catch (err: any) {
      clearTimeout(timeoutId)
      console.error('💥 Signup error:', err)
      const errorMsg = err.name === 'AbortError' ? 'Request timed out' : err.message
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    console.log('🖱️ Signup button clicked!')
    handleSubmit(e as any)
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-accent to-accent/80 flex-col justify-center items-center p-12 text-accent-foreground">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-8">Join CarManager</h1>
          <div className="space-y-6">
            <div>
              <div className="text-2xl mb-2">✓</div>
              <h3 className="font-semibold mb-1">Full Fleet Control</h3>
              <p className="text-accent-foreground/90">Manage all your vehicles from one dashboard</p>
            </div>
            <div>
              <div className="text-2xl mb-2">✓</div>
              <h3 className="font-semibold mb-1">Automated Contracts</h3>
              <p className="text-accent-foreground/90">Generate and manage digital contracts instantly</p>
            </div>
            <div>
              <div className="text-2xl mb-2">✓</div>
              <h3 className="font-semibold mb-1">Real-time Analytics</h3>
              <p className="text-accent-foreground/90">Track revenue and utilization metrics instantly</p>
            </div>
            <div>
              <div className="text-2xl mb-2">✓</div>
              <h3 className="font-semibold mb-1">Expert Support</h3>
              <p className="text-accent-foreground/90">Get help from our dedicated support team</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
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
            <div className="flex gap-2 mb-6">
              <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-primary" : "bg-border"}`} />
              <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-primary" : "bg-border"}`} />
            </div>
            <h2 className="text-3xl font-bold mb-2">{step === 1 ? "Company Information" : "Account Details"}</h2>
            <p className="text-muted-foreground">
              {step === 1 ? "Tell us about your rental business" : "Create your account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium mb-2">
                    Company Name
                  </label>
                  <Input
                    id="company"
                    name="company"
                    placeholder="Your Rental Company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+213 XX XXX XXXX"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="plan" className="block text-sm font-medium mb-2">
                    Select Plan
                  </label>
                  <select
                    id="plan"
                    name="plan"
                    value={formData.plan}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    disabled={loading}
                  >
                    <option value="basic">Basic - 5,000 DZD/month</option>
                    <option value="professional">Professional - 15,000 DZD/month</option>
                    <option value="enterprise">Enterprise - Custom pricing</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full"
                    required
                    disabled={loading}
                  />
                </div>

                <label className="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                    className="rounded border-border"
                    required
                    disabled={loading}
                  />
                  <span className="text-sm">I agree to the Terms & Conditions</span>
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
              {loading ? (
                "Processing..."
              ) : step === 1 ? (
                <>
                  Next <ArrowRight className="ml-2 w-4 h-4" />
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground mb-4">Already have an account?</p>
            <Link href="/login">
              <Button variant="outline" className="w-full bg-transparent">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}