/**
 * Utilitários de Formatação de Data - BrisaLOG
 * Centraliza todas as funções de formatação de data do sistema
 */

class DateFormatter {
    /**
     * Converte data ISO ou YYYY-MM-DD para DD/MM/YYYY
     * @param {string} dateString - Data no formato ISO ou YYYY-MM-DD
     * @returns {string} Data no formato DD/MM/YYYY
     */
    static formatDate(dateString) {
        if (!dateString) return '';
        
        // Extrai apenas a parte da data (YYYY-MM-DD)
        const [isoDate] = dateString.split('T');
        if (!isoDate || isoDate.length < 10) return '';
        
        const [ano, mes, dia] = isoDate.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    /**
     * Formata data e hora completa
     * @param {string|Date} dateString - Data/hora
     * @returns {string} Data e hora formatada em pt-BR
     */
    static formatDateTime(dateString) {
        if (!dateString) return 'Data/Hora não informada';
        
        try {
            const date = new Date(dateString);
            
            if (isNaN(date.getTime())) {
                return 'Data/Hora inválida';
            }
            
            return date.toLocaleString('pt-BR');
        } catch (error) {
            console.error('Erro ao formatar data/hora:', error, 'Data:', dateString);
            return 'Data/Hora inválida';
        }
    }

    /**
     * Formata data e horário separados
     * @param {string|Date} data - Data
     * @param {string} horario - Horário
     * @returns {string} Data e horário formatados
     */
    static formatarDataHora(data, horario) {
        const dataFormatada = DateFormatter.formatDate(data);
        return `${dataFormatada} ${horario}`;
    }

    /**
     * Cria objeto Date de forma segura
     * @param {string} dateString - String de data
     * @returns {Date} Objeto Date válido
     */
    static createSafeDate(dateString) {
        if (!dateString) return new Date();
        
        try {
            let date;
            
            // Se é formato YYYY-MM-DD, adiciona hora zero
            if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                date = new Date(dateString + 'T00:00:00');
            } else {
                date = new Date(dateString);
            }
            
            return isNaN(date.getTime()) ? new Date() : date;
        } catch (error) {
            console.error('Erro ao criar data:', error, 'Data:', dateString);
            return new Date();
        }
    }

    /**
     * Converte data ISO para Date local (sem efeito fuso horário)
     * @param {string} dateInput - Data ISO ou YYYY-MM-DD
     * @returns {Date|null} Date local ou null
     */
    static parseLocalDate(dateInput) {
        if (!dateInput) return null;
        
        if (typeof dateInput === 'string') {
            if (dateInput.includes('T')) {
                // Formato ISO - extrair apenas YYYY-MM-DD
                const dateOnly = dateInput.split('T')[0];
                const [ano, mes, dia] = dateOnly.split('-').map(Number);
                return new Date(ano, mes - 1, dia);
            } else if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // Formato YYYY-MM-DD
                const [ano, mes, dia] = dateInput.split('-').map(Number);
                return new Date(ano, mes - 1, dia);
            }
        }
        
        return new Date(dateInput);
    }

    /**
     * Converte Date para YYYY-MM-DD
     * @param {Date} date - Objeto Date
     * @returns {string} Data no formato YYYY-MM-DD
     */
    static toYYYYMMDD(date) {
        if (!date || isNaN(date.getTime())) return '';
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }

    /**
     * Verifica se uma data é hoje
     * @param {string|Date} dateString - Data a verificar
     * @returns {boolean} True se for hoje
     */
    static isToday(dateString) {
        const today = this.toYYYYMMDD(new Date());
        const checkDate = typeof dateString === 'string' ? dateString.split('T')[0] : this.toYYYYMMDD(dateString);
        return today === checkDate;
    }

    /**
     * Verifica se é dia útil (segunda a sexta)
     * @param {Date} date - Data a verificar
     * @returns {boolean} True se for dia útil
     */
    static isWeekday(date) {
        const day = date.getDay();
        return day !== 0 && day !== 6; // 0=domingo, 6=sábado
    }

    /**
     * Encontra o próximo dia útil
     * @param {Date} date - Data de referência
     * @returns {Date} Próximo dia útil
     */
    static getNextWeekday(date) {
        const nextDay = new Date(date);
        while (!this.isWeekday(nextDay)) {
            nextDay.setDate(nextDay.getDate() + 1);
        }
        return nextDay;
    }

    /**
     * Calcula diferença em dias entre duas datas
     * @param {string|Date} date1 - Primeira data
     * @param {string|Date} date2 - Segunda data
     * @returns {number} Diferença em dias
     */
    static getDaysDifference(date1, date2) {
        const d1 = typeof date1 === 'string' ? new Date(date1.split('T')[0]) : date1;
        const d2 = typeof date2 === 'string' ? new Date(date2.split('T')[0]) : date2;
        
        return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.DateFormatter = DateFormatter;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DateFormatter;
}
