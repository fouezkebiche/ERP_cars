// components/analytics/analytics-filters.tsx
"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, Filter, X } from 'lucide-react'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'

interface AnalyticsFiltersProps {
  onPeriodChange: (period: 'today' | 'week' | 'month' | 'quarter' | 'year') => void
  onDateRangeChange: (range: { start_date?: string; end_date?: string }) => void
  onMetricChange?: (metric: 'utilization' | 'revenue' | 'profit') => void
  currentPeriod: string
  showMetricFilter?: boolean
}

export function AnalyticsFilters({
  onPeriodChange,
  onDateRangeChange,
  onMetricChange,
  currentPeriod,
  showMetricFilter = false,
}: AnalyticsFiltersProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [selectedMetric, setSelectedMetric] = useState<'utilization' | 'revenue' | 'profit'>('utilization')

  const periods = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'year', label: 'Year' },
  ]

  const metrics = [
    { value: 'utilization', label: 'Utilization' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'profit', label: 'Profit' },
  ]

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range)
    if (range?.from && range?.to) {
      onDateRangeChange({
        start_date: format(range.from, 'yyyy-MM-dd'),
        end_date: format(range.to, 'yyyy-MM-dd'),
      })
    }
  }

  const clearDateRange = () => {
    setDateRange(undefined)
    onDateRangeChange({})
  }

  const handleMetricChange = (metric: 'utilization' | 'revenue' | 'profit') => {
    setSelectedMetric(metric)
    onMetricChange?.(metric)
  }

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="w-4 h-4" />
          Period:
        </div>
        {periods.map((period) => (
          <Button
            key={period.value}
            onClick={() => onPeriodChange(period.value as any)}
            variant={currentPeriod === period.value ? 'default' : 'outline'}
            size="sm"
          >
            {period.label}
          </Button>
        ))}
      </div>

      {/* Custom Date Range */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'LLL dd, y')} -{' '}
                    {format(dateRange.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(dateRange.from, 'LLL dd, y')
                )
              ) : (
                <span>Custom Range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleDateRangeSelect}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        {dateRange && (
          <Button variant="ghost" size="sm" onClick={clearDateRange}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Metric Selector (optional) */}
      {showMetricFilter && (
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            Metric:
          </div>
          {metrics.map((metric) => (
            <Button
              key={metric.value}
              onClick={() => handleMetricChange(metric.value as any)}
              variant={selectedMetric === metric.value ? 'default' : 'outline'}
              size="sm"
            >
              {metric.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}