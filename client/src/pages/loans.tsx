import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Calendar,
  Building,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Eye,
  MoreVertical,
  Download,
  RefreshCw,
  Trash2,
  Edit,
  Banknote,
  ChevronDown
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import backgroundImage from "@assets/loan_management_background_excel_green_1759302449019.png";

type SortField = 'dueDate' | 'amount' | 'bank' | 'startDate' | 'status' | 'dailyInterest';
type SortOrder = 'asc' | 'desc';
type StatusFilter = 'all' | 'critical' | 'warning' | 'normal' | 'settled';

export default function Loans() {
  const { isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Enhanced filtering and sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [bankFilter, setBankFilter] = useState<string>('all');
  
  // Tab state management
  const [activeTab, setActiveTab] = useState<"active" | "settled">("active");
  
  // Load more state for active loans
  const [visibleActiveLoans, setVisibleActiveLoans] = useState(8);
  
  // Delete confirmation dialog state
  const [loanToDelete, setLoanToDelete] = useState<string | null>(null);

  // Reset visible loans when filters change
  useEffect(() => {
    setVisibleActiveLoans(8);
  }, [searchQuery, statusFilter, bankFilter, sortField, sortOrder]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: activeLoans, isLoading: activeLoading, error: activeError } = useQuery({
    queryKey: ["/api/loans"],
    enabled: isAuthenticated,
  });

  const { data: settledLoans, isLoading: settledLoading } = useQuery({
    queryKey: ["/api/loans", "settled"],
    queryFn: async () => {
      const response = await fetch("/api/loans?status=settled");
      if (!response.ok) throw new Error("Failed to fetch settled loans");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const { data: banks } = useQuery({
    queryKey: ["/api/banks"],
    enabled: isAuthenticated,
  });

  const settleLoanMutation = useMutation({
    mutationFn: async ({ loanId, settledAmount }: { loanId: string; settledAmount: number }) => {
      await apiRequest("POST", `/api/loans/${loanId}/settle`, { 
        date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
        amount: settledAmount.toString(), // Convert to string as required by schema
        memo: "Loan settlement via Settle Loan button"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loans", "settled"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      
      // Automatically switch to settled loans tab
      setActiveTab("settled");
      
      toast({
        title: "Success",
        description: "Loan settled successfully - switched to Settled Loans tab",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to settle loan",
        variant: "destructive",
      });
    },
  });

  const deleteLoanMutation = useMutation({
    mutationFn: async (loanId: string) => {
      return apiRequest('DELETE', `/api/loans/${loanId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      toast({
        title: "Success",
        description: "Loan cancelled successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to cancel loan",
        variant: "destructive",
      });
    },
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (activeError && isUnauthorizedError(activeError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [activeError, toast]);

  // Enhanced urgency calculation
  const getLoanUrgency = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const daysDiff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysDiff < 0) return { 
      variant: 'destructive' as const, 
      label: `Overdue by ${Math.abs(daysDiff)} days`,
      priority: 0,
      status: 'critical' as const
    };
    if (daysDiff <= 7) return { 
      variant: 'destructive' as const, 
      label: `Due in ${daysDiff} days`,
      priority: 1,
      status: 'critical' as const
    };
    if (daysDiff <= 15) return { 
      variant: 'secondary' as const, 
      label: `Due in ${daysDiff} days`,
      priority: 2,
      status: 'warning' as const
    };
    return { 
      variant: 'default' as const, 
      label: `Due in ${daysDiff} days`,
      priority: 3,
      status: 'normal' as const
    };
  };

  // Enhanced filtering and sorting logic
  const filteredAndSortedActiveLoans = useMemo(() => {
    if (!activeLoans) return [];
    
    let filtered = (activeLoans as any[]).filter((loan: any) => {
      // Search filter (null-safe)
      const searchLower = searchQuery.toLowerCase();
      const searchMatch = !searchQuery || 
        ((loan.referenceNumber || "").toLowerCase()).includes(searchLower) ||
        ((loan.facility?.bank?.name || "").toLowerCase()).includes(searchLower) ||
        ((loan.notes || "").toLowerCase()).includes(searchLower);
      
      // Status filter
      const urgency = getLoanUrgency(loan.dueDate);
      const statusMatch = statusFilter === 'all' || urgency.status === statusFilter;
      
      // Bank filter
      const bankMatch = bankFilter === 'all' || loan.facility?.bank?.id === bankFilter;
      
      return searchMatch && statusMatch && bankMatch;
    });

    // Sort logic
    filtered.sort((a: any, b: any) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'dueDate':
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'amount':
          comparison = parseFloat(a.amount) - parseFloat(b.amount);
          break;
        case 'bank':
          comparison = (a.facility?.bank?.name || "").localeCompare(b.facility?.bank?.name || "");
          break;
        case 'startDate':
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          break;
        case 'status':
          const aUrgency = getLoanUrgency(a.dueDate);
          const bUrgency = getLoanUrgency(b.dueDate);
          comparison = aUrgency.priority - bUrgency.priority;
          break;
        case 'dailyInterest':
          const aAmount = Number(a.amount) || 0;
          const aRates = (Number(a.siborRate) || 0) + (Number(a.bankRate) || 0);
          const aDailyInterest = (aAmount * aRates / 100) / 365;
          
          const bAmount = Number(b.amount) || 0;
          const bRates = (Number(b.siborRate) || 0) + (Number(b.bankRate) || 0);
          const bDailyInterest = (bAmount * bRates / 100) / 365;
          
          comparison = aDailyInterest - bDailyInterest;
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [activeLoans, searchQuery, statusFilter, bankFilter, sortField, sortOrder]);

  const filteredSettledLoans = useMemo(() => {
    if (!settledLoans) return [];
    
    return (settledLoans as any[]).filter((loan: any) => {
      const searchLower = searchQuery.toLowerCase();
      const searchMatch = !searchQuery || 
        ((loan.referenceNumber || "").toLowerCase()).includes(searchLower) ||
        ((loan.facility?.bank?.name || "").toLowerCase()).includes(searchLower);
      
      const bankMatch = bankFilter === 'all' || loan.facility?.bank?.id === bankFilter;
      
      return searchMatch && bankMatch;
    });
  }, [settledLoans, searchQuery, bankFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSettleLoan = (loanId: string, amount: string) => {
    const settledAmount = parseFloat(amount);
    if (isNaN(settledAmount) || settledAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid settlement amount",
        variant: "destructive",
      });
      return;
    }
    settleLoanMutation.mutate({ loanId, settledAmount });
  };

  const handleDeleteLoan = (loanId: string) => {
    setLoanToDelete(loanId);
  };
  
  const confirmDeleteLoan = () => {
    if (loanToDelete) {
      deleteLoanMutation.mutate(loanToDelete);
      setLoanToDelete(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return (amount / 1000000).toFixed(3).replace(/\.?0+$/, '') + "M SAR";
  };

  const exportLoans = () => {
    toast({
      title: "Export Started",
      description: "Your loan data is being prepared for download",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Statistics for header (null-safe)
  const totalActiveAmount = filteredAndSortedActiveLoans.reduce((sum: number, loan: any) => 
    sum + (Number(loan.amount) || 0), 0
  );
  const criticalLoans = filteredAndSortedActiveLoans.filter((loan: any) => 
    getLoanUrgency(loan.dueDate).status === 'critical'
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="px-4 sm:px-6 py-6 space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Loan Management</h1>
            <div className="flex items-center space-x-6 mt-2">
              <p className="text-gray-600 dark:text-gray-300">
                Total Active: {formatCurrency(totalActiveAmount)}
              </p>
              {criticalLoans > 0 && (
                <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">{criticalLoans} urgent loans</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={exportLoans} className="h-10 w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button 
              onClick={() => setLocation("/loans/create")}
              className="h-10 w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              data-testid="button-add-loan"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Loan
            </Button>
          </div>
        </div>

        {/* Enhanced Filters and Search */}
        <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 h-4 w-4 text-muted-foreground top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Search loans, banks, or reference numbers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10"
                    data-testid="input-loan-search"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="critical">Critical (Due Soon)</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                </SelectContent>
              </Select>

              {/* Bank Filter */}
              <Select value={bankFilter} onValueChange={setBankFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filter by Bank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Banks</SelectItem>
                  {(banks as any[])?.map((bank: any) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-between h-10 w-full">
                    <div className="flex items-center">
                      {sortOrder === 'asc' ? <SortAsc className="mr-2 h-4 w-4" /> : <SortDesc className="mr-2 h-4 w-4" />}
                      Sort
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleSort('dueDate')}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Due Date {sortField === 'dueDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort('amount')}>
                    <span className="mr-2 font-bold">﷼</span>
                    Amount {sortField === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort('bank')}>
                    <Building className="mr-2 h-4 w-4" />
                    Bank {sortField === 'bank' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort('status')}>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Priority {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort('dailyInterest')}>
                    <Clock className="mr-2 h-4 w-4" />
                    Daily Interest {sortField === 'dailyInterest' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Active filters display */}
            {(searchQuery || statusFilter !== 'all' || bankFilter !== 'all') && (
              <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="text-xs">
                    Search: {searchQuery}
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Status: {statusFilter}
                  </Badge>
                )}
                {bankFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Bank: {(banks as any[])?.find((b: any) => b.id === bankFilter)?.name}
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter('all');
                    setBankFilter('all');
                  }}
                  className="text-xs h-8"
                >
                  Clear All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "active" | "settled")} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="active" className="h-10 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Active Loans ({filteredAndSortedActiveLoans.length})
            </TabsTrigger>
            <TabsTrigger value="settled" className="h-10 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Settled Loans ({filteredSettledLoans.length})
            </TabsTrigger>
          </TabsList>

          {/* Enhanced Active Loans Tab */}
          <TabsContent value="active" className="space-y-4">
            {activeLoading ? (
              <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <CardContent className="flex items-center justify-center py-12">
                  <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mr-3" />
                  <span className="text-gray-600 dark:text-gray-400">Loading active loans...</span>
                </CardContent>
              </Card>
            ) : filteredAndSortedActiveLoans.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {(activeLoans as any[])?.length === 0 ? "No active loans found" : "No loans match your current filters"}
                  </p>
                  {(activeLoans as any[])?.length === 0 ? (
                    <Button 
                      onClick={() => setLocation("/loans/create")}
                      className="h-10 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                      data-testid="button-add-first-loan"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Loan
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      className="h-10"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter('all');
                        setBankFilter('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4">
                {filteredAndSortedActiveLoans.slice(0, visibleActiveLoans).map((loan: any) => {
                  const urgency = getLoanUrgency(loan.dueDate);
                  const loanAmount = Number(loan.amount) || 0;
                  const totalRate = (Number(loan.siborRate) || 0) + (Number(loan.bankRate) || 0);
                  const dailyInterest = (loanAmount * totalRate / 100) / 365;
                  
                  return (
                    <Card 
                      key={loan.id} 
                      className={`border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 ${
                        urgency.status === 'critical' ? 'border-l-4 border-l-red-500' :
                        urgency.status === 'warning' ? 'border-l-4 border-l-amber-500' :
                        'border-l-4 border-l-emerald-500'
                      }`}
                      data-testid={`card-active-loan-${loan.id}`}
                    >
                      <CardContent className="p-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                              <span className="text-white font-bold text-xs">
                                {loan.facility?.bank?.name?.substring(0, 3) || 'BNK'}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100" data-testid={`text-loan-bank-${loan.id}`}>
                                {loan.facility?.bank?.name || 'Unknown Bank'}
                              </h3>
                              <p className="text-xs text-gray-600 dark:text-gray-400" data-testid={`text-loan-reference-${loan.id}`}>
                                Reference: {loan.referenceNumber}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={urgency.variant} 
                              className={`text-xs ${
                                urgency.status === 'critical' ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400' :
                                urgency.status === 'warning' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-400' :
                                'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400'
                              }`}
                              data-testid={`badge-loan-urgency-${loan.id}`}
                            >
                              {urgency.label}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setLocation(`/loans/${loan.id}`)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Documents
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLocation(`/loans/${loan.id}/edit`)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setLocation(`/loans/${loan.id}/payment`)}>
                                  Process Payment
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLocation(`/history?loanId=${loan.id}`)}>
                                  <Clock className="mr-2 h-4 w-4" />
                                  View History
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleSettleLoan(loan.id, loan.amount)}
                                  disabled={settleLoanMutation.isPending}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Settle Loan
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Amount and Interest */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Loan Amount</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid={`text-loan-amount-${loan.id}`}>
                              {formatCurrency(Number(loan.amount) || 0)}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Interest: SIBOR + {loan.bankRate}% = {((Number(loan.siborRate) || 0) + (Number(loan.bankRate) || 0)).toFixed(2)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Daily Interest Cost</p>
                            <p className="text-xl font-bold text-red-600 dark:text-red-400">
                              {dailyInterest.toLocaleString('en-SA', { 
                                minimumFractionDigits: 0, 
                                maximumFractionDigits: 0 
                              })} SAR
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Monthly: {(dailyInterest * 30).toLocaleString('en-SA', { 
                                minimumFractionDigits: 0, 
                                maximumFractionDigits: 0 
                              })} SAR
                            </p>
                          </div>
                        </div>
                        
                        {/* Dates and Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Start Date</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {new Date(loan.startDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Due Date</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {new Date(loan.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Duration</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {Math.ceil((new Date(loan.dueDate).getTime() - new Date(loan.startDate).getTime()) / (1000 * 3600 * 24))} days
                            </p>
                          </div>
                        </div>

                        {loan.notes && (
                          <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Notes</p>
                            <p className="text-xs text-gray-900 dark:text-gray-100">{loan.notes}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setLocation(`/loans/${loan.id}`)}
                              data-testid={`button-view-details-${loan.id}`}
                              className="h-10 flex-1 sm:flex-initial"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setLocation(`/loans/${loan.id}?tab=documents`)}
                              data-testid={`button-documents-${loan.id}`} 
                              className="h-10 flex-1 sm:flex-initial"
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Documents
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setLocation(`/loans/${loan.id}/payment/create`)}
                              data-testid={`button-payment-${loan.id}`}
                              className="h-10 flex-1 sm:flex-initial"
                            >
                              <Banknote className="mr-2 h-4 w-4" />
                              Payment
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setLocation(`/history?loanId=${loan.id}`)}
                              data-testid={`button-history-${loan.id}`}
                              className="h-10 flex-1 sm:flex-initial"
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              History
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              className={`${
                                urgency.status === 'critical' 
                                  ? 'bg-red-600 hover:bg-red-700' 
                                  : 'bg-emerald-600 hover:bg-emerald-700'
                              } text-white shadow-lg hover:shadow-xl transition-all duration-300 h-10 flex-1 sm:flex-initial`}
                              size="sm"
                              onClick={() => handleSettleLoan(loan.id, loan.amount)}
                              disabled={settleLoanMutation.isPending}
                              data-testid={`button-settle-${loan.id}`}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              {settleLoanMutation.isPending ? 'Settling...' : 'Settle Loan'}
                            </Button>
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteLoan(loan.id)}
                              disabled={deleteLoanMutation.isPending}
                              data-testid={`button-delete-loan-${loan.id}`}
                              className="h-10 flex-1 sm:flex-initial text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {deleteLoanMutation.isPending ? 'Deleting...' : 'Delete Loan'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {/* Load More Button */}
              {filteredAndSortedActiveLoans.length > visibleActiveLoans && (
                <div className="mt-4 flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setVisibleActiveLoans(prev => prev + 8)}
                    data-testid="button-load-more-loans"
                    className="h-10"
                  >
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Load more ({filteredAndSortedActiveLoans.length - visibleActiveLoans} remaining)
                  </Button>
                </div>
              )}
              </div>
            )}
          </TabsContent>

          {/* Enhanced Settled Loans Tab */}
          <TabsContent value="settled" className="space-y-4">
            {settledLoading ? (
              <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <CardContent className="flex items-center justify-center py-12">
                  <RefreshCw className="animate-spin h-8 w-8 text-emerald-600 mr-3" />
                  <span className="text-gray-600 dark:text-gray-400">Loading settled loans...</span>
                </CardContent>
              </Card>
            ) : filteredSettledLoans.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No settled loans found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredSettledLoans.map((loan: any) => (
                  <Card 
                    key={loan.id} 
                    className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-l-4 border-l-emerald-500 opacity-90"
                    data-testid={`card-settled-loan-${loan.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                            <CheckCircle className="text-white h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100" data-testid={`text-settled-loan-bank-${loan.id}`}>
                              {loan.facility?.bank?.name || 'Unknown Bank'}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400" data-testid={`text-settled-loan-reference-${loan.id}`}>
                              Reference: {loan.referenceNumber}
                            </p>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400">
                            Settled
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid={`text-settled-loan-amount-${loan.id}`}>
                            {loan.settledAmount ? formatCurrency(Number(loan.settledAmount) || 0) : formatCurrency(Number(loan.amount) || 0)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Original: {formatCurrency(Number(loan.amount) || 0)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Start Date</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {new Date(loan.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Original Due Date</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {new Date(loan.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Settled Date</p>
                          <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {loan.settledDate ? new Date(loan.settledDate).toLocaleDateString() : 'Recently'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Loan Confirmation Dialog */}
      <AlertDialog open={!!loanToDelete} onOpenChange={(open) => !open && setLoanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Loan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this loan? This action cannot be undone and will permanently remove the loan from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLoanToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteLoan}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Loan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}