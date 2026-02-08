import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string  
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const statusConfig = {
    available: { bg: "bg-accent/10", text: "text-accent", label: "Available" },
    rented: { bg: "bg-blue-100", text: "text-blue-700", label: "Rented" },
    maintenance: { bg: "bg-amber-100", text: "text-amber-700", label: "Maintenance" },
    active: { bg: "bg-accent/10", text: "text-accent", label: "Active" },
    completed: { bg: "bg-gray-100", text: "text-gray-700", label: "Completed" },
    cancelled: { bg: "bg-destructive/10", text: "text-destructive", label: "Cancelled" },
    pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending" },
    paid: { bg: "bg-accent/10", text: "text-accent", label: "Paid" },
    // Optional: Add these for custom styling if desired
    // draft: { bg: "bg-gray-100", text: "text-gray-700", label: "Draft" },
    // extended: { bg: "bg-blue-100", text: "text-blue-700", label: "Extended" },
  }

  // Type assertion for indexing (safe since status is string)
  const config = statusConfig[status as keyof typeof statusConfig]

  // Safety check: If config is undefined, fallback to a default (prevents crash)
  if (!config) {
    console.warn(`Unknown status "${status}" in StatusBadge - using default`);
    return (
      <span className={cn("px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700", className)}>
        {label || status}
      </span>
    );
  }

  return (
    <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", config.bg, config.text, className)}>
      {label || config.label}
    </span>
  )
}