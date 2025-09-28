import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowLeft, DollarSign, Calendar, TrendingUp, AlertCircle, Building2, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertFacilitySchema } from "@shared/schema";
import DocumentUpload from "@/components/DocumentUpload";
import DocumentList from "@/components/DocumentList";

// Facility types with descriptions (matching schema enum)
const facilityTypes = [
  { value: "revolving", label: "Revolving Credit Line", description: "Flexible credit line that can be drawn and repaid" },
  { value: "term", label: "Term Loan", description: "Fixed-term financing with regular payments" },
  { value: "bullet", label: "Bullet Loan", description: "Lump sum repayment at maturity" },
  { value: "bridge", label: "Bridge Financing", description: "Short-term financing solution" },
  { value: "working_capital", label: "Working Capital Facility", description: "For operational cash flow needs" },
  { value: "non_cash_guarantee", label: "Non-Cash Guarantee", description: "Issue bank guarantees without underlying loans" },
];

const facilityFormSchema = z.object({
  facilityType: z.enum(["revolving", "term", "bullet", "bridge", "working_capital", "non_cash_guarantee"]),
  creditLimit: z.string().min(1, "Credit limit is required"),
  costOfFunding: z.string().min(1, "Cost of funding is required"),
  startDate: z.string().min(1, "Start date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  terms: z.string().optional(),
  isActive: z.boolean().default(true),
}).superRefine((data, ctx) => {
  // Allow 0 cost of funding for non-cash guarantee facilities
  if (data.facilityType !== "non_cash_guarantee" && parseFloat(data.costOfFunding) <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["costOfFunding"],
      message: "Cost of funding must be greater than 0 for cash facilities"
    });
  }
});

type FacilityFormData = z.infer<typeof facilityFormSchema>;

export default function FacilityEditPage() {
  const { bankId, facilityId } = useParams<{ bankId: string; facilityId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch bank details for context
  const { data: bank, isLoading: bankLoading, isError: bankError } = useQuery<{ id: string; name: string; code: string }>({
    queryKey: ["/api/banks", bankId],
    enabled: !!bankId,
  });

  // Fetch facility details for editing
  const { data: facility, isLoading: facilityLoading, isError: facilityError } = useQuery({
    queryKey: ["/api/facilities", facilityId],
    enabled: !!facilityId,
  });

  const form = useForm<FacilityFormData>({
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

  // Update form when facility data loads
  useEffect(() => {
    if (facility) {
      form.reset({
        facilityType: (facility as any).facilityType || "revolving",
        creditLimit: (facility as any).creditLimit || "",
        costOfFunding: (facility as any).costOfFunding || "",
        startDate: (facility as any).startDate || "",
        expiryDate: (facility as any).expiryDate || "",
        terms: (facility as any).terms || "",
        isActive: (facility as any).isActive !== false,
      });
    }
  }, [facility, form]);

  const updateFacilityMutation = useMutation({
    mutationFn: async (data: FacilityFormData) => {
      return apiRequest('PUT', `/api/facilities/${facilityId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facilities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/facilities", facilityId] });
      queryClient.invalidateQueries({ queryKey: ["/api/banks", bankId] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      toast({ 
        title: "Facility updated successfully",
        description: "Your facility changes have been saved."
      });
      setLocation(`/banks/${bankId}`);
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update facility", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: FacilityFormData) => {
    updateFacilityMutation.mutate(data);
  };

  // Loading state
  if (facilityLoading || bankLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loading Facility</h2>
          <p className="text-gray-600 dark:text-gray-400">Please wait...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (bankError || facilityError || !bank || !facility) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Facility</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {bankError ? "Bank not found" : facilityError ? "Facility not found" : "Data not available"}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => setLocation("/banks")} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Banks
            </Button>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900">
      {/* Navigation Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation(`/banks/${bankId}`)}
                data-testid="button-back-bank"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {bank?.name}
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="w-10 h-10 bg-saudi text-white rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Edit Facility</h1>
                <p className="text-sm text-muted-foreground">Update facility details for {bank?.name}</p>
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
                  <Building2 className="h-5 w-5 text-primary" />
                  <span>Facility Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Facility Type */}
                    <FormField
                      control={form.control}
                      name="facilityType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facility Type *</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-facility-type">
                                <SelectValue placeholder="Select facility type" />
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

                    {/* Financial Details */}
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
                            <FormLabel>Bank Margin (%) *</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-cost-of-funding" 
                                placeholder="e.g., 2.5" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Date Fields */}
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

                    {/* Active Status */}
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Active Status</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Whether this facility is currently active for new drawdowns
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              data-testid="switch-is-active"
                              checked={field.value ?? false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Terms */}
                    <FormField
                      control={form.control}
                      name="terms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Terms & Conditions</FormLabel>
                          <FormControl>
                            <Textarea 
                              data-testid="input-terms"
                              placeholder="Enter facility terms, covenants, and conditions..."
                              className="min-h-[100px]"
                              value={field.value || ""}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setLocation(`/banks/${bankId}`)}
                        data-testid="button-cancel-facility"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={updateFacilityMutation.isPending}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        data-testid="button-save-facility"
                      >
                        {updateFacilityMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Update Facility
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
                  <Building2 className="h-5 w-5 text-primary" />
                  <span>Bank Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Bank Name</p>
                  <p className="font-medium" data-testid="text-bank-name">{bank?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bank Code</p>
                  <p className="font-medium" data-testid="text-bank-code">{bank?.code}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Edit Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>• Update credit limits to reflect current arrangements</p>
                  <p>• Adjust margins based on latest negotiations</p>
                  <p>• Set appropriate expiry dates for renewals</p>
                  <p>• Use inactive status to suspend new drawdowns</p>
                  <p>• Update terms for covenant or condition changes</p>
                </div>
              </CardContent>
            </Card>

            {/* Facility Documents */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span>Facility Documents</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Document Upload */}
                <DocumentUpload 
                  entityType="facility"
                  entityId={facilityId!}
                  onUploadComplete={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/documents", "facility", facilityId] });
                  }}
                  maxFiles={15}
                />
                
                {/* Document List */}
                <DocumentList 
                  entityType="facility"
                  entityId={facilityId!}
                  showUpload={false}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}