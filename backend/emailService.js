const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

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
        this.fromEmail = process.env.FROM_EMAIL || 'wanderson.goncalves@grupobrisanet.com.br';
        this.initializeEmailService();
    }

    initializeEmailService() {
        console.log('📧 [INIT] Inicializando Email Service unificado com Gmail...');
        console.log('📧 [INIT] GMAIL_APP_PASSWORD exists:', !!process.env.GMAIL_APP_PASSWORD);
        console.log('📧 [INIT] FROM_EMAIL:', this.fromEmail);
        
        if (!process.env.GMAIL_APP_PASSWORD) {
            console.error('❌ [INIT] GMAIL_APP_PASSWORD não configurada');
            return;
        }

        try {
            console.log('📧 [INIT] Criando transporter Gmail...');
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: this.fromEmail,
                    pass: process.env.GMAIL_APP_PASSWORD
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
            
            console.log('✅ [INIT] Transporter Gmail criado com sucesso!');
            
            // Verificar conexão
            this.transporter.verify((error, success) => {
                if (error) {
                    console.error('❌ [INIT] Erro na verificação do transporter:', error);
                } else {
                    console.log('✅ [INIT] Gmail SMTP verificado e pronto para uso!');
                }
            });
            
        } catch (error) {
            console.error('❌ [INIT] Erro ao criar transporter Gmail:', error);
            this.transporter = null;
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

    // Método para novo agendamento
    async sendNovoAgendamentoEmail({ agendamento, fornecedor }) {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🆕 Novo Agendamento</h1>
                    <p style="color: #e2e8f0; margin: 10px 0 0 0;">Sistema BrisaLOG Portal</p>
                </div>
                
                <div style="padding: 30px;">
                    <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 20px;">
                        <h2 style="color: #1e40af; margin: 0 0 15px 0;">Dados do Agendamento</h2>
                        <p style="margin: 8px 0;"><strong>Código:</strong> ${agendamento.codigo}</p>
                        <p style="margin: 8px 0;"><strong>Fornecedor:</strong> ${fornecedor.nome}</p>
                        <p style="margin: 8px 0;"><strong>Email Fornecedor:</strong> ${fornecedor.email}</p>
                        <p style="margin: 8px 0;"><strong>CNPJ:</strong> ${fornecedor.documento}</p>
                        <p style="margin: 8px 0;"><strong>Data/Hora:</strong> ${new Date(agendamento.dataHora).toLocaleString('pt-BR')}</p>
                        <p style="margin: 8px 0;"><strong>CD:</strong> ${agendamento.cd?.nome || 'N/A'}</p>
                        ${agendamento.observacoes ? `<p style="margin: 8px 0;"><strong>Observações:</strong> ${agendamento.observacoes}</p>` : ''}
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://brisalog2-production.up.railway.app/consultar-status.html?codigo=${agendamento.codigo}" 
                           style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Consultar Status do Agendamento
                        </a>
                    </div>
                </div>
                
                <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; color: #64748b; font-size: 14px;">
                        © 2025 BrisaLOG Portal - Sistema de Agendamento de Entregas
                    </p>
                </div>
            </div>
        `;

        // Enviar para equipe interna
        return this._send({
            to: 'wandevpb@gmail.com', // Email da equipe
            subject: `[BrisaLOG] Novo Agendamento - ${fornecedor.nome} - ${agendamento.codigo}`,
            html
        });
    }

    // Método para confirmação de agendamento ao fornecedor
    async sendConfirmacaoAgendamento({ agendamento, fornecedor }) {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Agendamento Confirmado</h1>
                    <p style="color: #d1fae5; margin: 10px 0 0 0;">Agendamento realizado para: ${fornecedor.nome}</p>
                </div>
                
                <div style="padding: 30px;">
                    <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 20px;">
                        <h2 style="color: #065f46; margin: 0 0 15px 0;">Detalhes do Agendamento</h2>
                        <p style="margin: 8px 0;"><strong>Fornecedor:</strong> ${fornecedor.nome}</p>
                        <p style="margin: 8px 0;"><strong>Código de Acompanhamento:</strong> <span style="background: #fbbf24; color: #92400e; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${agendamento.codigo}</span></p>
                        <p style="margin: 8px 0;"><strong>Data/Hora:</strong> ${new Date(agendamento.dataHora).toLocaleString('pt-BR')}</p>
                        <p style="margin: 8px 0;"><strong>CD de Destino:</strong> ${agendamento.cd?.nome || 'N/A'}</p>
                        <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">Agendado</span></p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://brisalog2-production.up.railway.app/consultar-status.html?codigo=${agendamento.codigo}" 
                           style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Consultar Status do Agendamento
                        </a>
                    </div>
                </div>
                
                <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; color: #64748b; font-size: 14px;">
                        © 2025 BrisaLOG Portal - Sistema de Agendamento de Entregas
                    </p>
                </div>
            </div>
        `;

        // Enviar para o fornecedor (SEM RESTRIÇÕES!)
        return this._send({
            to: fornecedor.email,
            subject: `[BrisaLOG] Confirmação de Agendamento - ${fornecedor.nome} - ${agendamento.codigo}`,
            html
        });
    }

    // Gerar token de reset de senha
    generateResetToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // E-mail de recuperação de senha
    async sendPasswordResetEmail(email, token, nomeUsuario) {
        const resetUrl = `${process.env.FRONTEND_URL || 'https://brisalog2-production.up.railway.app'}/redefinir-senha.html?token=${token}&email=${encodeURIComponent(email)}`;
        
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

    // Utilitário de envio unificado
    async _send({ to, subject, html }) {
        if (!this.transporter) {
            console.error('❌ Transporter não inicializado');
            return { success: false, error: 'Transporter não inicializado' };
        }

        const mailOptions = {
            from: {
                name: 'BrisaLOG Portal',
                address: this.fromEmail
            },
            to: to,
            subject: subject,
            html: html,
            text: html.replace(/<[^>]*>/g, '') // Versão texto simples
        };

        try {
            console.log(`📧 [GMAIL] Enviando email para: ${to}`);
            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ [GMAIL] Email enviado! ID: ${result.messageId}`);
            
            return { 
                success: true, 
                messageId: result.messageId,
                method: 'GMAIL_SMTP'
            };
        } catch (error) {
            console.error(`❌ [GMAIL] Erro ao enviar email:`, error.message);
            return { 
                success: false, 
                error: error.message,
                method: 'GMAIL_SMTP'
            };
        }
    }
}

module.exports = new EmailService();