import { 
  User, 
  FinancialOverview, 
  CashFlowData, 
  ExpenseCategory,
  Expense,
  FinancialInsight,
  Report,
  TeamMember,
  RunwaySimulationResult,
  RunwaySimulationInput,
  ApiResponse
} from '@/lib/types';
import { mockApi } from './client';

// Mock data generators
const generateMockUser = (): User => ({
  id: '1',
  email: 'founder@company.com',
  name: 'John Doe',
  role: 'founder',
  companyId: '1',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=faces&auto=format',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date(),
});

const generateMockOverview = (): FinancialOverview => ({
  cashInBank: 1250000,
  monthlyBurnRate: 85000,
  runwayMonths: 14.7,
  alerts: [
    {
      id: '1',
      type: 'warning',
      title: 'High Burn Rate Alert',
      description: 'Your monthly burn rate has increased by 15% this month',
      createdAt: new Date(),
      read: false,
    },
    {
      id: '2',
      type: 'info',
      title: 'New Investment Received',
      description: '$500K seed funding has been deposited',
      createdAt: new Date(Date.now() - 86400000),
      read: true,
    },
  ],
  lastUpdated: new Date(),
});

const generateMockCashFlow = (): CashFlowData[] => [
  { month: 'Jan', inflow: 120000, outflow: 95000, netFlow: 25000 },
  { month: 'Feb', inflow: 135000, outflow: 98000, netFlow: 37000 },
  { month: 'Mar', inflow: 110000, outflow: 102000, netFlow: 8000 },
  { month: 'Apr', inflow: 145000, outflow: 105000, netFlow: 40000 },
  { month: 'May', inflow: 130000, outflow: 108000, netFlow: 22000 },
  { month: 'Jun', inflow: 155000, outflow: 112000, netFlow: 43000 },
];

const generateMockExpenseCategories = (): ExpenseCategory[] => [
  { id: '1', name: 'Salaries', color: '#3b82f6', total: 450000, percentage: 45 },
  { id: '2', name: 'Marketing', color: '#10b981', total: 180000, percentage: 18 },
  { id: '3', name: 'Office', color: '#f59e0b', total: 120000, percentage: 12 },
  { id: '4', name: 'Technology', color: '#8b5cf6', total: 150000, percentage: 15 },
  { id: '5', name: 'Other', color: '#6b7280', total: 100000, percentage: 10 },
];

const generateMockExpenses = (): Expense[] => [
  {
    id: '1',
    vendor: 'Amazon Web Services',
    category: 'Technology',
    amount: 2500,
    date: new Date(Date.now() - 86400000),
    description: 'Cloud hosting services',
    isAnomalous: false,
  },
  {
    id: '2',
    vendor: 'Google Ads',
    category: 'Marketing',
    amount: 15000,
    date: new Date(Date.now() - 172800000),
    description: 'Digital advertising campaign',
    isAnomalous: true,
  },
  {
    id: '3',
    vendor: 'Stripe',
    category: 'Technology',
    amount: 800,
    date: new Date(Date.now() - 259200000),
    description: 'Payment processing fees',
    isAnomalous: false,
  },
];

const generateMockInsights = (): FinancialInsight[] => [
  {
    id: '1',
    title: 'Cash Flow Optimization Opportunity',
    description: 'Your marketing spend efficiency has decreased by 23%. Consider reallocating budget to higher-performing channels.',
    severity: 'warning',
    category: 'Marketing',
    createdAt: new Date(),
    read: false,
  },
  {
    id: '2',
    title: 'Runway Extension Recommendation',
    description: 'With current burn rate, you could extend runway by 3 months by reducing non-essential expenses by 15%.',
    severity: 'info',
    category: 'Runway',
    createdAt: new Date(Date.now() - 86400000),
    read: true,
  },
  {
    id: '3',
    title: 'Critical: High Expense Variance Detected',
    description: 'Technology expenses have increased 45% month-over-month. Immediate review recommended.',
    severity: 'critical',
    category: 'Technology',
    createdAt: new Date(Date.now() - 172800000),
    read: false,
  },
];

const generateMockReports = (): Report[] => [
  {
    id: '1',
    title: 'June 2024 Financial Report',
    type: 'monthly',
    period: 'June 2024',
    generatedAt: new Date(),
    status: 'ready',
    downloadUrl: '#',
  },
  {
    id: '2',
    title: 'Q2 2024 Financial Report',
    type: 'quarterly',
    period: 'Q2 2024',
    generatedAt: new Date(Date.now() - 86400000),
    status: 'ready',
    downloadUrl: '#',
  },
];

