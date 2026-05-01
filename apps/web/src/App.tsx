import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { UploadProvider } from "./context/UploadContext";
import { ModalProvider } from "./context/ModalContext"; // ✅ NEW: Custom modal
import AppLayout from "./components/layout/AppLayout";

import ChatPage from "./pages/ChatPage";
import SearchPage from "./pages/SearchPage";
// Index page temporarily hidden from the app UI
// import IndexPage from "./pages/IndexPage";
import FilesPage from "./pages/FilesPage";
import DocumentViewerPage from "./pages/DocumentViewerPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";
// import LoginPage from "./pages/LoginPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import WaitlistPage from "./pages/WaitlistPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import NotFoundPage from "./pages/NotFoundPage";
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

  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/waitlist" replace />
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <UploadProvider>
          <ModalProvider>
            {" "}
            {/* ✅ NEW: Wrap app with modal provider */}
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/waitlist" element={<WaitlistPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route
                  path="/terms-of-service"
                  element={<TermsOfServicePage />}
                />
                {/* <Route path="/login" element={<LoginPage />} /> */}
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
                  {/* Index page commented out — keep old links working */}
                  <Route path="/index" element={<Navigate to="/" replace />} />
                  <Route path="/files" element={<FilesPage />} />
                  <Route
                    path="/document/:id"
                    element={<DocumentViewerPage />}
                  />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                </Route>
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
          </ModalProvider>{" "}
          {/* ✅ NEW */}
        </UploadProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
