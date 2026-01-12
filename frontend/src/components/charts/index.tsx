'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface ChartData {
  name: string;
  value?: number;
  [key: string]: string | number | undefined;
}

interface ChartProps {
  title: string;
  data: ChartData[];
  type: 'line' | 'bar' | 'pie';
  height?: number;
  colors?: string[];
  dataKeys?: string[];
}

const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function Chart({ title, data, type, height = 300, colors = defaultColors, dataKeys = ['value'] }: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {dataKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                name={key.charAt(0).toUpperCase() + key.slice(1)}
              />
            ))}
          </LineChart>
        );
      
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {dataKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                name={key.charAt(0).toUpperCase() + key.slice(1)}
              />
            ))}
          </BarChart>
        );
      
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface CashFlowChartProps {
  data: Array<{
    month: string;
    inflow: number;
    outflow: number;
    net: number;
  }>;
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const chartData = data.map(item => ({
    name: item.month,
    ...item,
  }));
  
  return (
    <Chart
      title="Cash Flow Trend"
      data={chartData}
      type="line"
      dataKeys={['inflow', 'outflow', 'net']}
      colors={['#10b981', '#ef4444', '#3b82f6']}
    />
  );
}

interface ExpenseChartProps {
  data: Array<{
    category: string;
    amount: number;
  }>;
}

export function ExpenseChart({ data }: ExpenseChartProps) {
  const chartData = data.map(item => ({
    name: item.category,
    value: item.amount,
  }));

  return (
    <Chart
      title="Expenses by Category"
      data={chartData}
      type="pie"
      height={300}
    />
  );
}

interface RevenueChartProps {
  data: Array<{
    month: string;
    revenue: number;
    expenses: number;
  }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data.map(item => ({
    name: item.month,
    ...item,
  }));
  
  return (
    <Chart
      title="Revenue vs Expenses"
      data={chartData}
      type="bar"
      dataKeys={['revenue', 'expenses']}
      colors={['#10b981', '#ef4444']}
    />
  );
}