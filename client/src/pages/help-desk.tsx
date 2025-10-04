import { 
  HelpCircle,
  Mail,
  MessageSquare,
  Book,
  FileQuestion,
  ExternalLink,
  Phone,
  Clock,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HelpDeskPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <HelpCircle className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">Help Desk</h1>
          </div>
          <p className="text-muted-foreground text-lg" data-testid="text-page-description">
            Get help and support for your loan management platform
          </p>
        </div>

        {/* Quick Help Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card data-testid="card-ai-assistant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                AI Assistant
              </CardTitle>
              <CardDescription>Get instant answers to your questions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Use our AI-powered chat assistant to get immediate help with platform features, loan calculations, and portfolio management.
              </p>
              <Button 
                onClick={() => window.location.href = "/ai-chat"} 
                className="w-full"
                data-testid="button-open-ai-chat"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Open AI Assistant
              </Button>
            </CardContent>
          </Card>

          <Card data-testid="card-features-guide">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Features & Tips
              </CardTitle>
              <CardDescription>Learn about platform capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Explore comprehensive guides on platform features, best practices, and productivity tips.
              </p>
              <Button 
                variant="outline"
                onClick={() => window.location.href = "/features-tips"} 
                className="w-full"
                data-testid="button-features-tips"
              >
                <Book className="mr-2 h-4 w-4" />
                View Features & Tips
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Support Information */}
        <Card data-testid="card-support-info">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileQuestion className="h-5 w-5" />
              Need More Help?
            </CardTitle>
            <CardDescription>Contact our support team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Email Support</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Send us an email and we'll get back to you within 24 hours
                </p>
                <a 
                  href="mailto:support@saudiloanmanager.com" 
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                  data-testid="link-email-support"
                >
                  support@saudiloanmanager.com
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
              <Phone className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Phone Support</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Available Sunday to Thursday, 9:00 AM - 5:00 PM (Riyadh Time)
                </p>
                <a 
                  href="tel:+966123456789" 
                  className="text-sm text-primary hover:underline"
                  data-testid="link-phone-support"
                >
                  +966 12 345 6789
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Response Times</h3>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-muted-foreground">AI Assistant: Instant</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-muted-foreground">Email: Within 24 hours</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-muted-foreground">Phone: During business hours</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Common Topics */}
        <Card className="mt-6" data-testid="card-common-topics">
          <CardHeader>
            <CardTitle>Common Help Topics</CardTitle>
            <CardDescription>Quick links to frequently needed information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => window.location.href = "/features-tips#features"}
                data-testid="button-topic-loans"
              >
                Creating & Managing Loans
              </Button>
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => window.location.href = "/features-tips#features"}
                data-testid="button-topic-facilities"
              >
                Setting Up Facilities
              </Button>
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => window.location.href = "/features-tips#features"}
                data-testid="button-topic-collateral"
              >
                Collateral Management
              </Button>
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => window.location.href = "/features-tips#ai"}
                data-testid="button-topic-ai"
              >
                Using AI Features
              </Button>
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => window.location.href = "/user-settings"}
                data-testid="button-topic-settings"
              >
                Account Settings
              </Button>
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => window.location.href = "/reports"}
                data-testid="button-topic-reports"
              >
                Reports & Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
