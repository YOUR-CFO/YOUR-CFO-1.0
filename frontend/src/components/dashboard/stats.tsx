import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, Clock, AlertCircle } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
}

function StatCard({ title, value, change, changeType = 'neutral', icon }: StatCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return <ArrowUpRight className="h-4 w-4" />;
      case 'negative':
        return <ArrowDownRight className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs ${getChangeColor()} flex items-center`}>
            {getChangeIcon()}
            <span className="ml-1">{change}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardStatsProps {
  cashInBank?: number;
  monthlyBurn?: number;
  runwayMonths?: number;
  activeAlerts?: number;
  cashChange?: number;
  burnChange?: number;
  runwayChange?: number;
  alertsChange?: number;
}

export function DashboardStats({
  cashInBank = 0,
  monthlyBurn = 0,
  runwayMonths = 0,
  activeAlerts = 0,
  cashChange = 0,
  burnChange = 0,
  runwayChange = 0,
  alertsChange = 0,
}: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Cash in Bank"
        value={`$${cashInBank.toLocaleString()}`}
        change={`${cashChange >= 0 ? '+' : ''}${cashChange}% from last month`}
        changeType={cashChange >= 0 ? 'positive' : 'negative'}
        icon={<DollarSign className="h-4 w-4 text-blue-500" />}
      />
      <StatCard
        title="Monthly Burn Rate"
        value={`$${monthlyBurn.toLocaleString()}`}
        change={`${burnChange >= 0 ? '+' : ''}${burnChange}% from last month`}
        changeType={burnChange <= 0 ? 'positive' : 'negative'}
        icon={<TrendingUp className="h-4 w-4 text-red-500" />}
      />
      <StatCard
        title="Runway"
        value={`${runwayMonths} months`}
        change={`${runwayChange >= 0 ? '+' : ''}${runwayChange} months from last month`}
        changeType={runwayChange >= 0 ? 'positive' : 'negative'}
        icon={<Clock className="h-4 w-4 text-purple-500" />}
      />
      <StatCard
        title="Active Alerts"
        value={activeAlerts.toString()}
        change={`${alertsChange >= 0 ? '+' : ''}${alertsChange} from last month`}
        changeType={alertsChange <= 0 ? 'positive' : 'negative'}
        icon={<AlertCircle className="h-4 w-4 text-orange-500" />}
      />
    </div>
  );
}