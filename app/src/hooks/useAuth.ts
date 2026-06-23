"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

interface User {
  id: string;
  email: string;
  role: "SELLER" | "BUYER";
  language?: "EN" | "KO";
  name?: string;
  companyName?: string;
  phone?: string;
  country?: string;
  businessNumber?: string;
  address?: string;
  contactName?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

let cachedAuth: AuthState | null = null;
let fetchPromise: Promise<AuthState> | null = null;

async function fetchAuthState(): Promise<AuthState> {
  try {
    const res = await fetch("/api/auth/token", { credentials: "include" });

    if (res.status === 401) {
      const refreshRes = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (refreshRes.ok) {
        const retryRes = await fetch("/api/auth/token", {
          credentials: "include",
        });
        if (retryRes.ok) {
          const data = await retryRes.json();
          if (data.authenticated && data.user) {
            return { user: data.user, isAuthenticated: true, isLoading: false };
          }
        }
      }

      return { user: null, isAuthenticated: false, isLoading: false };
    }

    if (!res.ok) {
      return { user: null, isAuthenticated: false, isLoading: false };
    }

    const data = await res.json();
    if (data.authenticated && data.user) {
      return { user: data.user, isAuthenticated: true, isLoading: false };
    }
    return { user: null, isAuthenticated: false, isLoading: false };
  } catch {
    return { user: null, isAuthenticated: false, isLoading: false };
  }
}

export function useAuth() {
  const pathname = usePathname();
  const [state, setState] = useState<AuthState>(
    cachedAuth || { user: null, isAuthenticated: false, isLoading: true }
  );

  // Revalidate on every route change so role/identity changes propagate
  // immediately and a stale cachedAuth from a previous session/account
  // cannot leak (e.g. lingering SELLER role for a BUYER).
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      cachedAuth = null;
      if (!fetchPromise) {
        fetchPromise = fetchAuthState();
      }

      const authState = await fetchPromise;
      cachedAuth = authState;
      fetchPromise = null;

      if (!cancelled) {
        setState(authState);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const login = useCallback(async () => {
    cachedAuth = null;
    fetchPromise = null;
    const authState = await fetchAuthState();
    cachedAuth = authState;
    setState(authState);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/token", {
      method: "DELETE",
      credentials: "include",
    });
    cachedAuth = null;
    fetchPromise = null;
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        cachedAuth = null;
        fetchPromise = null;
        const authState = await fetchAuthState();
        cachedAuth = authState;
        setState(authState);
      }
    } catch {
      // refresh failed
    }
  }, []);

  return { ...state, login, logout, refresh };
}
