import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

type User = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  roles: string[];
  referral?: {
    code: string;
    referredBy?: string;
    earnings: number;
    tier: number;
    banned: boolean;
  };
  kyc?: { // Added kyc to User type
    status: "not_submitted" | "pending" | "approved" | "rejected";
    remarks: string;
  };
  balance: number; // Added
  locked: number;    // Added
  totalProfit: number; // Added
  totalPayout: number; // Added
} | null;

const AuthCtx = createContext<{
  user: User;
  loading: boolean; // Added loading state
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true); // Initialize loading as true

  const refresh = async () => {
    setLoading(true); // Set loading true before fetching
    try {
      const me = await fetch("/api/me", { credentials: "include" }).then((r) =>
        r.json(),
      );
      setUser(me);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setUser(null); // Ensure user is null on error
    } finally {
      setLoading(false); // Set loading false after fetch completes (success or error)
    }
  };

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}