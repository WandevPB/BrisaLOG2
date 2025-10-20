const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const ags = await prisma.agendamento.findMany();
  let count = 0;
  for (const ag of ags) {
    if (ag.dataEntrega) {
      // Extrai a data no formato 'YYYY-MM-DD'
      const iso = ag.dataEntrega.toISOString().split('T')[0];
      const [ano, mes, dia] = iso.split('-').map(Number);
      // Cria a data como meia-noite UTC do dia correto
      const dataUTC = new Date(Date.UTC(ano, mes - 1, dia));
      // Só atualiza se for diferente
      if (ag.dataEntrega.getTime() !== dataUTC.getTime()) {
        await prisma.agendamento.update({
          where: { id: ag.id },
          data: { dataEntrega: dataUTC }
        });
        count++;
        console.log(`Corrigido agendamento id ${ag.id}: ${ag.dataEntrega.toISOString()} => ${dataUTC.toISOString()}`);
      }
    }
  }
  console.log(`Total corrigidos: ${count}`);
  process.exit();
})();
