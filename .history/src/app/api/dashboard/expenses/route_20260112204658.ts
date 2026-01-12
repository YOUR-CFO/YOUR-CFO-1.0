import { NextResponse } from 'next/server';

// Mock data for expenses
const generateMockExpenses = () => [
  {
    id: '1',
    date: new Date('2024-01-15'),
    description: 'Software Subscription',
    amount: 299,
    category: 'Technology',
    vendor: 'Stripe',
    status: 'paid' as const,
  },
  {
    id: '2',
    date: new Date('2024-01-14'),
    description: 'Office Rent',
    amount: 4500,
    category: 'Operations',
    vendor: 'Property Management',
    status: 'paid' as const,
  },
  {
    id: '3',
    date: new Date('2024-01-13'),
    description: 'Marketing Campaign',
    amount: 2500,
    category: 'Marketing',
    vendor: 'Google Ads',
    status: 'pending' as const,
  },
  {
    id: '4',
    date: new Date('2024-01-12'),
    description: 'Team Lunch',
    amount: 180,
    category: 'Food',
    vendor: 'Local Restaurant',
    status: 'paid' as const,
  },
  {
    id: '5',
    date: new Date('2024-01-11'),
    description: 'Cloud Hosting',
    amount: 850,
    category: 'Technology',
    vendor: 'AWS',
    status: 'paid' as const,
  },
];

export async function GET() {
  try {
    const expenses = generateMockExpenses();
    return NextResponse.json({
      success: true,
      data: expenses,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch expenses data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}