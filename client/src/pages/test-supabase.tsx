import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function TestSupabasePage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-supabase-config');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Error checking config:', error);
      setConfig({ error: 'Failed to check configuration' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Supabase Configuration Test</CardTitle>
            <CardDescription>
              Verify your Supabase authentication configuration and redirect URLs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={checkConfig} 
              disabled={loading}
              className="mb-6"
              data-testid="button-check-config"
            >
              {loading ? 'Checking...' : 'Check Configuration'}
            </Button>

            {config && (
              <div className="space-y-6">
                {/* Status Badge */}
                <div>
                  <Badge 
                    className={config.status === 'ready' 
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                      : "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                    }
                  >
                    {config.status === 'ready' ? (
                      <><CheckCircle className="h-4 w-4 mr-1" /> Ready</>
                    ) : (
                      <><AlertCircle className="h-4 w-4 mr-1" /> Needs Configuration</>
                    )}
                  </Badge>
                </div>

                {/* Supabase Configuration */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Supabase Settings</h3>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">URL</p>
                      {typeof config.supabase?.url === 'object' ? (
                        <>
                          <p className="text-sm font-mono break-all">{config.supabase.url.value}</p>
                          <div className="flex items-center mt-1">
                            {config.supabase.url.valid ? (
                              <CheckCircle className="h-4 w-4 text-emerald-600 mr-1" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600 mr-1" />
                            )}
                            <span className="text-xs text-gray-500">
                              {config.supabase.url.valid ? 'Valid URL' : 'Invalid URL'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-red-600">{config.supabase?.url}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Anonymous Key</p>
                      {typeof config.supabase?.anonKey === 'object' ? (
                        <>
                          <p className="text-sm font-mono">{config.supabase.anonKey.preview}</p>
                          <div className="flex items-center mt-1">
                            <CheckCircle className="h-4 w-4 text-emerald-600 mr-1" />
                            <span className="text-xs text-gray-500">
                              Configured ({config.supabase.anonKey.length} characters)
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-red-600">{config.supabase?.anonKey}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Replit Configuration */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Replit Environment</h3>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Domain</p>
                      <p className="text-sm font-mono break-all">{config.replit?.domain}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expected Site URL</p>
                      <p className="text-sm font-mono break-all">{config.replit?.expectedSiteUrl}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Set this in Supabase Dashboard → Authentication → URL Configuration → Site URL
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expected Redirect URL</p>
                      <p className="text-sm font-mono break-all">{config.replit?.expectedRedirectUrl}/*</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Add this to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {config.recommendations && config.recommendations.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Recommendations</h3>
                    <ul className="space-y-2">
                      {config.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <AlertCircle className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Success Message */}
                {config.status === 'ready' && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 rounded-lg">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mr-2 mt-0.5" />
                      <div>
                        <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                          Configuration Looks Good!
                        </p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                          Your Supabase authentication is properly configured. Make sure to verify the Site URL 
                          and Redirect URLs in your Supabase dashboard match the values shown above.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
