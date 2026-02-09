import { supabase } from './supabaseClient';
import logger from '../utils/logger';

// Type definition for JSON compatible values
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface AdminStats {
  totalUsers: number;
  activeDrivers: number;
  totalRevenueUsd: number;
  pendingApprovals: number;
  // New operational stats
  activeTrips: number;
  onlineDrivers: number;
  pendingRecharges: number;
  todayTrips: number;
}

export interface RevenueData {
  name: string;
  pago: number;
  neto: number;
  seniat: number;
}

export interface LiveTrip {
  id: string;
  status: string;
  passenger_name: string;
  driver_name: string | null;
  origin: string;
  destination: string;
  price_usd: number;
  created_at: string;
  matching_attempt: number;
}

export interface TransactionLogEntry {
  id: string;
  type: 'trip' | 'recharge' | 'withdrawal' | 'refund';
  amount_usd: number;
  amount_ves: number;
  user_name: string;
  status: string;
  created_at: string;
  reference: string;
}

export interface DriverAlert {
  driver_id: string;
  driver_name: string;
  alert_type: 'offline_long' | 'low_rating' | 'rejected_many' | 'no_location';
  details: string;
  severity: 'warning' | 'critical';
}

export interface OnlineDriver {
  id: string;
  name: string;
  lat: number;
  lng: number;
  is_available: boolean;
  last_updated: string;
}

