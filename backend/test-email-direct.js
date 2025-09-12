/**
 * test-email-direct.js
 * 
 * Script para testar o envio de e-mails diretamente, sem precisar passar pela API.
 * Útil para verificar se as configurações de e-mail estão funcionando corretamente.
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuração do Nodemailer para envio de e-mails
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Função para testar o envio de e-mails
async function testEmailSend() {
    try {
        // Verificar se as variáveis de ambiente estão configuradas
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('❌ Erro: EMAIL_USER e EMAIL_PASS precisam ser configurados no arquivo .env');
            return;
        }

        console.log('🔄 Testando conexão com o servidor de e-mail...');
        
        // Verificar conexão com o servidor de e-mail
        await transporter.verify();
        console.log('✅ Conexão com servidor de e-mail estabelecida com sucesso!');

        // E-mail de teste para reagendamento
        const info = await transporter.sendMail({
            from: `"BrisaLOG Portal" <${process.env.EMAIL_USER}>`,
            to: process.env.TEST_EMAIL || process.env.EMAIL_USER,
            subject: 'Teste de E-mail - Reagendamento',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <div style="background-color: #ff6600; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
                        <h1 style="color: white; margin: 0;">BrisaLOG Portal</h1>
                        <p style="color: white; margin: 5px 0 0;">Sistema de Agendamento de Entregas</p>
                    </div>
                    
                    <div style="padding: 20px;">
                        <h2 style="color: #333;">Reagendamento Solicitado</h2>
                        <p>Prezado Fornecedor,</p>
                        <p>Seu agendamento <strong>AGD000123</strong> precisou ser reagendado.</p>
                        
                        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p><strong>Data Original:</strong> 01/09/2025</p>
                            <p><strong>Nova Data Sugerida:</strong> 05/09/2025</p>
                            <p><strong>Novo Horário:</strong> 14:00</p>
                            <p><strong>Motivo:</strong> Feriado municipal no CD destino.</p>
                        </div>
                        
                        <p>Por favor, acesse o portal para confirmar o reagendamento ou sugerir uma nova data.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://localhost:3000/consultar.html?codigo=AGD000123" style="background-color: #ff6600; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                                Acessar Portal
                            </a>
                        </div>
                        
                        <p>Atenciosamente,<br>Equipe BrisaLOG Portal</p>
                    </div>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px;">
                        <p>Este é um e-mail automático. Por favor, não responda.</p>
                        <p>BrisaLOG Portal &copy; 2025 - Todos os direitos reservados</p>
                    </div>
                </div>
            `
        });

        console.log('✅ E-mail de teste enviado com sucesso!');
        console.log('📧 Message ID:', info.messageId);
        console.log('📤 Enviado para:', info.envelope.to);
        
        if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Preview URL:', nodemailer.getTestMessageUrl(info));
        }
    } catch (error) {
        console.error('❌ Erro ao enviar e-mail de teste:', error);
    }
}

// Executar o teste
testEmailSend();

// Exportar o transporter para uso em outros módulos
module.exports = {
    transporter,
    testEmailSend
};
