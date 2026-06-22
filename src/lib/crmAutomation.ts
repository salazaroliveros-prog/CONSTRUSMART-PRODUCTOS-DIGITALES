// CRM Automation — Follow-up emails and lead nurturing
import { supabase } from './supabase';
import { emailService } from './emailService';

class CRMAutomation {
  // Send follow-up after quote request (24h later)
  async scheduleQuoteFollowUp(quoteId: string, email: string, name: string) {
    await supabase.from('crm_tasks').insert({
      type: 'quote_follow_up',
      reference_id: quoteId,
      target_email: email,
      target_name: name,
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    });
  }

  // Send follow-up after cart abandonment (1h, 24h, 72h)
  async scheduleAbandonedCartFollowUp(email: string, name: string, items: string, total: number) {
    const intervals = [1, 24, 72];
    for (const hours of intervals) {
      await supabase.from('crm_tasks').insert({
        type: 'abandoned_cart',
        target_email: email,
        target_name: name,
        metadata: { items, total, hours },
        scheduled_at: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      });
    }
  }

  // Process pending CRM tasks (call from Edge Function cron)
  async processPendingTasks() {
    const { data: tasks } = await supabase
      .from('crm_tasks')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(20);

    if (!tasks) return;

    for (const task of tasks) {
      try {
        switch (task.type) {
          case 'quote_follow_up':
            await emailService.sendEmail({
              to: task.target_email,
              subject: `¿Listo para comenzar tu proyecto? - Construsmart`,
              html: this.getQuoteFollowUpHtml(task.target_name),
            });
            break;

          case 'abandoned_cart':
            const meta = task.metadata || {};
            await emailService.sendEmail({
              to: task.target_email,
              subject: `¡No dejes pasar esta oportunidad! - Construsmart`,
              html: this.getAbandonedCartHtml(task.target_name, meta.items, meta.total),
            });
            break;

          case 'post_purchase':
            await emailService.sendEmail({
              to: task.target_email,
              subject: `¿Cómo fue tu experiencia? - Construsmart`,
              html: this.getPostPurchaseHtml(task.target_name),
            });
            break;
        }

        await supabase.from('crm_tasks').update({ status: 'completed' }).eq('id', task.id);
      } catch (e) {
        console.error('CRM task failed:', task.id, e);
        await supabase.from('crm_tasks').update({ status: 'failed' }).eq('id', task.id);
      }
    }
  }

  private getQuoteFollowUpHtml(name: string): string {
    return `
      <div style="font-family:Arial;max-width:600px;margin:0 auto;padding:24px;">
        <div style="background:#1a2332;padding:24px;text-align:center;border-radius:10px 10px 0 0;">
          <h1 style="color:white;margin:0;">Construsmart</h1>
        </div>
        <div style="padding:24px;background:#f9fafb;">
          <h2>Hola ${name},</h2>
          <p>Hace unos días solicitaste un presupuesto en nuestra calculadora de costos.</p>
          <p>¿Te gustaría que un asesor especializado revise tu proyecto sin costo?</p>
          <p>Estamos listos para ayudarte a dar el siguiente paso.</p>
          <a href="https://construsmart.vercel.app/contacto"
             style="display:inline-block;background:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;margin:16px 0;">
            Hablar con un asesor
          </a>
          <p style="color:#666;font-size:12px;margin-top:24px;">WhatsApp: +502 4060 1526</p>
        </div>
      </div>`;
  }

  private getAbandonedCartHtml(name: string, items: string, total: number): string {
    const formattedTotal = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(total);
    return `
      <div style="font-family:Arial;max-width:600px;margin:0 auto;padding:24px;">
        <div style="background:#1a2332;padding:24px;text-align:center;border-radius:10px 10px 0 0;">
          <h1 style="color:white;margin:0;">¿Olvidaste algo?</h1>
        </div>
        <div style="padding:24px;background:#f9fafb;">
          <h2>Hola ${name},</h2>
          <p>Tienes productos esperando en tu carrito:</p>
          <div style="background:white;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #f97316;">
            <p style="margin:0 0 8px;">${items}</p>
            <p style="font-size:20px;font-weight:bold;color:#f97316;margin:0;">Total: ${formattedTotal}</p>
          </div>
          <p>¡Completa tu compra ahora y recibe acceso inmediato!</p>
          <a href="https://construsmart.vercel.app/cart"
             style="display:inline-block;background:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;margin:16px 0;">
            Ir a mi carrito
          </a>
        </div>
      </div>`;
  }

  private getPostPurchaseHtml(name: string): string {
    return `
      <div style="font-family:Arial;max-width:600px;margin:0 auto;padding:24px;">
        <div style="background:#1a2332;padding:24px;text-align:center;border-radius:10px 10px 0 0;">
          <h1 style="color:white;margin:0;">Gracias por tu compra</h1>
        </div>
        <div style="padding:24px;background:#f9fafb;">
          <h2>Hola ${name},</h2>
          <p>Esperamos que tu producto esté siendo de gran utilidad.</p>
          <p>¿Podrías tomarte un minuto para calificar tu experiencia?</p>
          <p style="color:#666;font-size:12px;margin-top:24px;">Tu opinión nos ayuda a mejorar.</p>
        </div>
      </div>`;
  }
}

export const crmAutomation = new CRMAutomation();