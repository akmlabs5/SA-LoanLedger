import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Settings, Bell, Mail, Calendar, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const userSettingsSchema = z.object({
  defaultReminderIntervals: z.array(z.number()).default([7, 3, 1]), // Days before due date
  enableEmailReminders: z.boolean().default(true),
  enableCalendarReminders: z.boolean().default(true),
  autoApplyToNewLoans: z.boolean().default(false),
  defaultTemplateId: z.string().optional(),
  emailNotificationTime: z.string().default("09:00"), // 24-hour format
});

type UserSettingsFormData = z.infer<typeof userSettingsSchema>;

export default function UserSettingsPage() {
  const { toast } = useToast();
  
  // Fetch user settings
  const { data: userSettings, isLoading } = useQuery({
    queryKey: ['/api/user/reminder-settings'],
  });

  // Fetch available templates for selection
  const { data: templates = [] } = useQuery({
    queryKey: ['/api/admin/templates'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/templates');
        if (!response.ok) {
          // If templates endpoint requires admin access, return empty array
          return [];
        }
        return response.json();
      } catch {
        return [];
      }
    },
  });

  const form = useForm<UserSettingsFormData>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: {
      defaultReminderIntervals: [7, 3, 1],
      enableEmailReminders: true,
      enableCalendarReminders: true,
      autoApplyToNewLoans: false,
      emailNotificationTime: "09:00",
    },
  });

  // Load user settings into form when data arrives
  useEffect(() => {
    if (userSettings && typeof userSettings === 'object') {
      form.reset({
        defaultReminderIntervals: (userSettings as any).defaultReminderIntervals || [7, 3, 1],
        enableEmailReminders: (userSettings as any).enableEmailReminders ?? true,
        enableCalendarReminders: (userSettings as any).enableCalendarReminders ?? true,
        autoApplyToNewLoans: (userSettings as any).autoApplyToNewLoans ?? false,
        defaultTemplateId: (userSettings as any).defaultTemplateId || undefined,
        emailNotificationTime: (userSettings as any).emailNotificationTime || "09:00",
      });
    }
  }, [userSettings, form]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsData: UserSettingsFormData) => {
      return await apiRequest("POST", "/api/user/reminder-settings", settingsData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/reminder-settings'] });
      toast({
        title: "Settings Saved",
        description: "Your reminder preferences have been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserSettingsFormData) => {
    saveSettingsMutation.mutate(data);
  };

  // Handle interval management
  const addInterval = () => {
    const intervals = form.getValues("defaultReminderIntervals");
    if (intervals.length < 5) { // Max 5 intervals
      form.setValue("defaultReminderIntervals", [...intervals, 1]);
    }
  };

  const removeInterval = (index: number) => {
    const intervals = form.getValues("defaultReminderIntervals");
    if (intervals.length > 1) { // Keep at least one interval
      form.setValue("defaultReminderIntervals", intervals.filter((_, i) => i !== index));
    }
  };

  const updateInterval = (index: number, value: number) => {
    const intervals = form.getValues("defaultReminderIntervals");
    const newIntervals = [...intervals];
    newIntervals[index] = Math.max(1, value); // Minimum 1 day
    form.setValue("defaultReminderIntervals", newIntervals);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reminder Settings</h1>
          <p className="text-muted-foreground">Configure your default reminder preferences for loan management</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Default Reminder Intervals */}
          <Card data-testid="card-reminder-intervals">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Default Reminder Intervals
              </CardTitle>
              <CardDescription>
                Set the default number of days before due dates to send reminders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {form.watch("defaultReminderIntervals").map((interval, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={interval}
                      onChange={(e) => updateInterval(index, parseInt(e.target.value) || 1)}
                      className="w-24"
                      data-testid={`input-interval-${index}`}
                    />
                    <span className="text-sm text-muted-foreground">days before due date</span>
                    {form.watch("defaultReminderIntervals").length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeInterval(index)}
                        data-testid={`button-remove-interval-${index}`}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              {form.watch("defaultReminderIntervals").length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addInterval}
                  data-testid="button-add-interval"
                >
                  Add Another Interval
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card data-testid="card-notification-preferences">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to receive reminder notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="enableEmailReminders"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center gap-2 text-base">
                        <Mail className="h-4 w-4" />
                        Email Reminders
                      </FormLabel>
                      <FormDescription>
                        Receive reminder notifications via email
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-email-reminders"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enableCalendarReminders"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center gap-2 text-base">
                        <Calendar className="h-4 w-4" />
                        Calendar Reminders
                      </FormLabel>
                      <FormDescription>
                        Generate calendar invites for loan due dates
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-calendar-reminders"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("enableEmailReminders") && (
                <FormField
                  control={form.control}
                  name="emailNotificationTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Email Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          className="w-48"
                          data-testid="input-email-time"
                        />
                      </FormControl>
                      <FormDescription>
                        What time of day should email reminders be sent?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Template Selection */}
          {templates.length > 0 && (
            <Card data-testid="card-template-selection">
              <CardHeader>
                <CardTitle>Default Message Template</CardTitle>
                <CardDescription>
                  Choose the default template for your reminder messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="defaultTemplateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-template">
                            <SelectValue placeholder="Select a default template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No default template</SelectItem>
                          {templates.map((template: any) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{template.type}</Badge>
                                {template.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This template will be used by default for new reminders
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Auto-Apply Settings */}
          <Card data-testid="card-auto-apply">
            <CardHeader>
              <CardTitle>Automation Settings</CardTitle>
              <CardDescription>
                Configure automatic reminder creation for new loans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="autoApplyToNewLoans"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Auto-Apply to New Loans
                      </FormLabel>
                      <FormDescription>
                        Automatically create reminders for new loans using your default settings
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-auto-apply"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Separator />

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saveSettingsMutation.isPending}
              className="flex items-center gap-2"
              data-testid="button-save-settings"
            >
              <Save className="h-4 w-4" />
              {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}