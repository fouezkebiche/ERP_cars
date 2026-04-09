// app/[locale]/dashboard/reports/page.tsx
"use client"

import { useState } from "react"
import { BarChart3, Users, Car, Download } from "lucide-react"
import { useReports } from "@/hooks/useReports"
import { ReportFilters } from "@/components/reports/ReportFilters"
import { ExportButtons } from "@/components/reports/ExportButtons"
import { Button } from "@/components/ui/button"
import type { ReportType, ReportFilters as Filters } from "@/lib/reports"
import {
  ExecutiveSummaryView,
  VehiclePerformanceView,
  CustomerInsightsView,
} from "@/components/reports/ReportViews"
import { useTranslations } from "next-intl"

export default function ReportsPage() {
  const t = useTranslations("reports")
  
  const [reportType, setReportType] = useState<ReportType>('executive')
  const [currentFilters, setCurrentFilters] = useState<Filters>({ period: 'month' })
  
  const { 
    data: reportData, 
    loading, 
    error,
    generateReport,
    downloadPDF,
    downloadExcel,
    downloadJSON 
  } = useReports()

  const handleGenerateReport = async () => {
    await generateReport(reportType, currentFilters)
  }

  const handleApplyFilters = (filters: Filters) => {
    setCurrentFilters(filters)
  }

  const handleResetFilters = () => {
    setCurrentFilters({ period: 'month' })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (loading && !reportData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("generating")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        
        {reportData && (
          <ExportButtons
            onDownloadPDF={() => downloadPDF(reportType, currentFilters)}
            onDownloadExcel={() => downloadExcel(reportType, currentFilters)}
            onDownloadJSON={() => downloadJSON(reportType, currentFilters)}
            loading={loading}
          />
        )}
      </div>

      {/* Report Type Selector */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t("selectReportType")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setReportType('executive')}
            className={`p-6 rounded-lg border-2 transition-all ${
              reportType === 'executive'
                ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-105'
                : 'bg-card border-border hover:border-primary/50 hover:shadow-md'
            }`}
          >
            <BarChart3 className="w-8 h-8 mx-auto mb-3" />
            <div className="font-semibold text-lg">{t("executiveSummary")}</div>
            <div className="text-xs mt-2 opacity-80">{t("executiveDesc")}</div>
          </button>
          
          <button
            onClick={() => setReportType('vehicle')}
            className={`p-6 rounded-lg border-2 transition-all ${
              reportType === 'vehicle'
                ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-105'
                : 'bg-card border-border hover:border-primary/50 hover:shadow-md'
            }`}
          >
            <Car className="w-8 h-8 mx-auto mb-3" />
            <div className="font-semibold text-lg">{t("vehiclePerformance")}</div>
            <div className="text-xs mt-2 opacity-80">{t("vehicleDesc")}</div>
          </button>
          
          <button
            onClick={() => setReportType('customer')}
            className={`p-6 rounded-lg border-2 transition-all ${
              reportType === 'customer'
                ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-105'
                : 'bg-card border-border hover:border-primary/50 hover:shadow-md'
            }`}
          >
            <Users className="w-8 h-8 mx-auto mb-3" />
            <div className="font-semibold text-lg">{t("customerInsights")}</div>
            <div className="text-xs mt-2 opacity-80">{t("customerDesc")}</div>
          </button>
        </div>
      </div>

      {/* Filters */}
      <ReportFilters onApply={handleApplyFilters} onReset={handleResetFilters} />

      {/* Generate Button */}
      <Button
        onClick={handleGenerateReport}
        disabled={loading}
        className="w-full md:w-auto gap-2"
        size="lg"
      >
        <Download className="w-4 h-4" />
        {loading ? t("generating") : t("generateReport")}
      </Button>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg border-l-4 border-l-destructive bg-destructive/10">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{t("error")}</span>
          </div>
          <p className="text-sm mt-2 text-muted-foreground">{error}</p>
        </div>
      )}

      {/* Report Preview */}
      {reportData && !error && (
        <div className="space-y-8">
          {/* Executive Summary Report */}
          {reportData.report_type === "executive_summary" && (
            <ExecutiveSummaryView
              report={reportData as any}
              formatCurrency={formatCurrency}
            />
          )}

          {/* Vehicle Performance Report */}
          {reportData.report_type === "vehicle_performance" && (
            <VehiclePerformanceView
              report={reportData as any}
              formatCurrency={formatCurrency}
            />
          )}

          {/* Customer Insights Report */}
          {reportData.report_type === "customer_insights" && (
            <CustomerInsightsView
              report={reportData as any}
              formatCurrency={formatCurrency}
            />
          )}
        </div>
      )}
    </div>
  )
}
