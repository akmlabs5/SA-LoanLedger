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
import CollateralPage from "@/pages/collateral";
import AIChatPage from "@/pages/ai-chat";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <AppLayout>
          <Route path="/" component={Dashboard} />
          <Route path="/loans" component={Loans} />
          <Route path="/banks" component={Banks} />
          <Route path="/collateral" component={CollateralPage} />
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
