"use client"

import type React from "react"
import { useState } from "react"
import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminTopbar } from "@/components/admin/topbar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#050508" }}
    >
      <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main
          className="flex-1 overflow-auto"
          style={{ background: "#07070d" }}
        >
          <div className="p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}