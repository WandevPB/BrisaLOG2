const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAgendamentosForCD13() {
  try {
    console.log('🔍 Verificando CD 13...');
    
    // Verificar se CD 13 existe
    const cd13 = await prisma.cd.findUnique({ where: { id: 13 } });
    console.log('CD 13:', cd13);
    
    if (!cd13) {
      console.log('❌ CD 13 não encontrado');
      return;
    }
    
    // Verificar quantos agendamentos já existem
    const existingCount = await prisma.agendamento.count({ where: { cdId: 13 } });
    console.log(`📊 Agendamentos existentes para CD 13: ${existingCount}`);
    
    if (existingCount > 0) {
      console.log('✅ CD 13 já tem agendamentos');
      return;
    }
    
    // Criar fornecedores se não existirem
    const fornecedores = [
      { nome: 'Fornecedor A', email: 'fornecedora@email.com', telefone: '(11) 99999-0001', documento: '12345678000195' },
      { nome: 'Fornecedor B', email: 'fornecedorb@email.com', telefone: '(11) 99999-0002', documento: '98765432000198' },
      { nome: 'Fornecedor C', email: 'fornecedorc@email.com', telefone: '(11) 99999-0003', documento: '11122233000199' }
    ];
    
    for (const f of fornecedores) {
      await prisma.fornecedor.upsert({
        where: { email: f.email },
        update: {},
        create: f
      });
    }
    
    console.log('✅ Fornecedores criados/verificados');
    
    // Buscar IDs dos fornecedores
    const fornecedorIds = await prisma.fornecedor.findMany({
      select: { id: true }
    });
    
    console.log(`📋 ${fornecedorIds.length} fornecedores encontrados`);
    
    // Criar agendamentos para CD 13
    const agendamentos = [];
    const hoje = new Date();
    
    for (let i = 1; i <= 5; i++) {
      const dataEntrega = new Date(hoje);
      dataEntrega.setDate(hoje.getDate() + i);
      
      // Pular fins de semana
      while (dataEntrega.getDay() === 0 || dataEntrega.getDay() === 6) {
        dataEntrega.setDate(dataEntrega.getDate() + 1);
      }
      
      const agendamento = await prisma.agendamento.create({
        data: {
          codigo: `AGD-${13000 + i}`, // Códigos únicos para CD 13
          fornecedorId: fornecedorIds[i % fornecedorIds.length].id,
          cdId: 13,
          dataEntrega: dataEntrega,
          horarioEntrega: i <= 2 ? '08:00-12:00' : '13:00-17:00',
          tipoCarga: i % 2 === 0 ? 'Seca' : 'Frigorífica',
          status: i === 1 ? 'confirmado' : 'pendente',
          observacoes: `Agendamento ${i} para CD Principal`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      agendamentos.push(agendamento);
      console.log(`✅ Agendamento criado: ${agendamento.codigo}`);
    }
    
    console.log(`🎉 ${agendamentos.length} agendamentos criados para CD 13`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAgendamentosForCD13();
