import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { initGA, trackPageView } from "@/lib/analytics";
import Cart from "./pages/Cart";
import ProtectedRoute from "@/components/ProtectedRoute";

const Admin = lazy(() => import("./pages/Admin"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Login = lazy(() => import("./pages/Login"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const CustomerPortal = lazy(() => import("./pages/CustomerPortal"));
const ReferralProgram = lazy(() => import("./pages/ReferralProgram"));
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-500 text-sm">Cargando...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const AppRouter = () => {
  const location = useLocation();
  
  // Initialize GA and track page views
  React.useEffect(() => {
    initGA();
  }, []);

  React.useEffect(() => {
    trackPageView(location.pathname, document.title);
  }, [location]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/portal" element={<CustomerPortal />} />
        <Route path="/referrals" element={<ReferralProgram />} />
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <Admin />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <ThemeProvider defaultTheme="light">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRouter />
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
