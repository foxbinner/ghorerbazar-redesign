import { createContext, useContext, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabaseAdminAuth } from '../lib/supabaseAdminAuth';

const AuthCtx = createContext(null);

export function AdminAuthProvider({ children }) {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabaseAdminAuth.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
      setLoading(false);
    });
    const { data: { subscription } } = supabaseAdminAuth.auth.onAuthStateChange((_event, session) => {
      if (session && session.user?.email !== 'admin@ghorerbazar.com') {
        supabaseAdminAuth.auth.signOut();
        setAuthed(false);
        return;
      }
      setAuthed(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabaseAdminAuth.auth.signInWithPassword({ email, password });
    if (error) return false;
    if (data.user?.email !== 'admin@ghorerbazar.com') {
      await supabaseAdminAuth.auth.signOut();
      return false;
    }
    return true;
  };

  const logout = async () => {
    await supabaseAdminAuth.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1a1f2e]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
      </div>
    );
  }

  return <AuthCtx.Provider value={{ authed, login, logout }}>{children}</AuthCtx.Provider>;
}

export function useAdminAuth() {
  return useContext(AuthCtx);
}

export function RequireAuth({ children }) {
  const { authed } = useAdminAuth();
  return authed ? children : <Navigate to="/admin/login" replace />;
}
