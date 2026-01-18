
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User, UserRole, SavedPlace, TransactionType } from '../types';
import { mockLoginUser } from '../services/mockService';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';
import logger from '../utils/logger';

interface ExtendedAuthContextType extends AuthContextType {
  loginPassenger: (identifier: string, password: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
  viewAsRole: UserRole | null;
  switchView: (role: UserRole | null) => void;
  effectiveRole: UserRole | undefined;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<ExtendedAuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [viewAsRole, setViewAsRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for Supabase Auth State Changes
  useEffect(() => {
    logger.log("Initializing AuthProvider...");

    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        logger.log("Initial session found", { userId: session.user.id });
        await fetchAndSetUser(session.user);
      } else {
        setIsLoading(false);
      }
    };

    checkInitialSession();

    // Safety fallback: Unblock the UI after 5 seconds if auth doesn't resolve
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        logger.warn("Auth initialization timed out. Unblocking UI.");
        setIsLoading(false);
      }
    }, 2500);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.log(`Auth event: ${event}`, { userId: session?.user?.id });

      if (session?.user) {
        await fetchAndSetUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
      }

      if (event === 'PASSWORD_RECOVERY') {
        logger.log("Password recovery event detected");
      }
    });

    async function fetchAndSetUser(supabaseUser: any) {
      try {
        // ⚡ OPTIMIZATION: Try to use metadata first to avoid a database round-trip
        // This is much faster than fetching from the profiles table
        const metadata = supabaseUser.user_metadata || {};

        // Check if we already have the basic data we need
        if (metadata.name && metadata.role) {
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: metadata.name,
            role: metadata.role,
            phone: metadata.phone || '',
            adminRole: metadata.admin_role || (metadata.role === 'ADMIN' ? 'ADMIN' : undefined),
          } as User);

          // Background sync to ensure we have the latest profile data (non-blocking)
          // This keeps the UI responsive while we verify details
          setIsLoading(false);
          clearTimeout(safetyTimeout);

          // Non-blocking background fetch
          supabase.from('profiles').select('*').eq('id', supabaseUser.id).single()
            .then(({ data: profile }) => {
              if (profile) {
                setUser(prev => ({
                  ...prev,
                  ...profile,
                  adminRole: profile.admin_role
                } as User));
              }
            });
          return;
        }

        // Fallback: If metadata is missing, do a blocking fetch
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        if (profile) {
          setUser({
            ...profile,
            adminRole: profile.admin_role
          } as User);
        } else {
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            role: UserRole.PASSENGER,
            name: metadata.name || supabaseUser.email?.split('@')[0],
          } as User);
        }
      } catch (e) {
        logger.error("Critical error fetching user profile", e);
      } finally {
        setIsLoading(false);
        clearTimeout(safetyTimeout);
      }
    }

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const login = async (role: UserRole, userData?: Partial<User>) => {
    // Legacy/Mock login for Driver/Admin - Should be replaced by real auth eventually
    // For now, if we are in development, we might still allow this, 
    // but the goal is to use REAL AUTH.
    // If userData has an ID and we are authenticated, we should fetch the real profile.
    if (userData?.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.id)
        .single();

      if (profile) {
        setUser(profile as User);
        return;
      }
    }

    const baseUser = mockLoginUser(role);
    const finalUser = userData ? { ...baseUser, ...userData } : baseUser;
    setUser(finalUser);
  };

  const loginPassenger = async (identifier: string, password: string) => {
    try {
      const loggedUser = await authService.loginPassenger(identifier, password);
      setUser(loggedUser);
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    try {
      const updatedUser = await authService.updateUser(user.id, data);
      setUser(updatedUser);
    } catch (error) {
      logger.error("Profile update failed", error);
      throw error;
    }
  };

  const walletTransaction = async (amount: number, type: TransactionType, description: string, reference?: string) => {
    if (!user) return;
    try {
      const updatedUser = await authService.processTransaction(user.id, amount, type, description, reference);
      setUser(updatedUser);
    } catch (error) {
      logger.error("Transaction failed", error);
      throw error;
    }
  };

  const toggleFavoriteDriver = async (driverId: string) => {
    if (!user) return;
    try {
      const updatedUser = await authService.toggleFavoriteDriver(user.id, driverId);
      setUser(updatedUser);
    } catch (error) {
      logger.error("Failed to toggle favorite driver", error);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const addSavedPlace = (place: SavedPlace) => {
    setUser((currentUser) => {
      if (!currentUser) return null;
      return {
        ...currentUser,
        savedPlaces: [...(currentUser.savedPlaces || []), place]
      };
    });
  };

  const removeSavedPlace = (id: string) => {
    setUser((currentUser) => {
      if (!currentUser) return null;
      return {
        ...currentUser,
        savedPlaces: (currentUser.savedPlaces || []).filter((p) => p.id !== id)
      };
    });
  };

  const connectGoogle = async () => {
    if (!user) return;
    try {
      await authService.loginWithGoogle();
      // The user will be redirected to Google login
    } catch (error) {
      logger.error("Error connecting google", error);
    }
  };

  const disconnectGoogle = () => {
    if (!user) return;
    const { googleProfile, ...rest } = user;
    setUser(rest);
  };

  const refreshBalance = async () => {
    if (!user?.id) return;
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (profile) {
        // Merge newest profile with existing local user state (to keep temporary UI states if any)
        const updatedProfile = {
          ...profile,
          adminRole: profile.admin_role
        };
        setUser(prev => prev ? { ...prev, ...updatedProfile } : updatedProfile as User);
        logger.log("Balance refreshed from Supabase", updatedProfile);
      }
    } catch (e) {
      logger.error("Error refreshing balance", e);
      throw e;
    }
  };
  const switchView = (role: UserRole | null) => {
    setViewAsRole(role);
    logger.log(`Switching view to: ${role || 'DEFAULT'}`);
  };

  const effectiveRole = viewAsRole || user?.role;
  const isSuperAdmin = user?.adminRole === 'SUPER_ADMIN';

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-mipana-darkBlue"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div></div>;
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      loginPassenger,
      updateProfile,
      walletTransaction,
      toggleFavoriteDriver,
      logout,
      isAuthenticated: !!user,
      addSavedPlace,
      removeSavedPlace,
      connectGoogle,
      disconnectGoogle,
      refreshBalance,
      isLoading,
      viewAsRole,
      switchView,
      effectiveRole,
      isSuperAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};
