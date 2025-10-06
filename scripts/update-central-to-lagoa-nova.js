const { PrismaClient } = require('@prisma/client');

async function updateCentralToLagoaNova() {
  const prisma = new PrismaClient();
  try {
    // Atualizar o nome do CD de "CENTRAL" para "Lagoa Nova"
    const updated = await prisma.cd.updateMany({
      where: { nome: 'CENTRAL' },
      data: { nome: 'Lagoa Nova' }
    });
    console.log(`CD atualizado de CENTRAL para Lagoa Nova: ${updated.count} registros`);
    
    // Verificar o resultado
    const cds = await prisma.cd.findMany();
    console.log('\nTodos os CDs no banco de dados:');
    cds.forEach(cd => {
      console.log(`- ID: ${cd.id}, Nome: ${cd.nome}`);
    });
    
  } catch (err) {
    console.error('Erro ao atualizar nome do CD:', err);
  } finally {
    await prisma.$disconnect();
  }
}

updateCentralToLagoaNova();