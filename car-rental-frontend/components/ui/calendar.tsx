"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type DayPickerProps } from "react-day-picker"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = DayPickerProps

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  // Custom navbar with left/right buttons
  const Navbar: React.FC<{ className?: string }> = () => {
    return (
      <div className="flex justify-between items-center mb-2">
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 p-0 opacity-50 hover:opacity-100"
          )}
          onClick={() => props?.onPrevMonth?.()}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 p-0 opacity-50 hover:opacity-100"
          )}
          onClick={() => props?.onNextMonth?.()}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell:
          "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_range_end: "day-range-end",
        day_hidden: "invisible",
        ...classNames,
      }}
      navbar={({ onPreviousClick, onNextClick }) => (
        <div className="flex justify-between mb-2">
          <button
            onClick={onPreviousClick}
            className={cn(buttonVariants({ variant: "outline" }), "h-7 w-7 p-0")}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={onNextClick}
            className={cn(buttonVariants({ variant: "outline" }), "h-7 w-7 p-0")}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"