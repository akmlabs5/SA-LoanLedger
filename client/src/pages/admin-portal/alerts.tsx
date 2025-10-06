import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/admin/AdminLayout";
import { RequireAdminAuth } from "@/components/admin/RequireAdminAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  AlertTriangle, 
  Info, 
  XCircle, 
  CheckCircle2,
  Bell,
  BellOff
} from "lucide-react";

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  severity: 'low' | 'medium' | 'high';
}

export default function AdminAlertsPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'unacknowledged'>('all');

  const { data: alerts, isLoading } = useQuery<Alert[]>({
    queryKey: ['/api/admin/alerts'],
    staleTime: 30000,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to acknowledge alert');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/alerts'] });
      toast({
        title: "Alert acknowledged",
        description: "The alert has been marked as acknowledged",
      });
    },
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10';
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10';
      case 'info':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10';
      default:
        return 'border-border bg-muted/30';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const filteredAlerts = alerts?.filter(alert => 
    filter === 'all' || !alert.acknowledged
  );

  const unacknowledgedCount = alerts?.filter(a => !a.acknowledged).length || 0;

  return (
    <RequireAdminAuth>
      <AdminLayout>
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
                System Alerts
              </h1>
              <p className="text-muted-foreground mt-1">
                Monitor system notifications and alerts
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-base">
                <Bell className="w-4 h-4 mr-1" />
                {unacknowledgedCount} unacknowledged
              </Badge>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              data-testid="button-filter-all"
            >
              All Alerts
            </Button>
            <Button
              variant={filter === 'unacknowledged' ? 'default' : 'outline'}
              onClick={() => setFilter('unacknowledged')}
              data-testid="button-filter-unacknowledged"
            >
              Unacknowledged ({unacknowledgedCount})
            </Button>
          </div>

          {/* Alerts List */}
          <Card data-testid="card-alerts-list">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                Active Alerts ({filteredAlerts?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : filteredAlerts && filteredAlerts.length > 0 ? (
                <div className="space-y-4">
                  {filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`border rounded-lg p-4 ${getAlertColor(alert.type)}`}
                      data-testid={`alert-${alert.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getAlertIcon(alert.type)}
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{alert.title}</h3>
                              <Badge className={getSeverityBadge(alert.severity)}>
                                {alert.severity}
                              </Badge>
                              {alert.acknowledged && (
                                <Badge variant="outline" className="text-green-600 dark:text-green-400">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Acknowledged
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">{alert.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {!alert.acknowledged && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => acknowledgeMutation.mutate(alert.id)}
                            disabled={acknowledgeMutation.isPending}
                            data-testid={`button-acknowledge-${alert.id}`}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BellOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No alerts to display</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alert Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card data-testid="card-error-alerts">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Alerts</CardTitle>
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {alerts?.filter(a => a.type === 'error').length || 0}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-warning-alerts">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Warning Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                  {alerts?.filter(a => a.type === 'warning').length || 0}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-info-alerts">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Info Alerts</CardTitle>
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {alerts?.filter(a => a.type === 'info').length || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </RequireAdminAuth>
  );
}
