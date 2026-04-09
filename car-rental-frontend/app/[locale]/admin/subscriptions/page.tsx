"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/dashboard/data-table"
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

interface Plan {
  id: string
  name: string
  priceMonthly: number
  maxVehicles: number
  maxUsers?: number
  features?: string[]
  description?: string
}

interface BillingCycle {
  id: string
  company: string
  plan: string
  amount: string
  nextBilling: string
  status: string
}

export default function AdminSubscriptionsPage() {
  const [activeTab, setActiveTab] = useState("plans")
  const [plans, setPlans] = useState<Plan[]>([])
  const [billingCycles, setBillingCycles] = useState<BillingCycle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch plans from public endpoint
        const plansRes = await fetch(`${API_URL}/api/pricing/plans`)
        if (plansRes.ok) {
          const plansData = await plansRes.json()
          setPlans(plansData.data?.plans || [])
        }

        // TODO: Fetch billing cycles from admin endpoint when implemented
        // For now, use mock data
        setBillingCycles([
          {
            id: "1",
            company: "Elite Rentals",
            plan: "Professional",
            amount: "15,000 DZD",
            nextBilling: "2025-02-04",
            status: "active",
          },
          { 
            id: "2", 
            company: "Speed Motors", 
            plan: "Basic", 
            amount: "5,000 DZD", 
            nextBilling: "2025-02-20", 
            status: "active" 
          },
          {
            id: "3",
            company: "Premium Fleet",
            plan: "Enterprise",
            amount: "45,000 DZD",
            nextBilling: "2025-01-15",
            status: "active",
          },
        ])
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Subscriptions</h1>
          <p className="text-muted-foreground">Manage pricing plans and billing</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        <button
          onClick={() => setActiveTab("plans")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "plans"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Pricing Plans
        </button>
        <button
          onClick={() => setActiveTab("billing")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "billing"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Billing Cycles
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "plans" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div key={plan.id} className="p-6 rounded-lg border border-border bg-card">
                  <h3 className="text-xl font-bold mb-2 capitalize">{plan.name}</h3>
                  <p className="text-2xl font-bold text-accent mb-4">
                    {plan.priceMonthly === 0 ? 'Free' : `${plan.priceMonthly.toLocaleString('fr-DZ')} DZD/month`}
                  </p>
                  <div className="space-y-2 mb-6 text-sm">
                    <p>
                      <span className="font-semibold">Vehicles:</span> {plan.maxVehicles === -1 ? 'Unlimited' : plan.maxVehicles}
                    </p>
                    <p>
                      <span className="font-semibold">Users:</span> {plan.maxUsers === -1 ? 'Unlimited' : (plan.maxUsers || 1)}
                    </p>
                    <p>
                      <span className="font-semibold">Features:</span> {plan.features?.join(', ') || 'Standard features'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "billing" && (
        <DataTable
          columns={[
            { key: "company", label: "Company", sortable: true },
            { key: "plan", label: "Plan", sortable: true },
            { key: "amount", label: "Monthly Amount" },
            {
              key: "nextBilling",
              label: "Next Billing Date",
              render: (value) => new Date(value).toLocaleDateString(),
              sortable: true,
            },
            {
              key: "status",
              label: "Status",
              render: (status) => (
                <span className="px-2 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                  {status === "active" ? "Active" : "Inactive"}
                </span>
              ),
            },
            {
              key: "id",
              label: "Actions",
              render: () => (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </div>
              ),
            },
          ]}
          data={billingCycles}
        />
      )}
    </div>
  )
}
