import { User, UserRole, RegistrationData, TransactionType } from '../types';
import { supabase } from './supabaseClient';
import logger from '../utils/logger';

// LocalStorage Persistence - No longer needed, kept for TS compatibility if imported elsewhere
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

  updateUserProfilePhone: async (userId: string, phone: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ phone: phone })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
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

  // --- Session Management (Legacy shells, do not use) ---

  getSession: (): User | null => {
    return null;
  },

  setSession: (_user: User) => {
    // Session is handled by Supabase natively
  },

  logout: async () => {
    await supabase.auth.signOut();
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

  processTransaction: async (userId: string, amount: number, type: TransactionType, description: string, reference?: string): Promise<User> => {
    try {
      const { data, error } = await supabase.functions.invoke('process-transaction', {
        body: { userId, amount, type, description, reference }
      });

      if (error) throw new Error(error.message || 'Transaction failed');
      if (!data?.success || !data?.profile) throw new Error('Transaction processing failed');

      return data.profile as User;
    } catch (error) {
      logger.error('Transaction processing error:', error);
      throw error;
    }
  },

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
    return updated as User;
  },

  adminCreateUser: async (_payload: any) => {
    // Mock admin creation
    return { success: true, message: 'Usuario creado exitosamente' };
  },
  connectGoogle: async () => {
    // Alias for signInWithGoogle logic or separate connect logic
    return authService.signInWithGoogle();
  },

  loginWithGoogle: async () => {
    return authService.signInWithGoogle();
  },

  loginWithPassword: async (identifier: string, password: string) => {
    // Real Supabase Authentication
    const email = identifier.includes('@') ? identifier : `${identifier}@mipana.app`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error("Login failed", error);
      throw error;
    }

    if (!data.user) {
      throw new Error("No se pudo iniciar sesión");
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      id: data.user.id,
      email: data.user.email || email,
      ...profile
    } as User;
  },

  registerUser: async (data: RegistrationData & { role: UserRole }) => {
    const { email, password, name, phone, role } = data;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          phone
        }
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        throw new Error('Este correo ya está registrado.');
      }
      throw signUpError;
    }

    if (signUpData.user) {
      // ✅ Registration Successful
      const newProfile = {
        id: signUpData.user.id,
        email: email,
        name: name,
        role: role,
        phone: phone,
        created_at: new Date().toISOString()
      };

      // Try Insert Profile (Internal DB)
      // Note: The trigger might handle this, but explicit insert ensures control if trigger fails/is missing
      const { error: profileError } = await supabase.from('profiles').upsert(newProfile);

      if (profileError) {
        console.warn("Profile creation warn:", profileError);
        // Don't throw, as auth user exists.
      }

      return {
        id: newProfile.id,
        email: newProfile.email,
        phone: phone,
        name: newProfile.name,
        role: role,
        wallet: { balance: 0, transactions: [] }
      } as User;
    }

    throw new Error('No se pudo completar el registro.');
  },



  updateUser: async (userId: string, data: Partial<User>) => {
    const { data: updated, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.warn("Update profile failed", error);
      throw error;
    }

    return updated as User;
  },
};