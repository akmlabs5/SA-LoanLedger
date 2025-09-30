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
import { insertLoanSchema, Facility, Bank, Loan, CreditLine } from "@shared/schema";
import { SiborRate } from "@shared/types";
import { z } from "zod";
import { 
  ArrowLeft, 
  AlertCircle, 
 
  Calendar, 
  FileText, 
  Building,
  CreditCard,
  TrendingUp,
  CheckCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { formatFacilityType } from "@/lib/formatters";
import { ModernDatePicker } from "@/components/ui/date-picker";

const loanFormSchema = z.object({
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
  customSiborMonths: z.string().optional(),
  purpose: z.string().optional(),
  status: z.enum(["active", "settled", "overdue"]).default("active"),
  notes: z.string().optional(),
});

type LoanFormData = z.infer<typeof loanFormSchema>;

export default function LoanCreatePage() {
  const { bankId: paramBankId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [siborInputMode, setSiborInputMode] = useState<"standard" | "custom">("standard");

  // Get bankId from URL params or query string
  const urlParams = new URLSearchParams(window.location.search);
  const queryBankId = urlParams.get('bankId');
  const bankId = paramBankId || queryBankId || undefined;

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
  const currentBank = bankId ? banks?.find(bank => bank.id === bankId) : undefined;
  
  // Filter facilities for current bank if bankId is provided, otherwise show all
  const bankFacilities = bankId 
    ? (facilities?.filter(facility => facility.bankId === bankId) || [])
    : (facilities || []);

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      referenceNumber: "",
      amount: "",
      facilityId: "",
      creditLineId: "",
      startDate: new Date().toISOString().split('T')[0],
      dueDate: "",
      chargesDueDate: undefined,
      siborRate: siborRate?.rate?.toString() || "",
      siborTerm: "3M",
      customSiborMonths: "",
      notes: "",
    },
  });

  // Watch facility selection for non-cash guarantee routing
  const selectedFacilityId = form.watch("facilityId");
  const selectedFacility = bankFacilities.find(f => f.id === selectedFacilityId);
  
  // Redirect to guarantee form if non-cash guarantee facility is selected
  if (selectedFacility?.facilityType === "non_cash_guarantee") {
    setLocation("/guarantees/create");
    return null; // Prevent rendering while redirecting
  }
  
  // Update SIBOR rate when form loads
  React.useEffect(() => {
    if (siborRate?.rate && !form.getValues('siborRate')) {
      form.setValue('siborRate', siborRate.rate.toString());
    }
  }, [siborRate, form]);

  const createLoanMutation = useMutation({
    mutationFn: async (data: LoanFormData) => {
      const facilityMargin = selectedFacility?.costOfFunding || "0";
      
      // Ensure all numeric fields are converted to strings for API
      const loanData = {
        ...data,
        amount: data.amount.toString(), // Convert to string
        siborRate: data.siborRate.toString(), // Convert to string
        margin: facilityMargin.toString(), // Ensure margin is set as string
        bankRate: (parseFloat(data.siborRate) + parseFloat(facilityMargin)).toString(),
        // Convert custom months to siborTermMonths for backend
        siborTermMonths: data.customSiborMonths ? parseInt(data.customSiborMonths) : 
                        data.siborTerm === "1M" ? 1 :
                        data.siborTerm === "2M" ? 2 :
                        data.siborTerm === "3M" ? 3 :
                        data.siborTerm === "6M" ? 6 :
                        data.siborTerm === "12M" ? 12 : 3,
      };
      
      // Use apiRequest helper for consistency
      return apiRequest('POST', '/api/loans', loanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loans", "settled"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      toast({
        title: "Success",
        description: "Loan created successfully",
      });
      // Navigate to bank detail if bankId exists, otherwise to loans page
      setLocation(bankId ? `/banks/${bankId}` : "/loans");
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
    // Clean up date fields - convert empty strings to undefined
    const cleanedData = {
      ...data,
      chargesDueDate: data.chargesDueDate && data.chargesDueDate.trim() !== "" ? data.chargesDueDate : undefined,
    };
    createLoanMutation.mutate(cleanedData);
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
                  {currentBank 
                    ? `Create a new loan drawdown from ${currentBank.name}'s available facilities`
                    : "Create a new loan drawdown from your available bank facilities"
                  }
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
                                    <span>{formatFacilityType(facility.facilityType).toUpperCase()}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {!bankId && facility.bank ? `${facility.bank.name} | ` : ''}
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

                    {/* Optional Charges Due Date */}
                    <FormField
                      control={form.control}
                      name="chargesDueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Charges Due Date (Optional)</FormLabel>
                          <FormControl>
                            <ModernDatePicker 
                              value={field.value || ""} 
                              onChange={field.onChange}
                              placeholder="Select charges due date"
                              dataTestId="input-charges-due-date"
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            If different from loan due date, specify when interest/fees are due
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* SIBOR Terms Configuration */}
                    {form.watch("startDate") && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <h4 className="font-medium text-blue-800 dark:text-blue-200">SIBOR Terms & Due Date Calculator</h4>
                        </div>
                        
                        <Tabs value={siborInputMode} onValueChange={(value) => {
                          setSiborInputMode(value as "standard" | "custom");
                          // Clear conflicting fields when switching modes
                          if (value === "standard") {
                            form.setValue("customSiborMonths", "");
                          } else {
                            // Clear standard term selections by resetting to default
                            form.setValue("siborTerm", "");
                          }
                        }} className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="standard" data-testid="tab-standard-terms">Standard Terms</TabsTrigger>
                            <TabsTrigger value="custom" data-testid="tab-custom-terms">Custom Terms</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="standard" className="mt-4">
                            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                              Select a standard SIBOR term to auto-calculate due date:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { days: 30, label: "30 Days", siborTerm: "1M", siborRate: "5.25" },
                                { days: 60, label: "60 Days", siborTerm: "2M", siborRate: "5.35" }, 
                                { days: 90, label: "90 Days", siborTerm: "3M", siborRate: "5.45" },
                                { days: 180, label: "180 Days", siborTerm: "6M", siborRate: "5.65" },
                                { days: 360, label: "360 Days", siborTerm: "12M", siborRate: "5.85" }
                              ].map(({ days, label, siborTerm, siborRate }) => {
                                const startDate = new Date(form.watch("startDate"));
                                const dueDate = new Date(startDate);
                                dueDate.setDate(startDate.getDate() + days);
                                
                                // Saudi business day adjustment (Friday=5, Saturday=6)
                                while (dueDate.getDay() === 5 || dueDate.getDay() === 6) {
                                  dueDate.setDate(dueDate.getDate() + 1);
                                }
                                
                                const dueDateString = dueDate.toISOString().split('T')[0];
                                const isSelected = form.watch("dueDate") === dueDateString;
                                
                                return (
                                  <Button
                                    key={days}
                                    type="button"
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    className={`text-xs hover:bg-blue-100 dark:hover:bg-blue-900/30 flex-col h-auto py-2 px-3 ${isSelected ? "bg-blue-600 text-white" : ""}`}
                                    onClick={() => {
                                      form.setValue("dueDate", dueDateString);
                                      form.setValue("siborTerm", siborTerm);
                                      form.setValue("siborRate", siborRate);
                                      form.setValue("customSiborMonths", "");
                                    }}
                                    data-testid={`button-${days}-days`}
                                  >
                                    <span>{label}</span>
                                    <span className="text-xs opacity-75 mt-1">
                                      {dueDate.toLocaleDateString('en-SA')}
                                    </span>
                                  </Button>
                                );
                              })}
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="custom" className="mt-4">
                            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                              Enter custom SIBOR term for non-standard loan durations:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <FormField
                                control={form.control}
                                name="customSiborMonths"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Custom Term (Months)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        min="1" 
                                        max="60" 
                                        placeholder="e.g., 2" 
                                        {...field} 
                                        data-testid="input-custom-months"
                                        onChange={(e) => {
                                          field.onChange(e);
                                          const months = parseInt(e.target.value);
                                          if (months && form.watch("startDate")) {
                                            const startDate = new Date(form.watch("startDate"));
                                            const dueDate = new Date(startDate);
                                            dueDate.setMonth(startDate.getMonth() + months);
                                            
                                            // Saudi business day adjustment
                                            while (dueDate.getDay() === 5 || dueDate.getDay() === 6) {
                                              dueDate.setDate(dueDate.getDate() + 1);
                                            }
                                            
                                            const dueDateString = dueDate.toISOString().split('T')[0];
                                            form.setValue("dueDate", dueDateString);
                                            form.setValue("siborTerm", `${months}M`);
                                            
                                            // Estimate SIBOR rate based on term length
                                            let estimatedRate = "5.75";
                                            if (months <= 1) estimatedRate = "5.25";
                                            else if (months <= 3) estimatedRate = "5.45";
                                            else if (months <= 6) estimatedRate = "5.65";
                                            else if (months <= 12) estimatedRate = "5.85";
                                            else estimatedRate = "6.05";
                                            
                                            form.setValue("siborRate", estimatedRate);
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="text-sm text-blue-700 dark:text-blue-300 flex flex-col justify-center">
                                {form.watch("customSiborMonths") && form.watch("dueDate") && (
                                  <>
                                    <p className="font-medium">Calculated Due Date:</p>
                                    <p className="text-blue-800 dark:text-blue-200">
                                      {new Date(form.watch("dueDate")).toLocaleDateString('en-SA')}
                                    </p>
                                  </>
                                )}
                              </div>
                              <div className="text-sm text-blue-700 dark:text-blue-300 flex flex-col justify-center">
                                {form.watch("customSiborMonths") && form.watch("siborRate") && (
                                  <>
                                    <p className="font-medium">Estimated SIBOR:</p>
                                    <p className="text-blue-800 dark:text-blue-200">
                                      {form.watch("siborRate")}%
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                        
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
                          <strong>Weekend Adjustment:</strong> If a calculated due date falls on a Saudi weekend (Friday or Saturday), it automatically rolls forward to the next business day (Sunday). Dates are never moved backward.
                        </p>
                      </div>
                    )}

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
                                <SelectItem value="2M">2 Months</SelectItem>
                                <SelectItem value="3M">3 Months</SelectItem>
                                <SelectItem value="6M">6 Months</SelectItem>
                                <SelectItem value="12M">12 Months</SelectItem>
                                {/* Show custom term if it doesn't match standard options */}
                                {field.value && !["1M", "2M", "3M", "6M", "12M"].includes(field.value) && (
                                  <SelectItem value={field.value}>
                                    {field.value} (Custom)
                                  </SelectItem>
                                )}
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
                    <span className="text-blue-600 font-bold text-xl">﷼</span>
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