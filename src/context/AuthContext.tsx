
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AuthContextType, User, UserRole, SavedPlace, TransactionType } from '../types';
import { authService } from '../services/authService';
import { walletService } from '../services/walletService';
import { supabase } from '../services/supabaseClient';
import logger from '../utils/logger';
import { AUTH_CONFIG } from '../config/constants';

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

  // Guard against double-processing of initial session
  const initialSessionHandled = useRef(false);

  useEffect(() => {
    logger.log("Initializing AuthProvider...");

    // Safety fallback: Unblock the UI after timeout if auth doesn't resolve
    const safetyTimeout = setTimeout(() => {
      setIsLoading(prev => {
        if (prev) {
          logger.warn("Auth initialization timed out. Unblocking UI.");
          return false;
        }
        return prev;
      });
    }, AUTH_CONFIG.TIMEOUT_MS);

    // Use ONLY onAuthStateChange — it fires INITIAL_SESSION automatically
    // This eliminates the race condition with separate getSession() calls
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.log(`Auth event: ${event}`, { userId: session?.user?.id });

      if (event === 'INITIAL_SESSION') {
        // This is the first event — handle it and mark as done
        if (session?.user) {
          await fetchAndSetUser(session.user);
        } else {
          // No session at all — user is not logged in
          setIsLoading(false);
        }
        initialSessionHandled.current = true;
        clearTimeout(safetyTimeout);
        return;
      }

      // For subsequent events (SIGNED_IN, TOKEN_REFRESHED, etc.)
      if (session?.user) {
        await fetchAndSetUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        logger.log("User signed out");
        setUser(null);
        setIsLoading(false);
      }
      // IMPORTANT: Ignore events with null session that are NOT SIGNED_OUT
      // (e.g., TOKEN_REFRESHED failure should not immediately log out the user)
    });

    async function fetchAndSetUser(supabaseUser: any) {
      try {
        // ⚡ OPTIMIZATION: Try to use metadata first to avoid a database round-trip
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

          // Show UI immediately
          setIsLoading(false);

          // Non-blocking background fetch to sync latest profile data
          supabase.from('profiles').select('*').eq('id', supabaseUser.id).single()
            .then(({ data: profile, error }) => {
              if (profile && !error) {
                setUser(prev => prev ? ({
                  ...prev,
                  ...profile,
                  adminRole: profile.admin_role
                } as User) : prev);
              }
              // If error, keep the metadata-based user — don't break the session
            })
            .catch(err => {
              logger.warn("Background profile sync failed (non-critical)", err);
            });
          return;
        }

        // Fallback: If metadata is missing, do a blocking fetch
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        if (profile && !error) {
          setUser({
            ...profile,
            adminRole: profile.admin_role
          } as User);
        } else {
          // Last resort: create minimal user from Supabase auth data
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            role: UserRole.PASSENGER,
            name: metadata.name || supabaseUser.email?.split('@')[0] || 'Usuario',
          } as User);
        }
      } catch (e) {
        logger.error("Critical error fetching user profile", e);
        // Even on error, set a minimal user so the session isn't lost
        try {
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            role: UserRole.PASSENGER,
            name: supabaseUser.email?.split('@')[0] || 'Usuario',
          } as User);
        } catch (_) {
          // Absolute last resort
        }
      } finally {
        setIsLoading(false);
      }
    }

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);


  const loginPassenger = async (identifier: string, password: string) => {
    try {
      const loggedUser = await authService.loginWithPassword(identifier, password);
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
      const updatedUser = await walletService.processTransaction(user.id, amount, type, description, reference);
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

  /* Visual Feedback State */
  const [timeoutProgress, setTimeoutProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / AUTH_CONFIG.TIMEOUT_MS) * 100, 98);
        setTimeoutProgress(progress);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-mipana-darkBlue gap-6">
        {/* Logo or Spinner */}
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
          <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-white opacity-10"></div>
        </div>

        {/* Progress Bar Container */}
        <div className="w-64 flex flex-col gap-2">
          <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 ease-out"
              style={{ width: `${timeoutProgress}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-400 font-medium">
            <span className="animate-pulse">Verificando credenciales...</span>
            <span>{Math.round(timeoutProgress)}%</span>
          </div>
        </div>

        {/* Slow connection hint if taking too long */}
        {timeoutProgress > 70 && (
          <p className="text-xs text-yellow-500/80 animate-fade-in mt-2 px-6 text-center max-w-xs">
            Detectando conexión lenta, ajustando parámetros...
          </p>
        )}
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
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
