import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { proof_id, action, reason } = req.body;

    if (!proof_id || !action) {
      return res.status(400).json({ error: 'proof_id and action are required' });
    }

    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ error: 'action must be approve or reject' });
    }

    if (action === 'reject' && !reason?.trim()) {
      return res.status(400).json({ error: 'reason is required when rejecting' });
    }

    const { data: proof, error: fetchError } = await supabase
      .from('payment_proofs')
      .select('*, constructora_orders!inner(id, customer_email, item_name, item_category)')
      .eq('id', proof_id)
      .single();

    if (fetchError || !proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    if (action === 'approve') {
      const { error: updateProofError } = await supabase
        .from('payment_proofs')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', proof_id);

      if (updateProofError) throw updateProofError;

      const orderId = (proof as any).order_id;
      const { error: updateOrderError } = await supabase
        .from('constructora_orders')
        .update({ status: 'paid' })
        .eq('id', orderId);

      if (updateOrderError) throw updateOrderError;

      const order = (proof as any).constructora_orders;
      const category = order?.item_category || '';
      const isSoftware = category.toLowerCase() === 'software';

      const productId = order?.product_id || null;
      let productStoragePath: string | null = null;
      if (productId) {
        const { data: prod } = await supabase
          .from('products')
          .select('code, file_storage_path')
          .eq('id', productId)
          .maybeSingle();
        if (prod?.file_storage_path) {
          productStoragePath = prod.file_storage_path;
        }
      }

      let licenseKey: string | null = null;
      if (isSoftware) {
        const prefix = 'CGT';
        const code = (order?.item_name || 'GEN').substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const hex = Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
        licenseKey = `${prefix}-${code || 'GEN'}-${hex}`;

        await supabase.from('product_licenses').insert({
          order_id: orderId,
          product_id: order?.item_name || orderId,
          license_key: licenseKey,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          max_activations: 3,
          activations_count: 0,
        });
      }

      const token = Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const storagePath = productStoragePath || `${(order?.item_name || 'product').toUpperCase().replace(/[^A-Z0-9]/g, '_')}/latest.zip`;

      const { error: dlError } = await supabase.from('download_links').insert({
        order_id: orderId,
        token,
        expires_at: expiresAt,
        max_downloads: 5,
        downloads_count: 0,
        file_storage_path: storagePath,
      });

      if (dlError) throw dlError;

      await supabase.from('product_deliveries').insert({
        order_id: orderId,
        customer_id: proof.customer_email,
        product_id: order?.item_name || orderId,
        product_name: order?.item_name || 'Producto',
        customer_email: proof.customer_email,
        customer_name: order?.customer_name || '',
        delivery_status: 'delivered',
        download_link: `${process.env.VITE_APP_URL || 'https://construsmart.vercel.app'}/download/${token}`,
        delivered_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

      await supabase.from('constructora_orders').update({ status: 'delivered' }).eq('id', orderId);

      return res.json({ success: true, licenseKey, downloadToken: token });
    } else {
      const { error: updateProofError } = await supabase
        .from('payment_proofs')
        .update({ status: 'rejected', rejection_reason: reason, reviewed_at: new Date().toISOString() })
        .eq('id', proof_id);

      if (updateProofError) throw updateProofError;

      const orderId = (proof as any).order_id;
      await supabase.from('constructora_orders').update({ status: 'rejected' }).eq('id', orderId);

      return res.json({ success: true });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
}
