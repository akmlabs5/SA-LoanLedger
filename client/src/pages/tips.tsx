import { 
  Lightbulb,
  Keyboard,
  CheckCircle,
  Zap,
  Smartphone
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TipsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Lightbulb className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">User Tips & Guidance</h1>
          </div>
          <p className="text-muted-foreground text-lg" data-testid="text-page-description">
            Best practices and helpful hints for maximizing the platform
          </p>
        </div>

        <div className="space-y-6">
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

          {/* Keyboard Shortcuts Section */}
          <Card data-testid="card-keyboard-shortcuts">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Keyboard Shortcuts
              </CardTitle>
              <CardDescription>Speed up your workflow with these keyboard shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3" data-testid="shortcuts-navigation">
                  <h4 className="font-semibold text-sm">Common Navigation</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Dashboard</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Alt + D</kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Loans</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Alt + L</kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Banks</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Alt + B</kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">AI Chat</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Alt + A</kbd>
                    </div>
                  </div>
                </div>

                <div className="space-y-3" data-testid="shortcuts-actions">
                  <h4 className="font-semibold text-sm">Quick Actions</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">New Loan</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + N</kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Save Form</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + S</kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Search</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + K</kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Close Dialog</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd>
                    </div>
                  </div>
                </div>

                <div className="space-y-3" data-testid="shortcuts-forms">
                  <h4 className="font-semibold text-sm">Form Shortcuts</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Next Field</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Tab</kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Previous Field</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Shift + Tab</kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Submit Form</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + Enter</kbd>
                    </div>
                  </div>
                </div>

                <div className="space-y-3" data-testid="shortcuts-search">
                  <h4 className="font-semibold text-sm">Search Shortcuts</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Filter Table</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + F</kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Clear Filters</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + Shift + F</kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Export Data</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + E</kbd>
                    </div>
                  </div>
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
                    <h4 className="font-semibold text-sm">Leverage Smart Loan Matcher before new drawdowns</h4>
                    <p className="text-sm text-muted-foreground">Use the AI-powered facility matcher to identify the best facility for new loans based on rates, limits, and portfolio balance optimization.</p>
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
        </div>
      </div>
    </div>
  );
}
