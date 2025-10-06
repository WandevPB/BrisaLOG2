const nodemailer = require('nodemailer');

class RailwayEmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        console.log('🚂 Inicializando Railway Email Service...');
        
        if (!process.env.GMAIL_APP_PASSWORD) {
            console.error('❌ GMAIL_APP_PASSWORD não configurada');
            return;
        }

        // Configuração otimizada para Railway
        this.transporter = nodemailer.createTransport({
            service: 'gmail', // Usar service em vez de host/port
            auth: {
                user: process.env.FROM_EMAIL || 'wanderson.goncalves@grupobrisanet.com.br',
                pass: process.env.GMAIL_APP_PASSWORD
            },
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            rateLimit: 14 // emails por segundo
        });

        console.log('✅ Railway SMTP configurado com Gmail service');
    }

    async sendEmail({ to, subject, html, text }) {
        if (!this.transporter) {
            console.error('❌ Transporter não inicializado');
            return { success: false, error: 'Transporter não inicializado' };
        }

        const mailOptions = {
            from: {
                name: 'BrisaLOG Portal',
                address: 'wanderson.goncalves@grupobrisanet.com.br'
            },
            to: to,
            subject: subject,
            html: html,
            text: text || html.replace(/<[^>]*>/g, '') // Remove HTML tags para texto
        };

        try {
            console.log(`📧 [RAILWAY] Enviando email para: ${to}`);
            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ [RAILWAY] Email enviado! ID: ${result.messageId}`);
            
            return { 
                success: true, 
                messageId: result.messageId,
                method: 'RAILWAY_SMTP'
            };
        } catch (error) {
            console.error(`❌ [RAILWAY] Erro ao enviar email:`, error.message);
            return { 
                success: false, 
                error: error.message,
                method: 'RAILWAY_SMTP'
            };
        }
    }

    // Métodos específicos para agendamentos
    async sendNovoAgendamentoEmail({ agendamento, fornecedor }) {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">🆕 Novo Agendamento - BrisaLOG</h2>
                
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Dados do Agendamento:</h3>
                    <p><strong>Fornecedor:</strong> ${fornecedor.nomeFantasia}</p>
                    <p><strong>CNPJ:</strong> ${fornecedor.cnpj}</p>
                    <p><strong>Data/Hora:</strong> ${agendamento.dataHora}</p>
                    <p><strong>Observações:</strong> ${agendamento.observacoes}</p>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                    Sistema BrisaLOG - Portal de Agendamentos
                </p>
            </div>
        `;

        return this.sendEmail({
            to: 'wanderson.goncalves@grupobrisanet.com.br',
            subject: `[BrisaLOG] Novo Agendamento - ${fornecedor.nomeFantasia}`,
            html
        });
    }
}

module.exports = new RailwayEmailService();