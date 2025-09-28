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
  BarChart3
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalLoans: number;
  totalBanks: number;
  systemHealth: "healthy" | "warning" | "critical";
  lastBackup: string;
  errorRate: number;
}

interface SystemUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  lastLogin: string;
  isActive: boolean;
  role: "user" | "admin";
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "system">("overview");

  // Fetch system statistics
  const { data: stats, isLoading: statsLoading } = useQuery<SystemStats>({
    queryKey: ['/api/admin/stats'],
    staleTime: 30000, // 30 seconds
  });

  // Fetch system users
  const { data: users, isLoading: usersLoading } = useQuery<SystemUser[]>({
    queryKey: ['/api/admin/users'],
    staleTime: 60000, // 1 minute
  });

  const handleRefreshData = () => {
    // Force refresh of all admin data
    window.location.reload();
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "healthy": return "text-green-600 bg-green-100";
      case "warning": return "text-yellow-600 bg-yellow-100";
      case "critical": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-admin">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Portal</h1>
          <p className="text-gray-600 mt-1">System management and user oversight</p>
        </div>
        <Button 
          onClick={handleRefreshData}
          variant="outline"
          data-testid="button-refresh-data"
        >
          <Activity className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "overview" 
              ? "bg-white text-gray-900 shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          }`}
          data-testid="tab-overview"
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "users" 
              ? "bg-white text-gray-900 shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          }`}
          data-testid="tab-users"
        >
          <Users className="w-4 h-4 inline mr-2" />
          Users
        </button>
        <button
          onClick={() => setActiveTab("system")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "system" 
              ? "bg-white text-gray-900 shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          }`}
          data-testid="tab-system"
        >
          <Settings className="w-4 h-4 inline mr-2" />
          System
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="card-total-users">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                {statsLoading ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  `${stats?.activeUsers || 0} active users`
                )}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-loans">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalLoans || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Across {stats?.totalBanks || 0} banks
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-system-health">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
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

          <Card data-testid="card-last-backup">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {stats?.lastBackup ? new Date(stats.lastBackup).toLocaleDateString() : "Never"}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                System backup status
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <Card data-testid="card-users-list">
          <CardHeader>
            <CardTitle>System Users</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage user accounts and permissions
            </p>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : users && users.length > 0 ? (
              <div className="space-y-4">
                {users.map((user) => (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`user-row-${user.id}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-saudi text-white rounded-full flex items-center justify-center">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Last login: {new Date(user.lastLogin).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={user.isActive ? "default" : "secondary"}
                        className={user.isActive ? "bg-green-100 text-green-800" : ""}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No users found</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* System Tab */}
      {activeTab === "system" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-system-info">
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Application Version</span>
                <span className="text-muted-foreground">v1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Database Status</span>
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Authentication</span>
                <span className="text-muted-foreground">Replit Auth</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Storage</span>
                <span className="text-muted-foreground">PostgreSQL + Object Storage</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-system-actions">
            <CardHeader>
              <CardTitle>System Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full"
                data-testid="button-system-backup"
              >
                <Database className="w-4 h-4 mr-2" />
                Create System Backup
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                data-testid="button-clear-cache"
              >
                <Activity className="w-4 h-4 mr-2" />
                Clear Application Cache
              </Button>
              <Button 
                variant="destructive" 
                className="w-full"
                data-testid="button-emergency-mode"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Emergency Maintenance Mode
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}