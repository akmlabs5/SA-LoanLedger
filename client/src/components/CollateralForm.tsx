import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { insertCollateralSchema } from "@shared/schema";
import { z } from "zod";

const collateralFormSchema = insertCollateralSchema.extend({
  type: z.string().min(1, "Please select a collateral type"),
  name: z.string().min(1, "Asset name is required"),
  currentValue: z.string().min(1, "Current value is required"),
  valuationDate: z.string().min(1, "Valuation date is required"),
  description: z.string().optional(),
  valuationSource: z.string().optional(),
  notes: z.string().optional(),
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
    },
  });

  const createCollateralMutation = useMutation({
    mutationFn: async (data: CollateralFormData) => {
      const collateralData = {
        ...data,
        currentValue: parseFloat(data.currentValue).toString(),
      };

      if (isEditing) {
        await apiRequest("PUT", `/api/collateral/${collateral.id}`, collateralData);
      } else {
        await apiRequest("POST", "/api/collateral", collateralData);
      }
    },
    onSuccess: () => {
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-collateral-form">
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
                      <Input {...field} type="date" data-testid="input-valuation-date" />
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
