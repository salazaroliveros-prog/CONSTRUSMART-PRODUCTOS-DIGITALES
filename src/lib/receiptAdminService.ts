import { supabase } from './supabase';
import { digitalDeliveryService } from './digitalDelivery';

interface PaymentProof {
  id: string;
  order_id: string;
  customer_email: string;
  file_path: string;
  file_type: string;
  file_size: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface ReceiptWithOrder extends PaymentProof {
  constructora_orders: {
    customer_name: string;
    customer_email: string;
    amount: number;
    item_name: string;
  };
}

interface ReceiptStats {
  pending: number;
  approvedToday: number;
  rejected: number;
}

class ReceiptAdminService {
  async getPendingReceipts(filters?: { status?: string }): Promise<ReceiptWithOrder[]> {
    let query = supabase
      .from('payment_proofs')
      .select(`
        *,
        constructora_orders (
          customer_name,
          customer_email,
          amount,
          item_name
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data } = await query;
    return (data || []) as unknown as ReceiptWithOrder[];
  }

  async approveReceipt(proofId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: proof, error: fetchError } = await supabase
        .from('payment_proofs')
        .select('*, constructora_orders!inner(id, customer_email, customer_name, item_name, amount)')
        .eq('id', proofId)
        .single();

      if (fetchError || !proof) {
        return { success: false, error: 'Comprobante no encontrado.' };
      }

      const { error: updateError } = await supabase
        .from('payment_proofs')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', proofId);

      if (updateError) {
        return { success: false, error: 'Error al aprobar: ' + updateError.message };
      }

      const orderId = (proof as any).order_id;
      const { error: orderError } = await supabase
        .from('constructora_orders')
        .update({ status: 'paid' })
        .eq('id', orderId);

      if (orderError) {
        return { success: false, error: 'Error al actualizar la orden: ' + orderError.message };
      }

      const deliveryResult = await digitalDeliveryService.processOrderDelivery(orderId);
      if (!deliveryResult.success) {
        return { success: false, error: 'Pago aprobado pero error en entrega: ' + deliveryResult.error };
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error inesperado.' };
    }
  }

  async rejectReceipt(proofId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!reason.trim()) {
        return { success: false, error: 'Debes proporcionar un motivo de rechazo.' };
      }

      const { data: proof, error: fetchError } = await supabase
        .from('payment_proofs')
        .select('*, constructora_orders!inner(id)')
        .eq('id', proofId)
        .single();

      if (fetchError || !proof) {
        return { success: false, error: 'Comprobante no encontrado.' };
      }

      const { error: updateError } = await supabase
        .from('payment_proofs')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', proofId);

      if (updateError) {
        return { success: false, error: 'Error al rechazar: ' + updateError.message };
      }

      const orderId = (proof as any).order_id;
      const { error: orderError } = await supabase
        .from('constructora_orders')
        .update({ status: 'rejected' })
        .eq('id', orderId);

      if (orderError) {
        return { success: false, error: 'Error al actualizar la orden: ' + orderError.message };
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error inesperado.' };
    }
  }

  async getReceiptStats(): Promise<ReceiptStats> {
    const { data: all } = await supabase
      .from('payment_proofs')
      .select('status, created_at');

    if (!all) return { pending: 0, approvedToday: 0, rejected: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    return {
      pending: all.filter(r => r.status === 'pending').length,
      approvedToday: all.filter(r => r.status === 'approved' && r.created_at >= todayStr).length,
      rejected: all.filter(r => r.status === 'rejected').length,
    };
  }
}

export const receiptAdminService = new ReceiptAdminService();