const generateMockTeamMembers = (): TeamMember[] => [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@company.com',
    role: 'founder',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=faces&auto=format',
    lastActive: new Date(),
    status: 'active',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@company.com',
    role: 'accountant',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=32&h=32&fit=crop&crop=faces&auto=format',
    lastActive: new Date(Date.now() - 3600000),
    status: 'active',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@company.com',
    role: 'viewer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=faces&auto=format',
    lastActive: new Date(Date.now() - 86400000),
    status: 'inactive',
  },
];

const generateMockTeamData = () => {
  const members = generateMockTeamMembers();
  const byRole = {
    founder: members.filter(m => m.role === 'founder').length,
    accountant: members.filter(m => m.role === 'accountant').length,
    viewer: members.filter(m => m.role === 'viewer').length,
  };
  
  return {
    totalMembers: members.length,
    byRole,
    members,
  };
};

// API Service functions
export const authApi = {
  async login(email: string, password: string) {
    await mockApi.delay();
    if (email === 'demo@company.com' && password === 'password') {
      return {
        success: true,
        data: {
          user: generateMockUser(),
          token: 'mock-jwt-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      };
    }
    return {
      success: false,
      data: {},
      error: 'Invalid credentials',
    };
  },

  async signup() {
    await mockApi.delay();
    return {
      success: true,
      data: {
        user: generateMockUser(),
        token: 'mock-jwt-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    };
  },

  async logout() {
    await mockApi.delay();
    return { success: true, data: {} };
  },

  async forgotPassword(): Promise<ApiResponse<{ message: string }>> {
    await mockApi.delay();
    return { success: true, data: { message: 'Password reset email sent' } };
  },
};

export const dashboardApi = {
  async getOverview() {
    return mockApi.mockResponse(generateMockOverview());
  },

  async getCashFlow() {
    return mockApi.mockResponse(generateMockCashFlow());
  },

  async getExpenseCategories() {
    return mockApi.mockResponse(generateMockExpenseCategories());
  },

  async getExpenses() {
    return mockApi.mockResponse(generateMockExpenses());
  },

  async getInsights() {
    return mockApi.mockResponse(generateMockInsights());
  },

  async getReports() {
    return mockApi.mockResponse(generateMockReports());
  },

  async getTeamMembers() {
    return mockApi.mockResponse(generateMockTeamData());
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async inviteTeamMember(_: { email: string; role: string }) {
    await mockApi.delay(1000);
    return mockApi.mockResponse({ success: true });
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async removeTeamMember(_: string) {
    await mockApi.delay(500);
    return mockApi.mockResponse({ success: true });
  },
};

export const runwayApi = {
  async simulate(inputs: RunwaySimulationInput): Promise<{ success: boolean; data: RunwaySimulationResult }> {
    await mockApi.delay(1200);
    
    const currentBurnRate = 85000;
    const newBurnRate = currentBurnRate + inputs.hiringPlan + inputs.marketingSpend - inputs.revenueGrowth + inputs.otherChanges;
    const currentCash = 1250000;
    const newRunwayMonths = currentCash / newBurnRate;
    
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (newRunwayMonths < 6) riskLevel = 'high';
    else if (newRunwayMonths < 12) riskLevel = 'medium';
    
    const recommendations = [];
    if (newRunwayMonths < 12) {
      recommendations.push('Consider reducing burn rate to extend runway');
    }
    if (inputs.marketingSpend > 20000) {
      recommendations.push('Review marketing spend efficiency');
    }
    if (inputs.hiringPlan > 10000) {
      recommendations.push('Evaluate hiring timeline and priorities');
    }
    
    return {
      success: true,
      data: {
        newBurnRate,
        newRunwayMonths,
        riskLevel,
        recommendations,
      },
    };
  },
};

export const reportsApi = {
  async generateReport(type: 'monthly' | 'quarterly' | 'annual') {
    await mockApi.delay(2000);
    return {
      success: true,
      data: {
        id: Date.now().toString(),
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${new Date().toLocaleDateString()}`,
        type,
        period: new Date().toLocaleDateString(),
        generatedAt: new Date(),
        status: 'ready' as const,
        downloadUrl: '#',
      },
    };
  },

  async downloadReport(): Promise<ApiResponse<{ downloadUrl: string }>> {
    return mockApi.mockResponse({ downloadUrl: 'https://example.com/report.pdf' });
  },

  async emailReport() {
    await mockApi.delay(1000);
    return {
      success: true,
      data: { message: 'Report sent successfully' },
    };
  },
};