// src/utils/pdfGenerator.util.js
const puppeteer = require('puppeteer');
const { generateChartsForReport } = require('./chartGenerator.util');

/**
 * Generate HTML content for report with embedded charts
 */
const generateReportHTML = (report, type, charts = {}) => {
  const styles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
      
      body {
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        background: #FFFFFF;
        color: #1F2937;
        padding: 32px;
        margin: 0;
        line-height: 1.6;
      }
      
      .header {
        text-align: center;
        margin-bottom: 48px;
        padding-bottom: 24px;
        border-bottom: 2px solid #E5E7EB;
        position: relative;
      }
      
      .header::before {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 50%;
        transform: translateX(-50%);
        width: 80px;
        height: 2px;
        background: #22C55E;
        border-radius: 1px;
      }
      
      .header h1 {
        color: #1F2937;
        margin: 0 0 16px 0;
        font-size: 32px;
        font-weight: 800;
        letter-spacing: -0.02em;
      }
      
      .header .subtitle {
        color: #6B7280;
        margin: 8px 0;
        font-size: 14px;
        font-weight: 500;
      }
      
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        margin-bottom: 48px;
      }
      
      .summary-card {
        background: #F9FAFB;
        padding: 24px;
        border-radius: 16px;
        border: 1px solid #E5E7EB;
        border-left: 4px solid #22C55E;
        transition: all 0.3s ease;
      }
      
      .summary-card:hover {
        background: #F3F4F6;
        border-color: #D1D5DB;
        transform: translateY(-2px);
      }
      
      .summary-card h3 {
        margin: 0 0 12px 0;
        color: #6B7280;
        font-size: 13px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      
      .summary-card .value {
        font-size: 32px;
        font-weight: 800;
        color: #1F2937;
        margin-bottom: 8px;
        letter-spacing: -0.02em;
      }
      
      .summary-card .change {
        font-size: 13px;
        margin-top: 8px;
        font-weight: 600;
      }
      
      .change.positive { 
        color: #22C55E; 
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .change.negative { 
        color: #EF4444;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 24px 0;
        background: #F9FAFB;
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid #E5E7EB;
      }
      
      th {
        background: #F3F4F6;
        color: #1F2937;
        padding: 16px;
        text-align: left;
        font-weight: 700;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        border-bottom: 1px solid #E5E7EB;
      }
      
      td {
        padding: 16px;
        border-bottom: 1px solid #E5E7EB;
        color: #374151;
        font-size: 14px;
      }
      
      tr:last-child td {
        border-bottom: none;
      }
      
      tr:hover {
        background: #F3F4F6;
      }
      
      .section {
        margin: 48px 0;
      }
      
      .section h2 {
        color: #1F2937;
        border-bottom: 2px solid #E5E7EB;
        padding-bottom: 12px;
        margin-bottom: 24px;
        font-size: 20px;
        font-weight: 700;
        letter-spacing: -0.02em;
        position: relative;
      }
      
      .section h2::before {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 60px;
        height: 2px;
        background: #22C55E;
        border-radius: 1px;
      }
      
      .footer {
        margin-top: 72px;
        text-align: center;
        color: #6B7280;
        font-size: 12px;
        border-top: 1px solid #E5E7EB;
        padding-top: 24px;
        font-weight: 500;
      }
      
      .chart-container {
        margin: 36px 0;
        text-align: center;
      }
      
      .chart-container img {
        max-width: 100%;
        height: auto;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        border: 1px solid #E5E7EB;
      }
      
      .highlight {
        color: #22C55E;
        font-weight: 600;
      }
      
      .accent-text {
        color: #60A5FA;
        font-weight: 600;
      }
      
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
      }
    </style>
  `;

  let content = '';

  if (type === 'executive') {
    content = `
      <div class="header">
        <h1>Executive Summary Report</h1>
        <div class="subtitle">
          <span class="accent-text">Period:</span> ${new Date(report.period.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(report.period.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
        <div class="subtitle">
          <span class="accent-text">Generated:</span> ${new Date(report.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <h3>Total Revenue</h3>
          <div class="value">${report.summary.total_revenue.toLocaleString()} <span style="font-size: 20px; font-weight: 600;">DA</span></div>
          <div class="change ${report.summary.revenue_growth >= 0 ? 'positive' : 'negative'}">
            ${report.summary.revenue_growth >= 0 ? '↑' : '↓'} ${Math.abs(report.summary.revenue_growth).toFixed(1)}% vs last period
          </div>
        </div>
        <div class="summary-card">
          <h3>Fleet Utilization</h3>
          <div class="value">${report.summary.fleet_utilization.toFixed(1)}<span style="font-size: 20px; font-weight: 600;">%</span></div>
          <div class="change" style="color: #6B7280; font-weight: 400;">
            ${report.summary.fleet_utilization >= 70 ? 'Excellent' : report.summary.fleet_utilization >= 50 ? 'Good' : 'Needs Attention'}
          </div>
        </div>
        <div class="summary-card">
          <h3>Active Contracts</h3>
          <div class="value">${report.summary.total_contracts}</div>
          <div class="change" style="color: #6B7280; font-weight: 400;">
            Currently running
          </div>
        </div>
        <div class="summary-card">
          <h3>Active Customers</h3>
          <div class="value">${report.summary.active_customers}</div>
          <div class="change" style="color: #6B7280; font-weight: 400;">
            This period
          </div>
        </div>
        <div class="summary-card">
          <h3>New Customers</h3>
          <div class="value">${report.summary.new_customers}</div>
          <div class="change ${report.summary.new_customers > 0 ? 'positive' : 'negative'}">
            ${report.summary.new_customers > 0 ? '↑' : '→'} ${report.summary.new_customers > 0 ? 'Growth' : 'No change'}
          </div>
        </div>
        <div class="summary-card">
          <h3>Maintenance Alerts</h3>
          <div class="value" style="color: ${report.summary.maintenance_alerts > 0 ? '#EF4444' : '#22C55E'};">${report.summary.maintenance_alerts}</div>
          <div class="change" style="color: ${report.summary.maintenance_alerts > 0 ? '#EF4444' : '#22C55E'};">
            ${report.summary.maintenance_alerts > 0 ? '⚠️ Action Required' : '✓ All Clear'}
          </div>
        </div>
      </div>

      <div class="section">
        <h2>🏆 Top Performing Vehicles</h2>
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
            ${report.top_vehicles.map((v, index) => `
              <tr>
                <td><strong>${v.brand} ${v.model}</strong></td>
                <td><span class="accent-text">${v.registration_number}</span></td>
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="flex: 1; height: 4px; background: #E5E7EB; border-radius: 2px; overflow: hidden;">
                      <div style="width: ${Math.min(v.utilization_rate, 100)}%; height: 100%; background: #22C55E; border-radius: 2px;"></div>
                    </div>
                    <span class="highlight">${v.utilization_rate.toFixed(1)}%</span>
                  </div>
                </td>
                <td><strong>${v.total_revenue.toLocaleString()}</strong> DA</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>👥 Top Customers by Lifetime Value</h2>
        <table>
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Type</th>
              <th>Total Rentals</th>
              <th>Lifetime Value</th>
            </tr>
          </thead>
          <tbody>
            ${report.top_customers.map((c, index) => `
              <tr>
                <td><strong>${c.name}</strong></td>
                <td><span style="text-transform: capitalize; padding: 4px 8px; background: rgba(96,165,250,0.1); border-radius: 6px; font-size: 12px;">${c.type}</span></td>
                <td>${c.total_rentals}</td>
                <td><strong class="highlight">${c.lifetime_value.toLocaleString()}</strong> DA</td>
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
        <div style="margin-bottom: 8px;">
          <span class="highlight">Car Manager</span> - Professional Car Rental Management System
        </div>
        <div>
          Report generated on ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
        <div style="margin-top: 8px; font-size: 11px; opacity: 0.7;">
          Confidential & Proprietary Information
        </div>
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