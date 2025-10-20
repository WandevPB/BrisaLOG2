const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔧 Corrigindo agendamento AGD000019 especificamente...\n');
    
    // Verificar status atual
    const antes = await prisma.agendamento.findFirst({
      where: { codigo: 'AGD000019' },
      select: { id: true, dataEntrega: true, horarioEntrega: true }
    });
    
    console.log('📋 ANTES:');
    console.log(`   Data: ${antes.dataEntrega}`);
    console.log(`   Timestamp: ${antes.dataEntrega.getTime()}`);
    console.log(`   Horário: ${antes.horarioEntrega}`);
    
    // Corrigir: deveria ser 22/10/2025 00:00:00
    const dataCorreta = new Date(2025, 9, 22, 0, 0, 0, 0); // mês 9 = outubro
    
    console.log('\n🔧 CORREÇÃO:');
    console.log(`   Nova data: ${dataCorreta}`);
    console.log(`   Timestamp: ${dataCorreta.getTime()}`);
    
    // Aplicar correção
    await prisma.agendamento.update({
      where: { id: antes.id },
      data: { dataEntrega: dataCorreta }
    });
    
    // Verificar resultado
    const depois = await prisma.agendamento.findFirst({
      where: { codigo: 'AGD000019' },
      select: { dataEntrega: true, horarioEntrega: true }
    });
    
    console.log('\n✅ DEPOIS:');
    console.log(`   Data: ${depois.dataEntrega}`);
    console.log(`   Timestamp: ${depois.dataEntrega.getTime()}`);
    console.log(`   Horário: ${depois.horarioEntrega}`);
    
    // Testar se agora será encontrado na consulta do dia 22/10
    const consulta22 = await prisma.agendamento.findMany({
      where: {
        dataEntrega: {
          gte: new Date(2025, 9, 22, 0, 0, 0, 0),
          lte: new Date(2025, 9, 22, 23, 59, 59, 999)
        },
        cdId: 2,
        status: { not: 'cancelado' }
      },
      select: { codigo: true, horarioEntrega: true }
    });
    
    console.log(`\n🔍 Consulta para 22/10/2025: ${consulta22.length} agendamentos`);
    consulta22.forEach(ag => {
      console.log(`   - ${ag.codigo} às ${ag.horarioEntrega}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();