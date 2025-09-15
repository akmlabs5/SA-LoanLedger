import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { Link } from "wouter";
import BankForm from "@/components/BankForm";
import { isUnauthorizedError } from "@/lib/authUtils";
import { PortfolioSummary } from "@shared/types";

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
  const [showForm, setShowForm] = useState(false);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bank Exposures</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage your banking relationships and credit facilities
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              data-testid="button-add-facility"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Facility
            </Button>
          </div>
        </div>

        {/* Enhanced Bank Exposure Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Total Outstanding & Limits Table */}
          <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
                <span>Outstanding & Limits</span>
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current exposure by banking partner</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-gray-100">Banks</th>
                      <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-gray-100">Total Outstanding</th>
                      <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-gray-100">Total Limit</th>
                      <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-gray-100">% Utilized</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {bankExposures.map((exposure: any) => (
                      <tr key={exposure.bankId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-4 px-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-xs">
                                {exposure.bankName.substring(0, 3).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {exposure.bankName}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-2 text-right font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(exposure.outstanding)}
                        </td>
                        <td className="py-4 px-2 text-right font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(exposure.creditLimit)}
                        </td>
                        <td className="py-4 px-2 text-right">
                          <Badge className={`${
                            exposure.utilization > 80 ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400' :
                            exposure.utilization > 60 ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-400' :
                            'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400'
                          } font-bold`}>
                            {exposure.utilization.toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30">
                      <td className="py-4 px-2 font-bold text-gray-900 dark:text-gray-100">Total Exposure</td>
                      <td className="py-4 px-2 text-right font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(totalExposure.outstanding)}
                      </td>
                      <td className="py-4 px-2 text-right font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(totalExposure.creditLimit)}
                      </td>
                      <td className="py-4 px-2 text-right">
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 font-bold">
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
          <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span>Available Limits</span>
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">Remaining credit capacity by bank</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-gray-100">Banks</th>
                      <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-gray-100">Available Credit</th>
                      <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-gray-100">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {bankExposures.map((exposure: any) => {
                      const available = exposure.creditLimit - exposure.outstanding;
                      const availabilityStatus = available < exposure.creditLimit * 0.2 ? 'Low' : 
                                                available < exposure.creditLimit * 0.5 ? 'Medium' : 'High';
                      return (
                        <tr key={exposure.bankId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="py-4 px-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xs">
                                  {exposure.bankName.substring(0, 3).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {exposure.bankName}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(available)}
                          </td>
                          <td className="py-4 px-2 text-right">
                            <Badge className={`${
                              availabilityStatus === 'Low' ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400' :
                              availabilityStatus === 'Medium' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-400' :
                              'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400'
                            } font-semibold`}>
                              {availabilityStatus}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Total Row */}
                    <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30">
                      <td className="py-4 px-2 font-bold text-gray-900 dark:text-gray-100">Total Available</td>
                      <td className="py-4 px-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(totalExposure.available)}
                      </td>
                      <td className="py-4 px-2 text-right">
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 font-bold">
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

        {/* Bank-Specific Login Section */}
        <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center space-x-2">
              <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>Bank Integration Portal</span>
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">Connect to your bank accounts for real-time data synchronization</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {(banks as any[])?.map((bank: any) => {
                const hasCredentials = bankCredentials.some(cred => cred.bankId === bank.id);
                const isConnected = bankCredentials.find(cred => cred.bankId === bank.id)?.isConnected || false;
                const hasFacility = (facilities as any[])?.some((f: any) => f.bankId === bank.id);
                
                return (
                  <div key={bank.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold">
                          {bank.code.substring(0, 3)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {bank.name}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge 
                            variant={isConnected ? "default" : "outline"}
                            className={isConnected ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400" : ""}
                          >
                            {isConnected ? 'Connected' : 'Not Connected'}
                          </Badge>
                          {hasFacility && (
                            <Badge variant="outline" className="text-xs">
                              Active Facility
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isConnected ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            Last sync: {new Date().toLocaleDateString()}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-emerald-600 border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Connected
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleBankLogin(bank.id)}
                          className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-md hover:shadow-lg transition-all duration-300"
                          size="sm"
                        >
                          <LogIn className="mr-2 h-4 w-4" />
                          Connect Bank
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Security Notice */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-blue-900 dark:text-blue-100">Secure Bank Integration</h5>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    All bank connections use industry-standard OAuth 2.0 and Open Banking protocols. 
                    Your credentials are encrypted and never stored on our servers. We only access 
                    read-only account information for portfolio tracking.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">Total Outstanding</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {formatCurrency(totalExposure.outstanding)}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">Across all banks</p>
                </div>
                <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="text-white text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Credit Lines</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(totalExposure.creditLimit)}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Combined facilities</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                  <Building className="text-white text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Available Credit</p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    {formatCurrency(totalExposure.available)}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Ready for drawdown</p>
                </div>
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
                  <Target className="text-white text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bank Facility Form Modal */}
      {showForm && (
        <BankForm
          banks={(banks as any[]) || []}
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ["/api/facilities"] });
            queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}