// src/utils/chartGenerator.util.js
const { Chart } = require('chart.js/auto');
const { createCanvas } = require('canvas');

/**
 * Chart Generator Utility
 * Generates chart images for PDF reports using Chart.js
 */

// ============================================
// HELPER: Create Chart Canvas
// ============================================
const createChartCanvas = (width = 800, height = 400) => {
  return createCanvas(width, height);
};

// ============================================
// CHART 1: Revenue Trend Line Chart
// ============================================
const generateRevenueTrendChart = async (revenueByDay) => {
  const canvas = createChartCanvas();
  const ctx = canvas.getContext('2d');

  const labels = revenueByDay.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  const data = revenueByDay.map(d => d.revenue);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Daily Revenue (DZD)',
        data: data,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      }],
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: { size: 14, weight: 'bold' },
            color: '#111827',
          },
        },
        title: {
          display: true,
          text: 'Revenue Trend Over Time',
          font: { size: 18, weight: 'bold' },
          color: '#111827',
          padding: 20,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 12 },
            color: '#6b7280',
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: '#e5e7eb' },
          ticks: {
            font: { size: 12 },
            color: '#6b7280',
            callback: (value) => value.toLocaleString() + ' DA',
          },
        },
      },
    },
  });

  return canvas.toBuffer('image/png');
};

// ============================================
// CHART 2: Payment Methods Pie Chart
// ============================================
const generatePaymentMethodsChart = async (revenueByMethod) => {
  const canvas = createChartCanvas(600, 400);
  const ctx = canvas.getContext('2d');

  const labels = revenueByMethod.map(m => m.method.charAt(0).toUpperCase() + m.method.slice(1));
  const data = revenueByMethod.map(m => m.amount);
  
  const colors = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
  ];

  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors.slice(0, data.length),
        borderColor: '#ffffff',
        borderWidth: 3,
      }],
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            font: { size: 14 },
            color: '#111827',
            padding: 15,
          },
        },
        title: {
          display: true,
          text: 'Revenue by Payment Method',
          font: { size: 18, weight: 'bold' },
          color: '#111827',
          padding: 20,
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value.toLocaleString()} DA (${percentage}%)`;
            },
          },
        },
      },
    },
  });

  return canvas.toBuffer('image/png');
};

// ============================================
// CHART 3: Vehicle Utilization Bar Chart
// ============================================
const generateVehicleUtilizationChart = async (vehicles) => {
  const canvas = createChartCanvas(800, 500);
  const ctx = canvas.getContext('2d');

  // Take top 10 vehicles
  const topVehicles = vehicles.slice(0, 10);
  const labels = topVehicles.map(v => `${v.brand} ${v.model}\n${v.registration_number}`);
  const data = topVehicles.map(v => v.utilization_rate);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Utilization Rate (%)',
        data: data,
        backgroundColor: data.map(rate => {
          if (rate >= 80) return '#10b981'; // Green - High
          if (rate >= 60) return '#3b82f6'; // Blue - Medium
          if (rate >= 40) return '#f59e0b'; // Amber - Low
          return '#ef4444'; // Red - Very Low
        }),
        borderColor: '#ffffff',
        borderWidth: 2,
      }],
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: 'Top 10 Vehicles by Utilization Rate',
          font: { size: 18, weight: 'bold' },
          color: '#111827',
          padding: 20,
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.parsed.y.toFixed(1)}%`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 10 },
            color: '#6b7280',
            maxRotation: 45,
            minRotation: 45,
          },
        },
        y: {
          beginAtZero: true,
          max: 100,
          grid: { color: '#e5e7eb' },
          ticks: {
            font: { size: 12 },
            color: '#6b7280',
            callback: (value) => value + '%',
          },
        },
      },
    },
  });

  return canvas.toBuffer('image/png');
};

