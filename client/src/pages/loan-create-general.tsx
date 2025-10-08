import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertLoanSchema, Facility, Bank, Loan, CreditLine } from "@shared/schema";
import { SiborRate } from "@shared/types";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { 
  ArrowLeft, 
  FileText, 
  Building,
  CreditCard,
  Calendar,
  DollarSign,
  Save,
  X,
  Calculator,
  AlertTriangle
} from "lucide-react";

import { Link } from "wouter";
import { formatFacilityType } from "@/lib/formatters";

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

export default function GeneralLoanCreatePage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [siborInputMode, setSiborInputMode] = useState<"standard" | "custom">("standard");

  // Get facilities and banks for selection
  const { data: facilities, isLoading: facilitiesLoading } = useQuery<Array<Facility & { bank: Bank }>>({
    queryKey: ["/api/facilities"],
    enabled: isAuthenticated,
  });

  // Get current SIBOR rate
  const { data: siborData } = useQuery<SiborRate>({
    queryKey: ["/api/sibor-rate"],
    enabled: isAuthenticated,
  });

  // Get credit lines for facility selection
  const { data: creditLines } = useQuery<Array<CreditLine & { facility: Facility & { bank: Bank } }>>({
    queryKey: ["/api/credit-lines"],
    enabled: isAuthenticated,
  });

  // Get active loans for credit calculation  
  const { data: activeLoans } = useQuery<Array<Loan & { creditLine?: CreditLine & { facility: Facility & { bank: Bank } } }>>({
    queryKey: ["/api/loans", "active"],
    queryFn: async () => {
      const response = await fetch('/api/loans?status=active');
      if (!response.ok) throw new Error('Failed to fetch active loans');
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      referenceNumber: "",
      amount: "",
      facilityId: "",
      creditLineId: "auto-assign",
      startDate: new Date().toISOString().split('T')[0],
      dueDate: "",
      chargesDueDate: "",
      siborRate: siborData?.rate?.toString() || "",
      siborTerm: "3M",
      customSiborMonths: "",
      notes: "",
    },
  });

  // Update SIBOR rate when data loads
  React.useEffect(() => {
    if (siborData?.rate && !form.getValues('siborRate')) {
      form.setValue("siborRate", siborData.rate.toString());
    }
  }, [siborData, form]);

  // Get selected facility details
  const selectedFacilityId = form.watch("facilityId");
  const selectedFacility = useMemo(() => {
    return facilities?.find((f: Facility & { bank: Bank }) => f.id === selectedFacilityId);
  }, [facilities, selectedFacilityId]);

  // Calculate used credit for selected facility
  const calculateUsedCredit = (facilityId: string) => {
    if (!activeLoans || !creditLines) return 0;
    
    const facilityCreditLines = creditLines.filter(cl => cl.facilityId === facilityId);
    const facilityCreditLineIds = facilityCreditLines.map(cl => cl.id);
    
    return activeLoans
      .filter(loan => loan.creditLineId && facilityCreditLineIds.includes(loan.creditLineId))
      .reduce((sum, loan) => sum + parseFloat(loan.amount), 0);
  };

  // Calculate credit information for selected facility
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

  // Calculate interest based on form values
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

  const totalInterest = calculateInterest();

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
        creditLineId: data.creditLineId === "auto-assign" ? undefined : data.creditLineId,
        // Convert custom months to siborTermMonths for backend
        siborTermMonths: data.customSiborMonths ? parseInt(data.customSiborMonths) : 
                        data.siborTerm === "1M" ? 1 :
                        data.siborTerm === "2M" ? 2 :
                        data.siborTerm === "3M" ? 3 :
                        data.siborTerm === "6M" ? 6 :
                        data.siborTerm === "12M" ? 12 : 3,
      };
      
      return apiRequest('POST', '/api/loans', loanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loans", "active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/facilities"] });
      toast({ 
        title: "Loan created successfully",
        description: "The loan has been added to your portfolio."
      });
      setLocation("/loans");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create loan", 
        description: error.message || "An error occurred while creating the loan",
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: LoanFormData) => {
    // Show warning if loan exceeds available credit, but allow creation
    if (creditInfo) {
      const loanAmount = parseFloat(data.amount);
      if (loanAmount > creditInfo.availableCredit) {
        toast({
          title: "Warning: Exceeding Available Credit",
          description: `Loan amount (${loanAmount.toLocaleString()} SAR) exceeds available credit (${creditInfo.availableCredit.toLocaleString()} SAR). Proceeding with loan creation.`,
        });
      }
    }

    createLoanMutation.mutate(data);
  };

  if (isLoading || !facilities) {
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
              <Link href="/loans">
                <Button variant="ghost" size="sm" data-testid="button-back-loans">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Loans
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="w-10 h-10 bg-saudi text-white rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Create New Loan</h1>
                <p className="text-sm text-muted-foreground">Set up a new loan drawdown</p>
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
                  <FileText className="h-5 w-5 text-primary" />
                  <span>Loan Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Facility Selection */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center space-x-2">
                        <Building className="h-4 w-4" />
                        <span>Bank Facility</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="facilityId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bank Facility *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value} disabled={facilitiesLoading}>
                                <FormControl>
                                  <SelectTrigger className="h-12" data-testid="select-facility">
                                    <SelectValue placeholder="Select a bank facility" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {facilities?.map((facility) => (
                                    <SelectItem key={facility.id} value={facility.id}>
                                      <div className="flex flex-col">
                                        <span>{facility.bank?.name || 'Unknown Bank'} - {formatFacilityType(facility.facilityType)}</span>
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
                        
                        <FormField
                          control={form.control}
                          name="creditLineId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Credit Line (Optional)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || "auto-assign"}>
                                <FormControl>
                                  <SelectTrigger className="h-12" data-testid="select-credit-line">
                                    <SelectValue placeholder="Auto-assign or select specific line" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="auto-assign">Auto-assign</SelectItem>
                                  {creditLines?.filter(cl => cl.facilityId === selectedFacilityId).map((creditLine) => (
                                    <SelectItem key={creditLine.id} value={creditLine.id}>
                                      <div className="flex flex-col">
                                        <span>Line #{creditLine.lineNumber}</span>
                                        <span className="text-xs text-muted-foreground">
                                          Limit: {parseFloat(creditLine.creditLimit).toLocaleString()} SAR
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
                      </div>

                      {/* Credit Limit Information */}
                      {creditInfo && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <h4 className="font-medium text-green-800 dark:text-green-200">Credit Facility Information</h4>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-green-700 dark:text-green-300">Total Credit Limit:</span>
                              <div className="font-medium">{creditInfo.totalCreditLimit.toLocaleString()} SAR</div>
                            </div>
                            <div>
                              <span className="text-green-700 dark:text-green-300">Used Credit:</span>
                              <div className="font-medium">{creditInfo.usedCredit.toLocaleString()} SAR</div>
                            </div>
                            <div>
                              <span className="text-green-700 dark:text-green-300">Available Credit:</span>
                              <div className="font-medium text-green-900 dark:text-green-100">{creditInfo.availableCredit.toLocaleString()} SAR</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Loan Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center space-x-2">
                        <Calculator className="h-4 w-4" />
                        <span>Loan Information</span>
                      </h3>
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
                                  data-testid="input-amount" 
                                  type="number" 
                                  placeholder="e.g., 500000" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="referenceNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reference Number</FormLabel>
                              <FormControl>
                                <Input 
                                  className="h-12"
                                  data-testid="input-reference" 
                                  placeholder="Optional loan reference" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
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
                        
                        <FormField
                          control={form.control}
                          name="siborTerm"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SIBOR Term</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || "3M"}>
                                <FormControl>
                                  <SelectTrigger className="h-12" data-testid="select-sibor-term">
                                    <SelectValue placeholder="Select SIBOR term" />
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

                        {/* Interest Calculation Display */}
                        {totalInterest > 0 && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="text-sm text-blue-700 dark:text-blue-300">Estimated Interest</div>
                            <div className="font-bold text-blue-900 dark:text-blue-100">{totalInterest.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} SAR</div>
                            <div className="text-xs text-blue-600 dark:text-blue-400">
                              Total Rate: {selectedFacility ? (parseFloat(form.watch("siborRate") || "0") + parseFloat(selectedFacility.costOfFunding)).toFixed(2) : 0}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

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
                                        className="h-12"
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
                                    <p className="font-medium">Estimated SIBOR Rate:</p>
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
                          Dates auto-adjust for Saudi weekends (Friday-Saturday)
                        </p>
                      </div>
                    )}

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
                                  className="h-12"
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
                          name="dueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Due Date *</FormLabel>
                              <FormControl>
                                <Input 
                                  className="h-12"
                                  data-testid="input-due-date" 
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
                          name="chargesDueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Charges Due Date</FormLabel>
                              <FormControl>
                                <Input 
                                  className="h-12"
                                  data-testid="input-charges-due-date" 
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

                    {/* Notes */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Additional Information</h3>
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
                                {...field} 
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
                        onClick={() => setLocation("/loans")}
                        data-testid="button-cancel-loan"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createLoanMutation.isPending}
                        className="h-12 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                        data-testid="button-save-loan"
                      >
                        {createLoanMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Create Loan
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
                  <span>SIBOR Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground space-y-2">
                  <div><span className="font-medium">Current Rate:</span> {siborData?.rate || 'Loading...'}%</div>
                  <div><span className="font-medium">Last Updated:</span> {siborData?.lastUpdate || 'N/A'}</div>
                  <div><span className="font-medium">Monthly Change:</span> {siborData?.monthlyChange > 0 ? '+' : ''}{siborData?.monthlyChange || 0}%</div>
                  <Separator className="my-3" />
                  <p>• SIBOR rates are updated daily</p>
                  <p>• Total interest = (SIBOR + Bank Margin) × Principal</p>
                  <p>• Interest calculated on daily compounding basis</p>
                </div>
              </CardContent>
            </Card>

            {selectedFacility && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-primary" />
                    <span>Selected Facility</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-2">
                    <div><span className="font-medium">Bank:</span> {selectedFacility.bank?.name}</div>
                    <div><span className="font-medium">Type:</span> {selectedFacility.facilityType.replace('_', ' ')}</div>
                    <div><span className="font-medium">Bank Margin:</span> {selectedFacility.costOfFunding}%</div>
                    <div><span className="font-medium">Expiry:</span> {new Date(selectedFacility.expiryDate).toLocaleDateString()}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <span>Important Notes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>• Ensure sufficient credit limit is available</p>
                  <p>• Interest is calculated from start date</p>
                  <p>• Due date must be within facility expiry</p>
                  <p>• Reference number should be unique</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}