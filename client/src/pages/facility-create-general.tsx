import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertFacilitySchema } from "@shared/schema";
import { z } from "zod";
import { useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { 
  ArrowLeft, 
  Building, 
  CreditCard, 
  Calendar,
  Percent,
  Save,
  X,
  Clock,
  AlertCircle,
} from "lucide-react";

import { Link } from "wouter";
import { formatFacilityType } from "@/lib/formatters";
import { ModernDatePicker } from "@/components/ui/date-picker";

const facilityFormSchema = insertFacilitySchema.extend({
  bankId: z.string().min(1, "Please select a bank"),
  facilityType: z.string().min(1, "Please select a facility type"),
  creditLimit: z.string().min(1, "Credit limit is required"),
  costOfFunding: z.string().min(1, "Cost of funding is required"),
  startDate: z.string().min(1, "Start date is required"),
  hasFixedDuration: z.boolean().optional(),
  expiryDate: z.string().optional(),
  terms: z.string().optional(),
  enableRevolvingTracking: z.boolean().optional(),
  maxRevolvingPeriod: z.string().optional(),
  initialDrawdownDate: z.string().optional(),
}).superRefine((data, ctx) => {
  // Allow 0 cost of funding for non-cash guarantee facilities
  if (data.facilityType !== "non_cash_guarantee" && parseFloat(data.costOfFunding) <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["costOfFunding"],
      message: "Cost of funding must be greater than 0 for cash facilities"
    });
  }
  
  // Require expiry date when fixed duration is enabled
  if (data.hasFixedDuration && (!data.expiryDate || data.expiryDate.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["expiryDate"],
      message: "Expiry date is required when fixed duration is enabled"
    });
  }
  
  // Require maxRevolvingPeriod when revolving tracking is enabled
  if (data.enableRevolvingTracking && (!data.maxRevolvingPeriod || data.maxRevolvingPeriod.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["maxRevolvingPeriod"],
      message: "Maximum revolving period is required when tracking is enabled"
    });
  }
});

const facilityTypes = [
  { value: "revolving", label: "Revolving Credit Line" },
  { value: "term", label: "Term Loan" },
  { value: "bullet", label: "Bullet Loan" },
  { value: "bridge", label: "Bridge Financing" },
  { value: "working_capital", label: "Working Capital Facility" },
  { value: "non_cash_guarantee", label: "Non-Cash Guarantee" },
];

