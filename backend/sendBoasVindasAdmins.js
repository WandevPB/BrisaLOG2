/**
 * Script para enviar e-mails de boas-vindas aos gestores administrativos
 * Dispara todos os e-mails de uma vez com as credenciais de primeiro acesso
 */

const nodemailer = require('nodemailer');
const boasVindasAdminTemplate = require('./emails/boasVindasAdmin');

// Configuração do Resend
const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 465,
  secure: true,
  auth: {
    user: 'resend',
    pass: process.env.RESEND_API_KEY
  }
});

// Lista de gestores admin
const gestores = [
  {
    nome: 'Wanderson',
    usuario: 'wanderson',
    email: 'wanderson.goncalves@grupobrisanet.com.br'
  },
  {
    nome: 'Andrey',
    usuario: 'andrey',
    email: 'andreygomes@grupobrisanet.com.br'
  },
  {
    nome: 'Galhardo',
    usuario: 'galhardo',
    email: 'eduardo.galhardo@timebrisa.com.br'
  },
  {
    nome: 'Leonarde',
    usuario: 'leonardo',
    email: 'leonarde.frederique@grupobrisanet.com.br'
  }
];

const senhaTemporaria = 'Brisanet123';
const baseURL = 'https://brisalog-agenda.online';

// Função para gerar link de primeiro acesso com autenticação automática
function gerarLinkPrimeiroAcesso(usuario, senha) {
  // Link direto para redefinir senha com parâmetros de autenticação
  const params = new URLSearchParams({
    user: usuario,
    temp: senha,
    firstLogin: 'true'
  });
  return `${baseURL}/redefinir-senha.html?${params.toString()}`;
}

// Função para enviar email individual
async function enviarEmailBoasVindas(gestor) {
  try {
    const linkPrimeiroAcesso = gerarLinkPrimeiroAcesso(gestor.usuario, senhaTemporaria);
    
    const htmlContent = boasVindasAdminTemplate({
      nome: gestor.nome,
      usuario: gestor.usuario,
      senha: senhaTemporaria,
      linkPrimeiroAcesso: linkPrimeiroAcesso
    });

    const mailOptions = {
      from: 'BrisaLOG - Sistema de Agendamento <noreply@brisalog-agenda.online>',
      to: gestor.email,
      subject: '👑 Boas-vindas! Seu Acesso Admin ao BrisaLOG foi Criado',
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email enviado para ${gestor.nome} (${gestor.email})`);
    console.log(`   📧 Message ID: ${info.messageId}`);
    console.log(`   🔗 Link de acesso: ${linkPrimeiroAcesso}`);
    
    return { success: true, gestor: gestor.nome, email: gestor.email };
  } catch (error) {
    console.error(`❌ Erro ao enviar email para ${gestor.nome}:`, error.message);
    return { success: false, gestor: gestor.nome, email: gestor.email, error: error.message };
  }
}

// Função principal para disparar todos os emails
async function dispararTodosEmails() {
  console.log('🚀 Iniciando envio de e-mails de boas-vindas aos gestores admin...\n');
  console.log(`📊 Total de gestores: ${gestores.length}\n`);
  console.log('━'.repeat(80));
  
  const resultados = [];
  
  for (const gestor of gestores) {
    console.log(`\n📤 Enviando e-mail para: ${gestor.nome} <${gestor.email}>`);
    const resultado = await enviarEmailBoasVindas(gestor);
    resultados.push(resultado);
    
    // Aguardar 1 segundo entre envios para evitar rate limit
    if (gestores.indexOf(gestor) < gestores.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n' + '━'.repeat(80));
  console.log('\n📊 RESUMO DO ENVIO:\n');
  
  const sucessos = resultados.filter(r => r.success);
  const falhas = resultados.filter(r => !r.success);
  
  console.log(`✅ Enviados com sucesso: ${sucessos.length}`);
  sucessos.forEach(r => console.log(`   • ${r.gestor} (${r.email})`));
  
  if (falhas.length > 0) {
    console.log(`\n❌ Falhas no envio: ${falhas.length}`);
    falhas.forEach(r => console.log(`   • ${r.gestor} (${r.email}) - ${r.error}`));
  }
  
  console.log('\n' + '━'.repeat(80));
  console.log('\n🎉 Processo finalizado!\n');
  
  // Retornar resumo
  return {
    total: resultados.length,
    sucessos: sucessos.length,
    falhas: falhas.length,
    detalhes: resultados
  };
}

// Executar se chamado diretamente
if (require.main === module) {
  dispararTodosEmails()
    .then(resumo => {
      console.log('✨ Script concluído com sucesso!');
      process.exit(resumo.falhas > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { dispararTodosEmails, enviarEmailBoasVindas };
