import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown,
  Wallet, 
  Shield, 
  FileText,
  Plus,
  Building,
  Home,
  Download,
  ArrowUp,
  ArrowDown,
  Activity,
  AlertTriangle,
  Target,
  BarChart3,
  ChevronDown,
  MessageCircle,
  ChevronRight
} from "lucide-react";
import { Link, useLocation } from "wouter";
import StatisticCard from "@/components/StatisticCard";
import AIInsightsPanel from "@/components/AIInsightsPanel";
import OutstandingVsLimitsChart from "@/components/charts/OutstandingVsLimitsChart";
import PortfolioDistributionChart from "@/components/charts/PortfolioDistributionChart";
import LoansTrendChart from "@/components/charts/LoansTrendChart";
import UpcomingLoansByMonthChart from "@/components/charts/UpcomingLoansByMonthChart";
import { SmartLoanMatcher } from "@/components/SmartLoanMatcher";
import { isUnauthorizedError } from "@/lib/authUtils";
import { PortfolioSummary, LoanWithDetails } from "@shared/types";
import { SAUDI_CHART_COLORS } from "@/lib/chart-colors";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader, FloatingActionButton } from "@/components/mobile";
import { usePreferences } from "@/contexts/PreferencesContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LayoutGrid, LayoutList } from "lucide-react";
import backgroundImage from "@assets/loan_management_background_excel_green_1759302449019.png";
import { PageContainer, PageHeader, Section } from "@/components/PageContainer";

