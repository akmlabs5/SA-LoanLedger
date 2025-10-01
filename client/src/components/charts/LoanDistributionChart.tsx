import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Calendar, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { LoanWithDetails } from "@shared/types";
import { SAUDI_CHART_COLORS, getBankColor, CHART_STYLING } from "@/lib/chart-colors";

interface LoanDistributionChartProps {
  loans?: LoanWithDetails[];
  showTimeDistribution?: boolean;
  isLoading?: boolean;
}

interface UrgencyData {
  urgency: 'critical' | 'warning' | 'normal';
  amount: number;
  count: number;
  color: string;
}

interface BankData {
  bank: string;
  fullName: string;
  amount: number;
  count: number;
}

interface TimeData {
  month: string;
  amount: number;
  count: number;
}

// Using centralized Saudi-themed color palette
const URGENCY_COLORS = {
  'critical': SAUDI_CHART_COLORS.status.error,
  'warning': SAUDI_CHART_COLORS.status.warning, 
  'normal': SAUDI_CHART_COLORS.saudiGreen,
};

const STATUS_COLORS = {
  'active': SAUDI_CHART_COLORS.saudiGreen,
  'settled': SAUDI_CHART_COLORS.status.success,
  'overdue': SAUDI_CHART_COLORS.status.error,
};

export default function LoanDistributionChart({ loans = [], showTimeDistribution = false, isLoading = false }: LoanDistributionChartProps) {
  // Handle loading state
  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" style={{ color: SAUDI_CHART_COLORS.saudiGreen }} />
            <span>Loan Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] sm:h-[300px] lg:h-[350px] bg-gradient-to-br from-green-50 to-yellow-50 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center animate-pulse">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-gray-400 dark:text-gray-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading loan distribution...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!loans || loans.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" style={{ color: SAUDI_CHART_COLORS.saudiGreen }} />
            <span>Loan Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] sm:h-[300px] lg:h-[350px] bg-gradient-to-br from-green-50 to-yellow-50 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No loan data available</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Add some loans to see distribution charts</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getLoanUrgency = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const daysDiff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysDiff < 0) return 'critical';
    if (daysDiff <= 7) return 'critical';
    if (daysDiff <= 15) return 'warning';
    return 'normal';
  };

  // Loan distribution by urgency
  const urgencyData = loans.reduce((acc: UrgencyData[], loan: LoanWithDetails) => {
    const urgency = getLoanUrgency(loan.dueDate);
    const amount = Number(loan.amount) || 0;
    
    const existing = acc.find((item: UrgencyData) => item.urgency === urgency);
    if (existing) {
      existing.amount += amount;
      existing.count += 1;
    } else {
      acc.push({
        urgency,
        amount: amount,
        count: 1,
        color: URGENCY_COLORS[urgency as keyof typeof URGENCY_COLORS],
      });
    }
    return acc;
  }, [] as UrgencyData[]);

  // Loan distribution by bank
  const bankData = loans.reduce((acc: BankData[], loan: LoanWithDetails) => {
    const bankName = loan.facility?.bank?.name || 'Unknown Bank';
    const amount = Number(loan.amount) || 0;
    
    const existing = acc.find((item: BankData) => item.bank === bankName);
    if (existing) {
      existing.amount += amount;
      existing.count += 1;
    } else {
      acc.push({
        bank: bankName.length > 15 ? bankName.substring(0, 12) + '...' : bankName,
        fullName: bankName,
        amount: amount / 1000000, // Convert to millions
        count: 1,
      });
    }
    return acc;
  }, [] as BankData[]);

  // Time distribution (loans by month)
  const timeData: TimeData[] = showTimeDistribution ? loans.reduce((acc: TimeData[], loan: LoanWithDetails) => {
    const startDate = new Date(loan.startDate);
    const monthYear = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const amount = Number(loan.amount) || 0;
    
    const existing = acc.find((item: TimeData) => item.month === monthYear);
    if (existing) {
      existing.amount += amount / 1000000;
      existing.count += 1;
    } else {
      acc.push({
        month: monthYear,
        amount: amount / 1000000,
        count: 1,
      });
    }
    return acc;
  }, [] as TimeData[]).sort((a: TimeData, b: TimeData) => new Date(a.month + ' 1').getTime() - new Date(b.month + ' 1').getTime()) : [];

  const chartConfig = {
    amount: {
      label: "Amount (SAR M)",
    },
    count: {
      label: "Number of Loans",
    },
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold capitalize mb-1">
            {data.urgency} Priority
          </p>
          <p className="text-sm text-muted-foreground">
            {data.count} loans • ﷼{(data.amount / 1000000).toFixed(1)}M SAR
          </p>
        </div>
      );
    }
    return null;
  };

  if (showTimeDistribution && timeData.length > 0) {
    return (
      <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" style={{ color: SAUDI_CHART_COLORS.saudiGreen }} />
            <span>Loan Timeline Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <LineChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis 
                dataKey="month" 
                className="text-gray-600 dark:text-gray-400"
                fontSize={12}
              />
              <YAxis 
                yAxisId="amount"
                orientation="left"
                className="text-gray-600 dark:text-gray-400"
                fontSize={12}
              />
              <YAxis 
                yAxisId="count"
                orientation="right"
                className="text-gray-600 dark:text-gray-400"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar yAxisId="amount" dataKey="amount" fill={SAUDI_CHART_COLORS.saudiGreen} radius={[4, 4, 0, 0]} />
              <Line 
                yAxisId="count" 
                type="monotone" 
                dataKey="count" 
                stroke={SAUDI_CHART_COLORS.saudiGold} 
                strokeWidth={3}
                dot={{ fill: SAUDI_CHART_COLORS.saudiGold, strokeWidth: 2 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Loan Distribution by Urgency */}
      <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span>Priority Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {urgencyData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No priority data available</p>
              </div>
            </div>
          ) : (
            <ChartContainer config={chartConfig}>
              <PieChart>
                <Pie
                  data={urgencyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="amount"
                >
                  {urgencyData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ChartContainer>
          )}
          {/* Simple Priority Legend */}
          <div className="mt-4 flex items-center justify-center space-x-6">
            {urgencyData
              .sort((a, b) => {
                const priority = { 'critical': 0, 'warning': 1, 'normal': 2 };
                return priority[a.urgency as keyof typeof priority] - priority[b.urgency as keyof typeof priority];
              })
              .map((item: any) => (
                <div key={item.urgency} className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium capitalize">{item.urgency}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.count} loans</p>
                </div>
              ))
            }
          </div>
        </CardContent>
      </Card>

      {/* Loan Distribution by Bank */}
      <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span className="text-green-600 dark:text-green-400 font-bold text-lg">﷼</span>
            <span>Loans by Bank</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <BarChart data={bankData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis 
                type="number" 
                className="text-gray-600 dark:text-gray-400"
                fontSize={12}
              />
              <YAxis 
                dataKey="bank" 
                type="category" 
                className="text-gray-600 dark:text-gray-400"
                fontSize={12}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="amount" 
                fill={SAUDI_CHART_COLORS.saudiGreen} 
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}