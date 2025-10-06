const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Reproduzir função do servidor
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
    console.log('🔍 Testando consulta com função corrigida...\n');
    
    // Testar para 22/10/2025 (onde deveria estar o AGD000019)
    const dataConsulta = '2025-10-22';
    const [ano, mes, dia] = dataConsulta.split('-').map(Number);
    
    // NOVA abordagem: usar toLocalDateOnly (como na correção)
    const inicioDia = toLocalDateOnly(`${ano}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`);
    const fimDia = new Date(inicioDia.getTime() + (24 * 60 * 60 * 1000) - 1);
    
    console.log(`📅 Consultando: ${dataConsulta}`);
    console.log(`📊 Range: ${inicioDia} até ${fimDia}`);
    console.log(`📊 Timestamps: ${inicioDia.getTime()} até ${fimDia.getTime()}\n`);
    
    const agendamentos = await prisma.agendamento.findMany({
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
    
    console.log(`✅ Resultado: ${agendamentos.length} agendamentos encontrados`);
    agendamentos.forEach(ag => {
      console.log(`   - ${ag.codigo}: ${ag.dataEntrega} às ${ag.horarioEntrega} (${ag.status})`);
      console.log(`     Timestamp: ${ag.dataEntrega.getTime()}`);
    });
    
    // Verificar especificamente o AGD000019
    console.log('\n🔍 Status do AGD000019:');
    const agd19 = await prisma.agendamento.findFirst({
      where: { codigo: 'AGD000019' },
      select: { dataEntrega: true, horarioEntrega: true }
    });
    
    if (agd19) {
      console.log(`   Data atual: ${agd19.dataEntrega}`);
      console.log(`   Timestamp: ${agd19.dataEntrega.getTime()}`);
      console.log(`   Está no range? ${agd19.dataEntrega.getTime() >= inicioDia.getTime() && agd19.dataEntrega.getTime() <= fimDia.getTime()}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();