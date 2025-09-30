import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Mail, Bell, Plus, Trash2, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const reminderSchema = z.object({
  type: z.enum(["due_date", "payment", "review", "custom"]),
  title: z.string().min(1, "Title is required"),
  message: z.string().optional(),
  reminderDate: z.string().min(1, "Reminder date is required"),
  emailEnabled: z.boolean().default(true),
  calendarEnabled: z.boolean().default(false),
  templateId: z.string().optional(),
});

type ReminderFormData = z.infer<typeof reminderSchema>;

interface ReminderModalProps {
  loanId: string;
  isOpen: boolean;
  onClose: () => void;
  loanData?: {
    referenceNumber: string;
    dueDate: string;
    amount: string;
  };
}

export default function ReminderModal({ loanId, isOpen, onClose, loanData }: ReminderModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"create" | "manage">("create");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templatePreview, setTemplatePreview] = useState<{ title: string; message: string } | null>(null);

  // Fetch existing reminders
  const { data: reminders = [], isLoading: remindersLoading } = useQuery({
    queryKey: ["/api/loans", loanId, "reminders"],
    enabled: isOpen && !!loanId,
  });

  // Fetch available templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/reminder-templates"],
    enabled: isOpen,
  });

  // Create reminder mutation
  const createReminderMutation = useMutation({
    mutationFn: async (reminderData: ReminderFormData) => {
      return await apiRequest("POST", `/api/loans/${loanId}/reminders`, reminderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans", loanId, "reminders"] });
      toast({
        title: "Success",
        description: "Reminder created successfully",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create reminder",
        variant: "destructive",
      });
    },
  });

  // Delete reminder mutation
  const deleteReminderMutation = useMutation({
    mutationFn: async (reminderId: string) => {
      return await apiRequest("DELETE", `/api/reminders/${reminderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans", loanId, "reminders"] });
      toast({
        title: "Success",
        description: "Reminder deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete reminder",
        variant: "destructive",
      });
    },
  });

  const form = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      type: "due_date",
      title: "",
      message: "",
      reminderDate: "",
      emailEnabled: true,
      calendarEnabled: false,
      templateId: "none",
    },
  });

  const onSubmit = (data: ReminderFormData) => {
    createReminderMutation.mutate(data);
  };

  const handleQuickSetup = (days: number, type: "due_date" | "payment") => {
    if (!loanData?.dueDate) return;
    
    const dueDate = new Date(loanData.dueDate);
    const reminderDate = new Date(dueDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const title = type === "due_date" 
      ? `Loan Due in ${days} day${days !== 1 ? 's' : ''}`
      : `Payment Due for Loan ${loanData.referenceNumber}`;
    
    const message = type === "due_date"
      ? `Your loan ${loanData.referenceNumber} is due on ${dueDate.toLocaleDateString()}. Amount: ${loanData.amount} SAR`
      : `Payment reminder for loan ${loanData.referenceNumber}. Due: ${dueDate.toLocaleDateString()}`;

    form.setValue("type", type);
    form.setValue("title", title);
    form.setValue("message", message);
    form.setValue("reminderDate", reminderDate.toISOString().slice(0, 16));
  };

  const handleTemplateSelection = (templateId: string) => {
    const template = (templates as any[]).find((t: any) => t.id === templateId);
    if (!template) {
      setSelectedTemplate(null);
      setTemplatePreview(null);
      return;
    }

    setSelectedTemplate(template);
    
    // Generate preview with loan data
    if (loanData) {
      // Mock template rendering - in a real implementation, this would call the template service
      const mockPreview = {
        title: template.subject?.replace('{referenceNumber}', loanData.referenceNumber) || template.name,
        message: template.emailTemplate
          ?.replace('{referenceNumber}', loanData.referenceNumber)
          ?.replace('{loanAmount}', loanData.amount + ' SAR')
          ?.replace('{dueDate}', new Date(loanData.dueDate).toLocaleDateString())
          || 'Template preview unavailable'
      };
      setTemplatePreview(mockPreview);
      
      // Auto-fill form with template content
      form.setValue("title", mockPreview.title);
      form.setValue("message", mockPreview.message);
    }
  };

  const clearTemplate = () => {
    setSelectedTemplate(null);
    setTemplatePreview(null);
    form.setValue("templateId", "none");
  };

  const formatReminderDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "due_date": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "payment": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "review": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const handleDownloadCalendarInvite = (reminderId: string) => {
    const url = `/api/reminders/${reminderId}/calendar`;
    window.open(url, '_blank');
  };

  const handleDownloadAllCalendarInvites = () => {
    const url = `/api/loans/${loanId}/reminders/calendar`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Loan Reminders</span>
          </DialogTitle>
          <DialogDescription>
            Set up email and calendar reminders for loan {loanData?.referenceNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="flex space-x-1 mb-6">
          <Button
            variant={activeTab === "create" ? "default" : "outline"}
            onClick={() => setActiveTab("create")}
            className="flex-1"
            data-testid="tab-create-reminder"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Reminder
          </Button>
          <Button
            variant={activeTab === "manage" ? "default" : "outline"}
            onClick={() => setActiveTab("manage")}
            className="flex-1"
            data-testid="tab-manage-reminders"
          >
            <Bell className="mr-2 h-4 w-4" />
            Manage ({(reminders as any[]).length || 0})
          </Button>
        </div>

        {activeTab === "create" && (
          <div className="space-y-6">
            {/* Quick Setup */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleQuickSetup(7, "due_date")}
                    className="flex flex-col items-center p-4 h-auto"
                    data-testid="quick-setup-7-days"
                  >
                    <Calendar className="h-5 w-5 mb-2" />
                    <span className="font-medium">7 Days Before</span>
                    <span className="text-sm text-muted-foreground">Due Date Alert</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleQuickSetup(3, "due_date")}
                    className="flex flex-col items-center p-4 h-auto"
                    data-testid="quick-setup-3-days"
                  >
                    <Calendar className="h-5 w-5 mb-2" />
                    <span className="font-medium">3 Days Before</span>
                    <span className="text-sm text-muted-foreground">Due Date Alert</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleQuickSetup(1, "payment")}
                    className="flex flex-col items-center p-4 h-auto"
                    data-testid="quick-setup-1-day"
                  >
                    <Mail className="h-5 w-5 mb-2" />
                    <span className="font-medium">1 Day Before</span>
                    <span className="text-sm text-muted-foreground">Payment Alert</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Custom Reminder Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Custom Reminder</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Template Selection */}
                    <FormField
                      control={form.control}
                      name="templateId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template (Optional)</FormLabel>
                          <div className="flex gap-2">
                            <Select onValueChange={(value) => {
                              field.onChange(value);
                              handleTemplateSelection(value);
                            }} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-template">
                                  <SelectValue placeholder="Choose a template or create custom reminder" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">None (Custom Reminder)</SelectItem>
                                {(templates as any[]).map((template) => (
                                  <SelectItem key={template.id} value={template.id}>
                                    {template.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {selectedTemplate && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={clearTemplate}
                                data-testid="button-clear-template"
                              >
                                Clear
                              </Button>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Template Preview */}
                    {templatePreview && (
                      <Card className="bg-muted/50">
                        <CardHeader>
                          <CardTitle className="text-sm">Template Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <span className="text-sm font-medium">Title:</span>
                            <p className="text-sm text-muted-foreground">{templatePreview.title}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Message:</span>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{templatePreview.message}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Note: You can still edit the title and message below to customize this reminder.
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reminder Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-reminder-type">
                                  <SelectValue placeholder="Select reminder type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="due_date">Due Date Alert</SelectItem>
                                <SelectItem value="payment">Payment Reminder</SelectItem>
                                <SelectItem value="review">Review Reminder</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="reminderDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reminder Date & Time</FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                {...field}
                                data-testid="input-reminder-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Loan payment due soon"
                              {...field}
                              data-testid="input-reminder-title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Additional reminder details..."
                              className="resize-none"
                              {...field}
                              data-testid="input-reminder-message"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="emailEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base flex items-center space-x-2">
                                <Mail className="h-4 w-4" />
                                <span>Email Notification</span>
                              </FormLabel>
                              <FormDescription>
                                Send reminder via email
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-email-enabled"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="calendarEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>Calendar Invite</span>
                              </FormLabel>
                              <FormDescription>
                                Add to calendar
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-calendar-enabled"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createReminderMutation.isPending}
                        data-testid="button-create-reminder"
                      >
                        {createReminderMutation.isPending ? "Creating..." : "Create Reminder"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "manage" && (
          <div className="space-y-4">
            {remindersLoading ? (
              <div className="text-center py-8">Loading reminders...</div>
            ) : (reminders as any[]).length > 0 ? (
              <div className="space-y-4">
                {/* Bulk Actions */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Your Reminders</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadAllCalendarInvites}
                    className="flex items-center space-x-2"
                    data-testid="button-download-all-calendar"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download All Calendar Invites</span>
                  </Button>
                </div>

                <div className="space-y-3">
                  {(reminders as any[]).map((reminder: any) => (
                    <Card key={reminder.id} className="border border-border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={getTypeColor(reminder.type)}>
                                {reminder.type.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <Badge variant={reminder.status === 'sent' ? 'secondary' : 'outline'}>
                                {reminder.status.toUpperCase()}
                              </Badge>
                            </div>
                            <h4 className="font-medium text-lg text-foreground">{reminder.title}</h4>
                            {reminder.message && (
                              <p className="text-sm text-muted-foreground mt-1">{reminder.message}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-3 text-sm text-muted-foreground">
                              <span>📅 {formatReminderDate(reminder.reminderDate)}</span>
                              <div className="flex items-center space-x-2">
                                {reminder.emailEnabled && <Mail className="h-4 w-4" />}
                                {reminder.calendarEnabled && <Calendar className="h-4 w-4" />}
                              </div>
                            </div>
                            
                            {/* Calendar Actions */}
                            {reminder.calendarEnabled && (
                              <div className="mt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadCalendarInvite(reminder.id)}
                                  className="flex items-center space-x-2"
                                  data-testid={`button-download-calendar-${reminder.id}`}
                                >
                                  <Download className="h-3 w-3" />
                                  <span>Download Calendar Invite</span>
                                </Button>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteReminderMutation.mutate(reminder.id)}
                            disabled={deleteReminderMutation.isPending}
                            data-testid={`button-delete-reminder-${reminder.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No reminders set for this loan.</p>
                <p className="text-sm text-muted-foreground">Use the "Create Reminder" tab to add your first reminder.</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}