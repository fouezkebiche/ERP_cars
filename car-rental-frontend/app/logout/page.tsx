"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import toast from "react-hot-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface LogoutButtonProps {
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg"
  showIcon?: boolean
  showConfirm?: boolean
  className?: string
}

export function LogoutButton({
  variant = "ghost",
  size = "default",
  showIcon = true,
  showConfirm = true,
  className = ""
}: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    
    try {
      // Get tokens from localStorage
      const accessToken = localStorage.getItem('accessToken')
      const refreshToken = localStorage.getItem('refreshToken')

      // Try to call logout API, but don't wait too long
      if (accessToken && refreshToken) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout

          await fetch(`${API_URL}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)
        } catch (fetchError) {
          // Ignore API errors - we'll clear local storage anyway
          console.warn('Logout API error (continuing anyway):', fetchError)
        }
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // ALWAYS clear storage and redirect, regardless of API success
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      
      setDialogOpen(false)
      setIsLoggingOut(false)
      
      toast.success("Logged out successfully")
      
      // Force redirect to login
      window.location.href = '/login'
    }
  }

  // If no confirmation needed, return simple button
  if (!showConfirm) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={className}
      >
        {isLoggingOut ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Logging out...
          </>
        ) : (
          <>
            {showIcon && <LogOut className="w-4 h-4 mr-2" />}
            Logout
          </>
        )}
      </Button>
    )
  }

  // With confirmation dialog
  return (
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isLoggingOut}
          className={className}
        >
          {showIcon && <LogOut className="w-4 h-4 mr-2" />}
          Logout
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md mx-4">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to log out? You'll need to log in again to access your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoggingOut}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault() // Prevent default dialog close
              handleLogout()
            }}
            disabled={isLoggingOut}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Logging out...
              </>
            ) : (
              'Logout'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Alternative: Simple logout function for use in other components
export const logout = async (router: any) => {
  try {
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')

    if (accessToken) {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }).catch(() => {
        // Ignore API errors during logout
      })
    }

    localStorage.clear()
    router.push('/login')
    toast.success("Logged out successfully")
  } catch (error) {
    localStorage.clear()
    router.push('/login')
    toast.error("Logged out")
  }
}