import { supabase } from './supabase';

export interface TrialInfo {
  id: string;
  email: string;
  product_code: string;
  product_name: string;
  started_at: string;
  expires_at: string;
  status: 'active' | 'expired' | 'converted';
  days_remaining?: number;
}

export interface ProductDemo {
  id: string;
  product_code: string;
  type: 'screenshot' | 'video' | 'demo_url' | 'pdf_preview';
  url: string;
  caption: string;
  sort_order: number;
}

class TrialService {
  private static instance: TrialService;

  static getInstance(): TrialService {
    if (!TrialService.instance) {
      TrialService.instance = new TrialService();
    }
    return TrialService.instance;
  }

  async startTrial(email: string, productCode: string, productName: string): Promise<TrialInfo | { error: string }> {
    try {
      // Check if trial is allowed
      const { data: canStart } = await supabase
        .rpc('can_start_trial', { p_email: email, p_product_code: productCode });

      if (canStart && !canStart.allowed) {
        return { error: canStart.reason || 'No puedes iniciar otro trial para este producto' };
      }

      const { data, error } = await supabase
        .from('product_trials')
        .insert({
          email,
          product_code: productCode,
          product_name: productName,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) return { error: error.message };
      return data as TrialInfo;
    } catch (e: any) {
      return { error: e.message };
    }
  }

  async getTrialsByEmail(email: string): Promise<TrialInfo[]> {
    try {
      const { data, error } = await supabase
        .from('product_trials')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(t => ({
        ...t,
        days_remaining: Math.max(0, Math.floor((new Date(t.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
      })) as TrialInfo[];
    } catch {
      return [];
    }
  }

  async getActiveTrial(email: string, productCode: string): Promise<TrialInfo | null> {
    try {
      const { data, error } = await supabase
        .from('product_trials')
        .select('*')
        .eq('email', email)
        .eq('product_code', productCode)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .limit(1)
        .single();

      if (error || !data) return null;
      return {
        ...data,
        days_remaining: Math.max(0, Math.floor((new Date(data.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
      } as TrialInfo;
    } catch {
      return null;
    }
  }

  async getProductDemos(productCode: string): Promise<ProductDemo[]> {
    try {
      const { data, error } = await supabase
        .from('product_demos')
        .select('*')
        .eq('product_code', productCode)
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as ProductDemo[];
    } catch {
      return [];
    }
  }

  isExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date();
  }
}

export const trialService = TrialService.getInstance();