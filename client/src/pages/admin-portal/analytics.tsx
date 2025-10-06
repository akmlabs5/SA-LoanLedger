import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/admin/AdminLayout";
import { RequireAdminAuth } from "@/components/admin/RequireAdminAuth";
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

interface AnalyticsData {
  monthlyTrends: Array<{
    month: string;
    loans: number;
    value: number;
    users: number;
  }>;
  bankDistribution: Array<{
    bankName: string;
    loanCount: number;
    totalExposure: number;
  }>;
  totalLoansCreated: number;
  totalValue: number;
  averageLoanSize: number;
  platformGrowth: number;
  userEngagement: number;
  systemUptime: number;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4'];

export default function AdminAnalyticsPage() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/admin/analytics'],
    staleTime: 60000,
  });

  const formatCurrency = (value: number) => {
    return `SAR ${(value / 1000000).toFixed(1)}M`;
  };

  return (
    <RequireAdminAuth>
      <AdminLayout>
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
                Analytics Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Platform usage metrics and performance insights
              </p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card data-testid="card-platform-growth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Growth</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    +{analytics?.platformGrowth.toFixed(1)}%
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">vs last quarter</p>
              </CardContent>
            </Card>

            <Card data-testid="card-user-engagement">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Engagement</CardTitle>
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {analytics?.userEngagement.toFixed(1)}%
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">active users</p>
              </CardContent>
            </Card>

            <Card data-testid="card-total-loans">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
                <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    {analytics?.totalLoansCreated || 0}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">loans created</p>
              </CardContent>
            </Card>

            <Card data-testid="card-avg-loan-size">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Loan Size</CardTitle>
                <DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {formatCurrency(analytics?.averageLoanSize || 0)}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">per loan</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trends Chart */}
          <Card data-testid="card-monthly-trends">
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics?.monthlyTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="loans" 
                      stroke="#ef4444" 
                      strokeWidth={2} 
                      name="Loans Created"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#3b82f6" 
                      strokeWidth={2} 
                      name="Active Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Bank Distribution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-bank-loan-distribution">
              <CardHeader>
                <CardTitle>Loan Distribution by Bank</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-80 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics?.bankDistribution || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bankName" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="loanCount" fill="#f97316" name="Loan Count" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-bank-exposure-chart">
              <CardHeader>
                <CardTitle>Exposure by Bank</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-80 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics?.bankDistribution || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.bankName}: ${formatCurrency(entry.totalExposure)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="totalExposure"
                      >
                        {(analytics?.bankDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </RequireAdminAuth>
  );
}
