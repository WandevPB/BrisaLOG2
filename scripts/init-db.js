const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function initDatabase() {
  console.log('🚀 Inicializando banco de dados BrisaLOG Portal...\n');

  try {
    // Verificar se o banco já existe
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 Diretório de uploads criado');
    }

    // Testar conexão
    await prisma.$connect();
    console.log('✅ Conexão com o banco estabelecida');

    // Verificar se já existem dados
    const cdCount = await prisma.cd.count();
    
    if (cdCount === 0) {
      console.log('📊 Banco vazio - executando seed...');
      
      // Executar seed
      const { execSync } = require('child_process');
      execSync('node prisma/seed.js', { stdio: 'inherit' });
      
      console.log('\n✅ Banco inicializado com sucesso!');
    } else {
      console.log(`📊 Banco já possui ${cdCount} CDs cadastrados`);
    }

    // Mostrar estatísticas
    const stats = await Promise.all([
      prisma.cd.count(),
      prisma.fornecedor.count(),
      prisma.agendamento.count(),
      prisma.notaFiscal.count()
    ]);

    console.log('\n📈 Estatísticas do banco:');
    console.log(`   • CDs: ${stats[0]}`);
    console.log(`   • Fornecedores: ${stats[1]}`);
    console.log(`   • Agendamentos: ${stats[2]}`);
    console.log(`   • Notas Fiscais: ${stats[3]}`);

    console.log('\n🎉 Sistema pronto para uso!');
    console.log('\n🔗 URLs disponíveis:');
    console.log('   • Portal: http://localhost:3000');
    console.log('   • API: http://localhost:3000/api');
    console.log('   • Health: http://localhost:3000/health');

    console.log('\n🔑 Credenciais de login:');
    console.log('   • Usuário: Bahia | Senha: Brisanet123');
    console.log('   • Usuário: Pernambuco | Senha: Brisanet123');
    console.log('   • Usuário: LagoaNova | Senha: Brisanet123');

  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };
