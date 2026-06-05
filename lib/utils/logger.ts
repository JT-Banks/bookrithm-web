/**
 * Custom Logger Utility
 * 
 * Provides controlled logging that:
 * - Only outputs to console in development
 * - Can be extended to send errors to monitoring services in production
 * - Centralizes error handling logic
 */

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Log an error
   * In production, this should send to your monitoring service (Sentry, DataDog, etc.)
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error, context);
    } else {
      // TODO: Send to monitoring service in production
      // Example: Sentry.captureException(error, { extra: context });
    }
  }

  /**
   * Log a warning
   * Used for non-critical issues that should be investigated
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, context);
    } else {
      // TODO: Send to monitoring service if needed
    }
  }

  /**
   * Log informational messages
   * Used for debugging and development
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, context);
    }
  }

  /**
   * Log debug messages
   * Only shown in development, never in production
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context);
    }
  }

  /**
   * Log API errors with structured data
   * Useful for tracking API-specific issues
   */
  apiError(endpoint: string, error: unknown, statusCode?: number): void {
    this.error('API request failed', error, {
      endpoint,
      statusCode,
      timestamp: new Date().toISOString(),
    });
  }
}

// Export a singleton instance
export const logger = new Logger();