export default function Dashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [visibleLoans, setVisibleLoans] = useState(8);
  const [visibleBanks, setVisibleBanks] = useState(3);
  const isMobile = useIsMobile();
  const { preferences } = usePreferences();
  const [currentLayout, setCurrentLayout] = useState<'grid' | 'list'>(preferences?.dashboardLayout || 'grid');
  const compactView = preferences?.compactView === true;

  // Sync layout when preferences change
  useEffect(() => {
    if (preferences?.dashboardLayout) {
      setCurrentLayout(preferences.dashboardLayout);
    }
  }, [preferences?.dashboardLayout]);

  // Mutation to save dashboard layout preference
  const updateLayoutMutation = useMutation({
    mutationFn: async (layout: 'grid' | 'list') => {
      return await apiRequest("POST", "/api/user/preferences", {
        ...preferences,
        dashboardLayout: layout,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
    },
  });

  // Handle layout change with persistence
  const handleLayoutChange = (layout: 'grid' | 'list') => {
    setCurrentLayout(layout);
    updateLayoutMutation.mutate(layout);
  };

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

  // Auto-accept pending invitation after login
  useEffect(() => {
    const acceptPendingInvitation = async () => {
      const pendingToken = localStorage.getItem('pending_invite_token');
      if (isAuthenticated && pendingToken && !isLoading) {
        try {
          const response = await fetch('/api/organization/accept-invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: pendingToken }),
            credentials: 'include',
          });

          if (response.ok) {
            localStorage.removeItem('pending_invite_token');
            toast({
              title: "Welcome to the team!",
              description: "You've successfully joined the organization",
            });
          } else {
            // Handle failed auto-accept
            localStorage.removeItem('pending_invite_token');
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            toast({
              title: "Failed to join organization",
              description: errorData.message || "The invitation may have expired or been revoked",
              variant: "destructive",
            });
          }
        } catch (error) {
          // Clear token and show error on network/other failures
          localStorage.removeItem('pending_invite_token');
          toast({
            title: "Failed to join organization",
            description: "Please try accepting the invitation again",
            variant: "destructive",
          });
          console.error('Failed to auto-accept invitation:', error);
        }
      }
    };

    acceptPendingInvitation();
  }, [isAuthenticated, isLoading, toast]);

  const { data: portfolioSummary, isLoading: portfolioLoading, error: portfolioError } = useQuery<PortfolioSummary>({
    queryKey: ["/api/dashboard/portfolio"],
    enabled: isAuthenticated,
  });

  const { data: activeLoans, isLoading: loansLoading } = useQuery<LoanWithDetails[]>({
    queryKey: ["/api/loans"],
    enabled: isAuthenticated,
  });

  const { data: allBanks } = useQuery<any[]>({
    queryKey: ["/api/banks"],
    enabled: isAuthenticated,
  });

  // Handle unauthorized errors at the endpoint level
  useEffect(() => {
    if (portfolioError && isUnauthorizedError(portfolioError as Error)) {
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
  }, [portfolioError, toast]);

  // Navigation handlers
  const handleBankRowClick = (bankId: string, bankName: string) => {
    setLocation(`/banks/${bankId}`);
  };

  const handleBankSwitcherChange = (bankId: string) => {
    const bank = portfolioSummary?.bankExposures?.find(exp => exp.bankId === bankId);
    if (bank) {
      handleBankRowClick(bankId, bank.bankName);
    }
  };

  // Keyboard event handler for table rows
  const handleBankRowKeyDown = (event: React.KeyboardEvent, bankId: string, bankName: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleBankRowClick(bankId, bankName);
    }
  };

  if (isLoading || portfolioLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Priority sorting for loans based on due date
  const sortedLoans = activeLoans ? [...activeLoans].sort((a, b) => {
    const dateA = new Date(a.dueDate);
    const dateB = new Date(b.dueDate);
    return dateA.getTime() - dateB.getTime();
  }) : [];

  const getLoanUrgency = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const daysDiff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysDiff <= 7) return { color: 'red', label: `Due in ${daysDiff} days`, priority: 'critical' };
    if (daysDiff <= 15) return { color: 'yellow', label: `Due in ${daysDiff} days`, priority: 'warning' };
    return { color: 'green', label: `Due in ${daysDiff} days`, priority: 'normal' };
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <PageContainer className="pb-20">
        <MobileHeader 
          title="Dashboard" 
          rightAction={
            <Badge className="bg-emerald-600 text-white">v2.0.3</Badge>
          }
        />

        <Section>
          {/* Mobile: Horizontal Scrolling Metrics with Snap Points */}
          <div className="overflow-x-auto -mx-4 px-4 pb-2">
            <div className="flex gap-3 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
              <Card 
                className="min-w-[280px] snap-start bg-gradient-to-br from-emerald-500 to-teal-600 border-0 active:scale-95 transition-transform" 
                data-testid="card-metric-outstanding"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-white/80 mb-1">Total Outstanding</p>
                      <p className="text-3xl font-bold text-white" data-testid="text-total-outstanding">
                        {portfolioSummary ? `${(portfolioSummary.totalOutstanding / 1000000).toFixed(1)}M` : '0.0M'}
                      </p>
                      <p className="text-xs text-white/70 mt-1">SAR</p>
                      <div className="flex items-center gap-1 mt-2 text-white/90">
                        <ArrowUp className="h-3 w-3" />
                        <span className="text-xs">+2.4% from last month</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="min-w-[280px] snap-start bg-gradient-to-br from-blue-500 to-cyan-600 border-0 active:scale-95 transition-transform"
                data-testid="card-metric-credit"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-white/80 mb-1">Available Credit</p>
                      <p className="text-3xl font-bold text-white" data-testid="text-available-credit">
                        {portfolioSummary ? `${(portfolioSummary.availableCredit / 1000000).toFixed(1)}M` : '0.0M'}
                      </p>
                      <p className="text-xs text-white/70 mt-1">SAR</p>
                      <p className="text-xs text-white/90 mt-2">
                        {portfolioSummary ? `${((portfolioSummary.totalOutstanding / portfolioSummary.totalCreditLimit) * 100).toFixed(0)}% utilization` : '0% utilization'}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Wallet className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="min-w-[280px] snap-start bg-gradient-to-br from-purple-500 to-pink-600 border-0 active:scale-95 transition-transform"
                data-testid="card-metric-ltv"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-white/80 mb-1">Portfolio LTV</p>
                      <p className="text-3xl font-bold text-white" data-testid="text-portfolio-ltv">
                        {portfolioSummary ? `${portfolioSummary.portfolioLtv.toFixed(1)}` : '68.4'}%
                      </p>
                      <p className="text-xs text-white/70 mt-1">Ratio</p>
                      <div className="flex items-center gap-1 mt-2 text-white/90">
                        <Target className="h-3 w-3" />
                        <span className="text-xs">Optimal: 60-75%</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="min-w-[280px] snap-start bg-gradient-to-br from-amber-500 to-orange-600 border-0 active:scale-95 transition-transform"
                data-testid="card-metric-loans"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-white/80 mb-1">Active Loans</p>
                      <p className="text-3xl font-bold text-white" data-testid="text-active-loans">
                        {portfolioSummary?.activeLoansCount || 0}
                      </p>
                      <p className="text-xs text-white/70 mt-1">loans</p>
                      <div className="flex items-center gap-1 mt-2 text-white/90">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="text-xs">
                          {sortedLoans.filter(loan => {
                            const urgency = getLoanUrgency(loan.dueDate);
                            return urgency.priority === 'critical';
                          }).length} due this week
                        </span>
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Mobile: AI Assistant Card */}
          <Card 
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 active:scale-[0.98] transition-transform"
            onClick={() => setLocation('/ai-chat')}
            data-testid="card-ai-assistant"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white">AI Assistant</h3>
                  <p className="text-sm text-white/90">Get intelligent insights</p>
                </div>
                <ChevronRight className="h-5 w-5 text-white shrink-0" />
              </div>
            </CardContent>
          </Card>

          {/* Mobile: Priority Loans List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Priority Loans</h2>
              <Badge variant="outline">{sortedLoans.length} total</Badge>
            </div>

            {loansLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : sortedLoans.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active loans</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {sortedLoans.slice(0, visibleLoans).map((loan) => {
                  const urgency = getLoanUrgency(loan.dueDate);
                  const urgencyBorderClass = urgency.color === 'red' 
                    ? 'border-l-destructive' 
                    : urgency.color === 'yellow' 
                      ? 'border-l-amber-500'
                      : 'border-l-primary';
                  
                  return (
                    <Card 
                      key={loan.id} 
                      className={`${urgencyBorderClass} border-l-4 active:scale-[0.98] active:bg-accent/50 transition-all cursor-pointer`}
                      onClick={() => setLocation(`/loans/${loan.id}`)}
                      data-testid={`card-loan-${loan.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge 
                                className={`${
                                  urgency.color === 'red' ? 'bg-destructive text-destructive-foreground' : 
                                  urgency.color === 'yellow' ? 'bg-amber-500 text-white' : 
                                  'bg-primary text-primary-foreground'
                                } text-xs`}
                              >
                                {urgency.priority === 'critical' ? 'Critical' : urgency.priority === 'warning' ? 'Warning' : 'Normal'}
                              </Badge>
                            </div>
                            <p className="font-semibold truncate" data-testid={`text-loan-reference-${loan.id}`}>
                              {(loan as any).facility?.bank?.name}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">{loan.referenceNumber}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Due {new Date(loan.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xl font-bold" data-testid={`text-loan-amount-${loan.id}`}>
                              {(parseFloat(loan.amount) / 1000000).toFixed(1)}M
                            </p>
                            <p className="text-xs text-muted-foreground">SAR</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {sortedLoans.length > visibleLoans && (
                  <Button 
                    variant="outline" 
                    className="w-full h-12 active:scale-95 active:bg-accent/50 transition-all"
                    onClick={() => setVisibleLoans(prev => prev + 8)}
                    data-testid="button-load-more-loans"
                  >
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Load more ({sortedLoans.length - visibleLoans} remaining)
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Mobile: Bank Exposures Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Bank Exposures</h2>
              <Badge variant="outline">{portfolioSummary?.bankExposures?.length || 0} banks</Badge>
            </div>

            <div className="space-y-3">
              {portfolioSummary?.bankExposures && portfolioSummary.bankExposures.length > 0 ? (
                portfolioSummary.bankExposures.slice(0, visibleBanks).map((exposure) => (
                  <Card 
                    key={exposure.bankId}
                    className="active:scale-[0.98] active:bg-accent/50 transition-all cursor-pointer"
                    onClick={() => handleBankRowClick(exposure.bankId, exposure.bankName)}
                    data-testid={`card-bank-${exposure.bankId}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Building className="h-4 w-4 text-primary" />
                            <p className="font-semibold truncate" data-testid={`text-bank-name-${exposure.bankId}`}>
                              {exposure.bankName}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Outstanding</p>
                              <p className="font-semibold" data-testid={`text-bank-outstanding-${exposure.bankId}`}>
                                {(exposure.outstanding / 1000000).toFixed(1)}M SAR
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Available</p>
                              <p className="font-semibold text-emerald-600" data-testid={`text-bank-available-${exposure.bankId}`}>
                                {((exposure.creditLimit - exposure.outstanding) / 1000000).toFixed(1)}M SAR
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-bold" data-testid={`text-bank-utilization-${exposure.bankId}`}>
                            {exposure.utilization.toFixed(0)}%
                          </p>
                          <p className="text-xs text-muted-foreground">used</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center">
                  <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No bank exposures</p>
                </Card>
              )}

              {portfolioSummary?.bankExposures && portfolioSummary.bankExposures.length > visibleBanks && (
                <Button 
                  variant="outline" 
                  className="w-full h-12 active:scale-95 active:bg-accent/50 transition-all"
                  onClick={() => setVisibleBanks(prev => prev + 3)}
                  data-testid="button-load-more-banks"
                >
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Load more ({portfolioSummary.bankExposures.length - visibleBanks} remaining)
                </Button>
              )}
            </div>
          </div>

          {/* Mobile: Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Card 
                className="active:scale-95 active:bg-accent/50 transition-all cursor-pointer"
                onClick={() => setLocation('/banks')}
                data-testid="card-quick-banks"
              >
                <CardContent className="p-4 text-center">
                  <Building className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">Banks</p>
                </CardContent>
              </Card>

              <Card 
                className="active:scale-95 active:bg-accent/50 transition-all cursor-pointer"
                onClick={() => setLocation('/collateral')}
                data-testid="card-quick-collateral"
              >
                <CardContent className="p-4 text-center">
                  <Home className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">Collateral</p>
                </CardContent>
              </Card>

              <Card 
                className="active:scale-95 active:bg-accent/50 transition-all cursor-pointer"
                onClick={() => setLocation('/reports')}
                data-testid="card-quick-reports"
              >
                <CardContent className="p-4 text-center">
                  <Download className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">Reports</p>
                </CardContent>
              </Card>

              <Card 
                className="active:scale-95 active:bg-accent/50 transition-all cursor-pointer"
                onClick={() => setLocation('/ai-chat')}
                data-testid="card-quick-ai"
              >
                <CardContent className="p-4 text-center">
                  <MessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">AI Chat</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </Section>

        {/* Mobile FAB for Add Loan */}
        <FloatingActionButton 
          onClick={() => setLocation('/loans')}
          icon={<Plus className="h-6 w-6" />}
          label="Add Loan"
        />
      </PageContainer>
    );
  }

  // Desktop Layout
  return (
    <PageContainer>
      <Section>
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <Badge className="bg-emerald-600 text-white lg:hover:bg-emerald-700">v2.0.3</Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Welcome back, {String((user as any)?.displayName || (user as any)?.firstName || 'User')}. Here's your portfolio overview.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Quick Bank Access */}
            {allBanks && Array.isArray(allBanks) && allBanks.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Quick Access:</span>
                <Select onValueChange={(bankId) => {
                  const bank = allBanks.find((b: any) => b.id === bankId);
                  if (bank) {
                    handleBankRowClick(bankId, bank.name);
                  }
                }}>
                  <SelectTrigger 
                    className="w-40 sm:w-48 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 lg:hover:border-blue-400 dark:hover:border-blue-500 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    data-testid="select-bank-switcher"
                    aria-label="Quick access to bank details"
                  >
                    <SelectValue placeholder="Select bank..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allBanks.map((bank: any) => (
                      <SelectItem 
                        key={bank.id} 
                        value={bank.id}
                        data-testid={`option-bank-${bank.id}`}
                      >
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Badge variant="outline" className="flex items-center gap-1 whitespace-nowrap">
              <Activity className="h-3 w-3" />
              <span>Live</span>
            </Badge>
            <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* 🔥 AI ASSISTANT QUICK ACCESS - MOVED TO TOP FOR VISIBILITY */}
        <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-lg mb-4 sm:mb-6">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-white">AI Assistant</CardTitle>
                  <p className="text-sm text-white/90 mt-1">Get intelligent insights and recommendations</p>
                </div>
              </div>
              <Link href="/ai-chat">
                <Button 
                  className="bg-white text-emerald-600 lg:hover:bg-white/90 font-semibold w-full sm:w-auto"
                  data-testid="button-ai-assistant"
                >
                  Open AI Chat
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>

        {/* AI Insights Panel - Modern Version */}
        <AIInsightsPanel />

        {/* Enhanced KPI Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <StatisticCard
            title="Total Outstanding"
            value={portfolioSummary ? `${(portfolioSummary.totalOutstanding / 1000000).toFixed(1)}M` : '0.0M'}
            suffix="SAR"
            metaInfo={
              <div className="flex items-center space-x-1">
                <ArrowUp className="h-3 w-3" />
                <span>+2.4% from last month</span>
              </div>
            }
            icon={BarChart3}
            testId="text-total-outstanding"
          />
          
          <StatisticCard
            title="Available Credit"
            value={portfolioSummary ? `${(portfolioSummary.availableCredit / 1000000).toFixed(1)}M` : '0.0M'}
            suffix="SAR"
            metaInfo={portfolioSummary ? `${((portfolioSummary.totalOutstanding / portfolioSummary.totalCreditLimit) * 100).toFixed(0)}% utilization` : '0% utilization'}
            icon={Wallet}
            testId="text-available-credit"
          />
          
          <StatisticCard
            title="Portfolio LTV"
            value={portfolioSummary ? `${portfolioSummary.portfolioLtv.toFixed(1)}` : '68.4'}
            suffix="%"
            metaInfo={
              <div className="flex items-center space-x-1">
                <Target className="h-3 w-3" />
                <span>Optimal range: 60-75%</span>
              </div>
            }
            icon={Shield}
            testId="text-portfolio-ltv"
          />
          
          <StatisticCard
            title="Active Loans"
            value={`${portfolioSummary?.activeLoansCount || 0}`}
            suffix="loans"
            metaInfo={
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-3 w-3" />
                <span>
                  {sortedLoans.filter(loan => {
                    const urgency = getLoanUrgency(loan.dueDate);
                    return urgency.priority === 'critical';
                  }).length} due this week
                </span>
              </div>
            }
            icon={FileText}
            testId="text-active-loans"
          />
        </div>

        {/* Enhanced Loans Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {/* Priority Loans with Compact Cards */}
          <div className="lg:col-span-3">
            <Card className="bg-card border border-border shadow-sm lg:hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
              <CardHeader className="pb-4 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span>Priority Loans</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Loans requiring attention, sorted by urgency</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex border rounded-md">
                      <Button
                        variant={currentLayout === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleLayoutChange('grid')}
                        className="rounded-r-none"
                        data-testid="button-layout-grid"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={currentLayout === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleLayoutChange('list')}
                        className="rounded-l-none"
                        data-testid="button-layout-list"
                      >
                        <LayoutList className="h-4 w-4" />
                      </Button>
                    </div>
                    <SmartLoanMatcher />
                    <Link href="/loans">
                      <Button className="bg-primary lg:hover:bg-primary/90 text-primary-foreground" data-testid="button-add-loan">
                        <Plus className="mr-2 h-4 w-4" />
                        New Loan
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 min-h-0 flex flex-col">
                {loansLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-3 text-muted-foreground">Loading loans...</span>
                  </div>
                ) : sortedLoans.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">No active loans found</p>
                    <Link href="/loans">
                      <Button variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Add your first loan
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className={currentLayout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pr-2 flex-1 max-h-[500px]' : 'space-y-2 overflow-y-auto pr-2 flex-1 max-h-[500px]'}>
                      {sortedLoans.slice(0, visibleLoans).map((loan) => {
                        const urgency = getLoanUrgency(loan.dueDate);
                        const urgencyBorderClass = urgency.color === 'red' 
                          ? 'border-l-destructive' 
                          : urgency.color === 'yellow' 
                            ? 'border-l-amber-500'
                            : 'border-l-primary';
                        const paddingClass = compactView ? 'p-3' : 'p-4';
                        
                        return (
                          <div key={loan.id} className={`bg-card border border-border ${urgencyBorderClass} border-l-4 ${paddingClass} rounded-lg shadow-sm lg:hover:shadow-md transition-shadow duration-200`} data-testid={`card-loan-${loan.id}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 min-w-0 flex-1">
                                <Badge 
                                  className={`${
                                    urgency.color === 'red' ? 'bg-destructive text-destructive-foreground' : 
                                    urgency.color === 'yellow' ? 'bg-amber-500 text-white' : 
                                    'bg-primary text-primary-foreground'
                                  } text-xs`}
                                >
                                  {urgency.priority === 'critical' ? 'Critical' : urgency.priority === 'warning' ? 'Warning' : 'Normal'}
                                </Badge>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleBankRowClick((loan as any).facility?.bank?.id, (loan as any).facility?.bank?.name);
                                      }}
                                      className="font-medium text-foreground lg:hover:text-primary lg:hover:underline transition-colors duration-200 truncate"
                                      data-testid={`text-loan-reference-${loan.id}`}
                                      title={`Click to view ${(loan as any).facility?.bank?.name} details`}
                                    >
                                      {(loan as any).facility?.bank?.name}
                                    </button>
                                    <span className="text-sm text-muted-foreground">•</span>
                                    <span className="text-sm text-muted-foreground truncate">{loan.referenceNumber}</span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-1">
                                    <span className="whitespace-nowrap">Due {new Date(loan.dueDate).toLocaleDateString()}</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="whitespace-nowrap">SIBOR {loan.siborRate}% + Margin {(loan as any).margin}% = {loan.bankRate}%</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex items-center space-x-3">
                                <div>
                                  <p className="text-lg font-bold text-foreground" data-testid={`text-loan-amount-${loan.id}`}>
                                    {(parseFloat(loan.amount) / 1000000).toFixed(1)}M
                                  </p>
                                  <p className="text-xs text-muted-foreground">SAR</p>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant={urgency.priority === 'critical' ? 'destructive' : 'outline'}
                                  className="text-xs"
                                  onClick={() => setLocation(`/loans/${loan.id}`)}
                                  data-testid={`button-view-loan-${loan.id}`}
                                >
                                  {urgency.priority === 'critical' ? 'Urgent' : 'View'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {sortedLoans.length > visibleLoans && (
                      <div className="mt-4 pt-4 border-t border-border shrink-0">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setVisibleLoans(prev => prev + 8)}
                          data-testid="button-load-more-loans"
                        >
                          <ChevronDown className="mr-2 h-4 w-4" />
                          Load more ({sortedLoans.length - visibleLoans} remaining)
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Sticky Quick Actions Panel */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <Card className="bg-card border border-border shadow-sm lg:hover:shadow-md transition-shadow duration-200 h-full flex flex-col min-h-[600px]">
              <CardHeader className="pb-4 shrink-0">
              <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>Quick Actions</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">Streamline your portfolio management</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between min-h-[450px]">
              <div className="space-y-4">
                <Link href="/loans">
                  <Button className="w-full justify-start bg-primary lg:hover:bg-primary/90 text-primary-foreground" data-testid="button-quick-add-loan">
                    <Plus className="mr-3 h-4 w-4" />
                    Add New Loan
                  </Button>
                </Link>
                
                <Link href="/banks">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-quick-manage-banks">
                    <Building className="mr-3 h-4 w-4" />
                    Manage Bank Facilities
                  </Button>
                </Link>
                
                <Link href="/collateral">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-quick-update-collateral">
                    <Home className="mr-3 h-4 w-4" />
                    Update Collateral
                  </Button>
                </Link>
                
                <Link href="/reports">
                  <Button variant="ghost" className="w-full justify-start" data-testid="button-quick-export-reports">
                    <Download className="mr-3 h-4 w-4" />
                    Export Portfolio Report
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Enhanced Bank Exposures Overview */}
        <Card className="mb-6 sm:mb-8 bg-card border border-border shadow-sm lg:hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                  <Building className="h-5 w-5 text-primary" />
                  <span>Bank Exposures</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">Your banking relationships and credit utilization</p>
              </div>
              <Badge variant="outline">
                {portfolioSummary?.bankExposures?.length || 0} Banks
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Bank Name</th>
                    <th className="text-right py-4 px-6 font-semibold text-foreground">Outstanding</th>
                    <th className="text-right py-4 px-6 font-semibold text-foreground">Credit Limit</th>
                    <th className="text-right py-4 px-6 font-semibold text-foreground">Available</th>
                    <th className="text-right py-4 px-6 font-semibold text-foreground">Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {portfolioSummary?.bankExposures && portfolioSummary.bankExposures.length > 0 ? (
                    portfolioSummary.bankExposures.slice(0, visibleBanks).map((exposure, index) => (
                      <tr 
                        key={exposure.bankId} 
                        className="group lg:hover:bg-accent cursor-pointer transition-colors duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-50" 
                        data-testid={`row-bank-${exposure.bankId}`}
                        onClick={() => handleBankRowClick(exposure.bankId, exposure.bankName)}
                        onKeyDown={(e) => handleBankRowKeyDown(e, exposure.bankId, exposure.bankName)}
                        tabIndex={0}
                        role="button"
                        aria-label={`View details for ${exposure.bankName}. Outstanding: ${(exposure.outstanding / 1000000).toFixed(1)}M SAR. Utilization: ${exposure.utilization.toFixed(0)}%`}
                        title={`Click to view ${exposure.bankName} details`}
                      >
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100" data-testid={`text-bank-name-${exposure.bankId}`}>
                              {exposure.bankName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Banking Partner</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-gray-100" data-testid={`text-bank-outstanding-${exposure.bankId}`}>
                            {(exposure.outstanding / 1000000).toFixed(1)}M
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">SAR</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300" data-testid={`text-bank-limit-${exposure.bankId}`}>
                            {(exposure.creditLimit / 1000000).toFixed(1)}M
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">SAR</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div>
                          <p className="font-medium text-emerald-600 dark:text-emerald-400" data-testid={`text-bank-available-${exposure.bankId}`}>
                            {((exposure.creditLimit - exposure.outstanding) / 1000000).toFixed(1)}M
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Available</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${exposure.utilization >= 80 ? 'bg-red-500' : exposure.utilization >= 60 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(exposure.utilization, 100)}%` }}
                            />
                          </div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100 w-12" data-testid={`text-bank-utilization-${exposure.bankId}`}>
                            {exposure.utilization.toFixed(0)}%
                          </p>
                        </div>
                      </td>
                    </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <p className="text-muted-foreground">No bank exposures found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {portfolioSummary?.bankExposures && portfolioSummary.bankExposures.length > visibleBanks && (
              <div className="mt-4 pt-4 border-t border-border">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setVisibleBanks(prev => prev + 3)}
                  data-testid="button-load-more-banks"
                >
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Load more banks ({portfolioSummary.bankExposures.length - visibleBanks} remaining)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts Section - Desktop Only */}
        {/* Upcoming Loans by Month - Full Width Large Chart */}
        <Card className="bg-card border border-border shadow-sm lg:hover:shadow-md transition-shadow duration-200 mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Upcoming Loans by Month</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <UpcomingLoansByMonthChart allBanks={allBanks} />
          </CardContent>
        </Card>

        {/* Other Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-card border border-border shadow-sm lg:hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Outstanding vs Limits</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <OutstandingVsLimitsChart portfolioSummary={portfolioSummary} />
            </CardContent>
          </Card>

          <Card className="bg-card border border-border shadow-sm lg:hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Portfolio Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <PortfolioDistributionChart portfolioSummary={portfolioSummary} />
            </CardContent>
          </Card>

          <Card className="bg-card border border-border shadow-sm lg:hover:shadow-md transition-shadow duration-200 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Loans Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <LoansTrendChart loans={activeLoans || []} isLoading={loansLoading} />
            </CardContent>
          </Card>
        </div>
      </Section>
    </PageContainer>
  );
}
