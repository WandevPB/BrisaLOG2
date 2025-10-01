const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const ags = await prisma.agendamento.findMany({
    orderBy: { id: 'desc' },
    take: 5
  });
  for (const ag of ags) {
    console.log({
      id: ag.id,
      dataEntrega: ag.dataEntrega,
      horarioEntrega: ag.horarioEntrega,
      createdAt: ag.createdAt
    });
  }
  process.exit();
})();
