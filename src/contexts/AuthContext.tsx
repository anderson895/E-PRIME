import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { UserAccount, UserRole } from "@/types";
import {
  loginUser,
  logoutUser,
  resetPassword,
  getUserProfile,
  onAuthChange,
} from "@/services/authService";
import { addSystemLog } from "@/services/adminService";

interface AuthContextType {
  user: UserAccount | null;
  initializing: boolean; // true only during the first Firebase auth check
  loading: boolean;      // true only while a login attempt is in progress
  error: string | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [initializing, setInitializing] = useState(true); // first auth check only
  const [loading, setLoading] = useState(false);          // login button spinner
  const [error, setError] = useState<string | null>(null);

  // Listen for auth state changes (runs once on mount)
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setUser(profile);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(
    async (email: string, password: string, role: UserRole) => {
      setLoading(true); // only spins the button, does NOT show full-screen loader
      setError(null);
      try {
        const account = await loginUser(email, password, role);
        setUser(account);
        await addSystemLog({
          userId: account.uid,
          userName: account.displayName,
          action: "User Login",
          details: `Role: ${account.role}`,
          type: "auth",
        });
      } catch (err: any) {
        const msg =
          err.code === "auth/invalid-credential"
            ? "Invalid email or password."
            : err.code === "auth/too-many-requests"
            ? "Too many attempts. Please try again later."
            : err.message || "Login failed.";
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    if (user) {
      await addSystemLog({
        userId: user.uid,
        userName: user.displayName,
        action: "User Logout",
        details: `Role: ${user.role}`,
        type: "auth",
      });
    }
    await logoutUser();
    setUser(null);
  }, [user]);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      await resetPassword(email);
    } catch (err: any) {
      throw new Error("Failed to send reset email. Please check your email address.");
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{ user, initializing, loading, error, login, logout, forgotPassword, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}