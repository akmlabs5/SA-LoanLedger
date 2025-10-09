import { useState } from "react";
import React from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertGuaranteeSchema, Facility, Bank, Guarantee } from "@shared/schema";
import { z } from "zod";
import { 
  ArrowLeft, 
  AlertCircle, 
  Calendar, 
  FileText, 
  Building,
  Shield,
  TrendingUp,
  CheckCircle,
  Users,
  Plus
} from "lucide-react";
import { Link } from "wouter";
import { ModernDatePicker } from "@/components/ui/date-picker";

const guaranteeFormSchema = z.object({
  facilityId: z.string().min(1, "Please select a facility"),
  guaranteeType: z.enum(["bid_bond", "performance_bond", "advance_payment_guarantee", "general_bank_guarantee", "retention_money_guarantee", "other"]),
  referenceNumber: z.string().min(1, "Reference number is required"),
  beneficiaryName: z.string().min(1, "Beneficiary name is required"),
  beneficiaryDetails: z.string().optional(),
  guaranteeAmount: z.string().min(1, "Guarantee amount is required").refine((val) => {
    const amount = parseFloat(val);
    return amount > 0;
  }, "Amount must be greater than 0"),
  securityType: z.enum(["cash", "non_cash"]),
  securityAmount: z.string().optional(),
  securityDetails: z.string().optional(),
  issueDate: z.string().min(1, "Issue date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  feeRate: z.string().optional(),
  purpose: z.string().optional(),
  terms: z.string().optional(),
  status: z.enum(["active", "expired", "renewed", "called"]).default("active"),
  notes: z.string().optional(),
});

type GuaranteeFormData = z.infer<typeof guaranteeFormSchema>;

export default function GuaranteeCreatePage() {
  const { bankId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: banks } = useQuery<Array<Bank>>({
    queryKey: ["/api/banks"],
  });

  const { data: facilities } = useQuery<Array<Facility & { bank: Bank }>>({
    queryKey: ["/api/facilities"],
  });

  // Filter for non-cash guarantee facilities only
  const guaranteeFacilities = facilities?.filter(f => f.facilityType === "non_cash_guarantee") || [];

  const form = useForm<GuaranteeFormData>({
    resolver: zodResolver(guaranteeFormSchema),
    defaultValues: {
      securityType: "non_cash",
      status: "active",
    },
  });

  const createGuaranteeMutation = useMutation({
    mutationFn: async (data: GuaranteeFormData) => {
      const guaranteeData = {
        ...data,
        guaranteeAmount: parseFloat(data.guaranteeAmount),
        securityAmount: data.securityAmount ? parseFloat(data.securityAmount) : null,
        feeRate: data.feeRate ? parseFloat(data.feeRate) : null,
      };

      const response = await apiRequest("POST", "/api/guarantees", guaranteeData);
      
      return response.json();
    },
    onSuccess: (guarantee: Guarantee) => {
      toast({
        title: "Guarantee Created",
        description: `Guarantee ${guarantee.referenceNumber} has been created successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/guarantees"] });
      setLocation("/guarantees");
    },
    onError: (error: any) => {
      console.error("Guarantee creation error:", error);
      const errorMessage = error?.message || error?.toString() || "Failed to create guarantee. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: GuaranteeFormData) => {
    createGuaranteeMutation.mutate(data);
  };

  const selectedFacility = guaranteeFacilities.find(f => f.id === form.watch("facilityId"));

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/guarantees">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
              Back to Guarantees
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Issue New Guarantee</h1>
            <p className="text-gray-600 dark:text-gray-400">Create a new bank guarantee for your client</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Facility Selection */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-green-600" />
                  Facility Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {guaranteeFacilities.length === 0 ? (
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No Non-Cash Guarantee Facilities Available
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      You need to create a non-cash guarantee facility with a bank before issuing guarantees.
                    </p>
                    <Link href="/facility/create-general">
                      <Button className="bg-gradient-to-r from-green-600 to-emerald-600 lg:hover:from-green-700 lg:hover:to-emerald-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Non-Cash Guarantee Facility
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="facilityId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Non-Cash Guarantee Facility *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-facility">
                                <SelectValue placeholder="Select a non-cash guarantee facility" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {guaranteeFacilities.map((facility) => (
                                <SelectItem key={facility.id} value={facility.id}>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{facility.bank.name}</span>
                                    <Badge variant="outline">Non-Cash Guarantee</Badge>
                                    <span className="text-sm text-gray-500">
                                      Limit: {facility.creditLimit.toLocaleString()} SAR
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedFacility && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-800 dark:text-green-200">
                            Selected Facility Details
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Bank:</span>
                            <span className="ml-2 font-medium">{selectedFacility.bank.name}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Credit Limit:</span>
                            <span className="ml-2 font-medium">{selectedFacility.creditLimit.toLocaleString()} SAR</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Guarantee Details */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Guarantee Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="guaranteeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guarantee Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-guarantee-type">
                            <SelectValue placeholder="Select guarantee type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bid_bond">Bid Bond</SelectItem>
                          <SelectItem value="performance_bond">Performance Bond</SelectItem>
                          <SelectItem value="advance_payment_guarantee">Advance Payment Guarantee</SelectItem>
                          <SelectItem value="general_bank_guarantee">General Bank Guarantee</SelectItem>
                          <SelectItem value="retention_money_guarantee">Retention Money Guarantee</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="referenceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Number *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., LG-2024-001" 
                            {...field} 
                            data-testid="input-reference-number" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="guaranteeAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guarantee Amount (SAR) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="100000.00" 
                            {...field} 
                            data-testid="input-guarantee-amount" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Date *</FormLabel>
                        <FormControl>
                          <ModernDatePicker 
                            value={field.value} 
                            onChange={field.onChange}
                            placeholder="Select issue date"
                            dataTestId="input-issue-date"
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
                </div>

                <FormField
                  control={form.control}
                  name="feeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee Rate (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="1.5" 
                          {...field} 
                          data-testid="input-fee-rate" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Beneficiary Information */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Beneficiary Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="beneficiaryName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beneficiary Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Client Company Name" 
                          {...field} 
                          data-testid="input-beneficiary-name" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="beneficiaryDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beneficiary Details</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional beneficiary information, address, contact details..." 
                          className="resize-none" 
                          rows={3}
                          {...field} 
                          data-testid="textarea-beneficiary-details" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Security Information */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  Security Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="securityType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Security Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-security-type">
                            <SelectValue placeholder="Select security type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash Security</SelectItem>
                          <SelectItem value="non_cash">Non-Cash Security</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="securityAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Security Amount (SAR)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="10000" 
                          {...field} 
                          data-testid="input-security-amount" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="securityDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Security Details</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Details about the security provided for this guarantee..." 
                          className="resize-none" 
                          rows={3}
                          {...field} 
                          data-testid="textarea-security-details" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Purpose and Terms */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Purpose and Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Purpose of this guarantee..." 
                          className="resize-none" 
                          rows={3}
                          {...field} 
                          data-testid="textarea-purpose" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Terms and Conditions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Specific terms and conditions for this guarantee..." 
                          className="resize-none" 
                          rows={4}
                          {...field} 
                          data-testid="textarea-terms" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional notes about this guarantee..." 
                          className="resize-none" 
                          rows={3}
                          {...field} 
                          data-testid="textarea-notes" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Link href="/guarantees">
                <Button variant="outline" type="button" data-testid="button-cancel">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={createGuaranteeMutation.isPending}
                className="bg-green-600 lg:hover:bg-green-700 text-white"
                data-testid="button-create-guarantee"
              >
                {createGuaranteeMutation.isPending ? "Creating..." : "Create Guarantee"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}