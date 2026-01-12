'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home, LogIn } from 'lucide-react';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(errorParam);
    } else {
      setError('An unknown authentication error occurred');
    }
  }, [searchParams]);

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration. Please contact support.';
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      case 'Default':
        return 'An authentication error occurred. Please try again.';
      default:
        return 'An unexpected error occurred during authentication. Please try again.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <span className="text-2xl font-bold text-gray-900">Authentication Error</span>
          </div>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-red-600">Sign In Failed</CardTitle>
            <CardDescription>
              {getErrorMessage(error)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    <strong>Error Code:</strong> {error}
                  </p>
                </div>
              )}

              <div className="flex flex-col space-y-3">
                <Button asChild variant="default">
                  <Link href="/login" className="flex items-center justify-center">
                    <LogIn className="mr-2 h-4 w-4" />
                    Try Again
                  </Link>
                </Button>
                
                <Button asChild variant="outline">
                  <Link href="/" className="flex items-center justify-center">
                    <Home className="mr-2 h-4 w-4" />
                    Go Home
                  </Link>
                </Button>
              </div>

              <div className="text-center text-sm text-gray-600">
                <p>Having trouble signing in?</p>
                <p>
                  <Link href="/forgot-password" className="text-blue-600 hover:text-blue-800">
                    Reset your password
                  </Link>
                  {' or contact support'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}