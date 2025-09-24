import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Loans from "@/pages/loans";
import Banks from "@/pages/banks";
import BankDetail from "@/pages/bank-detail";
import LoanCreatePage from "@/pages/loan-create";
import LoanEditPage from "@/pages/loan-edit";
import FacilityCreatePage from "@/pages/facility-create";
import FacilityEditPage from "@/pages/facility-edit";
import CollateralCreatePage from "@/pages/collateral-create";
import BankContactCreatePage from "@/pages/bank-contact-create";
import GeneralFacilityCreatePage from "@/pages/facility-create-general";
import GeneralLoanCreatePage from "@/pages/loan-create-general";
import CollateralPage from "@/pages/collateral";
import AIChatPage from "@/pages/ai-chat";
import HistoryPage from "@/pages/history";
import PaymentCreatePage from "@/pages/payment-create";
import NotFound from "@/pages/not-found";

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
        <Route path="/" component={Landing} />
      ) : (
        <AppLayout>
          <Route path="/" component={Dashboard} />
          <Route path="/loans" component={Loans} />
          <Route path="/banks" component={Banks} />
          <Route path="/banks/:bankId" component={BankDetail} />
          <Route path="/banks/:bankId/loans/new" component={LoanCreatePage} />
          <Route path="/loans/new" component={GeneralLoanCreatePage} />
          <Route path="/loans/:loanId/edit" component={LoanEditPage} />
        <Route path="/banks/:bankId/facilities/new" component={FacilityCreatePage} />
          <Route path="/banks/:bankId/facilities/:facilityId/edit" component={FacilityEditPage} />
          <Route path="/banks/:bankId/contacts/new" component={BankContactCreatePage} />
          <Route path="/facilities/new" component={GeneralFacilityCreatePage} />
          <Route path="/collateral" component={CollateralPage} />
          <Route path="/collateral/new" component={CollateralCreatePage} />
          <Route path="/loans/:loanId/payment" component={PaymentCreatePage} />
          <Route path="/payment/new" component={PaymentCreatePage} />
          <Route path="/history" component={HistoryPage} />
          <Route path="/ai-chat" component={AIChatPage} />
        </AppLayout>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
