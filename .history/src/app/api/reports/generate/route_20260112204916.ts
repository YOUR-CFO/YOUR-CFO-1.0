import { NextResponse } from 'next/server';

// Mock report generation
const generateMockReport = (type: string) => ({
  id: Math.random().toString(36).substr(2, 9),
  title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
  description: `Generated ${type} report for ${new Date().toLocaleDateString()}`,
  type: type,
  status: 'ready' as const,
  createdAt: new Date(),
  downloadUrl: `/reports/${type}-report-${Date.now()}.pdf`,
  size: '2.1 MB',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type = 'financial' } = body;
    
    // Simulate report generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const report = generateMockReport(type);
    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate report',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}