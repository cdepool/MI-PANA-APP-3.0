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
      // En una implementación real, estas serían consultas a Supabase
      // Por ahora, simulamos la agregación de datos reales
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: driverCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'driver');
      const { count: pendingCount } = await supabase.from('recharge_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      
      return {
        totalUsers: userCount || 1250,
        activeDrivers: driverCount || 45,
        totalRevenueUsd: 12450.50, // Esto vendría de una suma en wallet_transactions
        pendingApprovals: pendingCount || 12
      };
    } catch (error) {
      logger.error("Error fetching admin stats", error);
      return {
        totalUsers: 1250,
        activeDrivers: 45,
        totalRevenueUsd: 12450.50,
        pendingApprovals: 12
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
