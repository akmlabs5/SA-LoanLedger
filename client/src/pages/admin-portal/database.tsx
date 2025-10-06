import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/admin/AdminLayout";
import { RequireAdminAuth } from "@/components/admin/RequireAdminAuth";
import { 
  Database, 
  HardDrive, 
  Activity, 
  Download,
  RefreshCw,
  CheckCircle2,
  Clock
} from "lucide-react";

interface DatabaseStats {
  connectionStatus: string;
  dbSize: string;
  totalConnections: number;
  activeConnections: number;
  slowQueries: number;
  cacheHitRatio: number;
  lastBackup: string;
  tables: Array<{
    name: string;
    rowCount: number;
    size: string;
  }>;
  recentQueries: Array<{
    query: string;
    duration: string;
    timestamp: string;
  }>;
}

export default function AdminDatabasePage() {
  const { data: dbStats, isLoading, refetch } = useQuery<DatabaseStats>({
    queryKey: ['/api/admin/database'],
    staleTime: 30000,
  });

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  };

  return (
    <RequireAdminAuth>
      <AdminLayout>
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
                Database Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Database health monitoring and statistics
              </p>
            </div>
            <Button onClick={() => refetch()} variant="outline" data-testid="button-refresh-stats">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Connection Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card data-testid="card-connection-status">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
                <Database className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <Badge className={getStatusColor(dbStats?.connectionStatus || '')}>
                    {dbStats?.connectionStatus.toUpperCase()}
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-database-size">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database Size</CardTitle>
                <HardDrive className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{dbStats?.dbSize}</div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-active-connections">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">
                    {dbStats?.activeConnections}/{dbStats?.totalConnections}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-cache-hit-ratio">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Ratio</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{dbStats?.cacheHitRatio}%</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tables Statistics */}
          <Card data-testid="card-tables-stats">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-red-600 dark:text-red-400" />
                Database Tables
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold">Table Name</th>
                        <th className="text-right py-3 px-4 font-semibold">Row Count</th>
                        <th className="text-right py-3 px-4 font-semibold">Size</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbStats?.tables.map((table) => (
                        <tr key={table.name} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{table.name}</td>
                          <td className="py-3 px-4 text-right text-muted-foreground">
                            {table.rowCount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-muted-foreground">{table.size}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Queries */}
          <Card data-testid="card-recent-queries">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Recent Queries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {dbStats?.recentQueries.map((query, idx) => (
                    <div
                      key={idx}
                      className="border border-border rounded-lg p-4 bg-muted/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-sm font-mono">{query.query}</code>
                        <Badge variant="outline">{query.duration}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(query.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Backup Status */}
          <Card data-testid="card-backup-status">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
                Backup Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Last Backup</p>
                  <p className="text-sm text-muted-foreground">
                    {isLoading ? (
                      <Skeleton className="h-4 w-32" />
                    ) : (
                      new Date(dbStats?.lastBackup || '').toLocaleString()
                    )}
                  </p>
                </div>
                <Button variant="default" data-testid="button-backup-now">
                  <Download className="w-4 h-4 mr-2" />
                  Backup Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RequireAdminAuth>
  );
}
