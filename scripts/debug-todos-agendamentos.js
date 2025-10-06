const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Analisando todos os agendamentos do CD 2...\n');
    
    const agendamentos = await prisma.agendamento.findMany({
      where: { cdId: 2 },
      select: {
        codigo: true,
        dataEntrega: true,
        horarioEntrega: true,
        createdAt: true
      },
      orderBy: { dataEntrega: 'asc' }
    });
    
    agendamentos.forEach(ag => {
      const dataFormatada = ag.dataEntrega.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const criadoEm = ag.createdAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const horaData = ag.dataEntrega.getHours();
      
      console.log(`${ag.codigo}: ${dataFormatada} às ${ag.horarioEntrega} (criado: ${criadoEm}) [hora=${horaData}]`);
    });
    
    // Análise dos horários da data
    const horariosProblematicos = agendamentos.filter(ag => ag.dataEntrega.getHours() !== 0);
    
    console.log(`\n📊 RESUMO:`);
    console.log(`   Total de agendamentos: ${agendamentos.length}`);
    console.log(`   Com hora ≠ 00:00: ${horariosProblematicos.length}`);
    
    if (horariosProblematicos.length > 0) {
      console.log(`\n⚠️  AGENDAMENTOS COM PROBLEMA DE TIMEZONE:`);
      horariosProblematicos.forEach(ag => {
        console.log(`   ${ag.codigo}: hora=${ag.dataEntrega.getHours()}:${ag.dataEntrega.getMinutes().toString().padStart(2, '0')}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();