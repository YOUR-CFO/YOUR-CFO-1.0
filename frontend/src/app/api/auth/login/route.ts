import { NextRequest, NextResponse } from 'next/server';
import { authApi } from '@/lib/api/services';
import { signToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate credentials using the existing mock API
    const response = await authApi.login(email, password);

    if (!response.success || !response.data) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await signToken(response.data.user);

    // Set HTTP-only cookie
    const responseWithCookie = NextResponse.json({
      success: true,
      data: {
        user: response.data.user,
        token,
        expiresAt: response.data.expiresAt,
      },
    });

    responseWithCookie.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return responseWithCookie;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}