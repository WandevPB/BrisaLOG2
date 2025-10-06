const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔧 Forçando correção de TODOS os agendamentos para 00:00...\n');
    
    // Buscar TODOS os agendamentos
    const agendamentos = await prisma.agendamento.findMany({
      select: {
        id: true,
        codigo: true,
        dataEntrega: true,
        horarioEntrega: true
      }
    });
    
    console.log(`📋 Encontrados ${agendamentos.length} agendamentos no total:`);
    
    let corrigidos = 0;
    
    for (const ag of agendamentos) {
      const dataOriginal = ag.dataEntrega;
      const horaOriginal = dataOriginal.getHours();
      const minutosOriginais = dataOriginal.getMinutes();
      
      console.log(`   ${ag.codigo}: ${dataOriginal.toLocaleString('pt-BR')} [hora=${horaOriginal}:${minutosOriginais.toString().padStart(2, '0')}]`);
      
      // Se não está em 00:00, forçar para 00:00
      if (horaOriginal !== 0 || minutosOriginais !== 0) {
        // Criar nova data: mesmo dia mas 00:00:00
        const ano = dataOriginal.getFullYear();
        const mes = dataOriginal.getMonth();
        const dia = dataOriginal.getDate();
        const dataCorrigida = new Date(ano, mes, dia, 0, 0, 0, 0);
        
        // Se está no horário 21:00, significa que é do dia anterior e precisa ser do dia seguinte
        if (horaOriginal === 21) {
          dataCorrigida.setDate(dia + 1);
        }
        
        console.log(`      -> CORREÇÃO: ${dataCorrigida.toLocaleString('pt-BR')}`);
        
        // Atualizar no banco
        await prisma.agendamento.update({
          where: { id: ag.id },
          data: { dataEntrega: dataCorrigida }
        });
        
        corrigidos++;
      } else {
        console.log(`      -> OK (já está em 00:00)`);
      }
    }
    
    console.log(`\n✅ Correção concluída! ${corrigidos} agendamentos corrigidos.`);
    
    // Verificar especificamente o AGD000019
    console.log('\n🔍 Verificando AGD000019 após correção...');
    const agd19 = await prisma.agendamento.findFirst({
      where: { codigo: 'AGD000019' },
      select: {
        dataEntrega: true,
        horarioEntrega: true
      }
    });
    
    if (agd19) {
      console.log(`   Data final: ${agd19.dataEntrega.toLocaleString('pt-BR')}`);
      console.log(`   Hora: ${agd19.dataEntrega.getHours()}:${agd19.dataEntrega.getMinutes().toString().padStart(2, '0')}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();