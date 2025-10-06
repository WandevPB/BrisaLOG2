const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔧 Corrigindo data do bloqueio...');
    
    // Primeiro, vamos ver todos os bloqueios
    const bloqueios = await prisma.bloqueioHorario.findMany({
      where: { ativo: true }
    });
    
    console.log('📋 Bloqueios atuais:');
    bloqueios.forEach(b => {
      console.log(`   ID: ${b.id}, CD: ${b.cdId}, Data: ${b.dataInicio.toISOString().split('T')[0]}, Horário: ${b.horarioInicio}-${b.horarioFim}`);
    });
    
    // Corrigir o bloqueio ID 8 para a data correta (06/10/2025)
    const bloqueioCorrigido = await prisma.bloqueioHorario.update({
      where: { id: 8 },
      data: {
        dataInicio: new Date(2025, 9, 6, 0, 0, 0, 0), // 06/10/2025 local (mês 9 = outubro)
        dataFim: new Date(2025, 9, 6, 0, 0, 0, 0)     // 06/10/2025 local
      }
    });
    
    console.log('✅ Bloqueio corrigido:');
    console.log(`   ID: ${bloqueioCorrigido.id}, Data: ${bloqueioCorrigido.dataInicio.toISOString().split('T')[0]}, Horário: ${bloqueioCorrigido.horarioInicio}-${bloqueioCorrigido.horarioFim}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();