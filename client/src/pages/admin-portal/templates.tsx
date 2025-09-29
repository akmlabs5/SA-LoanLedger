import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, FileText, Mail, Calendar, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/AdminLayout";

const templateSchema = z.object({
  type: z.enum(["due_date", "payment", "review", "custom"]),
  name: z.string().min(1, "Name is required"),
  subject: z.string().min(1, "Subject is required"),
  emailTemplate: z.string().min(1, "Email template is required"),
  calendarTemplate: z.string().min(1, "Calendar template is required"),
  variables: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

type TemplateFormData = z.infer<typeof templateSchema>;

export default function AdminTemplatesPage() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  // Get admin token for authenticated requests
  const adminToken = localStorage.getItem('admin_token');

  // Custom admin API request function with authentication
  const adminApiRequest = async (method: string, url: string, data?: any) => {
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to ${method.toLowerCase()} template`);
    }
    
    return response.json();
  };

  // Fetch templates with admin authentication
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["/api/admin/templates"],
    queryFn: async () => {
      const response = await fetch('/api/admin/templates', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      return response.json();
    },
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: TemplateFormData) => {
      return await adminApiRequest("POST", "/api/admin/templates", templateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/templates"] });
      toast({
        title: "Success",
        description: "Template created successfully",
      });
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive",
      });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...templateData }: TemplateFormData & { id: string }) => {
      return await adminApiRequest("PUT", `/api/admin/templates/${id}`, templateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/templates"] });
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
      setEditingTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive",
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return await adminApiRequest("DELETE", `/api/admin/templates/${templateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/templates"] });
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive",
      });
    },
  });

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      type: "due_date",
      name: "",
      subject: "",
      emailTemplate: "",
      calendarTemplate: "",
      variables: ["{loanReference}", "{amount}", "{dueDate}", "{bankName}"],
      isActive: true,
    },
  });

  const onSubmit = (data: TemplateFormData) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ ...data, id: editingTemplate.id });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    form.reset({
      type: template.type,
      name: template.name,
      subject: template.subject,
      emailTemplate: template.emailTemplate,
      calendarTemplate: template.calendarTemplate,
      variables: template.variables || [],
      isActive: template.isActive,
    });
  };

  const handleDelete = (templateId: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "due_date": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "payment": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "review": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "due_date": return "📅";
      case "payment": return "💰";
      case "review": return "📋";
      default: return "📝";
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reminder Templates</h1>
            <p className="text-muted-foreground">Manage system-wide message templates for loan reminders</p>
          </div>
          <Dialog open={isCreateOpen || !!editingTemplate} onOpenChange={(open) => {
            if (!open) {
              setIsCreateOpen(false);
              setEditingTemplate(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-template">
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>{editingTemplate ? "Edit Template" : "Create New Template"}</span>
                </DialogTitle>
                <DialogDescription>
                  Create professional message templates for different reminder types
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-template-type">
                                <SelectValue placeholder="Select template type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="due_date">📅 Due Date Alert</SelectItem>
                              <SelectItem value="payment">💰 Payment Reminder</SelectItem>
                              <SelectItem value="review">📋 Loan Review</SelectItem>
                              <SelectItem value="custom">📝 Custom Reminder</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Standard Due Date Alert" {...field} data-testid="input-template-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Loan Payment Due - {loanReference}" {...field} data-testid="input-template-subject" />
                        </FormControl>
                        <FormDescription>
                          Use variables: {"{loanReference}, {amount}, {dueDate}, {bankName}"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Tabs defaultValue="email" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="email" className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>Email Template</span>
                      </TabsTrigger>
                      <TabsTrigger value="calendar" className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Calendar Template</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="email" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="emailTemplate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Message Body</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Dear Valued Customer,&#10;&#10;This is a reminder about your loan...&#10;&#10;Best regards,&#10;Saudi Loan Management Team"
                                className="min-h-[200px]"
                                {...field}
                                data-testid="textarea-email-template"
                              />
                            </FormControl>
                            <FormDescription>
                              Professional email content. Use variables: {"{loanReference}, {amount}, {dueDate}, {bankName}"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="calendar" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="calendarTemplate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Calendar Event Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Loan Payment Due - {loanReference}&#10;&#10;Amount: {amount} SAR&#10;Due Date: {dueDate}&#10;&#10;Reference: {loanReference}"
                                className="min-h-[150px]"
                                {...field}
                                data-testid="textarea-calendar-template"
                              />
                            </FormControl>
                            <FormDescription>
                              Calendar event description. Use variables: {"{loanReference}, {amount}, {dueDate}, {bankName}"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active Template</FormLabel>
                          <FormDescription>
                            Enable this template for use in the system
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-template-active"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsCreateOpen(false);
                        setEditingTemplate(null);
                        form.reset();
                      }}
                      data-testid="button-cancel-template"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                      data-testid="button-save-template"
                    >
                      {editingTemplate ? "Update Template" : "Create Template"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Templates Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No templates found</h3>
              <p className="text-muted-foreground mb-4">Create your first reminder template to get started</p>
              <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-template">
                <Plus className="h-4 w-4 mr-2" />
                Create First Template
              </Button>
            </div>
          ) : (
            templates.map((template: any) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow" data-testid={`card-template-${template.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getTypeIcon(template.type)}</span>
                      <Badge className={getTypeColor(template.type)}>
                        {template.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      {template.isActive ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="text-sm">{template.subject}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      <p className="flex items-center space-x-2">
                        <Mail className="h-3 w-3" />
                        <span>Email template configured</span>
                      </p>
                      <p className="flex items-center space-x-2">
                        <Calendar className="h-3 w-3" />
                        <span>Calendar template configured</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setPreviewTemplate(template)}
                        data-testid={`button-preview-${template.id}`}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEdit(template)}
                        data-testid={`button-edit-${template.id}`}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDelete(template.id)}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-delete-${template.id}`}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Preview Dialog */}
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Template Preview: {previewTemplate?.name}</span>
              </DialogTitle>
            </DialogHeader>
            
            {previewTemplate && (
              <Tabs defaultValue="email" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email">Email Preview</TabsTrigger>
                  <TabsTrigger value="calendar">Calendar Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="email" className="space-y-4">
                  <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                    <h4 className="font-semibold mb-2">Subject:</h4>
                    <p className="text-sm border-b pb-2 mb-3">{previewTemplate.subject}</p>
                    <h4 className="font-semibold mb-2">Body:</h4>
                    <div className="text-sm whitespace-pre-wrap">{previewTemplate.emailTemplate}</div>
                  </div>
                </TabsContent>
                
                <TabsContent value="calendar" className="space-y-4">
                  <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                    <h4 className="font-semibold mb-2">Calendar Event Description:</h4>
                    <div className="text-sm whitespace-pre-wrap">{previewTemplate.calendarTemplate}</div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
            
            <div className="flex justify-end">
              <Button onClick={() => setPreviewTemplate(null)} data-testid="button-close-preview">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}