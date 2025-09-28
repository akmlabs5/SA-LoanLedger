import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCollateralSchema, Facility, Bank, CreditLine } from "@shared/schema";
import { z } from "zod";
import { Building, CreditCard, AlertCircle } from "lucide-react";
import { formatFacilityType } from "@/lib/formatters";
import { ModernDatePicker } from "@/components/ui/date-picker";

const collateralFormSchema = insertCollateralSchema.extend({
  type: z.string().min(1, "Please select a collateral type"),
  name: z.string().min(1, "Asset name is required"),
  currentValue: z.string().min(1, "Current value is required"),
  valuationDate: z.string().min(1, "Valuation date is required"),
  description: z.string().optional(),
  valuationSource: z.string().optional(),
  notes: z.string().optional(),
  // Optional collateral assignment fields
  facilityId: z.string().optional(),
  creditLineId: z.string().optional(),
}).refine(data => {
  // If creditLineId is provided, facilityId must also be provided
  if (data.creditLineId && !data.facilityId) {
    return false;
  }
  return true;
}, {
  message: "Credit line assignment requires facility selection",
  path: ["facilityId"]
});

type CollateralFormData = z.infer<typeof collateralFormSchema>;

interface CollateralFormProps {
  collateral?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const collateralTypes = [
  { value: "real_estate", label: "Real Estate" },
  { value: "liquid_stocks", label: "Liquid Stocks" },
  { value: "other", label: "Other Assets" },
];

export default function CollateralForm({ collateral, onSuccess, onCancel }: CollateralFormProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  const isEditing = !!collateral;

  // Fetch facilities and credit lines for assignment
  const { data: facilities } = useQuery<Array<Facility & { bank: Bank }>>({ 
    queryKey: ["/api/facilities"],
  });
  
  const { data: creditLines } = useQuery<Array<CreditLine & { facility: Facility & { bank: Bank } }>>({ 
    queryKey: ["/api/credit-lines"],
  });

  // Fetch current assignment if editing existing collateral
  const { data: currentAssignment } = useQuery<{facilityId: string; creditLineId?: string}>({ 
    queryKey: ["/api/collateral-assignments", { collateralId: collateral?.id }],
    enabled: !!collateral?.id,
    queryFn: async () => {
      const response = await fetch(`/api/collateral-assignments?collateralId=${collateral.id}`);
      if (!response.ok) return null;
      const assignments = await response.json();
      return assignments[0] || null;
    },
  });

  const form = useForm<CollateralFormData>({
    resolver: zodResolver(collateralFormSchema),
    defaultValues: {
      type: collateral?.type || "",
      name: collateral?.name || "",
      currentValue: collateral?.currentValue || "",
      valuationDate: collateral?.valuationDate || new Date().toISOString().split('T')[0],
      description: collateral?.description || "",
      valuationSource: collateral?.valuationSource || "",
      notes: collateral?.notes || "",
      facilityId: currentAssignment?.facilityId || "no-assignment",
      creditLineId: currentAssignment?.creditLineId || "entire-facility",
    },
  });

  // Update form when assignment data loads
  useEffect(() => {
    if (currentAssignment && isEditing) {
      form.setValue("facilityId", currentAssignment.facilityId || "no-assignment");
      form.setValue("creditLineId", currentAssignment.creditLineId || "entire-facility");
    }
  }, [currentAssignment, isEditing, form]);

  const createCollateralMutation = useMutation({
    mutationFn: async (data: CollateralFormData) => {
      const collateralData = {
        type: data.type,
        name: data.name,
        currentValue: parseFloat(data.currentValue).toString(),
        valuationDate: data.valuationDate,
        description: data.description || null,
        valuationSource: data.valuationSource || null,
        notes: data.notes || null,
      };

      let collateralId: string;
      
      if (isEditing) {
        await apiRequest("PUT", `/api/collateral/${collateral.id}`, collateralData);
        collateralId = collateral.id;
      } else {
        const result = await apiRequest("POST", "/api/collateral", collateralData) as any;
        collateralId = result.id;
      }

      // Handle collateral assignment changes
      const hasCurrentAssignment = !!currentAssignment?.facilityId;
      const hasNewAssignment = data.facilityId && data.facilityId !== "no-assignment";
      
      if (hasNewAssignment) {
        // Create or update assignment
        const assignmentData = {
          collateralId,
          facilityId: data.facilityId,
          creditLineId: data.creditLineId && data.creditLineId !== "entire-facility" ? data.creditLineId : null,
        };
        await apiRequest("PUT", `/api/collateral-assignments`, assignmentData);
      } else if (hasCurrentAssignment && !hasNewAssignment) {
        // Remove existing assignment (user selected "No Assignment")
        await apiRequest("DELETE", `/api/collateral-assignments/${collateralId}`);
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/collateral"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collateral-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/facilities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credit-lines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      
      toast({
        title: "Success",
        description: `Collateral ${isEditing ? 'updated' : 'created'} successfully`,
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} collateral`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CollateralFormData) => {
    createCollateralMutation.mutate(data);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onCancel, 150);
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case "real_estate":
        return "Commercial or residential property, land, or real estate investments";
      case "liquid_stocks":
        return "Publicly traded stocks, bonds, or other liquid securities";
      case "other":
        return "Other valuable assets that can serve as collateral";
      default:
        return "";
    }
  };

  // Filter credit lines based on selected facility
  const watchedFacilityId = form.watch("facilityId");
  const availableCreditLines = creditLines?.filter(cl => 
    cl.facilityId === watchedFacilityId && watchedFacilityId !== "no-assignment"
  ) || [];

  // Get selected facility info
  const selectedFacility = facilities?.find(f => f.id === watchedFacilityId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto" data-testid="dialog-collateral-form">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Collateral Asset' : 'Add Collateral Asset'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Asset Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-collateral-type">
                        <SelectValue placeholder="Select asset type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {collateralTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.watch("type") && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {getTypeDescription(form.watch("type"))}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Asset Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Name/Description *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="e.g., Commercial Building - Riyadh, ARAMCO Shares, etc."
                      data-testid="input-asset-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Current Value and Valuation Date */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Market Value (SAR) *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.01" 
                        placeholder="e.g., 45000000"
                        data-testid="input-current-value"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valuationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valuation Date *</FormLabel>
                    <FormControl>
                      <ModernDatePicker 
                        value={field.value} 
                        onChange={field.onChange}
                        placeholder="Select valuation date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Valuation Source */}
            <FormField
              control={form.control}
              name="valuationSource"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valuation Source</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="e.g., Professional Appraiser, Market Price, Bank Valuation"
                      data-testid="input-valuation-source"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Value Display */}
            {form.watch("currentValue") && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Asset Value Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-green-700">
                  <div>
                    <span>Current Value:</span>
                    <span className="ml-2 font-medium">
                      {parseFloat(form.watch("currentValue") || "0").toLocaleString()} SAR
                    </span>
                  </div>
                  {parseFloat(form.watch("currentValue") || "0") >= 1000000 && (
                    <div>
                      <span>Value (Millions):</span>
                      <span className="ml-2 font-medium">
                        {(parseFloat(form.watch("currentValue")) / 1000000).toFixed(1)}M SAR
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Provide detailed information about the asset, location, specifications, etc."
                      rows={3}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Any additional notes, restrictions, or special considerations..."
                      rows={2}
                      data-testid="textarea-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Collateral Assignment Section */}
            <Separator />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Facility Assignment
                </CardTitle>
                <CardDescription>
                  Optionally assign this collateral to a specific banking facility or credit line
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Facility Selection */}
                <FormField
                  control={form.control}
                  name="facilityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banking Facility</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Clear credit line when facility changes
                          form.setValue("creditLineId", "entire-facility");
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-facility">
                            <SelectValue placeholder="Select a facility (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no-assignment">No Assignment</SelectItem>
                          {facilities?.map((facility) => (
                            <SelectItem key={facility.id} value={facility.id}>
                              {facility.bank.name} - {formatFacilityType(facility.facilityType)} ({parseFloat(facility.creditLimit).toLocaleString()} SAR)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Credit Line Selection (only if facility selected) */}
                {form.watch("facilityId") && availableCreditLines.length > 0 && (
                  <FormField
                    control={form.control}
                    name="creditLineId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Specific Credit Line (Optional)
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-credit-line">
                              <SelectValue placeholder="Assign to entire facility" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="entire-facility">Entire Facility</SelectItem>
                            {availableCreditLines.map((creditLine) => (
                              <SelectItem key={creditLine.id} value={creditLine.id}>
                                {creditLine.name} ({parseFloat(creditLine.creditLimit).toLocaleString()} SAR)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Assignment Summary */}
                {selectedFacility && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Assignment Summary</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div>
                        <span className="font-medium">Bank:</span> {selectedFacility.bank.name}
                      </div>
                      <div>
                        <span className="font-medium">Facility:</span> {selectedFacility.facilityType}
                      </div>
                      {form.watch("creditLineId") && (
                        <div>
                          <span className="font-medium">Credit Line:</span> {
                            availableCreditLines.find(cl => cl.id === form.watch("creditLineId"))?.name
                          }
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Warning about assignment requirements */}
                {form.watch("creditLineId") && !form.watch("facilityId") && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Credit line assignment requires facility selection</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                data-testid="button-cancel-collateral"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createCollateralMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-save-collateral"
              >
                {createCollateralMutation.isPending 
                  ? (isEditing ? "Updating..." : "Creating...") 
                  : (isEditing ? "Update Asset" : "Create Asset")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
