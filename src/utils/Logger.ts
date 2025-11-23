/**
 * Logger Utility
 * Centralized logging that only outputs in development mode
 * Replaces direct console.log calls for better control and production safety
 */

const isDevelopment = import.meta.env.DEV;

export class Logger {
    /**
     * Log informational messages
     */
    static info(...args: unknown[]): void {
        if (isDevelopment) {
            console.log('[INFO]', ...args);
        }
    }

    /**
     * Log warning messages
     */
    static warn(...args: unknown[]): void {
        if (isDevelopment) {
            console.warn('[WARN]', ...args);
        }
    }

    /**
     * Log error messages (always logged, even in production)
     */
    static error(...args: unknown[]): void {
        console.error('[ERROR]', ...args);
    }

    /**
     * Log debug messages (only in development)
     */
    static debug(...args: unknown[]): void {
        if (isDevelopment) {
            console.debug('[DEBUG]', ...args);
        }
    }

    /**
     * Log with custom label
     */
    static log(label: string, ...args: unknown[]): void {
        if (isDevelopment) {
            console.log(`[${label}]`, ...args);
        }
    }

    /**
     * Log objects in a formatted way
     */
    static table(data: unknown): void {
        if (isDevelopment && console.table) {
            console.table(data);
        }
    }

    /**
     * Group related log messages
     */
    static group(label: string, callback: () => void): void {
        if (isDevelopment) {
            console.group(label);
            callback();
            console.groupEnd();
        }
    }

    /**
     * Start a timer
     */
    static time(label: string): void {
        if (isDevelopment) {
            console.time(label);
        }
    }

    /**
     * End a timer
     */
    static timeEnd(label: string): void {
        if (isDevelopment) {
            console.timeEnd(label);
        }
    }
}

export default Logger;
