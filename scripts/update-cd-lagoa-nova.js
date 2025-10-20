const { PrismaClient } = require('@prisma/client');

async function updateCentralToLagoaNova() {
  const prisma = new PrismaClient();
  try {
    const updated = await prisma.cd.updateMany({
      where: { nome: 'CENTRAL' },
      data: { nome: 'Lagoa Nova' }
    });
    console.log(`Registros atualizados: ${updated.count}`);
  } catch (err) {
    console.error('Erro ao atualizar nome do CD:', err);
  } finally {
    await prisma.$disconnect();
  }
}

updateCentralToLagoaNova();
