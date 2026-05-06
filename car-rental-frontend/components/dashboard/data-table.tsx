"use client"
import type React from "react"
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

/* ─── tokens ─────────────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"

interface Column<T> {
  key: keyof T | string
  label: string
  render?: (value: any, row: T) => React.ReactNode
  sortable?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  striped?: boolean
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  striped = true,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [hovRow, setHovRow] = useState<number | null>(null)

  // ── logic unchanged ──────────────────────────────────────────
  const handleSort = (key: keyof T | string) => {
    if (sortColumn === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(key)
      setSortDirection("asc")
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0
    const aVal = a[sortColumn as keyof T]
    const bVal = b[sortColumn as keyof T]
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
    return 0
  })
  // ────────────────────────────────────────────────────────────

  return (
    <div style={{ borderRadius: 14, border: `1px solid ${BORDER}`, overflow: "hidden", fontFamily: FONT, color: "#fff" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>

          {/* head */}
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.025)" }}>
              {columns.map((col, colIndex) => (
                <th
                  key={`${String(col.key)}-${colIndex}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                  style={{
                    padding: "12px 20px", textAlign: "left",
                    fontSize: 11, fontWeight: 700, color: "#9CA3AF",
                    letterSpacing: "0.06em", textTransform: "uppercase",
                    cursor: col.sortable ? "pointer" : "default",
                    userSelect: "none", whiteSpace: "nowrap",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={e => { if (col.sortable) e.currentTarget.style.color = "#fff" }}
                  onMouseLeave={e => { if (col.sortable) e.currentTarget.style.color = "#9CA3AF" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {col.label}
                    {col.sortable && sortColumn === col.key && (
                      <span style={{ color: GREEN }}>
                        {sortDirection === "asc"
                          ? <ChevronUp size={13} />
                          : <ChevronDown size={13} />}
                      </span>
                    )}
                    {col.sortable && sortColumn !== col.key && (
                      <ChevronDown size={11} style={{ opacity: 0.3 }} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* body */}
          <tbody>
            {sortedData.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                onMouseEnter={() => setHovRow(rowIdx)}
                onMouseLeave={() => setHovRow(null)}
                onClick={() => onRowClick?.(row)}
                style={{
                  borderBottom: rowIdx < sortedData.length - 1 ? `1px solid ${BORDER}` : "none",
                  background: hovRow === rowIdx
                    ? "rgba(255,255,255,0.055)"
                    : striped && rowIdx % 2 !== 0
                      ? "rgba(255,255,255,0.02)"
                      : "transparent",
                  cursor: onRowClick ? "pointer" : "default",
                  transition: "background 0.15s",
                }}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={`${row.id || rowIdx}-${String(col.key)}-${colIdx}`}
                    style={{
                      padding: "13px 20px", fontSize: 13,
                      color: "#fff", verticalAlign: "middle",
                    }}
                  >
                    {col.render
                      ? col.render(row[col.key as keyof T], row)
                      : row[col.key as keyof T]}
                  </td>
                ))}
              </tr>
            ))}

            {sortedData.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ padding: "40px 20px", textAlign: "center", color: "#6B7280", fontSize: 13 }}
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}