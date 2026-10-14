import { lazy, Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { motion } from "framer-motion";
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
import EditorPage from "./pages/EditorPage";
import DashboardSkeleton, { PlainSkeleton } from "./components/DashboardSkeleton";

const Privacy = lazy(() => import("./pages/Privacy"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Onboarding = lazy(() => import("./pages/Onboarding"));

const suspenseFallback = <PlainSkeleton />;
const dashboardFallback = <DashboardSkeleton />;

function Router() {
  const [location] = useLocation();
  return (
    <motion.div
      key={location.startsWith("/dashboard") ? "dashboard" : location}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/about"} component={About} />
        <Route path={"/meet-us"} component={MeetUs} />
        <Route path={"/careers"} component={Careers} />
        <Route path={"/recruitment"} component={Recruitment} />
        <Route path="/privacy"><Suspense fallback={suspenseFallback}><Privacy /></Suspense></Route>
        <Route path="/login" component={Login} />
        <Route path="/active-login" component={Login} />
        <Route path="/editor">
          {() => (
            <ProtectedRoute>
              <EditorPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/onboarding">
          {() => (
            <ProtectedRoute>
              <Suspense fallback={suspenseFallback}>
                <Onboarding />
              </Suspense>
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/dashboard">
          {() => (
            <ProtectedRoute>
              <Suspense fallback={dashboardFallback}>
                <Dashboard />
              </Suspense>
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/dashboard/:rest*">
          {() => (
            <ProtectedRoute>
              <Suspense fallback={dashboardFallback}>
                <Dashboard />
              </Suspense>
            </ProtectedRoute>
          )}
        </Route>
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </motion.div>
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
            <Analytics />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
