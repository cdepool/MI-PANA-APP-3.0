

import { User, UserRole, RegistrationData, TransactionType, Transaction } from '../types';
import { getTariffs } from './mockService';

// LocalStorage Keys to simulate Database
const DB_USERS_KEY = 'mipana_db_users';
const DB_OTPS_KEY = 'mipana_db_otps';
const SESSION_KEY = 'mipana_session';

// Extended User type for DB storage
export interface StoredUser extends User {
  pin: string;
  createdAt: number;
  verified: boolean;
}

// Helper: Sleep to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- DATABASE ACCESS HELPERS ---

const getDbUsers = (): StoredUser[] => {
  try {
    const stored = localStorage.getItem(DB_USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

const saveDbUsers = (users: StoredUser[]) => {
  localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
};

const getDbOtps = (): Record<string, { code: string, expires: number }> => {
  try {
    const stored = localStorage.getItem(DB_OTPS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    return {};
  }
};

const saveDbOtps = (otps: Record<string, { code: string, expires: number }>) => {
  localStorage.setItem(DB_OTPS_KEY, JSON.stringify(otps));
};

// --- PUBLIC SERVICE ---

export const authService = {
  
  // 1. Check if phone exists
  checkPhone: async (phone: string): Promise<{ exists: boolean; user?: StoredUser }> => {
    await delay(600);
    const users = getDbUsers();
    const user = users.find(u => u.phone === phone);
    return { exists: !!user, user };
  },

  // 2. Send OTP (Simulating SMS or WhatsApp Gateway)
  sendOtp: async (phone: string, channel: 'SMS' | 'WHATSAPP'): Promise<{ success: boolean, message: string }> => {
    await delay(1200); // Network delay
    
    // Generate 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store with 5 min expiration
    const otps = getDbOtps();
    otps[phone] = { 
      code, 
      expires: Date.now() + 5 * 60 * 1000 
    };
    saveDbOtps(otps);

    // --- SIMULATION OUTPUT ---
    const provider = channel === 'SMS' ? 'Movistar/Digitel Gateway' : 'Meta WhatsApp API';
    console.log(`%c[${provider}] 📨 Enviando a ${phone}: ${code}`, 'color: #048ABF; font-weight: bold; font-size: 12px;');
    
    // Browser Alert to show the code to the user
    alert(`[SIMULACIÓN ${channel}]\n\nTu código de verificación Mi Pana es: ${code}\n\n(Expira en 5 minutos)`);

    return { success: true, message: `Código enviado por ${channel}` };
  },

  // 3. Verify OTP
  verifyOtp: async (phone: string, code: string): Promise<{ valid: boolean; message?: string }> => {
    await delay(800);
    
    // Backdoor for testing ease
    if (code === '000000') return { valid: true };

    const otps = getDbOtps();
    const record = otps[phone];

    if (!record) {
      return { valid: false, message: 'No se ha solicitado un código.' };
    }

    if (Date.now() > record.expires) {
      return { valid: false, message: 'El código ha expirado. Solicita uno nuevo.' };
    }

    if (record.code !== code) {
      return { valid: false, message: 'Código incorrecto.' };
    }

    // Consume OTP
    delete otps[phone];
    saveDbOtps(otps);

    return { valid: true };
  },

  // 4. Register User (Commit to DB)
  registerUser: async (data: RegistrationData): Promise<User> => {
    await delay(1500);
    const users = getDbUsers();
    
    // Double check existence
    if (users.find(u => u.phone === data.phone)) {
      throw new Error('El usuario ya existe.');
    }

    const newUser: StoredUser = {
      id: `u-${Date.now()}`,
      name: `${data.firstName} ${data.lastName}`,
      email: `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@mipana.app`, // Auto-generated email if not provided
      phone: data.phone,
      role: UserRole.PASSENGER,
      avatarUrl: `https://ui-avatars.com/api/?name=${data.firstName}+${data.lastName}&background=048ABF&color=fff&bold=true`,
      documentId: `${data.idType}-${data.idNumber}`,
      pin: data.pin, // Storing plain PIN for this local demo (In real app, use hash)
      createdAt: Date.now(),
      verified: true,
      savedPlaces: [],
      favoriteDriverIds: [],
      wallet: {
        balance: 0.00,
        transactions: []
      }
    };

    users.push(newUser);
    saveDbUsers(users);
    
    return newUser;
  },

  // 5. Login (Passenger)
  loginPassenger: async (phone: string, pin: string): Promise<User> => {
    await delay(1000);
    const users = getDbUsers();
    const user = users.find(u => u.phone === phone);

    if (!user) throw new Error('Número no registrado.');
    if (user.pin !== pin) throw new Error('PIN de seguridad incorrecto.');

    // Create Session
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  // 6. Session Management
  getSession: (): User | null => {
    const json = localStorage.getItem(SESSION_KEY);
    return json ? JSON.parse(json) : null;
  },

  setSession: (user: User) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  // 7. Google Auth Simulation
  simulateGoogleLogin: async (): Promise<User> => {
    await delay(1500);
    // Simulate a returned user from Google
    const mockGoogleUser: User = {
      id: `g-${Date.now()}`,
      name: 'Usuario Google',
      email: 'usuario.google@gmail.com',
      role: UserRole.PASSENGER,
      avatarUrl: 'https://ui-avatars.com/api/?name=Usuario+Google&background=DB4437&color=fff',
      phone: '', // Phone still needs to be collected/verified in a real flow
      googleProfile: {
        email: 'usuario.google@gmail.com',
        name: 'Usuario Google',
        picture: 'https://ui-avatars.com/api/?name=Usuario+Google&background=DB4437&color=fff',
        connectedAt: new Date(),
        scopes: ['calendar', 'gmail']
      }
    };
    // For this demo, we just return it to pre-fill forms or login directly
    return mockGoogleUser;
  },

  // 8. Update User Profile
  updateUser: async (userId: string, data: Partial<User>): Promise<User> => {
    await delay(800);
    const users = getDbUsers();
    const index = users.findIndex(u => u.id === userId);
    
    if (index === -1) throw new Error('Usuario no encontrado');

    const updatedUser = { ...users[index], ...data };
    users[index] = updatedUser;
    
    saveDbUsers(users);
    
    // Update session if it's the current user
    const session = authService.getSession();
    if (session && session.id === userId) {
      authService.setSession(updatedUser);
    }

    return updatedUser;
  },

  // 9. Wallet Transactions
  processTransaction: async (userId: string, amount: number, type: TransactionType, description: string, reference?: string): Promise<User> => {
    await delay(1500); // Processing payment delay
    
    const users = getDbUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('Usuario no encontrado');

    const user = users[index];
    if (!user.wallet) {
      user.wallet = { balance: 0, transactions: [] };
    }

    // Balance logic
    let newBalance = user.wallet.balance;
    if (type === 'DEPOSIT' || type === 'REFUND') {
      newBalance += amount;
    } else {
      if (newBalance < amount) throw new Error('Saldo insuficiente en billetera');
      newBalance -= amount;
    }

    const transaction: Transaction = {
      id: `tx-${Date.now()}`,
      amount: amount,
      currency: 'USD', // Base currency
      exchangeRate: getTariffs().currentBcvRate, // Use dynamic rate from mock service
      date: Date.now(),
      type,
      description,
      reference,
      status: 'COMPLETED'
    };

    user.wallet.balance = newBalance;
    user.wallet.transactions.unshift(transaction); // Add to top

    users[index] = user;
    saveDbUsers(users);

    // Update Session
    const session = authService.getSession();
    if (session && session.id === userId) {
      authService.setSession(user);
    }

    return user;
  },

  // 10. Toggle Favorite Driver
  toggleFavoriteDriver: async (userId: string, driverId: string): Promise<User> => {
    const users = getDbUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('Usuario no encontrado');

    const user = users[index];
    const favorites = user.favoriteDriverIds || [];
    
    let newFavorites;
    if (favorites.includes(driverId)) {
        newFavorites = favorites.filter(id => id !== driverId);
    } else {
        newFavorites = [...favorites, driverId];
    }

    const updatedUser = { ...user, favoriteDriverIds: newFavorites };
    users[index] = updatedUser;
    saveDbUsers(users);

    // Update Session
    const session = authService.getSession();
    if (session && session.id === userId) {
      authService.setSession(updatedUser);
    }
    return updatedUser;
  }
};