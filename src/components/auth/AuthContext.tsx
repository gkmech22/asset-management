import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ access_token: string; refresh_token: string }>;
  signInWithGoogle: (tokens?: { accessToken: string; refreshToken: string; expiresIn: string }) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (attributes: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session on mount
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setUser(data.session?.user ?? null);
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return {
        access_token: data.session?.access_token || '',
        refresh_token: data.session?.refresh_token || '',
      };
    } catch (error) {
      console.error('Sign-in error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async (tokens?: { accessToken: string; refreshToken: string; expiresIn: string }) => {
    try {
      if (tokens) {
        // Handle OAuth redirect tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
        });
        if (error) throw error;
        setUser(data.session?.user ?? null);
      } else {
        // Initiate Google OAuth flow
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });
        if (error) throw error;
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  };

  const updateUser = async (attributes: any) => {
    try {
      const { data, error } = await supabase.auth.updateUser(attributes);
      if (error) throw error;
      setUser(data.user);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithGoogle, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};