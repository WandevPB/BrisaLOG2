const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Função para converter timestamp para formato brasileiro sem timezone
function toLocalDateOnly(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function corrigirTodosAgendamentos() {
    console.log('🔧 CORREÇÃO GLOBAL: Todos os agendamentos com timezone incorreto');
    console.log('=' * 70);
    
    try {
        // Buscar todos os agendamentos
        const todosAgendamentos = await prisma.agendamento.findMany({
            orderBy: { id: 'asc' }
        });
        
        console.log(`📊 Total de agendamentos encontrados: ${todosAgendamentos.length}`);
        
        let corrigidos = 0;
        let problematicos = [];
        
        for (const agendamento of todosAgendamentos) {
            const dataOriginal = new Date(agendamento.dataEntrega);
            const hora = dataOriginal.getHours();
            
            // Verificar se o agendamento tem o problema de timezone (-3h)
            // Se a hora é 21:00, provavelmente deveria ser 00:00 do dia seguinte
            if (hora === 21) {
                console.log(`\n🔍 Analisando AGD${String(agendamento.id).padStart(6, '0')}:`);
                console.log(`   Data atual: ${agendamento.dataEntrega}`);
                console.log(`   Hora atual: ${hora}:00`);
                
                // Criar nova data: dia seguinte às 00:00
                const novaData = new Date(dataOriginal);
                novaData.setDate(novaData.getDate() + 1);
                novaData.setHours(0, 0, 0, 0);
                
                console.log(`   Nova data: ${novaData}`);
                
                // Verificar se a correção faz sentido (não deve ser fim de semana)
                const diaSemana = novaData.getDay(); // 0 = domingo, 6 = sábado
                if (diaSemana === 0 || diaSemana === 6) {
                    console.log(`   ⚠️ PULANDO: Nova data seria fim de semana (${diaSemana === 0 ? 'domingo' : 'sábado'})`);
                    problematicos.push({
                        id: agendamento.id,
                        codigo: agendamento.codigo,
                        motivo: 'Nova data seria fim de semana'
                    });
                    continue;
                }
                
                // Atualizar agendamento
                await prisma.agendamento.update({
                    where: { id: agendamento.id },
                    data: { dataEntrega: novaData }
                });
                
                console.log(`   ✅ CORRIGIDO: ${agendamento.dataEntrega} → ${novaData}`);
                corrigidos++;
                
            } else if (hora !== 0) {
                // Agendamento com horário diferente de 00:00 e 21:00
                console.log(`\n⚠️ AGD${String(agendamento.id).padStart(6, '0')}: Horário não padrão (${hora}:00)`);
                problematicos.push({
                    id: agendamento.id,
                    codigo: agendamento.codigo,
                    hora: hora,
                    motivo: 'Horário não padrão'
                });
            }
        }
        
        console.log(`\n📋 RESUMO DA CORREÇÃO:`);
        console.log(`✅ Agendamentos corrigidos: ${corrigidos}`);
        console.log(`⚠️ Agendamentos problemáticos: ${problematicos.length}`);
        
        if (problematicos.length > 0) {
            console.log(`\n📝 Agendamentos que precisam de análise manual:`);
            problematicos.forEach(item => {
                console.log(`   • AGD${String(item.id).padStart(6, '0')} (${item.codigo}): ${item.motivo}${item.hora ? ` - Hora: ${item.hora}:00` : ''}`);
            });
        }
        
        // Verificar resultado final
        console.log(`\n🔍 VERIFICAÇÃO FINAL:`);
        const agendamentosApos = await prisma.agendamento.findMany({
            orderBy: { id: 'asc' }
        });
        
        let comProblema = 0;
        let corretos = 0;
        
        agendamentosApos.forEach(agd => {
            const hora = new Date(agd.dataEntrega).getHours();
            if (hora === 21) {
                comProblema++;
            } else if (hora === 0) {
                corretos++;
            }
        });
        
        console.log(`📊 Status final:`);
        console.log(`   ✅ Agendamentos às 00:00 (corretos): ${corretos}`);
        console.log(`   ❌ Agendamentos às 21:00 (com problema): ${comProblema}`);
        console.log(`   ❓ Outros horários: ${agendamentosApos.length - corretos - comProblema}`);
        
        if (comProblema === 0) {
            console.log(`\n🎉 SUCESSO TOTAL: Todos os agendamentos foram corrigidos!`);
        } else {
            console.log(`\n⚠️ Ainda existem ${comProblema} agendamentos com timezone incorreto`);
        }
        
    } catch (error) {
        console.error('❌ Erro na correção global:', error);
    } finally {
        await prisma.$disconnect();
    }
}

corrigirTodosAgendamentos();