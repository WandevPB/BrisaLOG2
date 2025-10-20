const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const agendamento = await prisma.agendamento.findUnique({
    where: { id: 16 },
    select: { id: true, dataEntrega: true }
  });
  if (!agendamento) {
    console.log('Agendamento id=16 não encontrado.');
  } else {
    console.log('Agendamento:', agendamento);
    console.log('dataEntrega (ISO):', agendamento.dataEntrega);
    if (agendamento.dataEntrega instanceof Date) {
      console.log('dataEntrega (toISOString):', agendamento.dataEntrega.toISOString());
    }
  }
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
});
