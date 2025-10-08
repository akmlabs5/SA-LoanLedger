import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useLocation, Link } from "wouter";
import { ArrowLeft, PiggyBank, TrendingUp, AlertCircle, DollarSign, Calendar, Building2 } from "lucide-react";

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
import { insertCollateralSchema } from "@shared/schema";
import { formatFacilityType } from "@/lib/formatters";

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
  assignmentType: z.enum(["facility", "bank"]).default("facility"),
  facilityId: z.string().optional(),
  bankId: z.string().optional(),
  pledgeType: z.enum(["first_lien", "second_lien", "blanket"]).default("first_lien"),
  desiredLtv: z.string().optional().refine(
    (val) => !val || (!isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 100),
    "LTV must be between 0 and 100"
  ),
}).refine(
  (data) => {
    if (data.assignmentType === "facility") {
      return !!data.facilityId;
    } else {
      return !!data.bankId;
    }
  },
  {
    message: "Please select a facility or bank",
    path: ["facilityId"],
  }
);

type CollateralFormData = z.infer<typeof collateralFormSchema>;

export default function CollateralCreatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch facilities and banks for selection
  const { data: facilities, isLoading: facilitiesLoading } = useQuery({
    queryKey: ["/api/facilities"],
  });
  
  const { data: banks, isLoading: banksLoading } = useQuery({
    queryKey: ["/api/banks"],
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
      assignmentType: "facility",
      facilityId: "",
      bankId: "",
      pledgeType: "first_lien",
      desiredLtv: "",
    },
  });

  const createCollateralMutation = useMutation({
    mutationFn: async (data: CollateralFormData) => {
      // Single atomic call - backend handles both collateral creation and assignment
      const payload: any = {
        type: data.type,
        name: data.name,
        description: data.description,
        currentValue: parseFloat(data.currentValue).toString(),
        valuationDate: data.valuationDate,
        valuationSource: data.valuationSource,
        notes: data.notes,
        isActive: data.isActive,
        pledgeType: data.pledgeType,
      };
      
      // Add either facilityId or bankId based on assignment type
      if (data.assignmentType === "facility") {
        payload.facilityId = data.facilityId;
      } else {
        payload.bankId = data.bankId;
      }
      
      return await apiRequest("POST", "/api/collateral", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collateral"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collateral-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/portfolio"] });
      toast({
        title: "Success",
        description: "Collateral asset created and assigned to facility successfully",
      });
      setLocation("/collateral");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create collateral and assignment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CollateralFormData) => {
    createCollateralMutation.mutate(data);
  };

  const selectedType = form.watch("type");
  const assignmentType = form.watch("assignmentType");
  const selectedTypeDetails = collateralTypes.find(type => type.value === selectedType);

  const getTypeDescription = (type: string) => {
    return collateralTypes.find(t => t.value === type)?.description || "";
  };

  const formatCurrency = (amount: string) => {
    if (!amount || isNaN(Number(amount))) return "0 SAR";
    return Number(amount).toLocaleString() + " SAR";
  };

  const currentValue = form.watch("currentValue");
  const selectedBankId = form.watch("bankId");
  const selectedFacilityId = form.watch("facilityId");
  const desiredLtv = form.watch("desiredLtv");

  // Get the relevant bank for LTV calculation
  const relevantBank = (() => {
    if (assignmentType === "bank" && selectedBankId) {
      return banks?.find((b: any) => b.id === selectedBankId);
    } else if (assignmentType === "facility" && selectedFacilityId) {
      const facility = facilities?.find((f: any) => f.id === selectedFacilityId);
      return banks?.find((b: any) => b.id === facility?.bankId);
    }
    return null;
  })();

  const bankTargetLtv = relevantBank?.targetLtv ? parseFloat(relevantBank.targetLtv) : 70;
  const bankName = relevantBank?.name || "Bank";
  
  // Use user's desired LTV if provided, otherwise fall back to bank target
  const effectiveLtv = desiredLtv && !isNaN(Number(desiredLtv)) ? Number(desiredLtv) : bankTargetLtv;
  const estimatedValue = currentValue && !isNaN(Number(currentValue)) 
    ? (Number(currentValue) * (effectiveLtv / 100)).toString()
    : "0";

  // Check if there are no facilities
  const noFacilities = !facilitiesLoading && (!facilities || facilities.length === 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/collateral")}
                data-testid="button-back-to-collateral"
                className="lg:hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Collateral
              </Button>
              <div className="hidden sm:block w-px h-6 bg-gray-300 dark:bg-gray-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Collateral Asset</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Register a new asset to secure your loan facilities
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Show message when no facilities exist */}
        {noFacilities ? (
          <Card className="max-w-2xl mx-auto shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg">
              <CardTitle className="text-xl flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                No Facilities Available
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <Building2 className="h-16 w-16 text-amber-500 mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Create a Bank Facility First
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Before adding collateral, you need to create at least one bank facility. Collateral assets are used to secure specific facilities.
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>How it works:</strong> Collateral assets (like real estate or stocks) are pledged to secure your bank facilities. Each collateral must be linked to a facility.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/banks">
                    <Button className="bg-primary lg:hover:bg-primary/90 text-primary-foreground" data-testid="button-create-facility">
                      <Building2 className="mr-2 h-4 w-4" />
                      Go to Banks & Facilities
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/collateral")}
                    data-testid="button-back"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Collateral
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <PiggyBank className="h-5 w-5 mr-2" />
                  Collateral Asset Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Assignment Type Selection */}
                    <FormField
                      control={form.control}
                      name="assignmentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assignment Level *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-assignment-type">
                                <SelectValue placeholder="Select assignment level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="facility">
                                <div className="flex flex-col">
                                  <span>Specific Facility</span>
                                  <span className="text-xs text-muted-foreground">
                                    Secure a specific credit line or facility
                                  </span>
                                </div>
                              </SelectItem>
                              <SelectItem value="bank">
                                <div className="flex flex-col">
                                  <span>Total Bank Exposure</span>
                                  <span className="text-xs text-muted-foreground">
                                    Secure entire banking relationship
                                  </span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Conditional: Facility Selection */}
                    {assignmentType === "facility" && (
                      <FormField
                        control={form.control}
                        name="facilityId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Facility *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={facilitiesLoading}>
                              <FormControl>
                                <SelectTrigger data-testid="select-facility">
                                  <SelectValue placeholder="Select facility to secure with this collateral" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {facilities?.map((facility: any) => (
                                  <SelectItem key={facility.id} value={facility.id}>
                                    <div className="flex flex-col">
                                      <span>{formatFacilityType(facility.facilityType).toUpperCase()}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {facility.bank?.name} - {parseFloat(facility.creditLimit).toLocaleString()} SAR
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">
                              This collateral will be assigned to secure the selected facility
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Conditional: Bank Selection */}
                    {assignmentType === "bank" && (
                      <FormField
                        control={form.control}
                        name="bankId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={banksLoading}>
                              <FormControl>
                                <SelectTrigger data-testid="select-bank">
                                  <SelectValue placeholder="Select bank for total exposure coverage" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {banks?.map((bank: any) => (
                                  <SelectItem key={bank.id} value={bank.id}>
                                    {bank.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">
                              This collateral will secure your entire relationship with this bank
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Pledge Type Selection */}
                    <FormField
                      control={form.control}
                      name="pledgeType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pledge Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-pledge-type">
                                <SelectValue placeholder="Select pledge type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="first_lien">
                                <div className="flex flex-col">
                                  <span>First Lien</span>
                                  <span className="text-xs text-muted-foreground">Primary security interest</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="second_lien">
                                <div className="flex flex-col">
                                  <span>Second Lien</span>
                                  <span className="text-xs text-muted-foreground">Secondary security interest</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="blanket">
                                <div className="flex flex-col">
                                  <span>Blanket Lien</span>
                                  <span className="text-xs text-muted-foreground">General security over multiple assets</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                          {selectedType && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {getTypeDescription(selectedType)}
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
                            <FormLabel>Current Value (SAR) *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="e.g., 5000000"
                                data-testid="input-current-value"
                              />
                            </FormControl>
                            {currentValue && (
                              <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                                {formatCurrency(currentValue)}
                              </p>
                            )}
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
                              <Input
                                {...field}
                                type="date"
                                data-testid="input-valuation-date"
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
                              value={field.value || ""}
                              placeholder="e.g., Licensed Property Appraiser, Market Price, Internal Valuation"
                              data-testid="input-valuation-source"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Desired LTV Percentage */}
                    <FormField
                      control={form.control}
                      name="desiredLtv"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Desired LTV (%)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={field.value || ""}
                              placeholder={`e.g., ${bankTargetLtv} (Bank target: ${bankTargetLtv}%)`}
                              data-testid="input-desired-ltv"
                            />
                          </FormControl>
                          {desiredLtv && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              Estimated value: {formatCurrency(estimatedValue)}
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                              value={field.value || ""}
                              placeholder="Provide detailed information about the asset..."
                              data-testid="textarea-description"
                              rows={3}
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
                              value={field.value || ""}
                              placeholder="Any additional notes or conditions..."
                              data-testid="textarea-notes"
                              rows={2}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Active Status */}
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Active Asset</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Enable this asset for collateral assignments
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              data-testid="switch-is-active"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Separator />

                    {/* Form Actions */}
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLocation("/collateral")}
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createCollateralMutation.isPending}
                        data-testid="button-create-asset"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 lg:hover:from-purple-700 lg:hover:to-pink-700"
                      >
                        {createCollateralMutation.isPending ? "Creating..." : "Create Asset"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Asset Type Guide */}
            {selectedTypeDetails && (
              <Card className="shadow-sm border-purple-200 dark:border-purple-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center text-purple-800 dark:text-purple-400">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {selectedTypeDetails.label} Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">Description</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{selectedTypeDetails.description}</div>
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">Examples</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{selectedTypeDetails.examples}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Valuation Guidelines */}
            <Card className="shadow-sm border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center text-green-800 dark:text-green-400">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Valuation Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    <span>Use recent market valuations for accuracy</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    <span>Licensed appraisers recommended for real estate</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    <span>Stock values should reflect current market prices</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    <span>Update valuations annually for active assets</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Value Summary */}
            {currentValue && (
              <Card className="shadow-sm border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center text-blue-800 dark:text-blue-400">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Asset Value Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Value:</span>
                      <span className="text-sm font-bold text-blue-900 dark:text-blue-100">{formatCurrency(currentValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Estimated LTV ({bankName} Target: {bankTargetLtv}%):
                      </span>
                      <span className="text-sm font-semibold text-green-900 dark:text-green-100">
                        {formatCurrency(estimatedValue)}
                      </span>
                    </div>
                    {desiredLtv && Number(desiredLtv) !== bankTargetLtv && (
                      <div className="text-xs text-amber-600 dark:text-amber-400 italic mt-2">
                        Using custom LTV: {effectiveLtv}%
                      </div>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-400 italic mt-2">
                      *Actual loan-to-value ratios may vary based on asset type and bank policies
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}