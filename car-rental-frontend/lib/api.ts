import axios from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
})

// Attach auth token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authToken")
    if (token) {
      // ✅ Fix: cast headers to any to avoid TS error
      (config.headers as any).Authorization = `Bearer ${token}`
    }
  }
  return config
})

export default api