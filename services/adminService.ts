import { supabase } from './supabaseClient';
import logger from '../utils/logger';

export interface AdminStats {
  totalUsers: number;
  activeDrivers: number;
  totalRevenueUsd: number;
  pendingApprovals: number;
}

export interface RevenueData {
  name: string;
  pago: number;
  neto: number;
  seniat: number;
}

export const adminService = {
  async getDashboardStats(): Promise<AdminStats> {
    try {
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: driverCount } = await supabase.from('driver_profiles').select('*', { count: 'exact', head: true }); // Query driver_profiles table
      const { count: pendingCount } = await supabase.from('recharge_requests').select('*', { count: 'exact', head: true }).eq('status', 'PENDING');

      // Calculate revenue (Mock for now as trips table might be empty)
      // In real prod: sum(priceUsd) from trips where status = 'COMPLETED'
      const { data: revenueData } = await supabase.from('trips').select('priceUsd').eq('status', 'COMPLETED');
      const totalRevenue = revenueData?.reduce((acc, trip) => acc + (trip.priceUsd || 0), 0) || 0;

      return {
        totalUsers: userCount || 0,
        activeDrivers: driverCount || 0,
        totalRevenueUsd: totalRevenue,
        pendingApprovals: pendingCount || 0
      };
    } catch (error) {
      logger.error("Error fetching admin stats", error);
      return {
        totalUsers: 0,
        activeDrivers: 0,
        totalRevenueUsd: 0,
        pendingApprovals: 0
      };
    }
  },

  async getRevenueByService(): Promise<RevenueData[]> {
    // Simulación de datos que vendrían de una consulta agrupada por servicio
    return [
      { name: 'Mototaxi', pago: 25, neto: 2, seniat: 1 },
      { name: 'El Pana', pago: 65, neto: 3, seniat: 2 },
      { name: 'El Amigo', pago: 52, neto: 2, seniat: 1 },
      { name: 'Full Pana', pago: 48, neto: 2, seniat: 2 },
    ];
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

      // Mapeo de datos reales o fallback a mock si no hay datos
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
      // Mock data for development
      return [
        { id: '1', name: 'Carlos El Pana', email: 'carlos@pana.com', role: 'driver', status: 'active', createdAt: '2025-12-01', phone: '0412-1112233', documentId: 'V-12345678' },
        { id: '2', name: 'María Pérez', email: 'maria@gmail.com', role: 'passenger', status: 'active', createdAt: '2025-12-05', phone: '0414-5556677', documentId: 'V-87654321' },
        { id: '3', name: 'Juan Conductor', email: 'juan@pana.com', role: 'driver', status: 'pending', createdAt: '2026-01-01', phone: '0416-9998877', documentId: 'V-11223344' },
      ];
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
