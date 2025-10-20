const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corrigirFornecedoresEntrega() {
  try {
    console.log('🔧 Iniciando correção dos fornecedores de entrega...');
    
    // Buscar agendamentos criados hoje com status 'entregue' e tipoRegistro 'fora_agendamento'
    const agendamentosParaCorrigir = await prisma.agendamento.findMany({
      where: {
        status: 'entregue',
        tipoRegistro: 'fora_agendamento',
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)) // Desde o início de hoje
        }
      },
      include: {
        fornecedor: true
      }
    });
    
    console.log(`📋 Encontrados ${agendamentosParaCorrigir.length} agendamentos para verificar:`);
    
    for (const agendamento of agendamentosParaCorrigir) {
      console.log(`\n🔍 Agendamento ${agendamento.codigo}:`);
      console.log(`   Fornecedor atual: ${agendamento.fornecedor.nome}`);
      console.log(`   Email: ${agendamento.fornecedor.email}`);
      console.log(`   CNPJ: ${agendamento.fornecedor.documento}`);
      
      // Se o fornecedor é "Rosilda Tavares" ou similiar, vamos corrigir
      if (agendamento.fornecedor.nome.toLowerCase().includes('rosilda') || 
          agendamento.fornecedor.email === 'wandevpb@gmail.com') {
        console.log(`   ⚠️  Este agendamento precisa de correção!`);
        
        // Vamos criar um novo fornecedor com dados genéricos
        const novoFornecedor = await prisma.fornecedor.create({
          data: {
            nome: `EMPRESA REGISTRADA PELO CD - ${agendamento.codigo}`,
            email: `entrega-${agendamento.codigo.toLowerCase()}@cd.local`,
            telefone: '(00) 00000-0000',
            documento: `TEMP-${Date.now()}-${agendamento.id}` // CNPJ temporário único
          }
        });
        
        // Atualizar o agendamento para usar o novo fornecedor
        await prisma.agendamento.update({
          where: { id: agendamento.id },
          data: { fornecedorId: novoFornecedor.id }
        });
        
        console.log(`   ✅ Fornecedor corrigido para: ${novoFornecedor.nome}`);
      } else {
        console.log(`   ✅ Fornecedor parece correto, não precisa de correção.`);
      }
    }
    
    console.log('\n🎉 Correção concluída!');
    
  } catch (error) {
    console.error('❌ Erro na correção:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
corrigirFornecedoresEntrega();