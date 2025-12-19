/**
 * Script de TESTE 2 - Envio para múltiplos destinos
 * Testa envio para email pessoal + corporativo
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const nodemailer = require('nodemailer');

console.log('━'.repeat(80));
console.log('🧪 TESTE 2 - Verificação de Entrega');
console.log('━'.repeat(80));

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function testarEmail(destinatario, tipo) {
  try {
    console.log(`\n📧 Testando envio para ${tipo}...`);
    console.log(`   Destinatário: ${destinatario}`);
    
    const mailOptions = {
      from: `${process.env.EMAIL_NAME} <${process.env.SMTP_USER}>`,
      to: destinatario,
      subject: `[TESTE ${tipo}] BrisaLOG - Verificação de Entrega - ${new Date().toLocaleString('pt-BR')}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🧪 TESTE DE ENTREGA</h1>
            <p style="margin: 10px 0 0 0;">Sistema BrisaLOG</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #f97316;">Este é um email de teste!</h2>
            
            <p><strong>Tipo de teste:</strong> ${tipo}</p>
            <p><strong>Destinatário:</strong> ${destinatario}</p>
            <p><strong>Horário de envio:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <p><strong>Remetente:</strong> ${process.env.SMTP_USER}</p>
            
            <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #ea580c;">✅ O que verificar:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Este email chegou na caixa de entrada ou no spam?</li>
                <li>Você consegue ler todo o conteúdo?</li>
                <li>As imagens e formatação estão corretas?</li>
              </ul>
            </div>
            
            <div style="background: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #0369a1;">📋 Se este email foi para SPAM:</h3>
              <ol style="margin: 0; padding-left: 20px;">
                <li>Marque como "Não é spam"</li>
                <li>Adicione noreplybrisalog@gmail.com aos contatos</li>
                <li>Crie uma regra de filtro para sempre receber na caixa de entrada</li>
              </ol>
            </div>
            
            <p style="text-align: center; margin-top: 30px;">
              <strong style="color: #f97316; font-size: 18px;">Se você recebeu este email, responda confirmando!</strong>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© 2025 BrisaLOG - Sistema de Agendamento</p>
            <p>Este é um email de teste automático</p>
          </div>
        </div>
      `,
      text: `TESTE DE ENTREGA - BrisaLOG\n\nTipo: ${tipo}\nDestinatário: ${destinatario}\nHorário: ${new Date().toLocaleString('pt-BR')}\n\nSe você recebeu este email, confirme o recebimento!`
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`   ✅ Enviado com sucesso!`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    
    return { success: true, email: destinatario, messageId: info.messageId };
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    return { success: false, email: destinatario, error: error.message };
  }
}

async function executarTestes() {
  console.log('\n🔍 Testando entrega para diferentes tipos de email...\n');
  
  const testes = [
    // Email corporativo Brisanet
    { email: 'wanderson.goncalves@grupobrisanet.com.br', tipo: 'EMAIL CORPORATIVO BRISANET' },
    
    // Se quiser testar com email pessoal, adicione aqui:
    // { email: 'seu.email.pessoal@gmail.com', tipo: 'EMAIL PESSOAL GMAIL' },
  ];
  
  const resultados = [];
  
  for (const teste of testes) {
    const resultado = await testarEmail(teste.email, teste.tipo);
    resultados.push(resultado);
    
    // Aguardar 2 segundos entre envios
    if (testes.indexOf(teste) < testes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n' + '━'.repeat(80));
  console.log('📊 RESUMO DOS TESTES');
  console.log('━'.repeat(80));
  
  const sucessos = resultados.filter(r => r.success);
  const falhas = resultados.filter(r => !r.success);
  
  console.log(`\n✅ Enviados: ${sucessos.length}`);
  sucessos.forEach(r => console.log(`   • ${r.email} (${r.messageId})`));
  
  if (falhas.length > 0) {
    console.log(`\n❌ Falhas: ${falhas.length}`);
    falhas.forEach(r => console.log(`   • ${r.email} - ${r.error}`));
  }
  
  console.log('\n' + '━'.repeat(80));
  console.log('📱 PRÓXIMOS PASSOS:');
  console.log('━'.repeat(80));
  console.log('1. Verifique a CAIXA DE ENTRADA do email corporativo');
  console.log('2. Verifique a pasta de SPAM/LIXO ELETRÔNICO');
  console.log('3. Verifique em TODAS as pastas (Promoções, Social, etc)');
  console.log('4. Se estiver no spam, marque como "Não é spam"');
  console.log('5. Adicione noreplybrisalog@gmail.com aos contatos confiáveis');
  console.log('6. Entre em contato com TI da Brisanet se não receber nada');
  console.log('\n⏰ Aguarde 2-5 minutos para os emails chegarem');
  console.log('━'.repeat(80));
}

// Executar
executarTestes()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
