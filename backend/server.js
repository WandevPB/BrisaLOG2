require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// ...existing code...

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./authRoutes');
const emailService = require('./emailService');
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'brisalog_secret_key_2025';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'uploads')));

// Servir arquivos estáticos (HTML, CSS, JS) da raiz do projeto
app.use(express.static(path.join(__dirname, '..')));

// Usar rotas de autenticação
app.use('/api/auth', authRoutes);

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos'), false);
    }
  }
});

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('Autenticação falhou: Token não fornecido');
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log('Autenticação bem-sucedida para usuário ID:', decoded.id);
    next();
  } catch (err) {
    console.error('Erro na verificação do token:', err.message);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Token inválido. Faça login novamente.' });
    }
    
    return res.status(403).json({ error: 'Falha na autenticação. Faça login novamente.' });
  }
};

// Middleware de tratamento de erros
const errorHandler = (err, req, res, next) => {
  console.error('Erro:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande. Máximo 10MB.' });
    }
  }
  
  if (err.message === 'Apenas arquivos PDF são permitidos') {
    return res.status(400).json({ error: err.message });
  }
  
  res.status(500).json({ error: 'Erro interno do servidor' });
};

// ============================================================================
// ROTAS DE AUTENTICAÇÃO
// ============================================================================

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }

    // Buscar CD
    const cd = await prisma.cd.findUnique({
      where: { usuario: usuario }
    });

    if (!cd || !cd.ativo) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, cd.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: cd.id, 
        usuario: cd.usuario, 
        nome: cd.nome 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token: token,
      cd: {
        id: cd.id,
        nome: cd.nome,
        usuario: cd.usuario,
        primeiroLogin: cd.primeiroLogin
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Alterar senha
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { novaSenha } = req.body;
    const userId = req.user.id;

    if (!novaSenha || novaSenha.length < 8) {
      return res.status(400).json({ error: 'Nova senha deve ter pelo menos 8 caracteres' });
    }

    // Hash da nova senha
    const senhaHash = await bcrypt.hash(novaSenha, 10);

    // Atualizar no banco
    await prisma.cd.update({
      where: { id: userId },
      data: {
        senha: senhaHash,
        primeiroLogin: false
      }
    });

    res.json({ success: true, message: 'Senha alterada com sucesso' });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============================================================================
// ROTAS DE AGENDAMENTOS
// ============================================================================

// Listar agendamentos
app.get('/api/agendamentos', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 [GET /api/agendamentos] Iniciando listagem de agendamentos...');
    const { status, search, page = 1, limit = 50 } = req.query;
    const cdId = req.user.id;

    // Construir filtros
    const where = {
      cdId: cdId
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { codigo: { contains: search } },
        { fornecedor: { nome: { contains: search } } },
        { fornecedor: { email: { contains: search } } }
      ];
    }

    console.log('🔍 [GET /api/agendamentos] Filtros aplicados:', where);

    // Buscar agendamentos
    const agendamentos = await prisma.agendamento.findMany({
      where: where,
      include: {
        fornecedor: true,
        notasFiscais: true,
        historicoAcoes: {
          include: {
            cd: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        dataEntrega: 'asc'
      },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    // Contar total
    const total = await prisma.agendamento.count({ where });

    console.log(`✅ [GET /api/agendamentos] ${agendamentos.length} agendamentos encontrados de ${total} total`);
    console.log('📋 [GET /api/agendamentos] Status dos agendamentos:', 
      agendamentos.map(a => ({ id: a.id, codigo: a.codigo, status: a.status }))
    );

    res.json({
      success: true,
      data: agendamentos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao listar agendamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar agendamento
app.post('/api/agendamentos', upload.any(), async (req, res) => {
  try {
    const agendamentoData = JSON.parse(req.body.agendamento);
    const arquivos = req.files || [];

    // Validações básicas
    if (!agendamentoData.fornecedor || !agendamentoData.entrega || !agendamentoData.pedidos) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Buscar ou criar fornecedor
    let fornecedor = await prisma.fornecedor.findUnique({
      where: { email: agendamentoData.fornecedor.email }
    });

    if (!fornecedor) {
      fornecedor = await prisma.fornecedor.create({
        data: {
          nome: agendamentoData.fornecedor.nomeEmpresa,
          email: agendamentoData.fornecedor.email,
          telefone: agendamentoData.fornecedor.telefone,
          documento: agendamentoData.fornecedor.documento
        }
      });
    }

    // Buscar CD
    const cd = await prisma.cd.findUnique({
      where: { nome: agendamentoData.entrega.cdDestino }
    });

    if (!cd) {
      return res.status(400).json({ error: 'Centro de distribuição não encontrado' });
    }

    // Gerar código único
    const ultimoAgendamento = await prisma.agendamento.findFirst({
      orderBy: { id: 'desc' }
    });
    const proximoNumero = ultimoAgendamento ? ultimoAgendamento.id + 1 : 1;
    const codigo = `AGD${String(proximoNumero).padStart(6, '0')}`;

    // Criar agendamento
    const agendamento = await prisma.agendamento.create({
      data: {
        codigo: codigo,
        dataEntrega: new Date(agendamentoData.entrega.dataEntrega + 'T00:00:00'),
        horarioEntrega: agendamentoData.entrega.horarioEntrega,
        tipoCarga: agendamentoData.entrega.tipoCarga,
        observacoes: agendamentoData.entrega.observacoes || null,
        status: 'pendente',
        cdId: cd.id,
        fornecedorId: fornecedor.id
      }
    });

    // Criar notas fiscais
    for (const pedido of agendamentoData.pedidos) {
      for (const nf of pedido.notasFiscais) {
        // Encontrar arquivo correspondente
        const arquivo = arquivos.find(f => {
          const info = req.body[`${f.fieldname}_info`];
          if (info) {
            const parsedInfo = JSON.parse(info);
            return parsedInfo.pedido === pedido.numero && parsedInfo.nf === nf.numero;
          }
          return false;
        });

        await prisma.notaFiscal.create({
          data: {
            numeroPedido: pedido.numero,
            numeroNF: nf.numero,
            serie: nf.serie || null,
            valor: nf.valor || null,
            arquivoPath: arquivo ? arquivo.filename : null,
            agendamentoId: agendamento.id
          }
        });
      }
    }

    // Criar histórico
    await prisma.historicoAcao.create({
      data: {
        acao: 'agendamento_criado',
        descricao: 'Agendamento criado pelo fornecedor',
        agendamentoId: agendamento.id,
        cdId: cd.id
      }
    });

    // Enviar email de confirmação de criação para o fornecedor
    try {
      const consultaUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/consultar-status.html?codigo=${codigo}`;
      await emailService.sendConfirmadoEmail({
        to: fornecedor.email,
        fornecedorNome: fornecedor.nome,
        agendamentoCodigo: codigo,
        cdNome: cd.nome,
        consultaUrl
      });
    } catch (emailError) {
      console.error('Erro ao enviar email de confirmação de agendamento:', emailError);
    }

    res.json({
      success: true,
      codigo: codigo,
      message: 'Agendamento criado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao criar agendamento:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Consultar agendamento por código (público)
app.get('/api/agendamentos/consultar/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;

    const agendamento = await prisma.agendamento.findFirst({
      where: {
        codigo: codigo
      },
      include: {
        fornecedor: true,
        cd: true,
        notasFiscais: true,
        historicoAcoes: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!agendamento) {
      return res.status(404).json({ 
        success: false, 
        message: 'Agendamento não encontrado' 
      });
    }

    // Formatar dados para o frontend
    const agendamentoFormatado = {
      codigo: agendamento.codigo,
      fornecedor: agendamento.fornecedor.nome,
      cnpj: agendamento.fornecedor.documento || 'N/A',
      email: agendamento.fornecedor.email,
      telefone: agendamento.fornecedor.telefone || 'N/A',
      dataEntrega: agendamento.dataEntrega?.toISOString().split('T')[0] || 'N/A',
      horarioEntrega: agendamento.horarioEntrega,
      cdDestino: agendamento.cd.nome,
      enderecoCD: `Centro de Distribuição ${agendamento.cd.nome}`,
      status: agendamento.status,
      observacoes: agendamento.observacoes || 'Nenhuma observação',
      valorTotal: agendamento.notasFiscais.reduce((total, nf) => {
        const valor = parseFloat(nf.valor?.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        return total + valor;
      }, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      tipoCarga: agendamento.tipoCarga,
      dataCriacao: agendamento.createdAt?.toISOString().split('T')[0] || 'N/A',
      // Agrupar notas fiscais por pedido para compatibilidade com o frontend
      pedidos: agendamento.notasFiscais.reduce((pedidos, nf) => {
        let pedido = pedidos.find(p => p.numero === nf.numeroPedido);
        if (!pedido) {
          pedido = { numero: nf.numeroPedido, notasFiscais: [] };
          pedidos.push(pedido);
        }
        pedido.notasFiscais.push({
          numero: nf.numeroNF,
          valor: nf.valor || '0,00'
        });
        return pedidos;
      }, []),
      notasFiscais: agendamento.notasFiscais.map(nf => ({
        numeroPedido: nf.numeroPedido,
        numeroNF: nf.numeroNF,
        serie: nf.serie,
        valor: nf.valor
      })),
      historico: agendamento.historicoAcoes.map(acao => ({
        acao: acao.acao,
        descricao: acao.descricao,
        data: acao.createdAt?.toISOString().split('T')[0] || 'N/A'
      }))
    };

    res.json({ 
      success: true, 
      data: agendamentoFormatado 
    });

  } catch (error) {
    console.error('Erro ao consultar agendamento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Atualizar status do agendamento
app.put('/api/agendamentos/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, observacoes } = req.body;
    const cdId = req.user.id;

    console.log(`🔄 [PUT /api/agendamentos/${id}/status] Iniciando atualização de status...`);
    console.log(`📋 [PUT /api/agendamentos/${id}/status] Dados recebidos:`, { id, status, observacoes, cdId });

    // Validar status
    const statusValidos = ['pendente', 'confirmado', 'entregue', 'nao-veio', 'reagendamento'];
    if (!statusValidos.includes(status)) {
      console.log(`❌ [PUT /api/agendamentos/${id}/status] Status inválido:`, status);
      return res.status(400).json({ error: 'Status inválido' });
    }

    // Verificar se o agendamento pertence ao CD
    const agendamento = await prisma.agendamento.findFirst({
      where: {
        id: parseInt(id),
        cdId: cdId
      },
      include: {
        fornecedor: true,
        cd: true
      }
    });

    if (!agendamento) {
      console.log(`❌ [PUT /api/agendamentos/${id}/status] Agendamento não encontrado para CD ${cdId}`);
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    console.log(`📄 [PUT /api/agendamentos/${id}/status] Agendamento atual:`, { 
      id: agendamento.id, 
      codigo: agendamento.codigo, 
      statusAtual: agendamento.status 
    });

    // Atualizar status
    const agendamentoAtualizado = await prisma.agendamento.update({
      where: { id: parseInt(id) },
      data: {
        status: status,
        observacoes: observacoes || agendamento.observacoes
      }
    });

    console.log(`✅ [PUT /api/agendamentos/${id}/status] Status atualizado com sucesso:`, { 
      id: agendamentoAtualizado.id, 
      codigo: agendamentoAtualizado.codigo, 
      statusAnterior: agendamento.status,
      statusNovo: agendamentoAtualizado.status 
    });

    // Criar histórico
    await prisma.historicoAcao.create({
      data: {
        acao: 'status_alterado',
        descricao: `Status alterado de "${agendamento.status}" para "${status}"`,
        agendamentoId: parseInt(id),
        cdId: cdId
      }
    });

    // Enviar emails automáticos conforme o novo status
    try {
      const consultaUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/consultar-status.html?codigo=${agendamento.codigo}`;
      if (status === 'confirmado') {
        await emailService.sendConfirmadoEmail({
          to: agendamento.fornecedor.email,
          fornecedorNome: agendamento.fornecedor.nome,
          agendamentoCodigo: agendamento.codigo,
          cdNome: agendamento.cd.nome,
          consultaUrl
        });
      } else if (status === 'entregue') {
        await emailService.sendEntregueEmail({
          to: agendamento.fornecedor.email,
          fornecedorNome: agendamento.fornecedor.nome,
          agendamentoCodigo: agendamento.codigo,
          cdNome: agendamento.cd.nome,
          consultaUrl
        });
      } else if (status === 'nao-veio') {
        await emailService.sendNaoVeioEmail({
          to: agendamento.fornecedor.email,
          fornecedorNome: agendamento.fornecedor.nome,
          agendamentoCodigo: agendamento.codigo,
          cdNome: agendamento.cd.nome,
          consultaUrl
        });
      }
    } catch (emailError) {
      console.error('Erro ao enviar email de status:', emailError);
    }

    console.log(`🎯 [PUT /api/agendamentos/${id}/status] Respondendo com sucesso:`, {
      success: true,
      agendamentoId: agendamentoAtualizado.id,
      statusFinal: agendamentoAtualizado.status
    });

    res.json({
      success: true,
      message: 'Status atualizado com sucesso',
      agendamento: agendamentoAtualizado
    });

  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Sugerir nova data
app.post('/api/agendamentos/:id/reagendar', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { novaData, novoHorario, motivo } = req.body;
    const cdId = req.user.id;

    console.log(`🗓️ [POST /api/agendamentos/${id}/reagendar] Iniciando reagendamento...`);
    console.log(`📋 [POST /api/agendamentos/${id}/reagendar] Dados recebidos:`, { 
      id, 
      novaData, 
      novoHorario, 
      motivo, 
      cdId 
    });

    // Verificar se o agendamento pertence ao CD
    const agendamento = await prisma.agendamento.findFirst({
      where: {
        id: parseInt(id),
        cdId: cdId
      },
      include: {
        fornecedor: true,
        cd: true
      }
    });

    if (!agendamento) {
      console.log(`❌ [POST /api/agendamentos/${id}/reagendar] Agendamento não encontrado para CD ${cdId}`);
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    console.log(`📄 [POST /api/agendamentos/${id}/reagendar] Agendamento atual:`, {
      id: agendamento.id,
      codigo: agendamento.codigo,
      statusAtual: agendamento.status,
      dataAtual: agendamento.dataEntrega,
      horarioAtual: agendamento.horarioEntrega
    });

    // Atualizar agendamento
    const agendamentoAtualizado = await prisma.agendamento.update({
      where: { id: parseInt(id) },
      data: {
        status: 'reagendamento',
        dataSugestaoCD: new Date(novaData + 'T00:00:00'),
        horarioSugestaoCD: novoHorario,
        motivoNaoVeio: motivo || null,
        observacoes: motivo ? `${agendamento.observacoes || ''} | Reagendamento: ${motivo}`.trim() : agendamento.observacoes
      }
    });

    console.log(`✅ [POST /api/agendamentos/${id}/reagendar] Agendamento atualizado:`, {
      id: agendamentoAtualizado.id,
      codigo: agendamentoAtualizado.codigo,
      statusNovo: agendamentoAtualizado.status,
      dataNova: agendamentoAtualizado.dataEntrega,
      horarioNovo: agendamentoAtualizado.horarioEntrega
    });

    // Criar histórico
    await prisma.historicoAcao.create({
      data: {
        acao: 'reagendamento_sugerido',
        descricao: `Nova data sugerida: ${new Date(novaData).toLocaleDateString('pt-BR')} às ${novoHorario}`,
        dataAnterior: agendamento.dataEntrega,
        dataNova: new Date(novaData + 'T00:00:00'),
        agendamentoId: parseInt(id),
        cdId: cdId
      }
    });

    console.log(`🎯 [POST /api/agendamentos/${id}/reagendar] Respondendo com sucesso`);

    // Enviar email para o fornecedor
    try {
      console.log(`📧 [POST /api/agendamentos/${id}/reagendar] Enviando email para fornecedor...`);
      const emailService = require('./emailService');
      
      const consultaUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/consultar-status.html?codigo=${agendamento.codigo}`;
      const emailResult = await emailService.sendReagendamentoEmail({
        to: agendamento.fornecedor.email,
        fornecedorNome: agendamento.fornecedor.nome,
        agendamentoCodigo: agendamento.codigo,
        cdNome: agendamento.cd.nome,
        dataOriginal: agendamento.dataEntrega,
        novaDataSugerida: new Date(novaData + 'T00:00:00'),
        novoHorario,
        motivo,
        consultaUrl
      });

      if (emailResult.success) {
        console.log(`✅ [POST /api/agendamentos/${id}/reagendar] Email enviado com sucesso:`, emailResult.messageId);
      } else {
        console.log(`⚠️ [POST /api/agendamentos/${id}/reagendar] Erro ao enviar email:`, emailResult.error);
      }
    } catch (emailError) {
      console.error(`❌ [POST /api/agendamentos/${id}/reagendar] Erro no envio de email:`, emailError);
    }

    res.json({
      success: true,
      message: 'Sugestão de nova data enviada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao reagendar:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Adicionar pedidos e notas fiscais a um agendamento existente
app.post('/api/agendamentos/:codigo/pedidos', upload.any(), async (req, res) => {
  try {
    const { codigo } = req.params;
    const pedidosData = JSON.parse(req.body.pedidos);
    const arquivos = req.files || [];

    // Buscar agendamento
    const agendamento = await prisma.agendamento.findFirst({
      where: { codigo: codigo }
    });

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    // Validar dados
    if (!pedidosData || !Array.isArray(pedidosData)) {
      return res.status(400).json({ error: 'Dados de pedidos inválidos' });
    }

    // Criar notas fiscais para cada pedido
    for (const pedido of pedidosData) {
      if (!pedido.numero || !pedido.notasFiscais || !Array.isArray(pedido.notasFiscais)) {
        continue;
      }

      for (const nf of pedido.notasFiscais) {
        if (!nf.numero || !nf.valor) {
          continue;
        }

        // Encontrar arquivo correspondente
        const arquivo = arquivos.find(f => {
          const info = req.body[`${f.fieldname}_info`];
          if (info) {
            const parsedInfo = JSON.parse(info);
            return parsedInfo.pedido === pedido.numero && parsedInfo.nf === nf.numero;
          }
          return false;
        });

        await prisma.notaFiscal.create({
          data: {
            numeroPedido: pedido.numero,
            numeroNF: nf.numero,
            valor: nf.valor,
            arquivoPath: arquivo ? arquivo.filename : null,
            agendamentoId: agendamento.id
          }
        });
      }
    }

    res.json({
      success: true,
      message: 'Pedidos e notas fiscais adicionados com sucesso'
    });

  } catch (error) {
    console.error('Erro ao adicionar pedidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Responder reagendamento (fornecedor)
app.post('/api/agendamentos/:codigo/responder-reagendamento', async (req, res) => {
  try {
    const { codigo } = req.params;
    const { resposta, comentario, novaData, novoHorario } = req.body;

    console.log(`📞 [POST /api/agendamentos/${codigo}/responder-reagendamento] Fornecedor respondendo...`);
    console.log(`📋 [POST /api/agendamentos/${codigo}/responder-reagendamento] Dados:`, { 
      codigo, 
      resposta, 
      comentario, 
      novaData, 
      novoHorario 
    });

    // Buscar agendamento
    const agendamento = await prisma.agendamento.findFirst({
      where: { codigo: codigo },
      include: { cd: true, fornecedor: true }
    });

    if (!agendamento) {
      console.log(`❌ [POST /api/agendamentos/${codigo}/responder-reagendamento] Agendamento não encontrado`);
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    console.log(`📄 [POST /api/agendamentos/${codigo}/responder-reagendamento] Agendamento encontrado:`, {
      id: agendamento.id,
      status: agendamento.status,
      dataSugestaoCD: agendamento.dataSugestaoCD,
      horarioSugestaoCD: agendamento.horarioSugestaoCD
    });

    // Validar resposta
    const respostasValidas = ['aceito', 'rejeitado', 'contra_proposta'];
    if (!respostasValidas.includes(resposta)) {
      console.log(`❌ [POST /api/agendamentos/${codigo}/responder-reagendamento] Resposta inválida:`, resposta);
      return res.status(400).json({ error: 'Resposta inválida' });
    }

    // Criar resposta de reagendamento
    await prisma.respostaReagendamento.create({
      data: {
        resposta: resposta,
        comentario: comentario || null,
        novaData: novaData ? new Date(novaData + 'T00:00:00') : null,
        novoHorario: novoHorario || null,
        agendamentoId: agendamento.id
      }
    });

    // Atualizar status do agendamento
    let updateData = { status: agendamento.status };
    
    if (resposta === 'aceito') {
      // Se aceitar, aplicar a data sugerida pelo CD e confirmar
      updateData = {
        status: 'confirmado',
        dataEntrega: agendamento.dataSugestaoCD || agendamento.dataEntrega,
        horarioEntrega: agendamento.horarioSugestaoCD || agendamento.horarioEntrega,
        dataSugestaoCD: null,
        horarioSugestaoCD: null
      };
    } else if (resposta === 'contra_proposta') {
      // Se fizer contra-proposta, voltar para pendente para CD analisar
      updateData = {
        status: 'pendente',
        dataSugestaoCD: null,
        horarioSugestaoCD: null,
        observacoes: comentario ? `${agendamento.observacoes || ''} | Fornecedor sugeriu: ${new Date(novaData).toLocaleDateString('pt-BR')} às ${novoHorario}${comentario ? ' - ' + comentario : ''}`.trim() : agendamento.observacoes
      };
    }

    const agendamentoAtualizado = await prisma.agendamento.update({
      where: { id: agendamento.id },
      data: updateData
    });

    // Criar histórico
    let descricaoHistorico = '';
    if (resposta === 'aceito') {
      descricaoHistorico = `Fornecedor aceitou o reagendamento. Nova data: ${new Date(updateData.dataEntrega).toLocaleDateString('pt-BR')} às ${updateData.horarioEntrega}`;
    } else if (resposta === 'contra_proposta') {
      descricaoHistorico = `Fornecedor sugeriu nova data: ${new Date(novaData).toLocaleDateString('pt-BR')} às ${novoHorario}${comentario ? ' - ' + comentario : ''}`;
    }

    await prisma.historicoAcao.create({
      data: {
        acao: `reagendamento_${resposta}`,
        descricao: descricaoHistorico,
        dataAnterior: resposta === 'aceito' ? agendamento.dataSugestaoCD : agendamento.dataEntrega,
        dataNova: resposta === 'aceito' ? updateData.dataEntrega : (novaData ? new Date(novaData + 'T00:00:00') : null),
        agendamentoId: agendamento.id,
        cdId: agendamento.cdId
      }
    });

    // Enviar email de resposta de reagendamento
    try {
      const consultaUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/consultar-status.html?codigo=${agendamento.codigo}`;
      await emailService.sendRespostaReagendamentoEmail({
        to: agendamento.cd.email,
        fornecedorNome: agendamento.fornecedor.nome,
        agendamentoCodigo: agendamento.codigo,
        resposta,
        novaData,
        novoHorario,
        comentario,
        consultaUrl
      });
    } catch (emailError) {
      console.error('Erro ao enviar email de resposta de reagendamento:', emailError);
    }

    console.log(`✅ [POST /api/agendamentos/${codigo}/responder-reagendamento] Resposta processada com sucesso:`, {
      resposta,
      statusFinal: updateData.status,
      dataFinal: updateData.dataEntrega,
      horarioFinal: updateData.horarioEntrega
    });

    res.json({
      success: true,
      message: resposta === 'aceito' 
        ? 'Nova data aceita! Agendamento confirmado.' 
        : resposta === 'contra_proposta' 
        ? 'Nova data sugerida! O CD analisará sua proposta.' 
        : 'Resposta enviada com sucesso.'
    });

  } catch (error) {
    console.error('Erro ao responder reagendamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Cancelar solicitação permanentemente (fornecedor)
app.delete('/api/agendamentos/:codigo/cancelar-permanente', async (req, res) => {
  try {
    const { codigo } = req.params;

    console.log(`🗑️ [DELETE /api/agendamentos/${codigo}/cancelar-permanente] Iniciando cancelamento permanente...`);

    // Buscar agendamento
    const agendamento = await prisma.agendamento.findFirst({
      where: { codigo: codigo },
      include: { 
        fornecedor: true, 
        cd: true,
        notasFiscais: true,
        respostasReagendamento: true,
        historicoAcoes: true
      }
    });

    if (!agendamento) {
      console.log(`❌ [DELETE /api/agendamentos/${codigo}/cancelar-permanente] Agendamento não encontrado`);
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    console.log(`📄 [DELETE /api/agendamentos/${codigo}/cancelar-permanente] Agendamento encontrado:`, {
      id: agendamento.id,
      status: agendamento.status,
      fornecedor: agendamento.fornecedor.nome
    });

    // Só permite cancelar se estiver em reagendamento
    if (agendamento.status !== 'reagendamento') {
      console.log(`❌ [DELETE /api/agendamentos/${codigo}/cancelar-permanente] Status inválido para cancelamento:`, agendamento.status);
      return res.status(400).json({ error: 'Só é possível cancelar agendamentos em reagendamento' });
    }

    // Remover todos os dados relacionados (cascade delete irá ajudar)
    await prisma.agendamento.delete({
      where: { id: agendamento.id }
    });

    console.log(`✅ [DELETE /api/agendamentos/${codigo}/cancelar-permanente] Agendamento cancelado e removido permanentemente`);

    res.json({
      success: true,
      message: 'Solicitação cancelada e removida permanentemente da base de dados'
    });

  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Reagendar entrega (fornecedor em caso de "nao-veio")
app.post('/api/agendamentos/:codigo/reagendar-fornecedor', async (req, res) => {
  try {
    const { codigo } = req.params;
    const { novaData, novoHorario, motivo } = req.body;

    // Buscar agendamento
    const agendamento = await prisma.agendamento.findFirst({
      where: { codigo: codigo }
    });

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    // Verificar se status permite reagendamento
    if (agendamento.status !== 'nao-veio') {
      return res.status(400).json({ error: 'Agendamento não pode ser reagendado' });
    }

    // Atualizar agendamento
    await prisma.agendamento.update({
      where: { id: agendamento.id },
      data: {
        dataEntrega: new Date(novaData + 'T00:00:00'),
        horarioEntrega: novoHorario,
        status: 'pendente',
        observacoes: motivo ? `${agendamento.observacoes || ''} | Reagendado pelo fornecedor: ${motivo}`.trim() : agendamento.observacoes
      }
    });

    // Criar histórico
    await prisma.historicoAcao.create({
      data: {
        acao: 'reagendamento_fornecedor',
        descricao: `Fornecedor reagendou para: ${new Date(novaData).toLocaleDateString('pt-BR')} às ${novoHorario}`,
        dataAnterior: agendamento.dataEntrega,
        dataNova: new Date(novaData + 'T00:00:00'),
        agendamentoId: agendamento.id,
        cdId: agendamento.cdId
      }
    });

    res.json({
      success: true,
      message: 'Agendamento reagendado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao reagendar entrega:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Cancelar agendamento (fornecedor)
app.post('/api/agendamentos/:codigo/cancelar', async (req, res) => {
  try {
    const { codigo } = req.params;
    const { motivo } = req.body;

    // Buscar agendamento
    const agendamento = await prisma.agendamento.findFirst({
      where: { codigo: codigo },
      include: { fornecedor: true, cd: true }
    });

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    // Atualizar status para cancelado
    await prisma.agendamento.update({
      where: { id: agendamento.id },
      data: {
        status: 'cancelado',
        observacoes: motivo ? `${agendamento.observacoes || ''} | Cancelado pelo fornecedor: ${motivo}`.trim() : agendamento.observacoes
      }
    });

    // Criar histórico
    await prisma.historicoAcao.create({
      data: {
        acao: 'cancelamento_fornecedor',
        descricao: `Agendamento cancelado pelo fornecedor${motivo ? `: ${motivo}` : ''}`,
        agendamentoId: agendamento.id,
        cdId: agendamento.cdId
      }
    });

    // Enviar email de cancelamento para o fornecedor
    try {
      const consultaUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/consultar-status.html?codigo=${agendamento.codigo}`;
      await emailService.sendCanceladoFornecedorEmail({
        to: agendamento.fornecedor.email,
        fornecedorNome: agendamento.fornecedor.nome,
        agendamentoCodigo: agendamento.codigo,
        motivo,
        consultaUrl
      });
    } catch (emailError) {
      console.error('Erro ao enviar email de cancelamento:', emailError);
    }

    res.json({
      success: true,
      message: 'Agendamento cancelado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Sugerir nova data para "nao-veio" (CD)
app.post('/api/agendamentos/:id/sugerir-data-cd', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { novaData, novoHorario, motivo } = req.body;
    const cdId = req.user.id;

    // Verificar se o agendamento pertence ao CD
    const agendamento = await prisma.agendamento.findFirst({
      where: {
        id: parseInt(id),
        cdId: cdId
      }
    });

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    // Verificar se status é "nao-veio"
    if (agendamento.status !== 'nao-veio') {
      return res.status(400).json({ error: 'Funcionalidade disponível apenas para status "não veio"' });
    }

    // Atualizar agendamento com sugestão do CD
    await prisma.agendamento.update({
      where: { id: parseInt(id) },
      data: {
        status: 'aguardando_resposta_cd',
        observacoes: motivo ? `${agendamento.observacoes || ''} | CD sugeriu nova data: ${motivo}`.trim() : agendamento.observacoes
      }
    });

    // Criar histórico
    await prisma.historicoAcao.create({
      data: {
        acao: 'sugestao_data_cd',
        descricao: `CD sugeriu nova data: ${new Date(novaData).toLocaleDateString('pt-BR')} às ${novoHorario}`,
        dataAnterior: agendamento.dataEntrega,
        dataNova: new Date(novaData + 'T00:00:00'),
        agendamentoId: parseInt(id),
        cdId: cdId
      }
    });

    res.json({
      success: true,
      message: 'Sugestão de nova data enviada para o fornecedor'
    });

  } catch (error) {
    console.error('Erro ao sugerir nova data:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============================================================================
// ROTAS DE ESTATÍSTICAS
// ============================================================================

// Estatísticas do dashboard
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const cdId = req.user.id;

    const [total, pendente, confirmado, entregue, naoVeio] = await Promise.all([
      prisma.agendamento.count({ where: { cdId } }),
      prisma.agendamento.count({ where: { cdId, status: 'pendente' } }),
      prisma.agendamento.count({ where: { cdId, status: 'confirmado' } }),
      prisma.agendamento.count({ where: { cdId, status: 'entregue' } }),
      prisma.agendamento.count({ where: { cdId, status: 'nao-veio' } })
    ]);

    res.json({
      success: true,
      stats: {
        total,
        pendente,
        confirmado,
        entregue,
        naoVeio
      }
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============================================================================
// ROTAS DE NOTAS FISCAIS
// ============================================================================

// Adicionar nota fiscal a um pedido específico
app.post('/api/agendamentos/:codigo/pedidos/:numeroPedido/notas-fiscais', upload.single('arquivo'), async (req, res) => {
  try {
    const { codigo, numeroPedido } = req.params;
    const { numeroNF, valor } = req.body;
    const arquivo = req.file;

    // Buscar agendamento
    const agendamento = await prisma.agendamento.findFirst({
      where: { codigo: codigo }
    });

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    // Verificar se já existe NF com o mesmo número no mesmo pedido
    const nfExistente = await prisma.notaFiscal.findFirst({
      where: {
        agendamentoId: agendamento.id,
        numeroPedido: numeroPedido,
        numeroNF: numeroNF
      }
    });

    if (nfExistente) {
      return res.status(400).json({ error: 'Já existe uma nota fiscal com este número neste pedido' });
    }

    // Criar nota fiscal
    await prisma.notaFiscal.create({
      data: {
        numeroPedido: numeroPedido,
        numeroNF: numeroNF,
        valor: valor,
        arquivoPath: arquivo ? arquivo.filename : null,
        agendamentoId: agendamento.id
      }
    });

    // Buscar agendamento atualizado com todas as relações
    const agendamentoAtualizado = await prisma.agendamento.findFirst({
      where: { codigo: codigo },
      include: {
        cd: true,
        notasFiscais: true
      }
    });

    // Formatar dados para retorno
    const pedidos = {};
    agendamentoAtualizado.notasFiscais.forEach(nf => {
      if (!pedidos[nf.numeroPedido]) {
        pedidos[nf.numeroPedido] = {
          numero: nf.numeroPedido,
          notasFiscais: []
        };
      }
      pedidos[nf.numeroPedido].notasFiscais.push({
        numero: nf.numeroNF,
        valor: nf.valor,
        arquivo: nf.arquivoPath
      });
    });

    agendamentoAtualizado.pedidos = Object.values(pedidos);

    res.json({
      success: true,
      message: 'Nota fiscal adicionada com sucesso',
      data: agendamentoAtualizado
    });

  } catch (error) {
    console.error('Erro ao adicionar nota fiscal:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Editar nota fiscal
app.put('/api/agendamentos/:codigo/pedidos/:numeroPedido/notas-fiscais/:numeroNF', upload.single('arquivo'), async (req, res) => {
  try {
    const { codigo, numeroPedido, numeroNF } = req.params;
    const { numeroNF: novoNumeroNF, valor } = req.body;
    const arquivo = req.file;

    // Buscar agendamento
    const agendamento = await prisma.agendamento.findFirst({
      where: { codigo: codigo }
    });

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    // Buscar nota fiscal
    const notaFiscal = await prisma.notaFiscal.findFirst({
      where: {
        agendamentoId: agendamento.id,
        numeroPedido: numeroPedido,
        numeroNF: numeroNF
      }
    });

    if (!notaFiscal) {
      return res.status(404).json({ error: 'Nota fiscal não encontrada' });
    }

    // Se o número da NF mudou, verificar se não existe conflito
    if (novoNumeroNF && novoNumeroNF !== numeroNF) {
      const nfExistente = await prisma.notaFiscal.findFirst({
        where: {
          agendamentoId: agendamento.id,
          numeroPedido: numeroPedido,
          numeroNF: novoNumeroNF
        }
      });

      if (nfExistente) {
        return res.status(400).json({ error: 'Já existe uma nota fiscal com este número neste pedido' });
      }
    }

    // Atualizar nota fiscal
    const dadosAtualizacao = {
      numeroNF: novoNumeroNF || numeroNF,
      valor: valor || notaFiscal.valor
    };

    if (arquivo) {
      dadosAtualizacao.arquivoPath = arquivo.filename;
      
      // Remover arquivo antigo se existir
      if (notaFiscal.arquivoPath) {
        const arquivoAntigo = path.join(__dirname, 'uploads', notaFiscal.arquivoPath);
        if (fs.existsSync(arquivoAntigo)) {
          fs.unlinkSync(arquivoAntigo);
        }
      }
    }

    await prisma.notaFiscal.update({
      where: { id: notaFiscal.id },
      data: dadosAtualizacao
    });

    // Buscar agendamento atualizado
    const agendamentoAtualizado = await prisma.agendamento.findFirst({
      where: { codigo: codigo },
      include: {
        cd: true,
        notasFiscais: true
      }
    });

    // Formatar dados para retorno
    const pedidos = {};
    agendamentoAtualizado.notasFiscais.forEach(nf => {
      if (!pedidos[nf.numeroPedido]) {
        pedidos[nf.numeroPedido] = {
          numero: nf.numeroPedido,
          notasFiscais: []
        };
      }
      pedidos[nf.numeroPedido].notasFiscais.push({
        numero: nf.numeroNF,
        valor: nf.valor,
        arquivo: nf.arquivoPath
      });
    });

    agendamentoAtualizado.pedidos = Object.values(pedidos);

    res.json({
      success: true,
      message: 'Nota fiscal atualizada com sucesso',
      data: agendamentoAtualizado
    });

  } catch (error) {
    console.error('Erro ao editar nota fiscal:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Excluir nota fiscal
app.delete('/api/agendamentos/:codigo/pedidos/:numeroPedido/notas-fiscais/:numeroNF', async (req, res) => {
  try {
    const { codigo, numeroPedido, numeroNF } = req.params;

    // Buscar agendamento
    const agendamento = await prisma.agendamento.findFirst({
      where: { codigo: codigo }
    });

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    // Buscar nota fiscal
    const notaFiscal = await prisma.notaFiscal.findFirst({
      where: {
        agendamentoId: agendamento.id,
        numeroPedido: numeroPedido,
        numeroNF: numeroNF
      }
    });

    if (!notaFiscal) {
      return res.status(404).json({ error: 'Nota fiscal não encontrada' });
    }

    // Remover arquivo se existir
    if (notaFiscal.arquivoPath) {
      const arquivoPath = path.join(__dirname, 'uploads', notaFiscal.arquivoPath);
      if (fs.existsSync(arquivoPath)) {
        fs.unlinkSync(arquivoPath);
      }
    }

    // Excluir nota fiscal
    await prisma.notaFiscal.delete({
      where: { id: notaFiscal.id }
    });

    // Buscar agendamento atualizado
    const agendamentoAtualizado = await prisma.agendamento.findFirst({
      where: { codigo: codigo },
      include: {
        cd: true,
        notasFiscais: true
      }
    });

    // Formatar dados para retorno
    const pedidos = {};
    agendamentoAtualizado.notasFiscais.forEach(nf => {
      if (!pedidos[nf.numeroPedido]) {
        pedidos[nf.numeroPedido] = {
          numero: nf.numeroPedido,
          notasFiscais: []
        };
      }
      pedidos[nf.numeroPedido].notasFiscais.push({
        numero: nf.numeroNF,
        valor: nf.valor,
        arquivo: nf.arquivoPath
      });
    });

    agendamentoAtualizado.pedidos = Object.values(pedidos);

    res.json({
      success: true,
      message: 'Nota fiscal excluída com sucesso',
      data: agendamentoAtualizado
    });

  } catch (error) {
    console.error('Erro ao excluir nota fiscal:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============================================================================
// ROTAS DE ARQUIVOS
// ============================================================================

// Download de arquivo PDF
app.get('/api/files/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, 'uploads', filename);

    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // Verificar se é PDF
    if (!filename.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ error: 'Arquivo inválido' });
    }

    res.sendFile(filePath);

  } catch (error) {
    console.error('Erro ao baixar arquivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============================================================================
// ROTAS DE BLOQUEIOS DE HORÁRIO
// ============================================================================

// Criar novo bloqueio de horário
app.post('/api/bloqueios-horario', authenticateToken, async (req, res) => {
  try {
    const { dataBloqueio, horaInicio, horaFim, motivo } = req.body;
    const cdId = req.user.id;
    console.log('[Bloqueio] POST /api/bloqueios-horario');
    console.log('cdId recebido:', cdId);
    console.log('Dados recebidos:', { dataBloqueio, horaInicio, horaFim, motivo });

    // Mapear para os novos campos do modelo
    const bloqueio = await prisma.bloqueioHorario.create({
      data: {
  dataInicio: new Date(dataBloqueio + 'T03:00:00'),
  dataFim: new Date(dataBloqueio + 'T03:00:00'), // Mesmo dia para início e fim
        horarioInicio: horaInicio,
        horarioFim: horaFim,
        motivo,
        cdId
      }
    });

    console.log('Bloqueio salvo:', bloqueio);
    res.json({ success: true, data: bloqueio });
  } catch (error) {
    console.error('Erro ao criar bloqueio:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar bloqueio de horário' });
  }
});

// Listar bloqueios de horário
app.get('/api/bloqueios-horario', authenticateToken, async (req, res) => {
  try {
    const cdId = req.user.id;
    console.log('Buscando bloqueios de horário para CD ID:', cdId);

    // Verificar se o CD existe
    const cd = await prisma.cd.findUnique({
      where: { id: cdId }
    });

    if (!cd) {
      console.error('CD não encontrado com ID:', cdId);
      return res.status(404).json({ success: false, error: 'CD não encontrado' });
    }

    // Usando os campos corretos do modelo atualizado
    const bloqueios = await prisma.bloqueioHorario.findMany({
      where: { cdId },
      orderBy: { dataInicio: 'asc' }
    });

    console.log(`Encontrados ${bloqueios.length} bloqueios para o CD ID ${cdId}`);
    res.json({ success: true, data: bloqueios });
  } catch (error) {
    console.error('Erro ao carregar bloqueios:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao carregar bloqueios',
      details: error.message
    });
  }
});

// Atualizar bloqueio de horário
app.put('/api/bloqueios-horario/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { dataBloqueio, horaInicio, horaFim, motivo } = req.body;
    const cdId = req.user.id;

    // Mapear para os novos campos do modelo
    const bloqueio = await prisma.bloqueioHorario.updateMany({
      where: { 
        id: parseInt(id),
        cdId 
      },
      data: {
        dataInicio: new Date(dataBloqueio),
        dataFim: new Date(dataBloqueio), // Mesmo dia para início e fim
        horarioInicio: horaInicio,
        horarioFim: horaFim,
        motivo
      }
    });

    res.json({ success: true, data: bloqueio });
  } catch (error) {
    console.error('Erro ao atualizar bloqueio:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao atualizar bloqueio',
      details: error.message
    });
  }
});

// Excluir bloqueio de horário
app.delete('/api/bloqueios-horario/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const cdId = req.user.id;

    await prisma.bloqueioHorario.deleteMany({
      where: { 
        id: parseInt(id),
        cdId 
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir bloqueio:', error);
    res.status(500).json({ success: false, error: 'Erro ao excluir bloqueio' });
  }
});

// ============================================================================
// ENDPOINT - HORÁRIOS DISPONÍVEIS
// ============================================================================

// GET /api/horarios-disponiveis - Obter horários disponíveis para uma data/CD
app.get('/api/horarios-disponiveis', async (req, res) => {
  try {
    const { date, cd } = req.query;
    
    console.log(`📅 [GET /api/horarios-disponiveis] Consultando horários para data: ${date}, CD: ${cd}`);
    
    if (!date) {
      return res.status(400).json({ error: 'Data é obrigatória' });
    }

    // Validar formato da data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'Formato de data inválido. Use YYYY-MM-DD' });
    }

    // Converter data para Date object
    const selectedDate = new Date(date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Verificar se a data não é no passado
    if (selectedDate < today) {
      return res.status(400).json({ error: 'Não é possível consultar horários para datas passadas' });
    }

    // Verificar se não é fim de semana
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.status(400).json({ 
        error: 'Agendamentos não são permitidos aos finais de semana',
        horarios: []
      });
    }

    // Buscar o CD pelo nome ou ID, caso fornecido
    let cdId = null;
    if (cd) {
      try {
        // Tentar converter para número (caso seja um ID)
        if (!isNaN(parseInt(cd))) {
          cdId = parseInt(cd);
        } else {
          // Buscar pelo nome (SQLite não suporta case insensitive diretamente via Prisma)
          // Convertemos para minúsculas para fazer a comparação
          const cdLowerCase = cd.toLowerCase();
          const cds = await prisma.cd.findMany();
          const cdEncontrado = cds.find(item => 
            item.nome.toLowerCase().includes(cdLowerCase) || 
            (item.estado && item.estado.toLowerCase().includes(cdLowerCase))
          );
          
          if (cdEncontrado) {
            cdId = cdEncontrado.id;
            console.log(`🔍 [GET /api/horarios-disponiveis] CD encontrado por nome/estado: ${cd} -> ID: ${cdId}`);
          } else {
            console.log(`⚠️ [GET /api/horarios-disponiveis] CD não encontrado: ${cd}`);
          }
        }
      } catch (error) {
        console.error(`❌ [GET /api/horarios-disponiveis] Erro ao buscar CD: ${cd}`, error);
      }
    }

    // Buscar agendamentos existentes para a data
    const agendamentosExistentes = await prisma.agendamento.findMany({
      where: {
        dataEntrega: {
          gte: new Date(date + 'T00:00:00'),
          lt: new Date(date + 'T23:59:59')
        },
        ...(cdId && { cdId }),
        status: {
          not: 'cancelado'
        }
      },
      select: {
        horarioEntrega: true
      }
    });

    // Buscar bloqueios de horário para a data
    const bloqueiosExistentes = await prisma.bloqueioHorario.findMany({
      where: {
        dataInicio: {
          lte: new Date(date + 'T23:59:59')
        },
        dataFim: {
          gte: new Date(date + 'T00:00:00')
        },
        ativo: true,
        ...(cdId && { cdId })
      }
    });

    console.log(`📊 [GET /api/horarios-disponiveis] Encontrados ${agendamentosExistentes.length} agendamentos e ${bloqueiosExistentes.length} bloqueios`);

    // Horários padrão do CD conforme regra de negócio:
    // Das 08:00 às 11:00 e das 13:00 às 16:00
    const horariosBase = [
  { valor: '08:00', label: '08:00' },
  { valor: '09:00', label: '09:00' },
  { valor: '10:00', label: '10:00' },
  { valor: '11:00', label: '11:00' },
  { valor: '13:00', label: '13:00' },
  { valor: '14:00', label: '14:00' },
  { valor: '15:00', label: '15:00' },
  { valor: '16:00', label: '16:00' }
    ];

    // Função para verificar se um horário está bloqueado
    const isHorarioBloqueado = (horario) => {
      return bloqueiosExistentes.some(bloqueio => {
        // Comparar horários inteiros (ex: 08:00, 09:00)
        return horario === bloqueio.horarioInicio || horario === bloqueio.horarioFim ||
          (horario >= bloqueio.horarioInicio && horario < bloqueio.horarioFim);
      });
    };

    // Função para contar agendamentos por horário
    const getAgendamentosPorHorario = (horario) => {
      return agendamentosExistentes.filter(ag => ag.horarioEntrega === horario).length;
    };

    // Processar horários disponíveis
    const horariosDisponiveis = horariosBase.map(horario => {
      const isBloqueado = isHorarioBloqueado(horario.valor);
      const agendamentosCount = getAgendamentosPorHorario(horario.valor);
      const maxAgendamentosPorHorario = 3; // Limite configurável
      
      return {
        ...horario,
        disponivel: !isBloqueado && agendamentosCount < maxAgendamentosPorHorario,
        agendamentos: agendamentosCount,
        motivo: isBloqueado ? 'Horário bloqueado' : 
                agendamentosCount >= maxAgendamentosPorHorario ? 'Horário lotado' : null
      };
    });

    console.log(`✅ [GET /api/horarios-disponiveis] Retornando ${horariosDisponiveis.length} horários`);

    res.json({
      success: true,
      data: date,
      cd: cd || 'todos',
      cdId: cdId,
      horarios: horariosDisponiveis
    });

  } catch (error) {
    console.error('❌ [GET /api/horarios-disponiveis] Erro:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao buscar horários disponíveis',
      horarios: []
    });
  }
});

// ============================================================================
// ROTA DE KPIs DO DASHBOARD
// ============================================================================ 
app.get('/api/kpis', authenticateToken, async (req, res) => {
  try {
    console.log('• GET /api/kpis - query:', req.query, 'user:', req.user && req.user.id);
    // Filtros via query params
    const reqCd = req.query.cd || req.user.id; // se passar cd, permitir (desde que o usuário tenha permissão)
    const cdId = Number(reqCd) || req.user.id;

    const cd = await prisma.cd.findUnique({ where: { id: cdId } });
    if (!cd) return res.status(404).json({ error: 'CD não encontrado' });

    const where = { cdId };
    const { start, end } = req.query;
    // Filtrar por período quando informado (assume formato YYYY-MM-DD)
    if (start || end) {
      where.dataEntrega = {};
      if (start) where.dataEntrega.gte = new Date(start + 'T00:00:00');
      if (end) where.dataEntrega.lte = new Date(end + 'T23:59:59');
    }

    // Buscar agendamentos com fornecedor
    const agendamentos = await prisma.agendamento.findMany({
      where,
      include: { fornecedor: true }
    });
    const totalAgendamentos = agendamentos.length;
    const entregues = agendamentos.filter(a => a.status === 'entregue').length;
    const naoVeio = agendamentos.filter(a => a.status === 'nao-veio').length;
    const reagendados = agendamentos.filter(a => a.status === 'reagendamento').length;
    const pendentes = agendamentos.filter(a => a.status === 'pendente').length;
    const confirmados = agendamentos.filter(a => a.status === 'confirmado').length;

    // % KPIs
    const percentEntregues = totalAgendamentos ? ((entregues / totalAgendamentos) * 100).toFixed(1) + '%' : '-';
    const percentNaoVeio = totalAgendamentos ? ((naoVeio / totalAgendamentos) * 100).toFixed(1) + '%' : '-';
    const percentReagendados = totalAgendamentos ? ((reagendados / totalAgendamentos) * 100).toFixed(1) + '%' : '-';

  // Tempo médio de permanência (em minutos)
    // Supondo que existam campos dataEntrada e dataSaida (ajuste se necessário)
    let tempoTotal = 0, countTempo = 0;
    agendamentos.forEach(a => {
      if (a.dataEntrada && a.dataSaida) {
        const entrada = new Date(a.dataEntrada);
        const saida = new Date(a.dataSaida);
        const diff = (saida - entrada) / 60000; // minutos
        if (diff > 0) {
          tempoTotal += diff;
          countTempo++;
        }
      }
    });
  const tempoMedioPermanencia = countTempo ? Math.round(tempoTotal / countTempo) + ' min' : null;

    // Distribuição dos status (para gráfico pizza)
    const statusLabels = ['Entregue','Confirmado','Não Veio','Reagendado','Pendente'];
    const statusValores = [entregues, confirmados, naoVeio, reagendados, pendentes];

  // Top 5 fornecedores com mais "Não Veio"
    const fornecedoresNaoVeio = {};
    agendamentos.forEach(a => {
      if (a.status === 'nao-veio' && a.fornecedor) {
        const nome = a.fornecedor.nome;
        fornecedoresNaoVeio[nome] = (fornecedoresNaoVeio[nome] || 0) + 1;
      }
    });
    const topFornecedores = Object.entries(fornecedoresNaoVeio)
      .sort((a,b) => b[1]-a[1])
      .slice(0,5);
    const topFornecedoresLabels = topFornecedores.map(f => f[0]);
    const topFornecedoresValores = topFornecedores.map(f => f[1]);

    // Agendamentos por dia (linha)
    const agendamentosPorDia = {};
    agendamentos.forEach(a => {
      if (a.dataEntrega) {
        const dia = a.dataEntrega.toISOString().split('T')[0];
        agendamentosPorDia[dia] = (agendamentosPorDia[dia] || 0) + 1;
      }
    });
    const agendamentosLabels = Object.keys(agendamentosPorDia).sort().slice(-14);
    const agendamentosValores = agendamentosLabels.map(d => agendamentosPorDia[d]);

    // Não veio por dia (mesma janela de labels)
    const naoVeioPorDiaMap = {};
    agendamentos.forEach(a => {
      if (a.dataEntrega && a.status === 'nao-veio') {
        const dia = a.dataEntrega.toISOString().split('T')[0];
        naoVeioPorDiaMap[dia] = (naoVeioPorDiaMap[dia] || 0) + 1;
      }
    });
    const naoVeioPorDia = agendamentosLabels.map(d => naoVeioPorDiaMap[d] || 0);

    // Tendência comparando com período anterior (se start/end fornecidos)
    let tendenciaEntregues = null;
    let tendenciaNaoVeio = null;
    let tendenciaReagendados = null;
    if (start && end) {
      const startDate = new Date(start + 'T00:00:00');
      const endDate = new Date(end + 'T23:59:59');
      const delta = endDate.getTime() - startDate.getTime();
      const prevStart = new Date(startDate.getTime() - delta - 24*60*60*1000);
      const prevEnd = new Date(startDate.getTime() - 24*60*60*1000);

      const prevWhere = { cdId, dataEntrega: { gte: prevStart, lte: prevEnd } };
      const prevAgend = await prisma.agendamento.findMany({ where: prevWhere });
      const prevEntregues = prevAgend.filter(a => a.status === 'entregue').length;
      const prevNaoVeio = prevAgend.filter(a => a.status === 'nao-veio').length;
      const prevReag = prevAgend.filter(a => a.status === 'reagendamento').length;

      tendenciaEntregues = entregues - prevEntregues;
      tendenciaNaoVeio = naoVeio - prevNaoVeio;
      tendenciaReagendados = reagendados - prevReag;
    }

    res.json({
      cdNome: cd.nome,
      totalAgendamentos,
      percentEntregues,
      percentNaoVeio,
      percentReagendados,
      tempoMedioPermanencia,
      taxaPontualidade: null, // Indisponível por falta de campos confiáveis
      statusLabels,
      statusValores,
      topFornecedoresLabels,
      topFornecedoresValores,
      agendamentosLabels,
      agendamentosValores,
      naoVeioPorDia,
      tendenciaEntregues,
      tendenciaNaoVeio,
      tendenciaReagendados
    });
  } catch (error) {
    console.error('Erro ao buscar KPIs:', error);
    res.status(500).json({ error: 'Erro ao buscar KPIs' });
  }
});

// Rota para listar CDs (para select)
app.get('/api/cds', authenticateToken, async (req, res) => {
  try {
    const cds = await prisma.cd.findMany({ select: { id: true, nome: true } });
    res.json(cds);
  } catch (err) {
    console.error('Erro ao listar CDs:', err);
    res.status(500).json({ error: 'Erro ao listar CDs' });
  }
});

// ============================================================================
// MIDDLEWARE DE ERROR E INICIALIZAÇÃO
// ============================================================================

app.use(errorHandler);

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor BrisaLOG Portal rodando na porta ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 API Base URL: http://localhost:${PORT}/api`);
  console.log('\n📋 Endpoints disponíveis:');
  console.log('• POST /api/auth/login - Login de CD');
  console.log('• POST /api/auth/change-password - Alterar senha');
  console.log('• GET /api/agendamentos - Listar agendamentos');
  console.log('• POST /api/agendamentos - Criar agendamento');
  console.log('• GET /api/agendamentos/consultar/:codigo - Consultar agendamento');
  console.log('• PUT /api/agendamentos/:id/status - Atualizar status');
  console.log('• POST /api/agendamentos/:id/reagendar - Reagendar');
  console.log('• POST /api/agendamentos/:codigo/pedidos - Adicionar pedidos');
  console.log('• POST /api/agendamentos/:codigo/pedidos/:numeroPedido/notas-fiscais - Adicionar NF');
  console.log('• PUT /api/agendamentos/:codigo/pedidos/:numeroPedido/notas-fiscais/:numeroNF - Editar NF');
  console.log('• GET /api/horarios-disponiveis - Consultar horários disponíveis');
  console.log('• POST /api/bloqueios-horario - Criar bloqueio de horário');
  console.log('• GET /api/bloqueios-horario - Listar bloqueios de horário');
  console.log('• PUT /api/bloqueios-horario/:id - Atualizar bloqueio de horário');
  console.log('• DELETE /api/bloqueios-horario/:id - Excluir bloqueio de horário');
  console.log('• DELETE /api/agendamentos/:codigo/pedidos/:numeroPedido/notas-fiscais/:numeroNF - Excluir NF');
  console.log('• GET /api/dashboard/stats - Estatísticas');
  console.log('• GET /api/files/:filename - Download de arquivos');
  console.log('• GET /api/kpis - KPIs do dashboard');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});
// ...existing code...

// ...existing code...
