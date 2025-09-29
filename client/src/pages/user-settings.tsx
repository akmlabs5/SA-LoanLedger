import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Save, 
  Settings, 
  User, 
  Globe, 
  Bell, 
  Mail, 
  Calendar, 
  Clock, 
  Shield, 
  Brain,
  Monitor,
  Smartphone,
  Palette
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Profile Settings Schema
const profileSettingsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  profileImageUrl: z.string().optional(),
});

// Preferences Schema
const userPreferencesSchema = z.object({
  timezone: z.string().default('Asia/Riyadh'),
  language: z.string().default('en'),
  currency: z.string().default('SAR'),
  dateFormat: z.string().default('DD/MM/YYYY'),
  numberFormat: z.string().default('en-SA'),
  theme: z.enum(['light', 'dark', 'system']).default('light'),
  dashboardLayout: z.enum(['grid', 'list', 'compact']).default('grid'),
  itemsPerPage: z.number().min(5).max(100).default(10),
  enableNotifications: z.boolean().default(true),
  enableSounds: z.boolean().default(false),
  compactView: z.boolean().default(false),
});

// Notification Settings Schema
const notificationSettingsSchema = z.object({
  defaultReminderIntervals: z.array(z.number()).default([7, 3, 1]),
  enableEmailReminders: z.boolean().default(true),
  enableCalendarReminders: z.boolean().default(true),
  autoApplyToNewLoans: z.boolean().default(false),
  defaultTemplateId: z.string().optional(),
  emailNotificationTime: z.string().default("09:00"),
});

// AI Insights Schema
const aiInsightsSchema = z.object({
  concentrationRiskThreshold: z.string().default('40.00'),
  ltvOutstandingThreshold: z.string().default('75.00'),
  ltvLimitThreshold: z.string().default('90.00'),
  cashFlowStrainThreshold: z.string().default('20.00'),
  rateDifferentialThreshold: z.string().default('0.50'),
  dueDateAlertDays: z.number().min(1).max(365).default(30),
});

type ProfileSettingsData = z.infer<typeof profileSettingsSchema>;
type UserPreferencesData = z.infer<typeof userPreferencesSchema>;
type NotificationSettingsData = z.infer<typeof notificationSettingsSchema>;
type AiInsightsData = z.infer<typeof aiInsightsSchema>;