// ============================================
// CHART 4: Fleet Status Doughnut Chart
// ============================================
const generateFleetStatusChart = async (fleetOverview) => {
  const canvas = createChartCanvas(600, 400);
  const ctx = canvas.getContext('2d');

  const labels = ['Available', 'Rented', 'Maintenance'];
  const data = [
    fleetOverview.available,
    fleetOverview.active_rentals,
    fleetOverview.maintenance,
  ];

  const colors = ['#10b981', '#3b82f6', '#f59e0b'];

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderColor: '#ffffff',
        borderWidth: 3,
      }],
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            font: { size: 14 },
            color: '#111827',
            padding: 15,
          },
        },
        title: {
          display: true,
          text: 'Fleet Status Distribution',
          font: { size: 18, weight: 'bold' },
          color: '#111827',
          padding: 20,
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} vehicles (${percentage}%)`;
            },
          },
        },
      },
    },
  });

  return canvas.toBuffer('image/png');
};

// ============================================
// CHART 5: Customer Segmentation Bar Chart
// ============================================
const generateCustomerSegmentationChart = async (segments) => {
  const canvas = createChartCanvas(700, 400);
  const ctx = canvas.getContext('2d');

  const labels = ['VIP', 'High Value', 'Medium Value', 'Low Value'];
  const counts = [
    segments.vip.count,
    segments.high_value.count,
    segments.medium_value.count,
    segments.low_value.count,
  ];
  const values = [
    segments.vip.total_value,
    segments.high_value.total_value,
    segments.medium_value.total_value,
    segments.low_value.total_value,
  ];

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Customer Count',
          data: counts,
          backgroundColor: '#3b82f6',
          borderColor: '#ffffff',
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: 'Total Value (DZD)',
          data: values,
          backgroundColor: '#10b981',
          borderColor: '#ffffff',
          borderWidth: 2,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: { size: 14 },
            color: '#111827',
          },
        },
        title: {
          display: true,
          text: 'Customer Segmentation by Value',
          font: { size: 18, weight: 'bold' },
          color: '#111827',
          padding: 20,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 12 },
            color: '#6b7280',
          },
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          grid: { color: '#e5e7eb' },
          ticks: {
            font: { size: 12 },
            color: '#6b7280',
          },
          title: {
            display: true,
            text: 'Number of Customers',
            font: { size: 12, weight: 'bold' },
            color: '#6b7280',
          },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          beginAtZero: true,
          grid: { display: false },
          ticks: {
            font: { size: 12 },
            color: '#6b7280',
            callback: (value) => (value / 1000).toFixed(0) + 'K',
          },
          title: {
            display: true,
            text: 'Total Value (DZD)',
            font: { size: 12, weight: 'bold' },
            color: '#6b7280',
          },
        },
      },
    },
  });

  return canvas.toBuffer('image/png');
};

// ============================================
// CHART 6: Booking Patterns by Weekday
// ============================================
const generateBookingPatternsChart = async (bookingsByWeekday) => {
  const canvas = createChartCanvas(700, 400);
  const ctx = canvas.getContext('2d');

  const labels = bookingsByWeekday.map(d => d.day);
  const data = bookingsByWeekday.map(d => d.count);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Number of Bookings',
        data: data,
        backgroundColor: '#8b5cf6',
        borderColor: '#ffffff',
        borderWidth: 2,
      }],
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: 'Booking Patterns by Day of Week',
          font: { size: 18, weight: 'bold' },
          color: '#111827',
          padding: 20,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 12 },
            color: '#6b7280',
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: '#e5e7eb' },
          ticks: {
            font: { size: 12 },
            color: '#6b7280',
          },
        },
      },
    },
  });

  return canvas.toBuffer('image/png');
};

// ============================================
// MAIN: Generate Charts Based on Report Type
// ============================================
const generateChartsForReport = async (report, reportType) => {
  const charts = {};

  try {
    if (reportType === 'executive') {
      // Revenue trend chart
      if (report.trends && report.trends.length > 0) {
        charts.revenueTrend = await generateRevenueTrendChart(report.trends);
      }

      // Payment methods pie chart
      if (report.revenue_breakdown?.by_method && report.revenue_breakdown.by_method.length > 0) {
        charts.paymentMethods = await generatePaymentMethodsChart(report.revenue_breakdown.by_method);
      }

      // Fleet status doughnut chart
      if (report.fleet_overview) {
        charts.fleetStatus = await generateFleetStatusChart(report.fleet_overview);
      }

      // Top vehicles utilization
      if (report.top_vehicles && report.top_vehicles.length > 0) {
        charts.vehicleUtilization = await generateVehicleUtilizationChart(report.top_vehicles);
      }
    } else if (reportType === 'vehicle') {
      // Vehicle utilization bar chart
      if (report.all_vehicles && report.all_vehicles.length > 0) {
        charts.vehicleUtilization = await generateVehicleUtilizationChart(report.all_vehicles);
      }
    } else if (reportType === 'customer') {
      // Customer segmentation chart
      if (report.customer_segmentation?.segments) {
        charts.customerSegmentation = await generateCustomerSegmentationChart(
          report.customer_segmentation.segments
        );
      }

      // Booking patterns chart
      if (report.booking_patterns?.by_weekday) {
        charts.bookingPatterns = await generateBookingPatternsChart(
          report.booking_patterns.by_weekday
        );
      }
    }

    return charts;
  } catch (error) {
    console.error('💥 Chart generation error:', error);
    return {};
  }
};

module.exports = {
  generateChartsForReport,
  generateRevenueTrendChart,
  generatePaymentMethodsChart,
  generateVehicleUtilizationChart,
  generateFleetStatusChart,
  generateCustomerSegmentationChart,
  generateBookingPatternsChart,
};