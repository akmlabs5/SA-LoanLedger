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
import AIInsightsPanel from "@/components/AIInsightsPanel";
import PortfolioChart from "@/components/charts/PortfolioChart";
import PortfolioPerformanceChart from "@/components/charts/PortfolioPerformanceChart";
import LoanDistributionChart from "@/components/charts/LoanDistributionChart";
import LTVTrendChart from "@/components/charts/LTVTrendChart";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900">
      <div className="p-6 space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Welcome back, {user?.displayName || user?.firstName || 'User'}. Here's your portfolio overview.
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            {/* Quick Bank Switcher */}
            {portfolioSummary?.bankExposures && portfolioSummary.bankExposures.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Quick Access:</span>
                <Select onValueChange={handleBankSwitcherChange}>
                  <SelectTrigger 
                    className="w-48 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    data-testid="select-bank-switcher"
                    aria-label="Quick access to bank details"
                  >
                    <SelectValue placeholder="Select bank..." />
                  </SelectTrigger>
                  <SelectContent>
                    {portfolioSummary.bankExposures.map((exposure) => (
                      <SelectItem 
                        key={exposure.bankId} 
                        value={exposure.bankId}
                        className="flex items-center"
                        data-testid={`option-bank-${exposure.bankId}`}
                      >
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-indigo-500" />
                          <span>{exposure.bankName}</span>
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
          {/* Total Outstanding Card */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Outstanding</p>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100" data-testid="text-total-outstanding">
                      {portfolioSummary ? `${(portfolioSummary.totalOutstanding / 1000000).toFixed(1)}M` : '0.0M'}
                    </p>
                    <span className="text-sm text-blue-600 dark:text-blue-400">SAR</span>
                  </div>
                  <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                    <ArrowUp className="h-3 w-3" />
                    <span className="text-xs font-medium">+2.4% from last month</span>
                  </div>
                </div>
                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="text-white text-2xl" />
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-blue-200/30 rounded-full" />
            </CardContent>
          </Card>
          
          {/* Available Credit Card */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-800/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Available Credit</p>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100" data-testid="text-available-credit">
                      {portfolioSummary ? `${(portfolioSummary.availableCredit / 1000000).toFixed(1)}M` : '0.0M'}
                    </p>
                    <span className="text-sm text-emerald-600 dark:text-emerald-400">SAR</span>
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {portfolioSummary ? `${((portfolioSummary.totalOutstanding / portfolioSummary.totalCreditLimit) * 100).toFixed(0)}% utilization` : '0% utilization'}
                  </div>
                </div>
                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Wallet className="text-white text-2xl" />
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-200/30 rounded-full" />
            </CardContent>
          </Card>
          
          {/* Portfolio LTV Card */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-800/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Portfolio LTV</p>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-3xl font-bold text-amber-900 dark:text-amber-100" data-testid="text-portfolio-ltv">
                      {portfolioSummary ? `${portfolioSummary.portfolioLtv.toFixed(1)}` : '68.4'}
                    </p>
                    <span className="text-sm text-amber-600 dark:text-amber-400">%</span>
                  </div>
                  <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400">
                    <Target className="h-3 w-3" />
                    <span className="text-xs font-medium">Optimal range: 60-75%</span>
                  </div>
                </div>
                <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Shield className="text-white text-2xl" />
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-200/30 rounded-full" />
            </CardContent>
          </Card>
          
          {/* Active Loans Card */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-800/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Loans</p>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100" data-testid="text-active-loans">
                      {portfolioSummary?.activeLoansCount || 0}
                    </p>
                    <span className="text-sm text-purple-600 dark:text-purple-400">loans</span>
                  </div>
                  <div className="flex items-center space-x-1 text-purple-600 dark:text-purple-400">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="text-xs font-medium">
                      {sortedLoans.filter(loan => {
                        const urgency = getLoanUrgency(loan.dueDate);
                        return urgency.priority === 'critical';
                      }).length} due this week
                    </span>
                  </div>
                </div>
                <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <FileText className="text-white text-2xl" />
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-purple-200/30 rounded-full" />
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Loans Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Priority Loans Due */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span>Priority Loans</span>
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Loans requiring attention, sorted by urgency</p>
                  </div>
                  <Link href="/loans">
                    <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300" data-testid="button-add-loan">
                      <Plus className="mr-2 h-4 w-4" />
                      New Loan
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {loansLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading loans...</span>
                  </div>
                ) : sortedLoans.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">No active loans found</p>
                    <Link href="/loans">
                      <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <Plus className="mr-2 h-4 w-4" />
                        Add your first loan
                      </Button>
                    </Link>
                  </div>
                ) : (
                  sortedLoans.slice(0, 5).map((loan) => {
                    const urgency = getLoanUrgency(loan.dueDate);
                    const gradientClass = urgency.color === 'red' 
                      ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-200 dark:from-red-900/20 dark:to-red-800/20 dark:border-red-800/30' 
                      : urgency.color === 'yellow' 
                        ? 'bg-gradient-to-r from-amber-50 to-yellow-100 border-amber-200 dark:from-amber-900/20 dark:to-yellow-800/20 dark:border-amber-800/30'
                        : 'bg-gradient-to-r from-emerald-50 to-green-100 border-emerald-200 dark:from-emerald-900/20 dark:to-green-800/20 dark:border-emerald-800/30';
                    
                    return (
                      <div key={loan.id} className={`border-l-4 p-5 rounded-r-xl ${gradientClass} hover:shadow-md transition-all duration-300`} data-testid={`card-loan-${loan.id}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Badge className={`${
                              urgency.color === 'red' ? 'bg-red-500 hover:bg-red-600' : 
                              urgency.color === 'yellow' ? 'bg-amber-500 hover:bg-amber-600' : 
                              'bg-emerald-500 hover:bg-emerald-600'
                            } text-white shadow-sm`}>
                              {urgency.label}
                            </Badge>
                            <div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBankRowClick(loan.facility.bank.id, loan.facility.bank.name);
                                }}
                                className="font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors duration-200"
                                data-testid={`text-loan-reference-${loan.id}`}
                                title={`Click to view ${loan.facility.bank.name} details`}
                              >
                                {loan.facility.bank.name}
                              </button>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{loan.referenceNumber}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid={`text-loan-amount-${loan.id}`}>
                              {(parseFloat(loan.amount) / 1000000).toFixed(1)}M
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">SAR</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div className="space-y-1">
                            <span className="text-gray-500 dark:text-gray-400">Due Date</span>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(loan.dueDate).toLocaleDateString()}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-gray-500 dark:text-gray-400">Interest Rate</span>
                            <p className="font-medium text-gray-900 dark:text-gray-100">SIBOR + {loan.bankRate}%</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Button size="sm" className={`${
                            urgency.priority === 'critical' 
                              ? 'bg-red-600 hover:bg-red-700 text-white' 
                              : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          } shadow-sm`}>
                            {urgency.priority === 'critical' ? 'Urgent Action Required' : 'View Details'}
                          </Button>
                          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                            <Activity className="h-3 w-3" />
                            <span>Track</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Enhanced Quick Actions Panel */}
          <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span>Quick Actions</span>
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">Streamline your portfolio management</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/loans">
                <Button className="w-full justify-start bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-300" data-testid="button-quick-add-loan">
                  <Plus className="mr-3 h-4 w-4" />
                  Add New Loan
                </Button>
              </Link>
              
              <Link href="/banks">
                <Button variant="outline" className="w-full justify-start border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20" data-testid="button-quick-manage-banks">
                  <Building className="mr-3 h-4 w-4" />
                  Manage Bank Facilities
                </Button>
              </Link>
              
              <Link href="/collateral">
                <Button variant="outline" className="w-full justify-start border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20" data-testid="button-quick-update-collateral">
                  <Home className="mr-3 h-4 w-4" />
                  Update Collateral
                </Button>
              </Link>
              
              <Button variant="ghost" className="w-full justify-start text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700" data-testid="button-quick-export-reports">
                <Download className="mr-3 h-4 w-4" />
                Export Portfolio Report
              </Button>
              
              <Separator className="my-4" />
              
              {/* Enhanced SIBOR Rate Display */}
              <div className="p-5 bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 dark:from-blue-900/30 dark:via-blue-800/20 dark:to-indigo-800/20 border border-blue-200/50 dark:border-blue-700/30 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-blue-800 dark:text-blue-300 font-semibold">SIBOR Rate</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-900 dark:text-blue-100" data-testid="text-sibor-rate">
                    {siborRate ? `${siborRate.rate}%` : '5.75%'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-700 dark:text-blue-400">Monthly Change</span>
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
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 opacity-75">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Bank Exposures Overview */}
        <Card className="mb-8 border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                  <Building className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Bank Exposures</span>
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your banking relationships and credit utilization</p>
              </div>
              <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                {portfolioSummary?.bankExposures?.length || 0} Banks
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-gray-100">Bank Name</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-900 dark:text-gray-100">Outstanding</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-900 dark:text-gray-100">Credit Limit</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-900 dark:text-gray-100">Available</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-900 dark:text-gray-100">Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {portfolioSummary?.bankExposures && portfolioSummary.bankExposures.length > 0 ? (
                    portfolioSummary.bankExposures.map((exposure, index) => (
                      <tr 
                        key={exposure.bankId} 
                        className="group hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 dark:hover:from-indigo-900/20 dark:hover:to-blue-900/20 hover:shadow-md cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-l-4 hover:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-opacity-50" 
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
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border border-indigo-200 dark:border-indigo-700 rounded-xl flex items-center justify-center">
                            <Building className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
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
          {/* Main Portfolio Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="transform hover:scale-[1.01] transition-transform duration-300">
              <PortfolioChart portfolioSummary={portfolioSummary} />
            </div>
            <div className="transform hover:scale-[1.01] transition-transform duration-300">
              <PortfolioPerformanceChart 
                timeframe="month" 
                showInterestTrend={false} 
                portfolioSummary={portfolioSummary}
                loans={activeLoans}
                isLoading={portfolioLoading || loansLoading}
              />
            </div>
          </div>
          
          {/* Advanced Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="transform hover:scale-[1.01] transition-transform duration-300">
              <LTVTrendChart 
                timeframe="month" 
                showRiskBands={true} 
                portfolioSummary={portfolioSummary}
                loans={activeLoans}
                isLoading={portfolioLoading || loansLoading}
              />
            </div>
            <div className="transform hover:scale-[1.01] transition-transform duration-300">
              <PortfolioPerformanceChart 
                timeframe="quarter" 
                showInterestTrend={true} 
                portfolioSummary={portfolioSummary}
                loans={activeLoans}
                isLoading={portfolioLoading || loansLoading}
              />
            </div>
          </div>
          
          {/* Loan Distribution Analysis */}
          <div className="transform hover:scale-[1.01] transition-transform duration-300">
            <LoanDistributionChart 
              loans={activeLoans} 
              showTimeDistribution={false} 
              isLoading={loansLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
