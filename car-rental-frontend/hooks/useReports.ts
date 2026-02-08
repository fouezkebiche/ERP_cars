// hooks/useReports.ts
import { useState, useEffect, useCallback } from 'react';
import { reportsAPI, ReportData, ReportType, ReportFilters } from '@/lib/reports';

interface UseReportsResult {
  data: ReportData | null;
  loading: boolean;
  error: string | null;
  generateReport: (type: ReportType, filters?: ReportFilters) => Promise<void>;
  downloadPDF: (type: ReportType, filters?: ReportFilters) => Promise<void>;
  downloadExcel: (type: ReportType, filters?: ReportFilters) => Promise<void>;
  downloadJSON: (type: ReportType, filters?: ReportFilters) => Promise<void>;
}

export const useReports = (): UseReportsResult => {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = useCallback(async (type: ReportType, filters?: ReportFilters) => {
    try {
      setLoading(true);
      setError(null);
      const report = await reportsAPI.generateReport(type, filters);
      setData(report);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report';
      setError(errorMessage);
      console.error('Generate report error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadPDF = useCallback(async (type: ReportType, filters?: ReportFilters) => {
    try {
      setLoading(true);
      setError(null);
      await reportsAPI.downloadPDF(type, filters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download PDF';
      setError(errorMessage);
      console.error('Download PDF error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadExcel = useCallback(async (type: ReportType, filters?: ReportFilters) => {
    try {
      setLoading(true);
      setError(null);
      await reportsAPI.downloadExcel(type, filters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download Excel';
      setError(errorMessage);
      console.error('Download Excel error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadJSON = useCallback(async (type: ReportType, filters?: ReportFilters) => {
    try {
      setLoading(true);
      setError(null);
      await reportsAPI.downloadJSON(type, filters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download JSON';
      setError(errorMessage);
      console.error('Download JSON error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    generateReport,
    downloadPDF,
    downloadExcel,
    downloadJSON,
  };
};