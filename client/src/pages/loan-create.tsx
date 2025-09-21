import { useState } from "react";
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
import { insertLoanSchema, Facility, Bank, Loan, CreditLine } from "@shared/schema";
import { SiborRate } from "@shared/types";
import { z } from "zod";
import { 
  ArrowLeft, 
  AlertCircle, 
  DollarSign, 
  Calendar, 
  FileText, 
  Building,
  CreditCard,
  TrendingUp,
  CheckCircle
} from "lucide-react";
import { Link } from "wouter";

const loanFormSchema = insertLoanSchema
  .omit({ userId: true, bankRate: true })
  .extend({
    facilityId: z.string().min(1, "Please select a facility"),
    creditLineId: z.string().optional(),
    referenceNumber: z.string().min(1, "Reference number is required"),
    amount: z.string().min(1, "Amount is required").refine((val) => {
      const amount = parseFloat(val);
      return amount > 0;
    }, "Amount must be greater than 0"),
    startDate: z.string().min(1, "Start date is required"),
    dueDate: z.string().min(1, "Due date is required"),
    chargesDueDate: z.string().optional(),
    siborRate: z.string().min(1, "SIBOR rate is required"),
    siborTerm: z.string().optional(),
    notes: z.string().optional(),
  });

type LoanFormData = z.infer<typeof loanFormSchema>;

