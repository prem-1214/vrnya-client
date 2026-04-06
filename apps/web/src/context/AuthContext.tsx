import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { authApi, tokenStore, singletonRefresh, type AuthUser } from "../api/client";
import React from "react";

interface AuthContextType {
  user: AuthUser | null;
  isAuthLoading: boolean; // true during initial session restore
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  setTokenAndUser: (token: string, user: AuthUser) => void; // used by Google callback
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // On mount: try to restore session via HttpOnly refresh cookie
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        // singletonRefresh() is shared with apiFetch's 401 handler—
        // guaranteed only one HTTP request fires regardless of StrictMode
        const { accessToken } = await singletonRefresh();
        if (cancelled) return;
        tokenStore.set(accessToken);
        const { user: me } = await authApi.me();
        if (cancelled) return;
        setUser(me);
      } catch {
        if (!cancelled) {
          tokenStore.clear();
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsAuthLoading(false);
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);


  const login = useCallback(async (email: string, password: string) => {
    const { accessToken, user: loggedInUser } = await authApi.login({
      email,
      password,
    });
    tokenStore.set(accessToken);
    setUser(loggedInUser);
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const { accessToken, user: newUser } = await authApi.register({
        email,
        password,
        displayName,
      });
      tokenStore.set(accessToken);
      setUser(newUser);
    },
    [],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    tokenStore.clear();
    setUser(null);
  }, []);

  const setTokenAndUser = useCallback((token: string, newUser: AuthUser) => {
    tokenStore.set(token);
    setUser(newUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthLoading,
        isAuthenticated: user !== null,
        login,
        register,
        logout,
        setTokenAndUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
