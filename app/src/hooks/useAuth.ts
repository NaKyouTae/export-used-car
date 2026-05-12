"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  email: string;
  userType: "SELLER" | "BUYER";
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
  const [state, setState] = useState<AuthState>(
    cachedAuth || { user: null, isAuthenticated: false, isLoading: true }
  );

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (cachedAuth) {
        setState(cachedAuth);
        return;
      }

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
  }, []);

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
