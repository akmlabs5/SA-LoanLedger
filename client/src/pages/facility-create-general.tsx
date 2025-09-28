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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { 
  ArrowLeft, 
  Building, 
  CreditCard, 
  Calendar,
  Percent,
  Save,
  X,
} from "lucide-react";

import { Link } from "wouter";

const facilityFormSchema = insertFacilitySchema.extend({
  bankId: z.string().min(1, "Please select a bank"),
  facilityType: z.string().min(1, "Please select a facility type"),
  creditLimit: z.string().min(1, "Credit limit is required"),
  costOfFunding: z.string().min(1, "Cost of funding is required"),
  startDate: z.string().min(1, "Start date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  terms: z.string().optional(),
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
      expiryDate: "",
      terms: "",
    },
  });

  const createFacilityMutation = useMutation({
    mutationFn: async (data: z.infer<typeof facilityFormSchema>) => {
      const facilityData = {
        ...data,
        creditLimit: parseFloat(data.creditLimit).toString(),
        costOfFunding: parseFloat(data.costOfFunding).toString(),
      };
      return apiRequest("POST", "/api/facilities", facilityData);
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
  
  useEffect(() => {
    if (startDate && facilityType) {
      const newExpiryDate = calculateExpiryDate(startDate, facilityType);
      if (newExpiryDate) {
        form.setValue("expiryDate", newExpiryDate);
      }
    }
  }, [startDate, facilityType, form]);

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                                  <SelectTrigger>
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
                                  <SelectTrigger>
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
                      <h3 className="text-lg font-medium flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Duration</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date *</FormLabel>
                              <FormControl>
                                <Input 
                                  data-testid="input-start-date" 
                                  type="date" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="expiryDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expiry Date *</FormLabel>
                              <FormControl>
                                <Input 
                                  data-testid="input-expiry-date" 
                                  type="date" 
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

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setLocation("/banks")}
                        data-testid="button-cancel-facility"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createFacilityMutation.isPending}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
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
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Percent className="h-5 w-5 text-primary" />
                  <span>SIBOR Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>• Cost of funding typically includes SIBOR + margin</p>
                  <p>• Current SIBOR rates are automatically factored into calculations</p>
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