import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
// import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext"; // Disabled until Supabase is implemented

const queryClient = new QueryClient();

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loading</h2>
          <p className="text-gray-600 dark:text-gray-400">Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={LandingPage} />
      ) : (
        <AppLayout>
          <Route path="/" component={DashboardPage} />
          <Route path="/loans" component={LoansPage} />
          <Route path="/banks" component={BanksPage} />
          <Route path="/banks/:bankId" component={BankDetailPage} />
          <Route path="/banks/:bankId/loans/new" component={LoanCreatePage} />
          <Route path="/loans/new" component={LoanCreateGeneralPage} />
          <Route path="/loans/:loanId" component={LoanDetailPage} />
          <Route path="/loans/:loanId/edit" component={LoanEditPage} />
        <Route path="/banks/:bankId/facilities/new" component={FacilityCreatePage} />
          <Route path="/banks/:bankId/facilities/:facilityId/edit" component={FacilityEditPage} />
          <Route path="/banks/:bankId/contacts/new" component={BankContactCreatePage} />
          <Route path="/facilities/new" component={FacilityCreateGeneralPage} />
          <Route path="/collateral" component={CollateralPage} />
          <Route path="/collateral/new" component={CollateralCreatePage} />
          <Route path="/collateral/:collateralId/edit" component={CollateralEditPage} />
          <Route path="/loans/:loanId/payment" component={PaymentCreatePage} />
          <Route path="/payment/new" component={PaymentCreatePage} />
          <Route path="/guarantees" component={GuaranteesPage} />
          <Route path="/guarantees/create" component={GuaranteeCreatePage} />
          <Route path="/history" component={HistoryPage} />
          <Route path="/ai-chat" component={AIChatPage} />
        </AppLayout>
      )}
      <Route component={NotFoundPage} />
    </Switch>
  );
}

// Feature flag to use Supabase Auth - DISABLED until API is implemented
const USE_SUPABASE_AUTH = false;

function App() {
  const { isAuthenticated, isLoading, authSystem } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saudi mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle auth routing
  if (!isAuthenticated) {
    if (USE_SUPABASE_AUTH) {
      // Supabase Auth routing
      return (
        <Switch>
          <Route path="/auth/login" component={LoginPage} />
          <Route path="/auth/signup" component={SignupPage} />
          <Route path="/auth/forgot-password" component={ForgotPasswordPage} />
          <Route component={LoginPage} />
        </Switch>
      );
    } else {
      // Replit Auth landing page
      return <LandingPage />;
    }
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
        <Route path="/banks/:id/facility/create" component={FacilityCreatePage} />
        <Route path="/facility/create-general" component={FacilityCreateGeneralPage} />
        <Route path="/facility/:id/edit" component={FacilityEditPage} />
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
  const USE_SUPABASE_AUTH = import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY;

  return (
    <QueryClientProvider client={queryClient}>
      {USE_SUPABASE_AUTH ? (
        <SupabaseAuthProvider>
          <App />
          <Toaster />
        </SupabaseAuthProvider>
      ) : (
        <>
          <App />
          <Toaster />
        </>
      )}
    </QueryClientProvider>
  );
}