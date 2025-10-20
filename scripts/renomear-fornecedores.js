const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function renomearFornecedores() {
  try {
    console.log('🔧 Renomeando fornecedores com nomes mais simples...');
    
    // Buscar fornecedores que foram criados pela correção
    const fornecedores = await prisma.fornecedor.findMany({
      where: {
        OR: [
          { nome: { contains: 'EMPRESA REGISTRADA' } },
          { nome: { contains: 'EMPRESA REGISTRADA PELO CD' } },
          { email: { contains: '@cd.local' } }
        ]
      },
      orderBy: {
        id: 'asc'
      }
    });
    
    console.log(`📋 Encontrados ${fornecedores.length} fornecedores para renomear:`);
    
    for (let i = 0; i < fornecedores.length; i++) {
      const fornecedor = fornecedores[i];
      const novoNome = `EMPRESA ${i + 1}`;
      
      await prisma.fornecedor.update({
        where: { id: fornecedor.id },
        data: { nome: novoNome }
      });
      
      console.log(`   ✅ ${fornecedor.nome} → ${novoNome}`);
    }
    
    console.log('\n🎉 Renomeação concluída!');
    
  } catch (error) {
    console.error('❌ Erro na renomeação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
renomearFornecedores();