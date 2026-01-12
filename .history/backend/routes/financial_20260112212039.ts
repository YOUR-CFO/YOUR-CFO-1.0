import express from 'express';

const router = express.Router();

// Get cash flow data
router.get('/cash-flow', (req, res) => {
  const cashFlowData = {
    monthlyData: [
      { month: 'Jan', income: 25000, expenses: 18000, net: 7000 },
      { month: 'Feb', income: 28000, expenses: 19000, net: 9000 },
      { month: 'Mar', income: 32000, expenses: 20000, net: 12000 },
      { month: 'Apr', income: 30000, expenses: 21000, net: 9000 },
      { month: 'May', income: 35000, expenses: 22000, net: 13000 },
      { month: 'Jun', income: 38000, expenses: 23000, net: 15000 }
    ],
    summary: {
      totalIncome: 188000,
      totalExpenses: 121000,
      netCashFlow: 67000,
      averageMonthlyIncome: 31333,
      averageMonthlyExpenses: 20167,
      averageMonthlyNet: 11167
    }
  };

  res.json({
    success: true,
    data: cashFlowData
  });
});

// Get expense categories
router.get('/expenses/categories', (req, res) => {
  const expenseCategories = [
    { name: 'Salaries', value: 45000, color: '#3B82F6' },
    { name: 'Marketing', value: 15000, color: '#10B981' },
    { name: 'Office', value: 8000, color: '#F59E0B' },
    { name: 'Technology', value: 12000, color: '#EF4444' },
    { name: 'Other', value: 5000, color: '#8B5CF6' }
  ];

  res.json({
    success: true,
    data: expenseCategories
  });
});

// Get runway simulation data
router.get('/runway/simulation', (req, res) => {
  const simulationData = {
    currentRunway: 18,
    scenarios: [
      {
        name: 'Current Burn Rate',
        months: 18,
        color: '#3B82F6'
      },
      {
        name: '25% Reduction',
        months: 24,
        color: '#10B981'
      },
      {
        name: '50% Reduction',
        months: 36,
        color: '#F59E0B'
      }
    ],
    monthlyProjection: [
      { month: 1, cash: 250000 },
      { month: 2, cash: 245000 },
      { month: 3, cash: 240000 },
      { month: 4, cash: 235000 },
      { month: 5, cash: 230000 },
      { month: 6, cash: 225000 },
      { month: 7, cash: 220000 },
      { month: 8, cash: 215000 },
      { month: 9, cash: 210000 },
      { month: 10, cash: 205000 },
      { month: 11, cash: 200000 },
      { month: 12, cash: 195000 }
    ]
  };

  res.json({
    success: true,
    data: simulationData
  });
});

export { router as financialRoutes };