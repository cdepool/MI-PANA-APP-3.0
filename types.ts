

export enum UserRole {
  ADMIN = 'ADMIN',
  PASSENGER = 'PASSENGER',
  DRIVER = 'DRIVER'
}

export type VehicleType = 'MOTO' | 'CAR' | 'FREIGHT';
export type ServiceId = 'mototaxi' | 'el_pana' | 'el_amigo' | 'full_pana';

export type AppView = 'HOME' | 'PROFILE' | 'HISTORY' | 'SETTINGS' | 'SCHEDULE' | 'REGISTER' | 'WALLET';

export interface SavedPlace {
  id: string;
  name: string; // e.g., "Casa", "Trabajo", "Donde la abuela"
  address: string;
  type: 'HOME' | 'WORK' | 'FAVORITE' | 'RECENT';
  icon?: string; // emoji or lucide icon name
}

export interface LocationPoint {
  address: string;
  lat?: number;
  lng?: number;
}

export interface DriverStats {
  level: string;
  points: number;
  nextLevelPoints: number;
  progressPercent: number;
  completedRides: number;
  rating: number;
}

export interface MatchedDriver {
  id: string;
  name: string;
  vehicleModel: string;
  vehicleColor: string;
  plate: string;
  rating: number;
  phone: string;
  avatarUrl: string;
  timeAway: string;
}

export interface GoogleProfile {
  email: string;
  name: string;
  picture: string;
  connectedAt: Date;
  scopes: ('calendar' | 'tasks' | 'gmail')[];
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'REFUND';

export interface Transaction {
  id: string;
  amount: number; // Always in USD for internal logic
  currency: 'USD' | 'VES';
  exchangeRate: number;
  date: number;
  type: TransactionType;
  description: string;
  reference?: string; // Pago Movil ref
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

export interface Wallet {
  balance: number; // USD
  transactions: Transaction[];
}

export interface VehicleInfo {
  model: string;
  color: string;
  plate: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  isOnline?: boolean; // For drivers
  driverStats?: DriverStats;
  savedPlaces?: SavedPlace[];
  googleProfile?: GoogleProfile;
  phone?: string; // Added phone for communication
  documentId?: string; // Cédula
  wallet?: Wallet; // Digital Wallet
  vehicle?: VehicleInfo; // Driver Vehicle Info
  favoriteDriverIds?: string[]; // List of IDs of favorite drivers
}

export interface ServiceConfig {
  id: ServiceId;
  nombre: string;
  tarifa_base_neta_usd: number;
  recargo_km_adicional_neta_usd: number;
  pfs_base_usd: number;
  pfs_km_adicional_usd: number;
  distancia_base_km: number;
  icono: string;
  vehicleType: VehicleType;
}

export interface LiquidationResult {
  viaje_id?: string;
  input: {
    servicio_nombre: string;
    distancia_km: number;
    pfs_usd: number;
    pfs_ves: number;
  };
  conductor: {
    pago_bruto_usd: number;
    islr_retenido_usd: number;
    deposito_neto_usd: number;
    deposito_neto_ves: number;
  };
  plataforma: {
    comision_bruta_usd: number;
    ingreso_neto_app_usd: number;
    ingreso_neto_app_ves: number;
    iva_debito_fiscal_usd: number;
    iva_debito_fiscal_ves: number;
  };
  seniat: {
    total_retenciones_usd: number;
    total_retenciones_ves: number;
  };
  meta: {
    tasa_bcv: number;
    valid: boolean;
    timestamp: Date;
  };
}

export interface RideBeneficiary {
  name: string;
  phone?: string;
  relationship?: string; // 'FAMILY', 'FRIEND', 'OTHER'
}

export interface ChatMessage {
  id: string;
  senderRole: UserRole; // Who sent it
  senderName: string;
  text: string;
  timestamp: Date;
  read: boolean;
}

export interface Ride {
  id: string;
  passengerId: string;
  driverId?: string;
  origin: string;
  destination: string;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  serviceId: ServiceId;
  vehicleType: VehicleType;
  priceUsd: number;
  priceVes: number;
  distanceKm: number;
  createdAt: Date;
  liquidation?: LiquidationResult;
  
  // GPS & Tracking
  currentProgress?: number; // 0 to 100
  etaMinutes?: number;
  heading?: number; // 0-360 degrees

  // Third party booking
  beneficiary?: RideBeneficiary; 
  
  // Communication / Audit
  chatLogs?: ChatMessage[];
}

export interface RecurringRide {
  id: string;
  name: string; // e.g. "Ir al Trabajo"
  origin: string;
  destination: string;
  serviceId: ServiceId;
  time: string; // "08:00"
  days: number[]; // 0=Sun, 1=Mon, etc.
  active: boolean;
  syncCalendar: boolean;
  syncTasks: boolean;
  forWhom: 'ME' | 'OTHER';
  beneficiaryName?: string;
}

export interface Tariff {
  currentBcvRate: number;
  lastUpdate: Date;
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export interface AuthContextType {
  user: User | null;
  login: (role: UserRole, userData?: Partial<User>) => void;
  loginPassenger: (identifier: string, pin: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  walletTransaction: (amount: number, type: TransactionType, description: string, reference?: string) => Promise<void>;
  toggleFavoriteDriver: (driverId: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  addSavedPlace: (place: SavedPlace) => void;
  removeSavedPlace: (id: string) => void;
  connectGoogle: () => Promise<void>;
  disconnectGoogle: () => void;
}

// Registration specific types
export interface RegistrationData {
  email: string; // Changed from phone to email as primary
  phone: string;
  firstName: string;
  lastName: string;
  idType: 'V' | 'E' | 'J';
  idNumber: string;
  age: number;
  pin: string;
}