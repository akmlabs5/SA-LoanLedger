import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  FileText, 
  TrendingUp, 
  Shield,
  Edit,
  XCircle,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface GuaranteeWithDetails {
  id: string;
  facilityId: string;
  guaranteeType: string;
  guaranteeNumber: string;
  guaranteeAmount: string;
  currency: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  beneficiary: string;
  purpose: string | null;
  commissionRate: string | null;
  issuanceFees: string | null;
  securityType: string | null;
  remarks: string | null;
  organizationId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  facility: {
    id: string;
    facilityType: string;
    creditLimit: string;
    bank: {
      id: string;
      name: string;
      swiftCode: string;
    };
  };
}

export default function GuaranteeDetailPage() {
  const [, params] = useRoute("/guarantees/:id");
  const guaranteeId = params?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: guarantee, isLoading, isError } = useQuery<GuaranteeWithDetails>({
    queryKey: ["/api/guarantees", guaranteeId],
    enabled: !!guaranteeId,
  });

  const cancelGuaranteeMutation = useMutation({
    mutationFn: async (guaranteeId: string) => {
      await apiRequest("PUT", `/api/guarantees/${guaranteeId}`, { status: "cancelled" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guarantees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/guarantees", guaranteeId] });
      toast({
        title: "Success",
        description: "Guarantee cancelled successfully",
      });
      setLocation("/guarantees");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel guarantee",
        variant: "destructive",
      });
    },
  });

  const handleCancelGuarantee = () => {
    if (confirm("Are you sure you want to cancel this guarantee? This action cannot be undone.")) {
      cancelGuaranteeMutation.mutate(guaranteeId!);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading guarantee details...</p>
        </div>
      </div>
    );
  }

  if (isError || !guarantee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Guarantee Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The guarantee you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => setLocation("/guarantees")} data-testid="button-back-guarantees">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Guarantees
          </Button>
        </div>
      </div>
    );
  }

  const isActive = guarantee.status === "active";
  const isExpired = new Date(guarantee.expiryDate) < new Date();
  const daysToExpiry = Math.ceil((new Date(guarantee.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const statusConfig = {
    active: { color: "bg-emerald-500", label: "Active" },
    expired: { color: "bg-red-500", label: "Expired" },
    cancelled: { color: "bg-gray-500", label: "Cancelled" },
    released: { color: "bg-blue-500", label: "Released" },
  };

  const status = isExpired && isActive ? "expired" : guarantee.status;
  const statusInfo = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation("/guarantees")}
                data-testid="button-back-guarantees"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Guarantees
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground" data-testid="text-guarantee-title">Guarantee Details</h1>
                <p className="text-sm text-muted-foreground" data-testid="text-guarantee-number">Number: {guarantee.guaranteeNumber}</p>
              </div>
            </div>
            
            <div className="ml-auto flex items-center space-x-3">
              <Badge className={`${statusInfo.color} text-white`} data-testid="badge-status">
                {statusInfo.label}
              </Badge>
              {isActive && !isExpired && (
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocation(`/guarantees/${guarantee.id}/edit`)}
                    data-testid="button-edit-guarantee"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleCancelGuarantee}
                    disabled={cancelGuaranteeMutation.isPending}
                    className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    data-testid="button-cancel-guarantee"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {cancelGuaranteeMutation.isPending ? 'Cancelling...' : 'Cancel'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Guarantee Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                    <TabsTrigger value="financial" data-testid="tab-financial">Financial Details</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Bank</label>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-emerald-600" />
                          <p className="font-medium" data-testid="text-bank">{guarantee.facility.bank.name}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Facility Type</label>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-emerald-600" />
                          <p className="font-medium" data-testid="text-facility-type">{guarantee.facility.facilityType}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Guarantee Type</label>
                        <p className="font-medium" data-testid="text-guarantee-type">{guarantee.guaranteeType}</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Guarantee Amount</label>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                          <p className="font-medium text-emerald-600 text-lg" data-testid="text-amount">
                            {formatCurrency(parseFloat(guarantee.guaranteeAmount))} {guarantee.currency}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Issue Date</label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-emerald-600" />
                          <p className="font-medium" data-testid="text-issue-date">{formatDate(guarantee.issueDate)}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Expiry Date</label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-emerald-600" />
                          <p className="font-medium" data-testid="text-expiry-date">{formatDate(guarantee.expiryDate)}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Beneficiary</label>
                        <p className="font-medium" data-testid="text-beneficiary">{guarantee.beneficiary}</p>
                      </div>

                      {guarantee.securityType && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Security Type</label>
                          <p className="font-medium" data-testid="text-security-type">{guarantee.securityType}</p>
                        </div>
                      )}
                    </div>

                    {guarantee.purpose && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Purpose</label>
                        <p className="text-sm bg-muted/50 p-4 rounded-lg" data-testid="text-purpose">{guarantee.purpose}</p>
                      </div>
                    )}

                    {guarantee.remarks && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Remarks</label>
                        <p className="text-sm bg-muted/50 p-4 rounded-lg" data-testid="text-remarks">{guarantee.remarks}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="financial" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Guarantee Amount</label>
                        <p className="text-2xl font-bold text-emerald-600" data-testid="text-financial-amount">
                          {formatCurrency(parseFloat(guarantee.guaranteeAmount))}
                        </p>
                      </div>

                      {guarantee.commissionRate && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Commission Rate</label>
                          <p className="text-2xl font-bold" data-testid="text-commission-rate">{guarantee.commissionRate}%</p>
                        </div>
                      )}

                      {guarantee.issuanceFees && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Issuance Fees</label>
                          <p className="text-2xl font-bold" data-testid="text-issuance-fees">
                            {formatCurrency(parseFloat(guarantee.issuanceFees))}
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Currency</label>
                        <p className="text-2xl font-bold" data-testid="text-currency">{guarantee.currency}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Associated Facility Credit Limit</label>
                      <p className="text-xl font-semibold text-gray-700 dark:text-gray-300" data-testid="text-facility-limit">
                        {formatCurrency(parseFloat(guarantee.facility.creditLimit))}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Badge className={`${statusInfo.color} text-white text-lg px-4 py-1`}>
                    {statusInfo.label}
                  </Badge>
                </div>

                {isActive && !isExpired && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Days to Expiry</span>
                      <span className="font-bold text-lg" data-testid="text-days-to-expiry">
                        {daysToExpiry > 0 ? daysToExpiry : 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${daysToExpiry > 30 ? 'bg-emerald-500' : daysToExpiry > 7 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min((daysToExpiry / 365) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {isExpired && isActive && (
                  <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Guarantee Expired</span>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                      This guarantee expired on {formatDate(guarantee.expiryDate)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            {isActive && !isExpired && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => setLocation(`/guarantees/${guarantee.id}/edit`)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    data-testid="button-quick-edit"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Guarantee
                  </Button>
                  <Button 
                    onClick={handleCancelGuarantee}
                    disabled={cancelGuaranteeMutation.isPending}
                    variant="outline"
                    className="w-full text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    data-testid="button-quick-cancel"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {cancelGuaranteeMutation.isPending ? 'Cancelling...' : 'Cancel Guarantee'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Facility Info */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Associated Facility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Bank</p>
                  <p className="font-medium" data-testid="text-sidebar-bank">{guarantee.facility.bank.name}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Facility Type</p>
                  <p className="font-medium" data-testid="text-sidebar-facility">{guarantee.facility.facilityType}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Credit Limit</p>
                  <p className="font-medium text-emerald-600" data-testid="text-sidebar-limit">
                    {formatCurrency(parseFloat(guarantee.facility.creditLimit))}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => setLocation(`/banks/${guarantee.facility.bank.id}`)}
                  data-testid="button-view-facility"
                >
                  View Facility Details
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
