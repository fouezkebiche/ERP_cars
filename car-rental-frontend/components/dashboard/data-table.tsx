"use client"

import type React from "react"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

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

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted border-b border-border">
          <tr>
            {columns.map((col, colIndex) => (
              <th
                key={`${String(col.key)}-${colIndex}`}
                className={cn(
                  "px-6 py-3 text-left text-sm font-semibold",
                  col.sortable && "cursor-pointer hover:bg-muted/80",
                )}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <div className="flex items-center gap-2">
                  {col.label}
                  {col.sortable &&
                    sortColumn === col.key &&
                    (sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIdx) => (
            <tr
              key={row.id || rowIdx}
              className={cn(
                "border-b border-border hover:bg-muted/50 transition-colors",
                striped && rowIdx % 2 === 0 && "bg-muted/20",
                onRowClick && "cursor-pointer",
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col, colIdx) => (
                <td key={`${row.id || rowIdx}-${String(col.key)}-${colIdx}`} className="px-6 py-4 text-sm">
                  {col.render ? col.render(row[col.key as keyof T], row) : row[col.key as keyof T]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}