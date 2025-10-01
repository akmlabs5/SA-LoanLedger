import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertFacilitySchema, Bank, paymentRequestSchema, settlementRequestSchema, revolveRequestSchema, type PaymentRequest, type SettlementRequest, type RevolveRequest } from "@shared/schema";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RevolvingPeriodTracker } from "@/components/RevolvingPeriodTracker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building, 
  ArrowLeft, 
  LogIn, 
  Shield, 
  TrendingUp, 
  Calendar,
  CreditCard,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  FileText,
  Settings,
  Phone,
  Mail,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Star,
  User,
  Gem,
  MoreVertical,
  Receipt,
  RotateCcw,
  CheckSquare,
  History
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { PortfolioSummary } from "@shared/types";
import BankContactsSection from "@/components/BankContactsSection";
import DocumentUpload from "@/components/DocumentUpload";
import DocumentList from "@/components/DocumentList";
import { formatFacilityType } from "@/lib/formatters";

export default function BankDetail() {
  const { id: bankId } = useParams();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Dialog states for loan actions
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);
  const [revolveDialogOpen, setRevolveDialogOpen] = useState(false);
  const [ledgerDialogOpen, setLedgerDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const { data: bank, isLoading: bankLoading, error: bankError } = useQuery<Bank>({
    queryKey: ["/api/banks", bankId],
    enabled: isAuthenticated && !!bankId,
  });


  const { data: facilities, isLoading: facilitiesLoading } = useQuery({
    queryKey: ["/api/facilities"],
    enabled: isAuthenticated,
  });

  const { data: portfolioSummary, isLoading: portfolioLoading } = useQuery({
    queryKey: ["/api/dashboard/portfolio"],
    enabled: isAuthenticated,
  });

  const { data: loans, isLoading: loansLoading } = useQuery({
    queryKey: ["/api/loans"],
    enabled: isAuthenticated,
  });

  const { data: bankContacts, isLoading: contactsLoading } = useQuery({
    queryKey: [`/api/banks/${bankId}/contacts`],
    enabled: isAuthenticated && !!bankId,
  });

  // Fetch collateral and assignments for this bank
  const { data: collateral } = useQuery({
    queryKey: ["/api/collateral"],
    enabled: isAuthenticated,
  });

  const { data: collateralAssignments } = useQuery({
    queryKey: ["/api/collateral-assignments"],
    enabled: isAuthenticated,
  });

  // Fetch credit lines for proper loan-to-bank mapping
  const { data: creditLines } = useQuery({
    queryKey: ["/api/credit-lines"],
    enabled: isAuthenticated,
  });

  // Bank is now fetched directly from the API
  const bankFacilities = (facilities as any[])?.filter((f: any) => f.bankId === bankId) || [];
  const bankExposure = (portfolioSummary as PortfolioSummary)?.bankExposures?.find(exp => exp.bankId === bankId);
  
  // Get loans that belong to this bank via their facility
  const bankFacilityIds = bankFacilities.map(f => f.id);
  const bankLoans = (loans as any[])?.filter((l: any) => 
    // Include all loans that belong to this bank's facilities
    l.facilityId && bankFacilityIds.includes(l.facilityId)
  ) || [];
  
  // Calculate fallback metrics when portfolio summary doesn't have bank data
  const fallbackCreditLimit = bankFacilities.reduce((sum, f) => sum + Number(f.creditLimit || 0), 0);
  const fallbackOutstanding = bankLoans
    .filter(loan => loan.status === 'active')
    .reduce((sum, loan) => sum + Number(loan.amount || 0), 0);
  const fallbackUtilization = fallbackCreditLimit > 0 ? (fallbackOutstanding / fallbackCreditLimit) * 100 : 0;
  const fallbackActiveLoans = bankLoans.filter(loan => loan.status === 'active').length;
  
  // Use portfolio summary data if available, otherwise use fallback calculations
  const displayMetrics = {
    creditLimit: bankExposure?.creditLimit || fallbackCreditLimit,
    outstanding: bankExposure?.outstanding || fallbackOutstanding,
    utilization: bankExposure?.utilization || fallbackUtilization,
    activeLoansCount: fallbackActiveLoans,
  };
  
  // Filter collateral assignments for this bank's facilities
  const bankCollateralAssignments = (collateralAssignments as any[])?.filter((assignment: any) => {
    const facility = bankFacilities.find(f => f.id === assignment.facilityId);
    return !!facility;
  }) || [];
  
  // Get collateral details for assignments
  const bankCollateral = bankCollateralAssignments.map((assignment: any) => {
    const asset = (collateral as any[])?.find((c: any) => c.id === assignment.collateralId);
    const facility = bankFacilities.find(f => f.id === assignment.facilityId);
    return asset ? { ...asset, assignment, facility } : null;
  }).filter(Boolean);

  
  const deleteFacilityMutation = useMutation({
    mutationFn: async (facilityId: string) => {
      return apiRequest('DELETE', `/api/facilities/${facilityId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facilities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      toast({ title: "Facility deleted successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to delete facility", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleDeleteFacility = (facilityId: string) => {
    if (window.confirm("Are you sure you want to delete this facility? This action cannot be undone.")) {
      deleteFacilityMutation.mutate(facilityId);
    }
  };

  // Loan action mutations
  const makePaymentMutation = useMutation({
    mutationFn: async ({ loanId, data }: { loanId: string; data: PaymentRequest }) => {
      return apiRequest('POST', `/api/loans/${loanId}/repayments`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      toast({ title: "Payment processed successfully" });
      setPaymentDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to process payment", description: error.message, variant: "destructive" });
    },
  });

  const settleLoanMutation = useMutation({
    mutationFn: async ({ loanId, data }: { loanId: string; data: SettlementRequest }) => {
      return apiRequest('POST', `/api/loans/${loanId}/settle`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      toast({ title: "Loan settled successfully" });
      setSettleDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to settle loan", description: error.message, variant: "destructive" });
    },
  });

  const revolveLoanMutation = useMutation({
    mutationFn: async ({ loanId, data }: { loanId: string; data: RevolveRequest }) => {
      return apiRequest('POST', `/api/loans/${loanId}/revolve`, data);
    },
    onSuccess: (newLoan: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/facilities"] });
      if (newLoan?.facilityId) {
        queryClient.invalidateQueries({ queryKey: ["/api/facilities", newLoan.facilityId, "revolving-usage"] });
      }
      toast({ title: "Loan revolved successfully" });
      setRevolveDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to revolve loan", description: error.message, variant: "destructive" });
    },
  });

  const deleteLoanMutation = useMutation({
    mutationFn: async (loanId: string) => {
      return apiRequest('DELETE', `/api/loans/${loanId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      toast({ title: "Loan cancelled successfully" });
      setCancelDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to cancel loan", description: error.message, variant: "destructive" });
    },
  });

  // Fetch loan ledger when dialog opens
  const { data: loanLedger } = useQuery({
    queryKey: ["/api/loans", selectedLoan?.id, "ledger"],
    enabled: isAuthenticated && ledgerDialogOpen && !!selectedLoan?.id,
  });

  // Show loading state while data is being fetched
  if (bankLoading || facilitiesLoading || portfolioLoading || loansLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loading Bank Details</h2>
          <p className="text-gray-600 dark:text-gray-400">Please wait while we fetch your bank information...</p>
        </div>
      </div>
    );
  }

  // Only show "not found" after data has loaded
  if (!bankLoading && !bank) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Bank Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The requested bank could not be found.</p>
          <Link href="/banks">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Banks
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return (amount / 1000000).toFixed(3).replace(/\.?0+$/, '') + "M SAR";
  };

  const getConnectionStatus = () => {
    // This would be connected to real bank integration status
    return Math.random() > 0.5 ? 'connected' : 'disconnected';
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/banks">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Banks
              </Button>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">
                  {bank!.code.substring(0, 3)}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{bank!.name}</h1>
                <p className="text-gray-600 dark:text-gray-300">Code: {bank!.code}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={connectionStatus === 'connected' 
              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400"
              : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-400"
            }>
              {connectionStatus === 'connected' ? (
                <>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Connected
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Not Connected
                </>
              )}
            </Badge>
            {connectionStatus !== 'connected' && (
              <Button className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white">
                <LogIn className="mr-2 h-4 w-4" />
                Connect Bank
              </Button>
            )}
          </div>
        </div>

        {/* Bank Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Exposure</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(displayMetrics.outstanding)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="text-white text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Credit Limit</p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    {formatCurrency(displayMetrics.creditLimit)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
                  <CreditCard className="text-white text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Utilization</p>
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                    {`${displayMetrics.utilization.toFixed(1)}%`}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center">
                  <BarChart3 className="text-white text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Loans</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {displayMetrics.activeLoansCount}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center">
                  <FileText className="text-white text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bank Facilities */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <span>Credit Facilities</span>
                  </div>
                  <Button 
                    size="sm" 
                    data-testid="button-add-facility"
                    onClick={() => setLocation(`/banks/${bankId}/facility/create`)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Facility
                  </Button>
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your active facilities with this bank</p>
              </CardHeader>
              <CardContent>
                {bankFacilities.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No facilities found with this bank</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bankFacilities.map((facility: any) => (
                      <div key={facility.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                              {formatFacilityType(facility.facilityType)} Facility
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Active since {new Date(facility.startDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={facility.isActive 
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                          }>
                            {facility.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Credit Limit</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {formatCurrency(parseFloat(facility.creditLimit))}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Cost of Funding</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              SIBOR + {facility.costOfFunding}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Start Date</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {new Date(facility.startDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Expiry Date</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {new Date(facility.expiryDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        {facility.terms && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Terms & Conditions</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                              {facility.terms}
                            </p>
                          </div>
                        )}
                        
                        {facility.enableRevolvingTracking && (
                          <div className="mt-4">
                            <RevolvingPeriodTracker 
                              facilityId={facility.id} 
                              maxRevolvingPeriod={facility.maxRevolvingPeriod}
                              initialDrawdownDate={facility.initialDrawdownDate}
                            />
                          </div>
                        )}
                        
                        <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setLocation(`/banks/${bankId}/facility/${facility.id}/edit`)}
                            className="min-h-[44px] w-24 touch-manipulation"
                            data-testid={`button-edit-facility-${facility.id}`}
                          >
                            <Edit className="mr-1 h-4 w-4" />
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteFacility(facility.id)}
                            disabled={deleteFacilityMutation.isPending}
                            className="min-h-[44px] w-24 touch-manipulation"
                            data-testid={`button-delete-facility-${facility.id}`}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Loans */}
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <span>Active Loans</span>
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Current loan drawdowns from this bank</p>
                  </div>
                  <Link href={`/loans/create?bankId=${bankId}`}>
                    <Button 
                      size="sm"
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                      data-testid="button-add-loan-header"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Loan
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {bankLoans.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No active loans with this bank</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Click "Add Loan" above to create your first loan from this bank's facilities.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bankLoans.slice(0, 5).map((loan: any) => {
                      const daysUntilDue = Math.ceil((new Date(loan.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                      const urgency = daysUntilDue <= 7 ? 'critical' : daysUntilDue <= 15 ? 'warning' : 'normal';
                      
                      return (
                        <div key={loan.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/50 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900 dark:text-gray-100">
                                {loan.referenceNumber}
                              </h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Due: {new Date(loan.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <p className="font-bold text-gray-900 dark:text-gray-100">
                                  {formatCurrency(parseFloat(loan.amount))}
                                </p>
                                <Badge className={
                                  urgency === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                                  urgency === 'warning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400' :
                                  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
                                }>
                                  {daysUntilDue > 0 ? `${daysUntilDue} days` : 'Overdue'}
                                </Badge>
                              </div>
                              
                              {/* Loan Actions Dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    data-testid={`button-loan-actions-${loan.id}`}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => setLocation(`/loans/${loan.id}/edit`)} data-testid={`button-edit-loan-${loan.id}`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setSelectedLoan(loan); setPaymentDialogOpen(true); }} data-testid={`button-repay-loan-${loan.id}`}>
                                    <Receipt className="mr-2 h-4 w-4" />
                                    Make Payment
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => { setSelectedLoan(loan); setSettleDialogOpen(true); }} data-testid={`button-settle-loan-${loan.id}`}>
                                    <CheckSquare className="mr-2 h-4 w-4" />
                                    Settle Loan
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setSelectedLoan(loan); setRevolveDialogOpen(true); }} data-testid={`button-revolve-loan-${loan.id}`}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Revolve Loan
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => { setSelectedLoan(loan); setLedgerDialogOpen(true); }} data-testid={`button-ledger-loan-${loan.id}`}>
                                    <History className="mr-2 h-4 w-4" />
                                    View Ledger
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => { setSelectedLoan(loan); setCancelDialogOpen(true); }} 
                                    className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                                    data-testid={`button-cancel-loan-${loan.id}`}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Cancel Loan
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Interest: SIBOR + {loan.bankRate}% | Status: {loan.status}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Collateral Assignments */}
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Gem className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <span>Assigned Collateral</span>
                  </div>
                  <Button 
                    onClick={() => setLocation("/collateral/new")}
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                    data-testid="button-add-collateral"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Collateral
                  </Button>
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Assets securing facilities with this bank
                </p>
              </CardHeader>
              <CardContent>
                {bankCollateral.length === 0 ? (
                  <div className="text-center py-12">
                    <Gem className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No collateral assigned to this bank's facilities</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Click "Add Collateral" above to assign collateral to this bank's facilities.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bankCollateral.map((asset: any) => (
                      <div key={asset.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                              {asset.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                              {asset.type.replace('_', ' ')} • Valued {new Date(asset.valuationDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-gray-100">
                              {formatCurrency(parseFloat(asset.currentValue))}
                            </p>
                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                              Assigned
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Assigned to Facility</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                              {formatFacilityType(asset.facility?.facilityType || '')} Facility
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Facility Credit Limit</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {asset.facility ? formatCurrency(parseFloat(asset.facility.creditLimit)) : 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        {asset.assignment?.creditLineId && (
                          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Specific Credit Line Assignment</p>
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              Credit Line ID: {asset.assignment.creditLineId}
                            </p>
                          </div>
                        )}
                        
                        {asset.description && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Description</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                              {asset.description}
                            </p>
                          </div>
                        )}
                        
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              Valuation Source: {asset.valuationSource || 'Not specified'}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              Last Updated: {new Date(asset.valuationDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bank Documents */}
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span>Bank Documents</span>
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Banking agreements, licenses, and related documents
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Document Upload */}
                <DocumentUpload 
                  entityType="bank"
                  entityId={bankId!}
                  onUploadComplete={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/documents", "bank", bankId] });
                  }}
                  maxFiles={20}
                />
                
                {/* Document List */}
                <DocumentList 
                  entityType="bank"
                  entityId={bankId!}
                  showUpload={false}
                />
              </CardContent>
            </Card>
          </div>

          {/* Bank Information & Actions */}
          <div className="space-y-6">
            {/* Bank Contacts */}
            <BankContactsSection 
              bankId={bankId!} 
              bankName={bank!.name} 
              isAuthenticated={isAuthenticated} 
            />
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                  <Building className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bank Code</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{bank!.code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Full Name</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{bank!.name}</p>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">+966 11 123 4567</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">corporate@{bank!.code.toLowerCase()}.com.sa</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Riyadh, Saudi Arabia</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  onClick={() => setLocation("/loans")}
                  data-testid="button-view-all-loans"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View All Loans
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setLocation("/history")}
                  data-testid="button-transaction-history"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Transaction History
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setLocation("/dashboard")}
                  data-testid="button-performance-analytics"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Performance Analytics
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => toast({ title: "Feature Coming Soon", description: "Bank connection management will be available soon." })}
                  data-testid="button-manage-connection"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Connection
                </Button>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Relationship Duration</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">2.5 years</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Average Rate</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">SIBOR + 2.75%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Payment Record</span>
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                    Excellent
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Last Activity</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">2 days ago</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Make Payment Dialog */}
      <PaymentDialog 
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        loan={selectedLoan}
        onSubmit={(data: PaymentRequest) => makePaymentMutation.mutate({ loanId: selectedLoan.id, data })}
        isPending={makePaymentMutation.isPending}
      />

      {/* Settle Loan Dialog */}
      <SettleDialog 
        open={settleDialogOpen}
        onOpenChange={setSettleDialogOpen}
        loan={selectedLoan}
        onSubmit={(data: SettlementRequest) => settleLoanMutation.mutate({ loanId: selectedLoan.id, data })}
        isPending={settleLoanMutation.isPending}
      />

      {/* Revolve Loan Dialog */}
      <RevolveDialog 
        open={revolveDialogOpen}
        onOpenChange={setRevolveDialogOpen}
        loan={selectedLoan}
        onSubmit={(data: RevolveRequest) => revolveLoanMutation.mutate({ loanId: selectedLoan.id, data })}
        isPending={revolveLoanMutation.isPending}
      />

      {/* View Ledger Dialog */}
      <LedgerDialog 
        open={ledgerDialogOpen}
        onOpenChange={setLedgerDialogOpen}
        loan={selectedLoan}
        ledger={loanLedger}
      />

      {/* Cancel Loan Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent data-testid="dialog-cancel-loan">
          <DialogHeader>
            <DialogTitle>Cancel Loan</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel loan {selectedLoan?.referenceNumber}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} data-testid="button-cancel-dialog-close">
              No, Keep Loan
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteLoanMutation.mutate(selectedLoan?.id)}
              disabled={deleteLoanMutation.isPending}
              data-testid="button-confirm-cancel-loan"
            >
              {deleteLoanMutation.isPending ? "Cancelling..." : "Yes, Cancel Loan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// Payment Dialog Component
function PaymentDialog({ open, onOpenChange, loan, onSubmit, isPending }: any) {
  const form = useForm({
    resolver: zodResolver(paymentRequestSchema),
    defaultValues: {
      amount: "",
      date: new Date().toISOString().split('T')[0],
      reference: "",
      memo: "",
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-make-payment">
        <DialogHeader>
          <DialogTitle>Make Payment</DialogTitle>
          <DialogDescription>
            Process a payment for loan {loan?.referenceNumber}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount (SAR)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="0.00" data-testid="input-payment-amount" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" data-testid="input-payment-date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Payment reference" data-testid="input-payment-reference" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="memo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Memo (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Additional notes" data-testid="input-payment-memo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-payment-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-payment-submit">
                {isPending ? "Processing..." : "Process Payment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Settle Loan Dialog Component
function SettleDialog({ open, onOpenChange, loan, onSubmit, isPending }: any) {
  const form = useForm({
    resolver: zodResolver(settlementRequestSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      amount: "",
      memo: "",
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-settle-loan">
        <DialogHeader>
          <DialogTitle>Settle Loan</DialogTitle>
          <DialogDescription>
            Settle loan {loan?.referenceNumber}. Leave amount empty to settle full outstanding balance.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Settlement Date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" data-testid="input-settlement-date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Settlement Amount (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Leave empty for full settlement" data-testid="input-settlement-amount" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="memo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Memo (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Settlement notes" data-testid="input-settlement-memo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-settlement-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-settlement-submit">
                {isPending ? "Settling..." : "Settle Loan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Revolve Loan Dialog Component
function RevolveDialog({ open, onOpenChange, loan, onSubmit, isPending }: any) {
  const [useCustomSibor, setUseCustomSibor] = useState(false);
  const [customSiborRate, setCustomSiborRate] = useState("");
  
  const { data: siborRate } = useQuery({
    queryKey: ["/api/sibor-rate"],
  });

  const form = useForm({
    resolver: zodResolver(revolveRequestSchema),
    defaultValues: {
      newTerm: 90,
      siborTermMonths: 3,
      margin: loan?.margin || "0",
      dueDate: "",
      memo: "",
    },
  });

  const newTerm = form.watch("newTerm");
  const inheritedMargin = loan?.margin || "0";
  
  // Calculate due date based on newTerm with Saudi weekend adjustment
  const calculateDueDate = (days: number) => {
    const start = new Date();
    const due = new Date(start);
    due.setDate(due.getDate() + days);
    
    // Adjust for Saudi weekend (Friday/Saturday)
    const dayOfWeek = due.getDay();
    if (dayOfWeek === 5) { // Friday
      due.setDate(due.getDate() + 2); // Move to Sunday
    } else if (dayOfWeek === 6) { // Saturday
      due.setDate(due.getDate() + 1); // Move to Sunday
    }
    
    return due.toISOString().split('T')[0];
  };

  // Update due date when term changes
  const handleTermChange = (value: string) => {
    const days = parseInt(value);
    if (!isNaN(days) && days > 0) {
      form.setValue("dueDate", calculateDueDate(days));
    }
  };
  
  // Calculate effective SIBOR rate
  const effectiveSiborRate = useCustomSibor 
    ? parseFloat(customSiborRate || "0")
    : (siborRate as any)?.rate || 0;
  
  const totalRate = effectiveSiborRate + parseFloat(inheritedMargin);
  
  // Calculate accrued interest from last accrual date to today
  const calculateAccruedInterest = () => {
    if (!loan) return 0;
    
    const principal = parseFloat(loan.amount || "0");
    const annualRate = parseFloat(loan.bankRate || "0") / 100;
    const lastAccrual = loan.lastAccrualDate ? new Date(loan.lastAccrualDate) : new Date(loan.startDate);
    const today = new Date();
    
    // Calculate days between last accrual and today
    const daysDiff = Math.floor((today.getTime() - lastAccrual.getTime()) / (1000 * 60 * 60 * 24));
    
    // Use loan's interest basis (actual_360 or actual_365)
    const dayBasis = loan.interestBasis === 'actual_365' ? 365 : 360;
    
    // Calculate accrued interest
    const accruedInterest = (principal * annualRate * daysDiff) / dayBasis;
    
    return accruedInterest;
  };
  
  const accruedInterest = calculateAccruedInterest();
  const hasOutstandingInterest = accruedInterest > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="dialog-revolve-loan">
        <DialogHeader>
          <DialogTitle>Revolve Loan</DialogTitle>
          <DialogDescription>
            Create a new loan cycle for {loan?.referenceNumber} with updated terms
          </DialogDescription>
        </DialogHeader>
        
        {/* Accrued Interest Warning */}
        {hasOutstandingInterest && (
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-orange-900 dark:text-orange-100">Outstanding Accrued Interest</h4>
                <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                  Accrued interest of <span className="font-semibold">SAR {accruedInterest.toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> must be settled before revolving.
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-2">
                  Please make a payment to settle the interest accrued from {loan?.lastAccrualDate ? new Date(loan.lastAccrualDate).toLocaleDateString() : new Date(loan?.startDate).toLocaleDateString()} to today before creating a new loan cycle.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newTerm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Term (Days)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      onChange={(e) => {
                        field.onChange(parseInt(e.target.value));
                        handleTermChange(e.target.value);
                      }}
                      data-testid="input-revolve-term" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Custom SIBOR Toggle */}
            <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Checkbox 
                id="custom-sibor" 
                checked={useCustomSibor}
                onCheckedChange={(checked) => setUseCustomSibor(checked as boolean)}
                data-testid="checkbox-custom-sibor"
              />
              <label 
                htmlFor="custom-sibor" 
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Use Custom SIBOR Rate
              </label>
            </div>

            {/* Conditional SIBOR Input */}
            {useCustomSibor ? (
              <FormItem>
                <FormLabel>Custom SIBOR Rate (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={customSiborRate}
                    onChange={(e) => setCustomSiborRate(e.target.value)}
                    placeholder="5.75" 
                    data-testid="input-custom-sibor" 
                  />
                </FormControl>
                <p className="text-xs text-gray-500">Enter custom SIBOR rate if new term doesn't align with standard terms</p>
              </FormItem>
            ) : (
              <FormField
                control={form.control}
                name="siborTermMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SIBOR Term</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger data-testid="select-sibor-term">
                          <SelectValue placeholder="Select SIBOR term" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 Month</SelectItem>
                        <SelectItem value="3">3 Months</SelectItem>
                        <SelectItem value="6">6 Months</SelectItem>
                        <SelectItem value="12">12 Months</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Read-only Margin (inherited from facility) */}
            <FormItem>
              <FormLabel>Margin (%) - From Facility</FormLabel>
              <FormControl>
                <Input 
                  value={inheritedMargin} 
                  readOnly 
                  disabled
                  className="bg-gray-100 dark:bg-gray-800" 
                  data-testid="input-revolve-margin" 
                />
              </FormControl>
              <p className="text-xs text-gray-500">Margin is inherited from the facility and remains constant</p>
            </FormItem>

            {/* Rate Display */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {useCustomSibor ? 'Custom' : 'Current'} SIBOR Rate: <span className="font-semibold">{effectiveSiborRate.toFixed(2)}%</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Margin: <span className="font-semibold">{parseFloat(inheritedMargin).toFixed(2)}%</span>
              </p>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                Total Rate: {totalRate.toFixed(2)}%
              </p>
            </div>
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" data-testid="input-revolve-duedate" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="memo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Memo (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Revolve notes" data-testid="input-revolve-memo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-revolve-cancel">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isPending || hasOutstandingInterest} 
                data-testid="button-revolve-submit"
                title={hasOutstandingInterest ? "Please settle accrued interest before revolving" : ""}
              >
                {isPending ? "Revolving..." : hasOutstandingInterest ? "Settle Interest First" : "Revolve Loan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Ledger Dialog Component
function LedgerDialog({ open, onOpenChange, loan, ledger }: any) {
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR' }).format(Number(amount));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" data-testid="dialog-view-ledger">
        <DialogHeader>
          <DialogTitle>Loan Ledger</DialogTitle>
          <DialogDescription>
            Transaction history for {loan?.referenceNumber}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {!ledger || ledger.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ledger.map((transaction: any, index: number) => (
                <div 
                  key={transaction.id || index} 
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  data-testid={`ledger-transaction-${index}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge>{transaction.type}</Badge>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(transaction.date).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="font-semibold">{formatCurrency(transaction.amount)}</span>
                  </div>
                  {transaction.memo && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{transaction.memo}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}