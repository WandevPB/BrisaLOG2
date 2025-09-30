const { PrismaClient } = require('@prisma/client');

async function deleteUser1() {
  const prisma = new PrismaClient();
  try {
    const deleted = await prisma.cd.deleteMany({
      where: { usuario: '1' }
    });
    console.log(`Registros removidos: ${deleted.count}`);
  } catch (err) {
    console.error('Erro ao remover usuário 1:', err);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser1();
