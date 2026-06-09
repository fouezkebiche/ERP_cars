"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function BillingPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string

  useEffect(() => {
    router.replace(`/${locale}/dashboard/settings?tab=billing`)
  }, [locale, router])

  return null
}
