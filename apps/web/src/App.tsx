import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppLayout from "./components/layout/AppLayout";

import ChatPage from "./pages/ChatPage";
import SearchPage from "./pages/SearchPage";
import IndexPage from "./pages/IndexPage";
import FilesPage from "./pages/FilesPage";
import DocumentViewerPage from "./pages/DocumentViewerPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import WaitlistPage from "./pages/WaitlistPage";
import { Loader2 } from "lucide-react";
import { type ReactNode } from "react";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2
          size={28}
          style={{
            animation: "spin 1s linear infinite",
            color: "var(--color-accent)",
          }}
        />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/waitlist" replace />;
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/waitlist" element={<WaitlistPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<ChatPage />} />
              <Route path="/chat/:id" element={<ChatPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/index" element={<IndexPage />} />
              <Route path="/files" element={<FilesPage />} />
              <Route path="/document/:id" element={<DocumentViewerPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
