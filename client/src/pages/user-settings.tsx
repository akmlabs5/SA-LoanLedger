import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  Brain,
  Save,
  Globe,
  Palette,
  Clock,
  DollarSign
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Profile schema
const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

// Preferences schema
const preferencesSchema = z.object({
  timezone: z.string().min(1, "Timezone is required"),
  language: z.string().min(1, "Language is required"),
  currency: z.string().min(1, "Currency is required"),
  dateFormat: z.string().min(1, "Date format is required"),
  theme: z.enum(['light', 'dark', 'system']),
  dashboardLayout: z.enum(['grid', 'list', 'compact']),
  itemsPerPage: z.coerce.number().min(5).max(100),
  enableNotifications: z.boolean(),
  enableSounds: z.boolean(),
  compactView: z.boolean(),
});

// Notification settings schema
const notificationSchema = z.object({
  defaultReminderIntervals: z.array(z.number()).default([7, 3, 1]),
  enableEmailReminders: z.boolean().default(true),
  enableCalendarReminders: z.boolean().default(true),
  autoApplyToNewLoans: z.boolean().default(false),
});

// AI Insights schema
const aiInsightsSchema = z.object({
  concentrationRiskThreshold: z.string().default("40.00"),
  ltvOutstandingThreshold: z.string().default("75.00"),
  ltvLimitThreshold: z.string().default("90.00"),
  cashFlowStrainThreshold: z.string().default("20.00"),
  rateDifferentialThreshold: z.string().default("0.50"),
  dueDateAlertDays: z.coerce.number().min(1).max(365).default(30),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PreferencesFormData = z.infer<typeof preferencesSchema>;
type NotificationFormData = z.infer<typeof notificationSchema>;
type AIInsightsFormData = z.infer<typeof aiInsightsSchema>;

export default function UserSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
  });

  // Fetch user preferences
  const { data: preferences } = useQuery({
    queryKey: ['/api/user/preferences'],
  });

  // Fetch notification settings
  const { data: notifications } = useQuery({
    queryKey: ['/api/user/reminder-settings'],
  });

  // Fetch AI insights config
  const { data: aiConfig } = useQuery({
    queryKey: ['/api/user/ai-insights'],
  });

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    },
  });

  // Preferences form
  const preferencesForm = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    values: {
      timezone: preferences?.timezone || 'Asia/Riyadh',
      language: preferences?.language || 'en',
      currency: preferences?.currency || 'SAR',
      dateFormat: preferences?.dateFormat || 'DD/MM/YYYY',
      theme: preferences?.theme || 'light',
      dashboardLayout: preferences?.dashboardLayout || 'grid',
      itemsPerPage: preferences?.itemsPerPage || 10,
      enableNotifications: preferences?.enableNotifications ?? true,
      enableSounds: preferences?.enableSounds ?? false,
      compactView: preferences?.compactView ?? false,
    },
  });

  // Notification form
  const notificationForm = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    values: {
      defaultReminderIntervals: notifications?.defaultIntervals || [7, 3, 1],
      enableEmailReminders: notifications?.defaultEmailEnabled ?? true,
      enableCalendarReminders: notifications?.defaultCalendarEnabled ?? false,
      autoApplyToNewLoans: notifications?.autoApplyEnabled ?? false,
    },
  });

  // AI Insights form
  const aiInsightsForm = useForm<AIInsightsFormData>({
    resolver: zodResolver(aiInsightsSchema),
    values: {
      concentrationRiskThreshold: aiConfig?.concentrationRiskThreshold || "40.00",
      ltvOutstandingThreshold: aiConfig?.ltvOutstandingThreshold || "75.00",
      ltvLimitThreshold: aiConfig?.ltvLimitThreshold || "90.00",
      cashFlowStrainThreshold: aiConfig?.cashFlowStrainThreshold || "20.00",
      rateDifferentialThreshold: aiConfig?.rateDifferentialThreshold || "0.50",
      dueDateAlertDays: aiConfig?.dueDateAlertDays || 30,
    },
  });

  // Profile mutation
  const profileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return await apiRequest("PATCH", "/api/auth/user", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Preferences mutation
  const preferencesMutation = useMutation({
    mutationFn: async (data: PreferencesFormData) => {
      return await apiRequest("POST", "/api/user/preferences", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
      toast({
        title: "Preferences Saved",
        description: "Your preferences have been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save preferences",
        variant: "destructive",
      });
    },
  });

  // Notification mutation
  const notificationMutation = useMutation({
    mutationFn: async (data: NotificationFormData) => {
      return await apiRequest("POST", "/api/user/reminder-settings", {
        defaultIntervals: data.defaultReminderIntervals,
        defaultEmailEnabled: data.enableEmailReminders,
        defaultCalendarEnabled: data.enableCalendarReminders,
        autoApplyEnabled: data.autoApplyToNewLoans,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/reminder-settings'] });
      toast({
        title: "Notification Settings Saved",
        description: "Your notification preferences have been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save notification settings",
        variant: "destructive",
      });
    },
  });

  // AI Insights mutation
  const aiInsightsMutation = useMutation({
    mutationFn: async (data: AIInsightsFormData) => {
      return await apiRequest("POST", "/api/user/ai-insights", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/ai-insights'] });
      toast({
        title: "AI Insights Settings Saved",
        description: "Your AI insights thresholds have been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save AI insights settings",
        variant: "destructive",
      });
    },
  });

  // Interval management functions
  const addInterval = () => {
    const intervals = notificationForm.getValues("defaultReminderIntervals");
    if (intervals.length < 5) {
      notificationForm.setValue("defaultReminderIntervals", [...intervals, 1]);
    }
  };

  const removeInterval = (index: number) => {
    const intervals = notificationForm.getValues("defaultReminderIntervals");
    if (intervals.length > 1) {
      notificationForm.setValue("defaultReminderIntervals", intervals.filter((_, i) => i !== index));
    }
  };

  const updateInterval = (index: number, value: number) => {
    const intervals = notificationForm.getValues("defaultReminderIntervals");
    const newIntervals = [...intervals];
    newIntervals[index] = Math.max(1, value);
    notificationForm.setValue("defaultReminderIntervals", newIntervals);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">User Settings</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5" data-testid="tabs-settings">
            <TabsTrigger value="profile" className="flex items-center gap-2" data-testid="tab-profile">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2" data-testid="tab-preferences">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2" data-testid="tab-notifications">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="ai-insights" className="flex items-center gap-2" data-testid="tab-ai-insights">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI Insights</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2" data-testid="tab-security">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card data-testid="card-profile">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit((data) => profileMutation.mutate(data))} className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-first-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-last-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={profileMutation.isPending}
                        className="flex items-center gap-2"
                        data-testid="button-save-profile"
                      >
                        <Save className="h-4 w-4" />
                        {profileMutation.isPending ? "Saving..." : "Save Profile"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card data-testid="card-regional">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Regional Settings
                </CardTitle>
                <CardDescription>Configure your regional preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...preferencesForm}>
                  <form onSubmit={preferencesForm.handleSubmit((data) => preferencesMutation.mutate(data))} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={preferencesForm.control}
                        name="timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timezone</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-timezone">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Asia/Riyadh">Asia/Riyadh (GMT+3)</SelectItem>
                                <SelectItem value="Asia/Dubai">Asia/Dubai (GMT+4)</SelectItem>
                                <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                                <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={preferencesForm.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Language</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-language">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="ar">العربية (Arabic)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={preferencesForm.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Currency
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-currency">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="SAR">SAR (Saudi Riyal)</SelectItem>
                                <SelectItem value="USD">USD (US Dollar)</SelectItem>
                                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                                <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={preferencesForm.control}
                        name="dateFormat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date Format</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-date-format">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Display Settings</h3>
                      <div className="space-y-6">
                        <FormField
                          control={preferencesForm.control}
                          name="theme"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Theme</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-theme">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="light">Light</SelectItem>
                                  <SelectItem value="dark">Dark</SelectItem>
                                  <SelectItem value="system">System</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={preferencesForm.control}
                          name="dashboardLayout"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dashboard Layout</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-dashboard-layout">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="grid">Grid View</SelectItem>
                                  <SelectItem value="list">List View</SelectItem>
                                  <SelectItem value="compact">Compact View</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={preferencesForm.control}
                          name="itemsPerPage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Items Per Page</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="5"
                                  max="100"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                                  data-testid="input-items-per-page"
                                />
                              </FormControl>
                              <FormDescription>Number of items to display per page (5-100)</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={preferencesForm.control}
                          name="compactView"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Compact View</FormLabel>
                                <FormDescription>Use a more compact layout throughout the app</FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-compact-view"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={preferencesForm.control}
                          name="enableNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Enable Notifications</FormLabel>
                                <FormDescription>Receive notifications for important updates</FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-enable-notifications"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={preferencesForm.control}
                          name="enableSounds"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Enable Sounds</FormLabel>
                                <FormDescription>Play sound effects for notifications and actions</FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-enable-sounds"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={preferencesMutation.isPending}
                        className="flex items-center gap-2"
                        data-testid="button-save-preferences"
                      >
                        <Save className="h-4 w-4" />
                        {preferencesMutation.isPending ? "Saving..." : "Save Preferences"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card data-testid="card-reminder-intervals">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Default Reminder Intervals
                </CardTitle>
                <CardDescription>Set the default number of days before due dates to send reminders</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit((data) => notificationMutation.mutate(data))} className="space-y-6">
                    <div className="space-y-3">
                      {notificationForm.watch("defaultReminderIntervals").map((interval, index) => (
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
                          {notificationForm.watch("defaultReminderIntervals").length > 1 && (
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

                    {notificationForm.watch("defaultReminderIntervals").length < 5 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addInterval}
                        data-testid="button-add-interval"
                      >
                        Add Another Interval
                      </Button>
                    )}

                    <Separator />

                    <div className="space-y-4">
                      <FormField
                        control={notificationForm.control}
                        name="enableEmailReminders"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Email Reminders</FormLabel>
                              <FormDescription>Receive reminder notifications via email</FormDescription>
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
                        control={notificationForm.control}
                        name="enableCalendarReminders"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Calendar Reminders</FormLabel>
                              <FormDescription>Generate calendar invites for loan due dates</FormDescription>
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

                      <FormField
                        control={notificationForm.control}
                        name="autoApplyToNewLoans"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Auto-Apply to New Loans</FormLabel>
                              <FormDescription>Automatically create reminders for new loans using your default settings</FormDescription>
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
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={notificationMutation.isPending}
                        className="flex items-center gap-2"
                        data-testid="button-save-notifications"
                      >
                        <Save className="h-4 w-4" />
                        {notificationMutation.isPending ? "Saving..." : "Save Notification Settings"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="ai-insights" className="space-y-6">
            <Card data-testid="card-ai-thresholds">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Insight Thresholds
                </CardTitle>
                <CardDescription>Configure the thresholds for AI-powered portfolio insights and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...aiInsightsForm}>
                  <form onSubmit={aiInsightsForm.handleSubmit((data) => aiInsightsMutation.mutate(data))} className="space-y-6">
                    <FormField
                      control={aiInsightsForm.control}
                      name="concentrationRiskThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Concentration Risk Threshold (%)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" data-testid="input-concentration-risk" />
                          </FormControl>
                          <FormDescription>Alert when a single bank exceeds this percentage of total exposure</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={aiInsightsForm.control}
                      name="ltvOutstandingThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LTV Outstanding Threshold (%)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" data-testid="input-ltv-outstanding" />
                          </FormControl>
                          <FormDescription>Alert when loan-to-value ratio against outstanding exceeds this percentage</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={aiInsightsForm.control}
                      name="ltvLimitThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LTV Limit Threshold (%)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" data-testid="input-ltv-limit" />
                          </FormControl>
                          <FormDescription>Alert when loan-to-value ratio against credit limit exceeds this percentage</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={aiInsightsForm.control}
                      name="cashFlowStrainThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cash Flow Strain Threshold (%)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" data-testid="input-cash-flow-strain" />
                          </FormControl>
                          <FormDescription>Alert when debt service exceeds this percentage of projected cash flow</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={aiInsightsForm.control}
                      name="rateDifferentialThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate Differential Threshold (%)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" data-testid="input-rate-differential" />
                          </FormControl>
                          <FormDescription>Alert when rate difference between facilities exceeds this percentage</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={aiInsightsForm.control}
                      name="dueDateAlertDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date Alert Days</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="365"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                              data-testid="input-due-date-alert-days"
                            />
                          </FormControl>
                          <FormDescription>Number of days before due date to trigger alerts (1-365)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={aiInsightsMutation.isPending}
                        className="flex items-center gap-2"
                        data-testid="button-save-ai-insights"
                      >
                        <Save className="h-4 w-4" />
                        {aiInsightsMutation.isPending ? "Saving..." : "Save AI Insights Settings"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card data-testid="card-security">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Manage your account security and authentication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border p-4 bg-muted/50">
                  <h3 className="font-semibold mb-2">Authentication Provider</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your account is secured using Replit Authentication. Password management and two-factor authentication
                    are handled through your Replit account settings.
                  </p>
                  <Button variant="outline" asChild data-testid="button-replit-security">
                    <a href="https://replit.com/account" target="_blank" rel="noopener noreferrer">
                      Manage Replit Security Settings
                    </a>
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Active Sessions</h3>
                  <p className="text-sm text-muted-foreground">
                    You are currently logged in. Your session will expire after 24 hours of inactivity.
                  </p>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-muted-foreground">Active now</p>
                    </div>
                    <Button variant="outline" data-testid="button-logout">
                      Sign Out
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
    </div>
  );
}
