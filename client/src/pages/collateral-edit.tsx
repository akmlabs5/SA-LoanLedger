import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowLeft, PiggyBank, TrendingUp, AlertCircle, Calendar, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import DocumentUpload from "@/components/DocumentUpload";
import DocumentList from "@/components/DocumentList";

// Collateral types with descriptions and examples
const collateralTypes = [
  { 
    value: "real_estate", 
    label: "Real Estate", 
    description: "Properties, land, buildings, warehouses",
    examples: "Commercial buildings in Riyadh, residential properties, industrial land"
  },
  { 
    value: "liquid_stocks", 
    label: "Liquid Stocks", 
    description: "Publicly traded shares and securities",
    examples: "ARAMCO shares, STC stocks, Al Rajhi Bank shares, ETFs"
  },
  { 
    value: "other", 
    label: "Other Assets", 
    description: "Machinery, equipment, inventory, commodities",
    examples: "Manufacturing equipment, gold bars, inventory, vehicles"
  },
];

const collateralFormSchema = z.object({
  type: z.enum(["real_estate", "liquid_stocks", "other"]),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  currentValue: z.string().min(1, "Current value is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Value must be greater than 0"),
  valuationDate: z.string().min(1, "Valuation date is required"),
  valuationSource: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CollateralFormData = z.infer<typeof collateralFormSchema>;

export default function CollateralEditPage() {
  const { collateralId } = useParams<{ collateralId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch collateral details for editing
  const { data: collateral, isLoading: collateralLoading } = useQuery({
    queryKey: [`/api/collateral/${collateralId}`],
    enabled: !!collateralId,
  });

  const form = useForm<CollateralFormData>({
    resolver: zodResolver(collateralFormSchema),
    defaultValues: {
      type: "real_estate",
      name: "",
      description: "",
      currentValue: "",
      valuationDate: new Date().toISOString().split('T')[0],
      valuationSource: "",
      notes: "",
      isActive: true,
    },
  });

  // Update form when collateral data loads
  useEffect(() => {
    if (collateral) {
      form.reset({
        type: collateral.type,
        name: collateral.name,
        description: collateral.description || "",
        currentValue: collateral.currentValue.toString(),
        valuationDate: collateral.valuationDate,
        valuationSource: collateral.valuationSource || "",
        notes: collateral.notes || "",
        isActive: collateral.isActive,
      });
    }
  }, [collateral, form]);

  const updateCollateralMutation = useMutation({
    mutationFn: async (data: CollateralFormData) => {
      return await apiRequest("PUT", `/api/collateral/${collateralId}`, {
        ...data,
        currentValue: parseFloat(data.currentValue).toString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collateral"] });
      queryClient.invalidateQueries({ queryKey: [`/api/collateral/${collateralId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      toast({
        title: "Success",
        description: "Collateral updated successfully",
      });
      setLocation("/collateral");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update collateral",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CollateralFormData) => {
    updateCollateralMutation.mutate(data);
  };

  const selectedType = collateralTypes.find(type => type.value === form.watch("type"));

  if (collateralLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">Loading Collateral</h2>
          <p className="text-muted-foreground">Please wait...</p>
        </div>
      </div>
    );
  }

  if (!collateral) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Collateral Not Found</h2>
          <p className="text-muted-foreground mb-4">The collateral you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/collateral")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collateral
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation("/collateral")}
                data-testid="button-back-to-collateral"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Collateral
              </Button>
              <div className="flex items-center space-x-2">
                <PiggyBank className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold" data-testid="text-page-title">Edit Collateral</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PiggyBank className="h-5 w-5" />
                <span>Update Collateral Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Collateral Type Selection */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collateral Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-collateral-type">
                              <SelectValue placeholder="Select collateral type" />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Selected Type Info */}
                  {selectedType && (
                    <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
                      <h4 className="font-semibold text-sm">{selectedType.label}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{selectedType.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        <strong>Examples:</strong> {selectedType.examples}
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Collateral Name *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="e.g., Riyadh Commercial Building"
                              data-testid="input-collateral-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currentValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Value (SAR) *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              data-testid="input-current-value"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Valuation Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="valuationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valuation Date *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                {...field} 
                                type="date"
                                className="pl-10"
                                data-testid="input-valuation-date"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="valuationSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valuation Source</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="e.g., Knight Frank, CBRE, Internal Assessment"
                              data-testid="input-valuation-source"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Detailed description of the collateral..."
                            className="min-h-[100px]"
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
                            placeholder="Any additional notes or special considerations..."
                            className="min-h-[80px]"
                            data-testid="textarea-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Status */}
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active Status</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Mark this collateral as active or inactive
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-is-active"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-6">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setLocation("/collateral")}
                      data-testid="button-cancel"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateCollateralMutation.isPending}
                      data-testid="button-update-collateral"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {updateCollateralMutation.isPending ? "Updating..." : "Update Collateral"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Collateral Documents */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PiggyBank className="h-5 w-5" />
                <span>Collateral Documents</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Valuation reports, insurance certificates, legal documents, and other supporting files
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Document Upload */}
              <DocumentUpload 
                entityType="collateral"
                entityId={collateralId!}
                onUploadComplete={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/documents", "collateral", collateralId] });
                }}
                maxFiles={20}
              />
              
              {/* Document List */}
              <DocumentList 
                entityType="collateral"
                entityId={collateralId!}
                showUpload={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}