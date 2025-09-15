import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { University, Plus, ArrowLeft, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import LoanForm from "@/components/LoanForm";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

export default function Loans() {
  const { isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

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
    enabled: isAuthenticated,
  });

  const settleLoanMutation = useMutation({
    mutationFn: async ({ loanId, settledAmount }: { loanId: string; settledAmount: number }) => {
      await apiRequest("PUT", `/api/loans/${loanId}/settle`, { settledAmount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      toast({
        title: "Success",
        description: "Loan settled successfully",
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const getLoanUrgency = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const daysDiff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysDiff <= 7) return { variant: 'destructive' as const, label: `Due in ${daysDiff} days` };
    if (daysDiff <= 15) return { variant: 'secondary' as const, label: `Due in ${daysDiff} days` };
    return { variant: 'default' as const, label: `Due in ${daysDiff} days` };
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

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="button-back-dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="w-8 h-8 bg-saudi text-white rounded-lg flex items-center justify-center">
                <University className="text-sm" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Loan Management</h1>
            </div>
            
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-add-loan"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Loan
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active" data-testid="tab-active-loans">
              Active Loans ({activeLoans?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="settled" data-testid="tab-settled-loans">
              Settled Loans ({settledLoans?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeLoading ? (
              <div className="text-center py-8">Loading active loans...</div>
            ) : activeLoans?.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No active loans found</p>
                  <Button 
                    onClick={() => setShowForm(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-add-first-loan"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Loan
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {activeLoans?.map((loan) => {
                  const urgency = getLoanUrgency(loan.dueDate);
                  return (
                    <Card key={loan.id} data-testid={`card-active-loan-${loan.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h3 className="font-semibold text-lg" data-testid={`text-loan-bank-${loan.id}`}>
                                {loan.facility.bank.name}
                              </h3>
                              <p className="text-sm text-muted-foreground" data-testid={`text-loan-reference-${loan.id}`}>
                                {loan.referenceNumber}
                              </p>
                            </div>
                            <Badge variant={urgency.variant} data-testid={`badge-loan-urgency-${loan.id}`}>
                              {urgency.label}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold" data-testid={`text-loan-amount-${loan.id}`}>
                              {(parseFloat(loan.amount) / 1000000).toFixed(1)}M SAR
                            </p>
                            <p className="text-sm text-muted-foreground">
                              SIBOR + {loan.bankRate}%
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Start Date</p>
                            <p className="font-medium">{new Date(loan.startDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Due Date</p>
                            <p className="font-medium">{new Date(loan.dueDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Daily Interest</p>
                            <p className="font-medium">
                              {((parseFloat(loan.amount) * (parseFloat(loan.siborRate) + parseFloat(loan.bankRate)) / 100) / 365).toFixed(0)} SAR
                            </p>
                          </div>
                        </div>

                        {loan.notes && (
                          <div className="mb-4">
                            <p className="text-sm text-muted-foreground">Notes</p>
                            <p className="text-sm">{loan.notes}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" data-testid={`button-view-details-${loan.id}`}>
                              View Details
                            </Button>
                            <Button variant="outline" size="sm" data-testid={`button-documents-${loan.id}`}>
                              Documents
                            </Button>
                          </div>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleSettleLoan(loan.id, loan.amount)}
                            disabled={settleLoanMutation.isPending}
                            data-testid={`button-settle-${loan.id}`}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {settleLoanMutation.isPending ? 'Settling...' : 'Settle Loan'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settled" className="space-y-4">
            {settledLoading ? (
              <div className="text-center py-8">Loading settled loans...</div>
            ) : settledLoans?.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No settled loans found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {settledLoans?.map((loan) => (
                  <Card key={loan.id} className="opacity-75" data-testid={`card-settled-loan-${loan.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="font-semibold text-lg" data-testid={`text-settled-loan-bank-${loan.id}`}>
                              {loan.facility.bank.name}
                            </h3>
                            <p className="text-sm text-muted-foreground" data-testid={`text-settled-loan-reference-${loan.id}`}>
                              {loan.referenceNumber}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Settled
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-muted-foreground" data-testid={`text-settled-loan-amount-${loan.id}`}>
                            {loan.settledAmount ? (parseFloat(loan.settledAmount) / 1000000).toFixed(1) : (parseFloat(loan.amount) / 1000000).toFixed(1)}M SAR
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Original: {(parseFloat(loan.amount) / 1000000).toFixed(1)}M SAR
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Start Date</p>
                          <p className="font-medium">{new Date(loan.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Due Date</p>
                          <p className="font-medium">{new Date(loan.dueDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Settled Date</p>
                          <p className="font-medium">
                            {loan.settledDate ? new Date(loan.settledDate).toLocaleDateString() : 'N/A'}
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

      {/* Loan Form Modal */}
      {showForm && (
        <LoanForm
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
            queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
