import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Building2, FileText, Clock, CheckCircle, AlertTriangle, TrendingUp, Edit, Trash2, Bell, DollarSign } from "lucide-react";
import { LoanWithDetails } from "@shared/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import DocumentUpload from "@/components/DocumentUpload";
import DocumentList from "@/components/DocumentList";
import ReminderModal from "@/components/ReminderModal";
import { RevolvingPeriodTracker } from "@/components/RevolvingPeriodTracker";
import { WhatIfAnalysis } from "@/components/WhatIfAnalysis";
import { ModernDatePicker } from "@/components/ui/date-picker";

export default function LoanDetailPage() {
  const { id: loanId } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("transactions");
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [settleConfirmOpen, setSettleConfirmOpen] = useState(false);
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);
  const [settlementAmount, setSettlementAmount] = useState("");
  const [isManualAmount, setIsManualAmount] = useState(false);

  // Fetch loan details (always needed for overview)
  const { data: loan, isLoading: loanLoading, isError: loanError } = useQuery<LoanWithDetails>({
    queryKey: ["/api/loans", loanId],
    enabled: !!loanId && isAuthenticated,
  });

  // Fetch loan balance (prefetch and cache for better performance)
  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ["/api/loans", loanId, "balance"],
    enabled: !!loanId && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch loan transaction history (prefetch and cache for better performance)
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/loans", loanId, "ledger"],
    enabled: !!loanId && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch documents for the Documents tab
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/attachments", "loan", loanId],
    queryFn: async () => {
      const response = await fetch(`/api/attachments?ownerType=loan&ownerId=${loanId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      return response.json();
    },
    enabled: !!loanId && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch facility info for revolving period tracking
  const { data: facility } = useQuery({
    queryKey: ["/api/facilities", loan?.facilityId],
    enabled: !!loan?.facilityId && isAuthenticated,
  });

  // Calculate accrued interest to settlement date
  const calculateAccruedInterest = (principal: number, rate: number, startDate: string, endDate: string, basis: string = 'actual_365') => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const basisDays = basis === 'actual_360' ? 360 : 365;
    return (principal * rate / 100) * (daysDiff / basisDays);
  };

  // Auto-calculate settlement amount when date changes
  useEffect(() => {
    if (loan && settlementDate && !isManualAmount) {
      const principal = parseFloat(loan.amount);
      const rate = parseFloat(loan.bankRate);
      const accruedInterest = calculateAccruedInterest(principal, rate, loan.startDate, settlementDate, loan.interestBasis || 'actual_365');
      const totalAmount = principal + accruedInterest;
      setSettlementAmount(totalAmount.toFixed(2));
    }
  }, [loan, settlementDate, isManualAmount]);

  // Settlement mutation
  const settleLoanMutation = useMutation({
    mutationFn: async ({ loanId, settledAmount, settledDate }: { loanId: string; settledAmount: number; settledDate: string }) => {
      await apiRequest("POST", `/api/loans/${loanId}/settle`, { date: settledDate, amount: settledAmount.toString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loans", "settled"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loans", loanId] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      toast({
        title: "Success",
        description: "Loan settled successfully",
      });
      setLocation("/loans");
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({
        title: "Settlement Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSettleLoan = () => {
    // Reset to defaults when opening
    setSettlementDate(new Date().toISOString().split('T')[0]);
    setIsManualAmount(false);
    setSettleConfirmOpen(true);
  };

  const confirmSettle = () => {
    if (loan && settlementAmount) {
      settleLoanMutation.mutate({ 
        loanId: loan.id, 
        settledAmount: parseFloat(settlementAmount),
        settledDate: settlementDate 
      });
      setSettleConfirmOpen(false);
    }
  };

  const deleteLoanMutation = useMutation({
    mutationFn: async (loanId: string) => {
      await apiRequest("DELETE", `/api/loans/${loanId}`, { reason: "Cancelled by user" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/facilities"] });
      toast({
        title: "Success",
        description: "Loan cancelled successfully",
      });
      setLocation("/loans");
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({
        title: "Cancellation Failed",
        description: error instanceof Error ? error.message : "Failed to cancel loan",
        variant: "destructive",
      });
    },
  });

  const handleDeleteLoan = () => {
    if (window.confirm("Are you sure you want to cancel this loan? This action cannot be undone.")) {
      deleteLoanMutation.mutate(loan.id);
    }
  };

  const formatCurrency = (amount: number) => {
    return (amount / 1000000).toFixed(3).replace(/\.?0+$/, '') + "M SAR";
  };

  const getLoanUrgency = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: 'overdue', label: 'Overdue', color: 'bg-red-500', days: Math.abs(diffDays) };
    } else if (diffDays <= 7) {
      return { status: 'critical', label: 'Due Soon', color: 'bg-red-500', days: diffDays };
    } else if (diffDays <= 30) {
      return { status: 'warning', label: 'Due This Month', color: 'bg-amber-500', days: diffDays };
    } else {
      return { status: 'normal', label: 'On Track', color: 'bg-emerald-500', days: diffDays };
    }
  };

  // Loading state
  if (loanLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loading Loan Details</h2>
          <p className="text-gray-600 dark:text-gray-400">Please wait...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (loanError || !loan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loan Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The loan you're looking for doesn't exist or you don't have access to it.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => setLocation("/loans")} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Loans
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const urgency = getLoanUrgency(loan.dueDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900">
      {/* Navigation Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation("/loans")}
                data-testid="button-back-loans"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Loans
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Loan Details</h1>
                <p className="text-sm text-muted-foreground">Reference: {loan.referenceNumber}</p>
              </div>
            </div>
            
            <div className="ml-auto flex items-center space-x-3">
              <Badge className={`${urgency.color} text-white`}>
                {urgency.label}
              </Badge>
              {loan.status === 'active' && (
                <div className="flex space-x-2">
                  <WhatIfAnalysis 
                    loanId={loan.id}
                    loanAmount={parseFloat(loan.amount)}
                    currentRate={parseFloat(loan.interestRate)}
                    durationDays={Math.ceil((new Date(loan.dueDate).getTime() - new Date(loan.drawdownDate).getTime()) / (1000 * 60 * 60 * 24))}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocation(`/loans/${loan.id}/edit`)}
                    data-testid="button-edit-loan"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    onClick={handleSettleLoan}
                    disabled={settleLoanMutation.isPending}
                    className="bg-emerald-600 lg:hover:bg-emerald-700 text-white"
                    size="sm"
                    data-testid="button-settle-loan"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {settleLoanMutation.isPending ? 'Settling...' : 'Settle Loan'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Loan Overview */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span>Loan Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Bank</label>
                    <p className="text-lg font-semibold">{loan.facility?.bank?.name || 'Unknown Bank'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Amount</label>
                    <p className="text-lg font-semibold">{formatCurrency(parseFloat(loan.amount))}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                    <p className="text-base">{new Date(loan.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                    <p className="text-base">{new Date(loan.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Loan Rate</label>
                    <p className="text-base">{loan.siborRate}% + {loan.margin}% = {parseFloat(loan.siborRate) + parseFloat(loan.margin)}%</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <Badge className={`mt-2 px-3 py-1 ${loan.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {loan.status}
                    </Badge>
                  </div>
                  {(loan as any).accruedInterest !== undefined && loan.status === 'active' && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Accrued Interest (to date)</label>
                      <p className="text-lg font-semibold text-amber-600 dark:text-amber-400" data-testid="text-accrued-interest">
                        {parseFloat((loan as any).accruedInterest).toLocaleString('en-SA', {
                          style: 'currency',
                          currency: 'SAR',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </p>
                    </div>
                  )}
                  {(loan as any).projectedTotalInterest !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Projected Total Interest (full tenor)</label>
                      <p className="text-lg font-semibold text-blue-600 dark:text-blue-400" data-testid="text-projected-interest">
                        {parseFloat((loan as any).projectedTotalInterest).toLocaleString('en-SA', {
                          style: 'currency',
                          currency: 'SAR',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </p>
                    </div>
                  )}
                </div>
                
                {loan.notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Notes</label>
                    <p className="text-base mt-1 p-3 bg-muted rounded-lg">{loan.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detailed Information Tabs */}
            <Card className="shadow-lg">
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger 
                      value="transactions"
                      onMouseEnter={() => {
                        // Prefetch transaction data on hover
                        queryClient.prefetchQuery({
                          queryKey: ["/api/loans", loanId, "ledger"],
                        });
                      }}
                    >
                      Transaction History
                    </TabsTrigger>
                    <TabsTrigger 
                      value="documents"
                      onMouseEnter={() => {
                        // Prefetch documents data on hover
                        queryClient.prefetchQuery({
                          queryKey: ["/api/documents", "loan", loanId],
                        });
                      }}
                    >
                      Documents
                    </TabsTrigger>
                    <TabsTrigger 
                      value="analysis"
                      onMouseEnter={() => {
                        // Prefetch balance data on hover
                        queryClient.prefetchQuery({
                          queryKey: ["/api/loans", loanId, "balance"],
                        });
                      }}
                    >
                      Analysis
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="transactions" className="p-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Transaction History</h3>
                      {transactionsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                          <p className="text-gray-600">Loading transactions...</p>
                        </div>
                      ) : transactions && transactions.length > 0 ? (
                        <div className="space-y-3">
                          {transactions.map((transaction: any) => (
                            <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className={`w-2 h-2 rounded-full ${
                                  transaction.type === 'disbursement' ? 'bg-blue-500' :
                                  transaction.type === 'repayment' ? 'bg-emerald-500' :
                                  transaction.type === 'interest' ? 'bg-amber-500' : 'bg-gray-500'
                                }`} />
                                <div>
                                  <p className="font-medium">{transaction.type}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(transaction.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">{formatCurrency(parseFloat(transaction.amount))}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-600">No transactions found</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="documents" className="p-6">
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">Related Documents</h3>
                      
                      {documentsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                          <p className="text-gray-600">Loading documents...</p>
                        </div>
                      ) : (
                        <>
                          {/* Document Upload */}
                          <DocumentUpload 
                            entityType="loan"
                            entityId={loan.id}
                            onUploadComplete={() => {
                              queryClient.invalidateQueries({ queryKey: ["/api/attachments", "loan", loan.id] });
                            }}
                          />
                          
                          {/* Document List */}
                          <DocumentList 
                            entityType="loan"
                            entityId={loan.id}
                            showUpload={false}
                          />
                        </>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="analysis" className="p-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Loan Analysis</h3>
                      {balanceLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                          <p className="text-gray-600">Loading analysis...</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <TrendingUp className="h-4 w-4 text-emerald-500" />
                              <span className="font-medium">Days to Maturity</span>
                            </div>
                            <p className="text-2xl font-bold">{urgency.days}</p>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium">Current Balance</span>
                            </div>
                            <p className="text-2xl font-bold">
                              {balance ? formatCurrency(balance.total) : formatCurrency(parseFloat(loan.amount))}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loan.status === 'active' ? (
                  <>
                    <Button 
                      onClick={handleSettleLoan}
                      disabled={settleLoanMutation.isPending}
                      className="w-full bg-emerald-600 lg:hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {settleLoanMutation.isPending ? 'Settling...' : 'Settle Loan'}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setLocation(`/loans/${loan.id}/payment/create`)}
                    >
                      Process Payment
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setLocation(`/loans/${loan.id}/edit`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Loan
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setReminderModalOpen(true)}
                      data-testid="button-set-reminders"
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      Set Reminders
                    </Button>
                    <Separator />
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={handleDeleteLoan}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Cancel Loan
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
                    <p className="font-medium text-emerald-600">Loan Settled</p>
                    <p className="text-sm text-muted-foreground">This loan has been successfully settled</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revolving Period Tracker - Show only if facility has tracking enabled */}
            {facility?.enableRevolvingTracking && (
              <RevolvingPeriodTracker 
                facilityId={loan.facilityId}
                maxRevolvingPeriod={facility.maxRevolvingPeriod}
                initialDrawdownDate={facility.initialDrawdownDate}
              />
            )}

            {/* Balance Information */}
            {balance && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Balance Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Principal:</span>
                    <span className="font-medium">{formatCurrency(balance.principal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interest:</span>
                    <span className="font-medium">{formatCurrency(balance.interest)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fees:</span>
                    <span className="font-medium">{formatCurrency(balance.fees)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(balance.total)}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Reminder Modal */}
        {loanId && (
          <ReminderModal
            loanId={loanId}
            isOpen={reminderModalOpen}
            onClose={() => setReminderModalOpen(false)}
            loanData={{
              referenceNumber: loan.referenceNumber,
              dueDate: loan.dueDate,
              amount: formatCurrency(parseFloat(loan.amount)),
            }}
          />
        )}

        {/* Enhanced Settle Loan Dialog */}
        <Dialog open={settleConfirmOpen} onOpenChange={setSettleConfirmOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Settle Loan
              </DialogTitle>
              <DialogDescription>
                Configure the settlement details for this loan.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Settlement Date */}
              <div className="space-y-2">
                <Label htmlFor="settlement-date">Settlement Date *</Label>
                <ModernDatePicker
                  value={settlementDate}
                  onChange={setSettlementDate}
                  placeholder="Select settlement date"
                  dataTestId="input-settlement-date"
                />
                <p className="text-xs text-muted-foreground">
                  Select the actual date when the loan was settled
                </p>
              </div>

              {/* Settlement Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="settlement-amount">Settlement Amount (SAR) *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setIsManualAmount(!isManualAmount)}
                    data-testid="button-toggle-manual-amount"
                  >
                    {isManualAmount ? "Auto Calculate" : "Manual Override"}
                  </Button>
                </div>
                <Input
                  id="settlement-amount"
                  type="number"
                  step="0.01"
                  value={settlementAmount}
                  onChange={(e) => {
                    setSettlementAmount(e.target.value);
                    setIsManualAmount(true);
                  }}
                  placeholder="Enter settlement amount"
                  className="h-12"
                  data-testid="input-settlement-amount"
                />
                {!isManualAmount && loan && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 space-y-1">
                      <span className="font-medium">Auto-Calculated:</span>
                      <br />
                      Principal: {formatCurrency(parseFloat(loan.amount))}
                      <br />
                      + Interest ({loan.bankRate}% from {new Date(loan.startDate).toLocaleDateString()} to {new Date(settlementDate).toLocaleDateString()}): {formatCurrency(calculateAccruedInterest(parseFloat(loan.amount), parseFloat(loan.bankRate), loan.startDate, settlementDate, loan.interestBasis || 'actual_365'))}
                    </p>
                  </div>
                )}
              </div>

              {/* Total Summary */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Settlement Amount</span>
                  <span className="text-xl font-bold text-primary" data-testid="text-settlement-total">
                    {formatCurrency(parseFloat(settlementAmount || "0"))}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSettleConfirmOpen(false)}
                data-testid="button-cancel-settlement"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmSettle}
                disabled={!settlementAmount || settleLoanMutation.isPending}
                className="bg-emerald-600 lg:hover:bg-emerald-700 text-white"
                data-testid="button-confirm-settlement"
              >
                {settleLoanMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Settling...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Settle Loan
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}