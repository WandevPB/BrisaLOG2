/**
 * Sistema de Logger - BrisaLOG
 * Controla logs com níveis (development/production)
 */

class Logger {
    static isDevelopment = process.env.NODE_ENV !== 'production';
    static isProduction = !Logger.isDevelopment;

    /**
     * Log de informação (sempre visível)
     */
    static info(message, ...args) {
        console.log(`ℹ️ [INFO] ${message}`, ...args);
    }

    /**
     * Log de sucesso (sempre visível)
     */
    static success(message, ...args) {
        console.log(`✅ [SUCCESS] ${message}`, ...args);
    }

    /**
     * Log de erro (sempre visível)
     */
    static error(message, ...args) {
        console.error(`❌ [ERROR] ${message}`, ...args);
    }

    /**
     * Log de warning (sempre visível)
     */
    static warn(message, ...args) {
        console.warn(`⚠️ [WARN] ${message}`, ...args);
    }

    /**
     * Log de debug (apenas em development)
     */
    static debug(message, ...args) {
        if (Logger.isDevelopment) {
            console.log(`🔍 [DEBUG] ${message}`, ...args);
        }
    }

    /**
     * Log de API request (apenas em development)
     */
    static api(method, endpoint, ...args) {
        if (Logger.isDevelopment) {
            console.log(`📡 [API] ${method} ${endpoint}`, ...args);
        }
    }

    /**
     * Log de database (apenas em development)
     */
    static db(operation, ...args) {
        if (Logger.isDevelopment) {
            console.log(`💾 [DB] ${operation}`, ...args);
        }
    }

    /**
     * Log de email (reduzido em production)
     */
    static email(action, to, ...args) {
        if (Logger.isDevelopment) {
            console.log(`📧 [EMAIL] ${action} -> ${to}`, ...args);
        } else {
            // Em produção, log simplificado
            console.log(`📧 [EMAIL] ${action} enviado`);
        }
    }

    /**
     * Log de autenticação
     */
    static auth(action, user, ...args) {
        if (Logger.isDevelopment) {
            console.log(`🔐 [AUTH] ${action} - ${user}`, ...args);
        } else {
            console.log(`🔐 [AUTH] ${action}`);
        }
    }

    /**
     * Agrupa logs relacionados (apenas development)
     */
    static group(label, callback) {
        if (Logger.isDevelopment) {
            console.group(label);
            callback();
            console.groupEnd();
        } else {
            // Em produção, executa sem agrupar
            callback();
        }
    }

    /**
     * Mede tempo de execução (apenas development)
     */
    static time(label) {
        if (Logger.isDevelopment) {
            console.time(label);
        }
    }

    static timeEnd(label) {
        if (Logger.isDevelopment) {
            console.timeEnd(label);
        }
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}
