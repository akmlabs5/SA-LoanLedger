import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
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
  BarChart3
} from "lucide-react";
import { Link, useLocation } from "wouter";
import StatisticCard from "@/components/StatisticCard";
import AIInsightsPanel from "@/components/AIInsightsPanel";
import PortfolioChart from "@/components/charts/PortfolioChart";
import PortfolioPerformanceChart from "@/components/charts/PortfolioPerformanceChart";
import LoanDistributionChart from "@/components/charts/LoanDistributionChart";
import { isUnauthorizedError } from "@/lib/authUtils";
import { PortfolioSummary, SiborRate, LoanWithDetails } from "@shared/types";

export default function Dashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

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

  const { data: portfolioSummary, isLoading: portfolioLoading, error: portfolioError } = useQuery<PortfolioSummary>({
    queryKey: ["/api/dashboard/portfolio"],
    enabled: isAuthenticated,
  });

  const { data: activeLoans, isLoading: loansLoading } = useQuery<LoanWithDetails[]>({
    queryKey: ["/api/loans"],
    enabled: isAuthenticated,
  });

  const { data: siborRate } = useQuery<SiborRate>({
    queryKey: ["/api/sibor-rate"],
    enabled: isAuthenticated,
  });

  const { data: allBanks } = useQuery({
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
    // Removed navigation toast to reduce noise - users can see navigation visually
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
    return null; // Will redirect via useEffect
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Welcome back, {(user as any)?.displayName || (user as any)?.firstName || 'User'}. Here's your portfolio overview.
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            {/* Quick Bank Access */}
            {allBanks && Array.isArray(allBanks) && allBanks.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Quick Access:</span>
                <Select onValueChange={(bankId) => {
                  const bank = allBanks.find((b: any) => b.id === bankId);
                  if (bank) {
                    handleBankRowClick(bankId, bank.name);
                  }
                }}>
                  <SelectTrigger 
                    className="w-48 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
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
                        className="flex items-center"
                        data-testid={`option-bank-${bank.id}`}
                      >
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-indigo-500" />
                          <span>{bank.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Badge variant="outline" className="flex items-center space-x-1">
              <Activity className="h-3 w-3" />
              <span>Live</span>
            </Badge>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
        {/* AI Insights Panel - Modern Version */}
        <AIInsightsPanel />

        {/* Enhanced KPI Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Priority Loans with Compact Cards */}
          <div className="lg:col-span-3">
            <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span>Priority Loans</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Loans requiring attention, sorted by urgency</p>
                  </div>
                  <Link href="/loans">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-add-loan">
                      <Plus className="mr-2 h-4 w-4" />
                      New Loan
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-2">
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
                  sortedLoans.slice(0, 6).map((loan) => {
                    const urgency = getLoanUrgency(loan.dueDate);
                    const urgencyBorderClass = urgency.color === 'red' 
                      ? 'border-l-destructive' 
                      : urgency.color === 'yellow' 
                        ? 'border-l-amber-500'
                        : 'border-l-primary';
                    
                    return (
                      <div key={loan.id} className={`bg-card border border-border ${urgencyBorderClass} border-l-4 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200`} data-testid={`card-loan-${loan.id}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <Badge 
                              size="sm"
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
                                    handleBankRowClick(loan.creditLine?.facility?.bank?.id, loan.creditLine?.facility?.bank?.name);
                                  }}
                                  className="font-medium text-foreground hover:text-primary hover:underline transition-colors duration-200 truncate"
                                  data-testid={`text-loan-reference-${loan.id}`}
                                  title={`Click to view ${loan.creditLine?.facility?.bank?.name} details`}
                                >
                                  {loan.creditLine?.facility?.bank?.name}
                                </button>
                                <span className="text-sm text-muted-foreground">•</span>
                                <span className="text-sm text-muted-foreground truncate">{loan.referenceNumber}</span>
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                                <span>Due {new Date(loan.dueDate).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>SIBOR + {loan.bankRate}%</span>
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
                            >
                              {urgency.priority === 'critical' ? 'Urgent' : 'View'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Sticky Quick Actions Panel */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>Quick Actions</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">Streamline your portfolio management</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/loans">
                <Button className="w-full justify-start bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-quick-add-loan">
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
              
              <Button variant="ghost" className="w-full justify-start" data-testid="button-quick-export-reports">
                <Download className="mr-3 h-4 w-4" />
                Export Portfolio Report
              </Button>
              
              <Separator className="my-4" />
              
              {/* Enhanced SIBOR Rate Display */}
              <div className="p-5 bg-secondary border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-foreground font-semibold">SIBOR Rate</span>
                  </div>
                  <span className="text-2xl font-bold text-foreground" data-testid="text-sibor-rate">
                    {siborRate ? `${siborRate.rate}%` : '5.75%'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Monthly Change</span>
                  <div className="flex items-center space-x-1">
                    {((siborRate?.monthlyChange || 0.25) > 0) ? (
                      <ArrowUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                    )}
                    <span className={`font-medium ${
                      (siborRate?.monthlyChange || 0.25) > 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {siborRate ? `${siborRate.monthlyChange > 0 ? '+' : ''}${siborRate.monthlyChange}%` : '+0.25%'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 opacity-75">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Enhanced Bank Exposures Overview */}
        <Card className="mb-8 bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
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
              <table className="w-full">
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
                    portfolioSummary.bankExposures.map((exposure, index) => (
                      <tr 
                        key={exposure.bankId} 
                        className="group hover:bg-accent cursor-pointer transition-colors duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-50" 
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
                        <div className="flex items-center justify-end space-x-3">
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                exposure.utilization > 80 ? 'bg-red-500' :
                                exposure.utilization > 60 ? 'bg-amber-500' :
                                'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(exposure.utilization, 100)}%` }}
                            />
                          </div>
                          <Badge className={`${
                            exposure.utilization > 80 ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400' :
                            exposure.utilization > 60 ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-400' :
                            'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400'
                          }`} data-testid={`text-bank-utilization-${exposure.bankId}`}>
                            {exposure.utilization.toFixed(0)}%
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="hidden group-hover:flex bg-white dark:bg-gray-800 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 focus:ring-2 focus:ring-indigo-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/banks/${exposure.bankId}#facilities`);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                setLocation(`/banks/${exposure.bankId}#facilities`);
                              }
                            }}
                            aria-label={`View facilities for ${exposure.bankName}`}
                            data-testid={`button-facilities-${exposure.bankId}`}
                          >
                            View Facilities
                          </Button>
                        </div>
                      </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <Building className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-2">No banking relationships found</p>
                        <Link href="/banks">
                          <Button 
                            variant="outline" 
                            className="text-indigo-600 border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 focus:ring-2 focus:ring-indigo-500"
                            data-testid="button-add-first-facility"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Set up your first facility
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Enhanced Portfolio Summary Footer */}
            {portfolioSummary && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/20 rounded-xl p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Outstanding</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-total-outstanding-summary">
                      {(portfolioSummary.totalOutstanding / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SAR</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Credit Limits</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-total-limits-summary">
                      {(portfolioSummary.totalCreditLimit / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SAR</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Portfolio LTV</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-overall-ltv-summary">
                      {portfolioSummary.portfolioLtv.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ratio</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Loans</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-active-loans-summary">
                      {portfolioSummary.activeLoansCount}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Facilities</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Interactive Charts Section */}
        <div className="space-y-6 mb-8">
          {/* Row 1: Outstanding vs Credit Limits + Portfolio Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>Outstanding vs Credit Limits</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <PortfolioChart portfolioSummary={portfolioSummary} />
              </CardContent>
            </Card>
            
            <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center space-x-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span>Portfolio Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <LoanDistributionChart 
                  loans={activeLoans} 
                  showTimeDistribution={false} 
                  isLoading={loansLoading}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Row 2: Portfolio Performance (Full Width) */}
          <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center space-x-2">
                <Activity className="h-5 w-5 text-primary" />
                <span>Portfolio Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <PortfolioPerformanceChart 
                timeframe="month" 
                showInterestTrend={true} 
                portfolioSummary={portfolioSummary}
                loans={activeLoans}
                isLoading={portfolioLoading || loansLoading}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
