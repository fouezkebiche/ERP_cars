// lib/api-client.ts - FIXED VERSION
import axios, { AxiosError } from 'axios'

// IMPORTANT: Base URL should NOT include /api since we add it in each request
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    // ✅ Use 'accessToken' to match your auth system
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    console.log(`🔵 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
    })
    
    return config
  },
  (error) => {
    console.error('❌ Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.url}`, response.status)
    return response
  },
  (error: AxiosError) => {
    // ✅ FIXED: Better error logging and handling
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    }
    
    console.error('❌ API Error:', errorDetails)
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response as any
      
      if (status === 401) {
        // Unauthorized - clear tokens and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }
      }
      
      // ✅ FIXED: Return properly structured error
      const errorResponse = {
        statusCode: status,
        message: data?.message || data?.error || 'An error occurred',
        details: data?.details || data?.error || error.message,
        success: false,
      }
      
      return Promise.reject(errorResponse)
    } else if (error.request) {
      // Request made but no response received
      console.error('🔴 No response from server:', error.request)
      
      const errorResponse = {
        statusCode: 0,
        message: 'Network error - Could not connect to server',
        details: error.message,
        success: false,
      }
      
      return Promise.reject(errorResponse)
    } else {
      // Error in request setup
      console.error('🔴 Request setup error:', error.message)
      
      const errorResponse = {
        statusCode: 0,
        message: 'Request failed',
        details: error.message,
        success: false,
      }
      
      return Promise.reject(errorResponse)
    }
  }
)

export default apiClient