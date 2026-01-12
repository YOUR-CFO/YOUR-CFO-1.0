import { NextResponse } from 'next/server';

// Mock data for runway simulation
const generateMockRunwaySimulation = () => ({
  currentRunway: 14.7,
  projectedRunway: 16.2,
  scenarios: [
    {
      name: 'Conservative',
      runway: 16.2,
      monthlyBurnRate: 75000,
      description: 'Reduce burn rate by 12%',
    },
    {
      name: 'Moderate',
      runway: 14.7,
      monthlyBurnRate: 85000,
      description: 'Current trajectory',
    },
    {
      name: 'Aggressive',
      runway: 12.1,
      monthlyBurnRate: 95000,
      description: 'Increase burn rate by 12%',
    },
  ],
  recommendations: [
    'Consider reducing monthly expenses by 10-15% to extend runway',
    'Focus on increasing monthly recurring revenue',
    'Delay non-essential hiring and capital expenditures',
    'Negotiate better terms with vendors and suppliers',
  ],
});

export async function POST() {
  try {
    const simulation = generateMockRunwaySimulation();
    return NextResponse.json({
      success: true,
      data: simulation,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate runway simulation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}