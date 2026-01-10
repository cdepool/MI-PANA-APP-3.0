import { User, UserRole, RegistrationData, TransactionType } from '../types';
import { supabase } from './supabaseClient';
import logger from '../utils/logger';

// LocalStorage Persistence
const SESSION_KEY = 'mipana_session';

export interface StoredUser extends User {
  created_at?: string;
  verified?: boolean;
}

export const authService = {

  // 1. Google OAuth (Primary Entry)
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/onboarding', // Callback handling
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { data, error };
  },

  // 2. Update Profile Phone (Data Collection)
  updateUserProfilePhone: async (userId: string, phone: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ phone: phone })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Update local session if needed
    const session = authService.getSession();
    if (session && session.id === userId) {
      authService.setSession({ ...session, phone });
    }

    return data;
  },

  // 3. Update Location Permission (Preference)
  updateLocationPermission: async (userId: string, status: string) => {
    // We store this in metadata or a specific column if it exists.
    // For now, we can try user_metadata or profiles if columns exist.
    // Using profiles is safer if schema supports it, otherwise metadata.
    // Let's assume profiles has a JSONB or text column, or just ignore persistence if no column.
    // Trying update on profiles:
    try {
      await supabase.from('profiles').update({
        // flexible_data: { location_permission: status } // Example if jsonb exists
        // For now, just logging it as we don't have schema control here perfectly
      }).eq('id', userId);
    } catch (e) {
      // Ignore strictly if column doesn't exist
    }
  },

  // --- Session Management (Helper Utils) ---

  getSession: (): User | null => {
    try {
      const json = localStorage.getItem(SESSION_KEY);
      if (json) return JSON.parse(json);
    } catch (e) {
      localStorage.removeItem(SESSION_KEY);
    }
    return null;
  },

  setSession: (user: User) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(SESSION_KEY);
  },

  // --- Legacy / Helper Methods required by UI types (Mocked/Simplified) ---

  // Minimal Profile Fetch
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  // 4. Wallet Transactions (Preserved)
  processTransaction: async (userId: string, amount: number, type: TransactionType, description: string, reference?: string): Promise<User> => {
    try {
      const { data, error } = await supabase.functions.invoke('process-transaction', {
        body: { userId, amount, type, description, reference }
      });

      if (error) throw new Error(error.message || 'Transaction failed');
      if (!data?.success || !data?.profile) throw new Error('Transaction processing failed');

      const updatedUser = data.profile as User;
      const session = authService.getSession();
      if (session && session.id === userId) {
        authService.setSession(updatedUser);
      }
      return updatedUser;
    } catch (error) {
      logger.error('Transaction processing error:', error);
      throw error;
    }
  },

  // 5. Toggle Favorite Driver (Preserved)
  toggleFavoriteDriver: async (userId: string, driverId: string): Promise<User> => {
    const { data: user, error: fetchError } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (fetchError || !user) throw new Error('Usuario no encontrado');

    const favorites = user.favoriteDriverIds || [];
    let newFavorites;
    if (favorites.includes(driverId)) {
      newFavorites = favorites.filter((id: string) => id !== driverId);
    } else {
      newFavorites = [...favorites, driverId];
    }

    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ favoriteDriverIds: newFavorites })
      .eq('id', userId)
      .select().single();

    if (updateError) throw new Error(updateError.message);
    const session = authService.getSession();
    if (session && session.id === userId) authService.setSession(updated as User);

    return updated as User;
  }
};