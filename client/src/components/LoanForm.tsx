import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertLoanSchema, Facility, Bank, Loan, CreditLine } from "@shared/schema";
import { SiborRate } from "@shared/types";
import { z } from "zod";
import { AlertCircle, DollarSign } from "lucide-react";

const loanFormSchema = insertLoanSchema.extend({
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
  notes: z.string().optional(),
});

type LoanFormData = z.infer<typeof loanFormSchema>;

interface LoanFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function LoanForm({ onSuccess, onCancel }: LoanFormProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);

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
      siborRate: siborRate?.rate?.toString() || "5.75",
      notes: "",
    },
  });

  const createLoanMutation = useMutation({
    mutationFn: async (data: LoanFormData) => {
      const amount = parseFloat(data.amount);
      
      // Get fresh data for validation
      const facility = facilities?.find(f => f.id === data.facilityId);
      if (!facility) throw new Error("Facility not found");
      
      const facilityUsedCredit = calculateUsedCredit(data.facilityId);
      const facilityAvailable = parseFloat(facility.creditLimit) - facilityUsedCredit;
      
      // Validate facility credit limit
      if (amount > facilityAvailable) {
        throw new Error(`Loan amount exceeds available facility credit. Available: ${facilityAvailable.toLocaleString()} SAR`);
      }
      
      // Validate credit line limit if selected
      if (data.creditLineId) {
        const creditLine = creditLines?.find(cl => cl.id === data.creditLineId);
        if (!creditLine) throw new Error("Credit line not found");
        
        const creditLineUsedCredit = activeLoans?.filter(loan => loan.creditLineId === data.creditLineId)
          .reduce((sum, loan) => sum + parseFloat(loan.amount), 0) || 0;
        const creditLineAvailable = parseFloat(creditLine.creditLimit) - creditLineUsedCredit;
        
        if (amount > creditLineAvailable) {
          throw new Error(`Loan amount exceeds available credit line limit. Available: ${creditLineAvailable.toLocaleString()} SAR`);
        }
      }

      const loanData = {
        ...data,
        amount: amount.toString(),
        siborRate: parseFloat(data.siborRate).toString(),
        bankRate: facility.costOfFunding,
        creditLineId: data.creditLineId || null,
      };

      await apiRequest("POST", "/api/loans", loanData);
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/facilities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credit-lines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      
      toast({
        title: "Success",
        description: "Loan created successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      console.error("❌ Loan creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create loan",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoanFormData) => {
    console.log("🚀 Form submitted with data:", data);
    console.log("🔍 Form errors:", form.formState.errors);
    createLoanMutation.mutate(data);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onCancel, 150);
  };

  const selectedFacility = facilities?.find(f => f.id === form.watch("facilityId"));
  const selectedCreditLineId = form.watch("creditLineId");
  const facilityId = form.watch("facilityId");
  
  // Calculate used credit for the selected facility
  const calculateUsedCredit = (facilityId: string) => {
    if (!activeLoans) return 0;
    return activeLoans
      .filter(loan => loan.facilityId === facilityId)
      .reduce((sum, loan) => sum + parseFloat(loan.amount), 0);
  };
  
  // Get available credit lines for selected facility
  const availableCreditLines = creditLines?.filter(cl => cl.facility.id === facilityId) || [];
  
  // Calculate credit limit and availability
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-loan-form">
        <DialogHeader>
          <DialogTitle>Add New Loan</DialogTitle>
        </DialogHeader>

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
                      {facilities?.map((facility) => (
                        <SelectItem key={facility.id} value={facility.id}>
                          <div className="flex flex-col">
                            <span>{facility.bank?.name || 'Unknown Bank'} - {facility.facilityType.replace('_', ' ')}</span>
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

            {/* Credit Limit Information */}
            {creditInfo && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium text-green-800">Credit Facility Information</h4>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-green-700">Total Credit Limit:</span>
                    <div className="font-medium">{creditInfo.totalCreditLimit.toLocaleString()} SAR</div>
                  </div>
                  <div>
                    <span className="text-green-700">Used Credit:</span>
                    <div className="font-medium">{creditInfo.usedCredit.toLocaleString()} SAR</div>
                  </div>
                  <div>
                    <span className="text-green-700">Available Credit:</span>
                    <div className="font-medium text-green-600">{creditInfo.availableCredit.toLocaleString()} SAR</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-green-700 mb-1">
                    <span>Credit Utilization</span>
                    <span>{creditInfo.utilizationPercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(creditInfo.utilizationPercent, 100)}%` }}
                    ></div>
                  </div>
                </div>
                {creditInfo.utilizationPercent > 80 && (
                  <div className="flex items-center gap-2 mt-3 text-amber-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs">Warning: High credit utilization</span>
                  </div>
                )}
              </div>
            )}

            {/* Credit Line Selection (if available) */}
            {availableCreditLines.length > 0 && (
              <FormField
                control={form.control}
                name="creditLineId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Line (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-credit-line">
                          <SelectValue placeholder="Select a credit line (or use general facility)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">
                          General Facility Credit
                        </SelectItem>
                        {availableCreditLines.map((creditLine) => (
                          <SelectItem key={creditLine.id} value={creditLine.id}>
                            <div className="flex flex-col">
                              <span>{creditLine.name}</span>
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
            )}

            {/* Loan Details */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="referenceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Number *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., SABB2024001" data-testid="input-reference-number" />
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
                        {...field} 
                        type="number" 
                        step="0.01" 
                        placeholder="e.g., 2500000"
                        data-testid="input-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Credit Limit Warning */}
            {creditInfo && parseFloat(form.watch("amount") || "0") > creditInfo.availableCredit && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <div className="font-medium">Amount exceeds available credit limit</div>
                  <div className="text-sm">
                    Exceeds by {(parseFloat(form.watch("amount") || "0") - creditInfo.availableCredit).toLocaleString()} SAR
                  </div>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" data-testid="input-start-date" />
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
                      <Input {...field} type="date" data-testid="input-due-date" />
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
                      <Input {...field} type="date" data-testid="input-charges-due-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Interest Rates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="siborRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current SIBOR Rate (%) *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.01" 
                        placeholder="5.75"
                        data-testid="input-sibor-rate"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Bank Rate (%)</Label>
                <div className="px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground">
                  {selectedFacility ? `SIBOR + ${selectedFacility.costOfFunding}%` : 'Select facility first'}
                </div>
              </div>
            </div>

            {/* Interest Calculation */}
            {calculateInterest() > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Interest Calculation</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Total Interest Rate:</span>
                    <span className="ml-2 font-medium">
                      {((parseFloat(form.watch("siborRate") || "0")) + 
                        (selectedFacility ? parseFloat(selectedFacility.costOfFunding) : 0)).toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Estimated Total Interest:</span>
                    <span className="ml-2 font-medium">
                      {calculateInterest().toLocaleString()} SAR
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Additional notes about this loan..."
                      rows={3}
                      data-testid="textarea-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                data-testid="button-cancel-loan"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createLoanMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-create-loan"
                onClick={(e) => {
                  console.log("🔥 Button clicked!");
                  console.log("🔍 Form state:", form.formState);
                  console.log("🔍 Form values:", form.getValues());
                  console.log("🔍 Form errors:", form.formState.errors);
                }}
              >
                {createLoanMutation.isPending ? "Creating..." : "Create Loan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
