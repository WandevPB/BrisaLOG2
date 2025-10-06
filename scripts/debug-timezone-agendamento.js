const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Reproduzir funções do servidor
function toLocalDateOnly(dateStr) {
  if (!dateStr) return null;
  if (typeof dateStr === 'string') {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts.map(Number);
      // Cria data no timezone local (Brasil)
      const date = new Date(year, month - 1, day, 0, 0, 0, 0);
      if (!isNaN(date)) return date;
    }
    // fallback: try parsing as ISO but convert to local
    const parsed = new Date(dateStr);
    if (!isNaN(parsed)) {
      // Convert UTC to local timezone (preserve date only)
      const localYear = parsed.getUTCFullYear();
      const localMonth = parsed.getUTCMonth();
      const localDay = parsed.getUTCDate();
      return new Date(localYear, localMonth, localDay, 0, 0, 0, 0);
    }
  }
  return null;
}

async function main() {
  try {
    console.log('🔍 Testando criação vs consulta de datas...\n');
    
    // 1. Testar como um agendamento seria criado
    const dataString = '2025-10-22';
    const dataCreation = toLocalDateOnly(dataString);
    console.log('📝 CRIAÇÃO:');
    console.log(`   Input: ${dataString}`);
    console.log(`   toLocalDateOnly result: ${dataCreation}`);
    console.log(`   toLocalDateOnly timestamp: ${dataCreation.getTime()}`);
    
    // 2. Testar como a consulta é feita
    const [ano, mes, dia] = dataString.split('-').map(Number);
    const inicioDia = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
    const fimDia = new Date(ano, mes - 1, dia, 23, 59, 59, 999);
    
    console.log('\n🔍 CONSULTA:');
    console.log(`   inicioDia: ${inicioDia}`);
    console.log(`   inicioDia timestamp: ${inicioDia.getTime()}`);
    console.log(`   fimDia: ${fimDia}`);
    console.log(`   fimDia timestamp: ${fimDia.getTime()}`);
    
    // 3. Comparar timestamps
    console.log('\n🧮 COMPARAÇÃO:');
    console.log(`   Criação == Consulta início: ${dataCreation.getTime() === inicioDia.getTime()}`);
    console.log(`   Criação >= Consulta início: ${dataCreation.getTime() >= inicioDia.getTime()}`);
    console.log(`   Criação <= Consulta fim: ${dataCreation.getTime() <= fimDia.getTime()}`);
    
    // 4. Verificar o agendamento real
    console.log('\n📋 AGENDAMENTO REAL (AGD000019):');
    const agendamento = await prisma.agendamento.findFirst({
      where: { codigo: 'AGD000019' },
      select: { dataEntrega: true }
    });
    
    if (agendamento) {
      console.log(`   dataEntrega real: ${agendamento.dataEntrega}`);
      console.log(`   timestamp real: ${agendamento.dataEntrega.getTime()}`);
      console.log(`   Real == Esperado: ${agendamento.dataEntrega.getTime() === dataCreation.getTime()}`);
      
      // Análise detalhada
      console.log('\n🕐 ANÁLISE DETALHADA:');
      console.log(`   Real: ${agendamento.dataEntrega.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      console.log(`   Esperado: ${dataCreation.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      console.log(`   Diferença em horas: ${(agendamento.dataEntrega.getTime() - dataCreation.getTime()) / (1000 * 60 * 60)}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();