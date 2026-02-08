// lib/api-client.ts
"use client"

import axios from "axios"

// Create axios instance
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
})

// --------------------
// REQUEST INTERCEPTOR
// --------------------
apiClient.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
    if (token) {
      // cast headers to any to avoid TS issues
      (config.headers as any).Authorization = `Bearer ${token}`
    }

    console.log(
      `🔵 API Request: ${config.method?.toUpperCase()} ${config.url}`,
      { params: config.params }
    )

    return config
  },
  (error) => Promise.reject(error)
)

// --------------------
// RESPONSE INTERCEPTOR
// --------------------
apiClient.interceptors.response.use(
  (response) => response,
  (error: any) => {
    // ✅ let TS infer, no AxiosError import
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    }
    console.error("❌ API Error:", errorDetails)

    if (error.response) {
      const { status, data } = error.response

      if (status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
        localStorage.removeItem("user")
        window.location.href = "/login"
      }

      return Promise.reject({
        statusCode: status,
        message: data?.message || data?.error || "An error occurred",
        details: data?.details || error.message,
        success: false,
      })
    } else if (error.request) {
      return Promise.reject({
        statusCode: 0,
        message: "Network error - Could not connect to server",
        details: error.message,
        success: false,
      })
    } else {
      return Promise.reject({
        statusCode: 0,
        message: "Request failed",
        details: error.message,
        success: false,
      })
    }
  }
)

export default apiClient