import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, DollarSign, CreditCard, Building, ArrowUp, ArrowDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type PeriodType = 'month' | 'quarter' | 'year';
type MetricType = 'loan_count' | 'loan_amount' | 'payment_count' | 'payment_amount' | 'portfolio_ltv' | 'portfolio_utilization';

interface AnalyticsData {
  periods: Array<{
    period: string;
    periodType: string;
    loans: { count: number; amount: string; change?: number };
    payments: { count: number; amount: string; change?: number };
    snapshots: { avgLtv: string | null; avgUtilization: string | null; change?: number };
  }>;
  summary: {
    totalLoans: number;
    totalLoanAmount: string;
    totalPayments: number;
    totalPaymentAmount: string;
    avgLtv: string | null;
    avgUtilization: string | null;
  };
}

export default function AnalyticsPage() {
  const { isAuthenticated } = useAuth();
  const [periodType, setPeriodType] = useState<PeriodType>('quarter');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('loan_amount');
  
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics/year-over-year', periodType],
    enabled: isAuthenticated,
  });

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatPercent = (value: string | number | null) => {
    if (value === null || value === undefined) return 'N/A';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num.toFixed(1)}%`;
  };

  const formatChange = (change: number | undefined) => {
    if (change === undefined || change === null) return null;
    const isPositive = change >= 0;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        <span className="text-xs font-medium">{Math.abs(change).toFixed(1)}%</span>
      </div>
    );
  };

  const getChartData = () => {
    if (!analytics?.periods) return [];
    
    return analytics.periods.map(period => {
      let value = 0;
      let label = '';
      
      switch (selectedMetric) {
        case 'loan_count':
          value = period.loans.count;
          label = 'Loans';
          break;
        case 'loan_amount':
          value = parseFloat(period.loans.amount);
          label = 'Loan Amount';
          break;
        case 'payment_count':
          value = period.payments.count;
          label = 'Payments';
          break;
        case 'payment_amount':
          value = parseFloat(period.payments.amount);
          label = 'Payment Amount';
          break;
        case 'portfolio_ltv':
          value = period.snapshots.avgLtv ? parseFloat(period.snapshots.avgLtv) : 0;
          label = 'Avg LTV';
          break;
        case 'portfolio_utilization':
          value = period.snapshots.avgUtilization ? parseFloat(period.snapshots.avgUtilization) : 0;
          label = 'Avg Utilization';
          break;
      }
      
      return {
        period: period.period,
        value: value,
        label: label,
      };
    });
  };

  const getMetricLabel = (metric: MetricType) => {
    const labels = {
      loan_count: 'Number of Loans',
      loan_amount: 'Total Loan Amount',
      payment_count: 'Number of Payments',
      payment_amount: 'Total Payment Amount',
      portfolio_ltv: 'Average Portfolio LTV',
      portfolio_utilization: 'Average Utilization',
    };
    return labels[metric];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-analytics-title">
              Historical Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Year-over-year portfolio performance and trends
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={periodType} onValueChange={(val) => setPeriodType(val as PeriodType)}>
              <SelectTrigger className="w-[140px]" data-testid="select-period-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="quarter">Quarterly</SelectItem>
                <SelectItem value="year">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Loans</p>
                  <p className="text-2xl font-bold mt-1" data-testid="text-total-loans">
                    {analytics?.summary.totalLoans || 0}
                  </p>
                </div>
                <CreditCard className="h-10 w-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Loan Amount</p>
                  <p className="text-2xl font-bold mt-1" data-testid="text-total-loan-amount">
                    {analytics?.summary.totalLoanAmount ? formatCurrency(analytics.summary.totalLoanAmount) : formatCurrency(0)}
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Payments</p>
                  <p className="text-2xl font-bold mt-1" data-testid="text-total-payments">
                    {analytics?.summary.totalPayments || 0}
                  </p>
                </div>
                <Calendar className="h-10 w-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Amount</p>
                  <p className="text-2xl font-bold mt-1" data-testid="text-total-payment-amount">
                    {analytics?.summary.totalPaymentAmount ? formatCurrency(analytics.summary.totalPaymentAmount) : formatCurrency(0)}
                  </p>
                </div>
                <Building className="h-10 w-10 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Trends
              </CardTitle>
              <Select value={selectedMetric} onValueChange={(val) => setSelectedMetric(val as MetricType)}>
                <SelectTrigger className="w-[220px]" data-testid="select-metric">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="loan_count">Number of Loans</SelectItem>
                  <SelectItem value="loan_amount">Total Loan Amount</SelectItem>
                  <SelectItem value="payment_count">Number of Payments</SelectItem>
                  <SelectItem value="payment_amount">Total Payment Amount</SelectItem>
                  <SelectItem value="portfolio_ltv">Average Portfolio LTV</SelectItem>
                  <SelectItem value="portfolio_utilization">Average Utilization</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              {selectedMetric.includes('amount') ? (
                <BarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => 
                      selectedMetric.includes('amount') 
                        ? formatCurrency(value) 
                        : selectedMetric.includes('ltv') || selectedMetric.includes('utilization')
                        ? formatPercent(value)
                        : value
                    }
                  />
                  <Legend />
                  <Bar dataKey="value" name={getMetricLabel(selectedMetric)} fill="#6366f1" />
                </BarChart>
              ) : (
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => 
                      selectedMetric.includes('ltv') || selectedMetric.includes('utilization')
                        ? formatPercent(value)
                        : value
                    }
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name={getMetricLabel(selectedMetric)} 
                    stroke="#6366f1" 
                    strokeWidth={2}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle>Period-over-Period Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">Period</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">Loans</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">Loan Amount</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">Payments</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">Payment Amount</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">Avg LTV</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">Avg Util.</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.periods.map((period, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50" data-testid={`row-period-${period.period}`}>
                      <td className="py-3 px-2 text-sm font-medium">{period.period}</td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col">
                          <span className="text-sm">{period.loans.count}</span>
                          {formatChange(period.loans.change)}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{formatCurrency(period.loans.amount)}</span>
                          {formatChange(period.loans.change)}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col">
                          <span className="text-sm">{period.payments.count}</span>
                          {formatChange(period.payments.change)}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{formatCurrency(period.payments.amount)}</span>
                          {formatChange(period.payments.change)}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col">
                          <span className="text-sm">{formatPercent(period.snapshots.avgLtv)}</span>
                          {formatChange(period.snapshots.change)}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col">
                          <span className="text-sm">{formatPercent(period.snapshots.avgUtilization)}</span>
                          {formatChange(period.snapshots.change)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
