// components/reports/ReportFilters.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, Filter, X } from "lucide-react"
import { ReportFilters as Filters } from "@/lib/reports"

interface ReportFiltersProps {
  onApply: (filters: Filters) => void
  onReset: () => void
}

export function ReportFilters({ onApply, onReset }: ReportFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    period: 'month',
  })

  const handleApply = () => {
    onApply(filters)
    setShowFilters(false)
  }

  const handleReset = () => {
    setFilters({ period: 'month' })
    onReset()
    setShowFilters(false)
  }

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <Button
        onClick={() => setShowFilters(!showFilters)}
        variant="outline"
        className="gap-2"
      >
        <Filter className="w-4 h-4" />
        {showFilters ? 'Hide Filters' : 'Show Filters'}
      </Button>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-6 rounded-lg border border-border bg-card space-y-6">
          {/* Date Range Section */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date Range
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Period Presets */}
              <div className="lg:col-span-5">
                <label className="text-sm font-medium mb-2 block">Quick Select</label>
                <div className="flex flex-wrap gap-2">
                  {(['today', 'week', 'month', 'quarter', 'year'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setFilters({ ...filters, period, startDate: undefined, endDate: undefined })}
                      className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                        filters.period === period && !filters.startDate
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range */}
              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value, period: undefined })}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value, period: undefined })}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                />
              </div>
            </div>
          </div>

          {/* Revenue Filters */}
          <div>
            <h3 className="font-semibold mb-4">Revenue Range (DZD)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Minimum</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minRevenue || ''}
                  onChange={(e) => setFilters({ ...filters, minRevenue: parseFloat(e.target.value) || undefined })}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Maximum</label>
                <input
                  type="number"
                  placeholder="1000000"
                  value={filters.maxRevenue || ''}
                  onChange={(e) => setFilters({ ...filters, maxRevenue: parseFloat(e.target.value) || undefined })}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                />
              </div>
            </div>
          </div>

          {/* Utilization Filters */}
          <div>
            <h3 className="font-semibold mb-4">Utilization Rate (%)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Minimum</label>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  max="100"
                  value={filters.minUtilization || ''}
                  onChange={(e) => setFilters({ ...filters, minUtilization: parseFloat(e.target.value) || undefined })}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Maximum</label>
                <input
                  type="number"
                  placeholder="100"
                  min="0"
                  max="100"
                  value={filters.maxUtilization || ''}
                  onChange={(e) => setFilters({ ...filters, maxUtilization: parseFloat(e.target.value) || undefined })}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                />
              </div>
            </div>
          </div>

          {/* Customer Type Filter */}
          <div>
            <h3 className="font-semibold mb-4">Customer Type</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({ ...filters, customerType: undefined })}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  !filters.customerType
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilters({ ...filters, customerType: 'individual' })}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  filters.customerType === 'individual'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                Individual
              </button>
              <button
                onClick={() => setFilters({ ...filters, customerType: 'corporate' })}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  filters.customerType === 'corporate'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                Corporate
              </button>
            </div>
          </div>

          {/* Sort By Filter */}
          <div>
            <h3 className="font-semibold mb-4">Sort By</h3>
            <select
              value={filters.sortBy || 'profit'}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
              className="w-full px-3 py-2 rounded-md border border-input bg-background"
            >
              <option value="profit">Profit</option>
              <option value="revenue">Revenue</option>
              <option value="utilization">Utilization</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleApply} className="flex-1">
              Apply Filters
            </Button>
            <Button onClick={handleReset} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}