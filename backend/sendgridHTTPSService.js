const https = require('https');

class SendGridHTTPSService {
    constructor() {
        this.fromEmail = process.env.FROM_EMAIL || 'wanderson.goncalves@grupobrisanet.com.br';
        this.apiKey = process.env.EMAIL_PASS; // SendGrid API Key
        console.log('📧 [SENDGRID HTTPS] Inicializando SendGrid via HTTPS...');
        console.log('📧 [SENDGRID HTTPS] FROM_EMAIL:', this.fromEmail);
        console.log('📧 [SENDGRID HTTPS] API_KEY exists:', !!this.apiKey);
    }

    async sendEmail({ to, subject, html, text }) {
        if (!this.apiKey) {
            console.error('❌ [SENDGRID HTTPS] API Key não configurada');
            return { 
                success: false, 
                error: 'SendGrid API Key não configurada',
                method: 'SENDGRID_HTTPS' 
            };
        }

        const postData = JSON.stringify({
            personalizations: [{
                to: [{ email: to }],
                subject: subject
            }],
            from: {
                email: this.fromEmail,
                name: 'BrisaLOG Portal'
            },
            content: [
                {
                    type: 'text/plain',
                    value: text || html.replace(/<[^>]*>/g, '')
                },
                {
                    type: 'text/html',
                    value: html
                }
            ]
        });

        const options = {
            hostname: 'api.sendgrid.com',
            port: 443,
            path: '/v3/mail/send',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        return new Promise((resolve) => {
            console.log(`📧 [SENDGRID HTTPS] Enviando email para: ${to}`);
            
            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    console.log(`📧 [SENDGRID HTTPS] Status: ${res.statusCode}`);
                    console.log(`📧 [SENDGRID HTTPS] Response:`, data);
                    
                    if (res.statusCode === 202) { // SendGrid retorna 202 para sucesso
                        const messageId = res.headers['x-message-id'] || 'sendgrid-' + Date.now();
                        console.log(`✅ [SENDGRID HTTPS] Email enviado! ID: ${messageId}`);
                        resolve({
                            success: true,
                            messageId: messageId,
                            method: 'SENDGRID_HTTPS'
                        });
                    } else {
                        console.error(`❌ [SENDGRID HTTPS] Erro ${res.statusCode}:`, data);
                        resolve({
                            success: false,
                            error: `HTTP ${res.statusCode}: ${data}`,
                            method: 'SENDGRID_HTTPS'
                        });
                    }
                });
            });
            
            req.on('error', (error) => {
                console.error('❌ [SENDGRID HTTPS] Erro na requisição:', error.message);
                resolve({
                    success: false,
                    error: error.message,
                    method: 'SENDGRID_HTTPS'
                });
            });
            
            req.write(postData);
            req.end();
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

        return this.sendEmail({
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

        return this.sendEmail({
            to: fornecedor.email,
            subject: `[BrisaLOG] Confirmação de Agendamento - ${fornecedor.nome} - ${agendamento.codigo}`,
            html
        });
    }
}

module.exports = new SendGridHTTPSService();