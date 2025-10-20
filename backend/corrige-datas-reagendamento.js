const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const respostas = await prisma.respostaReagendamento.findMany();
  let count = 0;
  for (const resp of respostas) {
    if (resp.novaData) {
      const dt = new Date(resp.novaData);
      // Corrige datas salvas com hora errada (ex: 03:00 UTC ou 06:00 UTC)
      if (dt.getUTCHours() === 3 && dt.getUTCMinutes() === 0 && dt.getUTCSeconds() === 0) {
        dt.setUTCHours(0);
        await prisma.respostaReagendamento.update({
          where: { id: resp.id },
          data: { novaData: dt }
        });
        count++;
        console.log(`Corrigido resposta id ${resp.id}: ${resp.novaData} => ${dt.toISOString()}`);
      } else if (dt.getUTCHours() === 6 && dt.getUTCMinutes() === 0 && dt.getUTCSeconds() === 0) {
        dt.setUTCHours(3);
        await prisma.respostaReagendamento.update({
          where: { id: resp.id },
          data: { novaData: dt }
        });
        count++;
        console.log(`Corrigido resposta id ${resp.id}: ${resp.novaData} => ${dt.toISOString()}`);
      }
    }
  }
  console.log(`Total corrigidos: ${count}`);
  process.exit();
})();
