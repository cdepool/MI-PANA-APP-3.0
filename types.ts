

export enum UserRole {
  ADMIN = 'ADMIN',
  PASSENGER = 'PASSENGER',
  DRIVER = 'DRIVER'
}

export type VehicleType = 'MOTO' | 'CAR' | 'FREIGHT';
export type ServiceId = 'mototaxi' | 'el_pana' | 'el_amigo' | 'full_pana';

export type AppView = 'HOME' | 'PROFILE' | 'HISTORY' | 'SETTINGS' | 'SCHEDULE' | 'REGISTER' | 'WALLET' | 'APPROVALS';

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

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SUPPORT = 'SUPPORT', // General support
  CONFLICT_RESOLUTION = 'CONFLICT_RESOLUTION', // Disputes, mediation
  SECURITY = 'SECURITY', // Interdiction, bans, fraud
  FINANCE = 'FINANCE', // Payments, refunds
  OPERATIONS = 'OPERATIONS' // Fleet, logistics
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  adminRole?: AdminRole; // Sub-role for admins
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
  googleAccessToken?: string; // Access token for Google APIs
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
  passengerId: string; // passenger_id in DB
  driverId?: string;   // driver_id in DB
  status: 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  origin: string;
  destination: string;
  originCoords?: { lat: number, lng: number };      // "originCoords"
  destinationCoords?: { lat: number, lng: number }; // "destinationCoords"
  priceUsd: number;    // "priceUsd"
  priceVes: number;    // "priceVes"
  distanceKm: number;  // "distanceKm"
  serviceId: ServiceId;       // "serviceId" (Added via migration)
  vehicleType: VehicleType;   // "vehicleType" (Added via migration)
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
  password: string;
}

// --- DRIVER PROFILE EXTENSIONS ---

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export interface DriverDocument {
  id: string;
  type: 'CEDULA' | 'LICENCIA' | 'RIF' | 'TITULO_PROPIEDAD' | 'CERTIFICADO_MEDICO' | 'POLIZA_RCV' | 'COMPROBANTE_BANCARIO';
  url: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
  expiresAt?: Date;
  status: VerificationStatus;
  rejectionReason?: string;
  metadata?: {
    fileSize: number;
    mimeType: string;
    ocrData?: Record<string, unknown>;
  };
}

export interface FiscalData {
  rif: string; // J-12345678-9
  address: string;
  fiscalStatus: 'CONTRIBUYENTE_ORDINARIO' | 'PERSONA_NATURAL' | 'NO_SUJETO';
  rifDocumentUrl?: string;
}

export interface BankingData {
  bankName: 'BANCAMIGA'; // Fixed for this project
  accountNumber: string; // Encrypted/Masked in real app
  accountType: 'CORRIENTE' | 'AHORRO';
  pagoMovilPhone: string;
  pagoMovilId: string; // Cédula associated
  isVerified: boolean;
  lastVerificationDate?: Date;
}

export interface VehicleExtendedInfo extends VehicleInfo {
  brand: string;
  year: number;
  vin?: string;
  engineSerial?: string;
  serviceType: ServiceId;
  documents: DriverDocument[];
}

export interface AuditChange {
  id: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminComment?: string;
}

export interface DriverProfile {
  userId: string;
  personalData: {
    fullName: string;
    birthDate: Date;
    nationality: 'VENEZOLANO' | 'EXTRANJERO';
    address: string;
    phone: string;
  };
  fiscalData?: FiscalData;
  bankingData?: BankingData;
  vehicle: VehicleExtendedInfo;
  documents: DriverDocument[];
  auditLog: AuditChange[];
  pendingChanges: AuditChange[];
}

// --- PASSENGER PROFILE EXTENSIONS ---

export interface PersonalData {
  fullName: string;
  birthDate?: Date;
  gender?: 'MASCULINO' | 'FEMENINO' | 'OTRO' | 'PREFIERO_NO_DECIRLO';
  nationality?: 'VENEZOLANO' | 'EXTRANJERO';
  cedula: string; // V-12345678
  address?: string;
}

export interface PhotoProfile {
  url?: string;
  thumbnailUrl?: string;
  verified: boolean;
  uploadedAt?: Date;
  fileSize?: number;
}

export interface SecuritySettings {
  pin: string; // Hashed PIN
  securityImageId?: string;
  twoFactorEnabled: boolean;
  lastPasswordChange?: Date;
}

export interface TravelPreferences {
  preferredVehicleType?: VehicleType;
  preferredTime?: string; // "morning", "afternoon", "evening", "night"
  requireHighRating: boolean;
  minDriverRating: number; // 0.0 - 5.0
  preferFemaleDriver: boolean;
  preferConversationalDriver: boolean;
  musicPreference?: 'NINGUNA' | 'SUAVE' | 'VARIADA' | 'REGGAETON' | 'SALSA' | 'POP' | 'ROCK';
  temperaturePreference?: number; // 16-28 celsius
}

export interface ContactVerification {
  phoneVerified: boolean;
  emailVerified: boolean;
  phoneVerifiedAt?: Date;
  emailVerifiedAt?: Date;
}

export interface PassengerProfile {
  userId: string;
  personalData: PersonalData;
  photoProfile: PhotoProfile;
  security: SecuritySettings;
  preferences?: TravelPreferences;
  contactVerification: ContactVerification;
  profileCompleteness: number; // 0-100%
  createdAt: Date;
  updatedAt: Date;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
}

export interface AccessLog {
  id: string;
  userId: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  browser?: string;
  device?: string;
  os?: string;
  location?: string;
  accessType: 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'PROFILE_UPDATE';
  success: boolean;
  failureReason?: string;
}

export interface DeviceInfo {
  id: string;
  userId: string;
  deviceId: string; // Unique identifier
  deviceName: string;
  deviceType: 'MOBILE' | 'TABLET' | 'DESKTOP';
  browser: string;
  os: string;
  ipAddress: string;
  location?: string;
  lastAccessAt: Date;
  isActive: boolean;
  sessionToken?: string;
}

export interface ProfileChange {
  id: string;
  userId: string;
  changeType: 'PHOTO' | 'PERSONAL_DATA' | 'CONTACT' | 'SECURITY' | 'PREFERENCES';
  fieldModified: string;
  oldValue: unknown;
  newValue: unknown;
  performedBy: 'USER' | 'ADMIN' | 'SYSTEM';
  timestamp: Date;
  requiresVerification: boolean;
  verified: boolean;
}