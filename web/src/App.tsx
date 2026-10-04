import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { FrameworkProvider } from "@/contexts/FrameworkContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ScrollToTop from "@/components/ScrollToTop";
import CookieBanner from "./components/CookieBanner";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import PdfProgressOverlay from "./components/PdfProgressOverlay";
import RouteSEO from "./components/RouteSEO";
import { isToolPathHidden } from "./config/uniqFeatures";

import NotFound from "./pages/NotFound";

const PipelineLayout = () => (
  <ProtectedRoute>
    <AppLayout>
      <Outlet />
    </AppLayout>
  </ProtectedRoute>
);

// Surviving pages
const Scope = lazy(() => import("./pages/Scope"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Settings = lazy(() => import("./pages/Settings"));
const Datenschutz = lazy(() => import("./pages/Datenschutz"));
const Impressum = lazy(() => import("./pages/Impressum"));
const CookieEinstellungen = lazy(() => import("./pages/CookieEinstellungen"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const Assessment = lazy(() => import("./pages/Assessment"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Risk = lazy(() => import("./pages/Risk"));
const Roadmap = lazy(() => import("./pages/Roadmap"));
const Policies = lazy(() => import("./pages/Policies"));
const Trainings = lazy(() => import("./pages/Trainings"));
const IncidentManagement = lazy(() => import("./pages/IncidentManagement"));
const DocumentLifecycle = lazy(() => import("./pages/DocumentLifecycle"));
const ProcurementCheck = lazy(() => import("./pages/ProcurementCheck"));
const SupplierCheck = lazy(() => import("./pages/SupplierCheck"));
const KiGovernance = lazy(() => import("./pages/KiGovernance"));
const AuditWorkbench = lazy(() => import("./pages/AuditWorkbench"));
const DatenschutzCockpit = lazy(() => import("./pages/DatenschutzCockpit"));
const ThirdPartyRisk = lazy(() => import("./pages/ThirdPartyRisk"));
const BusinessContinuity = lazy(() => import("./pages/BusinessContinuity"));
const ManagementReview = lazy(() => import("./pages/ManagementReview"));
const ControlMonitoring = lazy(() => import("./pages/ControlMonitoring"));


const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/10">
    <div className="relative h-12 w-12">
      <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
      <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  </div>
);

// UniqSuite: frühere Phase 06 ist Teil von 05 „Plan & Umsetzung" — alte Links (auch ?focus=…) weiterleiten.
const ImplementationRedirect = () => {
  const { search } = useLocation();
  const q = new URLSearchParams(search);
  q.set("tab", "umsetzung");
  return <Navigate to={`/roadmap?${q.toString()}`} replace />;
};

const ScrollToTopOnRouteChange = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [pathname]);
  return null;
};

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
      <FrameworkProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTopOnRouteChange />
            <RouteSEO />
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route path="/datenschutz" element={<Datenschutz />} />
                <Route path="/impressum" element={<Impressum />} />
                <Route path="/cookie-einstellungen" element={<CookieEinstellungen />} />

                {/* 7-phase pipeline (PipelineLayout). Dashboard is a global overview, not a phase. */}
                <Route element={<PipelineLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/context" element={<Scope />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/assessment" element={<Assessment />} />
                  <Route path="/decision" element={<Risk />} />
                  <Route path="/implementation" element={<ImplementationRedirect />} />
                  <Route path="/roadmap" element={<Roadmap />} />
                  <Route path="/policies" element={<Policies />} />
                  <Route path="/trainings" element={isToolPathHidden("/trainings") ? <Navigate to="/dashboard" replace /> : <Trainings />} />
                  <Route path="/incidents" element={<IncidentManagement />} />
                  <Route path="/documents" element={isToolPathHidden("/documents") ? <Navigate to="/dashboard" replace /> : <DocumentLifecycle />} />
                  <Route path="/procurement" element={isToolPathHidden("/procurement") ? <Navigate to="/dashboard" replace /> : <ProcurementCheck />} />
                  <Route path="/suppliers" element={<SupplierCheck />} />
                  <Route path="/tprm" element={isToolPathHidden("/tprm") ? <Navigate to="/dashboard" replace /> : <ThirdPartyRisk />} />
                  <Route path="/datenschutz-cockpit" element={isToolPathHidden("/datenschutz-cockpit") ? <Navigate to="/dashboard" replace /> : <DatenschutzCockpit />} />
                  <Route path="/bcm" element={isToolPathHidden("/bcm") ? <Navigate to="/dashboard" replace /> : <BusinessContinuity />} />
                  <Route path="/ki-governance" element={<KiGovernance />} />
                  <Route path="/management-review" element={isToolPathHidden("/management-review") ? <Navigate to="/dashboard" replace /> : <ManagementReview />} />
                  <Route path="/control-monitoring" element={isToolPathHidden("/control-monitoring") ? <Navigate to="/dashboard" replace /> : <ControlMonitoring />} />
                  <Route path="/audit" element={<AuditWorkbench />} />
                </Route>

                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/settings/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />


                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <CookieBanner />
            <PdfProgressOverlay />
          </BrowserRouter>
        </TooltipProvider>
      </FrameworkProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
