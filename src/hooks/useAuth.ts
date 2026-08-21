import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, createContext, useContext, createElement, type ReactNode } from "react";

export type AuthUser = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  role: "student" | "admin";
  whatsapp?: string | null;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
    whatsapp?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (userId: string, email?: string | null) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, whatsapp")
        .eq("id", userId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn("Auth profile fetch (non-fatal):", error.message ?? String(error));
      }

      if (data) {
        setUser({
          id: data.id,
          email: data.email ?? email ?? null,
          full_name: data.full_name,
          role: (data.role as "student" | "admin") || "student",
          whatsapp: data.whatsapp,
        });
      } else {
        setUser({
          id: userId,
          email: email || null,
          full_name: null,
          role: "student",
          whatsapp: null,
        });
      }
    } catch (err: any) {
      console.warn("Auth profile fetch exception (non-fatal):", err?.message ?? String(err));
      setUser({
        id: userId,
        email: email || null,
        full_name: null,
        role: "student",
        whatsapp: null,
      });
    }
  };

  const refreshUser = async () => {
    try {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        setUser(null);
        return;
      }

      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email);
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();

        if (mounted && session?.user) {
          await fetchProfile(session.user.id, session.user.email);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        if (session?.user) {
          setLoading(true);
          await fetchProfile(session.user.id, session.user.email);
          setLoading(false);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes("Invalid login credentials") || error.status === 400) {
        throw new Error("Imel oswa modpas pa bon / Correo o contraseña incorrectos");
      }
      if (error.message.includes("Email not confirmed")) {
        throw new Error("Tanpri verifye imel ou / Por favor verifica tu correo");
      }
      throw new Error("Imel oswa modpas pa bon / Correo o contraseña incorrectos");
    }
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    whatsapp?: string
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: "student",
          whatsapp: whatsapp || null,
        },
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        throw new Error("Imel sa a deja itilize / Este correo ya está registrado");
      }
      if (error.message.includes("weak password")) {
        throw new Error("Modpas la fèb, tanpri rann li pi fò / Contraseña débil, por favor hazla más fuerte");
      }
      throw new Error("Enskripsyon an echwe / Registro fallido: " + error.message);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error("Dekoneksyon an echwe / Error al cerrar sesión");
    }
    setUser(null);
  };

  const isAdmin = user?.role === "admin";

  const value: AuthContextType = {
    user,
    loading,
    isAdmin,
    login,
    register,
    logout,
    refreshUser,
  };

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
