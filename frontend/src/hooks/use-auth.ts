"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { LoginRequest, LoginResponse, MeResponse } from "@/types";

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setLoading, logout } =
    useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token && !user) {
      fetchProfile();
    } else if (!token) {
      setUser(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const res = await api.get<MeResponse>("/auth/me");
      setUser({
        id: res.data.user.id,
        email: res.data.user.email,
        full_name: res.data.user.full_name,
        avatar_url: res.data.user.avatar_url,
        roles: res.data.roles,
      });
    } catch {
      setUser(null);
    }
  }

  async function login(data: LoginRequest) {
    const res = await api.post<LoginResponse>("/auth/login", data);
    localStorage.setItem("access_token", res.data.access_token);
    localStorage.setItem("refresh_token", res.data.refresh_token);
    setUser({
      id: res.data.user.id,
      email: res.data.user.email,
      full_name: res.data.user.full_name,
      avatar_url: res.data.user.avatar_url,
      roles: res.data.roles,
    });
    router.push("/dashboard");
  }

  function hasRole(role: string): boolean {
    return user?.roles.includes(role) || user?.roles.includes("super_admin") || false;
  }

  function hasAnyRole(roles: string[]): boolean {
    return roles.some((r) => hasRole(r));
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasRole,
    hasAnyRole,
    fetchProfile,
  };
}
