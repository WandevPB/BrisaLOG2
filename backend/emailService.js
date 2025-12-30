// Carregar variáveis de ambiente
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const templateRecuperacaoCadastrada = require('./emails/recuperacaoCadastrada');
const templateBoasVindasUsuario = require('./emails/boasVindasUsuario');
const templateBoasVindasAdmin = require('./emails/boasVindasAdmin');
// Alteração fictícia para forçar deploy no Render
const nodemailer = require('nodemailer');

// Importar templates
const templateConfirmado = require('./emails/confirmado');
const templateEntregue = require('./emails/entregue');
const templateNaoVeio = require('./emails/naoVeio');
const templateReagendamento = require('./emails/reagendamento');
const templateRespostaReagendamento = require('./emails/respostaReagendamento');
const templateCanceladoFornecedor = require('./emails/canceladoFornecedor');
const templateCanceladoCD = require('./emails/canceladoCD');
const templateEntregaSemAgendamento = require('./emails/entregaSemAgendamento');

class EmailService {
    // E-mail de cadastro de e-mail de recuperação
    async sendRecuperacaoCadastradaEmail({ to, nome, cd }) {
        const html = templateRecuperacaoCadastrada({ nome, email: to, cd });
        return this.sendEmail({
            to,
            subject: '[BrisaLOG] E-mail de recuperação cadastrado',
            html
        });
    }
    // E-mail de recebimento de solicitação para o fornecedor
    async sendSolicitacaoRecebidaFornecedor({ agendamento, fornecedor }) {
                function formatarDataHora(data, horario) {
                    const d = new Date(data);
                    return `${d.toLocaleDateString('pt-BR')} ${horario}`;
                }
                const html = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FF9F66 100%); color: white; border-radius: 10px; padding: 30px 20px; text-align: center;">
                                <h1 style="margin: 0; font-size: 26px;">📩 Solicitação Recebida!</h1>
                                <p style="font-size: 18px; margin: 10px 0 0 0;">Recebemos sua solicitação de agendamento.</p>
                            </div>
                            <div style="background: #fff; border-radius: 10px; margin-top: 20px; padding: 30px 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                                <h2 style="color: #FF6B35; margin-top: 0;">Olá, ${fornecedor.nome}!</h2>
                                <p>Recebemos sua solicitação. Aguarde o CD responder sua solicitação em até <b>48h</b>.</p>
                                <div style="background: #f8f9fa; border-left: 4px solid #FF6B35; padding: 15px; margin: 20px 0; border-radius: 5px;">
                                    <strong>📦 Código da Solicitação:</strong> <span style="font-size: 18px; color: #FF6B35;">${agendamento.codigo}</span><br>
                                    <strong>� Fornecedor:</strong> ${fornecedor.nome}<br>
                                    <strong>📅 Data Solicitada:</strong> ${formatarDataHora(agendamento.dataHora, agendamento.horarioEntrega)}<br>
                                </div>
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="https://brisalog-agenda.online/" style="background: linear-gradient(135deg, #FF6B35, #FF8C42); color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(255, 107, 53, 0.2);">🔎 Acessar Portal BrisaLOG</a>
                                </div>
                                <p style="font-size: 15px; color: #666;">Para consultar, acesse o link acima e informe o código: <b>${agendamento.codigo}</b></p>
                            </div>
                            <div style="text-align: center; margin-top: 40px; color: #999; font-size: 13px;">
                                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                                <p>© ${new Date().getFullYear()} Brisanet. Todos os direitos reservados.</p>
                            </div>
                        </div>
                `;
        return this.sendEmail({
            to: fornecedor.email,
            subject: `[BrisaLOG] Solicitação Recebida - ${agendamento.codigo}`,
            html
        });
    }
    constructor() {
    this.fromEmail = process.env.SMTP_USER || process.env.EMAIL_FROM;
    this.fromName = process.env.EMAIL_NAME || 'BrisaLOG Portal';
        
        // Configurar transporter para Gmail SMTP
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false, // true para 465, false para outros
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

    // Removido: Verificação SMTP na inicialização para evitar travamento no deploy
        
        console.log('📧 [EMAIL SERVICE] Gmail SMTP configurado');
        console.log('📧 [EMAIL SERVICE] FROM_EMAIL:', this.fromEmail);
        console.log('📧 [EMAIL SERVICE] SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com');
    }

    async verifyConnection() {
        try {
            const verified = await this.transporter.verify();
            if (verified) {
                console.log('✅ [EMAIL SERVICE] Conexão Gmail SMTP bem-sucedida!');
                return true;
            }
        } catch (error) {
            console.error('❌ [EMAIL SERVICE] Erro ao conectar com Gmail SMTP:', error.message);
            return false;
        }
    }

    async sendEmail({ to, subject, html, text }) {
        try {
            console.log(`📨 [EMAIL SERVICE] Enviando email para: ${to}`);
            console.log(`📨 [EMAIL SERVICE] Assunto: ${subject}`);

            const mailOptions = {
                from: `"${this.fromName}" <${this.fromEmail}>`,
                to: to,
                subject: subject,
                html: html,
                text: text || html.replace(/<[^>]*>/g, '') // Remove HTML tags para texto
            };

            const info = await this.transporter.sendMail(mailOptions);
            
            console.log(`✅ [EMAIL SERVICE] Email enviado com sucesso para ${to}`);
            console.log(`📧 [EMAIL SERVICE] Message ID: ${info.messageId}`);
            
            return {
                success: true,
                messageId: info.messageId,
                response: info.response
            };
            
        } catch (error) {
            console.error(`❌ [EMAIL SERVICE] Falha ao enviar email para ${to}:`, error.message);
            
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    }

    // E-mail de confirmação de agendamento
    async sendConfirmadoEmail({ to, fornecedorNome, agendamentoCodigo, cdNome, consultaUrl, motoristaNome, veiculoPlaca, dataAgendamento, horarioAgendamento }) {
        const html = templateConfirmado({
            transportadorNome: fornecedorNome,
            agendamentoCodigo,
            cdNome,
            consultaUrl,
            motoristaNome,
            veiculoPlaca,
            dataAgendamento,
            horarioAgendamento
        });
        return this.sendEmail({
            to,
            subject: '[BrisaLOG] Agendamento Confirmado',
            html
        });
    }

    // E-mail de entrega realizada
    async sendEntregueEmail({ to, fornecedorNome, agendamentoCodigo, cdNome, consultaUrl, motoristaNome, veiculoPlaca, dataEntrega, horarioEntrega }) {
        const html = templateEntregue({
            transportadorNome: fornecedorNome,
            agendamentoCodigo,
            cdNome,
            baseUrl: consultaUrl,
            motoristaNome,
            veiculoPlaca,
            dataEntrega,
            horarioEntrega
        });
        return this.sendEmail({
            to,
            subject: '[BrisaLOG] Entrega Realizada',
            html
        });
    }

    // E-mail de não comparecimento
    async sendNaoVeioEmail({ to, fornecedorNome, agendamentoCodigo, cdNome, consultaUrl, motoristaNome, veiculoPlaca, dataAgendamento, horarioAgendamento }) {
        const html = templateNaoVeio({
            transportadorNome: fornecedorNome,
            agendamentoCodigo,
            cdNome,
            consultaUrl,
            motoristaNome,
            veiculoPlaca,
            dataAgendamento,
            horarioAgendamento
        });
        return this.sendEmail({
            to,
            subject: '[BrisaLOG] Entrega Não Realizada',
            html
        });
    }

    // E-mail de cancelamento pelo CD/Admin
    async sendCanceladoCDEmail({ to, fornecedorNome, agendamentoCodigo, cdNome, motivo, dataAgendamento, horarioAgendamento }) {
        const html = templateCanceladoCD({
            fornecedorNome,
            agendamentoCodigo,
            cdNome,
            motivo,
            dataAgendamento,
            horarioAgendamento
        });
        return this.sendEmail({
            to,
            subject: '[BrisaLOG] Agendamento Cancelado',
            html
        });
    }

    // E-mail de reagendamento
    async sendReagendamentoEmail({ to, fornecedorNome, agendamentoCodigo, cdNome, dataOriginal, novaDataSugerida, novoHorario, motivo, consultaUrl, motoristaNome, veiculoPlaca }) {
        const html = templateReagendamento({
            transportadorNome: fornecedorNome,
            agendamentoCodigo,
            cdNome,
            dataOriginal,
            novaDataSugerida,
            novoHorario,
            motivo,
            consultaUrl,
            motoristaNome,
            veiculoPlaca
        });
        return this.sendEmail({
            to,
            subject: `[BrisaLOG] Solicitação de Reagendamento - ${agendamentoCodigo}`,
            html
        });
    }

    // E-mail de resposta ao reagendamento
    async sendRespostaReagendamentoEmail({ to, fornecedorNome, agendamentoCodigo, resposta, novaData, novoHorario, comentario, consultaUrl }) {
        const html = templateRespostaReagendamento({ fornecedorNome, agendamentoCodigo, resposta, novaData, novoHorario, comentario, consultaUrl });
        return this.sendEmail({
            to,
            subject: '[BrisaLOG] Resposta ao Reagendamento',
            html
        });
    }

    // E-mail de cancelamento pelo fornecedor
    async sendCanceladoFornecedorEmail({ to, fornecedorNome, agendamentoCodigo, motivo, consultaUrl }) {
        const html = templateCanceladoFornecedor({
            transportadorNome: fornecedorNome,
            agendamentoCodigo,
            motivo,
            consultaUrl
        });
        return this.sendEmail({
            to,
            subject: '[BrisaLOG] Solicitação Cancelada',
            html
        });
    }

    // E-mail de entrega sem agendamento (registrada pelo CD)
    async sendEntregaSemAgendamentoEmail({ to, fornecedorNome, agendamentoCodigo, cdNome, dataEntrega, horarioEntrega, consultaUrl, agendamentoUrl }) {
        const html = templateEntregaSemAgendamento({ fornecedorNome, agendamentoCodigo, cdNome, dataEntrega, horarioEntrega, consultaUrl, agendamentoUrl });
        return this.sendEmail({
            to,
            subject: '[BrisaLOG] Entrega Registrada - Use o Agendamento!',
            html
        });
    }

    // Método para novo agendamento (notificação interna e fornecedor)
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
                        <p style="margin: 8px 0;"><strong>Data/Hora:</strong> ${formatarDataHora(agendamento.dataHora, agendamento.horarioEntrega)}</p>
                        <p style="margin: 8px 0;"><strong>CD:</strong> ${agendamento.cd?.nome || 'N/A'}</p>
                        ${agendamento.observacoes ? `<p style="margin: 8px 0;"><strong>Observações:</strong> ${agendamento.observacoes}</p>` : ''}
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://brisalog-agenda.online/" 
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

        // Enviar para equipe interna e fornecedor
        const recipients = [this.fromEmail];
        if (fornecedor.email) {
            recipients.push(fornecedor.email);
        }
        return this.sendEmail({
            to: recipients.join(","),
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
                        <p style="margin: 8px 0;"><strong>Data/Hora:</strong> ${formatarDataHora(agendamento.dataHora, agendamento.horarioEntrega)}</p>
                        <p style="margin: 8px 0;"><strong>CD de Destino:</strong> ${agendamento.cd?.nome || 'N/A'}</p>
                        <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">Agendado</span></p>
                    </div>
                    
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #92400e; font-size: 14px;">
                            <strong>📝 Nota:</strong> Este email está sendo enviado para a equipe interna para notificação. O fornecedor ${fornecedor.nome} (${fornecedor.email}) foi registrado no agendamento ${agendamento.codigo}.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://brisalog-agenda.online/" 
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

        // Enviar para fornecedor e equipe interna
        const recipients = [];
        if (fornecedor.email) {
            recipients.push(fornecedor.email);
        }
        recipients.push(this.fromEmail); // sempre notifica interno
        return this.sendEmail({
            to: recipients.join(","),
            subject: `[BrisaLOG] Agendamento Registrado - ${fornecedor.nome} - ${agendamento.codigo}`,
            html
        });
    }

    // Gerar token de reset de senha
    generateResetToken() {
        const crypto = require('crypto');
        return crypto.randomBytes(32).toString('hex');
    }

    // E-mail de recuperação de senha
    async sendPasswordResetEmail(email, token, nomeUsuario) {
    const resetUrl = `https://brisalog-agenda.online/`;
        
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
                <div style="background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Recuperação de Senha</h1>
                    <p style="color: #FFE5D9; margin: 10px 0 0 0;">Sistema BrisaLOG Portal</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                    <h2 style="color: #2D3748; margin: 0 0 20px 0;">Olá, ${nomeUsuario}!</h2>
                    
