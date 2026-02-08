// hooks/useEmployees.ts
"use client"

import { useState, useCallback } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { employeeAPI, type Employee, type Role, type EmployeeStats, type CreateEmployeeData, type UpdateEmployeeData } from '@/lib/employees'
import toast from 'react-hot-toast'

// Use employeeAPI.getEmployees as fetcher
const employeeFetcher = async (url: string, params: any) => {
  const result = await employeeAPI.getEmployees(params)
  return result
}

const statsFetcher = async () => {
  const result = await employeeAPI.getStats()
  return result.stats
}

const rolesFetcher = async () => {
  const result = await employeeAPI.getRoles()
  return result.roles
}

// Hook for listing employees
export function useEmployees(params: {
  status?: string
  role?: string
  department?: string
  search?: string
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'ASC' | 'DESC'
} = {}) {
  const key = ['employees', params]
  
  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => employeeFetcher('', params),
    { revalidateOnFocus: false }
  )

  const refetch = useCallback(() => mutate(), [mutate])

  return {
    employees: data?.employees || [],
    meta: data?.meta || { pagination: { total: 0, page: 1, limit: 20, total_pages: 1 } },
    loading: isLoading,
    error: error?.message,
    refetch,
    totalPages: data?.meta?.pagination?.total_pages || 1,
    totalCount: data?.meta?.pagination?.total || 0,
  }
}

// Hook for stats and roles
export function useEmployeeStatsAndRoles() {
  const { data: stats, error: statsError, isLoading: statsLoading } = useSWR('employee-stats', statsFetcher)
  const { data: roles, error: rolesError, isLoading: rolesLoading } = useSWR('employee-roles', rolesFetcher)

  return {
    stats,
    roles,
    loading: statsLoading || rolesLoading,
    error: statsError?.message || rolesError?.message,
  }
}

// Hook for mutations
export function useEmployeeMutations() {
  const { mutate } = useSWRConfig()

  const create = useCallback(async (data: CreateEmployeeData) => {
    try {
      const result = await employeeAPI.createEmployee(data)
      toast.success('Employee created successfully!')
      await mutate(['employees'])
      return result
    } catch (error: any) {
      toast.error(error.message || 'Failed to create employee')
      throw error
    }
  }, [mutate])

  const update = useCallback(async (id: string, data: UpdateEmployeeData) => {
    try {
      const result = await employeeAPI.updateEmployee(id, data)
      toast.success('Employee updated successfully!')
      await mutate(['employees'])
      return result
    } catch (error: any) {
      toast.error(error.message || 'Failed to update employee')
      throw error
    }
  }, [mutate])

  const terminate = useCallback(async (id: string) => {
    try {
      const result = await employeeAPI.terminateEmployee(id)
      toast.success('Employee terminated successfully!')
      await mutate(['employees'])
      return result
    } catch (error: any) {
      toast.error(error.message || 'Failed to terminate employee')
      throw error
    }
  }, [mutate])

  const resetPassword = useCallback(async (id: string, newPassword: string) => {
    try {
      await employeeAPI.resetPassword(id, newPassword)
      toast.success('Password reset successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password')
      throw error
    }
  }, [])

  return { create, update, terminate, resetPassword }
}