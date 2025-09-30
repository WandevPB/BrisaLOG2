const { PrismaClient } = require('@prisma/client');

async function updateLagoaNovaToCentral() {
  const prisma = new PrismaClient();
  try {
    const updated = await prisma.cd.updateMany({
      where: { nome: 'Lagoa Nova' },
      data: { nome: 'CENTRAL' }
    });
    console.log(`Registros atualizados: ${updated.count}`);
  } catch (err) {
    console.error('Erro ao atualizar nome do CD:', err);
  } finally {
    await prisma.$disconnect();
  }
}

updateLagoaNovaToCentral();
