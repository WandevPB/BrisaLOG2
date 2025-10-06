const nodemailer = require('nodemailer');

class RailwayEmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        console.log('🚂 Inicializando Railway Email Service...');
        
        // Tentar múltiplas configurações para o Railway
        
        // 1. Tentar com Outlook/Hotmail (mais compatível com Railway)
        if (process.env.FROM_EMAIL && process.env.FROM_EMAIL.includes('outlook') || 
            process.env.FROM_EMAIL && process.env.FROM_EMAIL.includes('hotmail')) {
            
            this.transporter = nodemailer.createTransport({
                service: 'hotmail',
                auth: {
                    user: process.env.FROM_EMAIL,
                    pass: process.env.GMAIL_APP_PASSWORD
                }
            });
            console.log('✅ Railway SMTP configurado com Outlook');
            return;
        }
        
        // 2. Configuração manual para Railway (sem SSL/TLS restritivo)
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 25, // Porta 25 pode funcionar melhor no Railway
            secure: false,
            auth: {
                user: process.env.FROM_EMAIL || 'wanderson.goncalves@grupobrisanet.com.br',
                pass: process.env.GMAIL_APP_PASSWORD
            },
            tls: {
                rejectUnauthorized: false,
                ciphers: 'SSLv3'
            },
            connectionTimeout: 60000,
            greetingTimeout: 30000,
            socketTimeout: 60000
        });

        console.log('✅ Railway SMTP configurado com porta 25');
    }

    async sendEmail({ to, subject, html, text }) {
        if (!this.transporter) {
            console.error('❌ Transporter não inicializado');
            return { success: false, error: 'Transporter não inicializado' };
        }

        const mailOptions = {
            from: {
                name: 'BrisaLOG Portal',
                address: process.env.FROM_EMAIL || 'wanderson.goncalves@grupobrisanet.com.br'
            },
            to: to,
            subject: subject,
            html: html,
            text: text || html.replace(/<[^>]*>/g, '')
        };

        try {
            console.log(`📧 [RAILWAY] Enviando email para: ${to}`);
            console.log(`📧 [RAILWAY] Usando FROM: ${mailOptions.from.address}`);
            
            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ [RAILWAY] Email enviado! ID: ${result.messageId}`);
            
            return { 
                success: true, 
                messageId: result.messageId,
                method: 'RAILWAY_SMTP',
                response: result.response
            };
        } catch (error) {
            console.error(`❌ [RAILWAY] Erro ao enviar email:`, error.message);
            console.error(`❌ [RAILWAY] Erro completo:`, error);
            
            return { 
                success: false, 
                error: error.message,
                method: 'RAILWAY_SMTP',
                details: error.code || 'UNKNOWN_ERROR'
            };
        }
    }

    // Método para verificar conexão
    async verifyConnection() {
        if (!this.transporter) {
            return { success: false, error: 'Transporter não inicializado' };
        }

        try {
            await this.transporter.verify();
            console.log('✅ Conexão SMTP verificada com sucesso');
            return { success: true, message: 'Conexão verificada' };
        } catch (error) {
            console.error('❌ Erro na verificação SMTP:', error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new RailwayEmailService();