import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowLeft, DollarSign, Calendar, TrendingUp, AlertCircle, Building2 } from "lucide-react";

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
});

type FacilityFormData = z.infer<typeof facilityFormSchema>;

export default function FacilityCreatePage() {
  const { bankId } = useParams<{ bankId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch bank details for context
  const { data: bank } = useQuery<{ id: string; name: string; code: string }>({
    queryKey: ["/api/banks", bankId],
    enabled: !!bankId,
  });

  const form = useForm<FacilityFormData>({
    resolver: zodResolver(facilityFormSchema),
    defaultValues: {
      facilityType: "revolving",
      creditLimit: "",
      costOfFunding: "",
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      terms: "",
      isActive: true,
    },
  });

  const createFacilityMutation = useMutation({
    mutationFn: async (data: FacilityFormData) => {
      const facilityData = {
        ...data,
        bankId,
        creditLimit: parseFloat(data.creditLimit).toString(),
        costOfFunding: parseFloat(data.costOfFunding).toString(),
      };
      return await apiRequest("POST", "/api/facilities", facilityData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facilities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      toast({
        title: "Success",
        description: "Bank facility created successfully",
      });
      // Navigate back to bank detail page
      setLocation(`/banks/${bankId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create facility",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FacilityFormData) => {
    console.log("✅ Form submitted successfully with data:", data);
    console.log("Form errors:", form.formState.errors);
    createFacilityMutation.mutate(data);
  };
  
  const onError = (errors: any) => {
    console.log("❌ Form validation errors:", errors);
    const errorFields = Object.keys(errors).join(", ");
    toast({
      title: "Validation Error",
      description: `Please fix these fields: ${errorFields}`,
      variant: "destructive",
    });
  };

  const selectedType = form.watch("facilityType");
  const typeDescription = facilityTypes.find(type => type.value === selectedType)?.description;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation(`/banks/${bankId}`)}
                data-testid="button-back-to-bank"
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {bank?.name || 'Bank'}
              </Button>
              <div className="hidden sm:block w-px h-6 bg-gray-300 dark:bg-gray-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Facility</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Add a new banking facility for {bank?.name || 'this bank'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Facility Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
                    {/* Facility Type */}
                    <FormField
                      control={form.control}
                      name="facilityType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facility Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
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
                          {typeDescription && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {typeDescription}
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Financial Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="creditLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Credit Limit (SAR) *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="e.g., 1000000"
                                data-testid="input-credit-limit"
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
                                {...field}
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                placeholder="e.g., 2.5"
                                data-testid="input-cost-of-funding"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Start Date */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="date"
                                data-testid="input-start-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Expiry Date */}
                      <FormField
                        control={form.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="date"
                                data-testid="input-expiry-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Terms */}
                    <FormField
                      control={form.control}
                      name="terms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Terms & Conditions</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value || ""}
                              placeholder="Describe the terms and conditions of this facility..."
                              data-testid="textarea-terms"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Active Status */}
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Active Status</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Enable this facility for loan drawdowns
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              data-testid="switch-is-active"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Separator />

                    {/* Form Actions */}
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLocation(`/banks/${bankId}`)}
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createFacilityMutation.isPending}
                        data-testid="button-create-facility"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        {createFacilityMutation.isPending ? "Creating..." : "Create Facility"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Bank Information */}
            {bank && (
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center text-gray-900 dark:text-white">
                    <Building2 className="h-4 w-4 mr-2" />
                    Bank Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Bank:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{bank.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Code:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{bank.code}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Facility Type Guide */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center text-gray-900 dark:text-white">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Facility Types
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {facilityTypes.slice(0, 4).map((type) => (
                    <div key={type.value} className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-2 last:pb-0">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{type.label}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{type.description}</div>
                    </div>
                  ))}
                  <div className="text-xs text-gray-500 dark:text-gray-500 italic">
                    ...and more Islamic finance options available
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="shadow-sm border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center text-green-800 dark:text-green-400">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Quick Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    <span>Set realistic credit limits based on your financing needs</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    <span>Cost of funding is added to SIBOR for final rate calculation</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    <span>Consider maturity dates that align with your cash flow</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}