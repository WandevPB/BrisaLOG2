const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.fromEmail = process.env.FROM_EMAIL || 'wanderson.goncalves@grupobrisanet.com.br';
        this.initializeTransporter();
    }

    initializeTransporter() {
        console.log('📧 [INIT] Inicializando Email Service com Gmail...');
        console.log('📧 [INIT] GMAIL_APP_PASSWORD exists:', !!process.env.GMAIL_APP_PASSWORD);
        console.log('📧 [INIT] FROM_EMAIL:', process.env.FROM_EMAIL);
        
        if (!process.env.GMAIL_APP_PASSWORD) {
            console.error('❌ [INIT] GMAIL_APP_PASSWORD não configurada');
            return;
        }

        try {
            console.log('📧 [INIT] Criando transporter nodemailer...');
            this.transporter = nodemailer.createTransporter({
                service: 'gmail',
                auth: {
                    user: this.fromEmail,
                    pass: process.env.GMAIL_APP_PASSWORD
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
            
            console.log('✅ [INIT] Transporter criado com sucesso!');
            
            // Verificar conexão
            this.transporter.verify((error, success) => {
                if (error) {
                    console.error('❌ [INIT] Erro na verificação do transporter:', error);
                } else {
                    console.log('✅ [INIT] Transporter verificado com sucesso!');
                }
            });
            
        } catch (error) {
            console.error('❌ [INIT] Erro ao criar transporter:', error);
            this.transporter = null;
        }
    }

    async sendEmail({ to, subject, html, text }) {
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
            text: text || html.replace(/<[^>]*>/g, '')
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

    // Email para novo agendamento
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

        // TEMPORÁRIO: Enviar para seu email verificado até configurar domínio
        return this.sendEmail({
            to: 'wandevpb@gmail.com',
            subject: `[BrisaLOG] Novo Agendamento - ${fornecedor.nome} - ${agendamento.codigo}`,
            html
        });
    }

    // Email de confirmação para o fornecedor
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
                        <p style="margin: 8px 0;"><strong>Email Original:</strong> ${fornecedor.email}</p>
                        <p style="margin: 8px 0;"><strong>Código de Acompanhamento:</strong> <span style="background: #fbbf24; color: #92400e; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${agendamento.codigo}</span></p>
                        <p style="margin: 8px 0;"><strong>Data/Hora:</strong> ${new Date(agendamento.dataHora).toLocaleString('pt-BR')}</p>
                        <p style="margin: 8px 0;"><strong>CD de Destino:</strong> ${agendamento.cd?.nome || 'N/A'}</p>
                        <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">Agendado</span></p>
                    </div>
                    
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #92400e; font-size: 14px;">
                            <strong>📝 Importante:</strong> Este email foi enviado para você pois estamos em fase de testes. O fornecedor deve ser notificado pelo código: ${agendamento.codigo}
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

        // TEMPORÁRIO: Enviar para seu email verificado até configurar domínio
        return this.sendEmail({
            to: 'wandevpb@gmail.com',
            subject: `[BrisaLOG] Confirmação de Agendamento - ${fornecedor.nome} - ${agendamento.codigo}`,
            html
        });
    }
}

module.exports = new EmailService();