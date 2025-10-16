import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertBankContactSchema } from "@shared/schema";
import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Building,
  MapPin,
  Star,
  Save,
  X,
  AlertCircle
} from "lucide-react";

import { Link } from "wouter";

const bankContactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  extension: z.string().optional(),
  isPrimary: z.boolean().default(false),
  notes: z.string().optional(),
});

export default function BankContactCreatePage() {
  const { bankId } = useParams();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();

  // Get bank details for context
  const { data: bank, isLoading: bankLoading, isError: bankError } = useQuery<{id: string; name: string; code: string; type?: string}>({
    queryKey: ["/api/banks", bankId],
    enabled: isAuthenticated && !!bankId,
  });

  const form = useForm<z.infer<typeof bankContactFormSchema>>({
    resolver: zodResolver(bankContactFormSchema),
    defaultValues: {
      name: "",
      title: "",
      department: "",
      email: "",
      phone: "",
      mobile: "",
      extension: "",
      isPrimary: false,
      notes: "",
    },
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: z.infer<typeof bankContactFormSchema>) => {
      return apiRequest('POST', `/api/banks/${bankId}/contacts`, data);
    },
    onSuccess: async () => {
      // Invalidate all related queries for instant update
      await queryClient.invalidateQueries({ queryKey: ["/api/banks", bankId] });
      await queryClient.invalidateQueries({ queryKey: [`/api/banks/${bankId}/contacts`] });
      toast({ 
        title: "Contact created successfully",
        description: "The bank contact has been added to your system."
      });
      setLocation(`/banks/${bankId}`);
    },
    onError: (error: any) => {
      // Show specific validation error if available
      const errorMessage = error.message || "Failed to create contact";
      const description = error.details 
        ? `Validation error: ${error.details.map((d: any) => d.message).join(', ')}`
        : errorMessage;
      
      toast({ 
        title: "Failed to create contact", 
        description: description,
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: z.infer<typeof bankContactFormSchema>) => {
    createContactMutation.mutate(data);
  };

  // Loading states
  if (isLoading || bankLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">Loading Bank Contact</h2>
          <p className="text-muted-foreground">Please wait...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Error state
  if (bankError || !bank) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Bank Not Found</h2>
          <p className="text-muted-foreground mb-4">
            {bankError ? "Failed to load bank details" : "The specified bank doesn't exist"}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => setLocation("/banks")} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Banks
            </Button>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href={`/banks/${bankId}`}>
                <Button variant="ghost" size="sm" data-testid="button-back-bank">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Bank
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="w-10 h-10 bg-saudi text-white rounded-lg flex items-center justify-center">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Add Bank Contact</h1>
                <p className="text-sm text-muted-foreground">Create a new contact for {bank?.name}</p>
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
                  <User className="h-5 w-5 text-primary" />
                  <span>Contact Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name *</FormLabel>
                              <FormControl>
                                <Input 
                                  data-testid="input-contact-name" 
                                  placeholder="Enter full name" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job Title</FormLabel>
                              <FormControl>
                                <Input 
                                  data-testid="input-contact-title" 
                                  placeholder="e.g., Account Manager" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="department"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department</FormLabel>
                              <FormControl>
                                <Input 
                                  data-testid="input-contact-department" 
                                  placeholder="e.g., Corporate Banking" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="isPrimary"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Primary Contact</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  Set as main contact for this bank
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  data-testid="switch-primary-contact"
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>Contact Details</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input 
                                  data-testid="input-contact-email" 
                                  type="email" 
                                  placeholder="name@bank.com" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input 
                                  data-testid="input-contact-phone" 
                                  placeholder="+966 11 123 4567" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="mobile"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mobile Number</FormLabel>
                              <FormControl>
                                <Input 
                                  data-testid="input-contact-mobile" 
                                  placeholder="+966 50 123 4567" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="extension"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Extension</FormLabel>
                              <FormControl>
                                <Input 
                                  data-testid="input-contact-extension" 
                                  placeholder="e.g., 1234" 
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

                    {/* Additional Information */}
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
                                data-testid="input-contact-notes"
                                placeholder="Additional information about this contact..."
                                className="min-h-[100px]"
                                value={field.value || ""}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setLocation(`/banks/${bankId}`)}
                        data-testid="button-cancel-contact"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createContactMutation.isPending}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 lg:hover:from-blue-700 lg:hover:to-indigo-700"
                        data-testid="button-save-contact"
                      >
                        {createContactMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Create Contact
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
                  <Building className="h-5 w-5 text-primary" />
                  <span>Bank Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Bank Name</p>
                  <p className="font-medium" data-testid="text-bank-name">{bank?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bank Code</p>
                  <p className="font-medium" data-testid="text-bank-code">{bank?.code}</p>
                </div>
                {bank?.type && (
                  <div>
                    <p className="text-sm text-muted-foreground">Bank Type</p>
                    <Badge variant="outline" data-testid="badge-bank-type">{bank.type}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-primary" />
                  <span>Contact Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>• Set one contact as primary for each bank</p>
                  <p>• Include direct phone numbers and extensions</p>
                  <p>• Add department information for better organization</p>
                  <p>• Use notes for special instructions or preferences</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}