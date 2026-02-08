"use client"
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Notification {
  id: string
  type: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  data?: any
  created_at: string
  is_read?: boolean
  dismissed?: boolean
  dismissed_at?: string
}

export function useNotifications({ 
  priority = 'critical', 
  limit = 5, 
  unread = true,
  showDismissed = false,
  type,  // STEP 3: New param for type filter (e.g., 'vehicle_maintenance')
  vehicleId  // STEP 3: New param for vehicle-specific (e.g., 'abc123' -> data[vehicle_id]=abc123)
}: {
  priority?: string;
  limit?: number;
  unread?: boolean;
  showDismissed?: boolean;
  type?: string;  // STEP 3
  vehicleId?: string;  // STEP 3
} = {}) {
  const [data, setData] = useState<{ notifications: Notification[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null

  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        priority: priority || '',
        limit: limit.toString(),
        ...(unread && { unread: 'true' }),
        dismissed: showDismissed.toString(),
        ...(type && { type }),  // STEP 3: Add type param
        ...(vehicleId && { [`data[vehicle_id]`]: vehicleId }),  // STEP 3: Add data filter (query string format for backend parsing)
      })
      const res = await fetch(`${API_URL}/api/notifications?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      })
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Session expired. Please log in again.")
          localStorage.removeItem('accessToken')
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
          return
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      const responseData = await res.json()
      if (responseData?.data) {
        setData(responseData.data)
      } else {
        setData({ notifications: [] })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [token, priority, limit, unread, showDismissed, type, vehicleId])  // STEP 3: Depend on new params

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const refetch = () => {
    fetchNotifications()
  }

  const dismissNotification = async (id: string) => {
    if (!token) return toast.error('No authentication token')
    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}/dismiss`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      toast.success('Notification dismissed')
      refetch()
    } catch (err) {
      toast.error('Failed to dismiss notification')
    }
  }

  const restoreNotification = async (id: string) => {
    if (!token) return toast.error('No authentication token')
    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}/restore`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      toast.success('Notification restored')
      refetch()
    } catch (err) {
      toast.error('Failed to restore notification')
    }
  }

  return {
    data,
    loading,
    error,
    refetch,
    dismissNotification,
    restoreNotification,
    showDismissed
  }
}