export default function UserSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Fetch current user profile
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/user'],
  });

  // Fetch user preferences
  const { data: userPreferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ['/api/user/preferences'],
  });

  // Fetch user notification settings
  const { data: notificationSettings, isLoading: notificationLoading } = useQuery({
    queryKey: ['/api/user/reminder-settings'],
  });

  // Fetch AI insights config
  const { data: aiInsights, isLoading: aiLoading } = useQuery({
    queryKey: ['/api/user/ai-insights'],
  });

  // Fetch available templates for notification settings
  const { data: templates = [] } = useQuery({
    queryKey: ['/api/admin/templates'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/templates');
        if (!response.ok) {
          return [];
        }
        return response.json();
      } catch {
        return [];
      }
    },
  });

  // Profile form
  const profileForm = useForm<ProfileSettingsData>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      profileImageUrl: '',
    },
  });

  // Preferences form
  const preferencesForm = useForm<UserPreferencesData>({
    resolver: zodResolver(userPreferencesSchema),
    defaultValues: {
      timezone: 'Asia/Riyadh',
      language: 'en',
      currency: 'SAR',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: 'en-SA',
      theme: 'light',
      dashboardLayout: 'grid',
      itemsPerPage: 10,
      enableNotifications: true,
      enableSounds: false,
      compactView: false,
    },
  });

  // Notification form
  const notificationForm = useForm<NotificationSettingsData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      defaultReminderIntervals: [7, 3, 1],
      enableEmailReminders: true,
      enableCalendarReminders: true,
      autoApplyToNewLoans: false,
      emailNotificationTime: "09:00",
    },
  });

  // AI Insights form
  const aiInsightsForm = useForm<AiInsightsData>({
    resolver: zodResolver(aiInsightsSchema),
    defaultValues: {
      concentrationRiskThreshold: '40.00',
      ltvOutstandingThreshold: '75.00',
      ltvLimitThreshold: '90.00',
      cashFlowStrainThreshold: '20.00',
      rateDifferentialThreshold: '0.50',
      dueDateAlertDays: 30,
    },
  });

  // Load data into forms when it arrives
  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        profileImageUrl: user.profileImageUrl || '',
      });
    }
  }, [user, profileForm]);

  useEffect(() => {
    if (userPreferences && typeof userPreferences === 'object') {
      preferencesForm.reset({
        timezone: (userPreferences as any).timezone || 'Asia/Riyadh',
        language: (userPreferences as any).language || 'en',
        currency: (userPreferences as any).currency || 'SAR',
        dateFormat: (userPreferences as any).dateFormat || 'DD/MM/YYYY',
        numberFormat: (userPreferences as any).numberFormat || 'en-SA',
        theme: (userPreferences as any).theme || 'light',
        dashboardLayout: (userPreferences as any).dashboardLayout || 'grid',
        itemsPerPage: (userPreferences as any).itemsPerPage || 10,
        enableNotifications: (userPreferences as any).enableNotifications ?? true,
        enableSounds: (userPreferences as any).enableSounds ?? false,
        compactView: (userPreferences as any).compactView ?? false,
      });
    }
  }, [userPreferences, preferencesForm]);

  useEffect(() => {
    if (notificationSettings && typeof notificationSettings === 'object') {
      notificationForm.reset({
        defaultReminderIntervals: (notificationSettings as any).defaultReminderIntervals || [7, 3, 1],
        enableEmailReminders: (notificationSettings as any).enableEmailReminders ?? true,
        enableCalendarReminders: (notificationSettings as any).enableCalendarReminders ?? true,
        autoApplyToNewLoans: (notificationSettings as any).autoApplyToNewLoans ?? false,
        defaultTemplateId: (notificationSettings as any).defaultTemplateId || undefined,
        emailNotificationTime: (notificationSettings as any).emailNotificationTime || "09:00",
      });
    }
  }, [notificationSettings, notificationForm]);

  useEffect(() => {
    if (aiInsights && typeof aiInsights === 'object') {
      aiInsightsForm.reset({
        concentrationRiskThreshold: (aiInsights as any).concentrationRiskThreshold || '40.00',
        ltvOutstandingThreshold: (aiInsights as any).ltvOutstandingThreshold || '75.00',
        ltvLimitThreshold: (aiInsights as any).ltvLimitThreshold || '90.00',
        cashFlowStrainThreshold: (aiInsights as any).cashFlowStrainThreshold || '20.00',
        rateDifferentialThreshold: (aiInsights as any).rateDifferentialThreshold || '0.50',
        dueDateAlertDays: (aiInsights as any).dueDateAlertDays || 30,
      });
    }
  }, [aiInsights, aiInsightsForm]);

  // Profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (profileData: ProfileSettingsData) => {
      return await apiRequest("PATCH", "/api/auth/user", profileData);
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
  const savePreferencesMutation = useMutation({
    mutationFn: async (preferencesData: UserPreferencesData) => {
      return await apiRequest("POST", "/api/user/preferences", preferencesData);
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

  // Notification settings mutation
  const saveNotificationMutation = useMutation({
    mutationFn: async (notificationData: NotificationSettingsData) => {
      return await apiRequest("POST", "/api/user/reminder-settings", notificationData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/reminder-settings'] });
      toast({
        title: "Settings Saved",
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
  const saveAiInsightsMutation = useMutation({
    mutationFn: async (aiData: AiInsightsData) => {
      return await apiRequest("POST", "/api/user/ai-insights", aiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/ai-insights'] });
      toast({
        title: "AI Insights Updated",
        description: "Your AI insight preferences have been updated successfully",
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

  // Submit handlers
  const onSubmitProfile = (data: ProfileSettingsData) => {
    saveProfileMutation.mutate(data);
  };

  const onSubmitPreferences = (data: UserPreferencesData) => {
    savePreferencesMutation.mutate(data);
  };

  const onSubmitNotifications = (data: NotificationSettingsData) => {
    saveNotificationMutation.mutate(data);
  };

  const onSubmitAiInsights = (data: AiInsightsData) => {
    saveAiInsightsMutation.mutate(data);
  };

  // Handle interval management for notifications
  const addInterval = () => {
    const intervals = notificationForm.getValues("defaultReminderIntervals");
    if (intervals.length < 5) { // Max 5 intervals
      notificationForm.setValue("defaultReminderIntervals", [...intervals, 1]);
    }
  };

  const removeInterval = (index: number) => {
    const intervals = notificationForm.getValues("defaultReminderIntervals");
    if (intervals.length > 1) { // Keep at least one interval
      notificationForm.setValue("defaultReminderIntervals", intervals.filter((_, i) => i !== index));
    }
  };

  const updateInterval = (index: number, value: number) => {
    const intervals = notificationForm.getValues("defaultReminderIntervals");
    const newIntervals = [...intervals];
    newIntervals[index] = Math.max(1, value); // Minimum 1 day
    notificationForm.setValue("defaultReminderIntervals", newIntervals);
  };

  const isLoading = userLoading || preferencesLoading || notificationLoading || aiLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Settings</h1>
          <p className="text-muted-foreground">Manage your profile, preferences, and system settings</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2" data-testid="tab-profile">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2" data-testid="tab-preferences">
            <Globe className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2" data-testid="tab-notifications">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2" data-testid="tab-security">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="ai-insights" className="flex items-center gap-2" data-testid="tab-ai-insights">
            <Brain className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-8">
              <Card data-testid="card-profile-info">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and profile settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user?.profileImageUrl || ''} alt={`${user?.firstName} ${user?.lastName}`} />
                      <AvatarFallback className="text-lg font-semibold">
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="text-lg font-medium">{user?.firstName} {user?.lastName}</h3>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  
                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your first name" {...field} data-testid="input-first-name" />
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
                            <Input placeholder="Enter your last name" {...field} data-testid="input-last-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your email address" type="email" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormDescription>
                          This email will be used for login and notifications
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={saveProfileMutation.isPending}
                  className="flex items-center gap-2"
                  data-testid="button-save-profile"
                >
                  <Save className="h-4 w-4" />
                  {saveProfileMutation.isPending ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        {/* Preferences Settings */}
        <TabsContent value="preferences" className="space-y-6 mt-6">
          <Form {...preferencesForm}>
            <form onSubmit={preferencesForm.handleSubmit(onSubmitPreferences)} className="space-y-8">
              <Card data-testid="card-localization">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Localization
                  </CardTitle>
                  <CardDescription>
                    Configure your location and language preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                                <SelectValue placeholder="Select timezone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Asia/Riyadh">Riyadh (GMT+3)</SelectItem>
                              <SelectItem value="Asia/Dubai">Dubai (GMT+4)</SelectItem>
                              <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                              <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
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
                                <SelectValue placeholder="Select language" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="ar">العربية</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={preferencesForm.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-currency">
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="SAR">Saudi Riyal (SAR)</SelectItem>
                              <SelectItem value="USD">US Dollar (USD)</SelectItem>
                              <SelectItem value="EUR">Euro (EUR)</SelectItem>
                              <SelectItem value="AED">UAE Dirham (AED)</SelectItem>
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
                                <SelectValue placeholder="Select date format" />
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
                </CardContent>
              </Card>

              <Card data-testid="card-display">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Display & Layout
                  </CardTitle>
                  <CardDescription>
                    Customize how the application looks and feels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={preferencesForm.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Theme</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-theme">
                                <SelectValue placeholder="Select theme" />
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
                                <SelectValue placeholder="Select layout" />
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
                  </div>

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
                        <FormDescription>
                          Number of items to display per page in lists and tables
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormField
                      control={preferencesForm.control}
                      name="compactView"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Compact View
                            </FormLabel>
                            <FormDescription>
                              Use a more compact interface with smaller spacing
                            </FormDescription>
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
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={savePreferencesMutation.isPending}
                  className="flex items-center gap-2"
                  data-testid="button-save-preferences"
                >
                  <Save className="h-4 w-4" />
                  {savePreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Form {...notificationForm}>
            <form onSubmit={notificationForm.handleSubmit(onSubmitNotifications)} className="space-y-8">
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
                    control={notificationForm.control}
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
                    control={notificationForm.control}
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

                  {notificationForm.watch("enableEmailReminders") && (
                    <FormField
                      control={notificationForm.control}
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
                      control={notificationForm.control}
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
                    control={notificationForm.control}
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

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={saveNotificationMutation.isPending}
                  className="flex items-center gap-2"
                  data-testid="button-save-notifications"
                >
                  <Save className="h-4 w-4" />
                  {saveNotificationMutation.isPending ? "Saving..." : "Save Notification Settings"}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6 mt-6">
          <Card data-testid="card-security">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and authentication preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Password</h4>
                    <p className="text-sm text-muted-foreground">Change your account password</p>
                  </div>
                  <Button variant="outline" data-testid="button-change-password">
                    Change Password
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Active Sessions</h4>
                    <p className="text-sm text-muted-foreground">Manage your active login sessions</p>
                  </div>
                  <Button variant="outline" data-testid="button-manage-sessions">
                    View Sessions
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Button variant="outline" data-testid="button-setup-2fa">
                    Enable 2FA
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Settings */}
        <TabsContent value="ai-insights" className="space-y-6 mt-6">
          <Form {...aiInsightsForm}>
            <form onSubmit={aiInsightsForm.handleSubmit(onSubmitAiInsights)} className="space-y-8">
              <Card data-testid="card-risk-thresholds">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Risk Assessment Thresholds
                  </CardTitle>
                  <CardDescription>
                    Configure AI-powered risk analysis thresholds for your portfolio
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={aiInsightsForm.control}
                      name="concentrationRiskThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Concentration Risk Threshold (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              {...field}
                              data-testid="input-concentration-risk"
                            />
                          </FormControl>
                          <FormDescription>
                            Alert when a single bank exceeds this percentage of total exposure
                          </FormDescription>
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
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              {...field}
                              data-testid="input-ltv-outstanding"
                            />
                          </FormControl>
                          <FormDescription>
                            Alert when loan-to-value ratio on outstanding amount exceeds this percentage
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={aiInsightsForm.control}
                      name="ltvLimitThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LTV Limit Threshold (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              {...field}
                              data-testid="input-ltv-limit"
                            />
                          </FormControl>
                          <FormDescription>
                            Alert when loan-to-value ratio on facility limit exceeds this percentage
                          </FormDescription>
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
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              {...field}
                              data-testid="input-cashflow-strain"
                            />
                          </FormControl>
                          <FormDescription>
                            Alert when debt service as percentage of cash flow exceeds this threshold
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={aiInsightsForm.control}
                      name="rateDifferentialThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate Differential Threshold (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              {...field}
                              data-testid="input-rate-differential"
                            />
                          </FormControl>
                          <FormDescription>
                            Alert when interest rate differential between facilities exceeds this percentage
                          </FormDescription>
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
                              data-testid="input-due-date-alert"
                            />
                          </FormControl>
                          <FormDescription>
                            Number of days before loan due date to generate alerts
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={saveAiInsightsMutation.isPending}
                  className="flex items-center gap-2"
                  data-testid="button-save-ai-insights"
                >
                  <Save className="h-4 w-4" />
                  {saveAiInsightsMutation.isPending ? "Saving..." : "Save AI Insights"}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}