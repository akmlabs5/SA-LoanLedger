import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";

import LandingPage from "@/pages/landing";
import LoginHub from "@/pages/LoginHub";
import DashboardPage from "@/pages/dashboard";
import LoansPage from "@/pages/loans";
import BanksPage from "@/pages/banks";
import BankDetailPage from "@/pages/bank-detail";
import BankAnalyticsPage from "@/pages/bank-analytics";
import BankContactCreatePage from "@/pages/bank-contact-create";
import FacilityCreatePage from "@/pages/facility-create";
import FacilityCreateGeneralPage from "@/pages/facility-create-general";
import FacilityEditPage from "@/pages/facility-edit";
import LoanCreatePage from "@/pages/loan-create";
import LoanCreateGeneralPage from "@/pages/loan-create-general";
import LoanDetailPage from "@/pages/loan-detail";
import LoanEditPage from "@/pages/loan-edit";
import PaymentCreatePage from "@/pages/payment-create";
import CollateralPage from "@/pages/collateral";
import CollateralCreatePage from "@/pages/collateral-create";
import CollateralEditPage from "@/pages/collateral-edit";
import GuaranteesPage from "@/pages/guarantees";
import GuaranteeCreatePage from "@/pages/guarantee-create";
import HistoryPage from "@/pages/history";
import ReportsPage from "@/pages/Reports";
import AIChatPage from "@/pages/ai-chat";
import NotFoundPage from "@/pages/not-found";

// Auth pages
import LoginPage from "@/pages/auth/login";
import SignupPage from "@/pages/auth/signup";
import ForgotPasswordPage from "@/pages/auth/forgot-password";
import SupabaseSignupPage from "@/pages/supabase-signup";
import SupabaseSigninPage from "@/pages/supabase-signin";
import UnifiedLoginPage from "@/pages/unified-login";

// Admin portal pages
import AdminDashboardPage from "@/pages/admin-portal/dashboard";
import AdminAnalyticsPage from "@/pages/admin-portal/analytics";
import AdminUsersPage from "@/pages/admin-portal/users";
import AdminUserActivitiesPage from "@/pages/admin-portal/user-activities";
import AdminDatabasePage from "@/pages/admin-portal/database";
import AdminSecurityPage from "@/pages/admin-portal/security";
import AdminAlertsPage from "@/pages/admin-portal/alerts";
import AdminSettingsPage from "@/pages/admin-portal/settings";
import AdminTemplatesPage from "@/pages/admin-portal/templates";
import UserSettingsPage from "@/pages/user-settings";
import FeaturesTipsPage from "@/pages/features-tips";
import HelpDeskPage from "@/pages/help-desk";
import AcceptInvitePage from "@/pages/accept-invite";
import MorePage from "@/pages/MorePage";

import AppLayout from "@/components/AppLayout";
import { MobileLayout } from "@/components/mobile";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  // Add timeout to prevent infinite loading
  const [loadingTimeout, setLoadingTimeout] = React.useState(false);

  React.useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000); // 10 second timeout

      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [isLoading]);

  if (isLoading && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If loading timed out, show error and redirect to unified login
  if (loadingTimeout) {
    console.error("Authentication loading timed out");
    return <UnifiedLoginPage />;
  }

  // Handle admin portal routing (separate from user auth)
  if (location && typeof location === 'string' && location.startsWith("/admin-portal")) {
    return (
      <Switch>
        <Route path="/admin-portal/login" component={UnifiedLoginPage} />
        <Route path="/admin-portal/dashboard" component={AdminDashboardPage} />
        <Route path="/admin-portal/analytics" component={AdminAnalyticsPage} />
        <Route path="/admin-portal/users" component={AdminUsersPage} />
        <Route path="/admin-portal/user-activities" component={AdminUserActivitiesPage} />
        <Route path="/admin-portal/database" component={AdminDatabasePage} />
        <Route path="/admin-portal/security" component={AdminSecurityPage} />
        <Route path="/admin-portal/alerts" component={AdminAlertsPage} />
        <Route path="/admin-portal/settings" component={AdminSettingsPage} />
        <Route path="/admin-portal/templates" component={AdminTemplatesPage} />
        <Route path="/admin-portal/*" component={AdminDashboardPage} />
      </Switch>
    );
  }

  // Handle auth routing
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/auth/login" component={LoginPage} />
        <Route path="/auth/signup" component={SignupPage} />
        <Route path="/auth/forgot-password" component={ForgotPasswordPage} />
        <Route path="/supabase-signup" component={SupabaseSignupPage} />
        <Route path="/supabase-signin" component={SupabaseSigninPage} />
        <Route path="/landing" component={LandingPage} />
        <Route path="/login-hub" component={LoginHub} />
        <Route path="/accept-invite" component={AcceptInvitePage} />
        <Route component={UnifiedLoginPage} />
      </Switch>
    );
  }

  // Authenticated user routes
  return (
    <AppLayout>
      <MobileLayout>
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/loans" component={LoansPage} />
          <Route path="/loans/create" component={LoanCreatePage} />
          <Route path="/loans/create-general" component={LoanCreateGeneralPage} />
          <Route path="/loans/:id" component={LoanDetailPage} />
          <Route path="/loans/:id/edit" component={LoanEditPage} />
          <Route path="/loans/:id/payment/create" component={PaymentCreatePage} />
          <Route path="/banks" component={BanksPage} />
          <Route path="/banks/:bankId/analytics" component={BankAnalyticsPage} />
          <Route path="/banks/:id" component={BankDetailPage} />
          <Route path="/banks/:bankId/contacts/new" component={BankContactCreatePage} />
          <Route path="/banks/:bankId/facility/create" component={FacilityCreatePage} />
          <Route path="/facility/create-general" component={FacilityCreateGeneralPage} />
          <Route path="/banks/:bankId/facility/:facilityId/edit" component={FacilityEditPage} />
          <Route path="/collateral" component={CollateralPage} />
          <Route path="/collateral/create" component={CollateralCreatePage} />
          <Route path="/collateral/:id/edit" component={CollateralEditPage} />
          <Route path="/guarantees" component={GuaranteesPage} />
          <Route path="/guarantees/create" component={GuaranteeCreatePage} />
          <Route path="/history" component={HistoryPage} />
          <Route path="/reports" component={ReportsPage} />
          <Route path="/ai-chat" component={AIChatPage} />
          <Route path="/more" component={MorePage} />
          <Route path="/settings" component={UserSettingsPage} />
          <Route path="/user-settings" component={UserSettingsPage} />
          <Route path="/features-tips" component={FeaturesTipsPage} />
          <Route path="/help-desk" component={HelpDeskPage} />
          <Route component={NotFoundPage} />
        </Switch>
      </MobileLayout>
    </AppLayout>
  );
}

export default function AppWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <App />
        <Toaster />
        <PWAInstallPrompt />
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
}