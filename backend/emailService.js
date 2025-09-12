const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        try {
            this.transporter = nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE || 'gmail',
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.EMAIL_PORT) || 587,
                secure: process.env.EMAIL_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            // Verificar conexão
            this.transporter.verify((error, success) => {
                if (error) {
                    console.error('❌ Erro na configuração de e-mail:', error.message);
                    console.log('📧 Configure as variáveis de ambiente EMAIL_USER e EMAIL_PASS no arquivo .env');
                } else {
                    console.log('✅ Servidor de e-mail configurado com sucesso');
                }
            });

        } catch (error) {
            console.error('❌ Erro ao inicializar serviço de e-mail:', error.message);
        }
    }

    generateResetToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    async sendPasswordResetEmail(email, resetToken, userName = '') {
        const resetUrl = `${process.env.FRONTEND_URL}/redefinir-senha.html?token=${resetToken}&email=${encodeURIComponent(email)}`;
        
        const mailOptions = {
            from: {
                name: 'BrisaLOG Portal',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: '🔐 Recuperação de Senha - BrisaLOG Portal',
            html: this.getPasswordResetEmailTemplate(resetUrl, userName, email)
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ E-mail de recuperação enviado para: ${email}`);
            return {
                success: true,
                messageId: result.messageId,
                resetToken
            };
        } catch (error) {
            console.error('❌ Erro ao enviar e-mail:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    getPasswordResetEmailTemplate(resetUrl, userName, email) {
        return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recuperação de Senha - BrisaLOG</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f5f5f5;
                }
                .container {
                    background: white;
                    border-radius: 15px;
                    padding: 40px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FF9F66 100%);
                    border-radius: 10px;
                    color: white;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                }
                .header .icon {
                    font-size: 48px;
                    margin-bottom: 10px;
                }
                .content {
                    margin: 30px 0;
                }
                .reset-button {
                    display: inline-block;
                    padding: 15px 30px;
                    background: linear-gradient(135deg, #FF6B35, #FF8C42);
                    color: white;
                    text-decoration: none;
                    border-radius: 10px;
                    font-weight: bold;
                    margin: 20px 0;
                    text-align: center;
                    box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
                }
                .reset-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
                }
                .info-box {
                    background: #f8f9fa;
                    border-left: 4px solid #FF6B35;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 5px;
                }
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    color: #666;
                    font-size: 14px;
                }
                .security-warning {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 5px;
                    padding: 15px;
                    margin: 20px 0;
                    color: #856404;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="icon">🔐</div>
                    <h1>BrisaLOG Portal</h1>
                    <p>Recuperação de Senha</p>
                </div>

                <div class="content">
                    <h2>Olá${userName ? ', ' + userName : ''}!</h2>
                    
                    <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>BrisaLOG Portal</strong>.</p>
                    
                    <div class="info-box">
                        <strong>📧 E-mail da conta:</strong> ${email}<br>
                        <strong>🕒 Data da solicitação:</strong> ${new Date().toLocaleString('pt-BR')}<br>
                        <strong>⏰ Validade do link:</strong> 1 hora
                    </div>

                    <p>Para redefinir sua senha, clique no botão abaixo:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" class="reset-button">
                            🔑 Redefinir Minha Senha
                        </a>
                    </div>

                    <p><strong>Ou copie e cole este link no seu navegador:</strong></p>
                    <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">
                        ${resetUrl}
                    </p>

                    <div class="security-warning">
                        <h3>⚠️ Importante - Segurança</h3>
                        <ul>
                            <li>Este link é válido por apenas <strong>1 hora</strong></li>
                            <li>Se você não solicitou esta recuperação, ignore este e-mail</li>
                            <li>Nunca compartilhe este link com outras pessoas</li>
                            <li>Após usar o link, ele será invalidado automaticamente</li>
                        </ul>
                    </div>

                    <p>Se você não conseguir clicar no botão, copie e cole o link completo no seu navegador.</p>
                </div>

                <div class="footer">
                    <p><strong>BrisaLOG Portal</strong> - Sistema de Gestão de Entregas</p>
                    <p>Este é um e-mail automático, não responda a esta mensagem.</p>
                    <p>Em caso de dúvidas, entre em contato com o administrador do sistema.</p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                    <p style="font-size: 12px; color: #999;">
                        © ${new Date().getFullYear()} Brisanet. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    async sendTestEmail(email) {
        const mailOptions = {
            from: {
                name: 'BrisaLOG Portal - Teste',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: '✅ Teste de Configuração - BrisaLOG Portal',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #FF6B35, #FF8C42); color: white; border-radius: 10px;">
                        <h1>🎉 Configuração de E-mail Funcionando!</h1>
                        <p>O sistema de e-mail do BrisaLOG Portal está configurado corretamente.</p>
                    </div>
                    <div style="padding: 20px; background: #f9f9f9; margin-top: 20px; border-radius: 10px;">
                        <p><strong>Data do teste:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                        <p>Agora você pode usar o sistema de recuperação de senha normalmente.</p>
                    </div>
                </div>
            `
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async sendReagendamentoEmail(fornecedorEmail, fornecedorNome, agendamentoCodigo, dataOriginal, novaDataSugerida, novoHorario, motivo, cdNome) {
        try {
            const consultaUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/index.html`;
            
            const mailOptions = {
                from: {
                    name: 'BrisaLOG Portal',
                    address: process.env.EMAIL_USER
                },
                to: fornecedorEmail,
                subject: `[BrisaLOG] Solicitação de Reagendamento - ${agendamentoCodigo}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff;">
                            <h2 style="color: #007bff; margin-top: 0;">
                                📅 Solicitação de Reagendamento
                            </h2>
                            
                            <p><strong>Olá, ${fornecedorNome}!</strong></p>
                            
                            <p>O CD <strong>${cdNome}</strong> solicitou o reagendamento do seu agendamento:</p>
                            
                            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p><strong>📦 Código do Agendamento:</strong> ${agendamentoCodigo}</p>
                                <p><strong>📅 Data Original:</strong> ${new Date(dataOriginal).toLocaleDateString('pt-BR')}</p>
                                <p><strong>🗓️ Nova Data Sugerida:</strong> ${new Date(novaDataSugerida).toLocaleDateString('pt-BR')}</p>
                                <p><strong>⏰ Novo Horário:</strong> ${novoHorario}</p>
                                ${motivo ? `<p><strong>💬 Motivo:</strong> ${motivo}</p>` : ''}
                            </div>
                            
                            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border: 1px solid #ffeaa7;">
                                <p><strong>⚠️ Ação Necessária:</strong></p>
                                <p>Você precisa responder a esta solicitação. Acesse o portal para:</p>
                                <ul>
                                    <li>✅ Aceitar a nova data proposta</li>
                                    <li>📅 Sugerir uma data alternativa</li>
                                    <li>❌ Rejeitar o reagendamento</li>
                                </ul>
                            </div>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${consultaUrl}" 
                                   style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                                    🔍 Consultar Agendamento
                                </a>
                            </div>
                            
                            <p style="font-size: 14px; color: #666;">
                                Para consultar seu agendamento, acesse o link acima e utilize o código: <strong>${agendamentoCodigo}</strong>
                            </p>
                            
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                            
                            <p style="font-size: 12px; color: #888; text-align: center;">
                                Este é um e-mail automático do sistema BrisaLOG Portal.<br>
                                Por favor, não responda a este e-mail.
                            </p>
                        </div>
                    </div>
                `
            };

            const result = await this.transporter.sendMail(mailOptions);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = new EmailService();
