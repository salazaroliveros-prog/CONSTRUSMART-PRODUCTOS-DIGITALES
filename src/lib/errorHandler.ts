// Sistema centralizado de manejo de errores

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  DATABASE = 'DATABASE',
  PAYMENT = 'PAYMENT',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  userMessage?: string;
  statusCode?: number;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCallbacks: ((error: AppError) => void)[] = [];

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Registrar callback para manejo de errores
  onError(callback: (error: AppError) => void) {
    this.errorCallbacks.push(callback);
  }

  // Manejar error de manera centralizada
  handle(error: unknown, context?: string): AppError {
    const appError = this.parseError(error, context);
    
    // Log del error (en producción usar servicio de logging)
    this.logError(appError);
    
    // Ejecutar callbacks registrados
    this.errorCallbacks.forEach(callback => callback(appError));
    
    return appError;
  }

  // Convertir error desconocido a AppError
  private parseError(error: unknown, context?: string): AppError {
    // Si ya es AppError, retornarlo
    if (this.isAppError(error)) {
      return error;
    }

    // Error de red/Fetch
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        type: ErrorType.NETWORK,
        message: 'Error de conexión',
        details: error.message,
        userMessage: 'No se pudo conectar con el servidor. Por favor verifica tu conexión a internet.',
        statusCode: 0,
      };
    }

    // Error de Supabase
    if (this.isSupabaseError(error)) {
      return this.parseSupabaseError(error);
    }

    // Error genérico
    if (error instanceof Error) {
      return {
        type: ErrorType.UNKNOWN,
        message: error.message,
        details: error.stack,
        userMessage: 'Ocurrió un error inesperado. Por favor intenta nuevamente.',
      };
    }

    // Error desconocido
    return {
      type: ErrorType.UNKNOWN,
      message: 'Error desconocido',
      details: error,
      userMessage: 'Ocurrió un error inesperado. Por favor intenta nuevamente.',
    };
  }

  // Parsear errores de Supabase
  private parseSupabaseError(error: any): AppError {
    const { message, status, code } = error;

    if (code === '23505') { // Unique violation
      return {
        type: ErrorType.VALIDATION,
        message: 'Registro duplicado',
        details: error,
        userMessage: 'Este registro ya existe.',
        statusCode: status,
      };
    }

    if (code === '23503') { // Foreign key violation
      return {
        type: ErrorType.VALIDATION,
        message: 'Violación de llave foránea',
        details: error,
        userMessage: 'Referencia inválida.',
        statusCode: status,
      };
    }

    if (status === 401) {
      return {
        type: ErrorType.AUTHENTICATION,
        message: 'No autenticado',
        details: error,
        userMessage: 'Debes iniciar sesión para realizar esta acción.',
        statusCode: status,
      };
    }

    if (status === 403) {
      return {
        type: ErrorType.AUTHORIZATION,
        message: 'No autorizado',
        details: error,
        userMessage: 'No tienes permisos para realizar esta acción.',
        statusCode: status,
      };
    }

    return {
      type: ErrorType.DATABASE,
      message: message || 'Error de base de datos',
      details: error,
      userMessage: 'Error al procesar la solicitud. Por favor intenta nuevamente.',
      statusCode: status,
    };
  }

  // Verificar si es AppError
  private isAppError(error: any): error is AppError {
    return error && typeof error === 'object' && 'type' in error && 'message' in error;
  }

  // Verificar si es error de Supabase
  private isSupabaseError(error: any): boolean {
    return error && typeof error === 'object' && 'code' in error;
  }

  // Log de errores (en producción usar Sentry, LogRocket, etc.)
  private logError(error: AppError) {
    const logData = {
      timestamp: new Date().toISOString(),
      type: error.type,
      message: error.message,
      details: error.details,
      userMessage: error.userMessage,
    };

    // En desarrollo log a console
    if (import.meta.env.DEV) {
      console.error('[ErrorHandler]', logData);
    }

    // En producción enviar a servicio de logging
    // if (!import.meta.env.DEV) {
    //   this.sendToLoggingService(logData);
    // }
  }

  // Enviar a servicio de logging (ejemplo para producción)
  private async sendToLoggingService(logData: any) {
    try {
      // Aquí se implementaría el envío a Sentry, LogRocket, etc.
      // await fetch('/api/log-error', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logData),
      // });
    } catch (e) {
      console.error('Error al enviar log:', e);
    }
  }
}

// Instancia global del handler de errores
export const errorHandler = ErrorHandler.getInstance();

// Hook personalizado para manejo de errores
export const useErrorHandler = () => {
  const handleError = (error: unknown, context?: string): AppError => {
    return errorHandler.handle(error, context);
  };

  const handleAsync = async <T>(
    asyncFn: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, context);
      return null;
    }
  };

  return { handleError, handleAsync };
};