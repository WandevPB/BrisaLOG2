const https = require('https');

class ResendEmailService {
    constructor() {
        this.apiKey = process.env.RESEND_API_KEY;
        this.fromEmail = process.env.FROM_EMAIL || 'wanderson.goncalves@grupobrisanet.com.br';
    }

    async sendEmail({ to, subject, html, text }) {
        return new Promise((resolve, reject) => {
            if (!this.apiKey) {
                console.error('❌ RESEND_API_KEY não configurada');
                return resolve({ success: false, error: 'RESEND_API_KEY não configurada' });
            }

            const postData = JSON.stringify({
                from: `BrisaLOG Portal <onboarding@resend.dev>`,
                to: Array.isArray(to) ? to : [to],
                subject: subject,
                html: html,
                text: text || html.replace(/<[^>]*>/g, '')
            });

            const options = {
                hostname: 'api.resend.com',
                port: 443,
                path: '/emails',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const request = https.request(options, (response) => {
                let data = '';
                
                response.on('data', (chunk) => {
                    data += chunk;
                });
                
                response.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        
                        if (response.statusCode === 200) {
                            console.log(`✅ [RESEND] Email enviado para ${to}: ${result.id}`);
                            resolve({ 
                                success: true, 
                                messageId: result.id,
                                method: 'RESEND_API'
                            });
                        } else {
                            console.error('❌ [RESEND] Erro API:', result);
                            resolve({ 
                                success: false, 
                                error: result.message || 'Erro na API Resend',
                                details: result
                            });
                        }
                    } catch (parseError) {
                        console.error('❌ [RESEND] Erro parse:', parseError);
                        resolve({ 
                            success: false, 
                            error: 'Erro ao processar resposta'
                        });
                    }
                });
            });

            request.on('error', (error) => {
                console.error('❌ [RESEND] Erro request:', error);
                resolve({ 
                    success: false, 
                    error: error.message 
                });
            });

            request.write(postData);
            request.end();
        });
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
                        <p style="margin: 8px 0;"><strong>Fornecedor:</strong> ${fornecedor.nomeFantasia}</p>
                        <p style="margin: 8px 0;"><strong>CNPJ:</strong> ${fornecedor.cnpj}</p>
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
            to: this.fromEmail,
            subject: `[BrisaLOG] Novo Agendamento - ${fornecedor.nomeFantasia} - ${agendamento.codigo}`,
            html
        });
    }

    // Email de confirmação para o fornecedor
    async sendConfirmacaoAgendamento({ agendamento, fornecedor }) {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Agendamento Confirmado</h1>
                    <p style="color: #d1fae5; margin: 10px 0 0 0;">Seu agendamento foi realizado com sucesso!</p>
                </div>
                
                <div style="padding: 30px;">
                    <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 20px;">
                        <h2 style="color: #065f46; margin: 0 0 15px 0;">Detalhes do Agendamento</h2>
                        <p style="margin: 8px 0;"><strong>Código de Acompanhamento:</strong> <span style="background: #fbbf24; color: #92400e; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${agendamento.codigo}</span></p>
                        <p style="margin: 8px 0;"><strong>Data/Hora:</strong> ${new Date(agendamento.dataHora).toLocaleString('pt-BR')}</p>
                        <p style="margin: 8px 0;"><strong>CD de Destino:</strong> ${agendamento.cd?.nome || 'N/A'}</p>
                        <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">Agendado</span></p>
                    </div>
                    
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #92400e; font-size: 14px;">
                            <strong>📝 Importante:</strong> Guarde este código para consultar o status do seu agendamento.
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

        return this.sendEmail({
            to: fornecedor.email,
            subject: `[BrisaLOG] Agendamento Confirmado - Código: ${agendamento.codigo}`,
            html
        });
    }
}

module.exports = new ResendEmailService();