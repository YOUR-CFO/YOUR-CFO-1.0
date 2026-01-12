import { NextResponse } from 'next/server';

// Mock data for expense categories
const generateMockExpenseCategories = () => [
  { name: 'Technology', amount: 8500, percentage: 35, color: '#3B82F6' },
  { name: 'Marketing', amount: 6200, percentage: 25, color: '#10B981' },
  { name: 'Operations', amount: 4500, percentage: 18, color: '#F59E0B' },
  { name: 'Salaries', amount: 3200, percentage: 13, color: '#EF4444' },
  { name: 'Food', amount: 1200, percentage: 5, color: '#8B5CF6' },
  { name: 'Other', amount: 800, percentage: 4, color: '#6B7280' },
];

export async function GET() {
  try {
    const categories = generateMockExpenseCategories();
    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch expense categories data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}