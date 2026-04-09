// app/[locale]/dashboard/contracts/page.tsx (FULLY LOCALIZED)
"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Plus, Search, Eye, Edit2, FileText, CheckCircle, XCircle, Calendar, AlertCircle } from "lucide-react"
import { contractApi, Contract } from "@/lib/contractApi"
import { useNotifications } from "@/hooks/useNotifications"
import toast from "react-hot-toast"

export default function ContractsPage() {
  const t = useTranslations("contracts")
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total_contracts: 0,
    by_status: { active: 0, completed: 0, cancelled: 0 },
    total_revenue: 0,
    recent_contracts_30d: 0,
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
  })
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed" | "cancelled">("all")

  // Fetch KM alerts for all contracts (for counts)
  const { data: kmAlertsData } = useNotifications({ 
    type: 'km_limit_*', 
    limit: 100, 
    unread: true 
  })
 
  // Build map of contract_id -> alert count
  const alertsByContract = kmAlertsData?.notifications.reduce((acc: { [key: string]: number }, notif) => {
    const cid = notif.data?.contract_id
    if (cid) acc[cid] = (acc[cid] || 0) + 1
    return acc
  }, {}) || {}

  // Fetch contracts
  const fetchContracts = async () => {
    try {
      setLoading(true)
      const response = await contractApi.list({
        search: searchTerm || undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
        page: pagination.page,
        limit: pagination.limit,
      })

      setContracts(response.data.contracts)
      setPagination({
        ...pagination,
        total: response.meta.pagination.total,
        total_pages: response.meta.pagination.total_pages,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failedToLoad"))
    } finally {
      setLoading(false)
    }
  }

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await contractApi.getStats()
      setStats(response.data.stats)
    } catch (error) {
      console.error("Failed to load stats:", error)
    }
  }

  // Complete contract
  const handleComplete = async (id: string) => {
    router.push(`/dashboard/contracts/${id}/complete`)
  }

  // Cancel contract
  const handleCancel = async (id: string, contractNumber: string) => {
    if (!confirm(t("deleteConfirm", { contractNumber }))) {
      return
    }

    try {
      await contractApi.cancel(id)
      toast.success(t("cancelSuccess"))
      fetchContracts()
      fetchStats()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("cancelFailed"))
    }
  }

  // Extend contract
  const handleExtend = async (id: string) => {
    router.push(`/dashboard/contracts/${id}/extend`)
  }

  useEffect(() => {
    fetchContracts()
    fetchStats()
  }, [searchTerm, filterStatus, pagination.page])

  const generateContractHTML = (contract: Contract) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Contract ${contract.contract_number}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.6;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .section {
            margin: 20px 0;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2563eb;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }
          .info-item {
            padding: 8px;
          }
          .info-label {
            font-weight: bold;
            color: #666;
          }
          .info-value {
            color: #000;
          }
          .financial-summary {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
          }
          .total-amount {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            text-align: right;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #333;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          @media print {
            body { margin: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>RENTAL CONTRACT</h1>
          <p style="font-size: 20px; margin: 10px 0;">${contract.contract_number}</p>
          <p style="margin: 0; color: #666;">Status: ${contract.status.toUpperCase()}</p>
        </div>
        <div class="section">
          <div class="section-title">${t("customerInformation")}</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">${t("name")}:</div>
              <div class="info-value">${contract.customer?.full_name || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">${t("phone")}:</div>
              <div class="info-value">${contract.customer?.phone || 'N/A'}</div>
            </div>
            ${contract.customer?.email ? `
            <div class="info-item">
              <div class="info-label">${t("email")}:</div>
              <div class="info-value">${contract.customer.email}</div>
            </div>
            ` : ''}
            <div class="info-item">
              <div class="info-label">${t("customerType")}:</div>
              <div class="info-value">${contract.customer?.customer_type || 'N/A'}</div>
            </div>
          </div>
        </div>
        <div class="section">
          <div class="section-title">${t("vehicleInformation")}</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">${t("vehicle")}:</div>
              <div class="info-value">${contract.vehicle?.brand} ${contract.vehicle?.model} (${contract.vehicle?.year})</div>
            </div>
            <div class="info-item">
              <div class="info-label">${t("registrationNumber")}:</div>
              <div class="info-value">${contract.vehicle?.registration_number || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">${t("startMileage")}:</div>
              <div class="info-value">${contract.start_mileage?.toLocaleString() || 'N/A'} km</div>
            </div>
            ${contract.end_mileage ? `
            <div class="info-item">
              <div class="info-label">${t("endMileage")}:</div>
              <div class="info-value">${contract.end_mileage.toLocaleString()} km</div>
            </div>
            ` : ''}
          </div>
        </div>
        <div class="section">
          <div class="section-title">${t("rentalPeriod")}</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">${t("startDate")}:</div>
              <div class="info-value">${new Date(contract.start_date).toLocaleDateString()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">${t("endDate")}:</div>
              <div class="info-value">${new Date(contract.end_date).toLocaleDateString()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">${t("totalDays")}:</div>
              <div class="info-value">${contract.total_days}</div>
            </div>
            ${contract.actual_return_date ? `
            <div class="info-item">
              <div class="info-label">${t("actualReturn")}:</div>
              <div class="info-value">${new Date(contract.actual_return_date).toLocaleDateString()}</div>
            </div>
            ` : ''}
          </div>
        </div>
        ${contract.extras && Object.values(contract.extras).some(v => v) ? `
        <div class="section">
          <div class="section-title">${t("additionalServices")}</div>
          <ul>
            ${contract.extras.gps ? `<li>${t("gpsNavigation")}</li>` : ''}
            ${contract.extras.child_seat ? `<li>${t("childSeat")}</li>` : ''}
            ${contract.extras.additional_driver ? `<li>${t("additionalDriver")}</li>` : ''}
            ${contract.extras.insurance_premium ? `<li>${t("premiumInsurance")}</li>` : ''}
          </ul>
        </div>
        ` : ''}
        <div class="financial-summary">
          <div class="section-title">${t("financialSummary")}</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">${t("dailyRate")}:</div>
              <div class="info-value">${parseFloat(contract.daily_rate).toLocaleString()} DZD</div>
            </div>
            <div class="info-item">
              <div class="info-label">${t("baseAmount")}:</div>
              <div class="info-value">${parseFloat(contract.base_amount).toLocaleString()} DZD</div>
            </div>
            ${parseFloat(contract.additional_charges) > 0 ? `
            <div class="info-item">
              <div class="info-label">${t("additionalCharges")}:</div>
              <div class="info-value">${parseFloat(contract.additional_charges).toLocaleString()} DZD</div>
            </div>
            ` : ''}
            ${parseFloat(contract.discount_amount) > 0 ? `
            <div class="info-item">
              <div class="info-label">${t("discount")}:</div>
              <div class="info-value" style="color: green;">-${parseFloat(contract.discount_amount).toLocaleString()} DZD</div>
            </div>
            ` : ''}
            <div class="info-item">
              <div class="info-label">${t("tax")}:</div>
              <div class="info-value">${parseFloat(contract.tax_amount).toLocaleString()} DZD</div>
            </div>
            <div class="info-item">
              <div class="info-label">${t("deposit")}:</div>
              <div class="info-value">${parseFloat(contract.deposit_amount).toLocaleString()} DZD</div>
            </div>
          </div>
          <div class="total-amount">
            ${t("totalAmount")}: ${parseFloat(contract.total_amount).toLocaleString()} DZD
          </div>
        </div>
        ${contract.notes ? `
        <div class="section">
          <div class="section-title">${t("notes")}</div>
          <p>${contract.notes.replace(/\n/g, '<br>')}</p>
        </div>
        ` : ''}
        <div class="footer">
          <p>${t("generatedOn")} ${new Date().toLocaleString()}</p>
          <p>${t("contractNumber")}: ${contract.contract_number}</p>
          ${contract.creator ? `<p>${t("createdBy")}: ${contract.creator.full_name}</p>` : ''}
        </div>
      </body>
      </html>
    `
  }

  const handleViewPDF = (contract: Contract) => {
    const viewWindow = window.open('', '_blank')
    if (!viewWindow) {
      toast.error(t("allowPopups"))
      return
    }
    const contractHTML = generateContractHTML(contract)
    viewWindow.document.write(contractHTML)
    viewWindow.document.close()
    viewWindow.focus()
    toast.success(t("pdfOpened"))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90"
          onClick={() => router.push("/dashboard/contracts/new")}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("newContract")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground mb-1">{t("totalContracts")}</p>
          <p className="text-2xl font-bold">{stats.total_contracts}</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground mb-1">{t("active")}</p>
          <p className="text-2xl font-bold text-green-500">{stats.by_status.active}</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground mb-1">{t("completed")}</p>
          <p className="text-2xl font-bold">{stats.by_status.completed}</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground mb-1">{t("totalRevenue")}</p>
          <p className="text-2xl font-bold">
            {(stats.total_revenue / 1000000).toFixed(2)}M DZD
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            onClick={() => setFilterStatus("all")}
          >
            {t("all")}
          </Button>
          <Button
            variant={filterStatus === "active" ? "default" : "outline"}
            onClick={() => setFilterStatus("active")}
          >
            {t("active")}
          </Button>
          <Button
            variant={filterStatus === "completed" ? "default" : "outline"}
            onClick={() => setFilterStatus("completed")}
          >
            {t("completed")}
          </Button>
          <Button
            variant={filterStatus === "cancelled" ? "default" : "outline"}
            onClick={() => setFilterStatus("cancelled")}
          >
            {t("cancelled")}
          </Button>
        </div>
      </div>

      {/* Contracts Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <DataTable
            columns={[
              {
                key: "contract_number",
                label: t("contractNumber"),
                sortable: true,
                render: (value) => (
                  <span className="font-mono font-semibold">{value}</span>
                ),
              },
              {
                key: "customer",
                label: t("customer"),
                render: (customer) => (
                  <div>
                    <p className="font-medium">{customer?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{customer?.phone}</p>
                  </div>
                ),
              },
              {
                key: "vehicle",
                label: t("vehicle"),
                render: (vehicle) =>
                  vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.registration_number})` : "—",
              },
              {
                key: "start_date",
                label: t("period"),
                render: (value, row) => (
                  <div className="text-sm">
                    <p>{new Date(value).toLocaleDateString()}</p>
                    <p className="text-muted-foreground">
                      to {new Date(row.end_date).toLocaleDateString()}
                    </p>
                  </div>
                ),
              },
              {
                key: "total_days",
                label: t("days"),
                render: (value) => <span className="font-semibold">{value}</span>,
              },
              {
                key: "total_amount",
                label: t("amount"),
                sortable: true,
                render: (value) => (
                  <span className="font-semibold">
                    {parseFloat(value).toLocaleString()} DZD
                  </span>
                ),
              },
              {
                key: "status",
                label: t("status"),
                render: (status) => <StatusBadge status={status} />,
              },
              // Alerts column (count + badge)
              {
                key: "alerts",
                label: t("alerts"),
                render: (_, row) => (
                  <div className="flex items-center gap-1">
                    {alertsByContract[row.id] > 0 ? (
                      <div className="flex items-center gap-1">
                        <StatusBadge status="critical" label={`(${alertsByContract[row.id]})`} />
                        <AlertCircle
                          className="w-3 h-3 text-destructive"
                          aria-label="View Alerts"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{t("none")}</span>
                    )}
                  </div>
                ),
              },
              {
                key: "actions",
                label: t("actions"),
                render: (_, row) => (
                  <div className="flex gap-1">
                    <button
                      className="p-1 hover:bg-muted rounded"
                      title={t("view")}
                      onClick={() => router.push(`/dashboard/contracts/${row.id}`)}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {row.status === "active" && (
                      <>
                        <button
                          className="p-1 hover:bg-muted rounded"
                          title={t("complete")}
                          onClick={() => handleComplete(row.id)}
                        >
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </button>
                        <button
                          className="p-1 hover:bg-muted rounded"
                          title={t("extend")}
                          onClick={() => handleExtend(row.id)}
                        >
                          <Calendar className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          className="p-1 hover:bg-destructive/10 rounded text-destructive"
                          title={t("cancelContract")}
                          onClick={() => handleCancel(row.id, row.contract_number)}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      className="p-1 hover:bg-muted rounded"
                      title={t("viewPDF")}
                      onClick={() => handleViewPDF(row)}
                    >
                      <FileText className="w-4 h-4 text-accent" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={contracts}
          />

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t("showing", { count: contracts.length, total: pagination.total })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              >
                {t("previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.total_pages}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              >
                {t("next")}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
