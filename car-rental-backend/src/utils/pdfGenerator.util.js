// src/utils/pdfGenerator.util.js
const puppeteer = require('puppeteer');
const { generateChartsForReport } = require('./chartGenerator.util');

/**
 * Generate HTML content for report with embedded charts
 */
const generateReportHTML = (report, type, charts = {}) => {
  const styles = `
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 40px;
        color: #333;
      }
      .header {
        text-align: center;
        margin-bottom: 40px;
        border-bottom: 3px solid #3b82f6;
        padding-bottom: 20px;
      }
      .header h1 {
        color: #3b82f6;
        margin: 0;
      }
      .header .subtitle {
        color: #6b7280;
        margin-top: 10px;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        margin-bottom: 40px;
      }
      .summary-card {
        background: #f3f4f6;
        padding: 20px;
        border-radius: 8px;
        border-left: 4px solid #3b82f6;
      }
      .summary-card h3 {
        margin: 0 0 10px 0;
        color: #6b7280;
        font-size: 14px;
        font-weight: normal;
      }
      .summary-card .value {
        font-size: 28px;
        font-weight: bold;
        color: #111827;
      }
      .summary-card .change {
        font-size: 14px;
        margin-top: 5px;
      }
      .change.positive { color: #10b981; }
      .change.negative { color: #ef4444; }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      th {
        background: #3b82f6;
        color: white;
        padding: 12px;
        text-align: left;
        font-weight: 600;
      }
      td {
        padding: 12px;
        border-bottom: 1px solid #e5e7eb;
      }
      tr:hover {
        background: #f9fafb;
      }
      .section {
        margin: 40px 0;
      }
      .section h2 {
        color: #111827;
        border-bottom: 2px solid #e5e7eb;
        padding-bottom: 10px;
        margin-bottom: 20px;
      }
      .footer {
        margin-top: 60px;
        text-align: center;
        color: #6b7280;
        font-size: 12px;
        border-top: 1px solid #e5e7eb;
        padding-top: 20px;
      }
      .chart-container {
        margin: 30px 0;
        text-align: center;
      }
      .chart-container img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    </style>
  `;

  let content = '';

  if (type === 'executive') {
    content = `
      <div class="header">
        <h1>Executive Summary Report</h1>
        <div class="subtitle">
          Period: ${new Date(report.period.start).toLocaleDateString()} - ${new Date(report.period.end).toLocaleDateString()}
        </div>
        <div class="subtitle">Generated: ${new Date(report.generated_at).toLocaleString()}</div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <h3>Total Revenue</h3>
          <div class="value">${report.summary.total_revenue.toLocaleString()} DA</div>
          <div class="change ${report.summary.revenue_growth >= 0 ? 'positive' : 'negative'}">
            ${report.summary.revenue_growth >= 0 ? '↑' : '↓'} ${Math.abs(report.summary.revenue_growth).toFixed(1)}%
          </div>
        </div>
        <div class="summary-card">
          <h3>Fleet Utilization</h3>
          <div class="value">${report.summary.fleet_utilization.toFixed(1)}%</div>
        </div>
        <div class="summary-card">
          <h3>Active Contracts</h3>
          <div class="value">${report.summary.total_contracts}</div>
        </div>
        <div class="summary-card">
          <h3>Active Customers</h3>
          <div class="value">${report.summary.active_customers}</div>
        </div>
        <div class="summary-card">
          <h3>New Customers</h3>
          <div class="value">${report.summary.new_customers}</div>
        </div>
        <div class="summary-card">
          <h3>Maintenance Alerts</h3>
          <div class="value">${report.summary.maintenance_alerts}</div>
        </div>
      </div>

      <div class="section">
        <h2>Top Performing Vehicles</h2>
        <table>
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Registration</th>
              <th>Utilization</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${report.top_vehicles.map(v => `
              <tr>
                <td>${v.brand} ${v.model}</td>
                <td>${v.registration_number}</td>
                <td>${v.utilization_rate.toFixed(1)}%</td>
                <td>${v.total_revenue.toLocaleString()} DA</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>Top Customers</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Total Rentals</th>
              <th>Lifetime Value</th>
            </tr>
          </thead>
          <tbody>
            ${report.top_customers.map(c => `
              <tr>
                <td>${c.name}</td>
                <td>${c.type}</td>
                <td>${c.total_rentals}</td>
                <td>${c.lifetime_value.toLocaleString()} DA</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (type === 'vehicle') {
    content = `
      <div class="header">
        <h1>Vehicle Performance Report</h1>
        <div class="subtitle">
          Period: ${new Date(report.period.start).toLocaleDateString()} - ${new Date(report.period.end).toLocaleDateString()}
        </div>
        <div class="subtitle">Generated: ${new Date(report.generated_at).toLocaleString()}</div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <h3>Total Revenue</h3>
          <div class="value">${report.fleet_summary.total_revenue.toLocaleString()} DA</div>
        </div>
        <div class="summary-card">
          <h3>Total Profit</h3>
          <div class="value">${report.fleet_summary.total_profit.toLocaleString()} DA</div>
        </div>
        <div class="summary-card">
          <h3>Profit Margin</h3>
          <div class="value">${report.fleet_summary.profit_margin.toFixed(1)}%</div>
        </div>
      </div>

      <div class="section">
        <h2>Top Performers</h2>
        <table>
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Registration</th>
              <th>Utilization</th>
              <th>Revenue</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            ${report.top_performers.map(v => `
              <tr>
                <td>${v.brand} ${v.model}</td>
                <td>${v.registration_number}</td>
                <td>${v.utilization_rate.toFixed(1)}%</td>
                <td>${v.total_revenue.toLocaleString()} DA</td>
                <td>${v.profit.toLocaleString()} DA</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>Maintenance Alerts</h2>
        <table>
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Registration</th>
              <th>Current Mileage</th>
              <th>KM Overdue</th>
            </tr>
          </thead>
          <tbody>
            ${report.maintenance_alerts.map(v => `
              <tr>
                <td>${v.vehicle}</td>
                <td>${v.registration}</td>
                <td>${v.current_mileage.toLocaleString()} km</td>
                <td style="color: ${v.km_overdue > 0 ? '#ef4444' : '#10b981'}">
                  ${v.km_overdue > 0 ? v.km_overdue : 0} km
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (type === 'customer') {
    content = `
      <div class="header">
        <h1>Customer Insights Report</h1>
        <div class="subtitle">
          Period: ${new Date(report.period.start).toLocaleDateString()} - ${new Date(report.period.end).toLocaleDateString()}
        </div>
        <div class="subtitle">Generated: ${new Date(report.generated_at).toLocaleString()}</div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <h3>Total Customers</h3>
          <div class="value">${report.customer_segmentation.total_customers}</div>
        </div>
        <div class="summary-card">
          <h3>New Customers</h3>
          <div class="value">${report.retention_metrics.new_customers}</div>
        </div>
        <div class="summary-card">
          <h3>Retention Rate</h3>
          <div class="value">${report.retention_metrics.retention_rate.toFixed(1)}%</div>
        </div>
      </div>

      <div class="section">
        <h2>Customer Segmentation</h2>
        <table>
          <thead>
            <tr>
              <th>Segment</th>
              <th>Customer Count</th>
              <th>Total Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>VIP (Platinum)</td>
              <td>${report.customer_segmentation.segments.vip.count}</td>
              <td>${report.customer_segmentation.segments.vip.total_value.toLocaleString()} DA</td>
            </tr>
            <tr>
              <td>High Value (Gold)</td>
              <td>${report.customer_segmentation.segments.high_value.count}</td>
              <td>${report.customer_segmentation.segments.high_value.total_value.toLocaleString()} DA</td>
            </tr>
            <tr>
              <td>Medium Value (Silver)</td>
              <td>${report.customer_segmentation.segments.medium_value.count}</td>
              <td>${report.customer_segmentation.segments.medium_value.total_value.toLocaleString()} DA</td>
            </tr>
            <tr>
              <td>Low Value (Bronze)</td>
              <td>${report.customer_segmentation.segments.low_value.count}</td>
              <td>${report.customer_segmentation.segments.low_value.total_value.toLocaleString()} DA</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // Add charts section for executive report
  if (type === 'executive') {
    if (charts.revenueTrend) {
      content += `
        <div class="section">
          <h2>Revenue Trend Analysis</h2>
          <div class="chart-container">
            <img src="data:image/png;base64,${charts.revenueTrend.toString('base64')}" alt="Revenue Trend Chart" />
          </div>
        </div>
      `;
    }
    
    if (charts.paymentMethods) {
      content += `
        <div class="section">
          <h2>Payment Methods Distribution</h2>
          <div class="chart-container">
            <img src="data:image/png;base64,${charts.paymentMethods.toString('base64')}" alt="Payment Methods Chart" />
          </div>
        </div>
      `;
    }
    
    if (charts.fleetStatus) {
      content += `
        <div class="section">
          <h2>Fleet Status Overview</h2>
          <div class="chart-container">
            <img src="data:image/png;base64,${charts.fleetStatus.toString('base64')}" alt="Fleet Status Chart" />
          </div>
        </div>
      `;
    }
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${type} Report</title>
      ${styles}
    </head>
    <body>
      ${content}
      <div class="footer">
        Car Rental Management System | Report generated on ${new Date().toLocaleString()}
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate PDF from HTML
 */
const generateReportPDF = async (report, type) => {
  let browser;
  try {
    // Generate charts first
    console.log('📊 Generating charts for report...');
    const charts = await generateChartsForReport(report, type);
    console.log('✅ Charts generated:', Object.keys(charts));

    // Generate HTML with embedded charts
    const html = generateReportHTML(report, type, charts);

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    return pdfBuffer;
  } catch (error) {
    console.error('💥 PDF generation error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = {
  generateReportPDF,
};