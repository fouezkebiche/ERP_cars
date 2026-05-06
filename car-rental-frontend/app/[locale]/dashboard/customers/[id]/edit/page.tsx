// app/[locale]/dashboard/customers/[id]/edit/page.tsx (FULLY LOCALIZED)
"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save, Users, Building2 } from "lucide-react"
import { customerApi, Customer } from "@/lib/customerApi"
import toast from "react-hot-toast"

/* ─── design tokens ─────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"
const MUTED   = "rgba(255,255,255,0.4)"

/* ─── helpers ────────────────────────────────────────────────── */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "24px 26px", borderRadius: 14, background: SURFACE, border: `1px solid ${BORDER}` }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.015em", marginBottom: 18, color: "#fff" }}>{title}</h3>
      {children}
    </div>
  )
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
      {children}{required && <span style={{ color: "#EF4444", marginLeft: 3 }}>*</span>}
    </label>
  )
}

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e) }}
      onBlur={e => { setFocused(false); props.onBlur?.(e) }}
      style={{
        width: "100%", padding: "10px 13px", borderRadius: 9,
        border: `1px solid ${focused ? "rgba(34,197,94,0.5)" : BORDER}`,
        background: "rgba(255,255,255,0.03)", color: "#fff",
        fontFamily: FONT, fontSize: 14, outline: "none", transition: "border-color 0.2s",
        boxShadow: focused ? "0 0 0 3px rgba(34,197,94,0.08)" : "none",
        ...props.style,
      }}
    />
  )
}

