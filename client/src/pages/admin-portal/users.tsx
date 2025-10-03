import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Search,
  Filter,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Calendar,
  MoreVertical,
  Eye
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/admin/AdminLayout";
import { RequireAdminAuth } from "@/components/admin/RequireAdminAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  isActive: boolean;
  role: "user" | "admin";
  lastLogin: string;
  createdAt: string;
  totalLoans: number;
  totalExposure: number;
}

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Fetch all users
  const { data: users, isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users/all'],
    staleTime: 60000, // 1 minute
  });

  const filteredUsers = users?.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && user.isActive) ||
      (statusFilter === "inactive" && !user.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const handleUserAction = async (userId: string, action: "activate" | "deactivate" | "view") => {
    switch (action) {
      case "activate":
        // TODO: Implement user activation
        console.log(`Activating user ${userId}`);
        break;
      case "deactivate":
        // TODO: Implement user deactivation
        console.log(`Deactivating user ${userId}`);
        break;
      case "view":
        // TODO: Navigate to user detail view
        console.log(`Viewing user ${userId}`);
        break;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <RequireAdminAuth>
      <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 space-y-6" data-testid="page-admin-users">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage user accounts and permissions</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Badge variant="outline" className="border-red-200 text-red-700 dark:border-red-800 dark:text-red-300 whitespace-nowrap">
              {users?.length || 0} Total Users
            </Badge>
            <Badge variant="outline" className="border-green-200 text-green-700 dark:border-green-800 dark:text-green-300 whitespace-nowrap">
              {users?.filter(u => u.isActive).length || 0} Active
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                  data-testid="input-user-search"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => setStatusFilter("all")}
                  data-testid="filter-all"
                  className={`h-12 flex-1 sm:flex-none ${statusFilter === "all" ? "bg-red-600 hover:bg-red-700" : ""}`}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "active" ? "default" : "outline"}
                  onClick={() => setStatusFilter("active")}
                  data-testid="filter-active"
                  className={`h-12 flex-1 sm:flex-none ${statusFilter === "active" ? "bg-green-600 hover:bg-green-700" : ""}`}
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === "inactive" ? "default" : "outline"}
                  onClick={() => setStatusFilter("inactive")}
                  data-testid="filter-inactive"
                  className={`h-12 flex-1 sm:flex-none ${statusFilter === "inactive" ? "bg-gray-600 hover:bg-gray-700" : ""}`}
                >
                  Inactive
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card data-testid="card-users-list">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-red-600 dark:text-red-400" />
              All Users ({filteredUsers?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {usersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg min-w-[500px]">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              ) : filteredUsers && filteredUsers.length > 0 ? (
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div 
                      key={user.id} 
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors min-w-[500px]"
                      data-testid={`user-row-${user.id}`}
                    >
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 text-white rounded-full flex items-center justify-center font-medium flex-shrink-0">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-gray-900 dark:text-white break-words">
                              {user.firstName} {user.lastName}
                            </p>
                            <Badge 
                              variant={user.isActive ? "default" : "secondary"}
                              className={`text-xs whitespace-nowrap ${
                                user.isActive 
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                              }`}
                            >
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {user.role === "admin" && (
                              <Badge variant="outline" className="text-xs border-red-200 text-red-700 dark:border-red-800 dark:text-red-300 whitespace-nowrap">
                                <Shield className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="break-all">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <Calendar className="w-3 h-3 flex-shrink-0" />
                              Last login: {new Date(user.lastLogin).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                            <span className="whitespace-nowrap">{user.totalLoans} loans</span>
                            <span className="whitespace-nowrap">Total exposure: {formatCurrency(user.totalExposure)}</span>
                            <span className="whitespace-nowrap">Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="h-12 w-12 p-0"
                              data-testid={`user-actions-${user.id}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleUserAction(user.id, "view")}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {user.isActive ? (
                              <DropdownMenuItem 
                                onClick={() => handleUserAction(user.id, "deactivate")}
                                className="text-red-600 dark:text-red-400"
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Deactivate User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleUserAction(user.id, "activate")}
                                className="text-green-600 dark:text-green-400"
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activate User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? "No users found matching your search" : "No users found"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      </AdminLayout>
    </RequireAdminAuth>
  );
}