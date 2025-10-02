import { 
  Sparkles,
  Building2,
  TrendingUp,
  Shield,
  FileText,
  Bell,
  Brain,
  MessageSquare,
  Target,
  Zap,
  Mail,
  Download,
  Eye,
  AlertTriangle,
  Percent,
  Globe2,
  CreditCard,
  Languages,
  BookOpen,
  DollarSign,
  Database,
  Boxes,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">Platform Features</h1>
          </div>
          <p className="text-muted-foreground text-lg" data-testid="text-page-description">
            Comprehensive overview of all loan management capabilities
          </p>
        </div>

        <div className="space-y-6">
          {/* Core Features Section */}
          <Card data-testid="card-core-features">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Boxes className="h-5 w-5" />
                Core Features
              </CardTitle>
              <CardDescription>Essential tools for comprehensive loan portfolio management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg hover:border-primary transition-colors" data-testid="feature-card-bank-management">
                  <Building2 className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Bank Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage relationships with all Saudi banks, track contacts, and monitor facility agreements across your entire banking portfolio.
                  </p>
                </div>

                <div className="p-4 border rounded-lg hover:border-primary transition-colors" data-testid="feature-card-facility-tracking">
                  <CreditCard className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Facility Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Track credit facilities including revolving, term, and bridge loans with automated limit monitoring and expiry alerts.
                  </p>
                </div>

                <div className="p-4 border rounded-lg hover:border-primary transition-colors" data-testid="feature-card-loan-lifecycle">
                  <TrendingUp className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Loan Lifecycle</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete loan lifecycle management from drawdown to settlement, including payments, restructuring, and interest calculations.
                  </p>
                </div>

                <div className="p-4 border rounded-lg hover:border-primary transition-colors" data-testid="feature-card-collateral-tracking">
                  <Shield className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Collateral Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor collateral values, pledges, and loan-to-value ratios with support for real estate, stocks, and other asset types.
                  </p>
                </div>

                <div className="p-4 border rounded-lg hover:border-primary transition-colors" data-testid="feature-card-document-management">
                  <FileText className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Document Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Centralized document storage with AI-powered text extraction from PDFs, images, and Word documents for intelligent search.
                  </p>
                </div>

                <div className="p-4 border rounded-lg hover:border-primary transition-colors" data-testid="feature-card-reminder-system">
                  <Bell className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Reminder System</h3>
                  <p className="text-sm text-muted-foreground">
                    Automated email and calendar reminders for due dates, payments, and reviews with customizable intervals and templates.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Features Section */}
          <Card data-testid="card-ai-features">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Features
              </CardTitle>
              <CardDescription>Advanced AI capabilities for intelligent portfolio insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg hover:border-primary transition-colors" data-testid="feature-card-ai-chat">
                  <MessageSquare className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">AI Chat Assistant</h3>
                  <p className="text-sm text-muted-foreground">
                    Natural language conversations about your portfolio with context-aware responses and intelligent recommendations.
                  </p>
                </div>

                <div className="p-4 border rounded-lg hover:border-primary transition-colors" data-testid="feature-card-loan-matcher">
                  <Target className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Smart Loan Matcher</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-powered facility recommendations based on loan amount, duration, and current portfolio characteristics.
                  </p>
                </div>

                <div className="p-4 border rounded-lg hover:border-primary transition-colors" data-testid="feature-card-what-if">
                  <Zap className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">What-If Scenarios</h3>
                  <p className="text-sm text-muted-foreground">
                    Model different financing scenarios with instant calculations for utilization, LTV ratios, and cash flow impact.
                  </p>
                </div>

                <div className="p-4 border rounded-lg hover:border-primary transition-colors" data-testid="feature-card-nlq">
                  <MessageSquare className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Natural Language Queries</h3>
                  <p className="text-sm text-muted-foreground">
                    Ask questions about your portfolio in plain language and get instant, accurate answers powered by AI.
                  </p>
                </div>

                <div className="p-4 border rounded-lg hover:border-primary transition-colors" data-testid="feature-card-daily-alerts">
                  <Mail className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Daily Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    Automated daily email summaries categorizing portfolio alerts by priority from critical overdue loans to routine updates.
                  </p>
                </div>

                <div className="p-4 border rounded-lg hover:border-primary transition-colors" data-testid="feature-card-pdf-export">
                  <Download className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">PDF Export</h3>
                  <p className="text-sm text-muted-foreground">
                    Export comprehensive portfolio reports and analytics to PDF with professional formatting and charts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics & Insights Section */}
          <Card data-testid="card-analytics-features">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics & Insights
              </CardTitle>
              <CardDescription>Powerful analytics and reporting tools for portfolio optimization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg hover:border-primary transition-colors" data-testid="feature-card-portfolio-dashboard">
                  <Eye className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Portfolio Dashboard</h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time overview of total exposure, credit utilization, upcoming maturities, and key performance indicators.
                  </p>
                </div>

                <div className="p-4 border rounded-lg hover:border-primary transition-colors" data-testid="feature-card-bank-performance">
                  <Building2 className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Bank Performance</h3>
                  <p className="text-sm text-muted-foreground">
                    Detailed analytics for each bank including exposure concentration, facility utilization, and relationship history.
                  </p>
                </div>

                <div className="p-4 border rounded-lg hover:border-primary transition-colors" data-testid="feature-card-exposure-tracking">
                  <AlertTriangle className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Exposure Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor bank concentration risk with historical snapshots and trend analysis across your entire portfolio.
                  </p>
                </div>

                <div className="p-4 border rounded-lg hover:border-primary transition-colors" data-testid="feature-card-ltv-monitoring">
                  <Percent className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">LTV Monitoring</h3>
                  <p className="text-sm text-muted-foreground">
                    Track loan-to-value ratios against both outstanding balances and credit limits with automated threshold alerts.
                  </p>
                </div>

                <div className="p-4 border rounded-lg hover:border-primary transition-colors" data-testid="feature-card-sibor-integration">
                  <TrendingUp className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">SIBOR Integration</h3>
                  <p className="text-sm text-muted-foreground">
                    Live SIBOR rates with monthly trend tracking for accurate interest calculations and rate benchmarking.
                  </p>
                </div>

                <div className="p-4 border rounded-lg hover:border-primary transition-colors" data-testid="feature-card-mobile-design">
                  <Globe2 className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Mobile-First Design</h3>
                  <p className="text-sm text-muted-foreground">
                    Fully responsive interface optimized for smartphones and tablets with touch-friendly navigation and controls.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coming Soon Section */}
          <Card data-testid="card-coming-soon-features">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Coming Soon
              </CardTitle>
              <CardDescription>Exciting new features in development</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg hover:border-primary transition-colors relative" data-testid="feature-card-arabic-support">
                  <Badge className="absolute top-3 right-3" data-testid="badge-coming-soon-arabic">Coming Soon</Badge>
                  <Languages className="h-8 w-8 text-muted-foreground mb-3" />
                  <h3 className="font-semibold mb-2">Arabic Language Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Full Arabic language interface with RTL support for native Saudi users and bilingual document handling.
                  </p>
                </div>

                <div className="p-4 border rounded-lg hover:border-primary transition-colors relative" data-testid="feature-card-advanced-reporting">
                  <Badge className="absolute top-3 right-3" data-testid="badge-coming-soon-reporting">Coming Soon</Badge>
                  <BookOpen className="h-8 w-8 text-muted-foreground mb-3" />
                  <h3 className="font-semibold mb-2">Advanced Reporting</h3>
                  <p className="text-sm text-muted-foreground">
                    Customizable report builder with scheduled exports, executive summaries, and compliance documentation.
                  </p>
                </div>

                <div className="p-4 border rounded-lg hover:border-primary transition-colors relative" data-testid="feature-card-multi-currency">
                  <Badge className="absolute top-3 right-3" data-testid="badge-coming-soon-currency">Coming Soon</Badge>
                  <DollarSign className="h-8 w-8 text-muted-foreground mb-3" />
                  <h3 className="font-semibold mb-2">Multi-Currency</h3>
                  <p className="text-sm text-muted-foreground">
                    Support for multiple currencies with live exchange rates and automatic conversion for international facilities.
                  </p>
                </div>

                <div className="p-4 border rounded-lg hover:border-primary transition-colors relative" data-testid="feature-card-api-integration">
                  <Badge className="absolute top-3 right-3" data-testid="badge-coming-soon-api">Coming Soon</Badge>
                  <Database className="h-8 w-8 text-muted-foreground mb-3" />
                  <h3 className="font-semibold mb-2">API Integration</h3>
                  <p className="text-sm text-muted-foreground">
                    RESTful API for integrating with accounting systems, ERPs, and custom applications for seamless data flow.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
