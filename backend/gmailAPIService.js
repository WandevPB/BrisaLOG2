const https = require('https');

class GmailAPIService {
    constructor() {
        this.fromEmail = process.env.FROM_EMAIL || 'wanderson.goncalves@grupobrisanet.com.br';
        this.accessToken = process.env.GMAIL_ACCESS_TOKEN;
        console.log('📧 [GMAIL API] Inicializando Gmail API Service...');
        console.log('📧 [GMAIL API] FROM_EMAIL:', this.fromEmail);
        console.log('📧 [GMAIL API] ACCESS_TOKEN exists:', !!this.accessToken);
    }

    async sendEmail({ to, subject, html, text }) {
        if (!this.accessToken) {
            console.error('❌ [GMAIL API] ACCESS_TOKEN não configurado');
            return { 
                success: false, 
                error: 'Gmail ACCESS_TOKEN não configurado',
                method: 'GMAIL_API' 
            };
        }

        // Construir o email no formato RFC 2822
        const emailContent = this.buildEmailContent({
            from: this.fromEmail,
            to: to,
            subject: subject,
            html: html,
            text: text || html.replace(/<[^>]*>/g, '')
        });

        // Converter para base64url
        const encodedEmail = Buffer.from(emailContent)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const postData = JSON.stringify({
            raw: encodedEmail
        });

        const options = {
            hostname: 'gmail.googleapis.com',
            port: 443,
            path: '/gmail/v1/users/me/messages/send',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        return new Promise((resolve) => {
            console.log(`📧 [GMAIL API] Enviando email para: ${to}`);
            
            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    console.log(`📧 [GMAIL API] Status: ${res.statusCode}`);
                    console.log(`📧 [GMAIL API] Response:`, data);
                    
                    if (res.statusCode === 200) {
                        const response = JSON.parse(data);
                        console.log(`✅ [GMAIL API] Email enviado! ID: ${response.id}`);
                        resolve({
                            success: true,
                            messageId: response.id,
                            method: 'GMAIL_API'
                        });
                    } else {
                        console.error(`❌ [GMAIL API] Erro ${res.statusCode}:`, data);
                        resolve({
                            success: false,
                            error: `HTTP ${res.statusCode}: ${data}`,
                            method: 'GMAIL_API'
                        });
                    }
                });
            });
            
            req.on('error', (error) => {
                console.error('❌ [GMAIL API] Erro na requisição:', error.message);
                resolve({
                    success: false,
                    error: error.message,
                    method: 'GMAIL_API'
                });
            });
            
            req.write(postData);
            req.end();
        });
    }

    buildEmailContent({ from, to, subject, html, text }) {
        const boundary = 'boundary-' + Date.now();
        
        let content = `From: BrisaLOG Portal <${from}>\r\n`;
        content += `To: ${to}\r\n`;
        content += `Subject: ${subject}\r\n`;
        content += `MIME-Version: 1.0\r\n`;
        content += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;
        
        // Parte texto
        content += `--${boundary}\r\n`;
        content += `Content-Type: text/plain; charset="UTF-8"\r\n`;
        content += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
        content += `${text}\r\n\r\n`;
        
        // Parte HTML
        content += `--${boundary}\r\n`;
        content += `Content-Type: text/html; charset="UTF-8"\r\n`;
        content += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
        content += `${html}\r\n\r\n`;
        
        content += `--${boundary}--`;
        
        return content;
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

module.exports = new GmailAPIService();