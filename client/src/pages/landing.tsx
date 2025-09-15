import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { University, Eye } from "lucide-react";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      window.location.href = "/";
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="pt-8 p-8">
          {/* Saudi market branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-saudi text-white rounded-full mb-4">
              <University className="text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Saudi Loan Manager</h1>
            <p className="text-muted-foreground">SIBOR-based loan management platform</p>
          </div>
          
          {/* Login section */}
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Secure loan portfolio management for the Saudi Arabian market
              </p>
            </div>
            
            <Button 
              onClick={() => window.location.href = "/api/login"}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              data-testid="button-login"
            >
              Sign In with Replit Auth
            </Button>
            
            <div className="text-center">
              <a href="#" className="text-sm text-primary hover:underline">
                Need help accessing your account?
              </a>
            </div>
          </div>
          
          {/* External stakeholder access */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center mb-3">External Stakeholder Access</p>
            <Button 
              variant="secondary"
              className="w-full py-2 rounded-lg font-medium hover:bg-secondary/80 transition-colors"
              data-testid="button-view-only"
              disabled
            >
              <Eye className="mr-2 h-4 w-4" />
              View-Only Dashboard (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
