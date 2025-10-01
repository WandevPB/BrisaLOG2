const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const ag = await prisma.agendamento.findUnique({ where: { id: 18 } });
  console.log(ag);
  process.exit();
})();
