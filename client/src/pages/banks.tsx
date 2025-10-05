import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building, 
  Plus, 
  LogIn, 
  Eye, 
  EyeOff,
  Shield,
  ArrowRight,
  TrendingUp,
  Target,
  AlertTriangle
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import { PortfolioSummary } from "@shared/types";
import backgroundImage from "@assets/loan_management_background_excel_green_1759302449019.png";

interface BankLoginCredentials {
  bankId: string;
  username: string;
  isConnected: boolean;
  lastLogin?: Date;
}

export default function Banks() {
  const { isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [bankCredentials, setBankCredentials] = useState<BankLoginCredentials[]>([]);
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});

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

  const { data: facilities, isLoading: facilitiesLoading, error: facilitiesError } = useQuery({
    queryKey: ["/api/facilities"],
    enabled: isAuthenticated,
  });

  const { data: banks, isLoading: banksLoading } = useQuery({
    queryKey: ["/api/banks"],
    enabled: isAuthenticated,
  });

  const { data: portfolioSummary } = useQuery({
    queryKey: ["/api/dashboard/portfolio"],
    enabled: isAuthenticated,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (facilitiesError && isUnauthorizedError(facilitiesError as Error)) {
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
  }, [facilitiesError, toast]);

  const handleBankLogin = (bankId: string) => {
    // This would integrate with bank APIs securely
    toast({
      title: "Bank Login",
      description: "Bank integration coming soon. This will securely connect to your bank account.",
      variant: "default",
    });
  };

  const formatCurrency = (amount: number) => {
    return (amount / 1000000).toFixed(3).replace(/\.?0+$/, '') + ",000";
  };

  if (isLoading || banksLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Calculate bank exposure data for tables
  const bankExposures = (portfolioSummary as PortfolioSummary)?.bankExposures || [];
  const totalExposure = {
    outstanding: bankExposures.reduce((sum: number, bank: any) => sum + bank.outstanding, 0),
    creditLimit: bankExposures.reduce((sum: number, bank: any) => sum + bank.creditLimit, 0),
    available: bankExposures.reduce((sum: number, bank: any) => sum + (bank.creditLimit - bank.outstanding), 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bank Exposures</h1>
            <p className="text-muted-foreground mt-1">
              Manage your banking relationships and credit facilities • <span className="font-semibold text-primary">All amounts in SAR Millions</span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 sm:mt-0">
            {/* Quick Bank Access */}
            {banks && Array.isArray(banks) && banks.length > 0 && (
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="text-sm text-muted-foreground hidden sm:inline">Quick Access:</span>
                <Select onValueChange={(bankId) => {
                  setLocation(`/banks/${bankId}`);
                }}>
                  <SelectTrigger 
                    className="h-12 w-full sm:w-48 bg-background border-border hover:border-primary transition-colors focus:ring-2 focus:ring-primary focus:border-primary" 
                    data-testid="select-bank-quick-access"
                    aria-label="Quick access to bank details"
                  >
                    <SelectValue placeholder="Select bank..." />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((bank: any) => (
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
            <Button 
              onClick={() => setLocation("/facility/create-general")}
              className="h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg w-full sm:w-auto"
              data-testid="button-add-facility"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Facility
            </Button>
          </div>
        </div>

        {/* Enhanced Bank Exposure Tables */}
        <div className="grid grid-cols-1 gap-8">
          {/* Total Outstanding & Limits Table */}
          <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>Outstanding & Limits</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">Current exposure by banking partner (SAR Millions)</p>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-4 font-semibold text-foreground">Banks</th>
                      <th className="text-right py-4 px-4 font-semibold text-foreground">Total Outstanding</th>
                      <th className="text-right py-4 px-4 font-semibold text-foreground">Total Limit</th>
                      <th className="text-right py-4 px-4 font-semibold text-foreground">% Utilized</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bankExposures.map((exposure: any) => (
                      <tr key={exposure.bankId} className="hover:bg-accent transition-colors">
                        <td className="py-4 px-4">
                          <Link href={`/banks/${exposure.bankId}`} className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer inline-flex items-center group" data-testid={`link-bank-${exposure.bankId}`}>
                            {exposure.bankName}
                            <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-foreground">
                          {formatCurrency(exposure.outstanding)}
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-foreground">
                          {formatCurrency(exposure.creditLimit)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Badge variant="outline" className={`${
                            exposure.utilization > 80 ? 'border-destructive text-destructive' :
                            exposure.utilization > 60 ? 'border-amber-500 text-amber-600 dark:text-amber-400' :
                            'border-primary text-primary'
                          }`}>
                            {exposure.utilization.toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="border-t border-border bg-secondary/50">
                      <td className="py-4 px-4 font-bold text-foreground">Total Exposure</td>
                      <td className="py-4 px-4 text-right font-bold text-foreground">
                        {formatCurrency(totalExposure.outstanding)}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-foreground">
                        {formatCurrency(totalExposure.creditLimit)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Badge variant="secondary">
                          {totalExposure.creditLimit > 0 ? ((totalExposure.outstanding / totalExposure.creditLimit) * 100).toFixed(1) : '0.0'}%
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Total Available Limits Table */}
          <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                <Target className="h-5 w-5 text-primary" />
                <span>Available Limits</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">Remaining credit capacity by bank (SAR Millions)</p>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-4 font-semibold text-foreground">Banks</th>
                      <th className="text-right py-4 px-4 font-semibold text-foreground">Available Credit</th>
                      <th className="text-right py-4 px-4 font-semibold text-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bankExposures.map((exposure: any) => {
                      const available = exposure.creditLimit - exposure.outstanding;
                      const availabilityStatus = available < exposure.creditLimit * 0.2 ? 'Low' : 
                                                available < exposure.creditLimit * 0.5 ? 'Medium' : 'High';
                      return (
                        <tr key={exposure.bankId} className="hover:bg-accent transition-colors">
                          <td className="py-4 px-4">
                            <Link href={`/banks/${exposure.bankId}`} className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer inline-flex items-center group" data-testid={`link-bank-available-${exposure.bankId}`}>
                              {exposure.bankName}
                              <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          </td>
                          <td className="py-4 px-4 text-right font-semibold text-foreground">
                            {formatCurrency(available)}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Badge variant="outline" className={`${
                              availabilityStatus === 'Low' ? 'border-destructive text-destructive' :
                              availabilityStatus === 'Medium' ? 'border-amber-500 text-amber-600 dark:text-amber-400' :
                              'border-primary text-primary'
                            }`}>
                              {availabilityStatus}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Total Row */}
                    <tr className="border-t border-border bg-secondary/50">
                      <td className="py-4 px-4 font-bold text-foreground">Total Available</td>
                      <td className="py-4 px-4 text-right font-bold text-foreground">
                        {formatCurrency(totalExposure.available)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Badge variant="secondary">
                          Available
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Outstanding</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(totalExposure.outstanding)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Across all banks (SAR Millions)</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Credit Lines</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(totalExposure.creditLimit)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Combined facilities (SAR Millions)</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available Credit</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(totalExposure.available)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Ready for drawdown (SAR Millions)</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}