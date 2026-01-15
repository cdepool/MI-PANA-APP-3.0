import { supabase } from './supabaseClient';
import logger from '../utils/logger';

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

      const grouped = (data || []).reduce((acc: any, trip) => {
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

      return (data || []).map(trip => ({
        id: trip.id,
        status: trip.status,
        passenger_name: (trip.passenger as any)?.name || 'Anónimo',
        driver_name: (trip.driver as any)?.name || null,
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

  // ========================================
  // TRANSACTION LOG
  // ========================================

  async getTransactionLog(limit: number = 100): Promise<TransactionLogEntry[]> {
    try {
      // Get trip transactions
      const { data: trips } = await supabase
        .from('trips')
        .select('id, priceUsd, priceVes, status, created_at, passenger:profiles!passenger_id(name)')
        .eq('status', 'COMPLETED')
        .order('created_at', { ascending: false })
        .limit(limit / 2);

      // Get wallet transactions
      const { data: walletTx } = await supabase
        .from('wallet_transactions')
        .select('id, type, amount_usd, amount_ves, status, created_at, reference, wallet:wallets(user:profiles(name))')
        .order('created_at', { ascending: false })
        .limit(limit / 2);

      const tripEntries: TransactionLogEntry[] = (trips || []).map(t => ({
        id: t.id,
        type: 'trip' as const,
        amount_usd: t.priceUsd || 0,
        amount_ves: t.priceVes || 0,
        user_name: (t.passenger as any)?.name || 'Desconocido',
        status: t.status,
        created_at: t.created_at,
        reference: `TRIP-${t.id.slice(0, 8)}`,
      }));

      const walletEntries: TransactionLogEntry[] = (walletTx || []).map(t => ({
        id: t.id,
        type: t.type as 'recharge' | 'withdrawal' | 'refund',
        amount_usd: t.amount_usd || 0,
        amount_ves: t.amount_ves || 0,
        user_name: (t.wallet as any)?.user?.name || 'Desconocido',
        status: t.status,
        created_at: t.created_at,
        reference: t.reference || `TX-${t.id.slice(0, 8)}`,
      }));

      return [...tripEntries, ...walletEntries]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    } catch (error) {
      logger.error("Error fetching transaction log", error);
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
      const { data: offlineDrivers } = await supabase
        .from('driver_locations')
        .select('driver_id, last_updated, profiles!driver_id(name)')
        .lt('last_updated', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      offlineDrivers?.forEach(d => {
        alerts.push({
          driver_id: d.driver_id,
          driver_name: (d as any).profiles?.name || 'Conductor',
          alert_type: 'offline_long',
          details: `Sin actividad desde ${new Date(d.last_updated).toLocaleDateString()}`,
          severity: 'warning',
        });
      });

      // Drivers with low rating (below 4.0)
      const { data: lowRatingDrivers } = await supabase
        .from('driver_profiles')
        .select('user_id, average_rating, profile:profiles!user_id(name)')
        .lt('average_rating', 4.0)
        .gt('average_rating', 0);

      lowRatingDrivers?.forEach(d => {
        alerts.push({
          driver_id: d.user_id,
          driver_name: (d as any).profile?.name || 'Conductor',
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

  async getUnmatchedTransactions(): Promise<any[]> {
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
