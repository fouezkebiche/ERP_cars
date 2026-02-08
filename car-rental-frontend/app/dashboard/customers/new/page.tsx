"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save } from "lucide-react"
import { customerApi, Customer } from "@/lib/customerApi"
import toast from "react-hot-toast"

export default function CustomerFormPage() {
  const params = useParams()
  const router = useRouter()
  const isEdit = !!params?.id
  const customerId = params?.id as string

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    customer_type: "individual" as "individual" | "corporate",
    full_name: "",
    company_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    date_of_birth: "",
    id_card_number: "",
    drivers_license_number: "",
    license_expiry_date: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: "",
    is_blacklisted: false,
  })

  // Fetch customer data for editing
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
          })
        } catch (error) {
          toast.error("Failed to load customer")
          router.push("/dashboard/customers")
        }
      }
      fetchCustomer()
    }
  }, [isEdit, customerId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Clean up empty strings
      const cleanData = Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => v !== "")
      )

      if (isEdit) {
        await customerApi.update(customerId, cleanData)
        toast.success("Customer updated successfully")
      } else {
        await customerApi.create(cleanData)
        toast.success("Customer created successfully")
      }
      router.push("/dashboard/customers")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save customer")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{isEdit ? "Edit Customer" : "New Customer"}</h1>
          <p className="text-muted-foreground">
            {isEdit ? "Update customer information" : "Add a new customer to your database"}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Type */}
        <div className="p-6 rounded-lg border border-border bg-card">
          <h3 className="font-semibold mb-4">Customer Type</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 p-4 rounded-lg border-2 cursor-pointer hover:bg-muted transition-colors">
              <input
                type="radio"
                name="customer_type"
                value="individual"
                checked={formData.customer_type === "individual"}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium">Individual</p>
                <p className="text-xs text-muted-foreground">Personal customer</p>
              </div>
            </label>
            <label className="flex items-center gap-2 p-4 rounded-lg border-2 cursor-pointer hover:bg-muted transition-colors">
              <input
                type="radio"
                name="customer_type"
                value="corporate"
                checked={formData.customer_type === "corporate"}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium">Corporate</p>
                <p className="text-xs text-muted-foreground">Business customer</p>
              </div>
            </label>
          </div>
        </div>

        {/* Basic Information */}
        <div className="p-6 rounded-lg border border-border bg-card">
          <h3 className="font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name <span className="text-destructive">*</span>
              </label>
              <Input
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                placeholder="John Doe"
              />
            </div>
            {formData.customer_type === "corporate" && (
              <div>
                <label className="block text-sm font-medium mb-2">Company Name</label>
                <Input
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Acme Corporation"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Phone <span className="text-destructive">*</span>
              </label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="+213 555 1234"
              />
            </div>
            {formData.customer_type === "individual" && (
              <div>
                <label className="block text-sm font-medium mb-2">Date of Birth</label>
                <Input
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">ID Card Number</label>
              <Input
                name="id_card_number"
                value={formData.id_card_number}
                onChange={handleChange}
                placeholder="123456789"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="p-6 rounded-lg border border-border bg-card">
          <h3 className="font-semibold mb-4">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Street Address</label>
              <Input
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main Street"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">City</label>
              <Input
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Algiers"
              />
            </div>
          </div>
        </div>

        {/* Driver's License */}
        <div className="p-6 rounded-lg border border-border bg-card">
          <h3 className="font-semibold mb-4">Driver's License</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">License Number</label>
              <Input
                name="drivers_license_number"
                value={formData.drivers_license_number}
                onChange={handleChange}
                placeholder="DL-123456"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Expiry Date</label>
              <Input
                name="license_expiry_date"
                type="date"
                value={formData.license_expiry_date}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="p-6 rounded-lg border border-border bg-card">
          <h3 className="font-semibold mb-4">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Contact Name</label>
              <Input
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleChange}
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contact Phone</label>
              <Input
                name="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={handleChange}
                placeholder="+213 555 5678"
              />
            </div>
          </div>
        </div>

        {/* Notes & Status */}
        <div className="p-6 rounded-lg border border-border bg-card">
          <h3 className="font-semibold mb-4">Additional Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 rounded-md border border-input bg-background"
                placeholder="Any additional notes about this customer..."
              />
            </div>
            {isEdit && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_blacklisted"
                  checked={formData.is_blacklisted}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Blacklist this customer</span>
              </label>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEdit ? "Update Customer" : "Create Customer"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}