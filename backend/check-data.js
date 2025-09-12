const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  console.log('=== CDs cadastrados ===');
  const cds = await prisma.cD.findMany();
  cds.forEach(cd => {
    console.log(`ID: ${cd.id}, Nome: ${cd.nome}, Email: ${cd.email}`);
  });
  
  console.log('\n=== Agendamentos por CD ===');
  for (const cd of cds) {
    const count = await prisma.agendamento.count({ where: { cdId: cd.id } });
    console.log(`CD ${cd.id} (${cd.nome}): ${count} agendamentos`);
  }
  
  await prisma.$disconnect();
}

checkData().catch(console.error);
