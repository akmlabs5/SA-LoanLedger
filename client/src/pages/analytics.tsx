import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, DollarSign, Receipt, BarChart3, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type PeriodType = 'month' | 'quarter' | 'year';
type MetricType = 'loan_count' | 'loan_amount' | 'payment_count' | 'payment_amount' | 'portfolio_ltv' | 'portfolio_utilization';

interface AnalyticsResponse {
  groupBy: string;
  from: string;
  to: string;
  data: Array<{
    period: string;
    loans: { loansCreated: number; totalDisbursed: number; avgLoanSize: number };
    payments: { paymentCount: number; totalPaid: number; principalPaid: number; interestPaid: number };
    snapshot: any;
    changes: any;
  }>;
  currentPeriod: {
    period: string;
    loans: { count: number; amount: string };
    payments: { count: number; amount: string };
    snapshot: { portfolioLtv: string; utilization: string } | null;
  } | null;
  previousPeriod: {
    period: string;
    loans: { count: number; amount: string };
    payments: { count: number; amount: string };
  } | null;
  periodComparison: {
    loansCountChange: number;
    loansAmountChange: number;
    paymentsCountChange: number;
    paymentsAmountChange: number;
  } | null;
  summary: {
    totalLoansCreated: number;
    totalDisbursed: number;
    totalPaymentsReceived: number;
    totalPrincipalPaid: number;
    totalInterestPaid: number;
  };
}

