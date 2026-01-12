import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const error = searchParams.get('error');
    
    console.log('Auth error occurred:', error);
    
    // Return a proper error response
    return NextResponse.json({
      success: false,
      error: error || 'Authentication error occurred',
      message: 'Authentication failed. Please try again.',
      timestamp: new Date().toISOString(),
    }, { status: 401 });
  } catch (error) {
    console.error('Error handling auth error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}