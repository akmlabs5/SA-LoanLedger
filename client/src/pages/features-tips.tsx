import { useState } from "react";
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
  BarChart3,
  Lightbulb,
  CheckCircle,
  Smartphone,
  Users,
  UserPlus,
  Lock,
  Layers,
  ShieldCheck,
  Settings
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FeaturesTipsPage() {
  const [activeTab, setActiveTab] = useState("features");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-6xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">Features & Tips</h1>
          </div>
          <p className="text-muted-foreground text-lg" data-testid="text-page-description">
            Explore platform capabilities and learn best practices
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3" data-testid="tabs-features-tips">
            <TabsTrigger value="features" className="flex items-center gap-2 h-12" data-testid="tab-features">
              <Boxes className="h-4 w-4" />
              <span>Platform Features</span>
            </TabsTrigger>
            <TabsTrigger value="tips" className="flex items-center gap-2 h-12" data-testid="tab-tips">
              <Lightbulb className="h-4 w-4" />
              <span>User Tips</span>
            </TabsTrigger>
            <TabsTrigger value="organization" className="flex items-center gap-2 h-12" data-testid="tab-organization">
              <Users className="h-4 w-4" />
              <span>Organization Tips</span>
            </TabsTrigger>
          </TabsList>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
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
                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors" data-testid="feature-card-bank-management">
                    <Building2 className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Bank Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage relationships with all Saudi banks, track contacts, and monitor facility agreements across your entire banking portfolio.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors" data-testid="feature-card-facility-tracking">
                    <CreditCard className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Facility Tracking</h3>
                    <p className="text-sm text-muted-foreground">
                      Track credit facilities including revolving, term, and bridge loans with automated limit monitoring and expiry alerts.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors" data-testid="feature-card-loan-lifecycle">
                    <TrendingUp className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Loan Lifecycle</h3>
                    <p className="text-sm text-muted-foreground">
                      Complete loan lifecycle management from drawdown to settlement, including payments, restructuring, and interest calculations.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors" data-testid="feature-card-collateral-tracking">
                    <Shield className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Collateral Tracking</h3>
                    <p className="text-sm text-muted-foreground">
                      Monitor collateral values, pledges, and loan-to-value ratios with support for real estate, stocks, and other asset types.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors" data-testid="feature-card-document-management">
                    <FileText className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Document Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Centralized document storage with AI-powered text extraction from PDFs, images, and Word documents for intelligent search.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors" data-testid="feature-card-reminder-system">
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
                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors" data-testid="feature-card-ai-chat">
                    <MessageSquare className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">AI Chat Assistant</h3>
                    <p className="text-sm text-muted-foreground">
                      Natural language conversations about your portfolio with context-aware responses and intelligent recommendations.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors" data-testid="feature-card-loan-matcher">
                    <Target className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Smart Loan Matcher</h3>
                    <p className="text-sm text-muted-foreground">
                      Intelligent facility selection tool that scores all your available banking facilities using a 100-point algorithm. Analyzes available credit, utilization rates, interest costs, and facility terms to recommend the optimal facility for your next loan - saving you time and ensuring you get the best terms.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors" data-testid="feature-card-what-if">
                    <Zap className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">What-If Scenarios</h3>
                    <p className="text-sm text-muted-foreground">
                      Model different financing scenarios with instant calculations for utilization, LTV ratios, and cash flow impact.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors" data-testid="feature-card-nlq">
                    <MessageSquare className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Natural Language Queries</h3>
                    <p className="text-sm text-muted-foreground">
                      Ask questions about your portfolio in plain language and get instant, accurate answers powered by AI.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors" data-testid="feature-card-daily-alerts">
                    <Mail className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Daily Alerts</h3>
                    <p className="text-sm text-muted-foreground">
                      Automated daily email summaries categorizing portfolio alerts by priority from critical overdue loans to routine updates.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors" data-testid="feature-card-pdf-export">
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
                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors" data-testid="feature-card-portfolio-dashboard">
                    <Eye className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Portfolio Dashboard</h3>
                    <p className="text-sm text-muted-foreground">
                      Real-time overview of total exposure, credit utilization, upcoming maturities, and key performance indicators.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors" data-testid="feature-card-bank-performance">
                    <Building2 className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Bank Performance</h3>
                    <p className="text-sm text-muted-foreground">
                      Detailed analytics for each bank including exposure concentration, facility utilization, and relationship history.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors" data-testid="feature-card-exposure-tracking">
                    <AlertTriangle className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Exposure Tracking</h3>
                    <p className="text-sm text-muted-foreground">
                      Monitor bank concentration risk with historical snapshots and trend analysis across your entire portfolio.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors" data-testid="feature-card-ltv-monitoring">
                    <Percent className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">LTV Monitoring</h3>
                    <p className="text-sm text-muted-foreground">
                      Track loan-to-value ratios against both outstanding balances and credit limits with automated threshold alerts.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors" data-testid="feature-card-sibor-integration">
                    <TrendingUp className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">SIBOR Integration</h3>
                    <p className="text-sm text-muted-foreground">
                      Live SIBOR rates with monthly trend tracking for accurate interest calculations and rate benchmarking.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors" data-testid="feature-card-mobile-design">
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
                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors relative" data-testid="feature-card-arabic-support">
                    <Badge className="absolute top-3 right-3" data-testid="badge-coming-soon-arabic">Coming Soon</Badge>
                    <Languages className="h-8 w-8 text-muted-foreground mb-3" />
                    <h3 className="font-semibold mb-2">Arabic Language Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Full Arabic language interface with RTL support for native Saudi users and bilingual document handling.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors relative" data-testid="feature-card-advanced-reporting">
                    <Badge className="absolute top-3 right-3" data-testid="badge-coming-soon-reporting">Coming Soon</Badge>
                    <BookOpen className="h-8 w-8 text-muted-foreground mb-3" />
                    <h3 className="font-semibold mb-2">Advanced Reporting</h3>
                    <p className="text-sm text-muted-foreground">
                      Customizable report builder with scheduled exports, executive summaries, and compliance documentation.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors relative" data-testid="feature-card-multi-currency">
                    <Badge className="absolute top-3 right-3" data-testid="badge-coming-soon-currency">Coming Soon</Badge>
                    <DollarSign className="h-8 w-8 text-muted-foreground mb-3" />
                    <h3 className="font-semibold mb-2">Multi-Currency</h3>
                    <p className="text-sm text-muted-foreground">
                      Support for multiple currencies with live exchange rates and automatic conversion for international facilities.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors relative" data-testid="feature-card-api-integration">
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
          </TabsContent>

          {/* Tips Tab */}
          <TabsContent value="tips" className="space-y-6">
            {/* Quick Start Guide Section */}
            <Card data-testid="card-quick-start">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Quick Start Guide
                </CardTitle>
                <CardDescription>Essential steps to get started with the loan management platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2" data-testid="tip-create-facility">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">1</span>
                      How to create your first facility
                    </h4>
                    <p className="text-sm text-muted-foreground ml-8">
                      Navigate to Banks, select a bank, and click "Add Facility". Choose facility type (Revolving, Term, or Bridge), set credit limit, and configure terms.
                    </p>
                  </div>
                  
                  <div className="space-y-2" data-testid="tip-add-loan">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">2</span>
                      Adding a loan to a facility
                    </h4>
                    <p className="text-sm text-muted-foreground ml-8">
                      From any facility, click "Add Loan", select loan type, enter drawdown amount, and set due date. The system automatically calculates interest and tracks limits.
                    </p>
                  </div>

                  <div className="space-y-2" data-testid="tip-collateral">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">3</span>
                      Setting up collateral tracking
                    </h4>
                    <p className="text-sm text-muted-foreground ml-8">
                      Go to Collateral section, add assets (real estate, stocks, etc.), link them to facilities, and update valuations regularly for accurate LTV monitoring.
                    </p>
                  </div>

                  <div className="space-y-2" data-testid="tip-lifecycle">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">4</span>
                      Understanding loan lifecycle (active → settled)
                    </h4>
                    <p className="text-sm text-muted-foreground ml-8">
                      Loans start as Active, can be marked Overdue if past due date, Restructured if terms change, or Settled when fully paid. Track status in the Loans page.
                    </p>
                  </div>

                  <div className="space-y-2" data-testid="tip-data-entry">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">5</span>
                      Best practices for data entry
                    </h4>
                    <p className="text-sm text-muted-foreground ml-8">
                      Always enter complete facility details, use consistent naming conventions, update collateral values monthly, and upload supporting documents for better AI insights.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Best Practices Section */}
            <Card data-testid="card-best-practices">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Best Practices
                </CardTitle>
                <CardDescription>Recommended practices for optimal portfolio management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3" data-testid="practice-collateral">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Maintain accurate collateral valuations</h4>
                      <p className="text-sm text-muted-foreground">Update collateral values monthly or when market conditions change significantly to ensure accurate LTV calculations and risk assessment.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3" data-testid="practice-reminders">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Set up reminders before due dates</h4>
                      <p className="text-sm text-muted-foreground">Configure email and calendar reminders at 7, 3, and 1 day intervals before loan due dates to ensure timely payments and avoid penalties.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3" data-testid="practice-concentration">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Monitor bank concentration risk</h4>
                      <p className="text-sm text-muted-foreground">Keep single bank exposure below 40% of total portfolio to diversify risk and maintain financial stability across multiple banking relationships.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3" data-testid="practice-ltv">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Review LTV ratios regularly</h4>
                      <p className="text-sm text-muted-foreground">Check loan-to-value ratios weekly, especially for real estate collateral, and take action when ratios exceed 75% to maintain healthy coverage.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3" data-testid="practice-ai">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Use AI insights for portfolio optimization</h4>
                      <p className="text-sm text-muted-foreground">Review AI-generated insights daily to identify risks, opportunities for refinancing, and optimal facility utilization strategies.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3" data-testid="practice-facility">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Keep facility information up to date</h4>
                      <p className="text-sm text-muted-foreground">Update facility terms, contact information, and documentation immediately when changes occur to ensure accurate reporting and compliance.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pro Tips Section */}
            <Card data-testid="card-pro-tips">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Pro Tips
                </CardTitle>
                <CardDescription>Advanced tips to maximize platform capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3" data-testid="pro-tip-ai-chat">
                    <Zap className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Use AI Chat for quick portfolio queries</h4>
                      <p className="text-sm text-muted-foreground">Ask questions like "Which facilities have highest utilization?" or "Show me loans due next month" for instant insights without navigating multiple pages.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3" data-testid="pro-tip-pdf">
                    <Zap className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Export conversations to PDF for documentation</h4>
                      <p className="text-sm text-muted-foreground">Save AI chat conversations as PDF reports for audit trails, board presentations, or sharing insights with stakeholders and advisors.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3" data-testid="pro-tip-matcher">
                    <Zap className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Use Smart Loan Matcher for optimal facility selection</h4>
                      <p className="text-sm text-muted-foreground">When you need a new loan, click Smart Loan Matcher on your dashboard. Enter the amount needed and the AI analyzes all facilities using a 100-point scoring system: available credit (40pts), current utilization (20pts), interest rates (20pts), facility type match (10pts), and revolving period availability (10pts). You'll get the best recommendation with detailed reasons, plus 2 alternatives for comparison - ensuring you always choose the optimal facility.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3" data-testid="pro-tip-scenarios">
                    <Zap className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Run What-If scenarios before major decisions</h4>
                      <p className="text-sm text-muted-foreground">Model new loan impacts on utilization, LTV, and cash flow before committing to understand full portfolio implications and avoid over-leverage.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3" data-testid="pro-tip-alerts">
                    <Zap className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Configure daily alerts for proactive monitoring</h4>
                      <p className="text-sm text-muted-foreground">Enable daily email alerts to receive morning summaries of critical issues, upcoming dues, and portfolio health metrics without logging in.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3" data-testid="pro-tip-documents">
                    <Zap className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Upload documents for better AI context</h4>
                      <p className="text-sm text-muted-foreground">Upload facility agreements, term sheets, and correspondence to enhance AI understanding and get more accurate, context-aware recommendations.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Usage Section */}
            <Card data-testid="card-mobile-usage">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Mobile Usage
                </CardTitle>
                <CardDescription>Tips for using the platform on mobile devices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3" data-testid="mobile-navigation">
                    <Smartphone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Mobile-optimized navigation</h4>
                      <p className="text-sm text-muted-foreground">Access all features via the hamburger menu on mobile. Swipe left/right on tables to view more columns and use pull-to-refresh for updates.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3" data-testid="mobile-actions">
                    <Smartphone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Quick actions on mobile</h4>
                      <p className="text-sm text-muted-foreground">Tap and hold on loan cards for quick actions menu. Use the floating action button (FAB) to quickly add new loans or facilities on the go.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3" data-testid="mobile-controls">
                    <Smartphone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Touch-friendly controls</h4>
                      <p className="text-sm text-muted-foreground">All buttons and inputs are optimized for touch with larger tap targets. Use date pickers and dropdowns designed for mobile interaction.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3" data-testid="mobile-charts">
                    <Smartphone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Responsive charts and tables</h4>
                      <p className="text-sm text-muted-foreground">Charts automatically adapt to screen size with touch interactions. Pinch to zoom on graphs and swipe through data points for detailed analysis.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organization Tips Tab */}
          <TabsContent value="organization" className="space-y-6">
            {/* Team Collaboration Features Section */}
            <Card data-testid="card-team-collaboration">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Collaboration Features
                </CardTitle>
                <CardDescription>Work together with your team on shared loan portfolios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors" data-testid="feature-card-team-accounts">
                    <Users className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Organization Accounts</h3>
                    <p className="text-sm text-muted-foreground">
                      Create team accounts that support 2-5 members (1 owner + up to 4 members) working together on shared loan portfolios.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors" data-testid="feature-card-invitations">
                    <UserPlus className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Email Invitations</h3>
                    <p className="text-sm text-muted-foreground">
                      Owners can invite team members via email with secure token-based links that expire in 7 days for enhanced security.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors" data-testid="feature-card-role-access">
                    <ShieldCheck className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Role-Based Access</h3>
                    <p className="text-sm text-muted-foreground">
                      Owner role with exclusive permissions (invite/remove members) and Member role with full portfolio access.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors" data-testid="feature-card-data-isolation">
                    <Lock className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Complete Data Isolation</h3>
                    <p className="text-sm text-muted-foreground">
                      All loans, facilities, collateral, and bank data is completely isolated between organizations with SQL-level enforcement.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors" data-testid="feature-card-team-settings">
                    <Settings className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Team Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Dedicated settings tab showing organization info, member list, invite form, and pending invitations.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg lg:hover:border-primary transition-colors" data-testid="feature-card-shared-ai">
                    <Layers className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Shared AI Insights</h3>
                    <p className="text-sm text-muted-foreground">
                      AI Agent operations respect organization boundaries, providing insights based on your team's shared portfolio data.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Getting Started with Organizations */}
            <Card data-testid="card-org-getting-started">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Getting Started with Organizations
                </CardTitle>
                <CardDescription>Step-by-step guide to set up team collaboration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2" data-testid="org-step-create">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">1</span>
                      Create an Organization Account
                    </h4>
                    <p className="text-sm text-muted-foreground ml-8">
                      During signup, select "Organization" as account type and provide your organization name. You'll automatically become the owner with full admin privileges.
                    </p>
                  </div>
                  
                  <div className="space-y-2" data-testid="org-step-invite">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">2</span>
                      Invite Team Members
                    </h4>
                    <p className="text-sm text-muted-foreground ml-8">
                      Go to User Settings → Team Management tab, enter member's email, and click "Send Invitation". They'll receive a secure link to join your organization.
                    </p>
                  </div>

                  <div className="space-y-2" data-testid="org-step-accept">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">3</span>
                      Member Acceptance Process
                    </h4>
                    <p className="text-sm text-muted-foreground ml-8">
                      Invited members click the email link, review organization details, and choose to Accept or Decline. No auto-join - consent is always required.
                    </p>
                  </div>

                  <div className="space-y-2" data-testid="org-step-collaborate">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">4</span>
                      Start Collaborating
                    </h4>
                    <p className="text-sm text-muted-foreground ml-8">
                      Once accepted, all members see the same portfolio data. Create loans, track facilities, and manage collateral together as a team.
                    </p>
                  </div>

                  <div className="space-y-2" data-testid="org-step-manage">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">5</span>
                      Manage Team Members
                    </h4>
                    <p className="text-sm text-muted-foreground ml-8">
                      Owners can remove members anytime from Team Management settings. Members automatically lose access to organization data upon removal.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Organization Best Practices */}
            <Card data-testid="card-org-best-practices">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Organization Best Practices
                </CardTitle>
                <CardDescription>Recommended practices for effective team collaboration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3" data-testid="org-practice-roles">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Define clear team roles and responsibilities</h4>
                      <p className="text-sm text-muted-foreground">Assign specific tasks to team members - one person for data entry, another for reviews, etc. While all members have full access, clear roles improve efficiency.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3" data-testid="org-practice-invites">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Only invite trusted team members</h4>
                      <p className="text-sm text-muted-foreground">Members have full access to all portfolio data. Only invite colleagues you trust with sensitive financial information and loan details.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3" data-testid="org-practice-review">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Regularly review team membership</h4>
                      <p className="text-sm text-muted-foreground">Periodically check your team member list and remove anyone who no longer needs access. This maintains security and data integrity.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3" data-testid="org-practice-communication">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Coordinate data updates with your team</h4>
                      <p className="text-sm text-muted-foreground">When making major changes (adding facilities, updating collateral), communicate with team members to avoid conflicts and ensure everyone is informed.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3" data-testid="org-practice-ownership">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Plan for ownership succession</h4>
                      <p className="text-sm text-muted-foreground">Organization owners cannot delete their accounts while members exist. Before leaving, ensure you remove all members or designate a successor.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3" data-testid="org-practice-isolation">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Understand data isolation boundaries</h4>
                      <p className="text-sm text-muted-foreground">Your organization data is completely isolated from others. No cross-organization access is possible - each team's data is secure and private.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security & Privacy */}
            <Card data-testid="card-org-security">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Security & Privacy
                </CardTitle>
                <CardDescription>How we protect your organization's data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3" data-testid="security-tokens">
                    <Lock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Token-based invitation system</h4>
                      <p className="text-sm text-muted-foreground">Invitations use secure tokens that expire after 7 days. Email verification ensures only the intended recipient can join your organization.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3" data-testid="security-isolation">
                    <Lock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">SQL-level data isolation</h4>
                      <p className="text-sm text-muted-foreground">All database queries enforce organization boundaries. Cross-tenant data access is blocked at the SQL level, preventing unauthorized access.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3" data-testid="security-validation">
                    <Lock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Organization context validation</h4>
                      <p className="text-sm text-muted-foreground">Every API request validates organization context. Middleware ensures users can only access data belonging to their organization.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3" data-testid="security-ownership">
                    <Lock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Protected owner operations</h4>
                      <p className="text-sm text-muted-foreground">Owner-only actions (inviting/removing members) are protected with ownership checks. Regular members cannot perform administrative functions.</p>
                    </div>
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
