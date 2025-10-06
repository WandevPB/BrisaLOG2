const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('🗑️ RESETANDO BANCO DE DADOS...');
  console.log('⚠️ Esta operação irá apagar TODOS os dados!');

  // Limpar dados existentes
  await prisma.respostaReagendamento.deleteMany();
  await prisma.bloqueioHorario.deleteMany();
  await prisma.historicoAcao.deleteMany();
  await prisma.notaFiscal.deleteMany();
  await prisma.agendamento.deleteMany();
  await prisma.fornecedor.deleteMany();
  await prisma.cd.deleteMany();

  console.log('🧹 Dados removidos com sucesso!');

  // Criar CDs
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
  console.log('🎉 Reset concluído com sucesso!');
  console.log('\n🔑 Credenciais de login:');
  console.log('• Usuário: Bahia | Senha: Brisanet123');
  console.log('• Usuário: Pernambuco | Senha: Brisanet123');
  console.log('• Usuário: LagoaNova | Senha: Brisanet123');
}

resetDatabase()
  .catch((e) => {
    console.error('❌ Erro durante o reset:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });