const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Debug do agendamento AGD000019...');
    
    const agendamento = await prisma.agendamento.findFirst({
      where: { codigo: 'AGD000019' },
      select: {
        id: true,
        codigo: true,
        dataEntrega: true,
        horarioEntrega: true,
        status: true,
        cdId: true,
        cd: {
          select: { nome: true }
        }
      }
    });
    
    if (agendamento) {
      console.log('📋 Dados do agendamento:');
      console.log(`   - Código: ${agendamento.codigo}`);
      console.log(`   - CD: ${agendamento.cd.nome} (ID: ${agendamento.cdId})`);
      console.log(`   - Data original: ${agendamento.dataEntrega}`);
      console.log(`   - Data ISO: ${agendamento.dataEntrega.toISOString()}`);
      console.log(`   - Horário: ${agendamento.horarioEntrega}`);
      console.log(`   - Status: ${agendamento.status}`);
      
      // Testar a mesma query que o endpoint usa
      const dataConsulta = '2025-10-22';
      const [ano, mes, dia] = dataConsulta.split('-').map(Number);
      const inicioDia = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
      const fimDia = new Date(ano, mes - 1, dia, 23, 59, 59, 999);
      
      console.log('\n🔍 Testando query do endpoint:');
      console.log(`   - inicioDia: ${inicioDia}`);
      console.log(`   - fimDia: ${fimDia}`);
      
      const agendamentosQuery = await prisma.agendamento.findMany({
        where: {
          dataEntrega: {
            gte: inicioDia,
            lte: fimDia
          },
          cdId: 2,
          status: { not: 'cancelado' }
        },
        select: {
          codigo: true,
          dataEntrega: true,
          horarioEntrega: true,
          status: true
        }
      });
      
      console.log(`\n📊 Resultado da query: ${agendamentosQuery.length} agendamentos encontrados`);
      agendamentosQuery.forEach(ag => {
        console.log(`   - ${ag.codigo}: ${ag.dataEntrega} às ${ag.horarioEntrega} (${ag.status})`);
      });
      
      // Verificar se a data está no range
      const dataAgendamento = agendamento.dataEntrega;
      console.log('\n🧮 Comparação de datas:');
      console.log(`   - Data agendamento: ${dataAgendamento.getTime()}`);
      console.log(`   - Início do dia: ${inicioDia.getTime()}`);
      console.log(`   - Fim do dia: ${fimDia.getTime()}`);
      console.log(`   - Data >= início: ${dataAgendamento.getTime() >= inicioDia.getTime()}`);
      console.log(`   - Data <= fim: ${dataAgendamento.getTime() <= fimDia.getTime()}`);
    } else {
      console.log('❌ Agendamento AGD000019 não encontrado!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();