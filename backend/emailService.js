const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');
require('dotenv').config();


const path = require('path');

// Importar templates
const templateConfirmado = require('./emails/confirmado');
const templateEntregue = require('./emails/entregue');
const templateNaoVeio = require('./emails/naoVeio');
const templateReagendamento = require('./emails/reagendamento');
const templateRespostaReagendamento = require('./emails/respostaReagendamento');
const templateCanceladoFornecedor = require('./emails/canceladoFornecedor');
const templateEntregaSemAgendamento = require('./emails/entregaSemAgendamento');

class EmailService {
    constructor() {
        this.transporter = null;
        this.useSendGridAPI = false;
        this.initializeEmailService();
    }

    initializeEmailService() {
        try {
            // Log para depuração das variáveis de ambiente
            console.log('EMAIL_USER:', process.env.EMAIL_USER);
            console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '[PROVIDED]' : '[MISSING]');
            console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
            
            // Se for SendGrid, tentar API primeiro
            if (process.env.EMAIL_HOST === 'smtp.sendgrid.net' || process.env.EMAIL_SERVICE === 'SendGrid') {
                this.initializeSendGridAPI();
            } else {
                this.initializeTransporter();
            }
        } catch (error) {
            console.error('❌ Erro ao inicializar serviço de e-mail:', error.message);
            console.log('📧 Sistema continuará funcionando sem emails');
        }
    }

    initializeSendGridAPI() {
        try {
            if (!process.env.EMAIL_PASS) {
                throw new Error('SendGrid API Key não encontrada');
            }
            
            sgMail.setApiKey(process.env.EMAIL_PASS);
            this.useSendGridAPI = true;
            console.log('✅ SendGrid API configurada com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao configurar SendGrid API:', error.message);
            console.log('🔄 Tentando SMTP como fallback...');
            this.initializeTransporter();
        }
    }

    initializeTransporter() {
        try {
            // Log para depuração das variáveis de ambiente
            console.log('EMAIL_USER:', process.env.EMAIL_USER);
            console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '[PROVIDED]' : '[MISSING]');
            console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
            
            this.transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || 'smtp.sendgrid.net',
                port: parseInt(process.env.EMAIL_PORT) || 587,
                secure: process.env.EMAIL_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_USER || 'apikey',
                    pass: process.env.EMAIL_PASS
                },
                // Configurações de timeout e retry
                connectionTimeout: parseInt(process.env.EMAIL_TIMEOUT) || 10000,
                greetingTimeout: 5000,
                socketTimeout: 10000
            });

            // Verificação com timeout
            const verifyTimeout = setTimeout(() => {
                console.log('⚠️ Verificação de email timeout - prosseguindo sem verificação');
            }, 5000);

            this.transporter.verify((error, success) => {
                clearTimeout(verifyTimeout);
                if (error) {
                    console.error('❌ Erro na configuração de e-mail:', error.message);
                    console.log('📧 Sistema continuará funcionando sem emails');
                } else {
                    console.log('✅ Servidor de e-mail configurado com sucesso');
                }
            });
        } catch (error) {
            console.error('❌ Erro ao inicializar serviço de e-mail:', error.message);
            console.log('📧 Sistema continuará funcionando sem emails');
        }
    }

    // E-mail de confirmação de agendamento
    async sendConfirmadoEmail({ to, fornecedorNome, agendamentoCodigo, cdNome, consultaUrl }) {
        const html = templateConfirmado({ fornecedorNome, agendamentoCodigo, cdNome, consultaUrl });
        return this._send({
            to,
            subject: '[BrisaLOG] Agendamento Confirmado',
            html
        });
    }

    // E-mail de entrega realizada
    async sendEntregueEmail({ to, fornecedorNome, agendamentoCodigo, cdNome, consultaUrl }) {
        const html = templateEntregue({ fornecedorNome, agendamentoCodigo, cdNome, consultaUrl });
        return this._send({
            to,
            subject: '[BrisaLOG] Entrega Realizada',
            html
        });
    }

    // E-mail de não comparecimento
    async sendNaoVeioEmail({ to, fornecedorNome, agendamentoCodigo, cdNome, consultaUrl }) {
        const html = templateNaoVeio({ fornecedorNome, agendamentoCodigo, cdNome, consultaUrl });
        return this._send({
            to,
            subject: '[BrisaLOG] Entrega Não Realizada',
            html
        });
    }

    // E-mail de reagendamento
    async sendReagendamentoEmail({ to, fornecedorNome, agendamentoCodigo, cdNome, dataOriginal, novaDataSugerida, novoHorario, motivo, consultaUrl }) {
        const html = templateReagendamento({ fornecedorNome, agendamentoCodigo, cdNome, dataOriginal, novaDataSugerida, novoHorario, motivo, consultaUrl });
        return this._send({
            to,
            subject: `[BrisaLOG] Solicitação de Reagendamento - ${agendamentoCodigo}`,
            html
        });
    }

    // E-mail de resposta ao reagendamento
    async sendRespostaReagendamentoEmail({ to, fornecedorNome, agendamentoCodigo, resposta, novaData, novoHorario, comentario, consultaUrl }) {
        const html = templateRespostaReagendamento({ fornecedorNome, agendamentoCodigo, resposta, novaData, novoHorario, comentario, consultaUrl });
        return this._send({
            to,
            subject: '[BrisaLOG] Resposta ao Reagendamento',
            html
        });
    }

    // E-mail de cancelamento pelo fornecedor
    async sendCanceladoFornecedorEmail({ to, fornecedorNome, agendamentoCodigo, motivo, consultaUrl }) {
        const html = templateCanceladoFornecedor({ fornecedorNome, agendamentoCodigo, motivo, consultaUrl });
        return this._send({
            to,
            subject: '[BrisaLOG] Solicitação Cancelada',
            html
        });
    }

    // E-mail de entrega sem agendamento (registrada pelo CD)
    async sendEntregaSemAgendamentoEmail({ to, fornecedorNome, agendamentoCodigo, cdNome, dataEntrega, horarioEntrega, consultaUrl, agendamentoUrl }) {
        const html = templateEntregaSemAgendamento({ fornecedorNome, agendamentoCodigo, cdNome, dataEntrega, horarioEntrega, consultaUrl, agendamentoUrl });
        return this._send({
            to,
            subject: '[BrisaLOG] Entrega Registrada - Use o Agendamento!',
            html
        });
    }

    // Gerar token de reset de senha
    generateResetToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // E-mail de recuperação de senha
    async sendPasswordResetEmail(email, token, nomeUsuario) {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/redefinir-senha.html?token=${token}&email=${encodeURIComponent(email)}`;
        
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Recuperação de Senha - BrisaLOG</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #ff7f00 0%, #ff4500 100%); color: white; text-align: center; padding: 30px;">
                    <h1 style="margin: 0; font-size: 28px;">🔐 BrisaLOG Portal</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Recuperação de Senha</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                    <h2 style="color: #333; margin-bottom: 20px;">Olá, ${nomeUsuario}!</h2>
                    
                    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                        Você solicitou a recuperação de senha para sua conta no BrisaLOG Portal.
                    </p>
                    
                    <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                        Clique no botão abaixo para redefinir sua senha:
                    </p>
                    
                    <div style="text-align: center; margin-bottom: 30px;">
                        <a href="${resetUrl}" 
                           style="background: linear-gradient(135deg, #ff7f00 0%, #ff4500 100%); 
                                  color: white; 
                                  text-decoration: none; 
                                  padding: 12px 30px; 
                                  border-radius: 25px; 
                                  font-weight: bold; 
                                  display: inline-block;
                                  box-shadow: 0 4px 15px rgba(255, 127, 0, 0.4);">
                            🔐 Redefinir Senha
                        </a>
                    </div>
                    
                    <div style="background-color: #fff3e0; border-left: 4px solid #ff8f00; padding: 15px; margin-bottom: 20px;">
                        <p style="margin: 0; color: #e65100; font-size: 14px;">
                            <strong>⚠️ Importante:</strong> Este link expira em 1 hora por segurança.
                        </p>
                    </div>
                    
                    <p style="color: #999; font-size: 12px; line-height: 1.5;">
                        Se você não solicitou esta recuperação, ignore este e-mail. Sua senha permanecerá inalterada.
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f8f9fa; text-align: center; padding: 20px; border-top: 1px solid #dee2e6;">
                    <p style="margin: 0; color: #6c757d; font-size: 12px;">
                        © 2025 BrisaLOG Portal - Sistema de Agendamento de Entregas
                    </p>
                </div>
            </div>
        </body>
        </html>`;

        return this._send({
            to: email,
            subject: '[BrisaLOG] Recuperação de Senha',
            html
        });
    }

    // Utilitário de envio
    async _send({ to, subject, html }) {
        // Se estiver usando SendGrid API
        if (this.useSendGridAPI) {
            return this._sendWithSendGridAPI({ to, subject, html });
        }
        
        // Fallback para SMTP
        return this._sendWithSMTP({ to, subject, html });
    }

    async _sendWithSendGridAPI({ to, subject, html }) {
        try {
            console.log(`📧 Enviando email via SendGrid API para: ${to}`);
            
            // Versão simplificada sem configurações extras
            const msg = {
                to: to,
                from: 'wanderson.goncalves@grupobrisanet.com.br',
                subject: subject,
                html: html
            };

            console.log('📋 Dados do email:', JSON.stringify(msg, null, 2));
            const result = await sgMail.send(msg);
            console.log(`✅ Email enviado com sucesso via API. Status: ${result[0].statusCode}`);
            return { success: true, messageId: result[0].headers['x-message-id'] };
            
        } catch (error) {
            console.error(`❌ Erro ao enviar email via API para ${to}:`, error.message);
            console.error('📋 Detalhes do erro:', error.response ? error.response.body : 'Sem detalhes');
            return { success: false, error: error.message, details: error.response ? error.response.body : null };
        }
    }

    async _sendWithSMTP({ to, subject, html }) {
        // Verificar se o transporter foi inicializado
        if (!this.transporter) {
            console.log('📧 Email não enviado: transporter não inicializado');
            return { success: false, error: 'Transporter não inicializado' };
        }

        // Verificar se as credenciais estão configuradas
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('📧 Email não enviado: credenciais não configuradas');
            return { success: false, error: 'Credenciais de email não configuradas' };
        }

        const mailOptions = {
            from: {
                name: 'BrisaLOG Portal',
                address: process.env.EMAIL_USER
            },
            to,
            subject,
            html
        };

        try {
            console.log(`📧 Enviando email via SMTP para: ${to}`);
            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email enviado com sucesso via SMTP. ID: ${result.messageId}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error(`❌ Erro ao enviar email via SMTP para ${to}:`, error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new EmailService();
