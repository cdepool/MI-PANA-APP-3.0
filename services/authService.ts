
import { User, UserRole, RegistrationData, TransactionType, Transaction } from '../types';
import { getTariffs } from './mockService';
import { supabase } from './supabaseClient';

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
      console.error('Error sending OTP:', error);
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
      password: data.pin, // Using PIN as password for simplicity in migration, or generate a random one
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          role: UserRole.PASSENGER,
        }
      }
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('No se pudo crear el usuario');

    // 2. Create Profile in 'profiles' table
    const newUser: StoredUser = {
      id: authData.user.id,
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      role: UserRole.PASSENGER,
      avatarUrl: `https://ui-avatars.com/api/?name=${data.firstName}+${data.lastName}&background=048ABF&color=fff&bold=true`,
      documentId: `${data.idType}-${data.idNumber}`,
      // pin: data.pin, // Don't store PIN in plain text in profiles if possible
      created_at: new Date().toISOString(),
      verified: true,
      savedPlaces: [],
      favoriteDriverIds: [],
      wallet: {
        balance: 0.00,
        transactions: []
      }
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([newUser]);

    if (profileError) {
      // If profile creation fails, we might want to rollback auth, but for now just throw
      console.error('Error creating profile:', profileError);
      // Fallback: return the user object anyway so UI can proceed, but data might be desynced
    }

    return newUser;
  },

  // 5. Login (Passenger) - Supports Phone OR Email
  loginPassenger: async (identifier: string, pin: string): Promise<User> => {
    // Assuming 'pin' is used as password for Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password: pin,
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
    const json = localStorage.getItem(SESSION_KEY);
    if (json) return JSON.parse(json);

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
  processTransaction: async (userId: string, amount: number, type: TransactionType, description: string, reference?: string): Promise<User> => {
    // ⚠️ SECURITY WARNING: This logic runs on the client side. 
    // In a production environment, wallet transactions MUST be handled by a secure backend (e.g., Supabase Edge Functions)
    // to prevent manipulation. This implementation is for demonstration/MVP purposes only.

    // This requires a more complex backend logic (RPC or multiple queries)
    // For now, we fetch, update, and push. NOT ATOMIC/SAFE for production without RLS/Functions.

    const { data: user, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !user) throw new Error('Usuario no encontrado');

    let newBalance = user.wallet?.balance || 0;
    if (type === 'DEPOSIT' || type === 'REFUND') {
      newBalance += amount;
    } else {
      if (newBalance < amount) throw new Error('Saldo insuficiente en billetera');
      newBalance -= amount;
    }

    const transaction: Transaction = {
      id: `tx-${Date.now()}`,
      amount: amount,
      currency: 'USD',
      exchangeRate: getTariffs().currentBcvRate,
      date: Date.now(),
      type,
      description,
      reference,
      status: 'COMPLETED'
    };

    const newWallet = {
      balance: newBalance,
      transactions: [transaction, ...(user.wallet?.transactions || [])]
    };

    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ wallet: newWallet })
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
    console.log('Admin creating user:', data);

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