function CheckRow({ name, checked, onChange, children }: { name: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; children: React.ReactNode }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 9,
      background: checked ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${checked ? "rgba(34,197,94,0.3)" : BORDER}`,
      cursor: "pointer", transition: "all 0.2s",
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
        background: checked ? GREEN : "transparent",
        border: `2px solid ${checked ? GREEN : BORDER}`,
        display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
      }}>
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <input type="checkbox" name={name} checked={checked} onChange={onChange} style={{ display: "none" }} />
      <span style={{ fontSize: 13, color: checked ? "#fff" : MUTED, transition: "color 0.15s" }}>{children}</span>
    </label>
  )
}

export default function CustomerFormPage() {
  const t = useTranslations("customers")
  const params = useParams()
  const router = useRouter()
  const isEdit = !!params?.id
  const customerId = params?.id as string

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    customer_type: "individual" as "individual" | "corporate",
    full_name: "", company_name: "", email: "", phone: "",
    address: "", city: "", date_of_birth: "", id_card_number: "",
    drivers_license_number: "", license_expiry_date: "",
    emergency_contact_name: "", emergency_contact_phone: "",
    notes: "", is_blacklisted: false, apply_tier_discount: true,
  })

  useEffect(() => {
    if (isEdit) {
      const fetchCustomer = async () => {
        try {
          const response = await customerApi.getById(customerId)
          const customer = response.data.customer
          setFormData({
            customer_type: customer.customer_type,
            full_name: customer.full_name,
            company_name: customer.company_name || "",
            email: customer.email || "",
            phone: customer.phone,
            address: customer.address || "",
            city: customer.city || "",
            date_of_birth: customer.date_of_birth || "",
            id_card_number: customer.id_card_number || "",
            drivers_license_number: customer.drivers_license_number || "",
            license_expiry_date: customer.license_expiry_date || "",
            emergency_contact_name: customer.emergency_contact_name || "",
            emergency_contact_phone: customer.emergency_contact_phone || "",
            notes: customer.notes || "",
            is_blacklisted: customer.is_blacklisted,
            apply_tier_discount: customer.apply_tier_discount ?? true,
          })
        } catch (error) {
          toast.error(t("failedToLoad"))
          router.push("/dashboard/customers")
        }
      }
      fetchCustomer()
    }
  }, [isEdit, customerId, router, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const cleanData = Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => v !== "" || typeof v === "boolean")
      ) as Record<string, unknown>
      if (isEdit) {
        await customerApi.update(customerId, cleanData)
        toast.success(t("customerUpdated"))
      } else {
        await customerApi.create(cleanData)
        toast.success(t("customerCreated"))
      }
      router.push("/dashboard/customers")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failedToCreate"))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value }))
  }

  return (
    <div style={{ fontFamily: FONT, color: "#fff", minHeight: "100vh", padding: "32px 0", maxWidth: 860, margin: "0 auto" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
        <button onClick={() => router.back()}
          style={{
            width: 36, height: 36, borderRadius: 10, border: `1px solid ${BORDER}`,
            background: SURFACE, color: MUTED, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)"; e.currentTarget.style.color = "#fff" }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, letterSpacing: "-0.035em", marginBottom: 4 }}>
            {isEdit ? t("edit") : t("newCustomer")}
          </h1>
          <p style={{ fontSize: 13, color: MUTED }}>
            {isEdit ? "Update customer information" : "Add a new customer to your database"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Customer Type ── */}
        <SectionCard title={t("customerType")}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {(["individual", "corporate"] as const).map(type => (
              <label key={type} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
                borderRadius: 11, cursor: "pointer",
                background: formData.customer_type === type ? "rgba(34,197,94,0.07)" : "rgba(255,255,255,0.02)",
                border: `2px solid ${formData.customer_type === type ? "rgba(34,197,94,0.4)" : BORDER}`,
                transition: "all 0.2s",
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${formData.customer_type === type ? GREEN : BORDER}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {formData.customer_type === type && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN }} />
                  )}
                </div>
                <input type="radio" name="customer_type" value={type}
                  checked={formData.customer_type === type} onChange={handleChange} style={{ display: "none" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {type === "individual" ? <Users size={16} style={{ color: "#38BDF8" }} /> : <Building2 size={16} style={{ color: "#818CF8" }} />}
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{t(type)}</p>
                    <p style={{ fontSize: 11, color: MUTED }}>{type === "individual" ? "Personal customer" : "Business customer"}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </SectionCard>

        {/* ── Personal Info ── */}
        <SectionCard title={t("personalInfo")}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <FieldLabel required>{t("fullName")}</FieldLabel>
              <StyledInput name="full_name" value={formData.full_name} onChange={handleChange} required placeholder="John Doe" />
            </div>
            {formData.customer_type === "corporate" && (
              <div>
                <FieldLabel>{t("companyName")}</FieldLabel>
                <StyledInput name="company_name" value={formData.company_name} onChange={handleChange} placeholder="Acme Corporation" />
              </div>
            )}
            <div>
              <FieldLabel>{t("email")}</FieldLabel>
              <StyledInput name="email" type="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" />
            </div>
            <div>
              <FieldLabel required>{t("phone")}</FieldLabel>
              <StyledInput name="phone" value={formData.phone} onChange={handleChange} required placeholder="+213 555 1234" />
            </div>
            {formData.customer_type === "individual" && (
              <div>
                <FieldLabel>{t("dateOfBirth")}</FieldLabel>
                <StyledInput name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} />
              </div>
            )}
            <div>
              <FieldLabel>{t("idCardNumber")}</FieldLabel>
              <StyledInput name="id_card_number" value={formData.id_card_number} onChange={handleChange} placeholder="123456789" />
            </div>
          </div>
        </SectionCard>

        {/* ── Address ── */}
        <SectionCard title={t("address")}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldLabel>Street Address</FieldLabel>
              <StyledInput name="address" value={formData.address} onChange={handleChange} placeholder="123 Main Street" />
            </div>
            <div>
              <FieldLabel>{t("city")}</FieldLabel>
              <StyledInput name="city" value={formData.city} onChange={handleChange} placeholder="Algiers" />
            </div>
          </div>
        </SectionCard>

        {/* ── Driver's License ── */}
        <SectionCard title={t("driversLicense")}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <FieldLabel>{t("licenseNumber")}</FieldLabel>
              <StyledInput name="drivers_license_number" value={formData.drivers_license_number} onChange={handleChange} placeholder="DL-123456" />
            </div>
            <div>
              <FieldLabel>{t("licenseExpiry")}</FieldLabel>
              <StyledInput name="license_expiry_date" type="date" value={formData.license_expiry_date} onChange={handleChange} />
            </div>
          </div>
        </SectionCard>

        {/* ── Emergency Contact ── */}
        <SectionCard title={t("emergencyContact")}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <FieldLabel>{t("emergencyContactName")}</FieldLabel>
              <StyledInput name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} placeholder="Jane Doe" />
            </div>
            <div>
              <FieldLabel>{t("emergencyContactPhone")}</FieldLabel>
              <StyledInput name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange} placeholder="+213 555 5678" />
            </div>
          </div>
        </SectionCard>

        {/* ── Notes & Status ── */}
        <SectionCard title="Additional Information">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <FieldLabel>Notes</FieldLabel>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows={4}
                placeholder="Any additional notes about this customer..."
                style={{
                  width: "100%", padding: "11px 13px", borderRadius: 9,
                  border: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.03)",
                  color: "#fff", fontFamily: FONT, fontSize: 13, resize: "vertical",
                  outline: "none", transition: "border-color 0.2s", lineHeight: 1.6,
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(34,197,94,0.4)")}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />
            </div>
            <CheckRow name="apply_tier_discount" checked={formData.apply_tier_discount} onChange={handleChange}>
              {t("applyTierDiscount")}
            </CheckRow>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: -4, paddingLeft: 42 }}>
              {t("tierDiscountDescription")}
            </p>
            {isEdit && (
              <CheckRow name="is_blacklisted" checked={formData.is_blacklisted} onChange={handleChange}>
                {t("blacklistedLabel")}
              </CheckRow>
            )}
          </div>
        </SectionCard>

        {/* ── Actions ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" onClick={() => router.back()}
            style={{
              fontFamily: FONT, fontSize: 14, fontWeight: 500, padding: "11px 22px", borderRadius: 10,
              background: "transparent", color: MUTED, border: `1px solid ${BORDER}`,
              cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)" }}
            onMouseLeave={e => { e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = BORDER }}
          >
            {t("cancel")}
          </button>
          <button type="submit" disabled={loading}
            style={{
              fontFamily: FONT, fontSize: 14, fontWeight: 600, padding: "11px 24px", borderRadius: 10,
              border: "none", cursor: loading ? "not-allowed" : "pointer",
              background: loading ? "rgba(34,197,94,0.4)" : GREEN, color: "#fff",
              display: "inline-flex", alignItems: "center", gap: 8,
              boxShadow: "0 0 20px rgba(34,197,94,0.2)", transition: "all 0.2s",
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#16A34A" }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = GREEN }}
          >
            {loading ? (
              <><div style={{ width: 15, height: 15, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite" }} />{t("saving")}</>
            ) : (
              <><Save size={15} />{t("saveCustomer")}</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}