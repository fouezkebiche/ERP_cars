// components/reports/ExportButtons.tsx
"use client"

import { FileText, FileSpreadsheet, FileJson } from "lucide-react"
import toast from "react-hot-toast"

const FONT         = "'Plus Jakarta Sans', system-ui, sans-serif"
const SURFACE      = 'rgba(255,255,255,0.04)'
const BORDER_COLOR = 'rgba(255,255,255,0.07)'
const GREEN        = '#22C55E'
const MUTED        = 'rgba(255,255,255,0.4)'

interface ExportButtonsProps {
  onDownloadPDF:   () => Promise<void>
  onDownloadExcel: () => Promise<void>
  onDownloadJSON:  () => Promise<void>
  loading: boolean
}

interface Btn {
  label:  string
  format: string
  fn:     () => Promise<void>
  icon:   React.ReactNode
  accent: string
}

export function ExportButtons({ onDownloadPDF, onDownloadExcel, onDownloadJSON, loading }: ExportButtonsProps) {

  const handle = async (fn: () => Promise<void>, format: string) => {
    const id = toast.loading(`Preparing ${format} report…`)
    try {
      await fn()
      toast.success(`${format} downloaded`, { id })
    } catch (err) {
      console.error(`Export ${format}:`, err)
      toast.error(`Failed to download ${format}`, { id })
    }
  }

  const buttons: Btn[] = [
    { label:'PDF',   format:'PDF',   fn: onDownloadPDF,   icon: <FileText        style={{ width:14, height:14 }} />, accent:'#EF4444' },
    { label:'Excel', format:'Excel', fn: onDownloadExcel, icon: <FileSpreadsheet  style={{ width:14, height:14 }} />, accent: GREEN    },
    { label:'JSON',  format:'JSON',  fn: onDownloadJSON,  icon: <FileJson        style={{ width:14, height:14 }} />, accent:'#F59E0B' },
  ]

  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
      {buttons.map(({ label, format, fn, icon, accent }) => (
        <button
          key={format}
          onClick={() => handle(fn, format)}
          disabled={loading}
          style={{
            display:'inline-flex', alignItems:'center', gap:7,
            padding:'7px 14px', borderRadius:8,
            borderWidth:1, borderStyle:'solid',
            borderColor: loading ? BORDER_COLOR : `${accent}55`,
            background:  loading ? SURFACE      : `${accent}10`,
            color:       loading ? MUTED         : accent,
            fontFamily: FONT, fontSize:12, fontWeight:600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition:'all 0.15s', opacity: loading ? 0.5 : 1,
          }}
          onMouseEnter={e => {
            if (!loading) {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background  = `${accent}20`
              el.style.borderColor = accent
              el.style.boxShadow   = `0 0 10px ${accent}33`
            }
          }}
          onMouseLeave={e => {
            if (!loading) {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background  = `${accent}10`
              el.style.borderColor = `${accent}55`
              el.style.boxShadow   = 'none'
            }
          }}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  )
}