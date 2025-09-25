/**
 * Production-safe Logger
 * Console.log'ları production'da otomatik kapatır
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Renkli console için helper
const colors = {
  info: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  debug: '#8B5CF6'
};

class Logger {
  private enabled: boolean;

  constructor() {
    this.enabled = isDevelopment;
  }

  private formatMessage(level: string, message: string, ...args: any[]) {
    if (!this.enabled) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const color = colors[level as keyof typeof colors] || '#6B7280';
    
    console.log(
      `%c[${timestamp}] [${level.toUpperCase()}]%c ${message}`,
      `color: ${color}; font-weight: bold;`,
      'color: inherit;',
      ...args
    );
  }

  info(message: string, ...args: any[]) {
    this.formatMessage('info', message, ...args);
  }

  success(message: string, ...args: any[]) {
    this.formatMessage('success', message, ...args);
  }

  warning(message: string, ...args: any[]) {
    this.formatMessage('warning', message, ...args);
  }

  error(message: string, ...args: any[]) {
    // Error'lar production'da da görünsün (Sentry'ye gönderilmek üzere)
    if (isProduction) {
      console.error(`[ERROR] ${message}`, ...args);
    } else {
      this.formatMessage('error', message, ...args);
    }
  }

  debug(message: string, ...args: any[]) {
    if (isDevelopment) {
      this.formatMessage('debug', message, ...args);
    }
  }

  // Grup loglama
  group(label: string) {
    if (this.enabled) {
      console.group(label);
    }
  }

  groupEnd() {
    if (this.enabled) {
      console.groupEnd();
    }
  }

  // Tablo olarak loglama
  table(data: any) {
    if (this.enabled) {
      console.table(data);
    }
  }

  // Performans ölçümü
  time(label: string) {
    if (this.enabled) {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (this.enabled) {
      console.timeEnd(label);
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Global console override (opsiyonel - tehlikeli olabilir)
export function overrideConsole() {
  if (isProduction) {
    console.log = () => {};
    console.info = () => {};
    console.warn = () => {};
    console.debug = () => {};
    // console.error'ı override etmiyoruz - hatalar görünsün
  }
}

// Export for backward compatibility
export default logger;

