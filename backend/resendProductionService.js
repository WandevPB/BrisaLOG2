const https = require('https');

class ResendProductionService {
    constructor() {
        this.apiKey = process.env.RESEND_API_KEY;
        this.fromEmail = process.env.FROM_EMAIL_VERIFIED || 'noreply@seudominio.com'; // Trocar pelo seu domínio
        this.fallbackEmail = process.env.FALLBACK_EMAIL || 'wandevpb@gmail.com';
        this.isDomainVerified = process.env.DOMAIN_VERIFIED === 'true';
        
        console.log('📧 [RESEND PROD] Inicializando Resend para Produção...');
        console.log('📧 [RESEND PROD] API Key exists:', !!this.apiKey);
        console.log('📧 [RESEND PROD] FROM_EMAIL:', this.fromEmail);
        console.log('📧 [RESEND PROD] DOMAIN_VERIFIED:', this.isDomainVerified);
    }

    async sendEmail({ to, subject, html, text }) {
        if (!this.apiKey) {
            console.error('❌ [RESEND PROD] API Key não configurada');
            return { 
                success: false, 
                error: 'Resend API Key não configurada',
                method: 'RESEND_PROD' 
            };
        }

        // Se domínio não verificado, usar fallback
        const actualTo = this.isDomainVerified ? to : this.fallbackEmail;
        const actualSubject = this.isDomainVerified ? 
            subject : 
            `[PARA: ${to}] ${subject}`;

        const actualHtml = this.isDomainVerified ? 
            html : 
            this.wrapFallbackEmail(to, subject, html);

        const postData = JSON.stringify({
            from: `BrisaLOG Portal <${this.fromEmail}>`,
            to: [actualTo],
            subject: actualSubject,
            html: actualHtml,
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

        return new Promise((resolve) => {
            console.log(`📧 [RESEND PROD] Enviando para: ${actualTo} (original: ${to})`);
            
            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    console.log(`📧 [RESEND PROD] Status: ${res.statusCode}`);
                    
                    if (res.statusCode === 200) {
                        const response = JSON.parse(data);
                        console.log(`✅ [RESEND PROD] Email enviado! ID: ${response.id}`);
                        resolve({
                            success: true,
                            messageId: response.id,
                            method: 'RESEND_PROD',
                            sentTo: actualTo,
                            originalTo: to,
                            domainVerified: this.isDomainVerified
                        });
                    } else {
                        console.error(`❌ [RESEND PROD] Erro ${res.statusCode}:`, data);
                        resolve({
                            success: false,
                            error: `HTTP ${res.statusCode}: ${data}`,
                            method: 'RESEND_PROD'
                        });
                    }
                });
            });
            
            req.on('error', (error) => {
                console.error('❌ [RESEND PROD] Erro na requisição:', error.message);
                resolve({
                    success: false,
                    error: error.message,
                    method: 'RESEND_PROD'
                });
            });
            
            req.write(postData);
            req.end();
        });
    }

    wrapFallbackEmail(originalTo, originalSubject, originalHtml) {
        return `
            <div style="background: #dc2626; color: white; padding: 15px; text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">⚠️ MODO FALLBACK - DOMÍNIO NÃO VERIFICADO</h2>
                <p style="margin: 5px 0;">Email original destinado a: <strong>${originalTo}</strong></p>
                <p style="margin: 5px 0;">Assunto original: <strong>${originalSubject}</strong></p>
            </div>
            
            ${originalHtml}
            
            <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; margin-top: 20px;">
                <h3 style="color: #92400e; margin-top: 0;">🔧 Para Envio Direto aos Fornecedores:</h3>
                <ol style="color: #92400e; margin: 10px 0;">
                    <li>Compre um domínio (ex: brisalog.com.br)</li>
                    <li>Configure no Resend: https://resend.com/domains</li>
                    <li>Adicione DNS: MX, SPF, DKIM</li>
                    <li>Configure: DOMAIN_VERIFIED=true</li>
                    <li>Configure: FROM_EMAIL_VERIFIED=noreply@seudominio.com</li>
                </ol>
                <p style="color: #92400e; margin: 5px 0;"><strong>Resultado:</strong> Emails enviados diretamente para fornecedores!</p>
            </div>
        `;
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
                </div>
            </div>
        `;

        return this.sendEmail({
            to: this.fallbackEmail, // Equipe interna
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
                    <p style="color: #d1fae5; margin: 10px 0 0 0;">Olá ${fornecedor.nome}!</p>
                </div>
                
                <div style="padding: 30px;">
                    <p>Seu agendamento foi confirmado com sucesso!</p>
                    
                    <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 20px;">
                        <h2 style="color: #065f46; margin: 0 0 15px 0;">Detalhes do Agendamento</h2>
                        <p style="margin: 8px 0;"><strong>Código:</strong> ${agendamento.codigo}</p>
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
            </div>
        `;

        // ESTE EMAIL VAI PARA O FORNECEDOR (quando domínio verificado)
        return this.sendEmail({
            to: fornecedor.email,
            subject: `[BrisaLOG] Agendamento Confirmado - ${agendamento.codigo}`,
            html
        });
    }
}

module.exports = new ResendProductionService();