import { useParams, useLocation } from "wouter";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowLeft, RefreshCw, Calendar, Percent, AlertCircle, Building2, FileText, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, invalidateLoans } from "@/lib/queryClient";
import { ModernDatePicker } from "@/components/ui/date-picker";

const revolveFormSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  siborRate: z.string().min(1, "SIBOR rate is required"),
  memo: z.string().optional(),
});

type RevolveFormData = z.infer<typeof revolveFormSchema>;

export default function LoanRevolvePage() {
  const { id: loanId } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch loan details
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

  // Fetch current SIBOR rate
  const { data: siborRate } = useQuery({
    queryKey: ["/api/sibor-rate"],
  });

  const form = useForm<RevolveFormData>({
    resolver: zodResolver(revolveFormSchema),
    defaultValues: {
      startDate: "",
      dueDate: "",
      siborRate: "",
      memo: "",
    },
  });

  // Update form when loan data loads
  useEffect(() => {
    if (loan) {
      const loanData = loan as any;
      const currentSibor = (siborRate as any)?.rate?.toString() || loanData.siborRate || "5.75";
      
      form.reset({
        startDate: new Date().toISOString().split('T')[0], // Default to today
        dueDate: loanData.dueDate || "",
        siborRate: currentSibor,
        memo: "",
      });
    }
  }, [loan, siborRate, form]);

  const revolveLoanMutation = useMutation({
    mutationFn: async (data: RevolveFormData) => {
      const loanData = loan as any;
      const margin = parseFloat(loanData.margin || "0");
      const newSiborRate = parseFloat(data.siborRate);
      const bankRate = (newSiborRate + margin).toFixed(2);
      
      return apiRequest('PUT', `/api/loans/${loanId}/revolve`, {
        startDate: data.startDate,
        dueDate: data.dueDate,
        siborRate: data.siborRate,
        bankRate,
        memo: data.memo || `Loan revolved - New period: ${data.startDate} to ${data.dueDate}`,
      });
    },
    onSuccess: () => {
      invalidateLoans();
      queryClient.invalidateQueries({ queryKey: ["/api/loans", loanId] });
      toast({ 
        title: "Loan revolved successfully",
        description: "The loan has been rolled over to the new period."
      });
      setLocation(`/loans/${loanId}`);
    },
    onError: (error) => {
      toast({ 
        title: "Failed to revolve loan", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: RevolveFormData) => {
    revolveLoanMutation.mutate(data);
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
          <p className="text-gray-600 dark:text-gray-400 mb-4">The loan you're trying to revolve could not be found.</p>
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
  const margin = loanData.margin || "0";
  const currentSiborRate = form.watch("siborRate");
  const totalRate = currentSiborRate ? (parseFloat(currentSiborRate) + parseFloat(margin)).toFixed(2) : "0.00";

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
                onClick={() => setLocation(`/loans/${loanId}`)}
                data-testid="button-back-loan"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Loan
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Revolve Loan</h1>
                <p className="text-sm text-muted-foreground">Roll over to new period - {loanData.referenceNumber}</p>
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
                  <RefreshCw className="h-5 w-5 text-primary" />
                  <span>Revolve Period Details</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Update the loan period with new dates and SIBOR rate. The loan reference and amount remain unchanged.
                </p>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Date Fields */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        New Period Timeline
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Start Date *</FormLabel>
                              <FormControl>
                                <ModernDatePicker 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  placeholder="Select start date"
                                  dataTestId="input-revolve-start-date"
                                />
                              </FormControl>
                              <FormDescription>When the new revolving period begins</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="dueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Due Date *</FormLabel>
                              <FormControl>
                                <ModernDatePicker 
                                  value={field.value} 
                                  onChange={field.onChange}
                                  placeholder="Select due date"
                                  dataTestId="input-revolve-due-date"
                                />
                              </FormControl>
                              <FormDescription>When the new period ends</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Rate Fields */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Percent className="h-5 w-5 text-primary" />
                        Interest Rates
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="siborRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New SIBOR Rate (%) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  step="0.01"
                                  className="h-12"
                                  data-testid="input-revolve-sibor-rate" 
                                  placeholder="e.g., 5.75"
                                  value={field.value}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                />
                              </FormControl>
                              <FormDescription>
                                Current market SIBOR: {(siborRate as any)?.rate || "5.75"}%
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Margin (%) 
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Margin is inherited from facility and remains constant</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              className="h-12 bg-muted/50 cursor-not-allowed"
                              data-testid="input-revolve-margin" 
                              value={parseFloat(margin).toFixed(2)}
                              disabled
                            />
                          </FormControl>
                          <FormDescription>Fixed margin from facility</FormDescription>
                        </FormItem>
                      </div>
                      
                      {/* Calculated Total Rate Display */}
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">New SIBOR Rate:</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{parseFloat(currentSiborRate || "0").toFixed(2)}%</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">+ Margin:</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{parseFloat(margin).toFixed(2)}%</span>
                          </div>
                          <div className="pt-2 border-t border-blue-300 dark:border-blue-700 flex items-center justify-between">
                            <span className="font-semibold text-blue-900 dark:text-blue-100">New Total Rate:</span>
                            <span className="text-xl font-bold text-blue-700 dark:text-blue-400" data-testid="text-total-rate">{totalRate}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Memo Field */}
                    <FormField
                      control={form.control}
                      name="memo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Memo (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              data-testid="input-revolve-memo"
                              placeholder="Add notes about this revolve action..."
                              className="min-h-[100px]"
                              value={field.value || ""} 
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                            />
                          </FormControl>
                          <FormDescription>Optional notes about this revolving period</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Submit Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 border-t">
                      <Button 
                        type="button" 
                        variant="outline"
                        className="h-12 w-full sm:w-auto"
                        onClick={() => setLocation(`/loans/${loanId}`)}
                        data-testid="button-cancel-revolve"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={revolveLoanMutation.isPending}
                        className="h-12 bg-gradient-to-r from-blue-600 to-indigo-600 lg:hover:from-blue-700 lg:hover:to-indigo-700"
                        data-testid="button-submit-revolve"
                      >
                        {revolveLoanMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Revolving...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Revolve Loan
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
                  <p className="font-medium" data-testid="text-revolve-bank">{bankName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reference Number</p>
                  <p className="font-medium" data-testid="text-revolve-reference">{loanData.referenceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Loan Amount</p>
                  <p className="font-medium" data-testid="text-revolve-amount">
                    {parseFloat(loanData.amount || "0").toLocaleString()} SAR
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Status</p>
                  <Badge 
                    variant={loanData.status === 'active' ? 'default' : 'secondary'}
                    data-testid="badge-revolve-status"
                  >
                    {loanData.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-900 dark:text-blue-100">
                  <FileText className="h-5 w-5" />
                  <span>About Revolving</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                  <p>• Updates the loan period with new dates and SIBOR rate</p>
                  <p>• Loan reference number remains unchanged</p>
                  <p>• Loan amount stays the same</p>
                  <p>• Margin is inherited from facility (constant)</p>
                  <p>• Use Edit Loan if bank changes the reference number</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
