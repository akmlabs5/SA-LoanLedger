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
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  BarChart3,
  Edit,
  CreditCard
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import { PortfolioSummary } from "@shared/types";
import backgroundImage from "@assets/loan_management_background_excel_green_1759302449019.png";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader, FloatingActionButton, ActionSheet } from "@/components/mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatFacilityType } from "@/lib/formatters";
import { PageContainer, PageHeader, Section } from "@/components/PageContainer";

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
  const isMobile = useIsMobile();
  
  // Mobile-specific state
  const [expandedBanks, setExpandedBanks] = useState<Set<string>>(new Set());
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [selectedBankForAction, setSelectedBankForAction] = useState<any>(null);

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
    toast({
      title: "Bank Login",
      description: "Bank integration coming soon. This will securely connect to your bank account.",
      variant: "default",
    });
  };

  const formatCurrency = (amount: number) => {
    return (amount / 1000000).toFixed(3).replace(/\.?0+$/, '') + ",000";
  };

  const toggleBankExpanded = (bankId: string) => {
    setExpandedBanks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bankId)) {
        newSet.delete(bankId);
      } else {
        newSet.add(bankId);
      }
      return newSet;
    });
  };

  const handleBankAction = (bank: any) => {
    setSelectedBankForAction(bank);
    setActionSheetOpen(true);
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

  // Get facilities for each bank
  const getBankFacilities = (bankId: string) => {
    return (facilities as any[])?.filter((f: any) => f.bankId === bankId) || [];
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <PageContainer className="pb-24">
        <MobileHeader 
          title="Bank Exposures" 
          backButton={false}
        />

        <Section>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-card border border-border">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Outstanding</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(totalExposure.outstanding)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">SAR Millions</p>
              </CardContent>
            </Card>

            <Card className="bg-card border border-border">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Available</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(totalExposure.available)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">SAR Millions</p>
              </CardContent>
            </Card>
          </div>

          {/* Bank Cards */}
          <div className="space-y-3">
            {bankExposures.map((exposure: any) => {
              const bankFacilities = getBankFacilities(exposure.bankId);
              const isExpanded = expandedBanks.has(exposure.bankId);
              const available = exposure.creditLimit - exposure.outstanding;

              return (
                <Card 
                  key={exposure.bankId} 
                  className="bg-card border border-border overflow-hidden"
                >
                  <div className="p-4 space-y-3">
                    {/* Bank Header - Tappable to view bank details */}
                    <div className="w-full flex items-start gap-3 rounded-lg p-2 -m-2 relative">
                      <button
                        onClick={() => setLocation(`/banks/${exposure.bankId}`)}
                        className="absolute inset-0 w-full h-full active:bg-accent/50 active:scale-[0.98] transition-all rounded-lg"
                        aria-label={`View ${exposure.bankName} details`}
                        data-testid={`button-bank-card-${exposure.bankId}`}
                      />
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 pointer-events-none">
                        <Building className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 text-left min-w-0 pointer-events-none">
                        <h3 className="font-semibold text-foreground truncate">{exposure.bankName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {bankFacilities.length} {bankFacilities.length === 1 ? 'Facility' : 'Facilities'}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBankAction(exposure);
                        }}
                        className="h-12 w-12 flex-shrink-0 rounded-lg flex items-center justify-center active:bg-accent transition-colors relative z-10"
                        aria-label={`${exposure.bankName} actions`}
                        data-testid={`button-bank-actions-${exposure.bankId}`}
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Outstanding</p>
                        <p className="text-sm font-bold text-foreground">
                          {formatCurrency(exposure.outstanding)}
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Available</p>
                        <p className="text-sm font-bold text-foreground">
                          {formatCurrency(available)}
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Utilization</p>
                        <Badge variant="outline" className={`${
                          exposure.utilization > 80 ? 'border-destructive text-destructive' :
                          exposure.utilization > 60 ? 'border-amber-500 text-amber-600 dark:text-amber-400' :
                          'border-primary text-primary'
                        } text-xs`}>
                          {exposure.utilization.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>

                    {/* Facilities Section */}
                    {bankFacilities.length > 0 && (
                      <Collapsible open={isExpanded} onOpenChange={() => toggleBankExpanded(exposure.bankId)}>
                        <CollapsibleTrigger 
                          className="flex items-center justify-between w-full h-12 px-3 rounded-lg bg-muted/30 active:bg-muted/50 transition-colors"
                          data-testid={`button-toggle-facilities-${exposure.bankId}`}
                        >
                          <span className="text-sm font-medium text-foreground">
                            Facilities ({bankFacilities.length})
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-2">
                          {bankFacilities.map((facility: any) => {
                            const facilityOutstanding = facility.outstanding || 0;
                            const facilityAvailable = facility.creditLimit - facilityOutstanding;
                            const facilityUtilization = facility.creditLimit > 0 
                              ? (facilityOutstanding / facility.creditLimit) * 100 
                              : 0;

                            return (
                              <button
                                key={facility.id}
                                onClick={() => setLocation(`/banks/${exposure.bankId}?facilityId=${facility.id}`)}
                                className="w-full bg-background border border-border rounded-lg p-3 active:bg-accent/50 active:scale-[0.98] transition-all text-left"
                                data-testid={`button-facility-${facility.id}`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium text-foreground">
                                      {formatFacilityType(facility.facilityType)}
                                    </span>
                                  </div>
                                  <Badge 
                                    variant={facility.isActive ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {facility.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-left">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Credit Limit</p>
                                    <p className="text-sm font-semibold text-foreground">
                                      {formatCurrency(facility.creditLimit)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Available</p>
                                    <p className="text-sm font-semibold text-foreground">
                                      {formatCurrency(facilityAvailable)}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-2 pt-2 border-t border-border">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                      Utilized: {facilityUtilization.toFixed(1)}%
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      Cost: {facility.costOfFunding}%
                                    </span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>

        {/* Floating Action Button for Add Facility */}
        <FloatingActionButton
          onClick={() => setLocation("/facility/create-general")}
          label="Add Facility"
        />

        {/* Action Sheet for Bank Actions */}
        <ActionSheet
          open={actionSheetOpen}
          onOpenChange={setActionSheetOpen}
          title={selectedBankForAction?.bankName}
          actions={[
            {
              id: "view-bank",
              label: "View Bank Details",
              icon: <Eye className="h-5 w-5" />,
              onClick: () => {
                if (selectedBankForAction) {
                  setLocation(`/banks/${selectedBankForAction.bankId}`);
                }
              },
            },
            {
              id: "add-facility",
              label: "Add Facility",
              icon: <Plus className="h-5 w-5" />,
              onClick: () => {
                if (selectedBankForAction) {
                  setLocation(`/facility/create-general?bankId=${selectedBankForAction.bankId}`);
                }
              },
            },
            {
              id: "view-analytics",
              label: "View Analytics",
              icon: <BarChart3 className="h-5 w-5" />,
              onClick: () => {
                if (selectedBankForAction) {
                  setLocation(`/bank-analytics/${selectedBankForAction.bankId}`);
                }
              },
            },
            {
              id: "edit-bank",
              label: "Edit Bank",
              icon: <Edit className="h-5 w-5" />,
              onClick: () => {
                if (selectedBankForAction) {
                  setLocation(`/banks/${selectedBankForAction.bankId}?edit=true`);
                }
              },
            },
          ]}
        />
      </PageContainer>
    );
  }

  // Desktop Layout
  return (
    <PageContainer>
      <PageHeader
        title="Bank Exposures"
        subtitle="Manage your banking relationships and credit facilities • All amounts in SAR Millions"
        icon={<Building className="h-6 w-6" />}
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {banks && Array.isArray(banks) && banks.length > 0 && (
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="text-sm text-muted-foreground hidden sm:inline">Quick Access:</span>
                <Select onValueChange={(bankId) => {
                  setLocation(`/banks/${bankId}`);
                }}>
                  <SelectTrigger 
                    className="h-12 w-full sm:w-48 bg-background border-border lg:hover:border-primary transition-colors focus:ring-2 focus:ring-primary focus:border-primary" 
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
              className="h-12 bg-gradient-to-r from-green-600 to-emerald-600 lg:hover:from-green-700 lg:hover:to-emerald-700 text-white shadow-lg w-full sm:w-auto"
              data-testid="button-add-facility"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Facility
            </Button>
          </div>
        }
      />

      <Section>

        {/* Enhanced Bank Exposure Tables */}
        <div className="grid grid-cols-1 gap-8">
          {/* Total Outstanding & Limits Table */}
          <Card className="bg-card border border-border shadow-sm lg:hover:shadow-md transition-shadow duration-200">
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
                      <tr key={exposure.bankId} className="lg:hover:bg-accent transition-colors">
                        <td className="py-4 px-4">
                          <Link href={`/banks/${exposure.bankId}`} className="font-medium text-foreground lg:hover:text-primary transition-colors cursor-pointer inline-flex items-center group" data-testid={`link-bank-${exposure.bankId}`}>
                            {exposure.bankName}
                            <ArrowRight className="h-4 w-4 ml-2 opacity-0 lg:group-hover:opacity-100 transition-opacity" />
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
          <Card className="bg-card border border-border shadow-sm lg:hover:shadow-md transition-shadow duration-200">
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
                        <tr key={exposure.bankId} className="lg:hover:bg-accent transition-colors">
                          <td className="py-4 px-4">
                            <Link href={`/banks/${exposure.bankId}`} className="font-medium text-foreground lg:hover:text-primary transition-colors cursor-pointer inline-flex items-center group" data-testid={`link-bank-available-${exposure.bankId}`}>
                              {exposure.bankName}
                              <ArrowRight className="h-4 w-4 ml-2 opacity-0 lg:group-hover:opacity-100 transition-opacity" />
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
          <Card className="bg-card border border-border shadow-sm lg:hover:shadow-md transition-shadow duration-200">
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

          <Card className="bg-card border border-border shadow-sm lg:hover:shadow-md transition-shadow duration-200">
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

          <Card className="bg-card border border-border shadow-sm lg:hover:shadow-md transition-shadow duration-200">
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
      </Section>
    </PageContainer>
  );
}
