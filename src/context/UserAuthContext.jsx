import { createContext, useContext, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Ctx = createContext(null);

function isPhone(value) {
  return /^(\+88)?01[3-9]\d{8}$/.test(value.trim());
}

async function resolveEmail(phoneOrEmail) {
  if (!isPhone(phoneOrEmail)) return phoneOrEmail.trim();
  const { data } = await supabase.rpc('get_email_by_phone', { p_phone: phoneOrEmail.trim() });
  return data ?? null;
}

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const register = async (name, phone, email, password) => {
    // Check duplicate phone
    const { data: phoneUsed } = await supabase.rpc('phone_exists', { p_phone: phone.trim() });
    if (phoneUsed) return { ok: false, field: 'phone', message: 'Phone number already registered' };

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim(), phone: phone.trim() } },
    });
    if (error) {
      const isEmailDupe = error.message.toLowerCase().includes('already');
      return { ok: false, field: isEmailDupe ? 'email' : 'general', message: error.message };
    }

    // Insert profile row via security definer function (bypasses RLS)
    const { error: profileError } = await supabase.rpc('create_profile', {
      p_id: data.user.id,
      p_name: name.trim(),
      p_phone: phone.trim(),
      p_email: email.trim(),
    });
    if (profileError) return { ok: false, field: 'general', message: profileError.message };

    return { ok: true, needsVerification: true };
  };

  const login = async (phoneOrEmail, password) => {
    const email = await resolveEmail(phoneOrEmail);
    if (!email) return { ok: false, field: 'phoneOrEmail', message: 'No account found for this phone number' };

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, field: 'password', message: 'Invalid credentials' };
    return { ok: true };
  };

  const sendOtp = async (phoneOrEmail) => {
    const email = await resolveEmail(phoneOrEmail);
    if (!email) return { ok: false, message: 'No account found for this phone number' };

    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (error) return { ok: false, message: error.message };
    return { ok: true, email };
  };

  const verifyOtp = async (phoneOrEmail, token) => {
    const email = await resolveEmail(phoneOrEmail);
    if (!email) return { ok: false, message: 'Could not resolve account' };

    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) return { ok: false, message: 'Invalid or expired OTP' };
    return { ok: true };
  };

  const logout = async () => {
    // scope: 'local' clears the local session without a server round-trip,
    // avoiding 403s when the JWT has already expired.
    await supabase.auth.signOut({ scope: 'local' });
  };

  const update = async (fields) => {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshed?.session) {
      await supabase.auth.signOut({ scope: 'local' });
      return { ok: false, message: 'Your session has expired. Please log in again.' };
    }
    const { error } = await supabase.auth.updateUser({ data: fields });
    if (error) return { ok: false, message: error.message };
    await supabase.from('profiles').update(fields).eq('id', refreshed.session.user.id);
    return { ok: true };
  };

  const profile = user ? {
    id: user.id,
    name: user.user_metadata?.name ?? 'User',
    phone: user.user_metadata?.phone ?? '',
    email: user.email,
    joinedAt: user.created_at?.slice(0, 10),
    avatar: user.user_metadata?.avatar ?? '',
    district: user.user_metadata?.district ?? '',
    upazilla: user.user_metadata?.upazilla ?? '',
    address: user.user_metadata?.address ?? '',
  } : null;

  return (
    <Ctx.Provider value={{ user: profile, rawUser: user, loading, register, login, sendOtp, verifyOtp, logout, update }}>
      {children}
    </Ctx.Provider>
  );
}

export const useUserAuth = () => useContext(Ctx);

export function RequireUserAuth({ children }) {
  const { user, loading } = useUserAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  return children;
}
