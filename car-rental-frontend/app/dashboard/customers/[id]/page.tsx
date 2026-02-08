"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { CustomerTierBadge } from "@/components/dashboard/CustomerTierBadge"
import {
  ArrowLeft,
  Edit2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  AlertTriangle,
  User,
  Building2,
  FileText,
} from "lucide-react"
import { customerApi, Customer, CustomerHistory } from "@/lib/customerApi"
import { customerTierApi } from "@/lib/customerTierApi"
import toast from "react-hot-toast"

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [history, setHistory] = useState<CustomerHistory | null>(null)
  const [tierInfo, setTierInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"details" | "history">("details")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [customerRes, historyRes] = await Promise.all([
          customerApi.getById(customerId),
          customerApi.getHistory(customerId),
        ])

        setCustomer(customerRes.data.customer)
        setHistory(historyRes.data)
        
        // Fetch tier info
        try {
          const tierRes = await customerTierApi.getTierInfo(customerId)
          setTierInfo(tierRes.data)
        } catch (err) {
          console.error('Failed to fetch tier:', err)
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load customer")
        router.push("/dashboard/customers")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [customerId, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!customer) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{customer.full_name}</h1>
            <p className="text-muted-foreground">
              {customer.customer_type === "corporate" ? "Corporate Customer" : "Individual Customer"}
            </p>
          </div>
        </div>
        <Button onClick={() => router.push(`/dashboard/customers/${customerId}/edit`)}>
          <Edit2 className="w-4 h-4 mr-2" />
          Edit Customer
        </Button>
      </div>

      {/* Status Alert */}
      {customer.is_blacklisted && (
        <div className="p-4 rounded-lg border-l-4 border-l-destructive bg-destructive/10">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <p className="font-semibold text-sm">This customer is blacklisted</p>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Cannot create new contracts for this customer
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-4">
          <button
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === "details"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("details")}
          >
            Customer Details
          </button>
          <button
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === "history"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("history")}
          >
            Rental History ({history?.stats.total_contracts || 0})
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "details" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Loyalty Program */}
            {tierInfo && (
              <div className="p-6 rounded-lg border border-border bg-card">
                <h3 className="font-semibold mb-4">Loyalty Program</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Apply tier discount:</span>
                    <span className={`text-sm font-semibold ${customer.apply_tier_discount !== false ? "text-green-600" : "text-muted-foreground"}`}>
                      {customer.apply_tier_discount !== false ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current Tier:</span>
                    <CustomerTierBadge tier={tierInfo.tier} tierName={tierInfo.name} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Overage Rate:</span>
                    <span className="font-semibold">{tierInfo.overage_rate} DZD/km</span>
                  </div>
                  {tierInfo.km_bonus > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">KM Bonus:</span>
                      <span className="font-semibold text-green-600">+{tierInfo.km_bonus} km/day</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="font-semibold">{tierInfo.discount_percentage}% on overages</span>
                  </div>
                  {tierInfo.progress && !tierInfo.progress.is_max_tier && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {tierInfo.progress.rentals_to_next_tier} more rental{tierInfo.progress.rentals_to_next_tier > 1 ? 's' : ''} to reach {tierInfo.progress.next_tier_name}!
                      </p>
                      <div className="w-full h-2 bg-blue-200 rounded-full mt-2">
                        <div 
                          className="h-full bg-blue-600 rounded-full" 
                          style={{ width: `${tierInfo.progress.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-semibold mb-2">Benefits:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {tierInfo.benefits.map((benefit: string, i: number) => (
                        <li key={i}>• {benefit}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Contact Information
              </h3>
              <div className="space-y-4">
                {customer.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{customer.email}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{customer.phone}</p>
                  </div>
                </div>
                {customer.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{customer.address}</p>
                      {customer.city && (
                        <p className="text-sm text-muted-foreground">{customer.city}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Corporate Info */}
            {customer.customer_type === "corporate" && customer.company_name && (
              <div className="p-6 rounded-lg border border-border bg-card">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Corporate Information
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Company Name</p>
                    <p className="font-medium">{customer.company_name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* License Information */}
            {customer.drivers_license_number && (
              <div className="p-6 rounded-lg border border-border bg-card">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  License Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">License Number</p>
                    <p className="font-medium">{customer.drivers_license_number}</p>
                  </div>
                  {customer.license_expiry_date && (
                    <div>
                      <p className="text-sm text-muted-foreground">Expiry Date</p>
                      <p className="font-medium">
                        {new Date(customer.license_expiry_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Emergency Contact */}
            {customer.emergency_contact_name && (
              <div className="p-6 rounded-lg border border-border bg-card">
                <h3 className="font-semibold mb-4">Emergency Contact</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{customer.emergency_contact_name}</p>
                  </div>
                  {customer.emergency_contact_phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{customer.emergency_contact_phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {customer.notes && (
              <div className="p-6 rounded-lg border border-border bg-card">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Notes
                </h3>
                <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold mb-4">Customer Statistics</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Rentals</p>
                  <p className="text-2xl font-bold">{customer.total_rentals}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lifetime Value</p>
                  <p className="text-2xl font-bold">
                    {parseFloat(customer.lifetime_value).toLocaleString()} DZD
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer Since</p>
                  <p className="font-medium">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // History Tab
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-1">Total Contracts</p>
              <p className="text-2xl font-bold">{history?.stats.total_contracts || 0}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-1">Active</p>
              <p className="text-2xl font-bold text-green-500">
                {history?.stats.active_contracts || 0}
              </p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-1">Completed</p>
              <p className="text-2xl font-bold">{history?.stats.completed_contracts || 0}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
              <p className="text-2xl font-bold">
                {(history?.stats.total_spent || 0).toLocaleString()} DZD
              </p>
            </div>
          </div>

          {/* Contracts Table */}
          {history && history.contracts.length > 0 ? (
            <DataTable
              columns={[
                {
                  key: "contract_number",
                  label: "Contract #",
                  sortable: true,
                },
                {
                  key: "vehicle",
                  label: "Vehicle",
                  render: (vehicle) =>
                    `${vehicle.brand} ${vehicle.model} (${vehicle.registration_number})`,
                },
                {
                  key: "start_date",
                  label: "Period",
                  render: (value, row) =>
                    `${new Date(value).toLocaleDateString()} - ${new Date(
                      row.end_date
                    ).toLocaleDateString()}`,
                },
                {
                  key: "total_amount",
                  label: "Amount",
                  render: (value) => `${parseFloat(value).toLocaleString()} DZD`,
                  sortable: true,
                },
                {
                  key: "status",
                  label: "Status",
                  render: (status) => <StatusBadge status={status} />,
                },
              ]}
              data={history.contracts}
            />
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No rental history yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}