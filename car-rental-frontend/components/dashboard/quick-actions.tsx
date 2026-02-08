import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface QuickActionsProps {
  actions: {
    label: string
    href: string
    icon?: React.ReactNode
  }[]
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => (
        <Link key={action.href} href={action.href}>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            {action.label}
          </Button>
        </Link>
      ))}
    </div>
  )
}
