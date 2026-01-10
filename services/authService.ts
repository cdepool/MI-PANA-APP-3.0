
import { User, UserRole, RegistrationData, TransactionType, Transaction } from '../types';
import { getTariffs } from './mockService';
import { supabase } from './supabaseClient';
import logger from '../utils/logger';

// LocalStorage Keys (Keep for fallback or session cache if needed, but primary is now Supabase)
const SESSION_KEY = 'mipana_session';

// Extended User type for DB storage (matching Supabase 'profiles' table structure ideally)
export interface StoredUser extends User {
  pin?: string; // Optional now as auth is handled by Supabase
  created_at?: string;
  verified?: boolean;
}

// Helper: Sleep to simulate network latency (can be removed or reduced)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- PUBLIC SERVICE ---

export const authService = {

  // 1. Check if email exists
  checkEmail: async (email: string): Promise<{ exists: boolean; user?: StoredUser }> => {
    // Check in Supabase profiles or auth
    // Note: Checking auth existence directly via API is restricted for security.
    // We usually check the 'profiles' table.
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (data) {
      return { exists: true, user: data as StoredUser };
    }
    return { exists: false };
  },

  // 2. Send OTP (Simulating Email) -> Now can use Supabase Auth OTP
  sendOtp: async (email: string): Promise<{ success: boolean, message: string }> => {
    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      logger.error('Error sending OTP:', error);
      return { success: false, message: error.message };
    }

    return { success: true, message: `Código enviado a ${email}` };
  },

  // 3. Verify OTP
  verifyOtp: async (email: string, code: string): Promise<{ valid: boolean; message?: string; session?: any }> => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });

    if (error) {
      return { valid: false, message: error.message };
    }

    return { valid: true, session: data.session };
  },

  // 4. Register User (Commit to DB)
  // NOTE: This function is strictly for registering PASSENGERS from the public interface.
  // Drivers and Admins should be created via internal admin tools or separate flows.
  registerUser: async (data: RegistrationData): Promise<User> => {
    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password, // Standard password registration
      options: {
        data: {
          full_name: `${data.firstName} ${data.lastName}`, // Changed from first_name/last_name to match DB Trigger
          phone: data.phone,
          role: UserRole.PASSENGER,
          documentId: `${data.idType}-${data.idNumber}`, // Pass ID manually to metadata
        }
      }
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('No se pudo crear el usuario');

    // 2. Construct User object (Profile creation is handled by DB Trigger handle_new_user)
    const newUser: StoredUser = {
      id: authData.user.id,
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      role: UserRole.PASSENGER,
      avatarUrl: `https://ui-avatars.com/api/?name=${data.firstName}+${data.lastName}&background=048ABF&color=fff&bold=true`,
      documentId: `${data.idType}-${data.idNumber}`,
      created_at: new Date().toISOString(),
      verified: false,
      savedPlaces: [],
      favoriteDriverIds: [],
      wallet: {
        balance: 0.00,
        transactions: []
      }
    };

    // The trigger automatically creates the profile in 'profiles' table.
    // We just return the object to the UI.

    return newUser;
  },

  // 4b. Implicit Registration/Login (Phone Only)
  registerOrLoginImplicit: async (name: string, phone: string): Promise<User> => {
    // A) Generate Ghost Credentials
    const cleanPhone = phone.replace(/\D/g, ''); // Ensure only numbers
    const fakeEmail = `${cleanPhone}@mipana.app`;
    const fakePassword = cleanPhone; // Using phone number as password

    // B) Try Login First
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password: fakePassword
    });

    if (!loginError && loginData.user) {
      // Login Successful: Fetch full profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', loginData.user.id)
        .single();

      // If name changed, silently update it (Handling "New Name" scenario for existing phone)
      if (profile && profile.full_name !== name) {
        await supabase.from('profiles').update({ full_name: name }).eq('id', profile.id);
        profile.full_name = name;
      }

      return profile as User;
    }

    // If Login Fails (likely user doesn't exist), Create User (Sign Up)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: fakeEmail,
      password: fakePassword,
      options: {
        data: {
          full_name: name,
          phone: phone,
          role: UserRole.PASSENGER,
          is_implicit: true
        }
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        throw new Error('Este número ya está registrado pero no pudimos validar tu acceso. Contacta soporte.');
      }
      throw new Error(signUpError.message);
    }

    if (!signUpData.user) throw new Error('No se pudo crear el usuario implícito');

    // Return constructed user object (Profile trigger handles DB insert)
    return {
      id: signUpData.user.id,
      name: name,
      email: fakeEmail,
      phone: phone,
      role: UserRole.PASSENGER,
      created_at: new Date().toISOString(),
      verified: true // Considered verified by virtue of possession
    } as User;
  },

  // 5. Login (Passenger) - Supports Phone OR Email
  loginPassenger: async (identifier: string, password: string): Promise<User> => {
    // DEMO USER BYPASS - Allow testing without Supabase
    if (identifier === 'demo.pasajero@mipana.app' && password === '123456') {
      const demoUser: User = {
        id: 'demo-passenger-001',
        name: 'Demo Pasajero',
        email: 'demo.pasajero@mipana.app',
        phone: '+58 412-0000001',
        role: UserRole.PASSENGER,
        avatarUrl: 'https://ui-avatars.com/api/?name=Demo+Pasajero&background=048ABF&color=fff&bold=true',
        documentId: 'V-12345678',
        savedPlaces: [
          {
            id: '1',
            name: 'Casa',
            address: 'Urb. El Pilar, Araure',
            type: 'HOME',
            icon: '🏠'
          },
          {
            id: '2',
            name: 'Trabajo',
            address: 'Centro Comercial Llano Mall',
            type: 'WORK',
            icon: '💼'
          }
        ],
        favoriteDriverIds: ['driver-001', 'driver-002'],
        wallet: {
          balance: 50.00,
          transactions: [
            {
              id: 'tx-001',
              amount: 50.00,
              currency: 'USD',
              exchangeRate: 45.50,
              date: Date.now() - 86400000,
              type: 'DEPOSIT',
              description: 'Recarga inicial demo',
              status: 'COMPLETED'
            }
          ]
        }
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(demoUser));
      return demoUser;
    }

    // Regular Supabase authentication
    // Assuming 'pin' is used as password for Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password: password,
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Error de autenticación');

    // Fetch full profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Perfil no encontrado');
    }

    const user = profile as User;

    // Create Session
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  // 6. Session Management
  getSession: (): User | null => {
    // Check local storage first for speed
    try {
      const json = localStorage.getItem(SESSION_KEY);
      if (json) return JSON.parse(json);
    } catch (e) {
      console.error('Error parsing session from local storage', e);
      // Optional: Clear invalid session
      localStorage.removeItem(SESSION_KEY);
    }

    // Ideally we should check supabase.auth.getSession() and refresh profile
    return null;
  },

  setSession: (user: User) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(SESSION_KEY);
  },

  // 7. Google Auth
  loginWithGoogle: async (): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) throw error;

    // Note: This will redirect the browser.
    return {} as User;
  },

  // 8. Update User Profile
  updateUser: async (userId: string, data: Partial<User>): Promise<User> => {
    const { data: updated, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Update session if it's the current user
    const session = authService.getSession();
    if (session && session.id === userId) {
      authService.setSession(updated as User);
    }

    return updated as User;
  },

  // 9. Wallet Transactions
  // ✅ SECURITY FIX: Now uses Edge Function for server-side processing
  processTransaction: async (userId: string, amount: number, type: TransactionType, description: string, reference?: string): Promise<User> => {
    try {
      // Invoke Edge Function for secure server-side transaction processing
      const { data, error } = await supabase.functions.invoke('process-transaction', {
        body: {
          userId,
          amount,
          type,
          description,
          reference
        }
      });

      if (error) {
        throw new Error(error.message || 'Transaction failed');
      }

      if (!data?.success || !data?.profile) {
        throw new Error('Transaction processing failed');
      }

      const updatedUser = data.profile as User;

      // Update local session
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

  // 10. Toggle Favorite Driver
  toggleFavoriteDriver: async (userId: string, driverId: string): Promise<User> => {
    const { data: user, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

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
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    // Update Session
    const session = authService.getSession();
    if (session && session.id === userId) {
      authService.setSession(updated as User);
    }
    return updated as User;
  },

  // 11. Admin: Create User (Simulation)
  // NOTE: In production, this MUST be an Edge Function using supabase-admin (service_role key).
  // Client-side creation of other users is not possible without logging out the current admin.
  adminCreateUser: async (data: any): Promise<{ success: boolean, message: string }> => {
    logger.log('Admin creating user:', data);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Validate basic fields
    if (!data.email || !data.password || !data.name || !data.role) {
      throw new Error('Todos los campos son obligatorios');
    }

    // In a real app with Edge Functions:
    // await supabase.functions.invoke('admin-create-user', { body: data })

    return { success: true, message: `Usuario ${data.name} (${data.role}) creado exitosamente.` };
  }
};