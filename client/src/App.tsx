import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";

import LandingPage from "@/pages/landing";
import DashboardPage from "@/pages/dashboard";
import LoansPage from "@/pages/loans";
import BanksPage from "@/pages/banks";
import BankDetailPage from "@/pages/bank-detail";
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
import AIChatPage from "@/pages/ai-chat";
import NotFoundPage from "@/pages/not-found";

// Auth pages
import LoginPage from "@/pages/auth/login";
import SignupPage from "@/pages/auth/signup";
import ForgotPasswordPage from "@/pages/auth/forgot-password";

// Admin portal pages
import AdminLoginPage from "@/pages/admin-portal/login";
import AdminDashboardPage from "@/pages/admin-portal/dashboard";
import AdminUsersPage from "@/pages/admin-portal/users";

import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
// import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext"; // Disabled until Supabase is implemented

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

  // If loading timed out, show error and redirect to landing
  if (loadingTimeout) {
    console.error("Authentication loading timed out");
    return <LandingPage />;
  }

  // Handle admin portal routing (separate from user auth)
  if (location && typeof location === 'string' && location.startsWith("/admin-portal")) {
    return (
      <Switch>
        <Route path="/admin-portal/login" component={AdminLoginPage} />
        <Route path="/admin-portal/dashboard" component={AdminDashboardPage} />
        <Route path="/admin-portal/users" component={AdminUsersPage} />
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
        <Route component={LandingPage} />
      </Switch>
    );
  }

  // Authenticated user routes
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/loans" component={LoansPage} />
        <Route path="/loans/create" component={LoanCreatePage} />
        <Route path="/loans/create-general" component={LoanCreateGeneralPage} />
        <Route path="/loans/:id" component={LoanDetailPage} />
        <Route path="/loans/:id/edit" component={LoanEditPage} />
        <Route path="/loans/:id/payment/create" component={PaymentCreatePage} />
        <Route path="/banks" component={BanksPage} />
        <Route path="/banks/:id" component={BankDetailPage} />
        <Route path="/banks/:id/contact/create" component={BankContactCreatePage} />
        <Route path="/banks/:bankId/facility/create" component={FacilityCreatePage} />
        <Route path="/facility/create-general" component={FacilityCreateGeneralPage} />
        <Route path="/banks/:bankId/facility/:facilityId/edit" component={FacilityEditPage} />
        <Route path="/collateral" component={CollateralPage} />
        <Route path="/collateral/create" component={CollateralCreatePage} />
        <Route path="/collateral/:id/edit" component={CollateralEditPage} />
        <Route path="/guarantees" component={GuaranteesPage} />
        <Route path="/guarantees/create" component={GuaranteeCreatePage} />
        <Route path="/history" component={HistoryPage} />
        <Route path="/ai-chat" component={AIChatPage} />
        <Route component={NotFoundPage} />
      </Switch>
    </AppLayout>
  );
}

export default function AppWrapper() {
  // Supabase is disabled until API is implemented
  const USE_SUPABASE_AUTH = false;

  return (
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster />
    </QueryClientProvider>
  );
}