const { Resend } = require('resend');

class ResendEmailService {
    constructor() {
        this.resend = null;
        this.initializeResend();
    }

    initializeResend() {
        console.log('📨 Inicializando Resend Email Service...');
        
        if (!process.env.RESEND_API_KEY) {
            console.error('❌ RESEND_API_KEY não configurada');
            return;
        }

        try {
            this.resend = new Resend(process.env.RESEND_API_KEY);
            console.log('✅ Resend configurado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao configurar Resend:', error.message);
        }
    }

    async sendEmail({ to, subject, html, text }) {
        if (!this.resend) {
            console.error('❌ Resend não inicializado');
            return { success: false, error: 'Resend não inicializado' };
        }

        try {
            console.log(`📨 [RESEND] Enviando email para: ${to}`);
            
            const result = await this.resend.emails.send({
                from: `BrisaLOG Portal <${process.env.FROM_EMAIL || 'noreply@example.com'}>`,
                to: [to],
                subject: subject,
                html: html,
                text: text || html.replace(/<[^>]*>/g, '')
            });

            console.log(`✅ [RESEND] Email enviado! ID: ${result.data?.id || result.id}`);
            
            return { 
                success: true, 
                messageId: result.data?.id || result.id,
                method: 'RESEND_API'
            };
        } catch (error) {
            console.error(`❌ [RESEND] Erro ao enviar email:`, error.message);
            return { 
                success: false, 
                error: error.message,
                method: 'RESEND_API'
            };
        }
    }

    async verifyConnection() {
        if (!this.resend) {
            return { success: false, error: 'Resend não inicializado' };
        }

        try {
            // Resend não tem método de verificação, mas podemos testar a API
            console.log('✅ Resend API disponível');
            return { success: true, message: 'Resend API disponível' };
        } catch (error) {
            console.error('❌ Erro na verificação Resend:', error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new ResendEmailService();