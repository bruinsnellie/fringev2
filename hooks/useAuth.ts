import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { DEFAULT_PROFILE_PIC } from '@/constants/images';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'student' | 'coach') => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      return { error: authError };
    }

    try {
      // Create profile with the default image URL
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          full_name: fullName,
          role,
          avatar_url: DEFAULT_PROFILE_PIC
        });

      return { error: profileError };
    } catch (err) {
      console.error('Error setting up profile:', err);
      return { error: err };
    }
  };

  const signOut = () => supabase.auth.signOut();

  const forceLogout = async () => {
    try {
      // Clear the session
      await supabase.auth.signOut();
      // Reset the session state
      setSession(null);
      // Clear local storage
      localStorage.clear();
      // Clear session storage
      sessionStorage.clear();
      // Force reload the page
      window.location.href = '/sign-in';
    } catch (err) {
      console.error('Error during force logout:', err);
      // Even if there's an error, try to force reload
      window.location.href = '/sign-in';
    }
  };

  return {
    session,
    loading,
    signIn,
    signUp,
    signOut,
    forceLogout,
  };
}