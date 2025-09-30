const { PrismaClient } = require('@prisma/client');

async function testBloqueioInsert() {
  const prisma = new PrismaClient();
  try {
    // Troque o cdId para um ID válido do seu banco
    const cdId = 1;
    const bloqueio = await prisma.bloqueioHorario.create({
      data: {
        dataInicio: new Date('2025-10-01'),
        dataFim: new Date('2025-10-01'),
        horarioInicio: '08:00',
        horarioFim: '09:00',
        motivo: 'Teste manual',
        ativo: true,
        cdId
      }
    });
    console.log('Bloqueio criado:', bloqueio);
    const bloqueios = await prisma.bloqueioHorario.findMany({ where: { cdId } });
    console.log('Bloqueios do CD:', bloqueios);
  } catch (err) {
    console.error('Erro ao testar bloqueio:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testBloqueioInsert();
