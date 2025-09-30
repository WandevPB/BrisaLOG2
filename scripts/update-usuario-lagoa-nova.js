const { PrismaClient } = require('@prisma/client');

async function updateUsuarioLagoaNova() {
  const prisma = new PrismaClient();
  try {
    const updated = await prisma.cd.updateMany({
      where: { usuario: 'lagoa_nova' },
      data: { usuario: 'central' }
    });
    console.log(`Usuários atualizados: ${updated.count}`);
  } catch (err) {
    console.error('Erro ao atualizar usuario:', err);
  } finally {
    await prisma.$disconnect();
  }
}

updateUsuarioLagoaNova();
