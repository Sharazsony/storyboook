import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { useGetMe, getGetMeQueryKey, useHealthCheck, getHealthCheckQueryKey, setBaseUrl } from "@workspace/api-client-react";

import Dashboard from "@/pages/dashboard";
import Events from "@/pages/events";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

// Set API base URL - detect if we're in development or production
const apiBaseUrl = import.meta.env.DEV 
  ? "http://localhost:5000"
  : window.location.origin;
setBaseUrl(apiBaseUrl);

const queryClient = new QueryClient();

// Auth wrapper to protect routes
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [location, setLocation] = useLocation();
  const { data: user, error, isLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false }
  });

  // Call healthcheck just to satisfy hook usage
  useHealthCheck({
    query: { queryKey: getHealthCheckQueryKey(), retry: false }
  });

  useEffect(() => {
    if (!isLoading && (error || !user)) {
      setLocation("/login");
    }
  }, [user, error, isLoading, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!user) {
    return null; // Will redirect
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/events" component={() => <ProtectedRoute component={Events} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
