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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loan, Bank, Facility } from "@shared/schema";
import { z } from "zod";
import { 
  ArrowLeft, 
  DollarSign, 
  Calculator, 
  Receipt,
  AlertCircle,
  CheckCircle,
  TrendingDown
} from "lucide-react";
import { Link } from "wouter";

const paymentFormSchema = z.object({
  loanId: z.string().min(1, "Please select a loan"),
  amount: z.string().min(1, "Payment amount is required").refine((val) => {
    const amount = parseFloat(val);
    return amount > 0;
  }, "Payment amount must be greater than 0"),
  paymentDate: z.string().min(1, "Payment date is required"),
  reference: z.string().optional(),
  memo: z.string().optional(),
  allocationType: z.enum(["standard", "custom"]).default("standard"),
  customAllocation: z.object({
    interestAmount: z.string().default("0"),
    principalAmount: z.string().default("0"),
    feesAmount: z.string().default("0")
  }).optional()
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface LoanBalance {
  principal: number;
  interest: number;
  fees: number;
  total: number;
}

export default function PaymentCreatePage() {
  const { loanId } = useParams<{ loanId?: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedLoan, setSelectedLoan] = useState<(Loan & { creditLine: any; bank: Bank }) | null>(null);
  const [loanBalance, setLoanBalance] = useState<LoanBalance | null>(null);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      loanId: loanId || "",
      amount: "",
      paymentDate: new Date().toISOString().split('T')[0],
      reference: "",
      memo: "",
      allocationType: "standard",
      customAllocation: {
        interestAmount: "0",
        principalAmount: "0",
        feesAmount: "0"
      }
    },
  });

  const allocationType = form.watch("allocationType");
  const paymentAmount = parseFloat(form.watch("amount") || "0");
  const customAllocation = form.watch("customAllocation");

  // Fetch active loans
  const { data: activeLoans, isLoading: loansLoading } = useQuery({
    queryKey: ["/api/loans"],
  });

  // Fetch loan balance when a loan is selected
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ["/api/loans", form.watch("loanId"), "balance"],
    queryFn: async () => {
      const loanId = form.watch("loanId");
      if (!loanId) return null;
      const response = await fetch(`/api/loans/${loanId}/balance`);
      if (!response.ok) throw new Error('Failed to fetch balance');
      return response.json();
    },
    enabled: !!form.watch("loanId"),
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const payload = {
        loanId: data.loanId,
        amount: parseFloat(data.amount),
        date: data.paymentDate,
        reference: data.reference || null,
        memo: data.memo || null,
        allocation: data.allocationType === "custom" && data.customAllocation ? {
          interest: parseFloat(data.customAllocation.interestAmount),
          principal: parseFloat(data.customAllocation.principalAmount),
          fees: parseFloat(data.customAllocation.feesAmount)
        } : null // null means use standard allocation
      };
      
      const response = await fetch(`/api/loans/${data.loanId}/repayments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to process payment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Success",
        description: "Payment processed successfully",
      });
      setLocation("/loans");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to process payment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    createPaymentMutation.mutate(data);
  };

  // Calculate standard allocation preview
  const calculateStandardAllocation = (amount: number, balance: LoanBalance) => {
    if (!balance || amount <= 0) return { interest: 0, principal: 0, fees: 0 };
    
    let remaining = amount;
    const allocation = { fees: 0, interest: 0, principal: 0 };
    
    // Pay fees first
    allocation.fees = Math.min(remaining, balance.fees);
    remaining -= allocation.fees;
    
    // Pay interest second
    allocation.interest = Math.min(remaining, balance.interest);
    remaining -= allocation.interest;
    
    // Pay principal last
    allocation.principal = Math.min(remaining, balance.principal);
    
    return allocation;
  };

  // Validate custom allocation
  const validateCustomAllocation = () => {
    if (allocationType !== "custom" || !customAllocation) return true;
    
    const totalCustom = 
      parseFloat(customAllocation.interestAmount) +
      parseFloat(customAllocation.principalAmount) +
      parseFloat(customAllocation.feesAmount);
    
    return Math.abs(totalCustom - paymentAmount) < 0.01; // Allow small rounding differences
  };

  const standardAllocation = balanceData && (balanceData as any).principal !== undefined ? 
    calculateStandardAllocation(paymentAmount, balanceData as LoanBalance) : null;
  const customAllocationValid = validateCustomAllocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/loans">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Loans
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Receipt className="h-4 w-4" />
            <span className="text-gray-900 dark:text-gray-100 font-medium">Process Payment</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Payment Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center space-x-2">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                  <span>Process Payment</span>
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400">
                  Record a payment against an active loan with flexible allocation options
                </p>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Loan Selection */}
                    <FormField
                      control={form.control}
                      name="loanId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Loan *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={loansLoading}>
                            <FormControl>
                              <SelectTrigger data-testid="select-loan">
                                <SelectValue placeholder="Select a loan to make payment" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.isArray(activeLoans) && activeLoans.map((loan: any) => (
                                <SelectItem key={loan.id} value={loan.id}>
                                  <div className="flex flex-col">
                                    <span>{loan.referenceNumber}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {loan.creditLine?.facility?.bank?.name} | {parseFloat(loan.amount).toLocaleString()} SAR
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

                    {/* Payment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Amount (SAR) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0.00" 
                                {...field} 
                                data-testid="input-amount"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="paymentDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Date *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-payment-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="reference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reference Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Payment reference" {...field} data-testid="input-reference" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="memo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Memo</FormLabel>
                            <FormControl>
                              <Input placeholder="Optional description" {...field} data-testid="input-memo" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Allocation Type Selection */}
                    <FormField
                      control={form.control}
                      name="allocationType"
                      render={({ field }) => (
                        <FormItem className="space-y-4">
                          <FormLabel className="text-base font-semibold">Payment Allocation Method</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="space-y-4"
                            >
                              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                                <RadioGroupItem value="standard" id="standard" className="mt-1" />
                                <div className="space-y-1">
                                  <Label htmlFor="standard" className="font-medium">
                                    Standard Allocation (Recommended)
                                  </Label>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Follows Saudi banking regulations: Fees → Interest → Principal
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                                <RadioGroupItem value="custom" id="custom" className="mt-1" />
                                <div className="space-y-1">
                                  <Label htmlFor="custom" className="font-medium">
                                    Custom Allocation
                                  </Label>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Specify exact amounts for each component per agreement
                                  </p>
                                </div>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Custom Allocation Fields */}
                    {allocationType === "custom" && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-4">
                        <h4 className="font-medium text-blue-800 dark:text-blue-200 flex items-center space-x-2">
                          <Calculator className="h-4 w-4" />
                          <span>Custom Payment Allocation</span>
                        </h4>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="customAllocation.feesAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fees (SAR)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01"
                                    placeholder="0.00" 
                                    {...field} 
                                    data-testid="input-fees"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="customAllocation.interestAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Interest (SAR)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01"
                                    placeholder="0.00" 
                                    {...field} 
                                    data-testid="input-interest"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="customAllocation.principalAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Principal (SAR)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01"
                                    placeholder="0.00" 
                                    {...field} 
                                    data-testid="input-principal"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {!customAllocationValid && paymentAmount > 0 && (
                          <div className="flex items-center space-x-2 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">
                              Custom allocation total must equal payment amount ({paymentAmount.toFixed(2)} SAR)
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex items-center justify-end space-x-3 pt-6">
                      <Link href="/loans">
                        <Button type="button" variant="outline" data-testid="button-cancel">
                          Cancel
                        </Button>
                      </Link>
                      <Button 
                        type="submit" 
                        disabled={createPaymentMutation.isPending || !customAllocationValid}
                        className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white shadow-lg"
                        data-testid="button-process-payment"
                      >
                        {createPaymentMutation.isPending ? "Processing..." : "Process Payment"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Payment Preview Sidebar */}
          <div className="space-y-6">
            {/* Loan Balance Information */}
            {balanceData && (balanceData as any).principal !== undefined && form.watch("loanId") && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <TrendingDown className="h-5 w-5 text-blue-600" />
                    <span>Current Balance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Principal:</span>
                      <span className="font-medium">{(balanceData as any).principal?.toLocaleString()} SAR</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Interest:</span>
                      <span className="font-medium">{(balanceData as any).interest?.toLocaleString()} SAR</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Fees:</span>
                      <span className="font-medium">{(balanceData as any).fees?.toLocaleString()} SAR</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total Owed:</span>
                      <span className="text-red-600">{(balanceData as any).total?.toLocaleString()} SAR</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Allocation Preview */}
            {paymentAmount > 0 && balanceData && (balanceData as any).principal !== undefined && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Calculator className="h-5 w-5 text-emerald-600" />
                    <span>Payment Allocation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {allocationType === "standard" && standardAllocation && (
                    <div className="space-y-3">
                      <Badge className="w-full justify-center bg-green-100 text-green-800">
                        Standard Allocation
                      </Badge>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">To Fees:</span>
                          <span className="font-medium">{standardAllocation.fees.toLocaleString()} SAR</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">To Interest:</span>
                          <span className="font-medium">{standardAllocation.interest.toLocaleString()} SAR</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">To Principal:</span>
                          <span className="font-medium">{standardAllocation.principal.toLocaleString()} SAR</span>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Remaining After Payment:</h5>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Principal:</span>
                          <span className="font-medium">{((balanceData as any).principal - standardAllocation.principal).toLocaleString()} SAR</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Interest:</span>
                          <span className="font-medium">{((balanceData as any).interest - standardAllocation.interest).toLocaleString()} SAR</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Fees:</span>
                          <span className="font-medium">{((balanceData as any).fees - standardAllocation.fees).toLocaleString()} SAR</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>New Total:</span>
                          <span className="text-emerald-600">{((balanceData as any).total - paymentAmount).toLocaleString()} SAR</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {allocationType === "custom" && customAllocation && (
                    <div className="space-y-3">
                      <Badge className="w-full justify-center bg-blue-100 text-blue-800">
                        Custom Allocation
                      </Badge>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">To Fees:</span>
                          <span className="font-medium">{parseFloat(customAllocation.feesAmount || "0").toLocaleString()} SAR</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">To Interest:</span>
                          <span className="font-medium">{parseFloat(customAllocation.interestAmount || "0").toLocaleString()} SAR</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">To Principal:</span>
                          <span className="font-medium">{parseFloat(customAllocation.principalAmount || "0").toLocaleString()} SAR</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}