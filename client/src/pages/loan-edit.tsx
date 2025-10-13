import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowLeft, DollarSign, Calendar, Receipt, AlertCircle, Building2, Save, X, FileText, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, invalidateLoans } from "@/lib/queryClient";
import { insertLoanSchema } from "@shared/schema";
import { ModernDatePicker } from "@/components/ui/date-picker";

const loanFormSchema = z.object({
  referenceNumber: z.string().min(1, "Reference number is required"),
  amount: z.string().min(1, "Amount is required"),
  siborRate: z.string().min(1, "SIBOR rate is required"),
  margin: z.string().min(1, "Margin is required"),
  startDate: z.string().min(1, "Start date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  purpose: z.string().optional(),
  status: z.enum(["active", "settled", "overdue", "cancelled"]),
  notes: z.string().optional(),
});

type LoanFormData = z.infer<typeof loanFormSchema>;

export default function LoanEditPage() {
  const { id: loanId } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch loan details for editing
  const { data: loan, isLoading: loanLoading, error: loanError } = useQuery({
    queryKey: ['/api/loans', loanId],
    queryFn: async () => {
      const response = await fetch(`/api/loans/${loanId}`, {
        credentials: "include",
        cache: "no-cache"
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch loan: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!loanId,
    staleTime: 0,
    gcTime: 0,
  });

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      referenceNumber: "",
      amount: "",
      siborRate: "",
      margin: "",
      startDate: "",
      dueDate: "",
      purpose: "",
      status: "active",
      notes: "",
    },
  });

  // Update form when loan data loads
  useEffect(() => {
    if (loan) {
      const loanData = loan as any;
      form.reset({
        referenceNumber: loanData.referenceNumber || "",
        amount: loanData.amount || "",
        siborRate: loanData.siborRate || "",
        margin: loanData.margin || "",
        startDate: loanData.startDate || "",
        dueDate: loanData.dueDate || "",
        purpose: loanData.purpose || "",
        status: loanData.status || "active",
        notes: loanData.notes || "",
      });
    }
  }, [loan, form]);

  const updateLoanMutation = useMutation({
    mutationFn: async (data: LoanFormData) => {
      // Calculate bankRate from siborRate + margin
      const siborRate = parseFloat(data.siborRate);
      const margin = parseFloat(data.margin);
      const bankRate = (siborRate + margin).toFixed(2);
      
      return apiRequest('PATCH', `/api/loans/${loanId}`, {
        ...data,
        bankRate,
        reason: "Loan details updated via edit form"
      });
    },
    onSuccess: () => {
      invalidateLoans(); // Invalidates all loan-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/loans", loanId] }); // Also invalidate specific loan detail
      toast({ 
        title: "Loan updated successfully",
        description: "Your loan changes have been saved."
      });
      setLocation(`/loans`);
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update loan", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: LoanFormData) => {
    updateLoanMutation.mutate(data);
  };

  if (loanLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loading Loan</h2>
          <p className="text-gray-600 dark:text-gray-400">Please wait...</p>
        </div>
      </div>
    );
  }

  if (loanError || !loan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loan Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The loan you're trying to edit could not be found.</p>
          <Button 
            onClick={() => setLocation('/loans')}
            className="bg-indigo-600 lg:hover:bg-indigo-700 text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Loans
          </Button>
        </div>
      </div>
    );
  }

  const loanData = loan as any;
  const bankName = loanData.facility?.bank?.name || loanData.bank?.name || 'Unknown Bank';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900">
      {/* Navigation Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation('/loans')}
                data-testid="button-back-loans"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Loans
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="w-10 h-10 bg-saudi text-white rounded-lg flex items-center justify-center">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Edit Loan</h1>
                <p className="text-sm text-muted-foreground">Update loan details for {loanData.referenceNumber}</p>
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
                  <FileText className="h-5 w-5 text-primary" />
                  <span>Loan Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="referenceNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reference Number *</FormLabel>
                              <FormControl>
                                <Input 
                                  className="h-12"
                                  data-testid="input-reference-number" 
                                  placeholder="e.g., LOAN-2024-001" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status *</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-12" data-testid="select-loan-status">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="settled">Settled</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
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
                      <h3 className="text-lg font-medium">Financial Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Loan Amount (SAR) *</FormLabel>
                              <FormControl>
                                <Input 
                                  className="h-12"
                                  data-testid="input-loan-amount" 
                                  placeholder="e.g., 1000000" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name="siborRate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SIBOR Rate (%) *</FormLabel>
                                <FormControl>
                                  <Input 
                                    className="h-12"
                                    data-testid="input-sibor-rate" 
                                    placeholder="e.g., 5.75" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="margin"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  Margin (%) *
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs">Margin is set at facility level and cannot be changed here</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    className="h-12 bg-muted/50 cursor-not-allowed"
                                    data-testid="input-margin" 
                                    placeholder="e.g., 1.00" 
                                    disabled
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      {/* Calculated Total Rate Display */}
                      {form.watch("siborRate") && form.watch("margin") && (
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Total Bank Rate</span>
                            <span className="text-lg font-semibold text-primary" data-testid="text-total-bank-rate">
                              {(parseFloat(form.watch("siborRate") || "0") + parseFloat(form.watch("margin") || "0")).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Date Fields */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Timeline</h3>
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
                        
                        <FormField
                          control={form.control}
                          name="dueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Due Date *</FormLabel>
                              <FormControl>
                                <ModernDatePicker 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  placeholder="Select due date"
                                  dataTestId="input-due-date"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Purpose and Notes */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="purpose"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Purpose</FormLabel>
                            <FormControl>
                              <Input 
                                className="h-12"
                                data-testid="input-purpose"
                                placeholder="e.g., Working Capital, Equipment Purchase"
                                {...field} 
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
                                data-testid="input-notes"
                                placeholder="Additional notes about this loan..."
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
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 border-t">
                      <Button 
                        type="button" 
                        variant="outline"
                        className="h-12 w-full sm:w-auto"
                        onClick={() => setLocation('/loans')}
                        data-testid="button-cancel-loan"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={updateLoanMutation.isPending}
                        className="h-12 bg-gradient-to-r from-blue-600 to-indigo-600 lg:hover:from-blue-700 lg:hover:to-indigo-700"
                        data-testid="button-save-loan"
                      >
                        {updateLoanMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Update Loan
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
                  <span>Loan Context</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Bank</p>
                  <p className="font-medium" data-testid="text-loan-bank">{bankName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reference Number</p>
                  <p className="font-medium" data-testid="text-loan-reference">{loanData.referenceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Status</p>
                  <Badge 
                    variant={loanData.status === 'active' ? 'default' : 'secondary'}
                    data-testid="badge-loan-status"
                  >
                    {loanData.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <span>Edit Guidelines</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>• Update amounts to reflect current drawings</p>
                  <p>• Adjust margins based on latest negotiations</p>
                  <p>• Extend due dates for renewals or extensions</p>
                  <p>• Change status to settled when fully repaid</p>
                  <p>• Add notes for important changes or conditions</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}