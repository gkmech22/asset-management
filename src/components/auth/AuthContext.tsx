import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wyijpwoyskwrbgazwspp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5aWpwd295c2t3cmJnYXp3c3BwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NDkyODQsImV4cCI6MjA3MDEyNTI4NH0.VumtxlEXegD8JqqsAxcZgDA1_TLojuc4lOCR_2KlBq0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signInWithGoogle: (tokens?: { accessToken: string; refreshToken: string; expiresIn: string }) => Promise<void>;
  signOut: () => Promise<void>;
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
      console.log('Auth state changed:', event, session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (tokens?: { accessToken: string; refreshToken: string; expiresIn: string }) => {
    try {
      // Dynamically set redirect URL based on environment
      const redirectTo = process.env.NODE_ENV === 'production' 
        ? 'https://lead-asset-management.lovable.app/' 
        : 'http://localhost:8080';

      if (tokens) {
        // Handle OAuth redirect tokens
        console.log('Processing OAuth tokens:', { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresIn: tokens.expiresIn });
        const { data, error } = await supabase.auth.setSession({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          expires_in: parseInt(tokens.expiresIn),
        });
        if (error) throw error;
        console.log('Session set:', data.session);
        setUser(data.session?.user ?? null);
      } else {
        // Initiate Google OAuth flow
        console.log('Initiating Google OAuth with redirectTo:', redirectTo);
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
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

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
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