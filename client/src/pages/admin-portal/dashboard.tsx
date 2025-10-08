import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Database, 
  Activity, 
  AlertTriangle,
  UserCheck,
  Shield,
  Settings,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Server,
  HardDrive,
  Cpu,
  RefreshCw
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/admin/AdminLayout";
import { RequireAdminAuth } from "@/components/admin/RequireAdminAuth";

interface AdminSystemStats {
  totalUsers: number;
  activeUsers: number;
  totalLoans: number;
  totalBanks: number;
  systemHealth: "healthy" | "warning" | "critical";
  lastBackup: string;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  uptime: string;
  totalTransactions: number;
  todayTransactions: number;
}

interface RecentActivity {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  timestamp: string;
  details: string;
}

export default function AdminDashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch system statistics
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<AdminSystemStats>({
    queryKey: ['/api/admin/system/stats'],
    staleTime: 30000, // 30 seconds
  });

  // Fetch recent user activities
  const { data: activities, isLoading: activitiesLoading, refetch: refetchActivities } = useQuery<RecentActivity[]>({
    queryKey: ['/api/admin/system/activities'],
    staleTime: 60000, // 1 minute
  });

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchStats(), refetchActivities()]);
    setIsRefreshing(false);
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "healthy": return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";
      case "warning": return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20";
      case "critical": return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20";
      default: return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20";
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage > 80) return "text-red-600";
    if (usage > 60) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <RequireAdminAuth>
      <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 space-y-6" data-testid="page-admin-dashboard">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">System Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Real-time system monitoring and control</p>
          </div>
          <Button 
            onClick={handleRefreshData}
            disabled={isRefreshing}
            variant="outline"
            data-testid="button-refresh-dashboard"
            className="h-12 w-full sm:w-auto border-red-200 text-red-700 lg:hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="card-total-users" className="border-red-200 dark:border-red-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-red-700 dark:text-red-300">{stats?.totalUsers || 0}</div>
              )}
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                {statsLoading ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  <>
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {stats?.activeUsers || 0} active today
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-loans" className="border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
              <Database className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats?.totalLoans || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Across {stats?.totalBanks || 0} banks
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-system-health" className="border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-center space-x-2">
                  <Badge 
                    className={getHealthColor(stats?.systemHealth || "healthy")}
                    variant="secondary"
                  >
                    {stats?.systemHealth || "healthy"}
                  </Badge>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {statsLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  `${stats?.errorRate || 0}% error rate`
                )}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-transactions" className="border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats?.todayTransactions || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                {stats?.totalTransactions || 0} total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Resources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-system-resources">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-red-600 dark:text-red-400" />
                System Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {statsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">CPU Usage</span>
                    </div>
                    <span className={`text-sm font-bold ${getUsageColor(stats?.cpuUsage || 0)}`}>
                      {stats?.cpuUsage || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        (stats?.cpuUsage || 0) > 80 ? 'bg-red-500' : 
                        (stats?.cpuUsage || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${stats?.cpuUsage || 0}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <HardDrive className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Memory Usage</span>
                    </div>
                    <span className={`text-sm font-bold ${getUsageColor(stats?.memoryUsage || 0)}`}>
                      {stats?.memoryUsage || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        (stats?.memoryUsage || 0) > 80 ? 'bg-red-500' : 
                        (stats?.memoryUsage || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${stats?.memoryUsage || 0}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Database className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Disk Usage</span>
                    </div>
                    <span className={`text-sm font-bold ${getUsageColor(stats?.diskUsage || 0)}`}>
                      {stats?.diskUsage || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        (stats?.diskUsage || 0) > 80 ? 'bg-red-500' : 
                        (stats?.diskUsage || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${stats?.diskUsage || 0}%` }}
                    />
                  </div>

                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">System Uptime</span>
                      <span className="font-medium">{stats?.uptime || "0 days"}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-recent-activities">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                Recent User Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities && activities.length > 0 ? (
                <div className="space-y-4 max-h-64 overflow-y-auto overflow-x-auto">
                  {activities.slice(0, 5).map((activity) => (
                    <div 
                      key={activity.id} 
                      className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 min-w-[300px]"
                      data-testid={`activity-${activity.id}`}
                    >
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserCheck className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
                          {activity.action}
                        </p>
                        <p className="text-xs text-muted-foreground break-words">
                          {activity.userEmail} • {new Date(activity.timestamp).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 break-words">
                          {activity.details}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No recent activities</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card data-testid="card-quick-actions">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-12 justify-start gap-2 border-green-200 text-green-700 lg:hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-900/20"
                data-testid="button-system-backup"
              >
                <Database className="w-5 h-5" />
                <span className="text-sm">Create System Backup</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-12 justify-start gap-2 border-blue-200 text-blue-700 lg:hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/20"
                data-testid="button-clear-cache"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="text-sm">Clear System Cache</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-12 justify-start gap-2 border-red-200 text-red-700 lg:hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
                data-testid="button-maintenance-mode"
              >
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm">Maintenance Mode</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      </AdminLayout>
    </RequireAdminAuth>
  );
}