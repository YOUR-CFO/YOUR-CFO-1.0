import { NextResponse } from 'next/server';

// Mock data for reports
const generateMockReports = () => [
  {
    id: '1',
    title: 'Monthly Financial Report',
    description: 'Comprehensive overview of financial performance for January 2024',
    type: 'financial',
    status: 'ready' as const,
    createdAt: new Date(Date.now() - 86400000),
    downloadUrl: '/reports/monthly-financial-report-jan-2024.pdf',
    size: '2.5 MB',
  },
  {
    id: '2',
    title: 'Cash Flow Analysis',
    description: 'Detailed cash flow analysis and projections for Q1 2024',
    type: 'cash-flow',
    status: 'ready' as const,
    createdAt: new Date(Date.now() - 172800000),
    downloadUrl: '/reports/cash-flow-analysis-q1-2024.pdf',
    size: '1.8 MB',
  },
  {
    id: '3',
    title: 'Expense Report',
    description: 'Breakdown of expenses by category for January 2024',
    type: 'expense',
    status: 'generating' as const,
    createdAt: new Date(Date.now() - 3600000),
    downloadUrl: null,
    size: null,
  },
  {
    id: '4',
    title: 'Runway Simulation Report',
    description: 'Runway projections based on current burn rate and revenue trends',
    type: 'runway',
    status: 'ready' as const,
    createdAt: new Date(Date.now() - 259200000),
    downloadUrl: '/reports/runway-simulation-report.pdf',
    size: '3.2 MB',
  },
];

export async function GET() {
  try {
    const reports = generateMockReports();
    return NextResponse.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch reports data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}