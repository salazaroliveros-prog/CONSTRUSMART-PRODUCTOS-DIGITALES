import { supabase } from './supabase';

interface DownloadLink {
  url: string;
  expiresAt: string;
  maxDownloads: number;
}

interface ProductDelivery {
  orderId: string;
  customerId: string;
  productId: string;
  productName: string;
  customerEmail: string;
  customerName: string;
}

class DigitalDeliveryService {
  private static instance: DigitalDeliveryService;

  private constructor() {}

  static getInstance(): DigitalDeliveryService {
    if (!DigitalDeliveryService.instance) {
      DigitalDeliveryService.instance = new DigitalDeliveryService();
    }
    return DigitalDeliveryService.instance;
  }

  // Generar enlace de descarga temporal
  async generateDownloadLink(orderId: string): Promise<DownloadLink | null> {
    try {
      // En un sistema real, esto generaría un enlace firmado con expiración
      // Por ahora, simulamos con un link temporal
      
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 horas
      
      // Generar un token simple para el enlace
      const token = this.generateDownloadToken(orderId);
      
      const downloadLink: DownloadLink = {
        url: `${import.meta.env.VITE_APP_URL || 'http://localhost:8080'}/download/${token}`,
        expiresAt,
        maxDownloads: 5,
      };

      // Guardar en base de datos
      await supabase.from('download_links').insert({
        order_id: orderId,
        token,
        expires_at: expiresAt,
        max_downloads: 5,
        downloads_count: 0,
      });

      return downloadLink;
    } catch (error) {
      console.error('Error generating download link:', error);
      return null;
    }
  }

  // Procesar entrega de producto
  async processDelivery(delivery: ProductDelivery): Promise<boolean> {
    try {
      // 1. Registrar la entrega en la base de datos
      const { error: deliveryError } = await supabase.from('product_deliveries').insert({
        order_id: delivery.orderId,
        customer_id: delivery.customerId,
        product_id: delivery.productId,
        product_name: delivery.productName,
        customer_email: delivery.customerEmail,
        customer_name: delivery.customerName,
        delivery_status: 'pending',
        created_at: new Date().toISOString(),
      });

      if (deliveryError) throw deliveryError;

      // 2. Generar enlace de descarga
      const downloadLink = await this.generateDownloadLink(delivery.orderId);
      
      if (!downloadLink) {
        throw new Error('Failed to generate download link');
      }

      // 3. Actualizar estado de entrega
      await supabase
        .from('product_deliveries')
        .update({ 
          delivery_status: 'delivered',
          download_link: downloadLink.url,
          delivered_at: new Date().toISOString(),
        })
        .eq('order_id', delivery.orderId);

      console.log(`Product delivered: ${delivery.productName} to ${delivery.customerEmail}`);
      return true;
    } catch (error) {
      console.error('Error processing delivery:', error);
      return false;
    }
  }

  // Generar licencia para software
  async generateLicense(orderId: string, productId: string): Promise<string | null> {
    try {
      // Generar una clave de licencia única
      const license = this.generateLicenseKey(productId);
      
      // Guardar en base de datos
      await supabase.from('product_licenses').insert({
        order_id: orderId,
        product_id: productId,
        license_key: license,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 año
        max_activations: 3,
        activations_count: 0,
      });

      return license;
    } catch (error) {
      console.error('Error generating license:', error);
      return null;
    }
  }

  // Validar licencia
  async validateLicense(licenseKey: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('product_licenses')
        .select('*')
        .eq('license_key', licenseKey)
        .single();

      if (error || !data) return false;

      if (new Date(data.expires_at) < new Date()) return false;

      const currentActivations = data.activations_count ?? data.activivations_count ?? 0;
      if (currentActivations >= data.max_activations) return false;

      return true;
    } catch (error) {
      console.error('Error validating license:', error);
      return false;
    }
  }

  // Activar licencia
  async activateLicense(licenseKey: string, deviceId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('product_licenses')
        .select('*')
        .eq('license_key', licenseKey)
        .single();

      if (error || !data) return false;

      const currentActivations = data.activations_count ?? data.activivations_count ?? 0;
      if (currentActivations >= data.max_activations) return false;

      await supabase.from('license_activations').insert({
        license_id: data.id,
        device_id: deviceId,
        activated_at: new Date().toISOString(),
      });

      await supabase
        .from('product_licenses')
        .update({ activations_count: currentActivations + 1 })
        .eq('id', data.id);

      return true;
    } catch (error) {
      console.error('Error activating license:', error);
      return false;
    }
  }

  // Obtener productos del cliente
  async getCustomerProducts(customerEmail: string) {
    try {
      const { data, error } = await supabase
        .from('product_deliveries')
        .select(`
          *,
          constructora_orders (
            customer_name,
            customer_email,
            created_at
          )
        `)
        .eq('customer_email', customerEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting customer products:', error);
      return [];
    }
  }

  // Generar token de descarga
  private generateDownloadToken(orderId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${orderId}-${timestamp}-${random}`;
  }

  // Generar clave de licencia
  private generateLicenseKey(productId: string): string {
    // Generar una clave de licencia profesional
    const segments = [];
    
    // Segmento 1: Prefijo del producto
    segments.push('CSGT');
    
    // Segmento 2: ID del producto codificado
    const productCode = productId.substring(0, 4).toUpperCase();
    segments.push(productCode);
    
    // Segmento 3: Random
    segments.push(Math.random().toString(36).substring(2, 8).toUpperCase());
    
    // Segmento 4: Timestamp codificado
    const timeCode = Date.now().toString(36).toUpperCase().substring(0, 4);
    segments.push(timeCode);
    
    // Segmento 5: Checksum simple
    const checksum = segments.join('').split('').reduce((a, b) => a + b.charCodeAt(0), 0) % 1000;
    segments.push(checksum.toString().padStart(3, '0'));

    return segments.join('-');
  }
}

export const digitalDeliveryService = DigitalDeliveryService.getInstance();