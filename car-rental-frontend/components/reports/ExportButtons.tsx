// components/reports/ExportButtons.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Download, FileText, FileSpreadsheet, FileJson } from "lucide-react"
import toast from "react-hot-toast"

interface ExportButtonsProps {
  onDownloadPDF: () => Promise<void>
  onDownloadExcel: () => Promise<void>
  onDownloadJSON: () => Promise<void>
  loading: boolean
}

export function ExportButtons({ 
  onDownloadPDF, 
  onDownloadExcel, 
  onDownloadJSON,
  loading 
}: ExportButtonsProps) {
  const handleExport = async (exportFn: () => Promise<void>, format: string) => {
    const toastId = toast.loading(`Downloading ${format} report...`)
    try {
      await exportFn()
      toast.success(`${format} report downloaded successfully`, { id: toastId })
    } catch (error) {
      console.error(`Export ${format} error:`, error)
      toast.error(`Failed to download ${format} report`, { id: toastId })
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        onClick={() => handleExport(onDownloadPDF, 'PDF')}
        disabled={loading}
        className="gap-2"
        variant="outline"
      >
        <FileText className="w-4 h-4" />
        Download PDF
      </Button>
      
      <Button
        onClick={() => handleExport(onDownloadExcel, 'Excel')}
        disabled={loading}
        className="gap-2"
        variant="outline"
      >
        <FileSpreadsheet className="w-4 h-4" />
        Download Excel
      </Button>
      
      <Button
        onClick={() => handleExport(onDownloadJSON, 'JSON')}
        disabled={loading}
        className="gap-2"
        variant="outline"
      >
        <FileJson className="w-4 h-4" />
        Download JSON
      </Button>
    </div>
  )
}