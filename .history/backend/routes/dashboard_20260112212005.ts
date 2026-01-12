import express from 'express';

const router = express.Router();

// Dashboard overview data
router.get('/overview', (req, res) => {
  // Mock dashboard data
  const overviewData = {
    totalRevenue: 125000,
    totalExpenses: 85000,
    netProfit: 40000,
    cashFlow: 25000,
    runwayMonths: 18,
    burnRate: 5000,
    monthlyGrowth: 12.5,
    activeCustomers: 1250
  };

  res.json({
    success: true,
    data: overviewData
  });
});

// Get dashboard widgets
router.get('/widgets', (req, res) => {
  const widgets = [
    {
      id: 'revenue',
      title: 'Total Revenue',
      value: '$125,000',
      change: '+12.5%',
      trend: 'up'
    },
    {
      id: 'expenses',
      title: 'Total Expenses',
      value: '$85,000',
      change: '+5.2%',
      trend: 'up'
    },
    {
      id: 'profit',
      title: 'Net Profit',
      value: '$40,000',
      change: '+25.8%',
      trend: 'up'
    },
    {
      id: 'runway',
      title: 'Runway',
      value: '18 months',
      change: '+2 months',
      trend: 'up'
    }
  ];

  res.json({
    success: true,
    data: widgets
  });
});

export { router as dashboardRoutes };