const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const ags = await prisma.agendamento.findMany();
  let count = 0;
  for (const ag of ags) {
    if (ag.dataEntrega) {
      const dt = new Date(ag.dataEntrega);
      // Se estiver em UTC (03:00:00.000Z), ajusta para 00:00 UTC (meia-noite Brasília)
      if (dt.getUTCHours() === 3 && dt.getUTCMinutes() === 0 && dt.getUTCSeconds() === 0) {
        dt.setUTCHours(0);
        await prisma.agendamento.update({
          where: { id: ag.id },
          data: { dataEntrega: dt }
        });
        count++;
        console.log(`Corrigido agendamento id ${ag.id}: ${ag.dataEntrega} => ${dt.toISOString()}`);
      }
      // Se estiver em UTC (06:00:00.000Z), ajusta para 03:00 UTC (meia-noite Brasília)
      else if (dt.getUTCHours() === 6 && dt.getUTCMinutes() === 0 && dt.getUTCSeconds() === 0) {
        dt.setUTCHours(3);
        await prisma.agendamento.update({
          where: { id: ag.id },
          data: { dataEntrega: dt }
        });
        count++;
        console.log(`Corrigido agendamento id ${ag.id}: ${ag.dataEntrega} => ${dt.toISOString()}`);
      }
    }
  }
  console.log(`Total corrigidos: ${count}`);
  process.exit();
})();
