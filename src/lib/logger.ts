// Logger centralizado con niveles y contexto
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private prefix = '[Construsmart]';

  private log(level: LogLevel, context: string, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      context,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    const formatted = `${this.prefix}[${context}] ${message}`;

    switch (level) {
      case 'error':
        console.error(formatted, data || '');
        // Track error for monitoring
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'error_log', {
            error_message: message,
            error_context: context,
          });
        }
        break;
      case 'warn':
        console.warn(formatted, data || '');
        break;
      case 'info':
        console.log(formatted, data || '');
        break;
      case 'debug':
        if (import.meta.env.DEV) {
          console.debug(formatted, data || '');
        }
        break;
    }

    // In production, could send to a logging endpoint
    if (level === 'error' && !import.meta.env.DEV) {
      // Silent fail - no blocking operations
    }
  }

  info(context: string, message: string, data?: any) {
    this.log('info', context, message, data);
  }

  warn(context: string, message: string, data?: any) {
    this.log('warn', context, message, data);
  }

  error(context: string, message: string, data?: any) {
    this.log('error', context, message, data);
  }

  debug(context: string, message: string, data?: any) {
    this.log('debug', context, message, data);
  }
}

export const logger = new Logger();