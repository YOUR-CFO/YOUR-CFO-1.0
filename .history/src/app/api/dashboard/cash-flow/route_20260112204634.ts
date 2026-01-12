import { NextResponse } from 'next/server';

// Mock data for cash flow
const generateMockCashFlow = () => [
  { month: 'Jan', inflow: 120000, outflow: 95000, netFlow: 25000 },
  { month: 'Feb', inflow: 135000, outflow: 98000, netFlow: 37000 },
  { month: 'Mar', inflow: 110000, outflow: 102000, netFlow: 8000 },
  { month: 'Apr', inflow: 145000, outflow: 105000, netFlow: 40000 },
  { month: 'May', inflow: 130000, outflow: 108000, netFlow: 22000 },
  { month: 'Jun', inflow: 155000, outflow: 112000, netFlow: 43000 },
];

export async function GET() {
  try {
    const cashFlow = generateMockCashFlow();
    return NextResponse.json({
      success: true,
      data: cashFlow,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch cash flow data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}