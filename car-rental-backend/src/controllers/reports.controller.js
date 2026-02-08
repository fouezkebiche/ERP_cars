// src/controllers/reports.controller.js
const reportService = require('../services/reportGeneration.service');
const { sendSuccess, sendError } = require('../utils/response.util');
const { query, validationResult } = require('express-validator');
const ExcelJS = require('exceljs');
const { generateReportPDF: generatePDFFile } = require('../utils/pdfGenerator.util');

/**
 * GET /api/reports/:type
 * Generate report in JSON format
 */
const generateReport = [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('vehicleIds').optional().isArray(),
  query('customerIds').optional().isArray(),
  query('minRevenue').optional().isFloat({ min: 0 }),
  query('maxRevenue').optional().isFloat({ min: 0 }),
  query('minUtilization').optional().isFloat({ min: 0, max: 100 }),
  query('maxUtilization').optional().isFloat({ min: 0, max: 100 }),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, {
          statusCode: 422,
          message: 'Validation failed',
          details: errors.array(),
        });
      }

      const { type } = req.params;
      const filters = req.query;
      const companyId = req.companyId;

      console.log(`📊 Generating ${type} report for company ${companyId}`);

      const report = await reportService.generateReport(companyId, type, filters);

      sendSuccess(res, {
        message: `${type} report generated successfully`,
        data: { report },
      });
    } catch (error) {
      console.error('💥 Generate report error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to generate report',
        details: error.message,
      });
    }
  },
];

/**
 * GET /api/reports/:type/pdf
 * Generate report as PDF
 */
const generateReportPDF = [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, {
          statusCode: 422,
          message: 'Validation failed',
          details: errors.array(),
        });
      }

      const { type } = req.params;
      const filters = req.query;
      const companyId = req.companyId;

      console.log(`📄 Generating ${type} PDF report for company ${companyId}`);

      // Generate report data
      const report = await reportService.generateReport(companyId, type, filters);

      // Generate PDF
      const pdfBuffer = await generatePDFFile(report, type);

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_report_${Date.now()}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('💥 Generate PDF report error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to generate PDF report',
        details: error.message,
      });
    }
  },
];

/**
 * GET /api/reports/:type/excel
 * Generate report as Excel file
 */
const generateReportExcel = [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, {
          statusCode: 422,
          message: 'Validation failed',
          details: errors.array(),
        });
      }

      const { type } = req.params;
      const filters = req.query;
      const companyId = req.companyId;

      console.log(`📊 Generating ${type} Excel report for company ${companyId}`);

      // Generate report data
      const report = await reportService.generateReport(companyId, type, filters);

      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`${type} Report`);

      // Add report data based on type
      if (type === 'executive') {
        worksheet.columns = [
          { header: 'Metric', key: 'metric', width: 30 },
          { header: 'Value', key: 'value', width: 20 },
        ];

        worksheet.addRows([
          { metric: 'Total Revenue', value: report.summary.total_revenue },
          { metric: 'Revenue Growth', value: `${report.summary.revenue_growth.toFixed(2)}%` },
          { metric: 'Total Contracts', value: report.summary.total_contracts },
          { metric: 'Fleet Utilization', value: `${report.summary.fleet_utilization.toFixed(2)}%` },
          { metric: 'Active Customers', value: report.summary.active_customers },
          { metric: 'New Customers', value: report.summary.new_customers },
        ]);
      } else if (type === 'vehicle') {
        worksheet.columns = [
          { header: 'Vehicle', key: 'vehicle', width: 30 },
          { header: 'Registration', key: 'registration', width: 20 },
          { header: 'Utilization', key: 'utilization', width: 15 },
          { header: 'Revenue', key: 'revenue', width: 15 },
          { header: 'Costs', key: 'costs', width: 15 },
          { header: 'Profit', key: 'profit', width: 15 },
        ];

        report.all_vehicles.forEach(v => {
          worksheet.addRow({
            vehicle: `${v.brand} ${v.model}`,
            registration: v.registration_number,
            utilization: `${v.utilization_rate.toFixed(2)}%`,
            revenue: v.total_revenue,
            costs: v.total_costs,
            profit: v.profit,
          });
        });
      } else if (type === 'customer') {
        worksheet.columns = [
          { header: 'Customer', key: 'customer', width: 30 },
          { header: 'Type', key: 'type', width: 15 },
          { header: 'Total Rentals', key: 'rentals', width: 15 },
          { header: 'Lifetime Value', key: 'value', width: 20 },
        ];

        report.customer_segmentation.segments.vip.customers.forEach(c => {
          worksheet.addRow({
            customer: c.full_name,
            type: c.customer_type,
            rentals: c.total_rentals,
            value: c.lifetime_value,
          });
        });
      }

      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();

      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_report_${Date.now()}.xlsx"`);
      res.send(buffer);
    } catch (error) {
      console.error('💥 Generate Excel report error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to generate Excel report',
        details: error.message,
      });
    }
  },
];

module.exports = {
  generateReport,
  generateReportPDF,
  generateReportExcel,
};