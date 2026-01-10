'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Download, 
  Filter, 
  BarChart3,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  Plus,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { dashboardApi } from '@/lib/api/services';
import { format } from 'date-fns';

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports', selectedType, dateRange],
    queryFn: () => dashboardApi.getReports(),
  });

  const reportTypes = ['financial', 'cash-flow', 'expense', 'team'];

  const handleGenerateReport = (type: string) => {
    // Mock report generation
    alert(`Generating ${type} report...`);
  };

  const handleDownload = (reportId: string, format: 'pdf' | 'csv' | 'xlsx') => {
    // Mock download functionality
    alert(`Downloading report ${reportId} as ${format.toUpperCase()}...`);
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'financial':
        return <DollarSign className="h-4 w-4" />;
      case 'cash-flow':
        return <TrendingUp className="h-4 w-4" />;
      case 'expense':
        return <BarChart3 className="h-4 w-4" />;
      case 'team':
        return <Users className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: 'ready' | 'generating' | 'failed') => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'generating':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-gray-600">Generate and manage financial reports</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
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
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-gray-600">Generate and manage financial reports</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Report Generation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {reportTypes?.map((reportType) => (
              <Button
                key={reportType}
                variant="outline"
                onClick={() => handleGenerateReport(reportType)}
                className="justify-start"
              >
                {getReportIcon(reportType)}
                <span className="ml-2 capitalize">{reportType.replace('-', ' ')}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filter Reports</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="report-type" className="text-sm font-medium">Report Type</Label>
              <select
                id="report-type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                {reportTypes?.map((type) => (
                  <option key={type} value={type}>
                    {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <div>
                <Label htmlFor="start-date" className="text-sm font-medium">From</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="end-date" className="text-sm font-medium">To</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports?.data?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {reports?.data?.filter(r => r.generatedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reports?.data?.filter(r => r.status === 'ready').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for download
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {reports?.data?.filter(r => r.status === 'generating').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently generating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {reports?.data?.filter(r => r.status === 'failed').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {reports?.data && reports.data.length > 0 ? (
            <div className="space-y-4">
              {reports.data.map((report) => (
                <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        {getReportIcon(report.type)}
                      </div>
                      <div>
                        <h3 className="font-medium">{report.title}</h3>
                        <p className="text-sm text-gray-500">
                          {report.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} • 
                          {format(new Date(report.generatedAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={getStatusColor(report.status)}>
                        {report.status.replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      {report.status === 'ready' && (
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(report.id, 'pdf')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(report.id, 'pdf')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your filters or generate a new report.
              </p>
              <Button onClick={() => handleGenerateReport('financial')}>
                Generate First Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}