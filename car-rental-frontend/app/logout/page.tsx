"use client"

import {LogoutButton} from "@/components/LogoutButton"

export default function LogoutPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Logging out...</h1>
      <LogoutButton showConfirm={false} />
    </div>
  )
}