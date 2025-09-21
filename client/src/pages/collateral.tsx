import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { University, Plus, ArrowLeft, Building, TrendingUp, Shield, Edit, Trash2 } from "lucide-react";
import { Link } from "wouter";
import CollateralForm from "@/components/CollateralForm";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function CollateralPage() {
  const { isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingCollateral, setEditingCollateral] = useState<any>(null);

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

  const { data: collateral, isLoading: collateralLoading, error: collateralError } = useQuery({
    queryKey: ["/api/collateral"],
    enabled: isAuthenticated,
  });

  const { data: portfolioSummary } = useQuery({
    queryKey: ["/api/dashboard/portfolio"],
    enabled: isAuthenticated,
  });

  const deleteCollateralMutation = useMutation({
    mutationFn: async (collateralId: string) => {
      return apiRequest('DELETE', `/api/collateral/${collateralId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collateral"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      toast({ title: "Collateral deleted successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to delete collateral", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (collateralError && isUnauthorizedError(collateralError as Error)) {
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
  }, [collateralError, toast]);

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

  const totalCollateralValue = collateral?.reduce((sum: number, col: any) => sum + parseFloat(col.currentValue), 0) || 0;
  const portfolioLtv = portfolioSummary?.portfolioLtv || 0;
  const coverageRatio = portfolioSummary?.totalOutstanding && totalCollateralValue > 0 
    ? (totalCollateralValue / portfolioSummary.totalOutstanding) * 100 
    : 0;

  const getCollateralIcon = (type: string) => {
    switch (type) {
      case 'real_estate':
        return <Building className="h-5 w-5" />;
      case 'liquid_stocks':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getCollateralTypeLabel = (type: string) => {
    switch (type) {
      case 'real_estate':
        return 'Real Estate';
      case 'liquid_stocks':
        return 'Liquid Stocks';
      default:
        return 'Other Assets';
    }
  };

  const handleEdit = (collateralItem: any) => {
    setEditingCollateral(collateralItem);
    setShowForm(true);
  };

  const handleDeleteCollateral = (collateralId: string) => {
    if (window.confirm("Are you sure you want to delete this collateral? This action cannot be undone.")) {
      deleteCollateralMutation.mutate(collateralId);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCollateral(null);
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
              <h1 className="text-xl font-bold text-foreground">Collateral Management</h1>
            </div>
            
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-add-collateral"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Collateral
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Portfolio Protection Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Collateral Value</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-total-collateral-value">
                    {(totalCollateralValue / 1000000).toFixed(1)}M SAR
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="text-blue-600 text-xl" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Asset protection</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Coverage Ratio</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-coverage-ratio">
                    {coverageRatio.toFixed(0)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-green-600 text-xl" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Portfolio protection</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio LTV</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-portfolio-ltv">
                    {portfolioLtv.toFixed(1)}%
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  portfolioLtv > 75 ? 'bg-red-100' : portfolioLtv > 60 ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  <Shield className={`text-xl ${
                    portfolioLtv > 75 ? 'text-red-600' : portfolioLtv > 60 ? 'text-yellow-600' : 'text-green-600'
                  }`} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Risk level</p>
            </CardContent>
          </Card>
        </div>

        {/* Collateral Assets */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Collateral Assets</CardTitle>
              <Badge variant="outline" data-testid="badge-collateral-count">
                {collateral?.length || 0} Assets
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {collateralLoading ? (
              <div className="text-center py-8">Loading collateral...</div>
            ) : collateral?.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No collateral assets found</p>
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="button-add-first-collateral"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Asset
                </Button>
              </div>
            ) : (
              <div className="grid gap-6">
                {collateral?.map((asset: any) => {
                  const valueInMillions = parseFloat(asset.currentValue) / 1000000;
                  const coveragePercentage = totalCollateralValue > 0 
                    ? (parseFloat(asset.currentValue) / totalCollateralValue) * 100 
                    : 0;
                  
                  return (
                    <Card key={asset.id} className="border-l-4 border-l-primary" data-testid={`card-collateral-${asset.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              asset.type === 'real_estate' ? 'bg-blue-100' :
                              asset.type === 'liquid_stocks' ? 'bg-green-100' :
                              'bg-gray-100'
                            }`}>
                              <div className={
                                asset.type === 'real_estate' ? 'text-blue-600' :
                                asset.type === 'liquid_stocks' ? 'text-green-600' :
                                'text-gray-600'
                              }>
                                {getCollateralIcon(asset.type)}
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg" data-testid={`text-collateral-name-${asset.id}`}>
                                {asset.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {getCollateralTypeLabel(asset.type)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold" data-testid={`text-collateral-value-${asset.id}`}>
                              {valueInMillions.toFixed(1)}M SAR
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {coveragePercentage.toFixed(1)}% of total
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Current Value</p>
                            <p className="font-medium">{parseFloat(asset.currentValue).toLocaleString()} SAR</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Valuation Date</p>
                            <p className="font-medium">{new Date(asset.valuationDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Valuation Source</p>
                            <p className="font-medium">{asset.valuationSource || 'Not specified'}</p>
                          </div>
                        </div>

                        {asset.description && (
                          <div className="mb-4">
                            <p className="text-sm text-muted-foreground">Description</p>
                            <p className="text-sm bg-muted/50 p-3 rounded-lg">{asset.description}</p>
                          </div>
                        )}

                        {asset.notes && (
                          <div className="mb-4">
                            <p className="text-sm text-muted-foreground">Notes</p>
                            <p className="text-sm">{asset.notes}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEdit(asset)}
                              data-testid={`button-edit-collateral-${asset.id}`}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteCollateral(asset.id)}
                              disabled={deleteCollateralMutation.isPending}
                              data-testid={`button-delete-collateral-${asset.id}`}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {deleteCollateralMutation.isPending ? "Deleting..." : "Delete"}
                            </Button>
                            <Button variant="outline" size="sm" data-testid={`button-collateral-documents-${asset.id}`}>
                              Documents
                            </Button>
                          </div>
                          <Badge 
                            variant={asset.isActive ? "default" : "secondary"}
                            data-testid={`badge-collateral-status-${asset.id}`}
                          >
                            {asset.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Collateral Form Modal */}
      {showForm && (
        <CollateralForm
          collateral={editingCollateral}
          onSuccess={() => {
            handleFormClose();
            queryClient.invalidateQueries({ queryKey: ["/api/collateral"] });
            queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
          }}
          onCancel={handleFormClose}
        />
      )}
    </div>
  );
}
