import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertFacilitySchema } from "@shared/schema";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building, 
  ArrowLeft, 
  LogIn, 
  Shield, 
  TrendingUp, 
  Calendar,
  CreditCard,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  FileText,
  Settings,
  Phone,
  Mail,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Star,
  User,
  Gem
} from "lucide-react";
import { Link } from "wouter";
import { PortfolioSummary } from "@shared/types";
import BankContactsSection from "@/components/BankContactsSection";
import CollateralForm from "@/components/CollateralForm";
import LoanForm from "@/components/LoanForm";

export default function BankDetail() {
  const { bankId } = useParams();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: banks, isLoading: banksLoading } = useQuery({
    queryKey: ["/api/banks"],
    enabled: isAuthenticated,
  });

  const { data: facilities, isLoading: facilitiesLoading } = useQuery({
    queryKey: ["/api/facilities"],
    enabled: isAuthenticated,
  });

  const { data: portfolioSummary, isLoading: portfolioLoading } = useQuery({
    queryKey: ["/api/dashboard/portfolio"],
    enabled: isAuthenticated,
  });

  const { data: loans, isLoading: loansLoading } = useQuery({
    queryKey: ["/api/loans"],
    enabled: isAuthenticated,
  });

  const { data: bankContacts, isLoading: contactsLoading } = useQuery({
    queryKey: ["/api/banks", bankId, "contacts"],
    enabled: isAuthenticated && !!bankId,
  });

  // Fetch collateral and assignments for this bank
  const { data: collateral } = useQuery({
    queryKey: ["/api/collateral"],
    enabled: isAuthenticated,
  });

  const { data: collateralAssignments } = useQuery({
    queryKey: ["/api/collateral-assignments"],
    enabled: isAuthenticated,
  });

  // Fetch credit lines for proper loan-to-bank mapping
  const { data: creditLines } = useQuery({
    queryKey: ["/api/credit-lines"],
    enabled: isAuthenticated,
  });

  // Find the specific bank
  const bank = (banks as any[])?.find((b: any) => b.id === bankId);
  const bankFacilities = (facilities as any[])?.filter((f: any) => f.bankId === bankId) || [];
  const bankExposure = (portfolioSummary as PortfolioSummary)?.bankExposures?.find(exp => exp.bankId === bankId);
  
  // Get credit lines for this bank's facilities
  const bankCreditLineIds = (creditLines as any[])?.filter((cl: any) => {
    const facility = bankFacilities.find(f => f.id === cl.facilityId);
    return !!facility;
  }).map(cl => cl.id) || [];
  
  // Get loans that belong to this bank via credit lines OR facilities
  const bankFacilityIds = bankFacilities.map(f => f.id);
  const bankLoans = (loans as any[])?.filter((l: any) => 
    // Include loans linked to bank's credit lines
    (l.creditLineId && bankCreditLineIds.includes(l.creditLineId)) ||
    // Include loans linked directly to bank's facilities (when creditLineId is null)
    (!l.creditLineId && l.facilityId && bankFacilityIds.includes(l.facilityId))
  ) || [];
  
  // Calculate fallback metrics when portfolio summary doesn't have bank data
  const fallbackCreditLimit = bankFacilities.reduce((sum, f) => sum + Number(f.creditLimit || 0), 0);
  const fallbackOutstanding = bankLoans
    .filter(loan => loan.status === 'active')
    .reduce((sum, loan) => sum + Number(loan.amount || 0), 0);
  const fallbackUtilization = fallbackCreditLimit > 0 ? (fallbackOutstanding / fallbackCreditLimit) * 100 : 0;
  const fallbackActiveLoans = bankLoans.filter(loan => loan.status === 'active').length;
  
  // Use portfolio summary data if available, otherwise use fallback calculations
  const displayMetrics = {
    creditLimit: bankExposure?.creditLimit || fallbackCreditLimit,
    outstanding: bankExposure?.outstanding || fallbackOutstanding,
    utilization: bankExposure?.utilization || fallbackUtilization,
    activeLoansCount: fallbackActiveLoans,
  };
  
  // Filter collateral assignments for this bank's facilities
  const bankCollateralAssignments = (collateralAssignments as any[])?.filter((assignment: any) => {
    const facility = bankFacilities.find(f => f.id === assignment.facilityId);
    return !!facility;
  }) || [];
  
  // Get collateral details for assignments
  const bankCollateral = bankCollateralAssignments.map((assignment: any) => {
    const asset = (collateral as any[])?.find((c: any) => c.id === assignment.collateralId);
    const facility = bankFacilities.find(f => f.id === assignment.facilityId);
    return asset ? { ...asset, assignment, facility } : null;
  }).filter(Boolean);

  // Dialog states for forms
  const [isFacilityDialogOpen, setIsFacilityDialogOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<any>(null);
  const [isCollateralDialogOpen, setIsCollateralDialogOpen] = useState(false);
  const [isLoanDialogOpen, setIsLoanDialogOpen] = useState(false);
  
  const facilityFormSchema = insertFacilitySchema.omit({ userId: true, bankId: true }).extend({
    creditLimit: z.string().min(1, "Credit limit is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Credit limit must be greater than 0"),
    costOfFunding: z.string().min(1, "Cost of funding is required").refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 20, "Cost of funding must be between 0 and 20"),
    startDate: z.string().min(1, "Start date is required"),
    expiryDate: z.string().min(1, "Expiry date is required"),
  }).refine((data) => new Date(data.expiryDate) >= new Date(data.startDate), {
    message: "Expiry date must be after start date",
    path: ["expiryDate"],
  });

  const facilityForm = useForm<z.infer<typeof facilityFormSchema>>({
    resolver: zodResolver(facilityFormSchema),
    defaultValues: {
      facilityType: "revolving",
      creditLimit: "",
      costOfFunding: "",
      startDate: "",
      expiryDate: "",
      terms: "",
      isActive: true,
    },
  });

  const createFacilityMutation = useMutation({
    mutationFn: async (data: z.infer<typeof facilityFormSchema>) => {
      return apiRequest('POST', '/api/facilities', {
        ...data,
        bankId,
        creditLimit: data.creditLimit,
        costOfFunding: data.costOfFunding,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facilities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      setIsFacilityDialogOpen(false);
      facilityForm.reset();
      toast({ title: "Facility created successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create facility", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteFacilityMutation = useMutation({
    mutationFn: async (facilityId: string) => {
      return apiRequest('DELETE', `/api/facilities/${facilityId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facilities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      toast({ title: "Facility deleted successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to delete facility", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateFacilityMutation = useMutation({
    mutationFn: async ({ facilityId, data }: { facilityId: string; data: z.infer<typeof facilityFormSchema> }) => {
      return apiRequest('PUT', `/api/facilities/${facilityId}`, {
        ...data,
        creditLimit: data.creditLimit,
        costOfFunding: data.costOfFunding,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facilities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      setIsFacilityDialogOpen(false);
      setEditingFacility(null);
      facilityForm.reset();
      toast({ title: "Facility updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update facility", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleSubmitFacility = (data: z.infer<typeof facilityFormSchema>) => {
    if (editingFacility) {
      updateFacilityMutation.mutate({ facilityId: editingFacility.id, data });
    } else {
      createFacilityMutation.mutate(data);
    }
  };

  const handleEditFacility = (facility: any) => {
    setEditingFacility(facility);
    facilityForm.reset({
      facilityType: facility.facilityType,
      creditLimit: facility.creditLimit,
      costOfFunding: facility.costOfFunding,
      startDate: facility.startDate,
      expiryDate: facility.expiryDate,
      terms: facility.terms || "",
      isActive: facility.isActive,
    });
    setIsFacilityDialogOpen(true);
  };

  const handleDeleteFacility = (facilityId: string) => {
    if (window.confirm("Are you sure you want to delete this facility? This action cannot be undone.")) {
      deleteFacilityMutation.mutate(facilityId);
    }
  };

  const handleCloseFacilityDialog = () => {
    setIsFacilityDialogOpen(false);
    setEditingFacility(null);
    facilityForm.reset();
  };

  // Show loading state while data is being fetched
  if (banksLoading || facilitiesLoading || portfolioLoading || loansLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loading Bank Details</h2>
          <p className="text-gray-600 dark:text-gray-400">Please wait while we fetch your bank information...</p>
        </div>
      </div>
    );
  }

  // Only show "not found" after data has loaded
  if (!banksLoading && !bank) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Bank Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The requested bank could not be found.</p>
          <Link href="/banks">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Banks
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return (amount / 1000000).toFixed(3).replace(/\.?0+$/, '') + "M SAR";
  };

  const getConnectionStatus = () => {
    // This would be connected to real bank integration status
    return Math.random() > 0.5 ? 'connected' : 'disconnected';
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/banks">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Banks
              </Button>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">
                  {bank.code.substring(0, 3)}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{bank.name}</h1>
                <p className="text-gray-600 dark:text-gray-300">Code: {bank.code}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={connectionStatus === 'connected' 
              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400"
              : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-400"
            }>
              {connectionStatus === 'connected' ? (
                <>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Connected
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Not Connected
                </>
              )}
            </Badge>
            {connectionStatus !== 'connected' && (
              <Button className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white">
                <LogIn className="mr-2 h-4 w-4" />
                Connect Bank
              </Button>
            )}
          </div>
        </div>

        {/* Bank Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Exposure</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(displayMetrics.outstanding)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="text-white text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Credit Limit</p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    {formatCurrency(displayMetrics.creditLimit)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
                  <CreditCard className="text-white text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Utilization</p>
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                    {`${displayMetrics.utilization.toFixed(1)}%`}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center">
                  <BarChart3 className="text-white text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Loans</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {displayMetrics.activeLoansCount}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center">
                  <FileText className="text-white text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bank Facilities */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <span>Credit Facilities</span>
                  </div>
                  <Dialog open={isFacilityDialogOpen} onOpenChange={setIsFacilityDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-facility">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Facility
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>
                          {editingFacility ? "Edit Credit Facility" : "Add New Credit Facility"}
                        </DialogTitle>
                        <DialogDescription>
                          {editingFacility 
                            ? `Update the details for your ${editingFacility.facilityType.replace('_', ' ')} facility with ${bank?.name}.`
                            : `Create a new credit facility for ${bank?.name}.`
                          }
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...facilityForm}>
                        <form onSubmit={facilityForm.handleSubmit(handleSubmitFacility)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={facilityForm.control}
                              name="facilityType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Facility Type</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-facilityType">
                                        <SelectValue placeholder="Select facility type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="revolving">Revolving Credit</SelectItem>
                                      <SelectItem value="term">Term Loan</SelectItem>
                                      <SelectItem value="bullet">Bullet Loan</SelectItem>
                                      <SelectItem value="bridge">Bridge Financing</SelectItem>
                                      <SelectItem value="working_capital">Working Capital</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={facilityForm.control}
                              name="creditLimit"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Credit Limit (SAR)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      data-testid="input-creditLimit" 
                                      type="number"
                                      placeholder="e.g., 5000000" 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={facilityForm.control}
                              name="costOfFunding"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cost of Funding (%)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      data-testid="input-costOfFunding" 
                                      type="number" 
                                      step="0.01"
                                      placeholder="e.g., 2.75" 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={facilityForm.control}
                              name="isActive"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>Active Facility</FormLabel>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      Set facility as active
                                    </p>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      data-testid="switch-isActive"
                                      checked={field.value ?? true}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={facilityForm.control}
                              name="startDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start Date</FormLabel>
                                  <FormControl>
                                    <Input 
                                      data-testid="input-startDate" 
                                      type="date" 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={facilityForm.control}
                              name="expiryDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Expiry Date</FormLabel>
                                  <FormControl>
                                    <Input 
                                      data-testid="input-expiryDate" 
                                      type="date" 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={facilityForm.control}
                            name="terms"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Terms & Conditions (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    data-testid="textarea-terms"
                                    placeholder="Enter any specific terms and conditions for this facility..."
                                    className="resize-none"
                                    {...field}
                                    value={field.value ?? ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <DialogFooter>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={handleCloseFacilityDialog}
                              data-testid="button-cancel-facility"
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={createFacilityMutation.isPending || updateFacilityMutation.isPending}
                              data-testid="button-submit-facility"
                            >
                              {editingFacility ? (
                                updateFacilityMutation.isPending ? "Updating..." : "Update Facility"
                              ) : (
                                createFacilityMutation.isPending ? "Creating..." : "Create Facility"
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your active facilities with this bank</p>
              </CardHeader>
              <CardContent>
                {bankFacilities.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No facilities found with this bank</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bankFacilities.map((facility: any) => (
                      <div key={facility.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                              {facility.facilityType.replace('_', ' ')} Facility
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Active since {new Date(facility.startDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={facility.isActive 
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                          }>
                            {facility.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Credit Limit</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {formatCurrency(parseFloat(facility.creditLimit))}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Cost of Funding</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              SIBOR + {facility.costOfFunding}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Start Date</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {new Date(facility.startDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Expiry Date</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {new Date(facility.expiryDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        {facility.terms && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Terms & Conditions</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                              {facility.terms}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditFacility(facility)}
                            data-testid={`button-edit-facility-${facility.id}`}
                          >
                            <Edit className="mr-1 h-4 w-4" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteFacility(facility.id)}
                            disabled={deleteFacilityMutation.isPending}
                            data-testid={`button-delete-facility-${facility.id}`}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            {deleteFacilityMutation.isPending ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Loans */}
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Active Loans</span>
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current loan drawdowns from this bank</p>
              </CardHeader>
              <CardContent>
                {bankLoans.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No active loans with this bank</p>
                    <Button 
                      onClick={() => setIsLoanDialogOpen(true)}
                      className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white shadow-lg"
                      data-testid="button-add-loan"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Loan
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bankLoans.slice(0, 5).map((loan: any) => {
                      const daysUntilDue = Math.ceil((new Date(loan.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                      const urgency = daysUntilDue <= 7 ? 'critical' : daysUntilDue <= 15 ? 'warning' : 'normal';
                      
                      return (
                        <div key={loan.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h5 className="font-semibold text-gray-900 dark:text-gray-100">
                                {loan.referenceNumber}
                              </h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Due: {new Date(loan.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900 dark:text-gray-100">
                                {formatCurrency(parseFloat(loan.amount))}
                              </p>
                              <Badge className={
                                urgency === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                                urgency === 'warning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400' :
                                'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
                              }>
                                {daysUntilDue > 0 ? `${daysUntilDue} days` : 'Overdue'}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Interest: SIBOR + {loan.bankRate}% | Status: {loan.status}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Collateral Assignments */}
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                  <Gem className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span>Assigned Collateral</span>
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Assets securing facilities with this bank
                </p>
              </CardHeader>
              <CardContent>
                {bankCollateral.length === 0 ? (
                  <div className="text-center py-12">
                    <Gem className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No collateral assigned to this bank's facilities</p>
                    <Button 
                      onClick={() => setIsCollateralDialogOpen(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                      data-testid="button-add-collateral"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Collateral
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bankCollateral.map((asset: any) => (
                      <div key={asset.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                              {asset.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                              {asset.type.replace('_', ' ')} • Valued {new Date(asset.valuationDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-gray-100">
                              {formatCurrency(parseFloat(asset.currentValue))}
                            </p>
                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                              Assigned
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Assigned to Facility</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                              {asset.facility?.facilityType?.replace('_', ' ')} Facility
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Facility Credit Limit</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {asset.facility ? formatCurrency(parseFloat(asset.facility.creditLimit)) : 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        {asset.assignment?.creditLineId && (
                          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Specific Credit Line Assignment</p>
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              Credit Line ID: {asset.assignment.creditLineId}
                            </p>
                          </div>
                        )}
                        
                        {asset.description && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Description</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                              {asset.description}
                            </p>
                          </div>
                        )}
                        
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              Valuation Source: {asset.valuationSource || 'Not specified'}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              Last Updated: {new Date(asset.valuationDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bank Information & Actions */}
          <div className="space-y-6">
            {/* Bank Contacts */}
            <BankContactsSection 
              bankId={bankId!} 
              bankName={bank.name} 
              isAuthenticated={isAuthenticated} 
            />
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                  <Building className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bank Code</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{bank.code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Full Name</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{bank.name}</p>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">+966 11 123 4567</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">corporate@{bank.code.toLowerCase()}.com.sa</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Riyadh, Saudi Arabia</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View All Loans
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Transaction History
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Performance Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Connection
                </Button>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Relationship Duration</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">2.5 years</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Average Rate</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">SIBOR + 2.75%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Payment Record</span>
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                    Excellent
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Last Activity</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">2 days ago</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Collateral Form Dialog */}
      {isCollateralDialogOpen && (
        <CollateralForm
          onSuccess={() => {
            setIsCollateralDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ["/api/collateral"] });
            queryClient.invalidateQueries({ queryKey: ["/api/collateral-assignments"] });
            toast({
              title: "Success",
              description: "Collateral added successfully",
            });
          }}
          onCancel={() => setIsCollateralDialogOpen(false)}
        />
      )}

      {/* Loan Form Dialog */}
      {isLoanDialogOpen && (
        <LoanForm
          onSuccess={() => {
            setIsLoanDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
            queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
            toast({
              title: "Success",
              description: "Loan added successfully",
            });
          }}
          onCancel={() => setIsLoanDialogOpen(false)}
        />
      )}
    </div>
  );
}