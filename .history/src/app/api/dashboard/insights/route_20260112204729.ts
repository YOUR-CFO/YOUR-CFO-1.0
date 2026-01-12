import { NextResponse } from 'next/server';

// Mock data for insights
const generateMockInsights = () => [
  {
    id: '1',
    title: 'Cash Flow Warning',
    description: 'Your cash flow has been negative for the past 2 months. Consider reducing expenses or increasing revenue.',
    type: 'cash-flow',
    severity: 'warning' as const,
    category: 'Financial Health',
    actionable: true,
    createdAt: new Date(Date.now() - 86400000),
    read: false,
  },
  {
    id: '2',
    title: 'Runway Optimization Opportunity',
    description: 'By reducing monthly burn rate by 10%, you can extend your runway by 2.3 months.',
    type: 'runway',
    severity: 'info' as const,
    category: 'Strategic Planning',
    actionable: true,
    createdAt: new Date(Date.now() - 172800000),
    read: true,
  },
  {
    id: '3',
    title: 'High Expense Category Detected',
    description: 'Marketing expenses have increased by 35% this month compared to last month.',
    type: 'expense',
    severity: 'info' as const,
    category: 'Expense Management',
    actionable: false,
    createdAt: new Date(Date.now() - 259200000),
    read: false,
  },
  {
    id: '4',
    title: 'Revenue Growth Trend',
    description: 'Revenue has grown by 15% month-over-month for the past 3 months. Excellent performance!',
    type: 'revenue',
    severity: 'info' as const,
    category: 'Revenue Analysis',
    actionable: false,
    createdAt: new Date(Date.now() - 345600000),
    read: true,
  },
];

export async function GET() {
  try {
    const insights = generateMockInsights();
    return NextResponse.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch insights data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}