// Sistema de notificaciones por email
// Integra con Supabase Email o servicios externos como Resend/SendGrid

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface OrderConfirmationData {
  customerName: string;
  customerEmail: string;
  orderId: string;
  productName: string;
  amount: number;
  currency: string;
}

interface QuoteNotificationData {
  name: string;
  email: string;
  department: string;
  squareMeters: number;
  estimatedCost: number;
}

interface ServiceRequestData {
  name: string;
  email: string;
  serviceType: string;
  department?: string;
  description?: string;
}

class EmailService {
  private static instance: EmailService;

  private constructor() {}

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  // Enviar email usando Supabase Email
  async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      // Use the deployed Supabase Edge Function for secure email sending
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/send-email`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(template),
      });

      if (!response.ok) {
        throw new Error(`Email send failed: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      // Fallback: Simular envío exitoso en desarrollo
      if (import.meta.env.DEV) {
        console.log('[DEV MODE] Email would be sent:', template);
        return true;
      }
      return false;
    }
  }

  // Template: Confirmación de orden
  async sendOrderConfirmation(data: OrderConfirmationData): Promise<boolean> {
    const template = this.getOrderConfirmationTemplate(data);
    return this.sendEmail(template);
  }

  // Template: Notificación de cotización premium
  async sendQuoteNotification(data: QuoteNotificationData): Promise<boolean> {
    const template = this.getQuoteNotificationTemplate(data);
    return this.sendEmail(template);
  }

  // Template: Solicitud de servicio
  async sendServiceRequest(data: ServiceRequestData): Promise<boolean> {
    const template = this.getServiceRequestTemplate(data);
    return this.sendEmail(template);
  }

  // Template: Bienvenida
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const template = this.getWelcomeTemplate(email, name);
    return this.sendEmail(template);
  }

  // Template: Recuperación de contraseña
  async sendPasswordReset(email: string, resetLink: string): Promise<boolean> {
    const template = this.getPasswordResetTemplate(email, resetLink);
    return this.sendEmail(template);
  }

  // Template: Comprobante recibido
  async sendReceiptReceived(customerEmail: string, customerName: string, orderId: string): Promise<boolean> {
    return this.sendEmail({
      to: customerEmail,
      subject: `Comprobante recibido - Orden #${orderId.slice(0, 8)} - Construsmart`,
      html: this.getReceiptReceivedHtml(customerName, orderId),
    });
  }

  // Template: Pago aprobado
  async sendPaymentApproved(customerEmail: string, customerName: string, orderId: string, portalLink: string): Promise<boolean> {
    return this.sendEmail({
      to: customerEmail,
      subject: `Pago confirmado - Tu producto esta listo - Orden #${orderId.slice(0, 8)}`,
      html: this.getPaymentApprovedHtml(customerName, orderId, portalLink),
    });
  }

  // Template: Pago rechazado
  async sendPaymentRejected(customerEmail: string, customerName: string, orderId: string, reason: string): Promise<boolean> {
    return this.sendEmail({
      to: customerEmail,
      subject: `Comprobante rechazado - Orden #${orderId.slice(0, 8)} - Construsmart`,
      html: this.getPaymentRejectedHtml(customerName, orderId, reason),
    });
  }

  // Template: Producto listo para descargar
  async sendDeliveryReady(customerEmail: string, customerName: string, orderId: string, productName: string, downloadLink: string, licenseKey?: string): Promise<boolean> {
    return this.sendEmail({
      to: customerEmail,
      subject: `Tu producto "${productName}" esta listo para descargar`,
      html: this.getDeliveryReadyHtml(customerName, orderId, productName, downloadLink, licenseKey),
    });
  }

  // Template: Notificacion al admin
  async sendAdminNewReceipt(adminEmail: string, customerName: string, orderId: string, amount: number): Promise<boolean> {
    return this.sendEmail({
      to: adminEmail,
      subject: `[Admin] Nuevo comprobante pendiente - Orden #${orderId.slice(0, 8)}`,
      html: this.getAdminNewReceiptHtml(customerName, orderId, amount),
    });
  }

  // Generar templates HTML
  private getOrderConfirmationTemplate(data: OrderConfirmationData): EmailTemplate {
    const { customerName, orderId, productName, amount, currency } = data;
    
    return {
      to: data.customerEmail,
      subject: `¡Confirmación de tu pedido #${orderId.slice(0, 8)} - ConstructoraGT`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmación de Pedido</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a2332 0%, #243042 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .header p { color: #f97316; margin: 10px 0 0; }
            .content { background: #f9fafb9; padding: 30px; border-radius: 0 0 10px 10px; }
            .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316; }
            .product { background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); padding: 15px; border-radius: 8px; margin: 15px 0; }
            .total { font-size: 24px; font-weight: bold; color: #f97316; text-align: center; margin: 20px 0; }
            .cta-button { display: block; background: #f97316; color: white; text-align: center; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 ¡Pedido Confirmado!</h1>
              <p>Gracias por tu compra, ${customerName}</p>
            </div>
            <div class="content">
              <p>Hola ${customerName},</p>
              <p>Te confirmamos que hemos recibido tu pedido exitosamente. Aquí están los detalles:</p>
              
              <div class="order-details">
                <h3>📦 Detalles del Pedido</h3>
                <p><strong>ID del Pedido:</strong> ${orderId.slice(0, 8)}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-GT')}</p>
              </div>

              <div class="product">
                <h4>🏗️ ${productName}</h4>
                <p>Producto digital - Entrega inmediata</p>
              </div>

              <div class="total">
                Total: ${currency === 'GTQ' ? 'Q' : '$'}${amount.toLocaleString()}
              </div>

              <p>Recibirás un email con los datos de acceso y descarga en las próximas horas.</p>

              <a href="${import.meta.env.VITE_APP_URL || 'http://localhost:8080'}" class="cta-button">
                🏠 Volver al Sitio
              </a>

              <div class="footer">
                <p>ConstructoraGT - Soluciones Integrales para la Construcción</p>
                <p>📍 Guatemala | 📧 salazaroliveros@gmail.com | 📱 +502 4060 1526</p>
                <p><small>Este email fue enviado automáticamente. Por favor no respondas.</small></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `¡Pedido Confirmado! Hola ${customerName}, tu pedido #${orderId.slice(0, 8)} ha sido recibido exitosamente. Total: ${currency === 'GTQ' ? 'Q' : '$'}${amount.toLocaleString()}. Recibirás los datos de acceso en breve.`
    };
  }

  private getQuoteNotificationTemplate(data: QuoteNotificationData): EmailTemplate {
    const { name, email, department, squareMeters, estimatedCost } = data;
    
    return {
      to: email,
      subject: `📋 Tu Presupuesto Premium para ${department} - ConstructoraGT`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Solicitud de Presupuesto Premium</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a2332 0%, #243042 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: #f9fafb9; padding: 30px; border-radius: 0 0 10px 10px; }
            .quote-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316; }
            .highlight { background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center; }
            .highlight .amount { font-size: 32px; font-weight: bold; color: #f97316; }
            .timeline { margin: 20px 0; padding: 20px; background: white; border-radius: 8px; }
            .step { display: flex; align-items: center; margin: 15px 0; }
            .step-number { width: 30px; height: 30px; background: #f97316; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Solicitud Recibida</h1>
              <p>Tu presupuesto premium está siendo preparado</p>
            </div>
            <div class="content">
              <p>Hola ${name},</p>
              <p>Gracias por tu interés en nuestro presupuesto premium. Hemos recibido tu solicitud y un especialista se pondrá en contacto contigo en menos de 24 horas.</p>
              
              <div class="quote-details">
                <h3>🏗️ Resumen de tu Proyecto</h3>
                <p><strong>Departamento:</strong> ${department}</p>
                <p><strong>Área:</strong> ${squareMeters} m²</p>
                <p><strong>Estimación Inicial:</strong> Q${estimatedCost.toLocaleString()}</p>
              </div>

              <div class="highlight">
                <p>Presupuesto Estimado</p>
                <p class="amount">Q${estimatedCost.toLocaleString()}</p>
                <p><small>*Precio sujeto a evaluación detallada</small></p>
              </div>

              <div class="timeline">
                <h3>📅 ¿Qué esperar?</h3>
                <div class="step">
                  <div class="step-number">1</div>
                  <div>Un especialista revisará tu solicitud</div>
                </div>
                <div class="step">
                  <div class="step-number">2</div>
                  <div>Te contactaremos para coordinar visita (si aplica)</div>
                </div>
                <div class="step">
                  <div class="step-number">3</div>
                  <div>Recibirás presupuesto detallado en 24-48 horas</div>
                </div>
              </div>

              <p>Si tienes preguntas urgentes, contáctanos:</p>
              <p>📱 +502 4060 1526 | 📧 salazaroliveros@gmail.com</p>

              <div class="footer">
                <p>ConstructoraGT - Soluciones Integrales para la Construcción</p>
                <p><small>Este email fue enviado automáticamente. Por favor no respondas.</small></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hola ${name}, gracias por tu solicitud de presupuesto premium en ${department}. Estimación inicial: Q${estimatedCost.toLocaleString()} para ${squareMeters} m². Un especialista te contactará en menos de 24 horas.`
    };
  }

  private getServiceRequestTemplate(data: ServiceRequestData): EmailTemplate {
    const { name, email, serviceType, department, description } = data;
    
    return {
      to: email,
      subject: `🔧 Solicitud de Servicio: ${serviceType} - ConstructoraGT`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Solicitud de Servicio</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a2332 0%, #243042 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: #f9fafb9; padding: 30px; border-radius: 0 0 10px 10px; }
            .service-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔧 Solicitud Recibida</h1>
              <p>Tu solicitud de servicio ha sido registrada</p>
            </div>
            <div class="content">
              <p>Hola ${name},</p>
              <p>Gracias por confiar en ConstructoraGT. Hemos recibido tu solicitud de servicio y un especialista se pondrá en contacto contigo pronto.</p>
              
              <div class="service-details">
                <h3>📋 Detalles de tu Solicitud</h3>
                <p><strong>Servicio:</strong> ${serviceType}</p>
                ${department ? `<p><strong>Departamento:</strong> ${department}</p>` : ''}
                ${description ? `<p><strong>Descripción:</strong> ${description}</p>` : ''}
                <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-GT')}</p>
              </div>

              <p>⏱️ Tiempo estimado de respuesta: menos de 24 horas hábiles</p>

              <div class="footer">
                <p>ConstructoraGT - Soluciones Integrales para la Construcción</p>
                <p>📍 Guatemala | 📧 salazaroliveros@gmail.com | 📱 +502 4060 1526</p>
                <p><small>Este email fue enviado automáticamente. Por favor no respondas.</small></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hola ${name}, gracias por tu solicitud de servicio: ${serviceType}${department ? ` en ${department}` : ''}. Un especialista te contactará en menos de 24 horas.`
    };
  }

  private getWelcomeTemplate(email: string, name: string): EmailTemplate {
    return {
      to: email,
      subject: `👋 ¡Bienvenido a Construsmart, ${name}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bienvenido a ConstructoraGT</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1a2332 0%, #243042 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">👋 ¡Bienvenido!</h1>
              <p style="color: #f97316; margin: 10px 0 0;">Gracias por unirte a ConstructoraGT</p>
            </div>
            <div style="background: #f9fafb9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Hola ${name},</p>
              <p>Estamos emocionados de tenerte con nosotros. En ConstructoraGT encontrarás:</p>
              <ul>
                <li>🏗️ Calculadora de costos de construcción</li>
                <li>📱 Productos digitales para tu obra</li>
                <li>🔧 Servicios profesionales de construcción</li>
                <li>📋 Presupuestos personalizados</li>
              </ul>
              <p>¡Explora nuestra plataforma y comienza a planificar tu proyecto!</p>
              <a href="${import.meta.env.VITE_APP_URL || 'http://localhost:8080'}" style="display: block; background: #f97316; color: white; text-align: center; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">🏠 Explorar Sitio</a>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `¡Bienvenido a ConstructoraGT! Hola ${name}, gracias por unirte a nuestra comunidad. Explora nuestra plataforma y comienza a planificar tu proyecto de construcción.`
    };
  }

  private getReceiptReceivedHtml(name: string, orderId: string): string {
    return `
      <div style="font-family:Arial;max-width:600px;margin:0 auto;">
        <div style="background:#1a2332;padding:24px;text-align:center;border-radius:10px 10px 0 0;">
          <h1 style="color:white;margin:0;">Construsmart</h1>
        </div>
        <div style="padding:24px;background:#f9fafb;">
          <h2>Comprobante recibido</h2>
          <p>Hola ${name},</p>
          <p>Hemos recibido tu comprobante de pago para la orden <strong>#${orderId.slice(0, 8)}</strong>.</p>
          <p>Lo revisaremos en las proximas 24 horas habiles. Te notificaremos cuando sea aprobado.</p>
          <p style="margin-top:24px;color:#666;font-size:12px;">
            Si tienes dudas, contactanos a <strong>salazaroliveros@gmail.com</strong> o WhatsApp <strong>+502 4060 1526</strong>.
          </p>
        </div>
        <div style="text-align:center;padding:16px;color:#999;font-size:11px;">
          Construsmart - Soluciones Digitales para la Construccion<br>
          Barrio el Centro, Quesada, Jutiapa
        </div>
      </div>`;
  }

  private getPaymentApprovedHtml(name: string, orderId: string, portalLink: string): string {
    return `
      <div style="font-family:Arial;max-width:600px;margin:0 auto;">
        <div style="background:#1a2332;padding:24px;text-align:center;border-radius:10px 10px 0 0;">
          <h1 style="color:white;margin:0;">Pago confirmado</h1>
        </div>
        <div style="padding:24px;background:#f9fafb;">
          <h2>Gracias por tu compra, ${name}!</h2>
          <p>Tu pago para la orden <strong>#${orderId.slice(0, 8)}</strong> ha sido aprobado.</p>
          <p>Tu producto digital esta listo para descargar.</p>
          <a href="${portalLink}"
             style="display:inline-block;background:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;margin:16px 0;">
            Ir a mis pedidos
          </a>
          <p style="margin-top:24px;color:#666;font-size:12px;">
            Contacto: salazaroliveros@gmail.com | +502 4060 1526
          </p>
        </div>
        <div style="text-align:center;padding:16px;color:#999;font-size:11px;">
          Construsmart - Barrio el Centro, Quesada, Jutiapa
        </div>
      </div>`;
  }

  private getPaymentRejectedHtml(name: string, orderId: string, reason: string): string {
    return `
      <div style="font-family:Arial;max-width:600px;margin:0 auto;">
        <div style="background:#1a2332;padding:24px;text-align:center;border-radius:10px 10px 0 0;">
          <h1 style="color:white;margin:0;">Comprobante rechazado</h1>
        </div>
        <div style="padding:24px;background:#f9fafb;">
          <h2>Hola ${name},</h2>
          <p>El comprobante de la orden <strong>#${orderId.slice(0, 8)}</strong> fue rechazado.</p>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin:16px 0;">
            <p style="color:#b91c1c;font-weight:bold;margin:0 0 4px;">Motivo del rechazo:</p>
            <p style="color:#991b1b;margin:0;">${reason}</p>
          </div>
          <p>Puedes subir un nuevo comprobante desde tu portal de cliente.</p>
          <a href="${import.meta.env.VITE_APP_URL || 'http://localhost:8080'}/portal"
             style="display:inline-block;background:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;margin:16px 0;">
            Subir nuevo comprobante
          </a>
          <p style="margin-top:24px;color:#666;font-size:12px;">
            Contacto: salazaroliveros@gmail.com | +502 4060 1526
          </p>
        </div>
        <div style="text-align:center;padding:16px;color:#999;font-size:11px;">
          Construsmart - Barrio el Centro, Quesada, Jutiapa
        </div>
      </div>`;
  }

  private getDeliveryReadyHtml(name: string, orderId: string, productName: string, downloadLink: string, licenseKey?: string): string {
    return `
      <div style="font-family:Arial;max-width:600px;margin:0 auto;">
        <div style="background:#1a2332;padding:24px;text-align:center;border-radius:10px 10px 0 0;">
          <h1 style="color:white;margin:0;">Producto listo</h1>
        </div>
        <div style="padding:24px;background:#f9fafb;">
          <h2>Felicidades ${name}!</h2>
          <p>Tu producto <strong>${productName}</strong> (orden #${orderId.slice(0, 8)}) ya esta listo.</p>
          ${licenseKey ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;margin:16px 0;">
            <p style="color:#166534;font-weight:bold;margin:0 0 4px;">Tu licencia:</p>
            <p style="font-family:monospace;font-size:14px;color:#15803d;margin:0;letter-spacing:1px;">${licenseKey}</p>
          </div>` : ''}
          <a href="${downloadLink}"
             style="display:inline-block;background:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;margin:16px 0;">
            Descargar producto
          </a>
          <p style="color:#666;font-size:12px;">El enlace expira en 7 dias. Maximo 5 descargas.</p>
          <p style="margin-top:24px;color:#666;font-size:12px;">
            Contacto: salazaroliveros@gmail.com | +502 4060 1526
          </p>
        </div>
        <div style="text-align:center;padding:16px;color:#999;font-size:11px;">
          Construsmart - Barrio el Centro, Quesada, Jutiapa
        </div>
      </div>`;
  }

  private getAdminNewReceiptHtml(customerName: string, orderId: string, amount: number): string {
    return `
      <div style="font-family:Arial;max-width:600px;margin:0 auto;">
        <div style="background:#1a2332;padding:24px;text-align:center;border-radius:10px 10px 0 0;">
          <h1 style="color:white;margin:0;">Nuevo comprobante</h1>
        </div>
        <div style="padding:24px;background:#f9fafb;">
          <p><strong>Cliente:</strong> ${customerName}</p>
          <p><strong>Orden:</strong> #${orderId.slice(0, 8)}</p>
          <p><strong>Monto:</strong> Q${amount.toLocaleString()}</p>
          <a href="${import.meta.env.VITE_APP_URL || 'http://localhost:8080'}/admin"
             style="display:inline-block;background:#1a2332;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;margin:16px 0;">
            Revisar en el panel
          </a>
        </div>
      </div>`;
  }

  private getPasswordResetTemplate(email: string, resetLink: string): EmailTemplate {
    return {
      to: email,
      subject: `🔑 Restablecer tu Contraseña - ConstructoraGT`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Restablecer Contraseña</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1a2332 0%, #243042 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🔑 Restablecer Contraseña</h1>
            </div>
            <div style="background: #f9fafb9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Recibimos una solicitud para restablecer tu contraseña.</p>
              <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
              <a href="${resetLink}" style="display: block; background: #f97316; color: white; text-align: center; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">🔄 Restablecer Contraseña</a>
              <p><small>Este enlace expirará en 1 hora por seguridad.</small></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Restablecer tu contraseña: ${resetLink}. Este enlace expirará en 1 hora. Si no solicitaste este cambio, ignora este email.`
    };
  }
}

export const emailService = EmailService.getInstance();