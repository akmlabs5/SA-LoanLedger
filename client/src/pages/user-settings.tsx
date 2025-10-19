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
  DollarSign,
  Mail,
  Sparkles,
  Building2,
  TrendingUp,
  LifeBuoy,
  FileText,
  AlertTriangle,
  Target,
  BarChart3,
  Zap,
  MessageSquare,
  Download,
  Eye,
  Globe2,
  Percent,
  Calendar,
  CreditCard,
  Languages,
  BookOpen,
  Database,
  Boxes,
  Lightbulb,
  Keyboard,
  CheckCircle,
  Smartphone
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PageContainer, PageHeader, Section } from "@/components/PageContainer";

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
  dashboardLayout: z.enum(['grid', 'list']),
  itemsPerPage: z.coerce.number().min(5).max(100),
  enableNotifications: z.boolean().default(true),
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

// Daily Alerts schema
const dailyAlertsSchema = z.object({
  enabled: z.boolean().default(false),
  preferredTime: z.string().default("08:00"),
  enableCriticalAlerts: z.boolean().default(true),
  enableHighAlerts: z.boolean().default(true),
  enableMediumAlerts: z.boolean().default(true),
  enableLowAlerts: z.boolean().default(false),
  utilizationThreshold: z.string().default("80.00"),
  concentrationThreshold: z.string().default("40.00"),
  ltvThreshold: z.string().default("70.00"),
  revolvingThreshold: z.string().default("80.00"),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PreferencesFormData = z.infer<typeof preferencesSchema>;
type NotificationFormData = z.infer<typeof notificationSchema>;
type AIInsightsFormData = z.infer<typeof aiInsightsSchema>;
type DailyAlertsFormData = z.infer<typeof dailyAlertsSchema>;

function TwoFactorAuthCard() {
  const { toast } = useToast();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  // Fetch 2FA status
  useQuery({
    queryKey: ['/api/auth/supabase/2fa-status'],
    queryFn: async () => {
      const session = localStorage.getItem('supabase_session');
      if (!session) {
        setIsLoading(false);
        return null;
      }
      
      const sessionData = JSON.parse(session);
      const response = await fetch('/api/auth/supabase/2fa-status', {
        headers: {
          'Authorization': `Bearer ${sessionData.access_token}`
        }
      });
      
      if (!response.ok) {
        setIsLoading(false);
        throw new Error('Failed to fetch 2FA status');
      }
      
      const data = await response.json();
      setIs2FAEnabled(data.twoFactorEnabled);
      setIsLoading(false);
      return data;
    },
    enabled: true,
  });

  const toggle2FA = async (enabled: boolean) => {
    setIsToggling(true);
    try {
      const session = localStorage.getItem('supabase_session');
      if (!session) {
        throw new Error('Not authenticated');
      }
      
      const sessionData = JSON.parse(session);
      const response = await fetch('/api/auth/supabase/toggle-2fa', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update 2FA');
      }

      setIs2FAEnabled(enabled);
      toast({
        title: enabled ? "2FA Enabled" : "2FA Disabled",
        description: data.message || (enabled 
          ? "Two-factor authentication has been enabled for your account" 
          : "Two-factor authentication has been disabled"),
      });
    } catch (error: any) {
      console.error('Toggle 2FA error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update 2FA settings",
        variant: "destructive",
      });
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Card data-testid="card-2fa">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Two-Factor Authentication (2FA)
        </CardTitle>
        <CardDescription>Add an extra layer of security to your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-900/10">
          <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">What is 2FA?</h3>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Two-factor authentication adds an extra layer of security by requiring a verification code sent to your email 
            in addition to your password when signing in.
          </p>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <p className="font-medium">Email Verification</p>
            <p className="text-sm text-muted-foreground">
              {is2FAEnabled 
                ? "Receive a 6-digit code via email when signing in" 
                : "Enable to require email verification on sign-in"}
            </p>
          </div>
          <Switch
            checked={is2FAEnabled}
            onCheckedChange={toggle2FA}
            disabled={isLoading || isToggling}
            data-testid="switch-2fa"
          />
        </div>

        {is2FAEnabled && (
          <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-900/10">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">2FA is Active</p>
                <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                  Your account is protected with two-factor authentication. You'll receive a verification code 
                  via email each time you sign in.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function UserSettingsPage() {
  const { toast } = useToast();
  const { playSuccess, playError, playClick } = useSoundEffects();
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

  // Fetch daily alerts preferences
  const { data: dailyAlertsConfig, isLoading: dailyAlertsLoading } = useQuery({
    queryKey: ['/api/user/daily-alerts-preferences'],
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

  // Daily Alerts form
  const dailyAlertsForm = useForm<DailyAlertsFormData>({
    resolver: zodResolver(dailyAlertsSchema),
    values: {
      enabled: dailyAlertsConfig?.enabled ?? false,
      preferredTime: dailyAlertsConfig?.preferredTime || "08:00",
      enableCriticalAlerts: dailyAlertsConfig?.enableCriticalAlerts ?? true,
      enableHighAlerts: dailyAlertsConfig?.enableHighAlerts ?? true,
      enableMediumAlerts: dailyAlertsConfig?.enableMediumAlerts ?? true,
      enableLowAlerts: dailyAlertsConfig?.enableLowAlerts ?? false,
      utilizationThreshold: dailyAlertsConfig?.utilizationThreshold || "80.00",
      concentrationThreshold: dailyAlertsConfig?.concentrationThreshold || "40.00",
      ltvThreshold: dailyAlertsConfig?.ltvThreshold || "70.00",
      revolvingThreshold: dailyAlertsConfig?.revolvingThreshold || "80.00",
    },
  });

  // Profile mutation
  const profileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return await apiRequest("PATCH", "/api/auth/user", data);
    },
    onSuccess: () => {
      playSuccess();
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully",
      });
    },
    onError: (error: any) => {
      playError();
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
      playSuccess();
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
      toast({
        title: "Preferences Saved",
        description: "Your preferences have been updated successfully",
      });
    },
    onError: (error: any) => {
      playError();
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
      playSuccess();
      queryClient.invalidateQueries({ queryKey: ['/api/user/reminder-settings'] });
      toast({
        title: "Notification Settings Saved",
        description: "Your notification preferences have been updated successfully",
      });
    },
    onError: (error: any) => {
      playError();
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
      playSuccess();
      queryClient.invalidateQueries({ queryKey: ['/api/user/ai-insights'] });
      toast({
        title: "AI Insights Settings Saved",
        description: "Your AI insights thresholds have been updated successfully",
      });
    },
    onError: (error: any) => {
      playError();
      toast({
        title: "Error",
        description: error.message || "Failed to save AI insights settings",
        variant: "destructive",
      });
    },
  });

  // Daily Alerts mutation
  const dailyAlertsMutation = useMutation({
    mutationFn: async (data: DailyAlertsFormData) => {
      return await apiRequest("POST", "/api/user/daily-alerts-preferences", data);
    },
    onSuccess: () => {
      playSuccess();
      queryClient.invalidateQueries({ queryKey: ['/api/user/daily-alerts-preferences'] });
      toast({
        title: "Daily Alerts Saved",
        description: "Your daily alerts preferences have been updated successfully",
      });
    },
    onError: (error: any) => {
      playError();
      toast({
        title: "Error",
        description: error.message || "Failed to save daily alerts preferences",
        variant: "destructive",
      });
    },
  });

  // Send test email mutation
  const sendTestEmailMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/ai/daily-alerts/send", {});
    },
    onSuccess: () => {
      toast({
        title: "Test Email Sent",
        description: "A test daily alerts email has been sent to your email address",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
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
    <PageContainer>
      <PageHeader
        title="User Settings"
        subtitle="Manage your account settings and preferences"
        icon={<Settings className="h-6 w-6" />}
      />

      <Section>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-7" data-testid="tabs-settings">
            <TabsTrigger value="profile" className="flex items-center gap-2 h-12" data-testid="tab-profile">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2 h-12" data-testid="tab-preferences">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 h-12" data-testid="tab-notifications">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="daily-alerts" className="flex items-center gap-2 h-12" data-testid="tab-daily-alerts">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Daily Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="ai-insights" className="flex items-center gap-2 h-12" data-testid="tab-ai-insights">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI Insights</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 h-12" data-testid="tab-security">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2 h-12" data-testid="tab-team">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Section className="space-y-6">
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
                            <Input {...field} className="h-12" data-testid="input-first-name" />
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
                            <Input {...field} className="h-12" data-testid="input-last-name" />
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
                            <Input {...field} type="email" className="h-12 bg-muted" disabled data-testid="input-email" />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Email cannot be changed as it's linked to your authentication account
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={profileMutation.isPending}
                        className="flex items-center gap-2 h-12"
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
            </Section>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Section className="space-y-6">
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
                                <SelectTrigger className="h-12" data-testid="select-timezone">
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
                                <SelectTrigger className="h-12" data-testid="select-language">
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
                            <FormLabel>
                              Currency
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12" data-testid="select-currency">
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
                                <SelectTrigger className="h-12" data-testid="select-date-format">
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
                                  <SelectTrigger className="h-12" data-testid="select-theme">
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
                                  <SelectTrigger className="h-12" data-testid="select-dashboard-layout">
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
                                  className="h-12"
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
                        className="flex items-center gap-2 h-12"
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
            </Section>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Section className="space-y-6">
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
                            className="w-24 h-12"
                            data-testid={`input-interval-${index}`}
                          />
                          <span className="text-sm text-muted-foreground">days before due date</span>
                          {notificationForm.watch("defaultReminderIntervals").length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-12"
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
                        className="h-12"
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
                        className="flex items-center gap-2 h-12"
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
            </Section>
          </TabsContent>

          {/* Daily Alerts Tab */}
          <TabsContent value="daily-alerts">
            <Section className="space-y-6">
            <Card data-testid="card-daily-alerts">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Daily Email Alerts
                </CardTitle>
                <CardDescription>Configure automated daily email alerts for your portfolio</CardDescription>
              </CardHeader>
              <CardContent>
                {dailyAlertsLoading ? (
                  <div className="space-y-4">
                    <div className="h-20 bg-muted animate-pulse rounded-lg" />
                    <div className="h-20 bg-muted animate-pulse rounded-lg" />
                    <div className="h-32 bg-muted animate-pulse rounded-lg" />
                    <div className="h-32 bg-muted animate-pulse rounded-lg" />
                  </div>
                ) : (
                <Form {...dailyAlertsForm}>
                  <form onSubmit={dailyAlertsForm.handleSubmit((data) => dailyAlertsMutation.mutate(data))} className="space-y-6">
                    <FormField
                      control={dailyAlertsForm.control}
                      name="enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable Daily Alerts</FormLabel>
                            <FormDescription>Receive daily email summaries of portfolio alerts</FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-daily-alerts-enabled"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={dailyAlertsForm.control}
                      name="preferredTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Preferred Time
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12" data-testid="select-preferred-time">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 13 }, (_, i) => i + 8).map((hour) => {
                                const time = `${hour.toString().padStart(2, '0')}:00`;
                                return (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormDescription>Time to receive daily alerts (08:00-20:00)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Alert Categories</h3>
                      <div className="space-y-4">
                        <FormField
                          control={dailyAlertsForm.control}
                          name="enableCriticalAlerts"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="checkbox-critical-alerts"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="flex items-center gap-2">
                                  <Badge variant="destructive">Critical</Badge>
                                  Critical Alerts
                                </FormLabel>
                                <FormDescription>
                                  Overdue Loans, Expiring Facilities (within 7 days)
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={dailyAlertsForm.control}
                          name="enableHighAlerts"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="checkbox-high-alerts"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="flex items-center gap-2">
                                  <Badge className="bg-orange-500">High</Badge>
                                  High Priority Alerts
                                </FormLabel>
                                <FormDescription>
                                  Due Soon (7 days), High Utilization
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={dailyAlertsForm.control}
                          name="enableMediumAlerts"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="checkbox-medium-alerts"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="flex items-center gap-2">
                                  <Badge className="bg-yellow-500">Medium</Badge>
                                  Medium Priority Alerts
                                </FormLabel>
                                <FormDescription>
                                  Bank Concentration, Portfolio LTV, Revolving Period
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={dailyAlertsForm.control}
                          name="enableLowAlerts"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="checkbox-low-alerts"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="flex items-center gap-2">
                                  <Badge variant="outline">Low</Badge>
                                  Low Priority Alerts
                                </FormLabel>
                                <FormDescription>
                                  Due Soon (30 days)
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Custom Thresholds</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={dailyAlertsForm.control}
                          name="concentrationThreshold"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Percent className="h-4 w-4" />
                                Concentration Risk %
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  placeholder="40.00"
                                  className="h-12"
                                  data-testid="input-concentration-threshold"
                                />
                              </FormControl>
                              <FormDescription>Default: 40%</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={dailyAlertsForm.control}
                          name="ltvThreshold"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                Portfolio LTV %
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  placeholder="70.00"
                                  className="h-12"
                                  data-testid="input-ltv-threshold"
                                />
                              </FormControl>
                              <FormDescription>Default: 70%</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={dailyAlertsForm.control}
                          name="utilizationThreshold"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Utilization %
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  placeholder="80.00"
                                  className="h-12"
                                  data-testid="input-utilization-threshold"
                                />
                              </FormControl>
                              <FormDescription>Default: 80%</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={dailyAlertsForm.control}
                          name="revolvingThreshold"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Revolving Period %
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  placeholder="80.00"
                                  className="h-12"
                                  data-testid="input-revolving-threshold"
                                />
                              </FormControl>
                              <FormDescription>Default: 80%</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => sendTestEmailMutation.mutate()}
                        disabled={sendTestEmailMutation.isPending}
                        className="flex items-center gap-2 h-12"
                        data-testid="button-send-test-email"
                      >
                        <Mail className="h-4 w-4" />
                        {sendTestEmailMutation.isPending ? "Sending..." : "Send Test Email"}
                      </Button>
                      <Button
                        type="submit"
                        disabled={dailyAlertsMutation.isPending}
                        className="flex items-center gap-2 h-12"
                        data-testid="button-save-daily-alerts"
                      >
                        <Save className="h-4 w-4" />
                        {dailyAlertsMutation.isPending ? "Saving..." : "Save Daily Alerts"}
                      </Button>
                    </div>
                  </form>
                </Form>
                )}
              </CardContent>
            </Card>
            </Section>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="ai-insights">
            <Section className="space-y-6">
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
                            <Input {...field} type="number" step="0.01" className="h-12" data-testid="input-concentration-risk" />
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
                            <Input {...field} type="number" step="0.01" className="h-12" data-testid="input-ltv-outstanding" />
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
                            <Input {...field} type="number" step="0.01" className="h-12" data-testid="input-ltv-limit" />
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
                            <Input {...field} type="number" step="0.01" className="h-12" data-testid="input-cash-flow-strain" />
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
                            <Input {...field} type="number" step="0.01" className="h-12" data-testid="input-rate-differential" />
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
                              className="h-12"
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
                        className="flex items-center gap-2 h-12"
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
            </Section>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Section className="space-y-6">
            <TwoFactorAuthCard />
            
            <Card data-testid="card-security">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Manage your account security and authentication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-900/10">
                  <h3 className="font-semibold mb-2 text-green-900 dark:text-green-100">Account Security</h3>
                  <p className="text-sm text-green-800 dark:text-green-200 mb-4">
                    Your account is secured with email-based authentication and optional two-factor authentication (2FA). 
                    Manage your password and security settings below.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="outline" 
                      className="h-12 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/20" 
                      data-testid="button-change-password"
                      onClick={async () => {
                        try {
                          const session = localStorage.getItem('supabase_session');
                          if (!session) {
                            toast({
                              title: "Error",
                              description: "Please log in to change your password.",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          const sessionData = JSON.parse(session);
                          const response = await fetch('/api/auth/supabase/reset-password', {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${sessionData.access_token}`
                            }
                          });
                          
                          const data = await response.json();
                          
                          if (data.success) {
                            toast({
                              title: "Password Reset Email Sent",
                              description: data.message || "Check your email for the password reset link.",
                            });
                          } else {
                            throw new Error(data.message || 'Failed to send reset email');
                          }
                        } catch (error: any) {
                          toast({
                            title: "Error",
                            description: error.message || "Failed to send password reset email.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Change Password
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Active Sessions</h3>
                  <p className="text-sm text-muted-foreground">
                    You are currently logged in. Your session will expire after 7 days of inactivity.
                  </p>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-muted-foreground">Active now</p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="h-12" 
                      data-testid="button-logout"
                      onClick={async () => {
                        try {
                          await fetch('/api/logout', {
                            method: 'GET',
                            credentials: 'include'
                          });
                          window.location.href = '/unified-login';
                        } catch (error) {
                          console.error('Logout error:', error);
                        }
                      }}
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            </Section>
          </TabsContent>

          {/* Team Management Tab */}
          <TabsContent value="team">
            <Section className="space-y-6">
              <TeamManagementSection />
            </Section>
          </TabsContent>
        </Tabs>
      </Section>
    </PageContainer>
  );
}

// Team Management Component
function TeamManagementSection() {
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  // Fetch organization members
  const { data: membersResponse, isLoading: membersLoading } = useQuery({
    queryKey: ['/api/organization/members'],
  });

  const members = membersResponse?.members || [];
  const organizationName = membersResponse?.organization?.name || "";

  // Invite member mutation
  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest('POST', '/api/organization/invite', { email });
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: `An invitation email has been sent to ${inviteEmail}`,
      });
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ['/api/organization/invitations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send invitation",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('DELETE', `/api/organization/members/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "Member removed",
        description: "The team member has been removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/organization/members'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove member",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      return await apiRequest('DELETE', `/api/organization/invitations/${invitationId}`);
    },
    onSuccess: () => {
      toast({
        title: "Invitation cancelled",
        description: "The invitation has been cancelled successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/organization/invitations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to cancel invitation",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Fetch pending invitations
  const { data: invitationsResponse } = useQuery({
    queryKey: ['/api/organization/invitations'],
  });

  const invitations = invitationsResponse?.invitations || [];

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    
    setIsInviting(true);
    try {
      await inviteMutation.mutateAsync(inviteEmail);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      await removeMemberMutation.mutateAsync(userId);
    }
  };

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    if (confirm(`Are you sure you want to cancel the invitation to ${email}?`)) {
      await cancelInvitationMutation.mutateAsync(invitationId);
    }
  };

  if (membersLoading) {
    return <div>Loading team information...</div>;
  }

  const currentUser = members?.find((m: any) => m.isCurrentUser);
  const isOwner = currentUser?.isOwner;

  return (
    <div className="space-y-6">
      {/* Organization Info */}
      <Card data-testid="card-organization-info">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization
          </CardTitle>
          <CardDescription>
            {organizationName || "No organization"}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Team Members */}
      <Card data-testid="card-team-members">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage your organization's team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members && members.length > 0 ? (
              members.map((member: any) => (
                <div key={member.userId} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`member-${member.userId}`}>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{member.user?.firstName} {member.user?.lastName}</p>
                      <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {member.isOwner && (
                      <Badge variant="secondary">Owner</Badge>
                    )}
                    {isOwner && !member.isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.userId, `${member.user?.firstName} ${member.user?.lastName}`)}
                        disabled={removeMemberMutation.isPending}
                        data-testid={`button-remove-member-${member.userId}`}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No team members found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invite Member (Owner Only) */}
      {isOwner && (
        <Card data-testid="card-invite-member">
          <CardHeader>
            <CardTitle>Invite Team Member</CardTitle>
            <CardDescription>
              Send an invitation to join your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex gap-3">
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 h-12"
                data-testid="input-invite-email"
                required
              />
              <Button type="submit" disabled={isInviting || inviteMutation.isPending} className="h-12" data-testid="button-send-invite">
                {isInviting ? "Sending..." : "Send Invite"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pending Invitations */}
      {isOwner && invitations && invitations.length > 0 && (
        <Card data-testid="card-pending-invitations">
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              Invitations waiting to be accepted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation: any) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`invitation-${invitation.id}`}>
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Pending</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelInvitation(invitation.id, invitation.email)}
                      disabled={cancelInvitationMutation.isPending}
                      data-testid={`button-cancel-invitation-${invitation.id}`}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
