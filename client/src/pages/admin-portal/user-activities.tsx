import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/admin/AdminLayout";
import { RequireAdminAuth } from "@/components/admin/RequireAdminAuth";
import { 
  Activity, 
  Search, 
  Filter, 
  Download,
  Calendar,
  User,
  Globe
} from "lucide-react";

interface UserActivity {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  timestamp: string;
  details: string;
  ipAddress: string;
  userAgent: string;
}

interface ActivitiesResponse {
  activities: UserActivity[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminUserActivitiesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterAction, setFilterAction] = useState("");

  const { data, isLoading } = useQuery<ActivitiesResponse>({
    queryKey: ['/api/admin/user-activities', { page: currentPage, limit: 20, action: filterAction }],
    staleTime: 30000,
  });

  const filteredActivities = data?.activities.filter(activity =>
    !searchTerm ||
    activity.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    if (!data?.activities) return;
    
    const csv = [
      ['Timestamp', 'User', 'Action', 'Details', 'IP Address'].join(','),
      ...data.activities.map(a => [
        new Date(a.timestamp).toLocaleString(),
        a.userEmail,
        a.action,
        a.details,
        a.ipAddress
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-activities-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <RequireAdminAuth>
      <AdminLayout>
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
                User Activities
              </h1>
              <p className="text-muted-foreground mt-1">
                Detailed activity log with filtering and export
              </p>
            </div>
            <Button onClick={handleExport} variant="outline" data-testid="button-export-csv">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user, action, or details..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-activities"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterAction === "" ? "default" : "outline"}
                    onClick={() => setFilterAction("")}
                    data-testid="button-filter-all"
                  >
                    All Actions
                  </Button>
                  <Button
                    variant={filterAction === "Created new loan" ? "default" : "outline"}
                    onClick={() => setFilterAction("Created new loan")}
                    data-testid="button-filter-loans"
                  >
                    Loans
                  </Button>
                  <Button
                    variant={filterAction === "Updated facility" ? "default" : "outline"}
                    onClick={() => setFilterAction("Updated facility")}
                    data-testid="button-filter-facilities"
                  >
                    Facilities
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activities Table */}
          <Card data-testid="card-activities-list">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                Activity Log ({data?.total || 0} total)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredActivities && filteredActivities.length > 0 ? (
                <div className="space-y-3">
                  {filteredActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      data-testid={`activity-${activity.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-normal">
                              {activity.action}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(activity.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 text-muted-foreground" />
                              <span className="font-medium">{activity.userEmail}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{activity.ipAddress}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{activity.details}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No activities found</p>
                </div>
              )}

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    data-testid="button-prev-page"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {data.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={currentPage === data.totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    data-testid="button-next-page"
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RequireAdminAuth>
  );
}
