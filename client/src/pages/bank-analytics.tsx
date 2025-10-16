import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, DollarSign, Briefcase, FileText, Activity, Gem } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface BankAnalytics {
  summary: {
    totalOutstanding: number;
    totalCreditLimit: number;
    utilizationRate: number;
    activeLoans: number;
    settledLoans: number;
    cancelledLoans: number;
    facilitiesCount: number;
    totalCollateralValue: number;
  };
  facilityUtilization: Array<{
    facilityId: string;
    facilityName: string;
    limit: number;
    outstanding: number;
    utilization: number;
    activeLoans: number;
  }>;
  paymentsByMonth: Record<string, number>;
  interestByMonth: Record<string, number>;
  loanStatusBreakdown: {
    active: number;
    settled: number;
    cancelled: number;
  };
}

export default function BankAnalyticsPage() {
  const { bankId } = useParams<{ bankId: string }>();
  const [, setLocation] = useLocation();

  const { data: bank } = useQuery({
    queryKey: [`/api/banks/${bankId}`],
    enabled: !!bankId
  });

  const { data: analytics, isLoading } = useQuery<BankAnalytics>({
    queryKey: [`/api/banks/${bankId}/analytics`],
    enabled: !!bankId
  });

  const formatCurrency = (amount: number | null | undefined) => {
    const value = amount || 0;
    return `${value.toLocaleString('en-SA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} SAR`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Use default empty analytics if none provided
  const analyticsData = analytics || {
    summary: {
      totalOutstanding: 0,
      totalCreditLimit: 0,
      utilizationRate: 0,
      activeLoans: 0,
      settledLoans: 0,
      cancelledLoans: 0,
      facilitiesCount: 0,
      totalCollateralValue: 0
    },
    facilityUtilization: [],
    paymentsByMonth: {},
    interestByMonth: {},
    loanStatusBreakdown: {
      active: 0,
      settled: 0,
      cancelled: 0
    }
  };

  // Prepare data for charts
  const loanStatusData = [
    { name: 'Active', value: analyticsData.loanStatusBreakdown.active, color: '#00C49F' },
    { name: 'Settled', value: analyticsData.loanStatusBreakdown.settled, color: '#0088FE' },
    { name: 'Cancelled', value: analyticsData.loanStatusBreakdown.cancelled, color: '#FF8042' }
  ].filter(item => item.value > 0);

  const facilityPieData = analyticsData.facilityUtilization.map((f, idx) => ({
    name: f.facilityName,
    value: f.outstanding,
    color: COLORS[idx % COLORS.length]
  }));

  const paymentTrendData = Object.entries(analyticsData.paymentsByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      payments: amount,
      interest: analyticsData.interestByMonth[month] || 0
    }));

  const utilizationRate = analyticsData.summary.utilizationRate;
  const utilizationColor = utilizationRate > 80 ? 'text-red-600' : utilizationRate > 60 ? 'text-orange-600' : 'text-green-600';

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation(`/banks/${bankId}`)}
              data-testid="button-back-to-bank"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bank
            </Button>
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-page-title">
                Performance Analytics
              </h1>
              <p className="text-muted-foreground" data-testid="text-bank-name">
                {bank?.name || 'Bank'}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card data-testid="card-total-outstanding">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-outstanding">
                {formatCurrency(analyticsData.summary.totalOutstanding)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {analyticsData.summary.activeLoans} active loans
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-credit-limit">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Credit Limit</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-credit-limit">
                {formatCurrency(analyticsData.summary.totalCreditLimit)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {analyticsData.summary.facilitiesCount} facilities
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-utilization-rate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${utilizationColor}`} data-testid="text-utilization-rate">
                {analyticsData.summary.utilizationRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {utilizationRate > 80 ? 'High utilization' : utilizationRate > 60 ? 'Moderate' : 'Healthy'}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-loan-count">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-loan-count">
                {analyticsData.summary.activeLoans + analyticsData.summary.settledLoans + analyticsData.summary.cancelledLoans}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {analyticsData.summary.settledLoans} settled, {analyticsData.summary.cancelledLoans} cancelled
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-collateral">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collateral</CardTitle>
              <Gem className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-collateral">
                {formatCurrency(analyticsData.summary.totalCollateralValue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Assigned to this bank
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Facility Utilization Pie Chart */}
          <Card data-testid="card-facility-utilization">
            <CardHeader>
              <CardTitle>Facility Utilization Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {facilityPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={facilityPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name.split(' - ')[0]}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {facilityPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No active facilities
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loan Status Bar Chart */}
          <Card data-testid="card-loan-status">
            <CardHeader>
              <CardTitle>Loan Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {loanStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={loanStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8">
                      {loanStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No loans available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 gap-6">
          {/* Payment Trends Area Chart */}
          <Card data-testid="card-payment-trends">
            <CardHeader>
              <CardTitle>Payment & Interest Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={paymentTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Area type="monotone" dataKey="payments" stackId="1" stroke="#00C49F" fill="#00C49F" name="Payments" />
                    <Area type="monotone" dataKey="interest" stackId="1" stroke="#FF8042" fill="#FF8042" name="Interest" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No payment data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Facility Details Table */}
        <Card data-testid="card-facility-details">
          <CardHeader>
            <CardTitle>Facility Details</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {analyticsData.facilityUtilization.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Facility</th>
                      <th className="text-right py-3 px-4">Limit</th>
                      <th className="text-right py-3 px-4">Outstanding</th>
                      <th className="text-right py-3 px-4">Utilization</th>
                      <th className="text-right py-3 px-4">Active Loans</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.facilityUtilization.map((facility, idx) => (
                      <tr key={facility.facilityId} className="border-b" data-testid={`row-facility-${idx}`}>
                        <td className="py-3 px-4">{facility.facilityName}</td>
                        <td className="text-right py-3 px-4">{formatCurrency(facility.limit)}</td>
                        <td className="text-right py-3 px-4">{formatCurrency(facility.outstanding)}</td>
                        <td className="text-right py-3 px-4">
                          <span className={facility.utilization > 80 ? 'text-red-600 font-semibold' : facility.utilization > 60 ? 'text-orange-600' : 'text-green-600'}>
                            {facility.utilization.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right py-3 px-4">{facility.activeLoans}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No facilities available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
