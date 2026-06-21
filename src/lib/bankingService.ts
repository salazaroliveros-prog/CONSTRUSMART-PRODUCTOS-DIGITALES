import { supabase } from '@/lib/supabase';

interface BankingInfo {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  account_type: string;
  bank_branch?: string;
  nit?: string;
  swift_code?: string;
  instructions?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class BankingService {
  private static instance: BankingService;

  private constructor() {}

  static getInstance(): BankingService {
    if (!BankingService.instance) {
      BankingService.instance = new BankingService();
    }
    return BankingService.instance;
  }

  // Obtener datos bancarios activos del admin
  async getActiveBankingInfo(): Promise<BankingInfo | null> {
    try {
      const { data, error } = await supabase
        .from('admin_banking')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching banking info:', error);
      return null;
    }
  }

  // Obtener todos los datos bancarios (para admin)
  async getAllBankingInfo(): Promise<BankingInfo[]> {
    try {
      const { data, error } = await supabase
        .from('admin_banking')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching banking info:', error);
      return [];
    }
  }

  // Agregar datos bancarios (admin)
  async addBankingInfo(info: Omit<BankingInfo, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_banking')
        .insert([info]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding banking info:', error);
      return false;
    }
  }

  // Actualizar datos bancarios (admin)
  async updateBankingInfo(id: string, info: Partial<Omit<BankingInfo, 'id' | 'created_at'>>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_banking')
        .update({ ...info, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating banking info:', error);
      return false;
    }
  }

  // Eliminar datos bancarios (admin)
  async deleteBankingInfo(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_banking')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting banking info:', error);
      return false;
    }
  }

  // Activar/desactivar cuenta bancaria (admin)
  async toggleBankingInfo(id: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_banking')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error toggling banking info:', error);
      return false;
    }
  }
}

export const bankingService = BankingService.getInstance();