export default function GeneralFacilityCreatePage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Get banks for selection
  const { data: banks } = useQuery({
    queryKey: ["/api/banks"],
    enabled: isAuthenticated,
  });

  const form = useForm<z.infer<typeof facilityFormSchema>>({
    resolver: zodResolver(facilityFormSchema),
    defaultValues: {
      bankId: "",
      facilityType: "",
      creditLimit: "",
      costOfFunding: "",
      startDate: new Date().toISOString().split('T')[0],
      hasFixedDuration: true,
      expiryDate: "",
      terms: "",
      enableRevolvingTracking: false,
      maxRevolvingPeriod: "",
      initialDrawdownDate: "",
    },
  });

  const createFacilityMutation = useMutation({
    mutationFn: async (data: z.infer<typeof facilityFormSchema>) => {
      const facilityData = {
        ...data,
        creditLimit: parseFloat(data.creditLimit).toString(),
        costOfFunding: parseFloat(data.costOfFunding).toString(),
        expiryDate: data.hasFixedDuration && data.expiryDate && data.expiryDate.trim() !== ""
          ? data.expiryDate
          : null,
        maxRevolvingPeriod: data.maxRevolvingPeriod && data.maxRevolvingPeriod.trim() !== "" 
          ? parseInt(data.maxRevolvingPeriod) 
          : null,
        initialDrawdownDate: data.initialDrawdownDate && data.initialDrawdownDate.trim() !== "" 
          ? data.initialDrawdownDate 
          : null,
      };
      // Remove hasFixedDuration as it's not in the database schema
      const { hasFixedDuration, ...facilityPayload } = facilityData;
      return apiRequest("POST", "/api/facilities", facilityPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facilities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      toast({ 
        title: "Facility created successfully",
        description: "The bank facility has been added to your system."
      });
      setLocation("/banks");
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create facility", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const calculateExpiryDate = (startDate: string, facilityType: string) => {
    if (!startDate) return "";
    
    const start = new Date(startDate);
    let expiryDate = new Date(start);
    
    // Set default expiry based on facility type
    switch (facilityType) {
      case "revolving":
        expiryDate.setMonth(start.getMonth() + 6); // 6 months for revolving
        break;
      case "term":
        expiryDate.setFullYear(start.getFullYear() + 1); // 1 year for term loans
        break;
      case "bullet":
        expiryDate.setMonth(start.getMonth() + 3); // 3 months for bullet
        break;
      case "bridge":
        expiryDate.setMonth(start.getMonth() + 2); // 2 months for bridge
        break;
      case "working_capital":
        expiryDate.setFullYear(start.getFullYear() + 1); // 1 year for working capital
        break;
      case "non_cash_guarantee":
        expiryDate.setFullYear(start.getFullYear() + 1); // 1 year for non-cash guarantee
        break;
      default:
        expiryDate.setFullYear(start.getFullYear() + 1);
    }
    
    return expiryDate.toISOString().split('T')[0];
  };

  // Auto-calculate expiry date when start date or facility type changes
  const startDate = form.watch("startDate");
  const facilityType = form.watch("facilityType");
  const hasFixedDuration = form.watch("hasFixedDuration");
  const enableRevolvingTracking = form.watch("enableRevolvingTracking");
  
  useEffect(() => {
    if (startDate && facilityType && hasFixedDuration) {
      const newExpiryDate = calculateExpiryDate(startDate, facilityType);
      if (newExpiryDate) {
        form.setValue("expiryDate", newExpiryDate);
      }
    }
    
    // Auto-set cost of funding to 0 for non-cash guarantee facilities
    if (facilityType === "non_cash_guarantee") {
      form.setValue("costOfFunding", "0");
    }
  }, [startDate, facilityType, hasFixedDuration, form]);

  // Clear maxRevolvingPeriod when tracking is disabled
  useEffect(() => {
    if (!enableRevolvingTracking) {
      form.setValue("maxRevolvingPeriod", undefined);
    }
  }, [enableRevolvingTracking, form]);
  
  // Clear expiry date when fixed duration is disabled
  useEffect(() => {
    if (!hasFixedDuration) {
      form.setValue("expiryDate", undefined);
    }
  }, [hasFixedDuration, form]);

  const onSubmit = (data: z.infer<typeof facilityFormSchema>) => {
    createFacilityMutation.mutate(data);
  };

  if (isLoading || !banks) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/banks">
                <Button variant="ghost" size="sm" data-testid="button-back-banks">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Banks
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="w-10 h-10 bg-saudi text-white rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Create Bank Facility</h1>
                <p className="text-sm text-muted-foreground">Set up a new credit facility</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-primary" />
                  <span>Facility Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Bank Selection */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Bank Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="bankId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bank *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value} data-testid="select-bank">
                                <FormControl>
                                  <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Select bank" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {(banks as any[])?.map((bank: any) => (
                                    <SelectItem key={bank.id} value={bank.id}>
                                      {bank.name} ({bank.code})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="facilityType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Facility Type *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value} data-testid="select-facility-type">
                                <FormControl>
                                  <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {facilityTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Financial Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center space-x-2">
                        <span className="font-bold">﷼</span>
                        <span>Financial Terms</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="creditLimit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Credit Limit (SAR) *</FormLabel>
                              <FormControl>
                                <Input 
                                  data-testid="input-credit-limit" 
                                  type="number" 
                                  placeholder="e.g., 1000000" 
                                  className="h-12"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="costOfFunding"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cost of Funding (%) *</FormLabel>
                              <FormControl>
                                <Input 
                                  data-testid="input-cost-of-funding" 
                                  type="number" 
                                  step="0.01"
                                  placeholder="e.g., 5.75" 
                                  className="h-12"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Duration */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Duration</span>
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Enable fixed duration for facilities with a specific expiry date. Disable for flexible-term facilities that can be terminated upon negotiation.
                        </p>
                      </div>

                      <FormField
                        control={form.control}
                        name="hasFixedDuration"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/10">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Fixed Duration</FormLabel>
                              <FormDescription>
                                Facility has a specific expiry date
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                data-testid="switch-fixed-duration"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date *</FormLabel>
                              <FormControl>
                                <ModernDatePicker 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  placeholder="Select start date"
                                  dataTestId="input-start-date"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {hasFixedDuration && (
                          <FormField
                            control={form.control}
                            name="expiryDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Expiry Date *</FormLabel>
                                <FormControl>
                                  <ModernDatePicker 
                                    value={field.value} 
                                    onChange={field.onChange}
                                    placeholder="Select expiry date"
                                    dataTestId="input-expiry-date"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>

                      {!hasFixedDuration && (
                        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                            This facility has flexible terms and can be terminated upon negotiation with the bank.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <Separator />

                    {/* Additional Terms */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Additional Terms</h3>
                      <FormField
                        control={form.control}
                        name="terms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Terms & Conditions</FormLabel>
                            <FormControl>
                              <Textarea 
                                data-testid="input-terms"
                                placeholder="Additional terms, covenants, or special conditions..."
                                className="min-h-[100px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Revolving Period Tracking (Optional) */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>Revolving Period Tracking</span>
                          <Badge variant="outline" className="text-xs">Optional</Badge>
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          For complex revolving credit structures with maximum cumulative period limits (e.g., 360 days).
                        </p>
                      </div>

                      <FormField
                        control={form.control}
                        name="enableRevolvingTracking"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/10">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable Period Tracking</FormLabel>
                              <FormDescription>
                                Track cumulative days used across all loans under this facility
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                data-testid="switch-enable-tracking"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {enableRevolvingTracking && (
                        <>
                          <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                            <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <AlertDescription className="text-sm text-green-800 dark:text-green-200">
                              When enabled, the system will track the total days used across all loans. This helps manage facilities with maximum revolving periods (e.g., 360 days) where borrowers can drawdown multiple times with custom terms.
                            </AlertDescription>
                          </Alert>

                          <FormField
                            control={form.control}
                            name="maxRevolvingPeriod"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Maximum Revolving Period (Days) *</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid="input-max-period" 
                                    type="number"
                                    placeholder="e.g., 360"
                                    className="h-12"
                                    {...field}
                                    value={field.value ?? ""}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Total cumulative days allowed for all drawdowns under this facility
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-3 pt-6 border-t">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setLocation("/banks")}
                        data-testid="button-cancel-facility"
                        className="h-12"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createFacilityMutation.isPending}
                        className="h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        data-testid="button-save-facility"
                      >
                        {createFacilityMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Create Facility
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Information */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span>Facility Types</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground space-y-2">
                  <div><span className="font-medium">Revolving:</span> Credit line you can draw and repay</div>
                  <div><span className="font-medium">Term Loan:</span> Fixed amount with scheduled payments</div>
                  <div><span className="font-medium">Bullet:</span> Lump sum repayment at maturity</div>
                  <div><span className="font-medium">Bridge:</span> Short-term financing solution</div>
                  <div><span className="font-medium">Working Capital:</span> Operational funding facility</div>
                  <div><span className="font-medium">Non Bank Guarantee:</span> Guarantee facility without cash drawdown</div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Percent className="h-5 w-5 text-primary" />
                  <span>Cost Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>• <span className="font-semibold">Cost of Funding (*)</span> is the margin/spread above SIBOR</p>
                  <p>• Total rate = SIBOR + Cost of Funding</p>
                  <p>• SIBOR rates to be input in each loan creation independently depending on the duration and rate that time</p>
                  <p>• Facility terms may include rate adjustment clauses</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}