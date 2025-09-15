import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { University, Plus, ArrowLeft, Building, Calendar, CreditCard } from "lucide-react";
import { Link } from "wouter";
import BankForm from "@/components/BankForm";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Banks() {
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

  const getFacilityUtilization = (facilityId: string, creditLimit: string) => {
    if (!portfolioSummary?.bankExposures) return { outstanding: 0, utilization: 0 };
    
    // This is simplified - in a real app, you'd track utilization per facility
    const bankExposure = portfolioSummary.bankExposures.find(exp => 
      facilities?.find(f => f.id === facilityId && f.bankId === exp.bankId)
    );
    
    return {
      outstanding: bankExposure?.outstanding || 0,
      utilization: bankExposure ? (bankExposure.outstanding / parseFloat(creditLimit)) * 100 : 0,
    };
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
              <h1 className="text-xl font-bold text-foreground">Bank Management</h1>
            </div>
            
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-add-facility"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Bank Facility
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Bank Facilities */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="mr-2 h-5 w-5" />
              Your Bank Facilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {facilitiesLoading ? (
              <div className="text-center py-8">Loading facilities...</div>
            ) : facilities?.length === 0 ? (
              <div className="text-center py-12">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No bank facilities found</p>
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="button-add-first-facility"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Facility
                </Button>
              </div>
            ) : (
              <div className="grid gap-6">
                {facilities?.map((facility) => {
                  const bank = banks?.find(b => b.id === facility.bankId);
                  const utilization = getFacilityUtilization(facility.id, facility.creditLimit);
                  
                  return (
                    <Card key={facility.id} className="border-l-4 border-l-primary" data-testid={`card-facility-${facility.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                              <span className="text-primary font-bold text-lg">
                                {bank?.name.charAt(0) || 'B'}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg" data-testid={`text-facility-bank-${facility.id}`}>
                                {bank?.name || 'Unknown Bank'}
                              </h3>
                              <p className="text-sm text-muted-foreground capitalize">
                                {facility.facilityType.replace('_', ' ')} Facility
                              </p>
                            </div>
                          </div>
                          <Badge 
                            variant={facility.isActive ? "default" : "secondary"}
                            data-testid={`badge-facility-status-${facility.id}`}
                          >
                            {facility.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Credit Limit</p>
                            <p className="text-lg font-bold" data-testid={`text-facility-limit-${facility.id}`}>
                              {(parseFloat(facility.creditLimit) / 1000000).toFixed(1)}M SAR
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Outstanding</p>
                            <p className="text-lg font-bold text-red-600" data-testid={`text-facility-outstanding-${facility.id}`}>
                              {(utilization.outstanding / 1000000).toFixed(1)}M SAR
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Available</p>
                            <p className="text-lg font-bold text-green-600" data-testid={`text-facility-available-${facility.id}`}>
                              {((parseFloat(facility.creditLimit) - utilization.outstanding) / 1000000).toFixed(1)}M SAR
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Utilization</p>
                            <p className={`text-lg font-bold ${
                              utilization.utilization > 80 ? 'text-red-600' :
                              utilization.utilization > 60 ? 'text-yellow-600' :
                              'text-green-600'
                            }`} data-testid={`text-facility-utilization-${facility.id}`}>
                              {utilization.utilization.toFixed(0)}%
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Cost of Funding</p>
                            <p className="font-medium">SIBOR + {facility.costOfFunding}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Start Date</p>
                            <p className="font-medium">{new Date(facility.startDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Expiry Date</p>
                            <p className="font-medium">{new Date(facility.expiryDate).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {facility.terms && (
                          <div className="mb-4">
                            <p className="text-sm text-muted-foreground">Terms & Conditions</p>
                            <p className="text-sm bg-muted/50 p-3 rounded-lg">{facility.terms}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" data-testid={`button-edit-facility-${facility.id}`}>
                              Edit Facility
                            </Button>
                            <Button variant="outline" size="sm" data-testid={`button-facility-history-${facility.id}`}>
                              <Calendar className="mr-2 h-4 w-4" />
                              History
                            </Button>
                          </div>
                          <Button variant="outline" size="sm" data-testid={`button-facility-documents-${facility.id}`}>
                            Documents
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Saudi Banks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Available Saudi Banks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {banks?.map((bank) => (
                <Card key={bank.id} className="hover:shadow-md transition-shadow" data-testid={`card-bank-${bank.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                        <span className="text-primary font-bold">
                          {bank.code.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold" data-testid={`text-bank-name-${bank.id}`}>
                          {bank.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Code: {bank.code}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <Badge 
                        variant={facilities?.some(f => f.bankId === bank.id) ? "default" : "outline"}
                        className="text-xs"
                      >
                        {facilities?.some(f => f.bankId === bank.id) ? 'Active Facility' : 'Available'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Facility Form Modal */}
      {showForm && (
        <BankForm
          banks={banks || []}
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
