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
  ChevronDown,
  Undo2
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import backgroundImage from "@assets/loan_management_background_excel_green_1759302449019.png";
import { MobileHeader, FloatingActionButton, ActionSheet } from "@/components/mobile";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageContainer, PageHeader, Section } from "@/components/PageContainer";

type SortField = 'dueDate' | 'amount' | 'bank' | 'startDate' | 'status' | 'dailyInterest';
type SortOrder = 'asc' | 'desc';
type StatusFilter = 'all' | 'critical' | 'warning' | 'normal' | 'settled';

export default function Loans() {
  const { isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  
  // Enhanced filtering and sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [bankFilter, setBankFilter] = useState<string>('all');
  
  // Tab state management
  const [activeTab, setActiveTab] = useState<"active" | "settled" | "cancelled">("active");
  
  // Load more state for active loans
  const [visibleActiveLoans, setVisibleActiveLoans] = useState(8);
  
  // Delete confirmation dialog state
  const [loanToDelete, setLoanToDelete] = useState<string | null>(null);

  // Mobile action sheet state
  const [selectedLoanForAction, setSelectedLoanForAction] = useState<any | null>(null);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Undo settlement state
  const [loanToUndo, setLoanToUndo] = useState<string | null>(null);

  // Permanent delete state
  const [loanToPermanentlyDelete, setLoanToPermanentlyDelete] = useState<string | null>(null);

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

  const { data: cancelledLoans, isLoading: cancelledLoading } = useQuery({
    queryKey: ["/api/loans", "cancelled"],
    queryFn: async () => {
      const response = await fetch("/api/loans?status=cancelled");
      if (!response.ok) throw new Error("Failed to fetch cancelled loans");
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
        date: new Date().toISOString().split('T')[0],
        amount: settledAmount.toString(),
        memo: "Loan settlement via Settle Loan button"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loans", "settled"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      
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
      queryClient.invalidateQueries({ queryKey: ["/api/loans", "cancelled"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      
      setActiveTab("cancelled");
      
      toast({
        title: "Success",
        description: "Loan cancelled successfully - moved to Cancelled Loans tab",
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

  const reverseSettlementMutation = useMutation({
    mutationFn: async (loanId: string) => {
      return apiRequest('POST', `/api/loans/${loanId}/reverse-settlement`, { reason: '' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loans", "settled"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      setLoanToUndo(null);
      setActiveTab("active"); // Switch to active tab to see the reverted loan
      toast({
        title: "Success",
        description: "Settlement reversed - loan is now active again",
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
        description: "Failed to reverse settlement",
        variant: "destructive",
      });
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (loanId: string) => {
      return apiRequest('POST', `/api/loans/${loanId}/permanent-delete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans", "cancelled"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      setLoanToPermanentlyDelete(null);
      toast({
        title: "Success",
        description: "Loan permanently deleted from system",
      });
    },
    onError: (error: any) => {
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
        description: error.message || "Failed to permanently delete loan",
        variant: "destructive",
      });
    },
  });

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

  const filteredAndSortedActiveLoans = useMemo(() => {
    if (!activeLoans) return [];
    
    let filtered = (activeLoans as any[]).filter((loan: any) => {
      const searchLower = searchQuery.toLowerCase();
      const searchMatch = !searchQuery || 
        ((loan.referenceNumber || "").toLowerCase()).includes(searchLower) ||
        ((loan.facility?.bank?.name || "").toLowerCase()).includes(searchLower) ||
        ((loan.notes || "").toLowerCase()).includes(searchLower);
      
      const urgency = getLoanUrgency(loan.dueDate);
      const statusMatch = statusFilter === 'all' || urgency.status === statusFilter;
      
      const bankMatch = bankFilter === 'all' || loan.facility?.bank?.id === bankFilter;
      
      return searchMatch && statusMatch && bankMatch;
    });

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
          const aRates = Number(a.bankRate) || 0; // bankRate already includes SIBOR + margin
          const aDailyInterest = (aAmount * aRates / 100) / 365;
          
          const bAmount = Number(b.amount) || 0;
          const bRates = Number(b.bankRate) || 0; // bankRate already includes SIBOR + margin
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

  const filteredCancelledLoans = useMemo(() => {
    if (!cancelledLoans) return [];
    
    return (cancelledLoans as any[]).filter((loan: any) => {
      const searchLower = searchQuery.toLowerCase();
      const searchMatch = !searchQuery || 
        ((loan.referenceNumber || "").toLowerCase()).includes(searchLower) ||
        ((loan.facility?.bank?.name || "").toLowerCase()).includes(searchLower);
      
      const bankMatch = bankFilter === 'all' || loan.facility?.bank?.id === bankFilter;
      
      return searchMatch && bankMatch;
    });
  }, [cancelledLoans, searchQuery, bankFilter]);

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

  const handleLoanCardClick = (loanId: string) => {
    setLocation(`/loans/${loanId}`);
  };

  const openLoanActions = (loan: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedLoanForAction(loan);
    setIsActionSheetOpen(true);
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

  const totalActiveAmount = filteredAndSortedActiveLoans.reduce((sum: number, loan: any) => 
    sum + (Number(loan.amount) || 0), 0
  );
  const criticalLoans = filteredAndSortedActiveLoans.filter((loan: any) => 
    getLoanUrgency(loan.dueDate).status === 'critical'
  ).length;

  const filterActions = [
    {
      id: 'status-all',
      label: 'All Status',
      onClick: () => setStatusFilter('all'),
      icon: <Filter className="h-5 w-5" />,
    },
    {
      id: 'status-critical',
      label: 'Critical (Due Soon)',
      onClick: () => setStatusFilter('critical'),
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    {
      id: 'status-warning',
      label: 'Warning',
      onClick: () => setStatusFilter('warning'),
      icon: <Clock className="h-5 w-5" />,
    },
    {
      id: 'status-normal',
      label: 'Normal',
      onClick: () => setStatusFilter('normal'),
      icon: <CheckCircle className="h-5 w-5" />,
    },
  ];

  const getLoanActions = (loan: any) => [
    {
      id: 'view-details',
      label: 'View Details',
      icon: <Eye className="h-5 w-5" />,
      onClick: () => setLocation(`/loans/${loan.id}`),
    },
    {
      id: 'edit',
      label: 'Edit Details',
      icon: <Edit className="h-5 w-5" />,
      onClick: () => setLocation(`/loans/${loan.id}/edit`),
    },
    {
      id: 'make-payment',
      label: 'Make Payment',
      icon: <Banknote className="h-5 w-5" />,
      onClick: () => setLocation(`/loans/${loan.id}/payment/create`),
    },
    {
      id: 'view-history',
      label: 'View History',
      icon: <Clock className="h-5 w-5" />,
      onClick: () => setLocation(`/history?loanId=${loan.id}`),
    },
    {
      id: 'settle',
      label: 'Settle Loan',
      icon: <CheckCircle className="h-5 w-5" />,
      onClick: () => handleSettleLoan(loan.id, loan.amount),
      disabled: settleLoanMutation.isPending,
    },
    {
      id: 'delete',
      label: 'Delete Loan',
      icon: <Trash2 className="h-5 w-5" />,
      onClick: () => handleDeleteLoan(loan.id),
      variant: 'destructive' as const,
      disabled: deleteLoanMutation.isPending,
    },
  ];

  const MobileLoanCard = ({ loan }: { loan: any }) => {
    const urgency = getLoanUrgency(loan.dueDate);
    const loanAmount = Number(loan.amount) || 0;
    const totalRate = Number(loan.bankRate) || 0;
    const dailyInterest = (loanAmount * totalRate / 100) / 365;
    const isCancelled = loan.status === 'cancelled';

    return (
      <Card 
        className={`
          border-0 shadow-md bg-white dark:bg-gray-800
          active:scale-[0.98] active:shadow-sm transition-all duration-150
          cursor-pointer min-h-[160px]
          ${isCancelled ? 'border-l-4 border-l-gray-400 dark:border-l-gray-600' :
            urgency.status === 'critical' ? 'border-l-4 border-l-red-500' :
            urgency.status === 'warning' ? 'border-l-4 border-l-amber-500' :
            'border-l-4 border-l-emerald-500'}
        `}
        onClick={() => handleLoanCardClick(loan.id)}
        data-testid={`card-mobile-loan-${loan.id}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                <span className="text-white font-bold text-sm">
                  {loan.facility?.bank?.name?.substring(0, 3) || 'BNK'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate" data-testid={`text-mobile-loan-bank-${loan.id}`}>
                  {loan.facility?.bank?.name || 'Unknown Bank'}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate" data-testid={`text-mobile-loan-facility-${loan.id}`}>
                  {loan.facility?.name || 'No facility'}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 flex-shrink-0 active:bg-accent/50"
              onClick={(e) => openLoanActions(loan, e)}
              data-testid={`button-mobile-loan-actions-${loan.id}`}
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">Amount</span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100" data-testid={`text-mobile-loan-amount-${loan.id}`}>
                {formatCurrency(loanAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">Due Date</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {new Date(loan.dueDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">Daily Interest</span>
              <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                {dailyInterest.toLocaleString('en-SA', { 
                  minimumFractionDigits: 0, 
                  maximumFractionDigits: 0 
                })} SAR
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <Badge 
              variant={isCancelled ? 'secondary' : urgency.variant}
              className={`text-xs ${
                isCancelled ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' :
                urgency.status === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                urgency.status === 'warning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400' :
                'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
              }`}
              data-testid={`badge-mobile-loan-status-${loan.id}`}
            >
              {isCancelled ? 'Cancelled' : urgency.label}
            </Badge>
            <p className="text-xs text-gray-600 dark:text-gray-400" data-testid={`text-mobile-loan-reference-${loan.id}`}>
              Ref: {loan.referenceNumber}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const MobileSettledLoanCard = ({ loan }: { loan: any }) => {
    return (
      <Card 
        className="border-0 shadow-md bg-white dark:bg-gray-800 border-l-4 border-l-emerald-500 opacity-90 active:scale-[0.98] active:shadow-sm transition-all duration-150 cursor-pointer min-h-[140px]"
        onClick={() => handleLoanCardClick(loan.id)}
        data-testid={`card-mobile-settled-loan-${loan.id}`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                <CheckCircle className="text-white h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {loan.facility?.bank?.name || 'Unknown Bank'}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  Ref: {loan.referenceNumber}
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400 flex-shrink-0">
              Settled
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">Settled Amount</span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {loan.settledAmount ? formatCurrency(Number(loan.settledAmount)) : formatCurrency(Number(loan.amount))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">Settled Date</span>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {loan.settledDate ? new Date(loan.settledDate).toLocaleDateString() : 'Recently'}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-9 border-red-300 text-red-700 lg:hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:lg:hover:bg-red-950/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setLoanToUndo(loan.id);
                }}
                data-testid={`button-undo-settlement-${loan.id}`}
              >
                <Undo2 className="mr-2 h-4 w-4" />
                Undo Settlement
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <PageContainer className={isMobile ? "pb-20" : ""}>
      {isMobile ? (
        <>
          <MobileHeader 
            title="Loans"
            rightAction={
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsFilterSheetOpen(true)}
                className="h-10 w-10 active:bg-accent/50"
                data-testid="button-mobile-filters"
              >
                <Filter className="h-5 w-5" />
              </Button>
            }
          />

          <Section>
            <div className="relative">
              <Search className="absolute left-3 h-5 w-5 text-muted-foreground top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search loans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
                data-testid="input-mobile-loan-search"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
              {['all', 'critical', 'warning', 'normal'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as StatusFilter)}
                  className={`
                    flex-shrink-0 px-4 h-12 rounded-lg font-medium transition-all snap-start
                    active:scale-95
                    ${statusFilter === status 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 active:bg-accent/50'
                    }
                  `}
                  data-testid={`chip-status-${status}`}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "active" | "settled" | "cancelled")} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 h-12">
                <TabsTrigger value="active" className="h-10 text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  Active ({filteredAndSortedActiveLoans.length})
                </TabsTrigger>
                <TabsTrigger value="settled" className="h-10 text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  Settled ({filteredSettledLoans.length})
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="h-10 text-sm data-[state=active]:bg-gray-600 data-[state=active]:text-white">
                  Cancelled ({cancelledLoans?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="space-y-3 mt-4">
                {activeLoading ? (
                  <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
                    <CardContent className="flex items-center justify-center py-12">
                      <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mr-3" />
                      <span className="text-gray-600 dark:text-gray-400">Loading...</span>
                    </CardContent>
                  </Card>
                ) : filteredAndSortedActiveLoans.length === 0 ? (
                  <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
                    <CardContent className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {(activeLoans as any[])?.length === 0 ? "No active loans found" : "No loans match filters"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredAndSortedActiveLoans.slice(0, visibleActiveLoans).map((loan: any) => (
                      <MobileLoanCard key={loan.id} loan={loan} />
                    ))}
                    
                    {filteredAndSortedActiveLoans.length > visibleActiveLoans && (
                      <Button 
                        variant="outline" 
                        onClick={() => setVisibleActiveLoans(prev => prev + 8)}
                        className="w-full h-12 active:scale-95"
                        data-testid="button-mobile-load-more"
                      >
                        <ChevronDown className="mr-2 h-5 w-5" />
                        Load more ({filteredAndSortedActiveLoans.length - visibleActiveLoans} remaining)
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="settled" className="space-y-3 mt-4">
                {settledLoading ? (
                  <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
                    <CardContent className="flex items-center justify-center py-12">
                      <RefreshCw className="animate-spin h-8 w-8 text-emerald-600 mr-3" />
                      <span className="text-gray-600 dark:text-gray-400">Loading...</span>
                    </CardContent>
                  </Card>
                ) : filteredSettledLoans.length === 0 ? (
                  <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
                    <CardContent className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No settled loans found</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredSettledLoans.map((loan: any) => (
                      <MobileSettledLoanCard key={loan.id} loan={loan} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cancelled" className="space-y-3 mt-4">
                {cancelledLoading ? (
                  <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
                    <CardContent className="flex items-center justify-center py-12">
                      <RefreshCw className="animate-spin h-8 w-8 text-gray-600 mr-3" />
                      <span className="text-gray-600 dark:text-gray-400">Loading...</span>
                    </CardContent>
                  </Card>
                ) : filteredCancelledLoans.length === 0 ? (
                  <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
                    <CardContent className="text-center py-12">
                      <Trash2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No cancelled loans found</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredCancelledLoans.map((loan: any) => (
                      <Card 
                        key={loan.id}
                        className="border-0 shadow-md bg-white dark:bg-gray-800 border-l-4 border-l-gray-400 opacity-75"
                        onClick={() => setLocation(`/loans/${loan.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="w-10 h-10 bg-gray-400 rounded-lg flex items-center justify-center shrink-0">
                                <Trash2 className="text-white h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                  {loan.facility?.bank?.name || 'Unknown Bank'}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  Ref: {loan.referenceNumber}
                                </p>
                              </div>
                            </div>
                            <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 shrink-0 ml-2">
                              Cancelled
                            </Badge>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 mb-3">
                            <div className="text-center">
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Loan Amount</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 line-through">
                                {formatCurrency(Number(loan.amount) || 0)}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400 text-xs">Start Date</p>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {new Date(loan.startDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400 text-xs">Due Date</p>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {new Date(loan.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full h-11 active:scale-95"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLoanToPermanentlyDelete(loan.id);
                            }}
                            data-testid={`button-mobile-permanent-delete-${loan.id}`}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Permanently Delete
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Section>

          <FloatingActionButton 
            onClick={() => setLocation("/loans/create")}
            label="Create Loan"
            data-testid="fab-create-loan"
          />

          <ActionSheet
            open={isActionSheetOpen}
            onOpenChange={setIsActionSheetOpen}
            title={selectedLoanForAction ? `${selectedLoanForAction.facility?.bank?.name || 'Loan'}` : 'Loan Actions'}
            actions={selectedLoanForAction ? getLoanActions(selectedLoanForAction) : []}
          />

          <ActionSheet
            open={isFilterSheetOpen}
            onOpenChange={setIsFilterSheetOpen}
            title="Filter & Sort"
            actions={filterActions}
          />
        </>
      ) : (
        <>
          <PageHeader
            title="Loan Management"
            subtitle={`Total Active: ${formatCurrency(totalActiveAmount)}${criticalLoans > 0 ? ` • ${criticalLoans} urgent loans` : ''}`}
            icon={<FileText className="h-6 w-6" />}
            actions={
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportLoans} className="h-10">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button 
                  onClick={() => setLocation("/loans/create")}
                  className="h-10 bg-gradient-to-r from-blue-600 to-blue-700 lg:hover:from-blue-700 lg:hover:to-blue-800 text-white shadow-lg"
                  data-testid="button-add-loan"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Loan
                </Button>
              </div>
            }
          />

          <Section>

          <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "active" | "settled" | "cancelled")} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="active" className="h-10 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Active Loans ({filteredAndSortedActiveLoans.length})
              </TabsTrigger>
              <TabsTrigger value="settled" className="h-10 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                Settled Loans ({filteredSettledLoans.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="h-10 data-[state=active]:bg-gray-600 data-[state=active]:text-white">
                Cancelled Loans ({cancelledLoans?.length || 0})
              </TabsTrigger>
            </TabsList>

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
                        className="h-10 bg-gradient-to-r from-blue-600 to-blue-700 lg:hover:from-blue-700 lg:hover:to-blue-800 text-white"
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
                    const totalRate = Number(loan.bankRate) || 0;
                    const dailyInterest = (loanAmount * totalRate / 100) / 365;
                    const isCancelled = loan.status === 'cancelled';
                    
                    return (
                      <Card 
                        key={loan.id} 
                        className={`border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm lg:hover:shadow-xl transition-all duration-300 ${
                          isCancelled ? 'border-l-4 border-l-gray-400 dark:border-l-gray-600' :
                          urgency.status === 'critical' ? 'border-l-4 border-l-red-500' :
                          urgency.status === 'warning' ? 'border-l-4 border-l-amber-500' :
                          'border-l-4 border-l-emerald-500'
                        }`}
                        data-testid={`card-active-loan-${loan.id}`}
                      >
                        <CardContent className="p-4">
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
                                variant={isCancelled ? 'secondary' : urgency.variant} 
                                className={`text-xs ${
                                  isCancelled ? 'bg-gray-100 text-gray-800 lg:hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-400' :
                                  urgency.status === 'critical' ? 'bg-red-100 text-red-800 lg:hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400' :
                                  urgency.status === 'warning' ? 'bg-amber-100 text-amber-800 lg:hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-400' :
                                  'bg-emerald-100 text-emerald-800 lg:hover:bg-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400'
                                }`}
                                data-testid={`badge-loan-urgency-${loan.id}`}
                              >
                                {isCancelled ? 'Cancelled' : urgency.label}
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
                                  <DropdownMenuItem onClick={() => setLocation(`/loans/${loan.id}/payment/create`)}>
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

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Loan Amount</p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid={`text-loan-amount-${loan.id}`}>
                                {formatCurrency(Number(loan.amount) || 0)}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Interest: SIBOR {loan.siborRate}% + Margin {(loan as any).margin}% = {loan.bankRate}%
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
                                    ? 'bg-red-600 lg:hover:bg-red-700' 
                                    : 'bg-emerald-600 lg:hover:bg-emerald-700'
                                } text-white shadow-lg lg:hover:shadow-xl transition-all duration-300 h-10 flex-1 sm:flex-initial`}
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
                                className="h-10 flex-1 sm:flex-initial text-red-600 lg:hover:text-red-700 lg:hover:bg-red-50 dark:hover:bg-red-950"
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
                      className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-l-4 border-l-emerald-500 opacity-90 cursor-pointer lg:hover:shadow-xl transition-all duration-150"
                      onClick={() => handleLoanCardClick(loan.id)}
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
                            <Badge className="bg-emerald-100 text-emerald-800 lg:hover:bg-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400">
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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

                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-red-300 text-red-700 lg:hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:lg:hover:bg-red-950/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLoanToUndo(loan.id);
                            }}
                            data-testid={`button-undo-settlement-${loan.id}`}
                          >
                            <Undo2 className="mr-2 h-4 w-4" />
                            Undo Settlement
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {cancelledLoading ? (
                <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                  <CardContent className="flex items-center justify-center py-12">
                    <RefreshCw className="animate-spin h-8 w-8 text-gray-600 mr-3" />
                    <span className="text-gray-600 dark:text-gray-400">Loading cancelled loans...</span>
                  </CardContent>
                </Card>
              ) : filteredCancelledLoans.length === 0 ? (
                <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                  <CardContent className="text-center py-12">
                    <Trash2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No cancelled loans found</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredCancelledLoans.map((loan: any) => (
                    <Card 
                      key={loan.id} 
                      className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-l-4 border-l-gray-400 opacity-75 cursor-pointer lg:hover:shadow-xl transition-all duration-150"
                      onClick={() => handleLoanCardClick(loan.id)}
                      data-testid={`card-cancelled-loan-${loan.id}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center shadow-lg">
                              <Trash2 className="text-white h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100" data-testid={`text-cancelled-loan-bank-${loan.id}`}>
                                {loan.facility?.bank?.name || 'Unknown Bank'}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400" data-testid={`text-cancelled-loan-reference-${loan.id}`}>
                                Reference: {loan.referenceNumber}
                              </p>
                            </div>
                            <Badge className="bg-gray-100 text-gray-800 lg:hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-400">
                              Cancelled
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 line-through" data-testid={`text-cancelled-loan-amount-${loan.id}`}>
                              {formatCurrency(Number(loan.amount) || 0)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Cancelled Loan
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Start Date</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {new Date(loan.startDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Due Date</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {new Date(loan.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                            <p className="font-semibold text-gray-600 dark:text-gray-400">
                              Cancelled
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              This loan has been cancelled
                            </p>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLoanToPermanentlyDelete(loan.id);
                              }}
                              data-testid={`button-permanent-delete-${loan.id}`}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Permanently Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
          </Section>
        </>
      )}

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
              className="bg-red-600 lg:hover:bg-red-700 text-white"
            >
              Delete Loan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!loanToUndo} onOpenChange={(open) => !open && setLoanToUndo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Undo2 className="h-5 w-5 text-red-600" />
              Undo Settlement
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will revert the loan back to active status. Are you sure you want to undo the settlement?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLoanToUndo(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => loanToUndo && reverseSettlementMutation.mutate(loanToUndo)}
              className="bg-red-600 lg:hover:bg-red-700 text-white"
              disabled={reverseSettlementMutation.isPending}
            >
              {reverseSettlementMutation.isPending ? 'Undoing...' : 'Undo Settlement'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!loanToPermanentlyDelete} onOpenChange={(open) => !open && setLoanToPermanentlyDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Permanently Delete Loan
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this loan from the system. This action cannot be undone and all loan data will be lost forever. Are you absolutely sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLoanToPermanentlyDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => loanToPermanentlyDelete && permanentDeleteMutation.mutate(loanToPermanentlyDelete)}
              className="bg-red-600 lg:hover:bg-red-700 text-white"
              disabled={permanentDeleteMutation.isPending}
              data-testid="button-confirm-permanent-delete"
            >
              {permanentDeleteMutation.isPending ? 'Deleting...' : 'Permanently Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
