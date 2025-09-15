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
import { apiRequest } from "@/lib/queryClient";
import { insertLoanSchema, Facility, Bank } from "@shared/schema";
import { SiborRate } from "@shared/types";
import { z } from "zod";

const loanFormSchema = insertLoanSchema.extend({
  facilityId: z.string().min(1, "Please select a facility"),
  referenceNumber: z.string().min(1, "Reference number is required"),
  amount: z.string().min(1, "Amount is required"),
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

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      referenceNumber: "",
      amount: "",
      startDate: new Date().toISOString().split('T')[0],
      dueDate: "",
      chargesDueDate: "",
      siborRate: siborRate?.rate?.toString() || "5.75",
      notes: "",
    },
  });

  const createLoanMutation = useMutation({
    mutationFn: async (data: LoanFormData) => {
      // Get the selected facility to determine bank rate
      const selectedFacility = facilities?.find(f => f.id === data.facilityId);
      if (!selectedFacility) {
        throw new Error("Selected facility not found");
      }

      const loanData = {
        ...data,
        amount: parseFloat(data.amount).toString(),
        siborRate: parseFloat(data.siborRate).toString(),
        bankRate: selectedFacility.costOfFunding,
      };

      await apiRequest("POST", "/api/loans", loanData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Loan created successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create loan",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoanFormData) => {
    createLoanMutation.mutate(data);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onCancel, 150);
  };

  const selectedFacility = facilities?.find(f => f.id === form.watch("facilityId"));
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
                          {facility.bank?.name || 'Unknown Bank'} - {facility.facilityType.replace('_', ' ')} 
                          (SIBOR + {facility.costOfFunding}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
