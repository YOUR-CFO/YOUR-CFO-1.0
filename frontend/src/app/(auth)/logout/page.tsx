'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    const handleLogout = async () => {
      await logout();
      router.push('/login');
    };

    handleLogout();
  }, [router, logout]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="border-0 shadow-xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Virtual AI CFO</span>
          </div>
          <CardTitle>Logging out...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600">Please wait while we log you out.</p>
        </CardContent>
      </Card>
    </div>
  );
}