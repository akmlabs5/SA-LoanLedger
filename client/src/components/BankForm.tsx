import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { insertFacilitySchema } from "@shared/schema";
import { z } from "zod";

const facilityFormSchema = insertFacilitySchema.extend({
  bankId: z.string().min(1, "Please select a bank"),
  facilityType: z.string().min(1, "Please select a facility type"),
  creditLimit: z.string().min(1, "Credit limit is required"),
  costOfFunding: z.string().min(1, "Cost of funding is required"),
  startDate: z.string().min(1, "Start date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  terms: z.string().optional(),
}).superRefine((data, ctx) => {
  // Allow 0 cost of funding for non-cash guarantee facilities
  if (data.facilityType !== "non_cash_guarantee" && parseFloat(data.costOfFunding) <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["costOfFunding"],
      message: "Cost of funding must be greater than 0 for cash facilities"
    });
  }
});

type FacilityFormData = z.infer<typeof facilityFormSchema>;

interface BankFormProps {
  banks: Array<{ id: string; name: string; code: string }>;
  onSuccess: () => void;
  onCancel: () => void;
}

const facilityTypes = [
  { value: "revolving", label: "Revolving Credit Line" },
  { value: "term", label: "Term Loan" },
  { value: "bullet", label: "Bullet Loan" },
  { value: "bridge", label: "Bridge Financing" },
  { value: "working_capital", label: "Working Capital Facility" },
  { value: "non_cash_guarantee", label: "Non-Cash Guarantee" },
];

export default function BankForm({ banks, onSuccess, onCancel }: BankFormProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);

  const form = useForm<FacilityFormData>({
    resolver: zodResolver(facilityFormSchema),
    defaultValues: {
      bankId: "",
      facilityType: "",
      creditLimit: "",
      costOfFunding: "",
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: "",
      terms: "",
    },
  });

  const createFacilityMutation = useMutation({
    mutationFn: async (data: FacilityFormData) => {
      const facilityData = {
        ...data,
        creditLimit: parseFloat(data.creditLimit).toString(),
        costOfFunding: parseFloat(data.costOfFunding).toString(),
      };

      await apiRequest("POST", "/api/facilities", facilityData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bank facility created successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create bank facility",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FacilityFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    createFacilityMutation.mutate(data);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onCancel, 150);
  };

  const calculateExpiryDate = (startDate: string, facilityType: string) => {
    if (!startDate) return "";
    
    const start = new Date(startDate);
    let expiryDate = new Date(start);
    
    // Set default expiry based on facility type
    switch (facilityType) {
      case "revolving":
        expiryDate.setMonth(start.getMonth() + 6); // 6 months for revolving
        break;
      case "term":
        expiryDate.setFullYear(start.getFullYear() + 1); // 1 year for term loans
        break;
      case "bullet":
        expiryDate.setMonth(start.getMonth() + 3); // 3 months for bullet
        break;
      case "bridge":
        expiryDate.setMonth(start.getMonth() + 2); // 2 months for bridge
        break;
      case "working_capital":
        expiryDate.setFullYear(start.getFullYear() + 1); // 1 year for working capital
        break;
      default:
        expiryDate.setFullYear(start.getFullYear() + 1);
    }
    
    return expiryDate.toISOString().split('T')[0];
  };

  // Auto-calculate expiry date when start date or facility type changes
  const startDate = form.watch("startDate");
  const facilityType = form.watch("facilityType");
  
  useEffect(() => {
    if (startDate && facilityType) {
      const newExpiryDate = calculateExpiryDate(startDate, facilityType);
      if (newExpiryDate) {
        form.setValue("expiryDate", newExpiryDate);
      }
    }
    
    // Auto-set cost of funding to 0 for non-cash guarantee facilities
    if (facilityType === "non_cash_guarantee") {
      form.setValue("costOfFunding", "0");
    }
  }, [startDate, facilityType, form]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-facility-form">
        <DialogHeader>
          <DialogTitle>Add Bank Facility</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Bank Selection */}
            <FormField
              control={form.control}
              name="bankId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-bank">
                        <SelectValue placeholder="Select a Saudi bank" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.name} ({bank.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Financial Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        placeholder="e.g., 10000000"
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
                    <FormLabel>Margin Above SIBOR (%) *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.01" 
                        placeholder="e.g., 2.5"
                        data-testid="input-cost-of-funding"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facility Start Date *</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" data-testid="input-start-date" />
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
                    <FormLabel>Facility Expiry Date *</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" data-testid="input-expiry-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Interest Rate Display */}
            {form.watch("costOfFunding") && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Interest Rate Structure</h4>
                <div className="text-sm text-blue-700">
                  <p>Current SIBOR: 5.75%</p>
                  <p>Margin: +{form.watch("costOfFunding")}%</p>
                  <p className="font-medium">
                    Total Rate: {(5.75 + parseFloat(form.watch("costOfFunding") || "0")).toFixed(2)}%
                  </p>
                </div>
              </div>
            )}

            {/* Terms and Conditions */}
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms & Conditions</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Special terms, covenants, or conditions for this facility..."
                      rows={4}
                      data-testid="textarea-terms"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Credit Limit Display */}
            {form.watch("creditLimit") && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Credit Limit:</strong> {parseFloat(form.watch("creditLimit") || "0").toLocaleString()} SAR
                  {parseFloat(form.watch("creditLimit") || "0") >= 1000000 && (
                    <span className="ml-2 text-gray-500">
                      ({(parseFloat(form.watch("creditLimit")) / 1000000).toFixed(1)}M SAR)
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Form Actions */}
            <DialogFooter className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                data-testid="button-cancel-facility"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createFacilityMutation.isPending}
                className="bg-primary text-primary-foreground lg:hover:bg-primary/90"
                data-testid="button-create-facility"
                onClick={(e) => {
                  console.log("Create Facility button clicked");
                  console.log("Form state:", form.getValues());
                  console.log("Form valid:", form.formState.isValid);
                  console.log("Form errors:", form.formState.errors);
                }}
              >
                {createFacilityMutation.isPending ? "Creating..." : "Create Facility"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
