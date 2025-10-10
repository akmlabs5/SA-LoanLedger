import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Clock,
  Eye,
  CheckCheck,
  Filter,
  RefreshCw
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/admin/AdminLayout";
import { RequireAdminAuth } from "@/components/admin/RequireAdminAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";

interface SystemAlert {
  id: string;
  severity: "info" | "warning" | "error" | "critical";
  type: "security" | "database" | "email" | "ssl" | "cors" | "redirect" | "performance" | "system";
  title: string;
  message: string;
  details?: Record<string, any>;
  source: string;
  status: "unread" | "read" | "resolved" | "ignored";
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

interface AlertCounts {
  total: number;
  unread: number;
  read: number;
  resolved: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}

export default function AdminAlertsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState("24");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  // Fetch alerts
  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery<SystemAlert[]>({
    queryKey: ['/api/admin/alerts', { hours: timeRange }],
    staleTime: 10000, // 10 seconds
  });

  // Fetch alert counts
  const { data: counts, refetch: refetchCounts } = useQuery<AlertCounts>({
    queryKey: ['/api/admin/alerts/counts'],
    staleTime: 10000,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (alertId: string) => 
      apiRequest('POST', `/api/admin/alerts/${alertId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/alerts/counts'] });
    },
  });

  // Resolve mutation
  const resolveMutation = useMutation({
    mutationFn: (alertId: string) => 
      apiRequest('POST', `/api/admin/alerts/${alertId}/resolve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/alerts/counts'] });
    },
  });

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchAlerts(), refetchCounts()]);
    setIsRefreshing(false);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <XCircle className="h-4 w-4" />;
      case "error": return <AlertTriangle className="h-4 w-4" />;
      case "warning": return <Clock className="h-4 w-4" />;
      case "info": return <Info className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "error": return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
      case "warning": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "info": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      security: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300",
      database: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300",
      email: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300",
      ssl: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300",
      cors: "bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300",
      redirect: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300",
      performance: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300",
      system: "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300",
    };
    return colors[type] || colors.system;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "unread": return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300";
      case "read": return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300";
      case "resolved": return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300";
      case "ignored": return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  // Filter alerts
  const filteredAlerts = alerts?.filter(alert => {
    if (statusFilter !== "all" && alert.status !== statusFilter) return false;
    if (severityFilter !== "all" && alert.severity !== severityFilter) return false;
    return true;
  });

  return (
    <RequireAdminAuth>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Alerts</h1>
              <p className="text-muted-foreground mt-1">
                Monitor and manage system notifications
              </p>
            </div>
            <Button 
              onClick={handleRefreshData} 
              disabled={isRefreshing}
              size="sm"
              className="gap-2"
              data-testid="button-refresh-alerts"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Total Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {counts?.total || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Unread
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {counts?.unread || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Read
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {counts?.read || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Resolved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {counts?.resolved || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[150px]">
                  <label className="text-sm font-medium mb-2 block">Time Range</label>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger data-testid="select-time-range">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Last Hour</SelectItem>
                      <SelectItem value="6">Last 6 Hours</SelectItem>
                      <SelectItem value="24">Last 24 Hours</SelectItem>
                      <SelectItem value="72">Last 3 Days</SelectItem>
                      <SelectItem value="168">Last Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[150px]">
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger data-testid="select-status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="unread">Unread</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[150px]">
                  <label className="text-sm font-medium mb-2 block">Severity</label>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger data-testid="select-severity-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alert History</CardTitle>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : filteredAlerts && filteredAlerts.length > 0 ? (
                <div className="space-y-3">
                  {filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                      data-testid={`alert-${alert.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`mt-0.5 ${getSeverityColor(alert.severity)} p-2 rounded-lg`}>
                            {getSeverityIcon(alert.severity)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {alert.title}
                              </h3>
                              <Badge className={getSeverityColor(alert.severity)} variant="outline">
                                {alert.severity.toUpperCase()}
                              </Badge>
                              <Badge className={getTypeColor(alert.type)} variant="outline">
                                {alert.type}
                              </Badge>
                              <Badge className={getStatusColor(alert.status)} variant="outline">
                                {alert.status}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              {alert.message}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                              </span>
                              <span>Source: {alert.source}</span>
                            </div>

                            {alert.details && Object.keys(alert.details).length > 0 && (
                              <details className="mt-3">
                                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                  View Details
                                </summary>
                                <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                                  {JSON.stringify(alert.details, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {alert.status === 'unread' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsReadMutation.mutate(alert.id)}
                              disabled={markAsReadMutation.isPending}
                              data-testid={`button-mark-read-${alert.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {alert.status !== 'resolved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveMutation.mutate(alert.id)}
                              disabled={resolveMutation.isPending}
                              className="text-green-600 hover:text-green-700"
                              data-testid={`button-resolve-${alert.id}`}
                            >
                              <CheckCheck className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
                  <h3 className="text-lg font-semibold mb-1">No Alerts Found</h3>
                  <p className="text-muted-foreground">
                    {statusFilter !== "all" || severityFilter !== "all" 
                      ? "No alerts match your filters. Try adjusting the filter criteria."
                      : "All systems are running smoothly. No alerts to display."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RequireAdminAuth>
  );
}
