import { z } from 'zod';

// Esquema de validación para información de contacto
export const contactSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre es demasiado largo'),
  email: z.string().email('Correo electrónico inválido'),
  phone: z.string().regex(/^\+?[0-9\s\-\(\)]+$/, 'Número de teléfono inválido').optional(),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres').max(1000, 'El mensaje es demasiado largo'),
});

// Esquema de validación para calculator premium request
export const calculatorQuoteSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.string().email('Correo electrónico inválido'),
  phone: z.string().regex(/^\+?[0-9\s\-\(\)]+$/, 'Número de teléfono inválido').optional(),
  department: z.string().min(1, 'Selecciona un departamento'),
  constructionType: z.string().min(1, 'Selecciona un tipo de construcción'),
  qualityLevel: z.string().min(1, 'Selecciona un nivel de calidad'),
  squareMeters: z.number().min(10, 'Mínimo 10 m²').max(10000, 'Máximo 10,000 m²'),
});

// Esquema de validación para solicitud de servicios
export const serviceRequestSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.string().email('Correo electrónico inválido'),
  phone: z.string().regex(/^\+?[0-9\s\-\(\)]+$/, 'Número de teléfono inválido').optional(),
  serviceType: z.string().min(1, 'Selecciona un tipo de servicio'),
  department: z.string().optional(),
  projectSize: z.string().max(200, 'La descripción del tamaño es demasiado larga').optional(),
  description: z.string().max(1000, 'La descripción es demasiado larga').optional(),
});

// Esquema de validación para compra de productos
export const productPurchaseSchema = z.object({
  productId: z.string().min(1, 'ID de producto inválido'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.string().email('Correo electrónico inválido'),
  phone: z.string().regex(/^\+?[0-9\s\-\(\)]+$/, 'Número de teléfono inválido').optional(),
});

// Esquema de validación para login
export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

// Función helper para validar formularios
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: Record<string, string> } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Error de validación' } };
  }
};

// Función para sanitizar inputs (prevención XSS)
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Función para validar y sanitizar datos de formulario
export const validateAndSanitizeForm = <T>(schema: z.ZodSchema<T>, data: any): { success: boolean; data?: T; errors?: Record<string, string> } => {
  // Sanitizar strings en los datos
  const sanitizedData = Object.keys(data).reduce((acc, key) => {
    if (typeof data[key] === 'string') {
      acc[key] = sanitizeInput(data[key]);
    } else {
      acc[key] = data[key];
    }
    return acc;
  }, {} as any);

  return validateForm(schema, sanitizedData);
};