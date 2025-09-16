import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoginPage } from "@/components/auth/LoginPage";
import { AppHeader } from "@/components/AppHeader";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Settings } from "./pages/Settings";
import { Account } from "./pages/account/Account";
import { UserManagement } from "./pages/user-management/UserManagement";

const App = () => (
  <AuthProvider>
    <TooltipProvider>
      <Sonner />
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppHeader />
                <main className="container mx-auto px-4 py-6">
                  <Index />
                </main>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppHeader />
                <main className="container mx-auto px-4 py-6">
                  <Account />
                </main>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppHeader />
                <main className="container mx-auto px-4 py-6">
                  <Settings />
                </main>
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-management"
            element={
              <ProtectedRoute>
                <AppHeader />
                <main className="container mx-auto px-4 py-6">
                  <UserManagement />
                </main>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </TooltipProvider>
  </AuthProvider>
);

export default App;
