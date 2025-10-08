import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/admin/AdminLayout";
import { RequireAdminAuth } from "@/components/admin/RequireAdminAuth";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Lock,
  Users,
  Globe
} from "lucide-react";

interface SecurityData {
  failedLogins: Array<{
    email: string;
    attempts: number;
    lastAttempt: string;
    ipAddress: string;
  }>;
  accessLogs: Array<{
    user: string;
    action: string;
    timestamp: string;
    status: string;
    ipAddress: string;
  }>;
  securitySettings: {
    sessionTimeout: number;
    maxFailedAttempts: number;
    ipWhitelist: string[];
    twoFactorEnabled: boolean;
    passwordPolicy: string;
  };
  activeAdminSessions: number;
  suspiciousActivity: number;
}

export default function AdminSecurityPage() {
  const { data: securityData, isLoading } = useQuery<SecurityData>({
    queryKey: ['/api/admin/security'],
    staleTime: 30000,
  });

  const getStatusColor = (status: string) => {
    return status === 'success' 
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
  };

  const getStatusBadge = (status: string) => {
    return status === 'success' 
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
                Security Monitor
              </h1>
              <p className="text-muted-foreground mt-1">
                Access logs, failed login attempts, and security settings
              </p>
            </div>
          </div>

          {/* Security Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card data-testid="card-active-sessions">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Admin Sessions</CardTitle>
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <div className="text-2xl font-bold">{securityData?.activeAdminSessions || 0}</div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-failed-logins">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed Login Attempts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {securityData?.failedLogins.length || 0}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-suspicious-activity">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Suspicious Activity</CardTitle>
                <Shield className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    {securityData?.suspiciousActivity || 0}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-2fa-status">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">2FA Status</CardTitle>
                <Lock className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <Badge className={securityData?.securitySettings.twoFactorEnabled 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                  }>
                    {securityData?.securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Failed Login Attempts */}
          <Card data-testid="card-failed-login-list">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                Failed Login Attempts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : securityData && securityData.failedLogins.length > 0 ? (
                <div className="space-y-3">
                  {securityData.failedLogins.map((attempt, idx) => (
                    <div
                      key={idx}
                      className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/10"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-red-900 dark:text-red-100">{attempt.email}</p>
                          <div className="flex items-center gap-4 text-sm text-red-700 dark:text-red-300">
                            <span>{attempt.attempts} attempts</span>
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {attempt.ipAddress}
                            </span>
                            <span>{new Date(attempt.lastAttempt).toLocaleString()}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" data-testid={`button-block-${idx}`}>
                          Block IP
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-muted-foreground">No failed login attempts</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Access Logs */}
          <Card data-testid="card-access-logs">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Recent Access Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold">User</th>
                        <th className="text-left py-3 px-4 font-semibold">Action</th>
                        <th className="text-left py-3 px-4 font-semibold">IP Address</th>
                        <th className="text-left py-3 px-4 font-semibold">Timestamp</th>
                        <th className="text-center py-3 px-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {securityData?.accessLogs.map((log, idx) => (
                        <tr key={idx} className="border-b border-border lg:hover:bg-muted/50">
                          <td className="py-3 px-4">{log.user}</td>
                          <td className="py-3 px-4 text-muted-foreground">{log.action}</td>
                          <td className="py-3 px-4 text-muted-foreground font-mono text-sm">
                            {log.ipAddress}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-sm">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge className={getStatusBadge(log.status)}>
                              {log.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card data-testid="card-security-settings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-border rounded-lg p-4">
                    <p className="text-sm font-medium mb-1">Session Timeout</p>
                    <p className="text-2xl font-bold">{securityData?.securitySettings.sessionTimeout}h</p>
                  </div>
                  <div className="border border-border rounded-lg p-4">
                    <p className="text-sm font-medium mb-1">Max Failed Attempts</p>
                    <p className="text-2xl font-bold">{securityData?.securitySettings.maxFailedAttempts}</p>
                  </div>
                  <div className="border border-border rounded-lg p-4">
                    <p className="text-sm font-medium mb-1">Password Policy</p>
                    <Badge>{securityData?.securitySettings.passwordPolicy}</Badge>
                  </div>
                  <div className="border border-border rounded-lg p-4">
                    <p className="text-sm font-medium mb-1">IP Whitelist</p>
                    <p className="text-muted-foreground">
                      {securityData?.securitySettings.ipWhitelist.length || 0} IPs whitelisted
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RequireAdminAuth>
  );
}
