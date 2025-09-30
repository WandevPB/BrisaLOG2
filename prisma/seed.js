const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes
  await prisma.respostaReagendamento.deleteMany();
  await prisma.bloqueioHorario.deleteMany();
  await prisma.historicoAcao.deleteMany();
  await prisma.notaFiscal.deleteMany();
  await prisma.agendamento.deleteMany();
  await prisma.fornecedor.deleteMany();
  await prisma.cd.deleteMany();

  // Criar CDs
  const senhaHash = await bcrypt.hash('Brisanet123', 10);
  
  const cds = await Promise.all([
    prisma.cd.create({
      data: {
        nome: 'Bahia',
        usuario: 'Bahia',
        senha: senhaHash,
        primeiroLogin: true,
        ativo: true
      }
    }),
    prisma.cd.create({
      data: {
        nome: 'Pernambuco',
        usuario: 'Pernambuco',
        senha: senhaHash,
        primeiroLogin: true,
        ativo: true
      }
    }),
    prisma.cd.create({
      data: {
  nome: 'CENTRAL',
        usuario: 'LagoaNova',
        senha: senhaHash,
        primeiroLogin: true,
        ativo: true
      }
    })
  ]);

  console.log('✅ CDs criados:', cds.map(cd => cd.nome));

  // Criar Fornecedores
  const fornecedores = await Promise.all([
    prisma.fornecedor.create({
      data: {
        nome: 'TechCorp Ltda',
        email: 'contato@techcorp.com',
        telefone: '(84) 3333-1111',
        documento: '12.345.678/0001-90',
        ativo: true
      }
    }),
    prisma.fornecedor.create({
      data: {
        nome: 'InfraTech Solutions',
        email: 'vendas@infratech.com',
        telefone: '(81) 2222-3333',
        documento: '98.765.432/0001-10',
        ativo: true
      }
    }),
    prisma.fornecedor.create({
      data: {
        nome: 'NetSupply Brasil',
        email: 'suporte@netsupply.com.br',
        telefone: '(85) 4444-5555',
        documento: '11.222.333/0001-44',
        ativo: true
      }
    }),
    prisma.fornecedor.create({
      data: {
        nome: 'ConnectParts',
        email: 'comercial@connectparts.com',
        telefone: '(84) 6666-7777',
        documento: '55.666.777/0001-88',
        ativo: true
      }
    }),
    prisma.fornecedor.create({
      data: {
        nome: 'FiberTech Equipamentos',
        email: 'fiber@fibertech.com.br',
        telefone: '(81) 8888-9999',
        documento: '99.888.777/0001-66',
        ativo: true
      }
    })
  ]);

  console.log('✅ Fornecedores criados:', fornecedores.map(f => f.nome));

  // Criar Agendamentos de exemplo
  const agendamentos = [];
  const statuses = ['pendente', 'confirmado', 'entregue', 'nao-veio', 'reagendamento'];
  const tiposCarga = ['equipamentos', 'materiais', 'componentes', 'outros'];
  const horarios = ['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-17:00'];

  for (let i = 1; i <= 20; i++) {
    const cd = cds[Math.floor(Math.random() * cds.length)];
    const fornecedor = fornecedores[Math.floor(Math.random() * fornecedores.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const tipoCarga = tiposCarga[Math.floor(Math.random() * tiposCarga.length)];
    const horario = horarios[Math.floor(Math.random() * horarios.length)];

    // Gerar data aleatória nos próximos 30 dias
    const dataBase = new Date();
    dataBase.setDate(dataBase.getDate() + Math.floor(Math.random() * 30));
    
    // Garantir que seja dia útil
    while (dataBase.getDay() === 0 || dataBase.getDay() === 6) {
      dataBase.setDate(dataBase.getDate() + 1);
    }

    const agendamento = await prisma.agendamento.create({
      data: {
        codigo: `AGD${String(i).padStart(6, '0')}`,
        dataEntrega: dataBase,
        horarioEntrega: horario,
        tipoCarga: tipoCarga,
        status: status,
        observacoes: Math.random() > 0.5 ? 'Entrega urgente - equipamentos para expansão de rede' : null,
        cdId: cd.id,
        fornecedorId: fornecedor.id
      }
    });

    agendamentos.push(agendamento);

    // Criar notas fiscais para cada agendamento
    const numPedidos = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 1; j <= numPedidos; j++) {
      const numeroPedido = `PED${String(Math.floor(Math.random() * 9999) + 1000)}`;
      const numNFs = Math.floor(Math.random() * 2) + 1;
      
      for (let k = 1; k <= numNFs; k++) {
        await prisma.notaFiscal.create({
          data: {
            numeroPedido: numeroPedido,
            numeroNF: `${Math.floor(Math.random() * 999999) + 100000}`,
            serie: '1',
            valor: `${(Math.random() * 50000 + 5000).toFixed(2).replace('.', ',')}`,
            arquivoPath: Math.random() > 0.3 ? `uploads/nf_${Math.floor(Math.random() * 999999)}.pdf` : null,
            agendamentoId: agendamento.id
          }
        });
      }
    }

    // Criar histórico de ações
    await prisma.historicoAcao.create({
      data: {
        acao: 'agendamento_criado',
        descricao: 'Agendamento criado pelo fornecedor',
        agendamentoId: agendamento.id,
        cdId: cd.id
      }
    });

    if (status !== 'pendente') {
      await prisma.historicoAcao.create({
        data: {
          acao: 'status_alterado',
          descricao: `Status alterado para: ${status}`,
          agendamentoId: agendamento.id,
          cdId: cd.id
        }
      });
    }
  }

  console.log('✅ Agendamentos criados:', agendamentos.length);

  // Criar alguns bloqueios de horário
  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);
  
  await prisma.bloqueioHorario.create({
    data: {
      dataBloqueio: amanha,
      horaInicio: '12:00',
      horaFim: '14:00',
      motivo: 'Manutenção preventiva no sistema',
      cdId: cds[0].id
    }
  });

  console.log('✅ Bloqueios de horário criados');

  // Criar algumas respostas de reagendamento
  const agendamentosReagendamento = agendamentos.filter(a => Math.random() > 0.8);
  
  for (const agendamento of agendamentosReagendamento) {
    await prisma.respostaReagendamento.create({
      data: {
        resposta: Math.random() > 0.5 ? 'aceito' : 'rejeitado',
        comentario: 'Data confirmada pelo fornecedor',
        agendamentoId: agendamento.id
      }
    });
  }

  console.log('✅ Respostas de reagendamento criadas');

  console.log('🎉 Seed concluído com sucesso!');
  
  // Mostrar resumo
  const totalCds = await prisma.cd.count();
  const totalFornecedores = await prisma.fornecedor.count();
  const totalAgendamentos = await prisma.agendamento.count();
  const totalNotasFiscais = await prisma.notaFiscal.count();
  
  console.log('\n📊 Resumo dos dados criados:');
  console.log(`• CDs: ${totalCds}`);
  console.log(`• Fornecedores: ${totalFornecedores}`);
  console.log(`• Agendamentos: ${totalAgendamentos}`);
  console.log(`• Notas Fiscais: ${totalNotasFiscais}`);
  console.log('\n🔑 Credenciais de login:');
  console.log('• Usuário: Bahia | Senha: Brisanet123');
  console.log('• Usuário: Pernambuco | Senha: Brisanet123');
  console.log('• Usuário: LagoaNova | Senha: Brisanet123');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
