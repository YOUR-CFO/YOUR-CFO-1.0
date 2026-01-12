import { NextResponse } from 'next/server';

// Mock data for dashboard overview
const generateMockOverview = () => ({
  cashInBank: 1250000,
  monthlyBurnRate: 85000,
  runwayMonths: 14.7,
  alerts: [
    {
      id: '1',
      type: 'warning' as const,
      title: 'High Burn Rate Alert',
      description: 'Your monthly burn rate has increased by 15% this month',
      createdAt: new Date(),
      read: false,
    },
    {
      id: '2',
      type: 'info' as const,
      title: 'New Investment Received',
      description: '$500K seed funding has been deposited',
      createdAt: new Date(Date.now() - 86400000),
      read: true,
    },
  ],
  lastUpdated: new Date(),
});

export async function GET() {
  try {
    const overview = generateMockOverview();
    return NextResponse.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch overview data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}