                    <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Recebemos uma solicitação para redefinir a senha da sua conta no BrisaLOG Portal.
                    </p>
                    
                    <div style="background: #FEF5E7; border-left: 4px solid #FF6B35; padding: 20px; margin: 20px 0;">
                        <p style="margin: 0; color: #9C4221; font-size: 14px;">
                            <strong>⚠️ Importante:</strong> Este link é válido por apenas 1 hora por questões de segurança.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                            Redefinir Minha Senha
                        </a>
                    </div>
                    
                    <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                        Se você não solicitou esta redefinição, ignore este email. Sua senha permanecerá inalterada.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 30px 0;">
                    
                    <p style="color: #A0AEC0; font-size: 12px; margin: 0;">
                        Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                        <span style="word-break: break-all;">${resetUrl}</span>
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="background: #F7FAFC; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0;">
                    <p style="margin: 0; color: #718096; font-size: 14px;">
                        © 2025 BrisaLOG Portal - Sistema de Agendamento de Entregas
                    </p>
                </div>
            </div>
        </body>
        </html>
        `;

        return this.sendEmail({
            to: email,
            subject: '[BrisaLOG] Recuperação de Senha',
            html
        });
    }

    // E-mail de boas-vindas para novo usuário
    async sendBoasVindasUsuario({ to, nome, codigo, cdNome }) {
        const html = templateBoasVindasUsuario({
            nome,
            codigo,
            cdNome,
            email: to
        });
        return this.sendEmail({
            to,
            subject: '[BrisaLOG] Bem-vindo ao Sistema - Seu Acesso Foi Criado',
            html
        });
    }

    // E-mail de boas-vindas para novo admin
    async sendBoasVindasAdmin({ to, nome, usuario }) {
        const html = templateBoasVindasAdmin({
            nome,
            usuario,
            senha: 'Brisanet123',
            linkPrimeiroAcesso: 'https://brisalog-agenda.online/login.html'
        });
        return this.sendEmail({
            to,
            subject: '[BrisaLOG] Boas-vindas - Acesso Admin Criado',
            html
        });
    }
}

// Criar instância única do serviço
const emailService = new EmailService();

module.exports = emailService;