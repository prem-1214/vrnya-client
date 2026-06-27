import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { UploadProvider } from "./context/UploadContext";
import { ModalProvider } from "./context/ModalContext"; // ✅ NEW: Custom modal
import AppLayout from "./components/layout/AppLayout";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { type ReactNode } from "react";

const ChatPage = lazy(() => import("./pages/ChatPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const FilesPage = lazy(() => import("./pages/FilesPage"));
const DocumentViewerPage = lazy(() => import("./pages/DocumentViewerPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
import WaitlistPage from "./pages/WaitlistPage";
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));

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

function PageLoader() {
  return (
    <div
      style={{
        height: "100vh",
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

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <UploadProvider>
          <ModalProvider>
            {" "}
            {/* ✅ NEW: Wrap app with modal provider */}
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/waitlist" element={<WaitlistPage />} />
                  <Route
                    path="/privacy-policy"
                    element={<PrivacyPolicyPage />}
                  />
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
                    <Route
                      path="/index"
                      element={<Navigate to="/" replace />}
                    />
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
              </Suspense>
            </BrowserRouter>
          </ModalProvider>{" "}
          {/* ✅ NEW */}
        </UploadProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
