import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface PromoCode {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrder?: number;
  maxDiscount?: number;
  expiresAt?: string;
  usageLimit?: number;
  usedCount?: number;
}

class PromoCodeService {
  private static instance: PromoCodeService;

  private constructor() {}

  static getInstance(): PromoCodeService {
    if (!PromoCodeService.instance) {
      PromoCodeService.instance = new PromoCodeService();
    }
    return PromoCodeService.instance;
  }

  // Validar código promocional
  async validatePromoCode(code: string, orderValue: number): Promise<PromoCode | null> {
    try {
      // En producción, consultar base de datos
      // Por ahora, código de ejemplo
      const promoCodes: PromoCode[] = [
        {
          code: 'BIENVENIDO10',
          discountType: 'percentage',
          discountValue: 10,
          minOrder: 100,
          maxDiscount: 200,
        },
        {
          code: 'CONSTRU50',
          discountType: 'fixed',
          discountValue: 50,
          minOrder: 200,
        },
      ];

      const promoCode = promoCodes.find(pc => pc.code.toUpperCase() === code.toUpperCase());

      if (!promoCode) {
        toast.error('Código promocional inválido');
        return null;
      }

      // Validar valor mínimo de orden
      if (promoCode.minOrder && orderValue < promoCode.minOrder) {
        toast.error(`El código requiere un pedido mínimo de Q${promoCode.minOrder}`);
        return null;
      }

      // Validar expiración
      if (promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()) {
        toast.error('Código promocional expirado');
        return null;
      }

      // Validar límite de uso
      if (promoCode.usageLimit && promoCode.usedCount && promoCode.usedCount >= promoCode.usageLimit) {
        toast.error('Código promocional agotado');
        return null;
      }

      return promoCode;
    } catch (error) {
      console.error('Error validating promo code:', error);
      return null;
    }
  }

  // Calcular descuento
  calculateDiscount(promoCode: PromoCode, orderValue: number): number {
    let discount = 0;

    if (promoCode.discountType === 'percentage') {
      discount = orderValue * (promoCode.discountValue / 100);
      if (promoCode.maxDiscount) {
        discount = Math.min(discount, promoCode.maxDiscount);
      }
    } else {
      discount = promoCode.discountValue;
    }

    return Math.max(0, discount);
  }

  // Aplicar código promocional (para admin)
  async applyPromoCode(code: string, orderEmail: string): Promise<boolean> {
    try {
      // Registrar uso del código
      await supabase.from('promo_code_usage').insert({
        promo_code: code,
        customer_email: orderEmail,
        used_at: new Date().toISOString(),
      });

      toast.success('Código promocional aplicado exitosamente');
      return true;
    } catch (error) {
      console.error('Error applying promo code:', error);
      return false;
    }
  }
}

export const promoCodeService = PromoCodeService.getInstance();