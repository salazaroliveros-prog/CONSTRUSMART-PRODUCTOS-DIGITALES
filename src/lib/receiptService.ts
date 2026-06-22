import { supabase } from './supabase';

export interface PaymentProof {
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

function generateFilePath(orderId: string, file: File): string {
  const ext = file.name.split('.').pop() || 'png';
  const uuid = crypto.randomUUID();
  return `${orderId}/${uuid}_original.${ext}`;
}

class ReceiptService {
  async uploadReceipt(
    orderId: string,
    customerEmail: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; proof?: PaymentProof; error?: string }> {
    try {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        return { success: false, error: 'Tipo de archivo no permitido. Usa PNG, JPG, WebP o PDF.' };
      }
      if (file.size > 10 * 1024 * 1024) {
        return { success: false, error: 'El archivo excede el límite de 10MB.' };
      }

      const { count, error: countError } = await supabase
        .from('payment_proofs')
        .select('id', { count: 'exact', head: true })
        .eq('order_id', orderId)
        .eq('customer_email', customerEmail);

      if (countError) {
        return { success: false, error: 'Error al verificar límite de subidas.' };
      }
      if (count && count >= 5) {
        return { success: false, error: 'Has alcanzado el límite de 5 subidas para esta orden.' };
      }

      onProgress?.(10);

      const filePath = generateFilePath(orderId, file);

      const { error: uploadError } = await supabase.storage
        .from('payment_receipts')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        return { success: false, error: 'Error al subir el archivo: ' + uploadError.message };
      }

      onProgress?.(60);

      const { data: proof, error: insertError } = await supabase
        .from('payment_proofs')
        .insert({
          order_id: orderId,
          customer_email: customerEmail,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) {
        await supabase.storage.from('payment_receipts').remove([filePath]);
        return { success: false, error: 'Error al registrar el comprobante: ' + insertError.message };
      }

      onProgress?.(100);

      return { success: true, proof };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error inesperado al subir el comprobante.' };
    }
  }

  async getReceipts(orderId: string): Promise<PaymentProof[]> {
    const { data } = await supabase
      .from('payment_proofs')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    return data || [];
  }

  async getReceiptUrl(filePath: string): Promise<string | null> {
    const { data } = await supabase.storage
      .from('payment_receipts')
      .createSignedUrl(filePath, 3600);

    return data?.signedUrl || null;
  }

  async getLatestReceipt(orderId: string): Promise<PaymentProof | null> {
    const proofs = await this.getReceipts(orderId);
    return proofs.length > 0 ? proofs[0] : null;
  }
}

export const receiptService = new ReceiptService();
