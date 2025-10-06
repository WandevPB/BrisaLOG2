const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('📋 Listando agendamentos do CD Pernambuco (ID: 2)...');
    
    const agendamentos = await prisma.agendamento.findMany({
      where: { 
        cdId: 2,
        status: { not: 'cancelado' }
      },
      select: {
        id: true,
        codigo: true,
        dataEntrega: true,
        horarioEntrega: true,
        status: true
      },
      orderBy: {
        dataEntrega: 'asc'
      }
    });
    
    console.log(`Encontrados ${agendamentos.length} agendamentos:`);
    agendamentos.forEach(ag => {
      const dataFormatada = ag.dataEntrega.toISOString().split('T')[0];
      console.log(`   - ${ag.codigo}: ${dataFormatada} às ${ag.horarioEntrega} (${ag.status})`);
    });
    
    // Verificar se há agendamentos para datas específicas
    const datasTeste = ['2025-10-06', '2025-10-07', '2025-10-14', '2025-10-22'];
    
    for (const data of datasTeste) {
      const [ano, mes, dia] = data.split('-').map(Number);
      const inicioDia = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
      const fimDia = new Date(ano, mes - 1, dia, 23, 59, 59, 999);
      
      const agendamentosData = await prisma.agendamento.findMany({
        where: {
          cdId: 2,
          dataEntrega: {
            gte: inicioDia,
            lte: fimDia
          },
          status: { not: 'cancelado' }
        }
      });
      
      console.log(`📅 Data ${data}: ${agendamentosData.length} agendamentos`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();