/**
 * Script de TESTE para enviar email de boas-vindas
 * Envia apenas para Wanderson com logs detalhados
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const nodemailer = require('nodemailer');
const boasVindasAdminTemplate = require('./emails/boasVindasAdmin');

console.log('━'.repeat(80));
console.log('🧪 TESTE DE ENVIO DE EMAIL - Wanderson');
console.log('━'.repeat(80));

// Verificar variáveis de ambiente
console.log('\n📋 Verificando variáveis de ambiente:');
console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || '❌ NÃO DEFINIDO'}`);
console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || '❌ NÃO DEFINIDO'}`);
console.log(`   SMTP_USER: ${process.env.SMTP_USER || '❌ NÃO DEFINIDO'}`);
console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? '✅ DEFINIDO (oculto)' : '❌ NÃO DEFINIDO'}`);
console.log(`   EMAIL_FROM: ${process.env.EMAIL_FROM || '❌ NÃO DEFINIDO'}`);
console.log(`   EMAIL_NAME: ${process.env.EMAIL_NAME || '❌ NÃO DEFINIDO'}`);

// Configurar transporter
console.log('\n🔧 Configurando transporter SMTP...');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true para 465, false para 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: true, // Habilitar logs de debug
  logger: true  // Habilitar logger
});

console.log('   ✅ Transporter configurado');

// Dados de teste
const gestor = {
  nome: 'Wanderson',
  usuario: 'wanderson',
  email: 'wanderson.goncalves@grupobrisanet.com.br'
};

const senhaTemporaria = 'Brisanet123';
const baseURL = 'https://brisalog-agenda.online';

// Gerar link
function gerarLinkPrimeiroAcesso(usuario, senha) {
  const params = new URLSearchParams({
    user: usuario,
    temp: senha,
    firstLogin: 'true'
  });
  return `${baseURL}/redefinir-senha.html?${params.toString()}`;
}

async function testarEnvio() {
  try {
    console.log('\n🔍 Verificando conexão SMTP...');
    await transporter.verify();
    console.log('   ✅ Conexão SMTP verificada com sucesso!');

    console.log('\n📝 Gerando conteúdo do email...');
    const linkPrimeiroAcesso = gerarLinkPrimeiroAcesso(gestor.usuario, senhaTemporaria);
    console.log(`   Link: ${linkPrimeiroAcesso}`);

    const htmlContent = boasVindasAdminTemplate({
      nome: gestor.nome,
      usuario: gestor.usuario,
      senha: senhaTemporaria,
      linkPrimeiroAcesso: linkPrimeiroAcesso
    });

    console.log('   ✅ Conteúdo HTML gerado');
    console.log(`   Tamanho: ${htmlContent.length} caracteres`);

    console.log('\n📧 Preparando email...');
    const mailOptions = {
      from: `${process.env.EMAIL_NAME || 'BrisaLOG Portal'} <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: gestor.email,
      subject: '👑 [TESTE] Boas-vindas! Seu Acesso Admin ao BrisaLOG foi Criado',
      html: htmlContent,
      text: `Olá ${gestor.nome}! Seu acesso admin foi criado. Usuário: ${gestor.usuario}, Senha temporária: ${senhaTemporaria}. Acesse: ${linkPrimeiroAcesso}`
    };

    console.log(`   De: ${mailOptions.from}`);
    console.log(`   Para: ${mailOptions.to}`);
    console.log(`   Assunto: ${mailOptions.subject}`);

    console.log('\n🚀 Enviando email...');
    console.log('━'.repeat(80));
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('━'.repeat(80));
    console.log('\n✅ EMAIL ENVIADO COM SUCESSO!');
    console.log('\n📊 Informações do envio:');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    console.log(`   Accepted: ${info.accepted.join(', ')}`);
    console.log(`   Rejected: ${info.rejected.length > 0 ? info.rejected.join(', ') : 'Nenhum'}`);
    console.log(`   Pending: ${info.pending ? info.pending.length : 0}`);
    
    console.log('\n📱 Informações do destinatário:');
    console.log(`   Nome: ${gestor.nome}`);
    console.log(`   Email: ${gestor.email}`);
    console.log(`   Usuário: ${gestor.usuario}`);
    console.log(`   Senha temporária: ${senhaTemporaria}`);
    
    console.log('\n🔗 Link de primeiro acesso:');
    console.log(`   ${linkPrimeiroAcesso}`);
    
    console.log('\n' + '━'.repeat(80));
    console.log('🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('━'.repeat(80));
    console.log('\n⏰ Aguarde alguns minutos e verifique a caixa de entrada e spam.');
    
  } catch (error) {
    console.log('\n' + '━'.repeat(80));
    console.log('❌ ERRO NO ENVIO DO EMAIL');
    console.log('━'.repeat(80));
    console.error('\n🔴 Detalhes do erro:');
    console.error(`   Tipo: ${error.name}`);
    console.error(`   Mensagem: ${error.message}`);
    console.error(`   Código: ${error.code || 'N/A'}`);
    console.error(`   Command: ${error.command || 'N/A'}`);
    
    if (error.responseCode) {
      console.error(`   Response Code: ${error.responseCode}`);
    }
    
    if (error.response) {
      console.error(`   Response: ${error.response}`);
    }
    
    console.error('\n📚 Stack trace:');
    console.error(error.stack);
    
    console.log('\n' + '━'.repeat(80));
    console.log('💡 POSSÍVEIS SOLUÇÕES:');
    console.log('━'.repeat(80));
    console.log('1. Verifique se as credenciais SMTP estão corretas no .env');
    console.log('2. Verifique se a senha de app do Gmail está válida');
    console.log('3. Verifique se a autenticação de 2 fatores está ativada no Gmail');
    console.log('4. Verifique se "Acesso de apps menos seguros" está permitido');
    console.log('5. Tente gerar uma nova senha de app em: https://myaccount.google.com/apppasswords');
    
    process.exit(1);
  }
}

// Executar teste
console.log('\n⏳ Iniciando teste em 2 segundos...\n');
setTimeout(() => {
  testarEnvio()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}, 2000);
