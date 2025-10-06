const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔧 Corrigindo timezone dos agendamentos existentes...\n');
    
    // Buscar todos os agendamentos
    const agendamentos = await prisma.agendamento.findMany({
      select: {
        id: true,
        codigo: true,
        dataEntrega: true,
        horarioEntrega: true
      }
    });
    
    console.log(`📋 Analisando ${agendamentos.length} agendamentos:`);
    
    let corrigidos = 0;
    
    for (const ag of agendamentos) {
      const dataOriginal = ag.dataEntrega;
      const horaOriginal = dataOriginal.getHours();
      
      // Se a hora não é 00:00, precisa corrigir
      if (horaOriginal !== 0) {
        // Adicionar 3 horas para corrigir o timezone (21:00 -> 00:00 do dia seguinte)
        const dataCorrigida = new Date(dataOriginal.getTime() + (3 * 60 * 60 * 1000));
        
        console.log(`   ${ag.codigo}: ${dataOriginal.toLocaleString('pt-BR')} -> ${dataCorrigida.toLocaleString('pt-BR')}`);
        
        // Atualizar no banco
        await prisma.agendamento.update({
          where: { id: ag.id },
          data: { dataEntrega: dataCorrigida }
        });
        
        corrigidos++;
      } else {
        console.log(`   ${ag.codigo}: OK (já está em 00:00)`);
      }
    }
    
    console.log(`\n✅ Correção concluída! ${corrigidos} agendamentos corrigidos.`);
    
    // Verificar se a correção funcionou
    console.log('\n🔍 Verificando correção...');
    const agendamentosAposCorrecao = await prisma.agendamento.findMany({
      where: { cdId: 2 },
      select: {
        codigo: true,
        dataEntrega: true,
        horarioEntrega: true
      },
      orderBy: { dataEntrega: 'asc' }
    });
    
    agendamentosAposCorrecao.forEach(ag => {
      const dataFormatada = ag.dataEntrega.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const horaData = ag.dataEntrega.getHours();
      console.log(`   ${ag.codigo}: ${dataFormatada} [hora=${horaData}] ✅`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();