import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { AuthProvider } from '@/components/auth-provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Virtual AI CFO - Financial Intelligence for Startups',
  description: 'AI-powered financial dashboard for startup founders and CFOs',
  keywords: 'startup, finance, CFO, AI, dashboard, runway, cash flow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}