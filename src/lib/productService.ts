import { supabase } from './supabase';
import { DIGITAL_PRODUCTS, formatQ } from './constructionData';

export interface ProductRecord {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  price_label: string;
  description: string;
  features: string[];
  image_url: string | null;
  badge: string | null;
  file_storage_path: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

async function fetchFromDB(): Promise<ProductRecord[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error || !data || data.length === 0) {
    return [];
  }

  return data.map((row: any) => ({
    ...row,
    features: typeof row.features === 'string' ? JSON.parse(row.features) : (row.features || []),
    price_label: row.price_label || formatQ(Number(row.price)),
  }));
}

async function fetchAllFromDB(): Promise<ProductRecord[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error || !data || data.length === 0) {
    return [];
  }

  return data.map((row: any) => ({
    ...row,
    features: typeof row.features === 'string' ? JSON.parse(row.features) : (row.features || []),
    price_label: row.price_label || formatQ(Number(row.price)),
  }));
}

function staticProductsToRecord(): ProductRecord[] {
  return DIGITAL_PRODUCTS.map((p, i) => ({
    id: p.id,
    code: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    price_label: p.priceLabel,
    description: p.description,
    features: p.features,
    image_url: p.image,
    badge: p.badge || null,
    file_storage_path: null,
    is_active: true,
    sort_order: i + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

class ProductService {
  async getActiveProducts(): Promise<ProductRecord[]> {
    const db = await fetchFromDB();
    return db.length > 0 ? db : staticProductsToRecord();
  }

  async getAllProducts(): Promise<ProductRecord[]> {
    const db = await fetchAllFromDB();
    return db.length > 0 ? db : staticProductsToRecord();
  }

  async getProductByCode(code: string): Promise<ProductRecord | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (error || !data) {
      const static_ = DIGITAL_PRODUCTS.find(p => p.id === code);
      if (!static_) return null;
      return staticProductsToRecord().find(p => p.code === code) || null;
    }

    return {
      ...data,
      features: typeof data.features === 'string' ? JSON.parse(data.features) : (data.features || []),
      price_label: data.price_label || formatQ(Number(data.price)),
    };
  }

  async upsertProduct(product: Partial<ProductRecord>): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      const payload: any = { ...product };
      if (payload.features && Array.isArray(payload.features)) {
        payload.features = JSON.stringify(payload.features);
      }
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;

      const { data, error } = await supabase
        .from('products')
        .upsert(payload, { onConflict: 'code', ignoreDuplicates: false })
        .select('id')
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, id: data?.id };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error al guardar producto' };
    }
  }

  async toggleActive(productId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('products')
      .update({ is_active: isActive })
      .eq('id', productId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  async deleteProduct(productId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  async updateFileStoragePath(productId: string, path: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('products')
      .update({ file_storage_path: path })
      .eq('id', productId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }
}

export const productService = new ProductService();