export interface SystemSettings {
  id: string;
  category: string;
  key: string;
  value: Json;
  updated_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  admin_name?: string;
  action_type: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

// Helper interfaces for Supabase joins
interface ProfileJoin {
  name: string | null;
}

interface TripWithProfiles {
  id: string;
  status: string;
  origin: string;
  destination: string;
  priceUsd: number;
  created_at: string;
  matching_attempt: number;
  passenger: ProfileJoin | null;
  driver: ProfileJoin | null;
}

interface DriverLocationWithProfile {
  driver_id: string;
  lat: number;
  lng: number;
  is_available: boolean;
  last_updated: string;
  profile: ProfileJoin | null;
}

interface OfflineDriverData {
  driver_id: string;
  last_updated: string;
  profiles: { name: string } | null;
}

interface LowRatingDriverData {
  user_id: string;
  average_rating: number;
  profile: { name: string } | null;
}

interface RechargeRequestWithProfile {
  id: string;
  user_id: string;
  amount_usd: number;
  amount_ves: number;
  status: string;
  created_at: string;
  payment_reference?: string;
  payment_method?: string;
  profile: { name: string } | null;
}

export const adminService = {
  async getDashboardStats(): Promise<AdminStats> {
    try {
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: driverCount } = await supabase.from('driver_profiles').select('*', { count: 'exact', head: true });
      const { count: pendingCount } = await supabase.from('recharge_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');

      // Active trips
      const { count: activeTrips } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .in('status', ['REQUESTED', 'MATCHING', 'ACCEPTED', 'IN_PROGRESS']);

      // Online drivers
      const { count: onlineDrivers } = await supabase
        .from('driver_locations')
        .select('*', { count: 'exact', head: true })
        .eq('is_available', true);

      // Today's completed trips
      const today = new Date().toISOString().split('T')[0];
      const { count: todayTrips } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'COMPLETED')
        .gte('created_at', today);

      // Revenue
      const { data: revenueData } = await supabase.from('trips').select('priceUsd').eq('status', 'COMPLETED');
      const totalRevenue = revenueData?.reduce((acc, trip) => acc + (trip.priceUsd || 0), 0) || 0;

      return {
        totalUsers: userCount || 0,
        activeDrivers: driverCount || 0,
        totalRevenueUsd: totalRevenue,
        pendingApprovals: pendingCount || 0,
        activeTrips: activeTrips || 0,
        onlineDrivers: onlineDrivers || 0,
        pendingRecharges: pendingCount || 0,
        todayTrips: todayTrips || 0,
      };
    } catch (error) {
      logger.error("Error fetching admin stats", error);
      return {
        totalUsers: 0,
        activeDrivers: 0,
        totalRevenueUsd: 0,
        pendingApprovals: 0,
        activeTrips: 0,
        onlineDrivers: 0,
        pendingRecharges: 0,
        todayTrips: 0,
      };
    }
  },

  async getRevenueByService(): Promise<RevenueData[]> {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('serviceId, priceUsd')
        .eq('status', 'COMPLETED');

      if (error) throw error;

      interface RevenueAccumulator {
        [key: string]: RevenueData;
      }

      const grouped = (data || []).reduce<RevenueAccumulator>((acc, trip) => {
        const serviceId = trip.serviceId || 'unknown';
        if (!acc[serviceId]) {
          acc[serviceId] = { name: serviceId, pago: 0, neto: 0, seniat: 0 };
        }
        acc[serviceId].pago += trip.priceUsd || 0;
        acc[serviceId].neto += (trip.priceUsd || 0) * 0.05;
        acc[serviceId].seniat += (trip.priceUsd || 0) * 0.03;
        return acc;
      }, {});

      return Object.values(grouped);
    } catch (error) {
      logger.error("Error fetching revenue by service", error);
      return [];
    }
  },

  // ========================================
  // OPERATIONS MONITOR
  // ========================================

  async getLiveTrips(): Promise<LiveTrip[]> {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id, status, origin, destination, priceUsd, created_at, matching_attempt,
          passenger:profiles!passenger_id(name),
          driver:profiles!driver_id(name)
        `)
        .in('status', ['REQUESTED', 'MATCHING', 'ACCEPTED', 'IN_PROGRESS'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Cast to intermediate type to handle joins safely
      const rawTrips = data as unknown as TripWithProfiles[];

      return rawTrips.map(trip => ({
        id: trip.id,
        status: trip.status,
        passenger_name: trip.passenger?.name || 'Anónimo',
        driver_name: trip.driver?.name || null,
        origin: trip.origin,
        destination: trip.destination,
        price_usd: trip.priceUsd,
        created_at: trip.created_at,
        matching_attempt: trip.matching_attempt || 0,
      }));
    } catch (error) {
      logger.error("Error fetching live trips", error);
      return [];
    }
  },

  subscribeToLiveTrips(onUpdate: (trips: LiveTrip[]) => void): () => void {
    const channel = supabase
      .channel('admin_live_trips')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trips' },
        async () => {
          const trips = await this.getLiveTrips();
          onUpdate(trips);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  },

  async getOnlineDrivers(): Promise<OnlineDriver[]> {
    try {
      const { data, error } = await supabase
        .from('driver_locations')
        .select(`
          driver_id, lat, lng, is_available, last_updated,
          profile:profiles!driver_id(name)
        `)
        .eq('is_available', true)
        .gte('last_updated', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Only active in last 5 mins

      if (error) throw error;

      const rawDrivers = data as unknown as DriverLocationWithProfile[];

      return rawDrivers.map(d => ({
        id: d.driver_id,
        name: d.profile?.name || 'Conductor',
        lat: d.lat,
        lng: d.lng,
        is_available: d.is_available,
        last_updated: d.last_updated,
      }));
    } catch (error) {
      logger.error("Error fetching online drivers", error);
      return [];
    }
  },

  subscribeToDriverLocations(onUpdate: (drivers: OnlineDriver[]) => void): () => void {
    const channel = supabase
      .channel('admin_driver_locations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_locations' },
        async () => {
          const drivers = await this.getOnlineDrivers();
          onUpdate(drivers);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  },

  // ========================================
  // TRANSACTION LOG
  // ========================================

  async getTransactionLog(limit: number = 100): Promise<TransactionLogEntry[]> {
    try {
      const { data, error } = await supabase.functions.invoke('admin-get-transactions', {
        body: { limit }
      });

      if (error) throw error;

      if (!data || !data.success || !Array.isArray(data.data)) {
        throw new Error("Invalid response from admin-get-transactions");
      }

      return data.data as TransactionLogEntry[];
    } catch (error) {
      logger.error("Error fetching transaction log via Edge Function", error);
      return [];
    }
  },

  // ========================================
  // DRIVER ALERTS
  // ========================================

  async getDriverAlerts(): Promise<DriverAlert[]> {
    const alerts: DriverAlert[] = [];

    try {
      // Drivers offline for more than 24h who were previously active
      const { data: offlineDriversData } = await supabase
        .from('driver_locations')
        .select('driver_id, last_updated, profiles!driver_id(name)')
        .lt('last_updated', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const offlineDrivers = offlineDriversData as unknown as OfflineDriverData[];

      offlineDrivers?.forEach(d => {
        alerts.push({
          driver_id: d.driver_id,
          driver_name: d.profiles?.name || 'Conductor',
          alert_type: 'offline_long',
          details: `Sin actividad desde ${new Date(d.last_updated).toLocaleDateString()}`,
          severity: 'warning',
        });
      });

      // Drivers with low rating (below 4.0)
      const { data: lowRatingDriversData } = await supabase
        .from('driver_profiles')
        .select('user_id, average_rating, profile:profiles!user_id(name)')
        .lt('average_rating', 4.0)
        .gt('average_rating', 0);

      const lowRatingDrivers = lowRatingDriversData as unknown as LowRatingDriverData[];

      lowRatingDrivers?.forEach(d => {
        alerts.push({
          driver_id: d.user_id,
          driver_name: d.profile?.name || 'Conductor',
          alert_type: 'low_rating',
          details: `Rating: ${d.average_rating?.toFixed(2)}/5.0`,
          severity: d.average_rating < 3.5 ? 'critical' : 'warning',
        });
      });

      return alerts;
    } catch (error) {
      logger.error("Error fetching driver alerts", error);
      return [];
    }
  },

  // ========================================
  // RECONCILIATION
  // ========================================

  // Using Unknown for now as BankTransaction generic type is not available in snippet, 
  // but better than any.
  async getUnmatchedTransactions(): Promise<Record<string, unknown>[]> {
    try {
      const { data, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('reconciliation_status', 'unmatched')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error fetching unmatched transactions", error);
      return [];
    }
  },

  async getPendingRecharges(): Promise<RechargeRequestWithProfile[]> {
    try {
      const { data, error } = await supabase
        .from('recharge_requests')
        .select(`
          *,
          profile:profiles!user_id(name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rawRecharges = data as unknown as RechargeRequestWithProfile[];
      return rawRecharges || [];
    } catch (error) {
      logger.error("Error fetching pending recharges", error);
      return [];
    }
  },

  async manualReconcile(transactionId: string, rechargeRequestId: string, adminId: string): Promise<boolean> {
    try {
      // Link the bank transaction to the recharge request
      const { error: updateError } = await supabase
        .from('bank_transactions')
        .update({
          reconciliation_status: 'matched',
          reconciled_at: new Date().toISOString(),
          reconciled_by: adminId,
          reconciliation_notes: 'Reconciliación manual por administrador',
        })
        .eq('id', transactionId);

      if (updateError) throw updateError;

      // Process the recharge
      const { error: processError } = await supabase.rpc('process_recharge', {
        p_recharge_request_id: rechargeRequestId,
        p_bank_transaction_id: transactionId,
      });

      if (processError) throw processError;

      return true;
    } catch (error) {
      logger.error("Error in manual reconciliation", error);
      return false;
    }
  },

  // ========================================
  // SYSTEM SETTINGS
  // ========================================

  async getSystemSettings(): Promise<SystemSettings[]> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) {
        // If table doesn't exist yet, return empty or mock data
        if (error.code === '42P01') {
          logger.warn("Table system_settings does not exist yet");
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      logger.error("Error fetching system settings", error);
      return [];
    }
  },

  async updateSystemSetting(id: string, value: Json): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Log the action
      await this.logAdminAction('update_setting', 'system_settings', id, { new_value: value });

      return true;
    } catch (error) {
      logger.error("Error updating system setting", error);
      return false;
    }
  },

  // ========================================
  // AUDIT LOGS
  // ========================================

  async getAuditLogs(limit: number = 100): Promise<AdminAuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*, admin:profiles!admin_id(name)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        if (error.code === '42P01') {
          logger.warn("Table admin_audit_logs does not exist yet");
          return [];
        }
        throw error;
      }

      // Use a typed fetch result
      const logs = data as unknown as (AdminAuditLog & { admin: { name: string } | null })[];

      return (logs || []).map(log => ({
        ...log,
        admin_name: log.admin?.name || 'Sistema'
      }));
    } catch (error) {
      logger.error("Error fetching audit logs", error);
      return [];
    }
  },

  async logAdminAction(
    actionType: string,
    resourceType: string,
    resourceId: string,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('admin_audit_logs').insert({
        admin_id: user.id,
        action_type: actionType,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        ip_address: '0.0.0.0', // Would need backend help for real IP
        user_agent: navigator.userAgent
      });
    } catch (error) {
      logger.error("Error logging admin action", error);
    }
  }
};

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'passenger' | 'driver' | 'admin';
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
  phone: string;
  documentId: string;
}

export const userManagementService = {
  async getUsers(): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(u => ({
        id: u.id,
        name: u.full_name || u.name || 'Usuario sin nombre',
        email: u.email,
        role: u.role,
        status: u.status || 'active',
        createdAt: u.created_at,
        phone: u.phone || 'N/A',
        documentId: u.document_id || 'N/A'
      }));
    } catch (error) {
      logger.error("Error fetching users", error);
      return [];
    }
  },

  async getAdmins(): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'ADMIN')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(u => ({
        id: u.id,
        name: u.full_name || u.name || 'Administrador',
        email: u.email,
        role: u.role,
        status: u.status || 'active',
        createdAt: u.created_at,
        phone: u.phone || 'N/A',
        documentId: u.document_id || 'N/A',
        adminRole: u.admin_role
      }));
    } catch (error) {
      logger.error("Error fetching admins", error);
      return [];
    }
  },

  async updateUserStatus(userId: string, status: 'active' | 'suspended'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error updating user status", error);
      return false;
    }
  }
};

