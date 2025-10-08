import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Building2, CheckCircle, Loader2, AlertCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

export default function AcceptInvitePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Extract token from URL (don't save yet - only when user accepts)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get('token');
    if (inviteToken) {
      setToken(inviteToken);
    }
  }, []);

  // Validate invitation token
  const { data: invitationData, isLoading, error } = useQuery({
    queryKey: ['/api/organization/invitation', token],
    queryFn: async () => {
      const response = await fetch(`/api/organization/invitation/${token}`);
      if (!response.ok) {
        throw new Error('Invalid or expired invitation');
      }
      const data = await response.json();
      return data.invitation;
    },
    enabled: !!token,
    retry: false,
  });

  const invitation = invitationData;

  // Accept invitation mutation (for already authenticated users)
  const acceptMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/organization/accept-invite', { token });
    },
    onSuccess: () => {
      toast({
        title: "Welcome to the team!",
        description: "You've successfully joined the organization",
      });
      setLocation('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Failed to accept invitation",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleAccept = async () => {
    if (!isAuthenticated) {
      // User wants to accept but needs to sign in first
      // Save token for post-login auto-acceptance
      if (token) {
        localStorage.setItem('pending_invite_token', token);
      }
      setLocation('/');
      return;
    }
    // User is authenticated, accept immediately
    await acceptMutation.mutateAsync();
  };

  const handleDecline = () => {
    // Clear any pending invitation token
    localStorage.removeItem('pending_invite_token');
    setLocation('/');
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full" data-testid="card-auth-loading">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Checking authentication...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full" data-testid="card-no-token">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <CardTitle>Invalid Invitation Link</CardTitle>
            <CardDescription>
              No invitation token found. Please check your invitation email and use the link provided.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full" data-testid="card-loading">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Validating invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full" data-testid="card-error">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <CardTitle>Invitation Invalid or Expired</CardTitle>
            <CardDescription>
              This invitation link is no longer valid. It may have expired or already been used.
              Please contact the organization owner for a new invitation.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-md w-full" data-testid="card-accept-invite">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Join Organization</CardTitle>
          <CardDescription>
            You've been invited to join a team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Organization</p>
                <p className="font-semibold" data-testid="text-organization-name">
                  {invitation?.organizationName || "Loading..."}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Invited by</p>
                <p className="font-semibold" data-testid="text-invited-by">
                  {invitation?.inviterEmail || "Loading..."}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm">What happens next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>You'll join {invitation?.organizationName || "the organization"} as a team member</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Access shared loans, facilities, and collateral data</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Collaborate with your team on loan management</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12"
              onClick={handleDecline}
              disabled={acceptMutation.isPending}
              data-testid="button-decline"
            >
              Decline
            </Button>
            <Button
              className="flex-1 h-12"
              onClick={handleAccept}
              disabled={acceptMutation.isPending}
              data-testid="button-accept"
            >
              {acceptMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : isAuthenticated ? (
                'Accept & Join'
              ) : (
                'Sign in to Accept'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
