'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { dashboardApi } from '@/lib/api/services';
import { format } from 'date-fns';

export default function CashFlowPage() {
  const [dateRange, setDateRange] = useState({
    start: format(new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data: cashFlowData, isLoading } = useQuery({
    queryKey: ['cash-flow', dateRange],
    queryFn: () => dashboardApi.getCashFlow(),
  });

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Cash Flow Analysis</h1>
          <p className="text-gray-600">Track your money in and money out</p>
        </div>
        
        {/* Date Range Filter */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="start-date" className="text-sm font-medium">
              From
            </Label>
            <Input
              id="start-date"
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
              className="w-32"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="end-date" className="text-sm font-medium">
              To
            </Label>
            <Input
              id="end-date"
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
              className="w-32"
            />
          </div>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Last 6 Months
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inflow</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${cashFlowData?.data?.reduce((sum, item) => sum + item.inflow, 0)?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Money coming in
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outflow</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${cashFlowData?.data?.reduce((sum, item) => sum + item.outflow, 0)?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Money going out
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (cashFlowData?.data?.reduce((sum, item) => sum + (item.netFlow ?? 0), 0) || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${cashFlowData?.data?.reduce((sum, item) => sum + (item.netFlow ?? 0), 0)?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Inflow minus outflow
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Cash Flow Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {cashFlowData?.data && cashFlowData.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={cashFlowData.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="inflow"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Inflow"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="outflow"
                  stroke="#ef4444"
                  strokeWidth={3}
                  name="Outflow"
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="Net Flow"
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No cash flow data available for the selected date range
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Cash Flow Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {cashFlowData?.data && cashFlowData.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cashFlowData.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="inflow" fill="#10b981" name="Inflow" />
                <Bar dataKey="outflow" fill="#ef4444" name="Outflow" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">
              No monthly breakdown data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cash Flow Insights */}
      {/* TODO: Add insights when API supports it */}
    </div>
  );
}