'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertTriangle,
  Users,
  Megaphone,
  DollarSign,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

import { dashboardApi, runwayApi } from '@/lib/api/services';

export default function RunwaySimulatorPage() {
  const [inputs, setInputs] = useState({
    hiringPlan: 0,
    marketingSpend: 0,
    revenueGrowth: 0,
    otherChanges: 0,
  });

  const [simulationData, setSimulationData] = useState<{
    newBurnRate: number;
    newRunwayMonths: number;
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
    newMonthlyBurn?: number;
    runwayChange?: number;
    totalAdditionalCosts?: number;
    riskMessage?: string;

  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const { data: overview } = useQuery({
    queryKey: ['overview'],
    queryFn: dashboardApi.getOverview,
  });

  const handleInputChange = (field: string, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      const result = await runwayApi.simulate(inputs);
      setSimulationData(result.data);
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const resetSimulation = () => {
    setInputs({
      hiringPlan: 0,
      marketingSpend: 0,
      revenueGrowth: 0,
      otherChanges: 0,
    });
    setSimulationData(null);
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskIcon = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return <TrendingUp className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <TrendingDown className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (!overview?.data) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Runway Simulator</h1>
            <p className="text-gray-600">Model different financial scenarios</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Runway Simulator</h1>
          <p className="text-gray-600">Model different financial scenarios</p>
        </div>
        <Button variant="outline" onClick={resetSimulation}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Current Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Runway</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {overview.data.runwayMonths} months
            </div>
            <p className="text-xs text-muted-foreground">
              At current burn rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Burn</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${overview.data.monthlyBurnRate.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Current monthly expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash in Bank</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${overview.data.cashInBank.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Available funds
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <span>Scenario Inputs</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Hiring */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <Label className="text-sm font-medium">Hiring Plan</Label>
              </div>
              <div>
                <Label htmlFor="hiring-plan" className="text-xs">Additional Monthly Salary Cost</Label>
                <Input
                  id="hiring-plan"
                  type="number"
                  min="0"
                  step="1000"
                  value={inputs.hiringPlan}
                  onChange={(e) => handleInputChange('hiringPlan', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Marketing */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Megaphone className="h-4 w-4 text-green-500" />
                <Label className="text-sm font-medium">Marketing Spend</Label>
              </div>
              <div>
                <Label htmlFor="marketing-spend" className="text-xs">Additional Monthly Marketing Budget</Label>
                <Input
                  id="marketing-spend"
                  type="number"
                  min="0"
                  step="1000"
                  value={inputs.marketingSpend}
                  onChange={(e) => handleInputChange('marketingSpend', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Revenue Growth */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <Label className="text-sm font-medium">Revenue Growth</Label>
              </div>
              <div>
                <Label htmlFor="revenue" className="text-xs">Expected Monthly Growth (%)</Label>
                <Input
                  id="revenue"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={inputs.revenueGrowth}
                  onChange={(e) => handleInputChange('revenueGrowth', parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Other Changes */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-orange-500" />
                <Label className="text-sm font-medium">Other Changes</Label>
              </div>
              <div>
                <Label htmlFor="other-changes" className="text-xs">Additional Monthly Costs</Label>
                <Input
                  id="other-changes"
                  type="number"
                  min="0"
                  step="1000"
                  value={inputs.otherChanges}
                  onChange={(e) => handleInputChange('otherChanges', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            </div>

            <Button 
              onClick={runSimulation} 
              disabled={isSimulating}
              className="w-full"
            >
              {isSimulating ? 'Simulating...' : 'Run Simulation'}
            </Button>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ArrowRight className="h-5 w-5" />
              <span>Simulation Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {simulationData ? (
              <>
                {/* Updated Metrics */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">New Monthly Burn</span>
                    <span className="font-bold text-blue-600">
                      ${simulationData.newBurnRate.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">New Runway</span>
                    <span className="font-bold text-green-600">
                      {simulationData.newRunwayMonths} months
                    </span>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Risk Assessment</Label>
                  <div className={`p-3 rounded-lg border flex items-center space-x-2 ${getRiskColor(simulationData.riskLevel)}`}>
                    {getRiskIcon(simulationData.riskLevel)}
                    <span className="font-medium capitalize">{simulationData.riskLevel} Risk</span>
                  </div>

                </div>

                {/* Recommendations */}
                {simulationData.recommendations && simulationData.recommendations.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Recommendations</Label>
                    <ul className="space-y-2">
                      {simulationData.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2 text-sm">
                          <span className="text-blue-500 mt-1">•</span>
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Run a simulation to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>


    </div>
  );
}