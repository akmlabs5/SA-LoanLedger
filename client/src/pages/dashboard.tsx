import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  University, 
  Bell, 
  Settings, 
  User, 
  TrendingUp, 
  Wallet, 
  Shield, 
  FileText,
  Plus,
  Building,
  Home,
  Download
} from "lucide-react";
import { Link } from "wouter";
import AIInsightsPanel from "@/components/AIInsightsPanel";
import PortfolioChart from "@/components/charts/PortfolioChart";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

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

  const { data: portfolioSummary, isLoading: portfolioLoading, error: portfolioError } = useQuery({
    queryKey: ["/api/dashboard/portfolio"],
    enabled: isAuthenticated,
  });

  const { data: activeLoans, isLoading: loansLoading } = useQuery({
    queryKey: ["/api/loans"],
    enabled: isAuthenticated,
  });

  const { data: siborRate } = useQuery({
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
      {/* Navigation Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-saudi text-white rounded-lg flex items-center justify-center">
                <University className="text-sm" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Saudi Loan Manager</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = "/api/logout"}
                data-testid="button-logout"
              >
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* AI Insights Panel */}
        <AIInsightsPanel />

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Outstanding</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-total-outstanding">
                    {portfolioSummary ? `${(portfolioSummary.totalOutstanding / 1000000).toFixed(1)}M SAR` : 'Loading...'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-primary text-xl" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Portfolio balance</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Credit</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-available-credit">
                    {portfolioSummary ? `${(portfolioSummary.availableCredit / 1000000).toFixed(1)}M SAR` : 'Loading...'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Wallet className="text-green-600 text-xl" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {portfolioSummary ? `${((portfolioSummary.totalOutstanding / portfolioSummary.totalCreditLimit) * 100).toFixed(0)}% utilization` : 'Loading...'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio LTV</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-portfolio-ltv">
                    {portfolioSummary ? `${portfolioSummary.portfolioLtv.toFixed(1)}%` : 'Loading...'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Shield className="text-yellow-600 text-xl" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Collateral coverage</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Loans</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-active-loans">
                    {portfolioSummary?.activeLoansCount || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="text-blue-600 text-xl" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {sortedLoans.filter(loan => {
                  const urgency = getLoanUrgency(loan.dueDate);
                  return urgency.priority === 'critical';
                }).length} due this week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Loans Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Priority Loans Due */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Loans Due by Priority</CardTitle>
                  <Link href="/loans">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-add-loan">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Loan
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {loansLoading ? (
                  <div className="text-center py-8">Loading loans...</div>
                ) : sortedLoans.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No active loans found. <Link href="/loans" className="text-primary hover:underline">Add your first loan</Link>
                  </div>
                ) : (
                  sortedLoans.slice(0, 5).map((loan) => {
                    const urgency = getLoanUrgency(loan.dueDate);
                    const borderColor = urgency.color === 'red' ? 'border-red-500 bg-red-50' : 
                                       urgency.color === 'yellow' ? 'border-yellow-500 bg-yellow-50' : 
                                       'border-green-500 bg-green-50';
                    
                    return (
                      <div key={loan.id} className={`border-l-4 p-4 rounded-r-lg ${borderColor}`} data-testid={`card-loan-${loan.id}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                              urgency.color === 'red' ? 'bg-red-500' : 
                              urgency.color === 'yellow' ? 'bg-yellow-500' : 
                              'bg-green-500'
                            }`}>
                              {urgency.label}
                            </span>
                            <span className="font-semibold text-foreground" data-testid={`text-loan-reference-${loan.id}`}>
                              {loan.facility.bank.name} - {loan.referenceNumber}
                            </span>
                          </div>
                          <span className="text-lg font-bold text-foreground" data-testid={`text-loan-amount-${loan.id}`}>
                            {(parseFloat(loan.amount) / 1000000).toFixed(1)}M SAR
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Due Date:</span>
                            <span className="ml-2 font-medium">{new Date(loan.dueDate).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Interest:</span>
                            <span className="ml-2 font-medium">SIBOR + {loan.bankRate}%</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-3">
                          <Button size="sm" variant={urgency.priority === 'critical' ? 'destructive' : 'secondary'}>
                            {urgency.priority === 'critical' ? 'Urgent Action' : 'View Details'}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Actions Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/loans">
                <Button className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-quick-add-loan">
                  <Plus className="mr-3 h-4 w-4" />
                  Add New Loan
                </Button>
              </Link>
              
              <Link href="/banks">
                <Button variant="secondary" className="w-full justify-start" data-testid="button-quick-manage-banks">
                  <Building className="mr-3 h-4 w-4" />
                  Manage Banks
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
                Export Reports
              </Button>
              
              <Separator />
              
              {/* Current SIBOR Rate */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-800 font-medium">Current SIBOR</span>
                  <span className="text-lg font-bold text-blue-900" data-testid="text-sibor-rate">
                    {siborRate ? `${siborRate.rate}%` : '5.75%'}
                  </span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  {siborRate ? `${siborRate.monthlyChange > 0 ? '+' : ''}${siborRate.monthlyChange}% this month` : '+0.25% this month'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bank Summary Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bank Summary Overview</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-muted-foreground">Bank Name</th>
                    <th className="text-right p-4 font-semibold text-muted-foreground">Outstanding</th>
                    <th className="text-right p-4 font-semibold text-muted-foreground">Credit Limit</th>
                    <th className="text-right p-4 font-semibold text-muted-foreground">Available</th>
                    <th className="text-right p-4 font-semibold text-muted-foreground">Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {portfolioSummary?.bankExposures?.map((exposure, index) => (
                    <tr key={exposure.bankId} className="hover:bg-muted/30 transition-colors" data-testid={`row-bank-${exposure.bankId}`}>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                            <span className="text-primary font-bold text-sm">
                              {exposure.bankName.charAt(0)}
                            </span>
                          </div>
                          <span className="font-semibold text-foreground" data-testid={`text-bank-name-${exposure.bankId}`}>
                            {exposure.bankName}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right font-semibold text-foreground" data-testid={`text-bank-outstanding-${exposure.bankId}`}>
                        {(exposure.outstanding / 1000000).toFixed(1)}M SAR
                      </td>
                      <td className="p-4 text-right text-muted-foreground" data-testid={`text-bank-limit-${exposure.bankId}`}>
                        {(exposure.creditLimit / 1000000).toFixed(1)}M SAR
                      </td>
                      <td className="p-4 text-right text-green-600 font-medium" data-testid={`text-bank-available-${exposure.bankId}`}>
                        {((exposure.creditLimit - exposure.outstanding) / 1000000).toFixed(1)}M SAR
                      </td>
                      <td className="p-4 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          exposure.utilization > 80 ? 'bg-red-100 text-red-800' :
                          exposure.utilization > 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`} data-testid={`text-bank-utilization-${exposure.bankId}`}>
                          {exposure.utilization.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        No bank exposures found. <Link href="/banks" className="text-primary hover:underline">Set up your first facility</Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Total Exposure Summary */}
            {portfolioSummary && (
              <div className="mt-6 pt-6 border-t border-border bg-muted/20 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Outstanding</p>
                    <p className="text-lg font-bold text-foreground" data-testid="text-total-outstanding-summary">
                      {(portfolioSummary.totalOutstanding / 1000000).toFixed(1)}M SAR
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Credit Limits</p>
                    <p className="text-lg font-bold text-foreground" data-testid="text-total-limits-summary">
                      {(portfolioSummary.totalCreditLimit / 1000000).toFixed(1)}M SAR
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Portfolio LTV</p>
                    <p className="text-lg font-bold text-foreground" data-testid="text-overall-ltv-summary">
                      {portfolioSummary.portfolioLtv.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Loans Count</p>
                    <p className="text-lg font-bold text-foreground" data-testid="text-active-loans-summary">
                      {portfolioSummary.activeLoansCount}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts and Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <PortfolioChart portfolioSummary={portfolioSummary} />
          
          {/* LTV Trend Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>LTV Ratio Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">6-Month LTV Trend</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Current: {portfolioSummary ? `${portfolioSummary.portfolioLtv.toFixed(1)}%` : '68.4%'} | Trend: ↗ +2.1%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
