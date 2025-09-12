const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listCDs() {
  try {
    const cds = await prisma.cd.findMany();
    console.log('=== CDs encontrados ===');
    cds.forEach(cd => {
      console.log(`ID: ${cd.id}, Nome: ${cd.nome}, Usuario: ${cd.usuario}`);
    });
    
    // Verificar quantos agendamentos cada CD tem
    console.log('\n=== Agendamentos por CD ===');
    for (const cd of cds) {
      const count = await prisma.agendamento.count({ where: { cdId: cd.id } });
      console.log(`CD ${cd.id} (${cd.nome}): ${count} agendamentos`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listCDs();
