const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');
  console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
  console.log('🗄️ DATABASE_URL configurada:', process.env.DATABASE_URL ? 'SIM' : 'NÃO');

  // Verificar se já existem CDs
  const existingCds = await prisma.cd.count();
  
  if (existingCds > 0) {
    console.log('✅ CDs já existem no banco. Seed não será executado para preservar dados existentes.');
    console.log(`📊 Total de CDs existentes: ${existingCds}`);
    
    // Listar os CDs existentes
    const cds = await prisma.cd.findMany({
      select: { id: true, nome: true, usuario: true, ativo: true }
    });
    console.log('🏢 CDs ativos:', cds.filter(cd => cd.ativo).map(cd => `${cd.nome} (ID: ${cd.id})`).join(', '));
    console.log('📋 Todos os CDs:', cds.map(cd => `${cd.nome} (${cd.usuario}) - Ativo: ${cd.ativo}`));
    return;
  }

  console.log('🔧 Criando CDs iniciais (primeira execução)...');

  // Criar CDs apenas se não existirem
  const senhaHash = await bcrypt.hash('Brisanet123', 10);
  
  const cds = await Promise.all([
    prisma.cd.create({
      data: {
        nome: 'Bahia',
        usuario: 'Bahia',
        senha: senhaHash,
        primeiroLogin: true,
        ativo: true
      }
    }),
    prisma.cd.create({
      data: {
        nome: 'Pernambuco',
        usuario: 'Pernambuco',
        senha: senhaHash,
        primeiroLogin: true,
        ativo: true
      }
    }),
    prisma.cd.create({
      data: {
        nome: 'Lagoa Nova',
        usuario: 'LagoaNova',
        senha: senhaHash,
        primeiroLogin: true,
        ativo: true
      }
    })
  ]);

  console.log('✅ CDs criados:', cds.map(cd => cd.nome));

  console.log('🎉 Seed concluído com sucesso!');
  
  // Mostrar resumo
  const totalCds = await prisma.cd.count();
  
  console.log('\n📊 Resumo dos dados criados:');
  console.log(`• CDs: ${totalCds}`);
  console.log('\n🔑 Credenciais de login:');
  console.log('• Usuário: Bahia | Senha: Brisanet123');
  console.log('• Usuário: Pernambuco | Senha: Brisanet123');
  console.log('• Usuário: LagoaNova | Senha: Brisanet123');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
