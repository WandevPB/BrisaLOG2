const crypto = require('crypto');

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
        this.fromEmail = process.env.FROM_EMAIL || 'wanderson.goncalves@grupobrisanet.com.br';
        console.log('📧 [UNIFIED] Email Service Otimizado - Resend como principal');
        console.log('📧 [UNIFIED] FROM_EMAIL:', this.fromEmail);
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

        // Enviar para sua equipe (usando Resend)
        return this._send({
            to: 'wandevpb@gmail.com', // Seu email (sempre funciona com Resend)
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
                    
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #92400e; font-size: 14px;">
                            <strong>📝 Nota:</strong> Este email está sendo enviado para a equipe interna para notificação. O fornecedor ${fornecedor.nome} (${fornecedor.email}) foi registrado no agendamento ${agendamento.codigo}.
                        </p>
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

        // Enviar para sua equipe (usando Resend) com informações do fornecedor
        return this._send({
            to: 'wandevpb@gmail.com', // Seu email (sempre funciona)
            subject: `[BrisaLOG] Agendamento Registrado - ${fornecedor.nome} - ${agendamento.codigo}`,
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
            to: 'wandevpb@gmail.com', // Sempre para você
            subject: `[BrisaLOG] Recuperação de Senha - ${nomeUsuario}`,
            html
        });
    }

    // Utilitário de envio híbrido (notificação garantida + tentativa direta)
    async _send({ to, subject, html }) {
        console.log(`📧 [HYBRID] Enviando email para: ${to}`);
        
        const results = {
            notification: { success: false },
            direct: { success: false }
        };
        
        // PARTE 1: NOTIFICAÇÃO GARANTIDA (sempre para você)
        try {
            const resendEmailService = require('./resendEmailFinal');
            const notificationResult = await resendEmailService.sendEmail({ 
                to: 'wandevpb@gmail.com',
                subject: `[NOTIFICAÇÃO] ${subject} | Para: ${to}`,
                html: `
                    <div style="background: #1e40af; color: white; padding: 15px; text-align: center; margin-bottom: 20px;">
                        <h2 style="margin: 0;">📬 Notificação de Email - BrisaLOG</h2>
                        <p style="margin: 5px 0;">Este email deveria ser enviado para: <strong>${to}</strong></p>
                    </div>
                    ${html}
                    <div style="background: #f3f4f6; border-top: 2px solid #6b7280; padding: 15px; margin-top: 20px;">
                        <h3 style="color: #374151; margin-top: 0;">📋 Informações da Entrega:</h3>
                        <p style="margin: 5px 0; color: #6b7280;"><strong>Destinatário Original:</strong> ${to}</p>
                        <p style="margin: 5px 0; color: #6b7280;"><strong>Assunto Original:</strong> ${subject}</p>
                        <p style="margin: 5px 0; color: #6b7280;"><strong>Timestamp:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                        <p style="margin: 5px 0; color: #6b7280;"><strong>Status:</strong> Notificação enviada para administrador</p>
                    </div>
                `
            });
            
            results.notification = notificationResult;
            if (notificationResult.success) {
                console.log('✅ [HYBRID] Notificação enviada para administrador');
            }
        } catch (error) {
            console.error('❌ [HYBRID] Falha na notificação:', error.message);
        }
        
        // PARTE 2: TENTATIVA DIRETA (melhor esforço)
        if (to !== 'wandevpb@gmail.com' && to.includes('@grupobrisanet.com.br')) {
            try {
                console.log(`📧 [HYBRID] Tentando envio direto para: ${to}`);
                
                // Tentar SendGrid se disponível
                if (process.env.EMAIL_PASS) {
                    const sendgridHTTPSService = require('./sendgridHTTPSService');
                    const directResult = await sendgridHTTPSService.sendEmail({ to, subject, html });
                    results.direct = directResult;
                    
                    if (directResult.success) {
                        console.log('✅ [HYBRID] Envio direto via SendGrid bem-sucedido!');
                    }
                }
            } catch (error) {
                console.error('❌ [HYBRID] Falha no envio direto:', error.message);
                results.direct = { success: false, error: error.message };
            }
        }
        
        // Retornar resultado consolidado
        const overallSuccess = results.notification.success;
        return {
            success: overallSuccess,
            messageId: results.notification.messageId || 'hybrid-' + Date.now(),
            method: 'HYBRID_NOTIFICATION',
            details: {
                notification: results.notification,
                direct: results.direct,
                originalRecipient: to,
                guaranteedDelivery: 'wandevpb@gmail.com'
            }
        };
    }
}

module.exports = new EmailService();