export default function AnalyticsPage() {
  const { isAuthenticated } = useAuth();
  const [periodType, setPeriodType] = useState<PeriodType>('quarter');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('loan_amount');
  const [periodOffset, setPeriodOffset] = useState(0); // 0 = current period, -1 = previous, etc.
  
  // Calculate date range for API call (last 3 years)
  const today = new Date();
  const threeYearsAgo = new Date(today.getFullYear() - 3, 0, 1);
  const from = threeYearsAgo.toISOString().split('T')[0];
  const to = today.toISOString().split('T')[0];
  
  const { data: analytics, isLoading } = useQuery<AnalyticsResponse>({
    queryKey: ['/api/analytics/year-over-year', { from, to, groupBy: periodType }],
    enabled: isAuthenticated,
  });
  
  // Get current viewing period based on offset
  const getCurrentViewingPeriod = () => {
    const now = new Date();
    
    if (periodType === 'month') {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() + periodOffset, 1);
      const year = targetMonth.getFullYear();
      const month = targetMonth.getMonth() + 1;
      return `${year}-${String(month).padStart(2, '0')}`;
    } else if (periodType === 'quarter') {
      const currentQuarter = Math.floor((now.getMonth()) / 3) + 1;
      let targetQuarter = currentQuarter + periodOffset;
      let targetYear = now.getFullYear();
      
      while (targetQuarter < 1) {
        targetQuarter += 4;
        targetYear -= 1;
      }
      while (targetQuarter > 4) {
        targetQuarter -= 4;
        targetYear += 1;
      }
      
      return `${targetYear}-Q${targetQuarter}`;
    } else if (periodType === 'year') {
      const targetYear = now.getFullYear() + periodOffset;
      return `${targetYear}`;
    }
    
    return '';
  };
  
  const handlePreviousPeriod = () => {
    setPeriodOffset(prev => prev - 1);
  };
  
  const handleNextPeriod = () => {
    if (periodOffset < 0) {
      setPeriodOffset(prev => prev + 1);
    }
  };
  
  const handlePeriodTypeChange = (val: PeriodType) => {
    setPeriodType(val);
    setPeriodOffset(0); // Reset to current period when changing type
  };
  
  const currentViewingPeriod = getCurrentViewingPeriod();
  const isCurrentPeriod = periodOffset === 0;

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

  const formatChange = (change: number | undefined | null) => {
    if (change === undefined || change === null) return null;
    const isPositive = change >= 0;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
        {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        <span className="text-xs font-medium">{Math.abs(change).toFixed(1)}%</span>
      </div>
    );
  };

  const getPeriodLabel = () => {
    if (isCurrentPeriod) {
      if (periodType === 'month') return 'This Month';
      if (periodType === 'quarter') return 'This Quarter';
      return 'This Year';
    } else {
      // For historical periods, show the actual period
      return currentViewingPeriod;
    }
  };
  
  const getPeriodTypeLabel = () => {
    if (periodType === 'month') return 'Month';
    if (periodType === 'quarter') return 'Quarter';
    return 'Year';
  };
  
  // Get data for the currently viewing period
  const getViewingPeriodData = () => {
    if (!analytics?.data) return null;
    
    const periodData = analytics.data.find(p => p.period === currentViewingPeriod);
    if (!periodData) return null;
    
    // Find previous period for comparison
    const periodIndex = analytics.data.findIndex(p => p.period === currentViewingPeriod);
    const prevPeriodData = periodIndex > 0 ? analytics.data[periodIndex - 1] : null;
    
    const calculateChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };
    
    return {
      loans: {
        count: periodData.loans.loansCreated,
        amount: periodData.loans.totalDisbursed.toString(),
      },
      payments: {
        count: periodData.payments.paymentCount,
        amount: periodData.payments.totalPaid.toString(),
      },
      comparison: prevPeriodData ? {
        loansCountChange: calculateChange(periodData.loans.loansCreated, prevPeriodData.loans.loansCreated),
        loansAmountChange: calculateChange(periodData.loans.totalDisbursed, prevPeriodData.loans.totalDisbursed),
        paymentsCountChange: calculateChange(periodData.payments.paymentCount, prevPeriodData.payments.paymentCount),
        paymentsAmountChange: calculateChange(periodData.payments.totalPaid, prevPeriodData.payments.totalPaid),
      } : null
    };
  };
  
  const viewingData = isCurrentPeriod && analytics?.currentPeriod 
    ? {
        loans: analytics.currentPeriod.loans,
        payments: analytics.currentPeriod.payments,
        comparison: analytics.periodComparison
      }
    : getViewingPeriodData();

  const getChartData = () => {
    if (!analytics?.data) return [];
    
    return analytics.data.map(period => {
      let value = 0;
      let label = '';
      
      switch (selectedMetric) {
        case 'loan_count':
          value = period.loans.loansCreated;
          label = 'Loans';
          break;
        case 'loan_amount':
          value = period.loans.totalDisbursed;
          label = 'Loan Amount';
          break;
        case 'payment_count':
          value = period.payments.paymentCount;
          label = 'Payments';
          break;
        case 'payment_amount':
          value = period.payments.totalPaid;
          label = 'Payment Amount';
          break;
        case 'portfolio_ltv':
          value = period.snapshot?.portfolioLtv || 0;
          label = 'Portfolio LTV';
          break;
        case 'portfolio_utilization':
          value = period.snapshot ? (period.snapshot.totalOutstanding / period.snapshot.totalCreditLimit) * 100 : 0;
          label = 'Utilization';
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
      portfolio_ltv: 'Portfolio LTV',
      portfolio_utilization: 'Utilization Rate',
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
              Portfolio Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Track performance trends across different time periods
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={periodType} onValueChange={handlePeriodTypeChange}>
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

        {/* Period Navigation */}
        <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-indigo-200 dark:border-indigo-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPeriod}
                data-testid="button-previous-period"
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous {getPeriodTypeLabel()}
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Viewing</p>
                <p className="text-lg font-bold text-indigo-700 dark:text-indigo-400" data-testid="text-current-viewing-period">
                  {getPeriodLabel()}
                </p>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPeriod}
                disabled={isCurrentPeriod}
                data-testid="button-next-period"
                className="flex items-center gap-2"
              >
                Next {getPeriodTypeLabel()}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Period Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{getPeriodLabel()} - Loans</p>
                  <p className="text-2xl font-bold mt-1" data-testid="text-current-loans">
                    {viewingData?.loans.count || 0}
                  </p>
                  {formatChange(viewingData?.comparison?.loansCountChange)}
                </div>
                <BarChart3 className="h-10 w-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{getPeriodLabel()} - Amount</p>
                  <p className="text-2xl font-bold mt-1" data-testid="text-current-loan-amount">
                    {viewingData?.loans.amount ? formatCurrency(viewingData.loans.amount) : formatCurrency(0)}
                  </p>
                  {formatChange(viewingData?.comparison?.loansAmountChange)}
                </div>
                <DollarSign className="h-10 w-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{getPeriodLabel()} - Payments</p>
                  <p className="text-2xl font-bold mt-1" data-testid="text-current-payments">
                    {viewingData?.payments.count || 0}
                  </p>
                  {formatChange(viewingData?.comparison?.paymentsCountChange)}
                </div>
                <Receipt className="h-10 w-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{getPeriodLabel()} - Paid</p>
                  <p className="text-2xl font-bold mt-1" data-testid="text-current-payment-amount">
                    {viewingData?.payments.amount ? formatCurrency(viewingData.payments.amount) : formatCurrency(0)}
                  </p>
                  {formatChange(viewingData?.comparison?.paymentsAmountChange)}
                </div>
                <Activity className="h-10 w-10 text-orange-500" />
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
                  <SelectItem value="portfolio_ltv">Portfolio LTV</SelectItem>
                  <SelectItem value="portfolio_utilization">Utilization Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              {selectedMetric.includes('amount') ? (
                <BarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="period" className="text-sm" />
                  <YAxis className="text-sm" />
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
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="period" className="text-sm" />
                  <YAxis className="text-sm" />
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
                  </tr>
                </thead>
                <tbody>
                  {analytics?.data.map((period, index) => {
                    const prevPeriod = index > 0 ? analytics.data[index - 1] : null;
                    const calculateChange = (curr: number, prev: number) => {
                      if (prev === 0) return curr > 0 ? 100 : 0;
                      return ((curr - prev) / prev) * 100;
                    };
                    
                    return (
                      <tr key={index} className="border-b hover:bg-muted/50" data-testid={`row-period-${period.period}`}>
                        <td className="py-3 px-2 text-sm font-medium">{period.period}</td>
                        <td className="py-3 px-2">
                          <div className="flex flex-col">
                            <span className="text-sm">{period.loans.loansCreated}</span>
                            {prevPeriod && formatChange(calculateChange(period.loans.loansCreated, prevPeriod.loans.loansCreated))}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">{formatCurrency(period.loans.totalDisbursed)}</span>
                            {prevPeriod && formatChange(calculateChange(period.loans.totalDisbursed, prevPeriod.loans.totalDisbursed))}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex flex-col">
                            <span className="text-sm">{period.payments.paymentCount}</span>
                            {prevPeriod && formatChange(calculateChange(period.payments.paymentCount, prevPeriod.payments.paymentCount))}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">{formatCurrency(period.payments.totalPaid)}</span>
                            {prevPeriod && formatChange(calculateChange(period.payments.totalPaid, prevPeriod.payments.totalPaid))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
