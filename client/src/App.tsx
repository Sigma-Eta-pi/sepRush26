import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import About from "./pages/About";
import MeetUs from "./pages/MeetUs";
import Careers from "./pages/Careers";
import Recruitment from "./pages/Recruitment";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Onboarding = lazy(() => import("./pages/Onboarding"));

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/about"} component={About} />
      <Route path={"/meet-us"} component={MeetUs} />
      <Route path={"/careers"} component={Careers} />
      <Route path={"/recruitment"} component={Recruitment} />
      <Route path="/active-login" component={Login} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/onboarding">
        {() => (
          <ProtectedRoute>
            <Suspense fallback={<div className="min-h-screen bg-[#05006C] flex items-center justify-center"><div className="text-[#EEEADE]">Loading...</div></div>}>
              <Onboarding />
            </Suspense>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/dashboard">
        {() => (
          <ProtectedRoute>
            <Suspense fallback={<div className="min-h-screen bg-[#05006C] flex items-center justify-center"><div className="text-[#EEEADE]">Loading...</div></div>}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/dashboard/:rest*">
        {() => (
          <ProtectedRoute>
            <Suspense fallback={<div className="min-h-screen bg-[#05006C] flex items-center justify-center"><div className="text-[#EEEADE]">Loading...</div></div>}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        )}
      </Route>
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <ScrollToTop />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
