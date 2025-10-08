import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/admin/AdminLayout";
import { RequireAdminAuth } from "@/components/admin/RequireAdminAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Settings, 
  Globe, 
  Mail, 
  Brain, 
  Shield,
  Zap,
  CheckCircle2,
  XCircle
} from "lucide-react";

interface SystemSettings {
  general: {
    siteName: string;
    siteUrl: string;
    maintenanceMode: boolean;
    debugMode: boolean;
  };
  email: {
    sendGridConfigured: boolean;
    defaultSender: string;
    emailNotificationsEnabled: boolean;
  };
  ai: {
    deepSeekConfigured: boolean;
    aiInsightsEnabled: boolean;
    maxTokens: number;
  };
  security: {
    sessionTimeout: number;
    maxFailedAttempts: number;
    requireStrongPasswords: boolean;
  };
  features: {
    aiChat: boolean;
    emailReminders: boolean;
    advancedAnalytics: boolean;
    exportReports: boolean;
  };
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useQuery<SystemSettings>({
    queryKey: ['/api/admin/settings'],
    staleTime: 60000,
  });

  const [localSettings, setLocalSettings] = useState<SystemSettings | null>(null);

  const updateMutation = useMutation({
    mutationFn: async (data: { category: string; settings: any }) => {
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "Settings updated",
        description: "System settings have been saved successfully",
      });
    },
  });

  const currentSettings = localSettings || settings;

  const handleToggle = (category: keyof SystemSettings, key: string) => {
    if (!currentSettings) return;
    
    const updated = {
      ...currentSettings,
      [category]: {
        ...currentSettings[category],
        [key]: !currentSettings[category][key as keyof typeof currentSettings[typeof category]]
      }
    };
    setLocalSettings(updated);
  };

  const handleSave = (category: string) => {
    if (!currentSettings) return;
    updateMutation.mutate({
      category,
      settings: currentSettings[category as keyof SystemSettings]
    });
  };

  return (
    <RequireAdminAuth>
      <AdminLayout>
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
                System Settings
              </h1>
              <p className="text-muted-foreground mt-1">
                Configure global system preferences and features
              </p>
            </div>
          </div>

          {/* General Settings */}
          <Card data-testid="card-general-settings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                General Settings
              </CardTitle>
              <CardDescription>Basic system configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Site Name</Label>
                      <Input
                        value={currentSettings?.general.siteName}
                        disabled
                        className="mt-1"
                        data-testid="input-site-name"
                      />
                    </div>
                    <div>
                      <Label>Site URL</Label>
                      <Input
                        value={currentSettings?.general.siteUrl}
                        disabled
                        className="mt-1"
                        data-testid="input-site-url"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Temporarily disable user access for maintenance
                      </p>
                    </div>
                    <Switch
                      checked={currentSettings?.general.maintenanceMode}
                      onCheckedChange={() => handleToggle('general', 'maintenanceMode')}
                      data-testid="switch-maintenance-mode"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <Label>Debug Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable detailed error logging (not recommended for production)
                      </p>
                    </div>
                    <Badge variant={currentSettings?.general.debugMode ? "default" : "outline"}>
                      {currentSettings?.general.debugMode ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <Button onClick={() => handleSave('general')} data-testid="button-save-general">
                    Save General Settings
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Email Settings */}
          <Card data-testid="card-email-settings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                Email Configuration
              </CardTitle>
              <CardDescription>SendGrid integration status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <Label>SendGrid Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Email service provider configuration
                      </p>
                    </div>
                    <Badge className={currentSettings?.email.sendGridConfigured 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }>
                      {currentSettings?.email.sendGridConfigured ? (
                        <><CheckCircle2 className="w-3 h-3 mr-1" /> Configured</>
                      ) : (
                        <><XCircle className="w-3 h-3 mr-1" /> Not Configured</>
                      )}
                    </Badge>
                  </div>
                  <div>
                    <Label>Default Sender Email</Label>
                    <Input
                      value={currentSettings?.email.defaultSender}
                      disabled
                      className="mt-1"
                      data-testid="input-default-sender"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send automated email notifications to users
                      </p>
                    </div>
                    <Switch
                      checked={currentSettings?.email.emailNotificationsEnabled}
                      onCheckedChange={() => handleToggle('email', 'emailNotificationsEnabled')}
                      disabled={!currentSettings?.email.sendGridConfigured}
                      data-testid="switch-email-notifications"
                    />
                  </div>
                  
                  {currentSettings?.email.sendGridConfigured && (
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        SendGrid Live Configuration
                      </h4>
                      <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
                        <div>
                          <p className="font-medium mb-1">✓ Current Configuration:</p>
                          <ul className="list-disc list-inside ml-2 space-y-1">
                            <li>Sender Email: <code className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded">{currentSettings?.email.defaultSender}</code></li>
                            <li>Status: Email reminders are ready to send live</li>
                          </ul>
                        </div>
                        
                        <div>
                          <p className="font-medium mb-1">📋 For Production Deployment:</p>
                          <ol className="list-decimal list-inside ml-2 space-y-1">
                            <li>Verify Domain Authentication in SendGrid (recommended for deliverability)</li>
                            <li>Add DNS CNAME records from SendGrid to your domain provider</li>
                            <li>Wait for verification (usually 24-48 hours)</li>
                            <li>Single Sender Verification is already active</li>
                          </ol>
                        </div>
                        
                        <div>
                          <p className="font-medium mb-1">🔗 Quick Links:</p>
                          <ul className="list-disc list-inside ml-2 space-y-1">
                            <li>
                              <a 
                                href="https://app.sendgrid.com/settings/sender_auth" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="underline lg:hover:text-blue-600 dark:hover:text-blue-300"
                              >
                                SendGrid Sender Authentication
                              </a>
                            </li>
                            <li>
                              <a 
                                href="https://app.sendgrid.com/guide/integrate" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="underline lg:hover:text-blue-600 dark:hover:text-blue-300"
                              >
                                SendGrid Integration Guide
                              </a>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => handleSave('email')} 
                    disabled={!currentSettings?.email.sendGridConfigured}
                    data-testid="button-save-email"
                  >
                    Save Email Settings
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* AI Settings */}
          <Card data-testid="card-ai-settings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                AI Configuration
              </CardTitle>
              <CardDescription>DeepSeek AI integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <Label>DeepSeek API Status</Label>
                      <p className="text-sm text-muted-foreground">
                        AI-powered portfolio insights
                      </p>
                    </div>
                    <Badge className={currentSettings?.ai.deepSeekConfigured 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }>
                      {currentSettings?.ai.deepSeekConfigured ? (
                        <><CheckCircle2 className="w-3 h-3 mr-1" /> Configured</>
                      ) : (
                        <><XCircle className="w-3 h-3 mr-1" /> Not Configured</>
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <Label>AI Insights</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable AI-generated portfolio recommendations
                      </p>
                    </div>
                    <Switch
                      checked={currentSettings?.ai.aiInsightsEnabled}
                      onCheckedChange={() => handleToggle('ai', 'aiInsightsEnabled')}
                      disabled={!currentSettings?.ai.deepSeekConfigured}
                      data-testid="switch-ai-insights"
                    />
                  </div>
                  <div>
                    <Label>Max Tokens</Label>
                    <Input
                      type="number"
                      value={currentSettings?.ai.maxTokens}
                      disabled
                      className="mt-1"
                      data-testid="input-max-tokens"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum tokens for AI responses
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleSave('ai')} 
                    disabled={!currentSettings?.ai.deepSeekConfigured}
                    data-testid="button-save-ai"
                  >
                    Save AI Settings
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Feature Toggles */}
          <Card data-testid="card-feature-toggles">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                Feature Toggles
              </CardTitle>
              <CardDescription>Enable or disable platform features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <Label>AI Chat</Label>
                      <p className="text-sm text-muted-foreground">
                        Natural language query interface
                      </p>
                    </div>
                    <Switch
                      checked={currentSettings?.features.aiChat}
                      onCheckedChange={() => handleToggle('features', 'aiChat')}
                      data-testid="switch-ai-chat"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <Label>Email Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Automated loan due date reminders
                      </p>
                    </div>
                    <Switch
                      checked={currentSettings?.features.emailReminders}
                      onCheckedChange={() => handleToggle('features', 'emailReminders')}
                      data-testid="switch-email-reminders"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <Label>Advanced Analytics</Label>
                      <p className="text-sm text-muted-foreground">
                        Portfolio analytics and charts
                      </p>
                    </div>
                    <Switch
                      checked={currentSettings?.features.advancedAnalytics}
                      onCheckedChange={() => handleToggle('features', 'advancedAnalytics')}
                      data-testid="switch-advanced-analytics"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <Label>Export Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow users to export data as CSV/PDF
                      </p>
                    </div>
                    <Switch
                      checked={currentSettings?.features.exportReports}
                      onCheckedChange={() => handleToggle('features', 'exportReports')}
                      data-testid="switch-export-reports"
                    />
                  </div>
                  <Button onClick={() => handleSave('features')} data-testid="button-save-features">
                    Save Feature Settings
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card data-testid="card-security-settings-config">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                Security Settings
              </CardTitle>
              <CardDescription>Authentication and security policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : (
                <>
                  <div>
                    <Label>Session Timeout (hours)</Label>
                    <Input
                      type="number"
                      value={currentSettings?.security.sessionTimeout}
                      disabled
                      className="mt-1"
                      data-testid="input-session-timeout"
                    />
                  </div>
                  <div>
                    <Label>Max Failed Login Attempts</Label>
                    <Input
                      type="number"
                      value={currentSettings?.security.maxFailedAttempts}
                      disabled
                      className="mt-1"
                      data-testid="input-max-failed-attempts"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <Label>Strong Password Requirement</Label>
                      <p className="text-sm text-muted-foreground">
                        Enforce strong password policies
                      </p>
                    </div>
                    <Badge variant={currentSettings?.security.requireStrongPasswords ? "default" : "outline"}>
                      {currentSettings?.security.requireStrongPasswords ? 'Required' : 'Optional'}
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RequireAdminAuth>
  );
}