export default function LoanCreatePage() {
  const { bankId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: banks } = useQuery<Array<Bank>>({
    queryKey: ["/api/banks"],
  });

  const { data: facilities, isLoading: facilitiesLoading } = useQuery<Array<Facility & { bank: Bank }>>({
    queryKey: ["/api/facilities"],
  });

  const { data: siborRate } = useQuery<SiborRate>({
    queryKey: ["/api/sibor-rate"],
  });

  const { data: creditLines } = useQuery<Array<CreditLine & { facility: Facility & { bank: Bank } }>>({ 
    queryKey: ["/api/credit-lines"],
  });

  const { data: activeLoans } = useQuery<Array<Loan & { creditLine?: CreditLine & { facility: Facility & { bank: Bank } } }>>({ 
    queryKey: ["/api/loans"],
    queryFn: async () => {
      const response = await fetch('/api/loans?status=active');
      if (!response.ok) throw new Error('Failed to fetch active loans');
      return response.json();
    },
  });

  // Get current bank info
  const currentBank = banks?.find(bank => bank.id === bankId);
  
  // Filter facilities for current bank
  const bankFacilities = facilities?.filter(facility => facility.bankId === bankId) || [];

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      referenceNumber: "",
      amount: "",
      facilityId: "",
      creditLineId: "",
      startDate: new Date().toISOString().split('T')[0],
      dueDate: "",
      chargesDueDate: "",
      siborRate: siborRate?.rate?.toString() || "",
      siborTerm: "3M",
      notes: "",
    },
  });

  // Watch facility selection
  const selectedFacilityId = form.watch("facilityId");
  const selectedFacility = bankFacilities.find(f => f.id === selectedFacilityId);

  const createLoanMutation = useMutation({
    mutationFn: async (data: LoanFormData) => {
      const loanData = {
        ...data,
        amount: parseFloat(data.amount),
        siborRate: parseFloat(data.siborRate),
        bankRate: selectedFacility ? parseFloat(selectedFacility.costOfFunding) : 0,
      };
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loanData),
      });
      if (!response.ok) throw new Error('Failed to create loan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      toast({
        title: "Success",
        description: "Loan created successfully",
      });
      setLocation(`/banks/${bankId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create loan",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoanFormData) => {
    createLoanMutation.mutate(data);
  };

  // Calculate used credit for selected facility
  const calculateUsedCredit = (facilityId: string) => {
    if (!activeLoans || !creditLines) return 0;
    
    const facilityCreditLines = creditLines.filter(cl => cl.facilityId === facilityId);
    const facilityCreditLineIds = facilityCreditLines.map(cl => cl.id);
    
    return activeLoans
      .filter(loan => loan.creditLineId && facilityCreditLineIds.includes(loan.creditLineId))
      .reduce((sum, loan) => sum + parseFloat(loan.amount), 0);
  };

  const getCreditInfo = () => {
    if (!selectedFacility) return null;
    
    const totalCreditLimit = parseFloat(selectedFacility.creditLimit);
    const usedCredit = calculateUsedCredit(selectedFacility.id);
    const availableCredit = totalCreditLimit - usedCredit;
    
    return {
      totalCreditLimit,
      usedCredit,
      availableCredit,
      utilizationPercent: totalCreditLimit > 0 ? (usedCredit / totalCreditLimit) * 100 : 0
    };
  };
  
  const creditInfo = getCreditInfo();

  const calculateInterest = () => {
    const amount = parseFloat(form.watch("amount") || "0");
    const siborRate = parseFloat(form.watch("siborRate") || "0");
    const bankRate = selectedFacility ? parseFloat(selectedFacility.costOfFunding) : 0;
    const totalRate = siborRate + bankRate;
    
    if (amount > 0 && totalRate > 0) {
      const startDate = new Date(form.watch("startDate"));
      const dueDate = new Date(form.watch("dueDate"));
      const daysDiff = Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
      
      if (daysDiff > 0) {
        const totalInterest = (amount * totalRate / 100) * (daysDiff / 365);
        return totalInterest;
      }
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Header with Breadcrumbs */}
        <div className="flex items-center space-x-4">
          <Link href={`/banks/${bankId}`}>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {currentBank?.name || 'Bank'}
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Building className="h-4 w-4" />
            <span>{currentBank?.name}</span>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">New Loan</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center space-x-2">
                  <FileText className="h-6 w-6 text-emerald-600" />
                  <span>Create New Loan</span>
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400">
                  Create a new loan drawdown from {currentBank?.name}'s available facilities
                </p>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Facility Selection */}
                    <FormField
                      control={form.control}
                      name="facilityId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Facility *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={facilitiesLoading}>
                            <FormControl>
                              <SelectTrigger data-testid="select-facility">
                                <SelectValue placeholder="Select a bank facility" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {bankFacilities?.map((facility) => (
                                <SelectItem key={facility.id} value={facility.id}>
                                  <div className="flex flex-col">
                                    <span>{facility.facilityType.replace('_', ' ').toUpperCase()}</span>
                                    <span className="text-xs text-muted-foreground">
                                      Credit Limit: {parseFloat(facility.creditLimit).toLocaleString()} SAR | SIBOR + {facility.costOfFunding}%
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

                    {/* Loan Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="referenceNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reference Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter loan reference" {...field} data-testid="input-reference" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Loan Amount (SAR) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                {...field} 
                                data-testid="input-amount"
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
                              <Input type="date" {...field} data-testid="input-start-date" />
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
                              <Input type="date" {...field} data-testid="input-due-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* SIBOR Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="siborRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SIBOR Rate (%) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="5.75" 
                                {...field} 
                                data-testid="input-sibor-rate"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="siborTerm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SIBOR Term</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-sibor-term">
                                  <SelectValue placeholder="Select term" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1M">1 Month</SelectItem>
                                <SelectItem value="3M">3 Months</SelectItem>
                                <SelectItem value="6M">6 Months</SelectItem>
                                <SelectItem value="12M">12 Months</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional notes about this loan..." 
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

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-3 pt-6">
                      <Link href={`/banks/${bankId}`}>
                        <Button 
                          type="button" 
                          variant="outline"
                          data-testid="button-cancel"
                        >
                          Cancel
                        </Button>
                      </Link>
                      <Button 
                        type="submit" 
                        disabled={createLoanMutation.isPending}
                        className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white shadow-lg"
                        data-testid="button-create-loan"
                      >
                        {createLoanMutation.isPending ? "Creating..." : "Create Loan"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar with Information */}
          <div className="space-y-6">
            {/* Credit Information */}
            {creditInfo && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <span>Credit Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Credit Limit:</span>
                      <span className="font-medium">{creditInfo.totalCreditLimit.toLocaleString()} SAR</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Used Credit:</span>
                      <span className="font-medium">{creditInfo.usedCredit.toLocaleString()} SAR</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Available Credit:</span>
                      <span className="font-medium text-emerald-600">{creditInfo.availableCredit.toLocaleString()} SAR</span>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <span>Utilization</span>
                      <span>{creditInfo.utilizationPercent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          creditInfo.utilizationPercent > 80 ? 'bg-red-500' :
                          creditInfo.utilizationPercent > 60 ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(creditInfo.utilizationPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Interest Preview */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  <span>Interest Calculation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedFacility && form.watch("amount") && form.watch("siborRate") && form.watch("startDate") && form.watch("dueDate") ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">SIBOR Rate:</span>
                      <span>{form.watch("siborRate")}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Bank Rate:</span>
                      <span>{selectedFacility.costOfFunding}%</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Total Rate:</span>
                      <span>{(parseFloat(form.watch("siborRate") || "0") + parseFloat(selectedFacility.costOfFunding)).toFixed(2)}%</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Expected Interest:</span>
                      <span className="text-emerald-600">{calculateInterest().toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Fill in the form to see interest calculation
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current SIBOR Rate */}
            {siborRate && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <span>Current SIBOR</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{siborRate.rate}%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {siborRate.monthlyChange > 0 ? '↗' : siborRate.monthlyChange < 0 ? '↘' : '→'} 
                      {Math.abs(siborRate.monthlyChange)}% this month
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}