
// ...existing code...
require('dotenv').config();
const emailService = require('./emailService');
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const prisma = new PrismaClient();

// Função para inicializar o banco de dados
async function initializeDatabase() {
  try {
    console.log('🔧 Verificando estrutura do banco de dados...');
    console.log('📡 DATABASE_URL configurada:', process.env.DATABASE_URL ? 'SIM' : 'NÃO');
    console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
    
    // Tentar conectar ao banco primeiro
    await prisma.$connect();
    console.log('✅ Conexão com banco estabelecida!');
    
    // Tentar fazer uma query simples para verificar se as tabelas existem
    await prisma.cd.findFirst();
    console.log('✅ Banco de dados já inicializado!');
    
  } catch (error) {
    console.log('❗ Erro detectado:', error.code, error.message);
    
    if (error.code === 'P2021' || error.message.includes('does not exist') || error.code === 'P1001' || error.code === 'P1017') {
      console.log('🗄️ Criando estrutura do banco de dados...');
      
      try {
        // Gerar o cliente Prisma primeiro
        console.log('🔧 Gerando cliente Prisma...');
        execSync('npx prisma generate', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        
        // Resetar migrações problemáticas se necessário
        console.log('🔄 Resetando migrações antigas...');
        execSync('node scripts/reset-migrations.js', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        
        // Para PostgreSQL, usar migrate deploy que é mais apropriado para produção
        console.log('📋 Executando: prisma migrate deploy...');
        execSync('npx prisma migrate deploy', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        
        // Reconectar após as migrações
        await prisma.$disconnect();
        await prisma.$connect();
        
        // Verificar se existem CDs antes de executar seed
        const cdCount = await prisma.cd.count();
        console.log(`🔍 Total de CDs encontrados: ${cdCount}`);
        
        if (cdCount === 0) {
          console.log('🌱 Nenhum CD encontrado, executando seed...');
          execSync('node prisma/seed.js', { 
            stdio: 'inherit',
            cwd: process.cwd()
          });
        } else {
          console.log('✅ CDs já existem, pulando seed');
        }
        
        console.log('✅ Banco de dados inicializado com sucesso!');
        
      } catch (setupError) {
        console.error('❌ Erro ao configurar banco de dados:', setupError.message);
        console.error('🔍 Detalhes do erro:', setupError);
        
        // Se o erro for de conexão, pode ser que o PostgreSQL não esteja configurado
        if (setupError.message.includes('connect') || setupError.message.includes('ENOTFOUND') || setupError.message.includes('getaddrinfo')) {
          console.log('');
          console.log('🚨 ATENÇÃO: Configure sua DATABASE_URL corretamente para PostgreSQL na AWS.');
          console.log('Exemplo: postgres://usuario:senha@host:porta/banco');
        }
        
        process.exit(1);
      }
    } else {
      console.error('❌ Erro inesperado no banco de dados:', error.message);
      console.error('🔍 Código do erro:', error.code);
      console.error('🔍 Detalhes completos:', error);
      
      // Tentar continuar mesmo com erro se for ambiente de desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Continuando em modo desenvolvimento...');
      } else {
        process.exit(1);
      }
    }
  }
}

// Atualiza agendamentos antigos para padrão de observação e data/hora de reagendamento
async function atualizarPendentesReagendamento() {
  const pendentes = await prisma.agendamento.findMany({
    where: {
      status: 'pendente',
      observacoes: { contains: 'reagend' }
    }
  });
  for (const ag of pendentes) {
    // Busca a última resposta de reagendamento (se houver)
    const resposta = await prisma.respostaReagendamento.findFirst({
      where: { agendamentoId: ag.id, resposta: 'contra_proposta' },
      orderBy: { id: 'desc' }
    });
    let novaData = ag.dataEntrega;
    let novoHorario = ag.horarioEntrega;
    if (resposta && resposta.novaData) novaData = resposta.novaData;
    if (resposta && resposta.novoHorario) novoHorario = resposta.novoHorario;
    await prisma.agendamento.update({
      where: { id: ag.id },
      data: {
        observacoes: 'Pendente (reagendamento)',
          dataEntrega: toUTCDateOnly(novaData),
        horarioEntrega: novoHorario
      }
    });
  }
  console.log('Agendamentos pendentes de reagendamento atualizados!');
}

// Função principal de inicialização
async function startServer() {
  try {
    // Primeiro inicializar o banco
    await initializeDatabase();
    
    // Depois executar atualizações
    await atualizarPendentesReagendamento();
    
    // Corrigir agendamentos existentes se necessário
    if (process.env.CORRIGIR_AGENDAMENTOS === 'true') {
      await corrigirAgendamentosExistentes();
    }
    
    console.log('🚀 Servidor pronto para iniciar!');
    
    // Inicializar servidor apenas após setup completo
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor BrisaLOG Portal rodando na porta ${PORT} (acessível externamente)`);
      console.log(`📊 Health check: http://SEU_IP_PUBLICO:${PORT}/health`);
      console.log(`🔐 API Base URL: http://SEU_IP_PUBLICO:${PORT}/api`);
      console.log('\n📋 Endpoints disponíveis:');
      console.log('• POST /api/auth/login - Login de CD');
      console.log('• POST /api/auth/change-password - Alterar senha');
      console.log('• GET /api/verify-token - Verificar se token é válido');
      console.log('• POST /api/renew-token - Renovar token de autenticação');
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
    
  } catch (error) {
    console.error('❌ Erro na inicialização:', error.message);
    process.exit(1);
  }
}

// Executar inicialização
startServer();
// Função utilitária para criar Date UTC puro (meia-noite) a partir de 'YYYY-MM-DD'
function toUTCDateOnly(dateStr) {
  if (!dateStr) return null;
  if (typeof dateStr === 'string') {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts.map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      if (!isNaN(date)) return date;
    }
    // fallback: try parsing as ISO
    const date = new Date(dateStr);
    if (!isNaN(date)) return date;
    return null;
  } else if (dateStr instanceof Date && !isNaN(dateStr)) {
    return dateStr;
  }
  return null;
}

// Nova função para criar datas no timezone local
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
    const date = new Date(dateStr);
    if (!isNaN(date)) {
      // Se veio como ISO, converter para local midnight
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    }
    return null;
  } else if (dateStr instanceof Date && !isNaN(dateStr)) {
    return dateStr;
  }
  return null;
}

// Função para formatar data como DD/MM/YYYY a partir de string YYYY-MM-DD
function formatDateBr(dateStr) {
  console.log(`🔍 [formatDateBr] Input: ${dateStr} (tipo: ${typeof dateStr})`);
  
  if (!dateStr) return 'N/A';
  
  // Se for um objeto Date, converter para string primeiro
  if (dateStr instanceof Date) {
    dateStr = dateStr.toISOString().slice(0, 10);
    console.log(`🔍 [formatDateBr] Convertido de Date para string: ${dateStr}`);
  }
  
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const parts = dateStr.split('-');
    console.log(`🔍 [formatDateBr] Parts: [${parts.join(', ')}]`);
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const resultado = `${day}/${month}/${year}`;
      console.log(`🔍 [formatDateBr] Resultado: ${resultado}`);
      return resultado;
    }
  }
  
  console.log(`🔍 [formatDateBr] Retornando valor original: ${dateStr}`);
  return dateStr;
}

// Força correção retroativa ao iniciar o servidor
process.env.CORRIGIR_AGENDAMENTOS = 'true';


const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRoutes = require('./authRoutes');

// Função para corrigir datas de agendamentos existentes no banco (retroativo)
async function corrigirAgendamentosExistentes() {
  const agendamentos = await prisma.agendamento.findMany();
  for (const ag of agendamentos) {
    if (ag.dataEntrega) {
      const corrigida = toUTCDateOnly(ag.dataEntrega instanceof Date ? ag.dataEntrega.toISOString().slice(0,10) : ag.dataEntrega);
      await prisma.agendamento.update({
        where: { id: ag.id },
        data: { dataEntrega: corrigida }
      });
    }
    if (ag.dataSugestaoCD) {
      const corrigida = toUTCDateOnly(ag.dataSugestaoCD instanceof Date ? ag.dataSugestaoCD.toISOString().slice(0,10) : ag.dataSugestaoCD);
      await prisma.agendamento.update({
        where: { id: ag.id },
        data: { dataSugestaoCD: corrigida }
      });
    }
  }
  console.log('Correção retroativa de datas concluída!');
}

// ...restante do código do servidor...
const app = express();

// ===========================
// CÓDIGO GOD - BrisaLOG2
// ===========================
// Função para validar código GOD que pode ser usado em qualquer ação
function validarCodigoGOD(codigoUsuario) {
  const CODIGO_GOD = 'BrisaLOG2';
  return codigoUsuario === CODIGO_GOD;
}

// NOTA: Endpoint de teste de email disponível apenas em desenvolvimento
// Para usar em produção, adicione authenticateToken middleware
if (process.env.NODE_ENV === 'development') {
  app.post('/api/test-email', async (req, res) => {
    try {
      const to = req.body.to || 'wandevpb@gmail.com';
      const subject = req.body.subject || 'Teste de envio de e-mail Produção';
      const html = req.body.html || '<b>Este é um teste de envio de e-mail pelo servidor de produção.</b>';
      const result = await emailService.sendEmail({ to, subject, html });
      if (result.success) {
        res.json({ success: true, messageId: result.messageId, response: result.response });
      } else {
        res.status(500).json({ success: false, error: result.error, code: result.code });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}

const PORT = process.env.PORT || 9999;
const JWT_SECRET = process.env.JWT_SECRET || 'brisalog_secret_key_2025';
const EMAIL_FROM = process.env.EMAIL_FROM;
const EMAIL_NAME = process.env.EMAIL_NAME;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_PORT = process.env.SMTP_PORT;

// Middlewares
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:8080'
];
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'cache-control'],
  credentials: true
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(express.static(path.join(__dirname, 'uploads')));

// Servir arquivos estáticos (HTML, CSS, JS) da raiz do projeto
app.use(express.static(path.join(__dirname, '..')));

// Usar rotas de autenticação
app.use('/api/auth', authRoutes);

// Usar rotas de usuários
const usuariosRoutes = require('./usuariosRoutes');
app.use('/api/usuarios', usuariosRoutes);

// Usar rotas de perfis
const perfisRoutes = require('./perfisRoutes');
app.use('/api/perfis', perfisRoutes);

// Usar rotas de relatórios públicos
const relatoriosPublicosRoutes = require('./relatoriosPublicosRoutes');
app.use('/api/relatorios-publicos', relatoriosPublicosRoutes);

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
    // Sanitizar filename: remover caracteres especiais e bytes nulos
    const sanitizedName = file.originalname
      .normalize('NFD') // Decompose caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\x20-\x7E]/g, '') // Remove caracteres não-ASCII
      .replace(/\0/g, '') // Remove null bytes
      .trim();
    cb(null, uniqueSuffix + '-' + sanitizedName);
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
  console.log(`🔐 [AUTH] Executando autenticação para ${req.method} ${req.path}`);
  console.log('🔐 [AUTH] Headers recebidos:', Object.keys(req.headers));
  
  const authHeader = req.headers['authorization'];
  console.log('🔐 [AUTH] Authorization header:', authHeader ? 'PRESENTE' : 'AUSENTE');
  
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('❌ [AUTH] Token não fornecido');
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log('✅ [AUTH] Autenticação bem-sucedida para usuário ID:', decoded.id);
    console.log('🔍 [AUTH] Token decodificado completo:', decoded);
    next();
  } catch (err) {
    console.error('❌ [AUTH] Erro na verificação do token:', err.message);
    
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
        nome: cd.nome,
        tipoPerfil: cd.tipoPerfil || 'cd'
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
        primeiroLogin: cd.primeiroLogin,
        tipoPerfil: cd.tipoPerfil || 'cd'
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

// Verificar se o token é válido
app.get('/api/verify-token', authenticateToken, async (req, res) => {
  try {
    // Se chegou até aqui, o token é válido (middleware authenticateToken já validou)
    res.json({ 
      success: true, 
      valid: true,
      user: {
        id: req.user.id,
        usuario: req.user.usuario,
        nome: req.user.nome
      }
    });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Renovar token
app.post('/api/renew-token', async (req, res) => {
  try {
    const { cdId } = req.body;

    if (!cdId) {
      return res.status(400).json({ error: 'ID do CD é obrigatório' });
    }

    // Buscar CD para garantir que ainda existe e está ativo
    const cd = await prisma.cd.findUnique({
      where: { id: cdId }
    });

    if (!cd || !cd.ativo) {
      return res.status(401).json({ error: 'CD não encontrado ou inativo' });
    }

    // Gerar novo token JWT
    const token = jwt.sign(
      { 
        id: cd.id, 
        usuario: cd.usuario, 
        nome: cd.nome,
        tipoPerfil: cd.tipoPerfil || 'cd'
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
        tipoPerfil: cd.tipoPerfil || 'cd'
      }
    });

  } catch (error) {
    console.error('Erro ao renovar token:', error);
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
    const { status, search, page = 1, limit = 10000 } = req.query;
    const cdId = req.user.id;
    
    console.log(`👤 [GET /api/agendamentos] CD ID do usuário logado: ${cdId} (${req.user.nome})`);

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
        { fornecedorNome: { contains: search } },
        { fornecedorEmail: { contains: search } }
      ];
    }

    console.log('🔍 [GET /api/agendamentos] Filtros aplicados:', JSON.stringify(where, null, 2));

    // Buscar agendamentos
    const agendamentos = await prisma.agendamento.findMany({
      where: where,
      include: {
        fornecedor: true, // Manter temporariamente para compatibilidade
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

    // Adicionar objeto fornecedor virtual a cada agendamento (se necessário)
    agendamentos.forEach(agendamento => addFornecedorVirtual(agendamento));

    // Contar total
    const total = await prisma.agendamento.count({ where });

    console.log(`✅ [GET /api/agendamentos] ${agendamentos.length} agendamentos encontrados de ${total} total`);
    console.log('📋 [GET /api/agendamentos] Códigos dos agendamentos:', 
      agendamentos.map(a => `${a.codigo} (status: ${a.status}, cdId: ${a.cdId})`)
    );
    
    // Verificar se AGD812791 está na lista
    const agd812791 = agendamentos.find(a => a.codigo === 'AGD812791');
    if (agd812791) {
      console.log('✅ [GET /api/agendamentos] AGD812791 ENCONTRADO:', {
        id: agd812791.id,
        codigo: agd812791.codigo,
        status: agd812791.status,
        cdId: agd812791.cdId,
        dataEntrega: agd812791.dataEntrega
      });
    } else {
      console.log('❌ [GET /api/agendamentos] AGD812791 NÃO ENCONTRADO na lista retornada');
      
      // Buscar AGD812791 diretamente no banco para debug
      const agd812791Direct = await prisma.agendamento.findFirst({
        where: { codigo: 'AGD812791' }
      });
      
      if (agd812791Direct) {
        console.log('🔍 [GET /api/agendamentos] AGD812791 existe no banco:', {
          id: agd812791Direct.id,
          codigo: agd812791Direct.codigo,
          status: agd812791Direct.status,
          cdId: agd812791Direct.cdId,
          cdIdDoUsuario: cdId,
          corresponde: agd812791Direct.cdId === cdId
        });
      } else {
        console.log('❌ [GET /api/agendamentos] AGD812791 NÃO EXISTE no banco de dados');
      }
    }

    // Serializa BigInt para string
    function replacer(key, value) {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      data: agendamentos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    }, replacer));

  } catch (error) {
    console.error('Erro ao listar agendamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar agendamentos de TODOS os CDs (para perfil consultivo)
app.get('/api/agendamentos/todos', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 [GET /api/agendamentos/todos] Iniciando listagem consultiva...');
    console.log('👤 [GET /api/agendamentos/todos] Usuário:', req.user.nome, 'Perfil:', req.user.tipoPerfil);
    
    // Verificar se usuário tem perfil consultivo ou admin
    if (req.user.tipoPerfil !== 'consultivo' && req.user.tipoPerfil !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas perfis consultivos podem acessar esta rota.' });
    }

    const { status, search, cdId, page = 1, limit = 10000 } = req.query;

    // Construir filtros (SEM filtro de cdId padrão)
    const where = {};

    if (status) {
      where.status = status;
    }

    if (cdId) {
      where.cdId = parseInt(cdId);
    }

    if (search) {
      where.OR = [
        { codigo: { contains: search } },
        { fornecedorNome: { contains: search } },
        { fornecedorEmail: { contains: search } },
        { fornecedorDocumento: { contains: search } },
        { transportadorNome: { contains: search } },
        { transportadorDocumento: { contains: search } },
        { notasFiscais: { some: { numeroNF: { contains: search } } } },
        { notasFiscais: { some: { numeroPedido: { contains: search } } } }
      ];
    }

    console.log('🔍 [GET /api/agendamentos/todos] Filtros aplicados:', where);

    // Buscar agendamentos de TODOS os CDs
    const agendamentos = await prisma.agendamento.findMany({
      where: where,
      include: {
        cd: {
          select: {
            id: true,
            nome: true
          }
        },
        notasFiscais: true,
        historicoAcoes: {
          include: {
            cd: {
              select: {
                id: true,
                nome: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        dataEntrega: 'desc'
      },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    // Adicionar objeto fornecedor virtual
    agendamentos.forEach(agendamento => addFornecedorVirtual(agendamento));

    // Contar total
    const total = await prisma.agendamento.count({ where });

    console.log(`✅ [GET /api/agendamentos/todos] ${agendamentos.length} agendamentos encontrados de ${total} total`);

    // Serializa BigInt para string
    function replacer(key, value) {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    }

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      data: agendamentos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    }, replacer));

  } catch (error) {
    console.error('❌ [GET /api/agendamentos/todos] Erro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar agendamento (sem autenticação para fornecedores)
app.post('/api/agendamentos', upload.any(), async (req, res) => {
  console.log('🎯 [POST /api/agendamentos] ROTA INICIADA - Agendamento público (fornecedor)');
  console.log('🎯 [POST /api/agendamentos] Timestamp:', new Date().toISOString());
  console.log('🎯 [POST /api/agendamentos] Headers:', req.headers);
  
  try {
    console.log('🔍 [POST /api/agendamentos] req.body:', req.body);
    console.log('🔍 [POST /api/agendamentos] req.files:', req.files);
    
    // Testar conexão com banco
    console.log('🔍 [POST /api/agendamentos] Testando conexão com banco...');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ [POST /api/agendamentos] Conexão com banco OK');
    
    // Tentar fazer o parse do JSON
    let agendamentoData;
    try {
      agendamentoData = JSON.parse(req.body.agendamento);
      console.log('✅ [POST /api/agendamentos] JSON parseado com sucesso');
    } catch (parseError) {
      console.log('❌ [POST /api/agendamentos] Erro ao fazer parse do JSON:', parseError.message);
      return res.status(400).json({ error: 'Dados JSON inválidos' });
    }
    
    const arquivos = req.files || [];
    
    // Para agendamentos públicos, o CD deve vir nos dados do formulário
    const cdInfo = agendamentoData.entrega?.cd || agendamentoData.entrega?.cdDestino;
    console.log('🔍 [POST /api/agendamentos] cdInfo recebido:', cdInfo);
    console.log('🔍 [POST /api/agendamentos] agendamentoData.entrega:', agendamentoData.entrega);
    
    if (!cdInfo) {
      console.log('❌ [POST /api/agendamentos] CD não especificado nos dados');
      return res.status(400).json({ error: 'CD de destino deve ser especificado' });
    }
    
    // Buscar CD por nome ou ID
    let cdId;
    if (typeof cdInfo === 'number') {
      cdId = cdInfo;
    } else {
      console.log('🔍 [POST /api/agendamentos] Buscando CD por nome:', cdInfo);
      
      // Mapear nomes do frontend para nomes do banco (case-insensitive)
      const cdMap = {
        'Bahia': 'Bahia',
        'bahia': 'Bahia',
        'BAHIA': 'Bahia',
        'Pernambuco': 'Pernambuco',
        'pernambuco': 'Pernambuco', 
        'PERNAMBUCO': 'Pernambuco',
        'Ceará': 'Ceará',
        'ceará': 'Ceará',
        'CEARÁ': 'Ceará',
        'Lagoa Nova': 'LagoaNova',
        'lagoa nova': 'LagoaNova',
        'LAGOA NOVA': 'LagoaNova',
        'LagoaNova': 'LagoaNova',
        'lagoanова': 'LagoaNova',
        'Cd Lagoa Nova (TORRE)': 'cd lagoa nova (torre)',
        'cd lagoa nova (torre)': 'cd lagoa nova (torre)',
        'CD LAGOA NOVA (TORRE)': 'cd lagoa nova (torre)',
        'pereiro-frota': 'pereiro-frota',
        'Pereiro (Estoque de frotas)': 'pereiro-frota'
      };
      
      const cdNome = cdMap[cdInfo] || cdInfo;
      console.log('🔍 [POST /api/agendamentos] Nome do CD mapeado:', cdNome);
      
      // Buscar CD com match EXATO primeiro para evitar confusão entre "Lagoa Nova" e "Cd Lagoa Nova (TORRE)"
      let cd = await prisma.cd.findFirst({
        where: {
          OR: [
            { nome: { equals: cdNome, mode: 'insensitive' } },
            { usuario: { equals: cdNome, mode: 'insensitive' } }
          ]
        }
      });
      
      // Se não encontrar com match exato, tentar com contains (fallback)
      if (!cd) {
        cd = await prisma.cd.findFirst({
          where: {
            OR: [
              { nome: { contains: cdNome, mode: 'insensitive' } },
              { usuario: { contains: cdNome, mode: 'insensitive' } }
            ]
          }
        });
      }
      
      console.log('🔍 [POST /api/agendamentos] CD encontrado:', cd);
      
      // Se não encontrou, listar todos os CDs para debug
      if (!cd) {
        console.log('🔍 [POST /api/agendamentos] Listando todos os CDs no banco:');
        const todosCds = await prisma.cd.findMany({
          select: { id: true, nome: true, usuario: true, ativo: true }
        });
        console.log('📋 [POST /api/agendamentos] CDs existentes:', todosCds);
      }
      
      if (!cd) {
        console.log('❌ [POST /api/agendamentos] CD não encontrado:', cdInfo);
        return res.status(400).json({ error: `CD não encontrado: ${cdInfo}. CDs disponíveis devem ser verificados.` });
      }
      cdId = cd.id;
    }

    console.log('� [POST /api/agendamentos] Criando agendamento:', agendamentoData);
    console.log('🔍 [POST /api/agendamentos] CD ID determinado:', cdId);

    // Validar se o cdId foi extraído corretamente
    if (!cdId) {
      console.error('❌ [POST /api/agendamentos] CD ID não encontrado no token');
      return res.status(400).json({ error: 'ID do CD não encontrado no token de autenticação' });
    }

    // Validações básicas
    if (!agendamentoData.fornecedor || !agendamentoData.entrega || !agendamentoData.pedidos) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Buscar CD do usuário autenticado
    const cd = await prisma.cd.findUnique({
      where: { id: cdId }
    });

    if (!cd) {
      return res.status(400).json({ error: 'Centro de distribuição não encontrado' });
    }

    // ===================================================================
    // VALIDAÇÃO ESPECIAL PARA CD LAGOA NOVA - TORRE
    // ===================================================================
    if (cd.nome === 'Cd Lagoa Nova (TORRE)') {
      const horarioSolicitado = agendamentoData.entrega.horarioEntrega;
      const dataEntregaLocal = toLocalDateOnly(agendamentoData.entrega.dataEntrega);
      
      // Permitir apenas 08:00 ou 13:00
      if (horarioSolicitado !== '08:00' && horarioSolicitado !== '13:00') {
        console.log(`❌ [CD Torre] Horário ${horarioSolicitado} não permitido para CD ${cd.nome}`);
        return res.status(400).json({ 
          error: `Cd Lagoa Nova (TORRE) permite apenas os horários 08:00 (manhã) ou 13:00 (tarde)`,
          cdTipo: 'torre'
        });
      }
      
      // Determinar o turno
      const turno = horarioSolicitado === '08:00' ? 'manha' : 'tarde';
      
      // Verificar se já existe agendamento neste turno (na mesma data)
      const agendamentosNoDia = await prisma.agendamento.findMany({
        where: {
          cdId: cd.id,
          dataEntrega: dataEntregaLocal,
          status: { in: ['pendente', 'confirmado', 'em_transito'] }
        }
      });
      
      // Verificar se algum agendamento existente está no mesmo turno
      const existeNoTurno = agendamentosNoDia.some(ag => {
        const horario = ag.horarioEntrega;
        const turnoExistente = horario === '08:00' ? 'manha' : 'tarde';
        return turnoExistente === turno;
      });
      
      if (existeNoTurno) {
        const turnoTexto = turno === 'manha' ? 'manhã (08:00)' : 'tarde (13:00)';
        const horarioAlternativo = turno === 'manha' ? '13:00 (tarde)' : '08:00 (manhã)';
        console.log(`❌ [CD Torre] Já existe agendamento no turno ${turnoTexto} para ${dataEntregaLocal}`);
        return res.status(400).json({ 
          error: `Cd Lagoa Nova (TORRE): Já existe um agendamento no turno da ${turnoTexto} para esta data. Tente o horário ${horarioAlternativo} ou escolha outra data.`,
          cdTipo: 'torre',
          turnoOcupado: turno
        });
      }
      
      console.log(`✅ [CD Torre] Horário ${horarioSolicitado} disponível para ${dataEntregaLocal}`);
    }
    // ===================================================================

    // Buscar ou criar fornecedor
    console.log('🔍 [POST /api/agendamentos] Buscando fornecedor com CNPJ:', agendamentoData.fornecedor.documento);
    // Não mais usar tabela fornecedores separada
    // Os dados do fornecedor são salvos diretamente no agendamento (snapshot)
    console.log('📦 [POST /api/agendamentos] Salvando dados do fornecedor diretamente no agendamento');

    // Gerar código único aleatório
    let codigo;
    let codigoExiste = true;
    let tentativas = 0;
    const MAX_TENTATIVAS = 10;

    while (codigoExiste && tentativas < MAX_TENTATIVAS) {
      // Gerar 6 dígitos aleatórios
      const numeroAleatorio = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      codigo = `AGD${numeroAleatorio}`;
      
      // Verificar se já existe
      const existe = await prisma.agendamento.findFirst({
        where: { codigo }
      });
      
      codigoExiste = !!existe;
      tentativas++;
      
      if (codigoExiste) {
        console.log(`⚠️ Código ${codigo} já existe, gerando novo... (tentativa ${tentativas})`);
      }
    }

    if (codigoExiste) {
      throw new Error('Não foi possível gerar um código único após várias tentativas');
    }

    console.log(`✅ Código gerado: ${codigo}`);

    // Bloqueio de agendamento duplicado para mesmo CD, data e horário (apenas para agendamentos pendentes/confirmados)
    // Converte dataEntrega para data local
    const dataEntregaLocal = toLocalDateOnly(agendamentoData.entrega.dataEntrega);
    console.log('[DEBUG] dataEntrega recebido:', agendamentoData.entrega.dataEntrega, '| convertido:', dataEntregaLocal);
    
    // Regra: Não permite agendamento no mesmo dia, EXCETO para CD Lagoa Nova frotas (ID 10) e Pereiro-frota (ID 9)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataAgendamento = new Date(dataEntregaLocal);
    dataAgendamento.setHours(0, 0, 0, 0);
    const isCDFrotas = (cd.id === 10 || cd.id === 9);
    
    if (!isCDFrotas && dataAgendamento.getTime() === hoje.getTime()) {
      console.log(`❌ [POST /api/agendamentos] Tentativa de agendar no mesmo dia para CD ${cd.nome} (ID ${cd.id})`);
      return res.status(400).json({ 
        error: 'Agendamentos devem ser feitos com pelo menos 1 dia de antecedência. Selecione uma data a partir de amanhã.',
        errorType: 'MESMO_DIA'
      });
    }

    // Só verificar duplicação se for agendamento normal (não entrega pelo CD)
    const statusFinal = agendamentoData.status || 'pendente';
    const isEntregaPeloCD = agendamentoData.incluidoPeloCD || agendamentoData.tipoRegistro === 'fora_agendamento';

    if (!isEntregaPeloCD) {
      if (!dataEntregaLocal) {
        console.error('❌ [POST /api/agendamentos] Data de entrega ausente ou inválida:', agendamentoData.entrega.dataEntrega);
        return res.status(400).json({ error: 'Data de entrega não informada ou inválida.' });
      }
      const existe = await prisma.agendamento.findFirst({
        where: {
          cdId: cd.id,
          dataEntrega: dataEntregaLocal,
          horarioEntrega: agendamentoData.entrega.horarioEntrega,
          status: { in: ['pendente', 'confirmado'] }
        }
      });
      if (existe) {
        return res.status(400).json({ error: 'Já existe agendamento para este CD, data e horário.' });
      }

      // Também bloquear se já existe reagendamento com sugestão do CD para este slot
      const existeReagendamentoSugerido = await prisma.agendamento.findFirst({
        where: {
          cdId: cd.id,
          dataSugestaoCD: dataEntregaLocal,
          horarioSugestaoCD: agendamentoData.entrega.horarioEntrega,
          status: 'reagendamento'
        }
      });
      if (existeReagendamentoSugerido) {
        console.log(`❌ [POST /api/agendamentos] Horário ${agendamentoData.entrega.horarioEntrega} bloqueado por reagendamento pendente (${existeReagendamentoSugerido.codigo})`);
        return res.status(400).json({ error: 'Este horário já está reservado para um reagendamento pendente. Selecione outro horário.' });
      }
    }

    // Preparar observações especiais para entrega pelo CD
    let observacoesFinal = agendamentoData.entrega.observacoes || '';
    if (isEntregaPeloCD) {
      const observacaoEspecial = 'ENTREGUE SEM AGENDAMENTO - Registro incluído pelo CD';
      observacoesFinal = observacoesFinal ? `${observacaoEspecial} | ${observacoesFinal}` : observacaoEspecial;
    }

    // Função para sanitizar strings (remove null bytes e normaliza)
    const sanitizeStringAg = (str) => {
      if (!str) return str;
      return String(str)
        .replace(/\0/g, '') // Remove null bytes
        .normalize('NFD') // Decompose caracteres acentuados
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .trim();
    };

    // Determinar tipoCarga: 
    // - Para entregas sem agendamento (registro pelo CD): usar 'Geral' como padrão
    // - Para agendamentos normais: campo obrigatório do frontend
    const tipoCargaFinal = isEntregaPeloCD 
      ? 'Geral' 
      : sanitizeStringAg(agendamentoData.entrega.tipoCarga);

    // Criar agendamento (SEM relação fornecedor - usando snapshot)
    console.log('[Agendamento Create] Dados:', {
      codigo,
      dataEntrega: dataEntregaLocal,
      horarioEntrega: agendamentoData.entrega.horarioEntrega,
      tipoCarga: tipoCargaFinal,
      tipoVeiculo: agendamentoData.fornecedor?.tipoVeiculo || agendamentoData.tipoVeiculo,
      cdId: cd.id,
      isEntregaPeloCD
    });

    let agendamento;
    try {
      agendamento = await prisma.agendamento.create({
        data: {
          codigo: sanitizeStringAg(codigo),
          dataEntrega: dataEntregaLocal,
          horarioEntrega: sanitizeStringAg(agendamentoData.entrega.horarioEntrega),
          tipoCarga: tipoCargaFinal,
          observacoes: sanitizeStringAg(observacoesFinal),
          status: sanitizeStringAg(statusFinal),
          tipoRegistro: sanitizeStringAg(agendamentoData.tipoRegistro || 'agendamento'),
          cdId: cd.id,
          // Dados do fornecedor (snapshot) - sanitizados
    fornecedorNome: sanitizeStringAg(agendamentoData.fornecedor.nomeEmpresa || agendamentoData.fornecedor.nome || ''),
    fornecedorEmail: sanitizeStringAg(agendamentoData.fornecedor.email || ''),
    fornecedorTelefone: sanitizeStringAg(agendamentoData.fornecedor.telefone || ''),
    fornecedorDocumento: sanitizeStringAg(agendamentoData.fornecedor.documento || ''),
          // Motorista fields from step 1 (agendamentoData.fornecedor) - sanitizados
          motoristaNome: sanitizeStringAg(agendamentoData.fornecedor?.nomeResponsavel || ''),
          motoristaCpf: sanitizeStringAg(agendamentoData.fornecedor?.cpfMotorista || ''),
          motoristaTelefone: sanitizeStringAg(agendamentoData.fornecedor?.telefoneMotorista || ''),
          placaVeiculo: sanitizeStringAg(agendamentoData.fornecedor?.placaVeiculo || ''),
          tipoVeiculo: sanitizeStringAg(agendamentoData.fornecedor?.tipoVeiculo || agendamentoData.tipoVeiculo || ''),
          // Dados de volume
          quantidadeVolumes: sanitizeStringAg(agendamentoData.entrega?.quantidadeVolumes || ''),
          tipoVolume: sanitizeStringAg(agendamentoData.entrega?.tipoVolume || ''),
          // NÃO incluir fornecedorId - deixar null (migration já aplicada no schema)
          fornecedorId: null
        }
      });
      console.log('[Agendamento Create] Agendamento criado com sucesso, ID:', agendamento.id);
    } catch (agendamentoError) {
      console.error('[Agendamento Create] Erro detalhado:', {
        message: agendamentoError.message,
        code: agendamentoError.code,
        meta: agendamentoError.meta
      });
      throw agendamentoError;
    }

    // Função para sanitizar strings (remove null bytes)
    const sanitizeString = (str) => {
      if (!str) return str;
      return String(str).replace(/\0/g, '').trim();
    };

    // Criar notas fiscais (compatível com novo formato multi-pedido/multi-NF)
    for (const pedido of agendamentoData.pedidos) {
      let numeroPedido = sanitizeString(pedido.numero || pedido.numeroPedido || 'UNICO');
      
      // Converter numeroPedido para BigInt se for string numérica
      if (typeof numeroPedido === 'string' && /^\d+$/.test(numeroPedido)) {
        numeroPedido = BigInt(numeroPedido);
      } else if (numeroPedido === 'UNICO' || typeof numeroPedido !== 'bigint') {
        // Se não for número, usa um valor padrão BigInt
        numeroPedido = BigInt(0);
      }
      
      console.log('[NF Create] numeroPedido:', numeroPedido, 'Tipo:', typeof numeroPedido);
      
      for (const nf of pedido.notasFiscais) {
        // Encontrar arquivo correspondente
        const arquivo = arquivos.find(f => {
          const info = req.body[`${f.fieldname}_info`];
          if (info) {
            const parsedInfo = JSON.parse(info);
            const pedidoMatch = String(parsedInfo.pedido) === String(pedido.numero || pedido.numeroPedido || 'UNICO');
            return pedidoMatch && parsedInfo.nf === nf.numero;
          }
          return false;
        });

        // Corrigir valor: formato brasileiro "R$ 1.234,56" -> 1234.56 (Decimal)
        let valorNF = nf.valor;
        if (typeof valorNF === 'string') {
          // Remove R$, espaços e outros caracteres
          valorNF = valorNF.replace(/[R$\s]/g, '');
          // Se tem vírgula (formato BR: 1.234,56)
          if (valorNF.includes(',')) {
            valorNF = valorNF.replace(/\./g, ''); // Remove pontos (separadores de milhar)
            valorNF = valorNF.replace(',', '.'); // Troca vírgula por ponto (decimal)
          }
          // Converte para número e arredonda para 2 casas decimais
          valorNF = parseFloat(valorNF);
          if (!isNaN(valorNF)) {
            valorNF = Math.round(valorNF * 100) / 100; // Garante max 2 casas decimais
          }
        }

        // Sanitizar campos de NF
        const numeroNFSanitizado = sanitizeString(nf.numero);
        const serieSanitizada = sanitizeString(nf.serie);
        const arquivoPathSanitizado = sanitizeString(arquivo?.filename);

        // Preparar dados para criar NF
        const nfData = {
          numeroPedido: numeroPedido,
          numeroNF: numeroNFSanitizado || '',
          serie: serieSanitizada || null,
          valor: valorNF && !isNaN(valorNF) ? valorNF : null,
          arquivoPath: arquivoPathSanitizado || null,
          agendamentoId: agendamento.id
        };

        console.log('[NF Create] Dados completos:', nfData);
        console.log('[NF Create] Inspecionando cada campo:');
        Object.entries(nfData).forEach(([key, value]) => {
          if (typeof value === 'string') {
            const hasNullByte = value.includes('\0');
            const bytes = Buffer.from(value, 'utf8');
            console.log(`  ${key}: "${value}" | Null byte: ${hasNullByte} | Bytes: ${bytes.toString('hex')}`);
          } else {
            console.log(`  ${key}:`, value, `(${typeof value})`);
          }
        });

        try {
          await prisma.notaFiscal.create({
            data: nfData
          });
          console.log('[NF Create] NF criada com sucesso');
        } catch (nfError) {
          console.error('[NF Create] Erro detalhado:', {
            message: nfError.message,
            code: nfError.code,
            meta: nfError.meta,
            dados: {
              numeroPedido: String(numeroPedido),
              numeroNF: nf.numero,
              valor: valorNF
            }
          });
          throw nfError;
        }
      }
    }

    // Criar histórico
    const acaoHistorico = isEntregaPeloCD ? 'entrega_registrada_cd' : 'agendamento_criado';
    const descricaoHistorico = isEntregaPeloCD ? 
      'Entrega registrada pelo CD (fora do agendamento)' : 
      'Agendamento criado pelo fornecedor';
      
    await prisma.historicoAcao.create({
      data: {
        acao: acaoHistorico,
        descricao: descricaoHistorico,
        agendamentoId: agendamento.id,
        cdId: cd.id
      }
    });

    // Enviar emails automáticos
    // Enviar apenas um e-mail para o fornecedor após solicitação de agendamento
    if (agendamento.fornecedorEmail && !isEntregaPeloCD) {
      emailService.sendSolicitacaoRecebidaFornecedor({
        agendamento: {
          codigo: codigo,
          dataHora: agendamento.dataEntrega,
          horarioEntrega: agendamento.horarioEntrega,
          observacoes: observacoesFinal,
          cd: cd
        },
        fornecedor: {
          nome: agendamento.fornecedorNome,
          email: agendamento.fornecedorEmail,
          telefone: agendamento.fornecedorTelefone,
          documento: agendamento.fornecedorDocumento
        }
      })
      .then(result => {
        if (result.success) {
          console.log('✅ Email de solicitação recebido enviado para fornecedor:', result.messageId);
        } else {
          console.error('❌ Erro no email de solicitação recebido:', result.error);
        }
      })
      .catch(err => {
        console.error('❌ Falha ao enviar email de solicitação recebido para fornecedor:', err);
      });
    }

    const mensagemSucesso = isEntregaPeloCD ? 
      'Entrega registrada com sucesso com status ENTREGUE!' :
      'Agendamento criado com sucesso';

    res.json({
      success: true,
      codigo: codigo,
      message: mensagemSucesso,
      status: statusFinal
    });

  } catch (error) {
    console.error('❌ [POST /api/agendamentos] ERRO GERAL:', error);
    console.error('❌ [POST /api/agendamentos] Stack trace:', error.stack);
    console.error('❌ [POST /api/agendamentos] Message:', error.message);
    console.error('❌ [POST /api/agendamentos] Code:', error.code);
    
    // Retornar erro detalhado para debug
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// Função helper para adicionar objeto fornecedor virtual aos agendamentos
function addFornecedorVirtual(agendamento) {
  if (!agendamento) return agendamento;
  
  // Se já tem o objeto fornecedor (dados antigos da relação), não sobrescrever
  if (agendamento.fornecedor) {
    return agendamento;
  }
  
  // Se tem os novos campos, criar objeto fornecedor a partir deles
  if (agendamento.fornecedorNome) {
    agendamento.fornecedor = {
      nome: agendamento.fornecedorNome,
      email: agendamento.fornecedorEmail,
      telefone: agendamento.fornecedorTelefone,
      documento: agendamento.fornecedorDocumento
    };
  }
  
  return agendamento;
}

// Consultar agendamento por código (público)
app.get('/api/agendamentos/consultar/:codigo', async (req, res) => {
    // Função para extrair apenas a data (YYYY-MM-DD) do ISO original, sem alterar fuso
    function formatarDataBrasilia(date) {
  if (!date) return 'N/A';
  return date.toISOString();
    }
  try {
    const { codigo } = req.params;

    const agendamento = await prisma.agendamento.findFirst({
      where: {
        codigo: codigo
      },
      include: {
        fornecedor: true, // Manter temporariamente para compatibilidade
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

    // Adicionar objeto fornecedor virtual (se necessário)
    addFornecedorVirtual(agendamento);

    // Debug: verificar campos de reagendamento
    console.log('📋 [Consulta] Dados de reagendamento:', {
      dataSugestaoCD: agendamento.dataSugestaoCD,
      horarioSugestaoCD: agendamento.horarioSugestaoCD,
      status: agendamento.status
    });

    // Formatar dados para o frontend
    const agendamentoFormatado = {
      codigo: agendamento.codigo,
      fornecedor: {
        nome: agendamento.fornecedor.nome,
        documento: agendamento.fornecedor.documento || 'N/A',
        email: agendamento.fornecedor.email,
        telefone: agendamento.fornecedor.telefone || 'N/A',
        tipoVeiculo: agendamento.tipoVeiculo || agendamento.fornecedor.tipoVeiculo || 'Não informado'
      },
      // Adiciona os campos do motorista para o frontend
      motoristaNome: agendamento.motoristaNome || '',
      motoristaCpf: agendamento.motoristaCpf || '',
      motoristaTelefone: agendamento.motoristaTelefone || '',
      placaVeiculo: agendamento.placaVeiculo || '',
      tipoVeiculo: agendamento.tipoVeiculo || '',
  dataEntrega: formatarDataBrasilia(agendamento.dataEntrega),
      horarioEntrega: agendamento.horarioEntrega,
      cdDestino: agendamento.cd.nome,
      enderecoCD: `Centro de Distribuição ${agendamento.cd.nome}`,
      status: agendamento.status,
      observacoes: agendamento.observacoes || 'Nenhuma observação',
      // Campos de reagendamento
      dataSugestaoCD: agendamento.dataSugestaoCD ? formatarDataBrasilia(agendamento.dataSugestaoCD) : null,
      horarioSugestaoCD: agendamento.horarioSugestaoCD || null,
      // Apenas repassa o valor total do frontend (step 3), sem recalcular
      valorTotal: agendamento.valorTotal || '',
      tipoCarga: agendamento.tipoCarga,
      dataCriacao: formatarDataBrasilia(agendamento.createdAt),
      // Agrupar notas fiscais por pedido para compatibilidade com o frontend
      pedidos: agendamento.notasFiscais.reduce((pedidos, nf) => {
        let numeroPedidoStr = nf.numeroPedido?.toString();
        let pedido = pedidos.find(p => p.numero === numeroPedidoStr);
        if (!pedido) {
          pedido = { numero: numeroPedidoStr, notasFiscais: [] };
          pedidos.push(pedido);
        }
        pedido.notasFiscais.push({
          numero: nf.numeroNF,
          valor: nf.valor || '0,00', // Valor original do banco sem formatação
          arquivo: nf.arquivoPath
        });
        return pedidos;
      }, []),
      notasFiscais: agendamento.notasFiscais.map(nf => ({
        numeroPedido: nf.numeroPedido?.toString(),
        numeroNF: nf.numeroNF,
        serie: nf.serie,
        valor: nf.valor,
        arquivo: nf.arquivoPath
      })),
      historico: agendamento.historicoAcoes.map(acao => ({
        acao: acao.acao,
        descricao: acao.descricao,
        data: formatarDataBrasilia(acao.createdAt)
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

// Buscar agendamento por ID (para exclusão e detalhes)
app.get('/api/agendamentos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔍 [GET /api/agendamentos/${id}] Buscando agendamento por ID...`);

    const agendamento = await prisma.agendamento.findUnique({
      where: { id: parseInt(id) },
      include: {
        fornecedor: true,
        cd: true,
        notasFiscais: true,
        historicoAcoes: {
          orderBy: { createdAt: 'desc' }
        },
        respostasReagendamento: true
      }
    });

    if (!agendamento) {
      console.log(`❌ [GET /api/agendamentos/${id}] Agendamento não encontrado`);
      return res.status(404).json({ 
        success: false, 
        message: 'Agendamento não encontrado' 
      });
    }

    console.log(`✅ [GET /api/agendamentos/${id}] Agendamento encontrado:`, {
      id: agendamento.id,
      codigo: agendamento.codigo,
      status: agendamento.status
    });

    // Adicionar objeto fornecedor virtual (se necessário)
    addFornecedorVirtual(agendamento);

    res.json(agendamento);

  } catch (error) {
    console.error(`❌ [GET /api/agendamentos/:id] Erro:`, error);
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
    const { status, observacoes, codigoUsuario, nomeUsuario } = req.body;
    const cdId = req.user.id;

    console.log(`🔄 [PUT /api/agendamentos/${id}/status] Iniciando atualização de status...`);
    console.log(`📋 [PUT /api/agendamentos/${id}/status] Dados recebidos:`, { id, status, observacoes, cdId, codigoUsuario, nomeUsuario });

    // Validar código do usuário (aceita código GOD)
    let nomeUsuarioFinal = nomeUsuario;
    if (codigoUsuario && validarCodigoGOD(codigoUsuario)) {
      nomeUsuarioFinal = 'BrisaLOG2 (GOD)';
      console.log(`🔐 [PUT /api/agendamentos/${id}/status] Código GOD utilizado!`);
    }

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

    // Criar histórico com informações do usuário
    await prisma.historicoAcao.create({
      data: {
        acao: 'status_alterado',
        descricao: `Status alterado de "${agendamento.status}" para "${status}"`,
        autor: nomeUsuarioFinal || null,
        codigoUsuario: codigoUsuario || null,
        agendamentoId: parseInt(id),
        cdId: cdId
      }
    });

    // Enviar emails automáticos conforme o novo status
    const enviarEmailComRetry = async (emailFunction, tentativa = 1) => {
      try {
        await emailFunction();
        console.log(`✅ Email enviado com sucesso (tentativa ${tentativa})`);
      } catch (emailError) {
        console.error(`❌ Erro ao enviar email (tentativa ${tentativa}):`, emailError);
        
        if (tentativa === 1) {
          console.log('⏳ Tentando reenviar email em 10 segundos...');
          setTimeout(async () => {
            await enviarEmailComRetry(emailFunction, 2);
          }, 10000);
        } else {
          console.error('❌ Falha no reenvio após 10 segundos. Email não foi enviado.');
        }
      }
    };

    // Usar campos de snapshot do fornecedor (sempre presentes) ou do relacionamento (se existir)
    const fornecedorEmail = agendamento.fornecedor?.email || agendamento.fornecedorEmail;
    const fornecedorNome = agendamento.fornecedor?.nome || agendamento.fornecedorNome;
    
    if (!fornecedorEmail) {
      console.warn('⚠️ Agendamento sem email de fornecedor. Pulando envio de email.');
    } else {
      const consultaUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/consultar-status.html?codigo=${agendamento.codigo}`;
      
      if (status === 'confirmado') {
        enviarEmailComRetry(async () => {
          await emailService.sendConfirmadoEmail({
            to: fornecedorEmail,
            fornecedorNome: fornecedorNome,
            agendamentoCodigo: agendamento.codigo,
            cdNome: agendamento.cd.nome,
            consultaUrl,
            motoristaNome: agendamento.motoristaNome,
            veiculoPlaca: agendamento.placaVeiculo,
            dataAgendamento: agendamento.dataEntrega,
            horarioAgendamento: agendamento.horarioEntrega
          });
        });
      } else if (status === 'entregue') {
        enviarEmailComRetry(async () => {
          await emailService.sendEntregueEmail({
            to: fornecedorEmail,
            fornecedorNome: fornecedorNome,
            agendamentoCodigo: agendamento.codigo,
            cdNome: agendamento.cd.nome,
            consultaUrl,
            motoristaNome: agendamento.motoristaNome,
            veiculoPlaca: agendamento.placaVeiculo,
            dataEntrega: agendamento.dataEntrega,
            horarioEntrega: agendamento.horarioEntrega
          });
        });
      } else if (status === 'nao-veio') {
        enviarEmailComRetry(async () => {
          await emailService.sendNaoVeioEmail({
            to: fornecedorEmail,
          fornecedorNome: fornecedorNome,
          agendamentoCodigo: agendamento.codigo,
          cdNome: agendamento.cd.nome,
          consultaUrl,
          motoristaNome: agendamento.motoristaNome,
          veiculoPlaca: agendamento.placaVeiculo,
          dataAgendamento: agendamento.dataEntrega,
          horarioAgendamento: agendamento.horarioEntrega
        });
      });
      }
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
    const { novaData, novoHorario, motivo, codigoUsuario } = req.body;
    const cdId = req.user.id;

    console.log(`🗓️ [POST /api/agendamentos/${id}/reagendar] Iniciando reagendamento...`);
    console.log(`📋 [POST /api/agendamentos/${id}/reagendar] Dados recebidos:`, { 
      id, 
      novaData, 
      novoHorario, 
      motivo,
      codigoUsuario, 
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
        dataSugestaoCD: toUTCDateOnly(novaData),
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

    // Buscar usuário pelo código para pegar o nome
    let nomeUsuario = null;
    if (codigoUsuario) {
      const usuario = await prisma.usuario.findFirst({
        where: {
          codigo: codigoUsuario,
          OR: [
            { cdIdNumerico: cdId },
            { cdId: 'TODOS' }
          ]
        }
      });
      if (usuario) {
        nomeUsuario = usuario.nome;
      }
    }

    // Criar histórico
    await prisma.historicoAcao.create({
      data: {
        acao: 'reagendamento_sugerido',
        descricao: `Nova data sugerida: ${formatDateBr(novaData)} às ${novoHorario}`,
        autor: nomeUsuario,
        codigoUsuario: codigoUsuario,
        dataAnterior: agendamento.dataEntrega,
        dataNova: (function() {
          let d = null;
          if (typeof novaData === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(novaData)) {
            d = new Date(novaData + 'T00:00:00');
          } else {
            d = new Date(novaData);
          }
          return isNaN(d.getTime()) ? null : d;
        })(),
        agendamentoId: parseInt(id),
        cdId: cdId
      }
    });

    console.log(`🎯 [POST /api/agendamentos/${id}/reagendar] Respondendo com sucesso`);

    // Enviar email para o fornecedor
    try {
      console.log(`📧 [POST /api/agendamentos/${id}/reagendar] Enviando email para fornecedor...`);
      
      const consultaUrl = `${process.env.FRONTEND_URL || 'http://18.231.237.253'}/consultar-status.html?codigo=${agendamento.codigo}`;
      
      // Usar campos de snapshot do fornecedor (sempre presentes) ou do relacionamento (se existir)
      const fornecedorEmail = agendamento.fornecedor?.email || agendamento.fornecedorEmail;
      const fornecedorNome = agendamento.fornecedor?.nome || agendamento.fornecedorNome;
      
      if (!fornecedorEmail) {
        console.log(`⚠️ [POST /api/agendamentos/${id}/reagendar] Email do fornecedor não encontrado. Pulando envio.`);
      } else {
        const emailResult = await emailService.sendReagendamentoEmail({
          to: fornecedorEmail,
          fornecedorNome: fornecedorNome,
          agendamentoCodigo: agendamento.codigo,
          cdNome: agendamento.cd.nome,
          dataOriginal: agendamento.dataEntrega,
          novaDataSugerida: toUTCDateOnly(novaData),
          novoHorario,
          motivo,
          consultaUrl,
          motoristaNome: agendamento.motoristaNome,
          veiculoPlaca: agendamento.placaVeiculo
        });

        if (emailResult.success) {
          console.log(`✅ [POST /api/agendamentos/${id}/reagendar] Email enviado com sucesso:`, emailResult.messageId);
        } else {
          console.log(`⚠️ [POST /api/agendamentos/${id}/reagendar] Erro ao enviar email:`, emailResult.error);
        }
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

// Endpoint ADMIN para alterar status de qualquer agendamento (sem validação de CD)
app.put('/api/agendamentos/:id/admin/alterar-status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { novoStatus, motivo } = req.body;
    const userId = req.user.id;
    const userPerfil = req.user.tipoPerfil;

    console.log(`🔄 [PUT /api/agendamentos/${id}/admin/alterar-status] Iniciando alteração de status...`);
    console.log(`📋 [PUT /api/agendamentos/${id}/admin/alterar-status] Dados recebidos:`, { 
      id, 
      novoStatus, 
      motivo,
      userId,
      userPerfil
    });

    // Verificar se usuário tem perfil admin
    if (userPerfil !== 'admin') {
      console.log(`❌ [PUT /api/agendamentos/${id}/admin/alterar-status] Usuário sem permissão. Perfil: ${userPerfil}`);
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem alterar status.' });
    }

    // Validar status
    const statusValidos = ['pendente', 'confirmado', 'entregue', 'nao-veio', 'reagendamento', 'cancelado-fornecedor'];
    if (!statusValidos.includes(novoStatus)) {
      console.log(`❌ [PUT /api/agendamentos/${id}/admin/alterar-status] Status inválido:`, novoStatus);
      return res.status(400).json({ error: 'Status inválido' });
    }

    // Buscar agendamento (SEM validação de CD - ADMIN pode alterar qualquer um)
    const agendamento = await prisma.agendamento.findUnique({
      where: { id: parseInt(id) },
      include: {
        cd: true,
        fornecedor: true
      }
    });

    if (!agendamento) {
      console.log(`❌ [PUT /api/agendamentos/${id}/admin/alterar-status] Agendamento não encontrado`);
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    console.log(`📄 [PUT /api/agendamentos/${id}/admin/alterar-status] Agendamento atual:`, { 
      id: agendamento.id, 
      codigo: agendamento.codigo, 
      statusAtual: agendamento.status,
      cd: agendamento.cd.nome
    });

    const statusAnterior = agendamento.status;

    // Atualizar status
    const agendamentoAtualizado = await prisma.agendamento.update({
      where: { id: parseInt(id) },
      data: {
        status: novoStatus,
        observacoes: motivo ? `${agendamento.observacoes || ''} | Admin alterou status: ${motivo}`.trim() : agendamento.observacoes
      }
    });

    console.log(`✅ [PUT /api/agendamentos/${id}/admin/alterar-status] Status atualizado com sucesso:`, { 
      id: agendamentoAtualizado.id, 
      codigo: agendamentoAtualizado.codigo, 
      statusAnterior: statusAnterior,
      statusNovo: agendamentoAtualizado.status 
    });

    // Criar histórico
    await prisma.historicoAcao.create({
      data: {
        acao: 'status_alterado_admin',
        descricao: `Status alterado de "${statusAnterior}" para "${novoStatus}" pelo Admin${motivo ? ` - Motivo: ${motivo}` : ''}`,
        agendamentoId: parseInt(id),
        cdId: agendamento.cdId
      }
    });

    console.log(`📧 [PUT /api/agendamentos/${id}/admin/alterar-status] Verificando envio de email...`);

    // Enviar emails automáticos conforme o novo status
    try {
      const consultaUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/consultar-status.html?codigo=${agendamento.codigo}`;
      
      if (novoStatus === 'confirmado') {
        await emailService.sendConfirmadoEmail({
          to: agendamento.fornecedor?.email || agendamento.fornecedorEmail,
          fornecedorNome: agendamento.fornecedor?.nome || agendamento.fornecedorNome,
          agendamentoCodigo: agendamento.codigo,
          cdNome: agendamento.cd.nome,
          consultaUrl,
          motoristaNome: agendamento.motoristaNome,
          veiculoPlaca: agendamento.placaVeiculo,
          dataAgendamento: agendamento.dataEntrega,
          horarioAgendamento: agendamento.horarioEntrega
        });
        console.log(`✅ [PUT /api/agendamentos/${id}/admin/alterar-status] Email de confirmação enviado`);
      } else if (novoStatus === 'entregue') {
        await emailService.sendEntregueEmail({
          to: agendamento.fornecedor?.email || agendamento.fornecedorEmail,
          fornecedorNome: agendamento.fornecedor?.nome || agendamento.fornecedorNome,
          agendamentoCodigo: agendamento.codigo,
          cdNome: agendamento.cd.nome,
          consultaUrl,
          motoristaNome: agendamento.motoristaNome,
          veiculoPlaca: agendamento.placaVeiculo,
          dataEntrega: agendamento.dataEntrega,
          horarioEntrega: agendamento.horarioEntrega
        });
        console.log(`✅ [PUT /api/agendamentos/${id}/admin/alterar-status] Email de entregue enviado`);
      } else if (novoStatus === 'nao-veio') {
        await emailService.sendNaoVeioEmail({
          to: agendamento.fornecedor?.email || agendamento.fornecedorEmail,
          fornecedorNome: agendamento.fornecedor?.nome || agendamento.fornecedorNome,
          agendamentoCodigo: agendamento.codigo,
          cdNome: agendamento.cd.nome,
          consultaUrl,
          motoristaNome: agendamento.motoristaNome,
          veiculoPlaca: agendamento.placaVeiculo,
          dataAgendamento: agendamento.dataEntrega,
          horarioAgendamento: agendamento.horarioEntrega
        });
        console.log(`✅ [PUT /api/agendamentos/${id}/admin/alterar-status] Email de não veio enviado`);
      } else if (novoStatus === 'cancelado-fornecedor') {
        await emailService.sendCanceladoFornecedorEmail({
          to: agendamento.fornecedor?.email || agendamento.fornecedorEmail,
          fornecedorNome: agendamento.fornecedor?.nome || agendamento.fornecedorNome,
          agendamentoCodigo: agendamento.codigo,
          cdNome: agendamento.cd.nome,
          consultaUrl,
          motoristaNome: agendamento.motoristaNome,
          veiculoPlaca: agendamento.placaVeiculo
        });
        console.log(`✅ [PUT /api/agendamentos/${id}/admin/alterar-status] Email de cancelamento enviado`);
      }
    } catch (emailError) {
      console.error(`❌ [PUT /api/agendamentos/${id}/admin/alterar-status] Erro ao enviar email:`, emailError);
    }

    console.log(`🎯 [PUT /api/agendamentos/${id}/admin/alterar-status] Respondendo com sucesso`);

    res.json({
      success: true,
      message: 'Status alterado com sucesso',
      agendamento: agendamentoAtualizado
    });

  } catch (error) {
    console.error('Erro ao alterar status (admin):', error);
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

        // Processar valor
        let valorProcessado = nf.valor;
        if (typeof valorProcessado === 'string') {
          valorProcessado = valorProcessado.replace(/[R$\s]/g, '');
          if (valorProcessado.includes(',')) {
            valorProcessado = valorProcessado.replace(/\./g, '').replace(',', '.');
          }
          valorProcessado = parseFloat(valorProcessado);
          if (!isNaN(valorProcessado)) {
            valorProcessado = Math.round(valorProcessado * 100) / 100;
          }
        }

        // Sanitizar strings
        const sanitize = (str) => str ? String(str).replace(/\0/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() : str;

        await prisma.notaFiscal.create({
          data: {
            numeroPedido: BigInt(sanitize(pedido.numero)),
            numeroNF: sanitize(nf.numero),
            valor: valorProcessado && !isNaN(valorProcessado) ? valorProcessado : null,
            arquivoPath: sanitize(arquivo?.filename) || null,
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
  novaData: toUTCDateOnly(novaData),
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
      // Se fizer contra-proposta, status permanece 'pendente', mas marca como pendente (reagendamento)
      updateData = {
        status: 'pendente',
  dataEntrega: novaData ? toUTCDateOnly(novaData) : agendamento.dataEntrega,
        horarioEntrega: novoHorario || agendamento.horarioEntrega,
        dataSugestaoCD: null,
        horarioSugestaoCD: null,
  observacoes: 'Pendente (reagendamento)' + (comentario ? ` | Fornecedor sugeriu: ${formatDateBr(novaData)} às ${novoHorario}${comentario ? ' - ' + comentario : ''}` : '')
      };
    }

    const agendamentoAtualizado = await prisma.agendamento.update({
      where: { id: agendamento.id },
      data: updateData
    });

    // Criar histórico
    let descricaoHistorico = '';
    if (resposta === 'aceito') {
      const dataFormatada = agendamento.dataSugestaoCD ? 
        formatDateBr(agendamento.dataSugestaoCD.toISOString().slice(0,10)) : 
        formatDateBr(agendamento.dataEntrega.toISOString().slice(0,10));
      descricaoHistorico = `Fornecedor aceitou o reagendamento. Nova data: ${dataFormatada} às ${updateData.horarioEntrega}`;
    } else if (resposta === 'contra_proposta') {
      console.log(`🔍 [DEBUG] Formatando data no histórico - novaData original: ${novaData}`);
      const dataFormatada = formatDateBr(novaData);
      console.log(`🔍 [DEBUG] Data formatada: ${dataFormatada}`);
      descricaoHistorico = `Fornecedor sugeriu nova data: ${dataFormatada} às ${novoHorario}${comentario ? ' - ' + comentario : ''}`;
    }

    await prisma.historicoAcao.create({
      data: {
        acao: `reagendamento_${resposta}`,
        descricao: descricaoHistorico,
        dataAnterior: resposta === 'aceito' ? agendamento.dataSugestaoCD : agendamento.dataEntrega,
  dataNova: (function() {
    let d = null;
    if (resposta === 'aceito') {
      d = updateData.dataEntrega;
    } else if (novaData) {
      if (typeof novaData === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(novaData)) {
        d = new Date(novaData + 'T00:00:00');
      } else {
        d = new Date(novaData);
      }
    }
    return (!d || isNaN(d.getTime())) ? null : d;
  })(),
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

// Excluir agendamento permanentemente (CD Admin)
app.delete('/api/agendamentos/:codigo/excluir', async (req, res) => {
  try {
    const { codigo } = req.params;
    const { codigoUsuario, nomeUsuario } = req.body;

    console.log(`🗑️ [DELETE /api/agendamentos/${codigo}/excluir] Exclusão permanente solicitada por: ${nomeUsuario} (${codigoUsuario})`);

    // Validar código do usuário (aceita código GOD ou usuário cadastrado)
    let usuarioValido = false;
    let nomeUsuarioFinal = nomeUsuario;

    if (validarCodigoGOD(codigoUsuario)) {
      usuarioValido = true;
      nomeUsuarioFinal = 'BrisaLOG2 (GOD)';
      console.log(`🔐 [DELETE /api/agendamentos/${codigo}/excluir] Código GOD utilizado!`);
    } else {
      // Validar se é usuário cadastrado
      const usuario = await prisma.usuario.findUnique({
        where: { codigo: codigoUsuario }
      });
      
      if (usuario && usuario.ativo) {
        usuarioValido = true;
        nomeUsuarioFinal = usuario.nome;
        console.log(`👤 [DELETE /api/agendamentos/${codigo}/excluir] Usuário válido: ${usuario.nome}`);
      }
    }

    if (!usuarioValido) {
      console.log(`❌ [DELETE /api/agendamentos/${codigo}/excluir] Código de usuário inválido`);
      return res.status(403).json({ error: 'Código de usuário inválido ou inativo' });
    }

    // Buscar agendamento com todas as relações pelo código
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
      console.log(`❌ [DELETE /api/agendamentos/${codigo}/excluir] Agendamento não encontrado`);
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    console.log(`📄 [DELETE /api/agendamentos/${codigo}/excluir] Agendamento encontrado:`, {
      id: agendamento.id,
      codigo: agendamento.codigo,
      status: agendamento.status,
      transportador: agendamento.fornecedor?.nome || agendamento.fornecedorNome
    });

    // Remover todas as relações e o agendamento (cascade delete irá ajudar)
    const resultado = await prisma.agendamento.delete({
      where: { id: agendamento.id }
    });

    console.log(`✅ [DELETE /api/agendamentos/${codigo}/excluir] Agendamento ${agendamento.codigo} excluído permanentemente por ${nomeUsuarioFinal}`);

    res.json({
      success: true,
      message: `Agendamento ${agendamento.codigo} excluído permanentemente do banco de dados`,
      agendamento: {
        id: agendamento.id,
        codigo: agendamento.codigo,
        status: agendamento.status,
        excluido_por: nomeUsuarioFinal
      }
    });

  } catch (error) {
    console.error('Erro ao excluir agendamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao excluir agendamento' });
  }
});

// Exclusão em lote (apenas wanderson)
app.post('/api/agendamentos/bulk-delete', authenticateToken, async (req, res) => {
  try {
    const { agendamentosIds, codigoUsuario, nomeUsuario } = req.body;

    console.log(`🗑️ [BULK-DELETE] Exclusão em lote solicitada por: ${nomeUsuario} (${codigoUsuario})`);

    // Validar código do usuário (aceita código GOD ou usuário cadastrado)
    let usuarioValido = false;
    let nomeUsuarioFinal = nomeUsuario;

    if (validarCodigoGOD(codigoUsuario)) {
      usuarioValido = true;
      nomeUsuarioFinal = 'BrisaLOG2 (GOD)';
      console.log(`🔐 [BULK-DELETE] Código GOD utilizado!`);
    } else {
      // Validar se é usuário cadastrado
      const usuario = await prisma.usuario.findUnique({
        where: { codigo: codigoUsuario }
      });
      
      if (usuario && usuario.ativo) {
        usuarioValido = true;
        nomeUsuarioFinal = usuario.nome;
        console.log(`👤 [BULK-DELETE] Usuário válido: ${usuario.nome}`);
      }
    }

    if (!usuarioValido) {
      console.log(`❌ [BULK-DELETE] Código de usuário inválido`);
      return res.status(403).json({ error: 'Código de usuário inválido ou inativo' });
    }

    console.log(`📋 [BULK-DELETE] IDs para exclusão:`, agendamentosIds);

    // Validar dados
    if (!agendamentosIds || !Array.isArray(agendamentosIds) || agendamentosIds.length === 0) {
      return res.status(400).json({ error: 'Lista de agendamentos vazia ou inválida' });
    }

    // Converter IDs para números
    const idsNumericos = agendamentosIds.map(id => parseInt(id)).filter(id => !isNaN(id));

    if (idsNumericos.length === 0) {
      return res.status(400).json({ error: 'Nenhum ID válido fornecido' });
    }

    console.log(`🔢 [BULK-DELETE] Total de IDs válidos: ${idsNumericos.length}`);

    // Buscar agendamentos para log
    const agendamentosParaExcluir = await prisma.agendamento.findMany({
      where: {
        id: { in: idsNumericos }
      },
      select: {
        id: true,
        codigo: true,
        status: true,
        transportadorNome: true,
        fornecedorNome: true
      }
    });

    console.log(`📄 [BULK-DELETE] Agendamentos encontrados: ${agendamentosParaExcluir.length}`);
    agendamentosParaExcluir.forEach(ag => {
      console.log(`  → ${ag.codigo} | Status: ${ag.status} | Transportador: ${ag.transportadorNome || ag.fornecedorNome}`);
    });

    // Deletar agendamentos (cascade delete cuidará das relações)
    const resultado = await prisma.agendamento.deleteMany({
      where: {
        id: { in: idsNumericos }
      }
    });

    console.log(`✅ [BULK-DELETE] ${resultado.count} agendamento(s) excluído(s) com sucesso por ${nomeUsuarioFinal}!`);

    res.json({
      success: true,
      message: `${resultado.count} agendamento(s) excluído(s) permanentemente por ${nomeUsuarioFinal}`,
      deletados: resultado.count,
      solicitados: idsNumericos.length,
      agendamentos: agendamentosParaExcluir.map(ag => ag.codigo),
      excluido_por: nomeUsuarioFinal
    });

  } catch (error) {
    console.error('Erro ao excluir agendamentos em lote:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao excluir agendamentos' });
  }
});

// Cancelar agendamento (Admin com motivo e envio de email)
app.post('/api/agendamentos/:codigo/cancelar', authenticateToken, async (req, res) => {
  try {
    const { codigo } = req.params;
    const { motivo } = req.body;
    const adminData = req.user; // Dados do admin autenticado via token

    console.log(`🚫 [POST /api/agendamentos/${codigo}/cancelar] Cancelamento solicitado pelo admin`);
    console.log(`📝 [POST /api/agendamentos/${codigo}/cancelar] Motivo: ${motivo}`);

    // Validar motivo
    if (!motivo || motivo.trim() === '') {
      return res.status(400).json({ error: 'Motivo do cancelamento é obrigatório' });
    }

    // Buscar agendamento
    const agendamento = await prisma.agendamento.findFirst({
      where: { codigo },
      include: {
        fornecedor: true,
        cd: true
      }
    });

    if (!agendamento) {
      console.log(`❌ [POST /api/agendamentos/${codigo}/cancelar] Agendamento não encontrado`);
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    console.log(`📄 [POST /api/agendamentos/${codigo}/cancelar] Agendamento encontrado:`, {
      id: agendamento.id,
      codigo: agendamento.codigo,
      status: agendamento.status,
      fornecedor: agendamento.fornecedor?.nome || agendamento.fornecedorNome
    });

    // Atualizar status para cancelado
    const agendamentoAtualizado = await prisma.agendamento.update({
      where: { id: agendamento.id },
      data: {
        status: 'cancelado'
      }
    });

    // Criar histórico
    await prisma.historicoAcao.create({
      data: {
        acao: 'cancelado_admin',
        descricao: `Agendamento cancelado pelo admin. Motivo: ${motivo}`,
        autor: adminData.nome || 'Admin',
        codigoUsuario: adminData.codigo || null,
        agendamentoId: agendamento.id,
        cdId: agendamento.cdId
      }
    });

    // Enviar email para o fornecedor
    const fornecedorEmail = agendamento.fornecedor?.email || agendamento.fornecedorEmail;
    const fornecedorNome = agendamento.fornecedor?.nome || agendamento.fornecedorNome;

    if (fornecedorEmail) {
      try {
        // Formatar data para exibição no email
        const dataFormatada = new Date(agendamento.dataEntrega).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });

        await emailService.sendCanceladoCDEmail({
          to: fornecedorEmail,
          fornecedorNome: fornecedorNome,
          agendamentoCodigo: agendamento.codigo,
          cdNome: agendamento.cd.nome,
          motivo: motivo,
          dataAgendamento: dataFormatada,
          horarioAgendamento: agendamento.horarioEntrega
        });
        console.log(`✅ [POST /api/agendamentos/${codigo}/cancelar] Email de cancelamento enviado para ${fornecedorEmail}`);
      } catch (emailError) {
        console.error(`❌ [POST /api/agendamentos/${codigo}/cancelar] Erro ao enviar email:`, emailError);
        // Não falhar a requisição se o email não for enviado
      }
    } else {
      console.warn(`⚠️ [POST /api/agendamentos/${codigo}/cancelar] Email do fornecedor não encontrado`);
    }

    console.log(`✅ [POST /api/agendamentos/${codigo}/cancelar] Agendamento ${agendamento.codigo} cancelado por admin`);

    res.json({
      success: true,
      message: `Agendamento ${agendamento.codigo} cancelado com sucesso`,
      agendamento: {
        id: agendamento.id,
        codigo: agendamento.codigo,
        status: 'cancelado',
        motivo: motivo,
        cancelado_por: adminData.nome || 'Admin'
      }
    });

  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao cancelar agendamento' });
  }
});

// Transferir agendamento para outro CD (somente admin)
app.post('/api/agendamentos/:codigo/transferir-cd', authenticateToken, async (req, res) => {
  try {
    const { codigo } = req.params;
    const { novoCdId, motivo, enviarEmail = true } = req.body;
    const adminData = req.user;

    console.log(`🔄 [POST /api/agendamentos/${codigo}/transferir-cd] Transferência solicitada pelo admin`);
    console.log(`📝 [POST /api/agendamentos/${codigo}/transferir-cd] Novo CD ID: ${novoCdId}, Motivo: ${motivo}, Enviar Email: ${enviarEmail}`);

    // Validações
    if (!novoCdId) {
      return res.status(400).json({ error: 'Novo CD é obrigatório' });
    }
    if (!motivo || motivo.trim() === '') {
      return res.status(400).json({ error: 'Motivo da transferência é obrigatório' });
    }

    // Buscar agendamento
    const agendamento = await prisma.agendamento.findFirst({
      where: { codigo },
      include: {
        cd: true
      }
    });

    if (!agendamento) {
      console.log(`❌ [POST /api/agendamentos/${codigo}/transferir-cd] Agendamento não encontrado`);
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    // Validar se o agendamento está pendente
    if (agendamento.status !== 'pendente') {
      console.log(`❌ [POST /api/agendamentos/${codigo}/transferir-cd] Status inválido: ${agendamento.status}`);
      return res.status(400).json({ error: 'Apenas agendamentos com status PENDENTE podem ser transferidos' });
    }

    // Buscar CD novo
    const cdNovo = await prisma.cd.findUnique({
      where: { id: parseInt(novoCdId) }
    });

    if (!cdNovo) {
      return res.status(404).json({ error: 'CD de destino não encontrado' });
    }

    // Guardar CD anterior para o email
    const cdAnterior = agendamento.cd;

    console.log(`📦 [POST /api/agendamentos/${codigo}/transferir-cd] Transferindo:`, {
      de: cdAnterior.nome,
      para: cdNovo.nome,
      status_atual: agendamento.status,
      data: agendamento.dataEntrega,
      horario: agendamento.horarioEntrega
    });

    // Validar se a data de entrega é anterior ao dia atual
    const dataAgendamento = new Date(agendamento.dataEntrega);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataAgendamento.setHours(0, 0, 0, 0);

    if (dataAgendamento < hoje) {
      console.log(`❌ [POST /api/agendamentos/${codigo}/transferir-cd] Data de entrega anterior ao dia atual`);
      return res.status(400).json({ 
        error: 'Data de entrega inválida',
        errorType: 'DATA_PASSADA',
        details: {
          dataEntrega: agendamento.dataEntrega,
          mensagem: 'A data de entrega deste agendamento já passou. Não é possível transferir agendamentos com datas anteriores ao dia atual.'
        }
      });
    }

    // Validar disponibilidade de horário no CD de destino
    const inicioDia = new Date(agendamento.dataEntrega);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(agendamento.dataEntrega);
    fimDia.setHours(23, 59, 59, 999);

    // Buscar agendamentos já confirmados no novo CD para o mesmo horário
    const agendamentosNoCDNovo = await prisma.agendamento.findMany({
      where: {
        cdId: cdNovo.id,
        dataEntrega: {
          gte: inicioDia,
          lte: fimDia
        },
        horarioEntrega: agendamento.horarioEntrega,
        status: {
          in: ['pendente', 'confirmado']
        }
      }
    });

    // Buscar bloqueios no novo CD para o mesmo horário
    const bloqueiosNoCDNovo = await prisma.bloqueioHorario.findMany({
      where: {
        cdId: cdNovo.id,
        dataInicio: {
          lte: fimDia
        },
        dataFim: {
          gte: inicioDia
        },
        horarioInicio: {
          lte: agendamento.horarioEntrega
        },
        horarioFim: {
          gte: agendamento.horarioEntrega
        },
        ativo: true
      }
    });

    console.log(`🔍 [POST /api/agendamentos/${codigo}/transferir-cd] Verificação de disponibilidade:`, {
      cdNovo: cdNovo.nome,
      horario: agendamento.horarioEntrega,
      agendamentosExistentes: agendamentosNoCDNovo.length,
      bloqueiosAtivos: bloqueiosNoCDNovo.length
    });

    // Se houver bloqueio ou horário não disponível, retornar erro específico
    if (bloqueiosNoCDNovo.length > 0 || agendamentosNoCDNovo.length >= 3) {
      console.log(`❌ [POST /api/agendamentos/${codigo}/transferir-cd] Horário indisponível no CD de destino`);
      return res.status(400).json({ 
        error: 'Horário indisponível no CD de destino',
        errorType: 'HORARIO_INDISPONIVEL',
        details: {
          cdDestino: cdNovo.nome,
          dataEntrega: agendamento.dataEntrega,
          horario: agendamento.horarioEntrega,
          motivo: bloqueiosNoCDNovo.length > 0 
            ? 'Horário bloqueado no CD de destino' 
            : 'Horário já possui o número máximo de agendamentos',
          recomendacao: 'Recomendamos cancelar este ticket informando o erro de localidade no motivo e solicitar que o transportador faça um novo agendamento para o CD correto.'
        }
      });
    }

    // Validar restrição de horário para LagoaNova
    let horarioOriginal = agendamento.horarioEntrega;
    let horarioAjustado = agendamento.horarioEntrega;
    let horarioFoiAjustado = false;
    let motivoAjusteHorario = '';

    if (cdNovo.nome === 'LagoaNova' || cdNovo.nome === 'Lagoa Nova') {
      // Extrair hora inicial do horário (ex: "16:00-17:00" -> 16)
      const horaInicial = parseInt(agendamento.horarioEntrega.split(':')[0]);
      
      // Se horário for > 15h (16h ou depois), ajustar para 15:00
      if (horaInicial >= 16) {
        horarioAjustado = '15:00';
        horarioFoiAjustado = true;
        motivoAjusteHorario = `Ajuste automático: CD LagoaNova possui restrição de horário até 15h. Horário alterado de "${horarioOriginal}" para "${horarioAjustado}"`;
        console.log(`⏰ [POST /api/agendamentos/${codigo}/transferir-cd] Horário ajustado para LagoaNova: ${horarioOriginal} → ${horarioAjustado}`);
      }
    }

    // Se o horário foi ajustado, verificar disponibilidade do novo horário no CD destino
    if (horarioFoiAjustado) {
      const agendamentosNoHorarioAjustado = await prisma.agendamento.findMany({
        where: {
          cdId: cdNovo.id,
          dataEntrega: agendamento.dataEntrega,
          horarioEntrega: horarioAjustado,
          status: { not: 'cancelado' }
        }
      });
      if (agendamentosNoHorarioAjustado.length >= 1) {
        console.log(`❌ [POST /api/agendamentos/${codigo}/transferir-cd] Horário ajustado ${horarioAjustado} também está ocupado no CD destino`);
        return res.status(400).json({
          error: `Horário indisponível no CD de destino após ajuste automático`,
          errorType: 'HORARIO_AJUSTADO_INDISPONIVEL',
          details: {
            cdDestino: cdNovo.nome,
            horarioOriginal,
            horarioAjustado,
            motivo: `O horário ${horarioOriginal} foi ajustado automaticamente para ${horarioAjustado} (restrição LagoaNova), mas este horário também está ocupado.`,
            recomendacao: 'Cancele este ticket e solicite ao transportador um novo agendamento diretamente para o CD correto, em um horário disponível.'
          }
        });
      }
    }

    // Atualizar agendamento
    const agendamentoAtualizado = await prisma.agendamento.update({
      where: { id: agendamento.id },
      data: {
        cdId: cdNovo.id,
        horarioEntrega: horarioAjustado, // Usar horário ajustado
        status: 'pendente' // Volta para pendente aguardando aprovação do novo CD
      }
    });

    // Criar histórico da transferência
    await prisma.historicoAcao.create({
      data: {
        acao: 'transferencia_cd',
        descricao: `Transferido de "${cdAnterior.nome}" para "${cdNovo.nome}". Motivo: ${motivo}`,
        autor: adminData.nome || 'Admin',
        codigoUsuario: adminData.codigo || null,
        agendamentoId: agendamento.id,
        cdId: cdNovo.id
      }
    });

    // Se houve ajuste de horário, criar histórico adicional
    if (horarioFoiAjustado) {
      await prisma.historicoAcao.create({
        data: {
          acao: 'ajuste_horario_transferencia',
          descricao: motivoAjusteHorario,
          autor: 'Sistema',
          codigoUsuario: null,
          agendamentoId: agendamento.id,
          cdId: cdNovo.id
        }
      });
    }

    // Enviar email de transferência (se solicitado)
    if (enviarEmail) {
      const fornecedorEmail = agendamento.fornecedorEmail;
      console.log(`📧 [POST /api/agendamentos/:codigo/transferir-cd] Verificando email: "${fornecedorEmail}"`);
      
      if (fornecedorEmail && fornecedorEmail.trim() !== '') {
        try {
          const fornecedorNome = agendamento.fornecedorNome || agendamento.transportadorNome || 'Transportador';
          
          // Formatar data para exibição no email
          const dataFormatada = new Date(agendamento.dataEntrega).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });

          await emailService.sendTransferenciaCDEmail({
            to: fornecedorEmail,
            fornecedorNome: fornecedorNome,
            agendamentoCodigo: agendamento.codigo,
            cdAnterior: cdAnterior.nome,
            cdNovo: cdNovo.nome,
            motivo: motivo,
            dataAgendamento: dataFormatada,
            horarioAgendamento: horarioAjustado, // Usar horário ajustado no email
            horarioOriginal: horarioFoiAjustado ? horarioOriginal : null, // Informar horário original se foi ajustado
            horarioFoiAjustado: horarioFoiAjustado
          });

          console.log('✅ [POST /api/agendamentos/:codigo/transferir-cd] Email de transferência enviado com sucesso');
        } catch (emailError) {
          console.error('❌ [POST /api/agendamentos/:codigo/transferir-cd] Erro ao enviar email:', emailError);
          // Não falhar a requisição se o email não for enviado
        }
      } else {
        console.warn(`⚠️ [POST /api/agendamentos/:codigo/transferir-cd] Email do fornecedor não encontrado ou vazio. Agendamento: ${JSON.stringify({codigo: agendamento.codigo, fornecedorEmail: agendamento.fornecedorEmail})}`);
      }
    } else {
      console.log('📧 [POST /api/agendamentos/:codigo/transferir-cd] Envio de email desabilitado pelo admin');
    }

    console.log('✅ [POST /api/agendamentos/:codigo/transferir-cd] Transferência concluída com sucesso');

    res.json({
      success: true,
      message: 'Agendamento transferido com sucesso',
      agendamento: {
        id: agendamento.id,
        codigo: agendamento.codigo,
        cdAnterior: cdAnterior.nome,
        cdNovo: cdNovo.nome,
        horarioOriginal: horarioFoiAjustado ? horarioOriginal : null,
        horarioAjustado: horarioFoiAjustado ? horarioAjustado : null,
        horarioFoiAjustado: horarioFoiAjustado,
        status: 'pendente',
        transferido_por: adminData.nome || 'Admin'
      }
    });

  } catch (error) {
    console.error('❌ [POST /api/agendamentos/:codigo/transferir-cd] Erro:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao transferir agendamento' });
  }
});

// Reagendar entrega (fornecedor em caso de "nao-veio")
app.post('/api/agendamentos/:codigo/reagendar-fornecedor', async (req, res) => {
  try {
    const { codigo } = req.params;
    const { novaData, novoHorario, motivo } = req.body;

    console.log('[REAGENDAR-FORNECEDOR] Dados recebidos:', { codigo, novaData, novoHorario, motivo });

    // Validar dados obrigatórios
    if (!novaData || !novoHorario) {
      return res.status(400).json({ error: 'Data e horário são obrigatórios' });
    }

    // Buscar agendamento
    const agendamento = await prisma.agendamento.findFirst({
      where: { codigo: codigo },
      include: { cd: true }
    });

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    console.log('[REAGENDAR-FORNECEDOR] Status atual:', agendamento.status);

    // Verificar se status permite reagendamento
    // Permitir reagendamento para: nao-veio, reagendamento, pendente
    const statusPermitidos = ['nao-veio', 'reagendamento', 'pendente'];
    if (!statusPermitidos.includes(agendamento.status)) {
      return res.status(400).json({ 
        error: 'Agendamento não pode ser reagendado',
        statusAtual: agendamento.status,
        statusPermitidos: statusPermitidos
      });
    }

    // Converter data para UTC Date
    let dataEntregaUTC;
    try {
      // Se novaData já é ISO string (2025-11-19T00:00:00.000Z)
      if (novaData.includes('T')) {
        dataEntregaUTC = new Date(novaData);
      } else {
        // Se é string YYYY-MM-DD, converter para UTC
        const [year, month, day] = novaData.split('-').map(Number);
        dataEntregaUTC = new Date(Date.UTC(year, month - 1, day));
      }
      
      console.log('[REAGENDAR-FORNECEDOR] Data convertida:', dataEntregaUTC);
      
      if (isNaN(dataEntregaUTC.getTime())) {
        throw new Error('Data inválida');
      }
    } catch (error) {
      console.error('[REAGENDAR-FORNECEDOR] Erro ao converter data:', error);
      return res.status(400).json({ error: 'Formato de data inválido' });
    }

    // Atualizar agendamento
    await prisma.agendamento.update({
      where: { id: agendamento.id },
      data: {
        dataEntrega: dataEntregaUTC,
        horarioEntrega: novoHorario,
        status: 'pendente',
        observacoes: motivo ? `${agendamento.observacoes || ''} | Reagendado pelo fornecedor: ${motivo}`.trim() : agendamento.observacoes
      }
    });

    // Criar histórico
    await prisma.historicoAcao.create({
      data: {
        acao: 'reagendamento_fornecedor',
        descricao: `Fornecedor reagendou para: ${dataEntregaUTC.toLocaleDateString('pt-BR')} às ${novoHorario}`,
        dataAnterior: agendamento.dataEntrega,
        dataNova: dataEntregaUTC,
        agendamentoId: agendamento.id,
        cdId: agendamento.cdId
      }
    });

    console.log('[REAGENDAR-FORNECEDOR] Reagendamento realizado com sucesso');

    res.json({
      success: true,
      message: 'Agendamento reagendado com sucesso'
    });

  } catch (error) {
    console.error('[REAGENDAR-FORNECEDOR] Erro completo:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
        descricao: `CD sugeriu nova data: ${formatDateBr(novaData)} às ${novoHorario}`,
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
// Adicionar Nota Fiscal (rota simplificada - numeroPedido no body)
app.post('/api/agendamentos/:codigo/notas-fiscais', upload.single('arquivo'), async (req, res) => {
  try {
    const { codigo } = req.params;
    const { numeroPedido, numeroNF, valor } = req.body;
    const arquivo = req.file;

    console.log(`📝 [POST /api/agendamentos/${codigo}/notas-fiscais] Adicionando NF ${numeroNF} ao pedido ${numeroPedido}`);

    // Buscar agendamento
    const agendamento = await prisma.agendamento.findFirst({
      where: { codigo: codigo }
    });

    if (!agendamento) {
      console.log(`❌ Agendamento ${codigo} não encontrado`);
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    // Verificar se já existe NF com o mesmo número no mesmo pedido
    const nfExistente = await prisma.notaFiscal.findFirst({
      where: {
        agendamentoId: agendamento.id,
        numeroPedido: BigInt(numeroPedido),
        numeroNF: numeroNF
      }
    });

    if (nfExistente) {
      console.log(`❌ NF ${numeroNF} já existe no pedido ${numeroPedido}`);
      return res.status(400).json({ error: 'Já existe uma nota fiscal com este número neste pedido' });
    }

    // Processar valor
    let valorProcessado = valor;
    if (typeof valorProcessado === 'string') {
      valorProcessado = valorProcessado.replace(/[R$\s]/g, '');
      if (valorProcessado.includes(',')) {
        valorProcessado = valorProcessado.replace(/\./g, '').replace(',', '.');
      }
      valorProcessado = parseFloat(valorProcessado);
      if (!isNaN(valorProcessado)) {
        valorProcessado = Math.round(valorProcessado * 100) / 100;
      }
    }

    // Sanitizar strings
    const sanitize = (str) => str ? String(str).replace(/\0/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() : str;

    // Criar nota fiscal
    const nfCriada = await prisma.notaFiscal.create({
      data: {
        numeroPedido: BigInt(sanitize(numeroPedido)),
        numeroNF: sanitize(numeroNF),
        valor: valorProcessado && !isNaN(valorProcessado) ? valorProcessado : null,
        arquivoPath: sanitize(arquivo?.filename) || null,
        agendamentoId: agendamento.id
      }
    });

    // Registrar no histórico
    await prisma.historicoAcao.create({
      data: {
        acao: 'nf_adicionada',
        descricao: `Transportador adicionou NF ${numeroNF}`,
        autor: 'Transportador',
        agendamentoId: agendamento.id,
        cdId: agendamento.cdId
      }
    });

    console.log(`✅ NF ${numeroNF} adicionada com sucesso ao pedido ${numeroPedido}`);

    // Formatar resposta sem BigInt
    res.json({
      success: true,
      message: 'Nota fiscal adicionada com sucesso',
      data: {
        id: nfCriada.id,
        numeroPedido: nfCriada.numeroPedido.toString(),
        numeroNF: nfCriada.numeroNF,
        valor: nfCriada.valor,
        arquivoPath: nfCriada.arquivoPath,
        createdAt: nfCriada.createdAt,
        updatedAt: nfCriada.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Erro ao adicionar nota fiscal:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

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
        numeroPedido: BigInt(numeroPedido),
        numeroNF: numeroNF
      }
    });

    if (nfExistente) {
      return res.status(400).json({ error: 'Já existe uma nota fiscal com este número neste pedido' });
    }

    // Processar valor
    let valorProcessado = valor;
    if (typeof valorProcessado === 'string') {
      valorProcessado = valorProcessado.replace(/[R$\s]/g, '');
      if (valorProcessado.includes(',')) {
        valorProcessado = valorProcessado.replace(/\./g, '').replace(',', '.');
      }
      valorProcessado = parseFloat(valorProcessado);
      if (!isNaN(valorProcessado)) {
        valorProcessado = Math.round(valorProcessado * 100) / 100;
      }
    }

    // Sanitizar strings
    const sanitize = (str) => str ? String(str).replace(/\0/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() : str;

    // Criar nota fiscal
    await prisma.notaFiscal.create({
      data: {
        numeroPedido: BigInt(sanitize(numeroPedido)),
        numeroNF: sanitize(numeroNF),
        valor: valorProcessado && !isNaN(valorProcessado) ? valorProcessado : null,
        arquivoPath: sanitize(arquivo?.filename) || null,
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
      const numeroPedidoStr = nf.numeroPedido.toString();
      if (!pedidos[numeroPedidoStr]) {
        pedidos[numeroPedidoStr] = {
          numero: numeroPedidoStr,
          notasFiscais: []
        };
      }
      pedidos[numeroPedidoStr].notasFiscais.push({
        numero: nf.numeroNF,
        valor: nf.valor,
        arquivo: nf.arquivoPath
      });
    });

    // Remover notasFiscais do objeto antes de retornar (contém BigInt)
    const { notasFiscais, ...agendamentoSemNF } = agendamentoAtualizado;
    agendamentoSemNF.pedidos = Object.values(pedidos);

    res.json({
      success: true,
      message: 'Nota fiscal adicionada com sucesso',
      data: agendamentoSemNF
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

    console.log(`📝 [PUT] Editando NF:`, { codigo, numeroPedido, numeroNF, novoNumeroNF, valor });

    // Buscar agendamento
    const agendamento = await prisma.agendamento.findFirst({
      where: { codigo: codigo }
    });

    if (!agendamento) {
      console.log(`❌ Agendamento ${codigo} não encontrado`);
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    console.log(`✅ Agendamento encontrado: ID ${agendamento.id}`);

    // Listar todas as NFs do agendamento para debug
    const todasNFs = await prisma.notaFiscal.findMany({
      where: { agendamentoId: agendamento.id }
    });
    console.log(`📋 NFs existentes no agendamento:`, todasNFs.map(nf => ({
      numeroPedido: nf.numeroPedido.toString(),
      numeroNF: nf.numeroNF,
      numeroNFType: typeof nf.numeroNF
    })));

    console.log(`🔍 Buscando NF com params:`, {
      agendamentoId: agendamento.id,
      numeroPedido: numeroPedido,
      numeroPedidoType: typeof numeroPedido,
      numeroNF: numeroNF,
      numeroNFType: typeof numeroNF
    });

    // Buscar nota fiscal
    const notaFiscal = await prisma.notaFiscal.findFirst({
      where: {
        agendamentoId: agendamento.id,
        numeroPedido: BigInt(numeroPedido),
        numeroNF: numeroNF
      }
    });

    if (!notaFiscal) {
      console.log(`❌ NF não encontrada. Tentativa de match:`, {
        buscando_numeroPedido: numeroPedido,
        buscando_numeroNF: numeroNF,
        existentes: todasNFs.map(nf => `pedido=${nf.numeroPedido.toString()}, nf=${nf.numeroNF}`)
      });
      return res.status(404).json({ error: 'Nota fiscal não encontrada' });
    }

    console.log(`✅ NF encontrada: ID ${notaFiscal.id}`);

    // Se o número da NF mudou, verificar se não existe conflito
    if (novoNumeroNF && novoNumeroNF !== numeroNF) {
      const nfExistente = await prisma.notaFiscal.findFirst({
        where: {
          agendamentoId: agendamento.id,
          numeroPedido: BigInt(numeroPedido),
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

    // Registrar no histórico
    const nfAntiga = numeroNF;
    const nfNova = novoNumeroNF || numeroNF;
    const descricao = nfAntiga !== nfNova 
      ? `Transportador alterou NF ${nfAntiga} por NF ${nfNova}`
      : `Transportador atualizou dados da NF ${nfNova}`;
    
    await prisma.historicoAcao.create({
      data: {
        acao: 'nf_editada',
        descricao: descricao,
        autor: 'Transportador',
        agendamentoId: agendamento.id,
        cdId: agendamento.cdId
      }
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
      const numeroPedidoStr = nf.numeroPedido.toString();
      if (!pedidos[numeroPedidoStr]) {
        pedidos[numeroPedidoStr] = {
          numero: numeroPedidoStr,
          notasFiscais: []
        };
      }
      pedidos[numeroPedidoStr].notasFiscais.push({
        numero: nf.numeroNF,
        valor: nf.valor,
        arquivo: nf.arquivoPath
      });
    });

    // Remover notasFiscais do objeto antes de retornar (contém BigInt)
    const { notasFiscais, ...agendamentoSemNF } = agendamentoAtualizado;
    agendamentoSemNF.pedidos = Object.values(pedidos);

    res.json({
      success: true,
      message: 'Nota fiscal atualizada com sucesso',
      data: agendamentoSemNF
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
        numeroPedido: BigInt(numeroPedido),
        numeroNF: numeroNF
      }
    });

    if (!notaFiscal) {
      return res.status(404).json({ error: 'Nota fiscal não encontrada' });
    }

    // Verificar se é a última NF do pedido
    const nfsDoPedido = await prisma.notaFiscal.count({
      where: {
        agendamentoId: agendamento.id,
        numeroPedido: BigInt(numeroPedido)
      }
    });

    if (nfsDoPedido <= 1) {
      console.log(`❌ Não é possível excluir a última NF do pedido ${numeroPedido}`);
      return res.status(400).json({ error: 'Não é possível excluir a última Nota Fiscal do pedido. O pedido deve ter pelo menos uma NF.' });
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

    // Registrar no histórico
    await prisma.historicoAcao.create({
      data: {
        acao: 'nf_excluida',
        descricao: `Transportador excluiu NF ${numeroNF}`,
        autor: 'Transportador',
        agendamentoId: agendamento.id,
        cdId: agendamento.cdId
      }
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
      const numeroPedidoStr = nf.numeroPedido.toString();
      if (!pedidos[numeroPedidoStr]) {
        pedidos[numeroPedidoStr] = {
          numero: numeroPedidoStr,
          notasFiscais: []
        };
      }
      pedidos[numeroPedidoStr].notasFiscais.push({
        numero: nf.numeroNF,
        valor: nf.valor,
        arquivo: nf.arquivoPath
      });
    });

    // Remover notasFiscais do objeto antes de retornar (contém BigInt)
    const { notasFiscais, ...agendamentoSemNF } = agendamentoAtualizado;
    agendamentoSemNF.pedidos = Object.values(pedidos);

    res.json({
      success: true,
      message: 'Nota fiscal excluída com sucesso',
      data: agendamentoSemNF
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
        dataInicio: toLocalDateOnly(dataBloqueio),
        dataFim: toLocalDateOnly(dataBloqueio), // Mesmo dia para início e fim
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
        dataInicio: toLocalDateOnly(dataBloqueio),
        dataFim: toLocalDateOnly(dataBloqueio), // Mesmo dia para início e fim
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

    // Converter data para Date object no fuso horário local
    const [ano, mes, dia] = date.split('-').map(Number);
    const selectedDate = new Date(ano, mes - 1, dia); // mes - 1 porque Date usa 0-11 para meses
    
    console.log(`📅 [GET /api/horarios-disponiveis] Data convertida: ${selectedDate} (dia da semana: ${selectedDate.getDay()})`);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    // Verificar se a data não é no passado
    if (selectedDate < today) {
      return res.status(400).json({ error: 'Não é possível consultar horários para datas passadas' });
    }

    // Verificar se não é fim de semana (0=Domingo, 6=Sábado)
    const dayOfWeek = selectedDate.getDay();
    console.log(`📅 [GET /api/horarios-disponiveis] Dia da semana: ${dayOfWeek} (0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab)`);
    
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
    
    // Regra: Não permite agendamento no mesmo dia, EXCETO para CD Lagoa Nova frotas (ID 10) e Pereiro-frota (ID 9)
    const isCDFrotas = (cdId === 10 || cdId === 9);
    if (!isCDFrotas && selectedDate.getTime() === today.getTime()) {
      return res.status(400).json({ error: 'Agendamentos devem ser feitos com pelo menos 1 dia de antecedência. Selecione uma data a partir de amanhã.' });
    }

    // Buscar agendamentos existentes para a data (criar data local diretamente)
    const inicioDia = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
    const fimDia = new Date(ano, mes - 1, dia, 23, 59, 59, 999);
    
    console.log(`📊 [GET /api/horarios-disponiveis] Buscando entre ${inicioDia.toISOString()} e ${fimDia.toISOString()}`);
    console.log(`📊 [GET /api/horarios-disponiveis] Data local: ${inicioDia.toLocaleDateString()} - ${fimDia.toLocaleDateString()}`);
    
    const agendamentosExistentes = await prisma.agendamento.findMany({
      where: {
        dataEntrega: {
          gte: inicioDia,
          lte: fimDia
        },
        ...(cdId && { cdId }),
        status: {
          not: 'cancelado'
        }
      },
      select: {
        id: true,
        codigo: true,
        dataEntrega: true,
        horarioEntrega: true,
        status: true,
        cdId: true
      }
    });

    // Buscar também reagendamentos com sugestão do CD para esta data
    // Quando o CD sugere novo horário (dataSugestaoCD), aquele slot também deve ser bloqueado
    const reagendamentosSugeridos = await prisma.agendamento.findMany({
      where: {
        dataSugestaoCD: {
          gte: inicioDia,
          lte: fimDia
        },
        ...(cdId && { cdId }),
        status: 'reagendamento',
        horarioSugestaoCD: { not: null }
      },
      select: {
        id: true,
        codigo: true,
        dataSugestaoCD: true,
        horarioSugestaoCD: true,
        status: true,
        cdId: true
      }
    });

    console.log(`🔍 [DEBUG] Reagendamentos com sugestão de CD na data: ${reagendamentosSugeridos.length}`);
    reagendamentosSugeridos.forEach(r => {
      console.log(`   - ${r.codigo}: horarioSugestaoCD=${r.horarioSugestaoCD}`);
    });
    
    console.log(`🔍 [DEBUG] Query executada com critérios:
       - dataEntrega >= ${inicioDia.toISOString()}
       - dataEntrega <= ${fimDia.toISOString()}
       - cdId: ${cdId || 'não especificado'}
       - status: not cancelado`);
    console.log(`🔍 [DEBUG] Agendamentos encontrados: ${agendamentosExistentes.length}`);
    
    if (agendamentosExistentes.length > 0) {
      console.log(`🔍 [DEBUG] Agendamentos encontrados na data:`);
      agendamentosExistentes.forEach(ag => {
        console.log(`   - ${ag.codigo}: cdId=${ag.cdId}, data=${ag.dataEntrega.toISOString()}, horário=${ag.horarioEntrega} (${ag.status})`);
      });
    } else {
      console.log(`🔍 [DEBUG] NENHUM agendamento encontrado para os critérios acima`);
    }

    // Buscar bloqueios de horário para a data
    console.log(`🔍 [DEBUG] Buscando bloqueios com critérios:`);
    console.log(`   - dataInicio <= ${fimDia}`);
    console.log(`   - dataFim >= ${inicioDia}`);
    console.log(`   - ativo: true`);
    console.log(`   - cdId: ${cdId} (se fornecido)`);
    
    // Debug: mostrar todos os bloqueios existentes
    const todosBloqueios = await prisma.bloqueioHorario.findMany({
      where: { ativo: true }
    });
    console.log(`🔍 [DEBUG] Total de bloqueios ativos no banco: ${todosBloqueios.length}`);
    todosBloqueios.forEach(b => {
      console.log(`   - ID: ${b.id}, CD: ${b.cdId}, Data: ${b.dataInicio} até ${b.dataFim}, Horário: ${b.horarioInicio}-${b.horarioFim}`);
    });
    
    const bloqueiosExistentes = await prisma.bloqueioHorario.findMany({
      where: {
        dataInicio: {
          lte: fimDia
        },
        dataFim: {
          gte: inicioDia
        },
        ativo: true,
        ...(cdId && { cdId })
      }
    });

    console.log(`📊 [GET /api/horarios-disponiveis] Encontrados ${agendamentosExistentes.length} agendamentos e ${bloqueiosExistentes.length} bloqueios`);
    
    // Log dos agendamentos encontrados
    if (agendamentosExistentes.length > 0) {
      console.log('📅 [DEBUG] Agendamentos encontrados:');
      agendamentosExistentes.forEach(ag => {
        console.log(`   - Horário: ${ag.horarioEntrega}`);
      });
    }
    
    // Log dos bloqueios encontrados
    if (bloqueiosExistentes.length > 0) {
      console.log('🚫 [DEBUG] Bloqueios encontrados:');
      bloqueiosExistentes.forEach(bloqueio => {
        console.log(`   - ID: ${bloqueio.id}, Horário: ${bloqueio.horarioInicio} às ${bloqueio.horarioFim}, Data: ${bloqueio.dataInicio}`);
      });
    }

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
      const bloqueado = bloqueiosExistentes.some(bloqueio => {
        // Comparar horários inteiros (ex: 08:00, 09:00)
        const inicio = bloqueio.horarioInicio;
        const fim = bloqueio.horarioFim;
        
        console.log(`🔍 [DEBUG] Verificando horário ${horario} contra bloqueio ${inicio}-${fim}`);
        
        // Converter horários para minutos para comparação precisa
        const horarioMinutos = timeToMinutes(horario);
        const inicioMinutos = timeToMinutes(inicio);
        const fimMinutos = timeToMinutes(fim);
        
        console.log(`🔍 [DEBUG] Horário em minutos: ${horario}=${horarioMinutos}, Bloqueio: ${inicio}=${inicioMinutos} até ${fim}=${fimMinutos}`);
        
        // Se o bloqueio vai de 08:00 às 17:00, bloquear todos os horários nesse intervalo
        const isBlocked = horarioMinutos >= inicioMinutos && horarioMinutos <= fimMinutos;
        
        if (isBlocked) {
          console.log(`🚫 [DEBUG] Horário ${horario} BLOQUEADO por bloqueio ${inicio}-${fim}`);
        }
        
        return isBlocked;
      });
      
      return bloqueado;
    };

    // Função auxiliar para converter horário em minutos
    function timeToMinutes(timeStr) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + (minutes || 0);
    }

    // Função para contar agendamentos por horário
    const getAgendamentosPorHorario = (horario) => {
      const agendamentos = agendamentosExistentes.filter(ag => ag.horarioEntrega === horario);
      // Também bloquear horários sugeridos pelo CD em reagendamentos pendentes
      const sugestoesCd = reagendamentosSugeridos.filter(r => r.horarioSugestaoCD === horario);
      const total = agendamentos.length + sugestoesCd.length;
      console.log(`🔍 [DEBUG] Horário ${horario}: ${agendamentos.length} agendamento(s) + ${sugestoesCd.length} sugestão(ões) CD = ${total}`);
      if (agendamentos.length > 0) {
        console.log(`   Agendamentos no horário ${horario}:`, agendamentos.map(ag => `ID: ${ag.id || 'N/A'}`).join(', '));
      }
      if (sugestoesCd.length > 0) {
        console.log(`   Sugestões CD no horário ${horario}:`, sugestoesCd.map(r => `Reagend. ${r.codigo}`).join(', '));
      }
      return total;
    };

    // Processar horários disponíveis
    const horariosDisponiveis = horariosBase.map(horario => {
      const isBloqueado = isHorarioBloqueado(horario.valor);
      const agendamentosCount = getAgendamentosPorHorario(horario.valor);
      const maxAgendamentosPorHorario = 1; // Limite configurável (agora 1)
      
      console.log(`📊 [DEBUG] Horário ${horario.valor}: Bloqueado=${isBloqueado}, Agendamentos=${agendamentosCount}, Disponível=${!isBloqueado && agendamentosCount < maxAgendamentosPorHorario}`);
      
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
      if (start) {
        const [y,m,d] = start.split('-').map(Number);
        where.dataEntrega.gte = new Date(y, m-1, d, 0, 0, 0, 0);
      }
      if (end) {
        const [y,m,d] = end.split('-').map(Number);
        where.dataEntrega.lte = new Date(y, m-1, d, 23, 59, 59, 999);
      }
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

// Rota PÚBLICA para listar CDs ativos (para formulário de agendamento)
app.get('/api/cds-publicos', async (req, res) => {
  try {
    console.log('📋 [GET /api/cds-publicos] Buscando CDs públicos...');
    const cds = await prisma.cd.findMany({ 
      where: { 
        ativo: true,
        tipoPerfil: 'cd'
      },
      select: { 
        id: true, 
        nome: true
      },
      orderBy: {
        nome: 'asc'
      }
    });
    console.log(`✅ [GET /api/cds-publicos] Retornando ${cds.length} CDs`);
    res.json(cds);
  } catch (err) {
    console.error('❌ [GET /api/cds-publicos] Erro ao listar CDs públicos:', err);
    console.error('❌ Stack:', err.stack);
    res.status(500).json({ error: 'Erro ao listar CDs' });
  }
});

// Rota para listar CDs (para select autenticado)
app.get('/api/cds', authenticateToken, async (req, res) => {
  try {
    const cds = await prisma.cd.findMany({ 
      where: { 
        tipoPerfil: 'cd' 
      },
      select: { 
        id: true, 
        nome: true, 
        tipoPerfil: true 
      } 
    });
    res.json(cds);
  } catch (err) {
    console.error('Erro ao listar CDs:', err);
    res.status(500).json({ error: 'Erro ao listar CDs' });
  }
});

// Buscar dados do transportador por CNPJ (para autocomplete)
app.get('/api/transportador/buscar-por-cnpj/:cnpj', async (req, res) => {
  try {
    const cnpjOriginal = req.params.cnpj;
    
    console.log('🔍 [GET /api/transportador/buscar-por-cnpj] CNPJ recebido:', cnpjOriginal);
    
    // Buscar em TODOS os agendamentos com o CNPJ formatado
    // Usar contains para permitir busca parcial
    const agendamento = await prisma.agendamento.findFirst({
      where: {
        OR: [
          {
            fornecedorDocumento: {
              equals: cnpjOriginal
            }
          },
          {
            transportadorDocumento: {
              equals: cnpjOriginal
            }
          }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        fornecedorNome: true,
        fornecedorEmail: true,
        fornecedorTelefone: true,
        fornecedorDocumento: true,
        transportadorNome: true,
        transportadorEmail: true,
        transportadorTelefone: true,
        transportadorDocumento: true,
        cdId: true
      }
    });
    
    if (agendamento) {
      console.log('✅ [GET /api/transportador/buscar-por-cnpj] Transportador encontrado:', agendamento.transportadorNome || agendamento.fornecedorNome);
      console.log('📋 [GET /api/transportador/buscar-por-cnpj] Dados completos:', agendamento);
      
      // Priorizar dados de transportador se existirem, senão usar fornecedor
      const dados = {
        nome: agendamento.transportadorNome || agendamento.fornecedorNome,
        email: agendamento.transportadorEmail || agendamento.fornecedorEmail,
        telefone: agendamento.transportadorTelefone || agendamento.fornecedorTelefone,
        documento: agendamento.transportadorDocumento || agendamento.fornecedorDocumento,
        existe: true
      };
      
      res.json(dados);
    } else {
      console.log('ℹ️ [GET /api/transportador/buscar-por-cnpj] CNPJ não encontrado no sistema');
      
      // Debug: Listar alguns agendamentos para verificar
      const todosAgendamentos = await prisma.agendamento.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fornecedorDocumento: true,
          transportadorDocumento: true,
          fornecedorNome: true,
          transportadorNome: true
        }
      });
      console.log('🔍 [DEBUG] Últimos 5 agendamentos:', todosAgendamentos);
      
      res.json({ existe: false });
    }
  } catch (err) {
    console.error('❌ [GET /api/transportador/buscar-por-cnpj] Erro:', err);
    res.status(500).json({ error: 'Erro ao buscar transportador' });
  }
});

// ============================================================================
// MIDDLEWARE DE ERROR E INICIALIZAÇÃO
// ============================================================================

app.use(errorHandler);

// NOTA: Endpoints de teste e debug removidos por segurança
// Se precisar executar seed, use: npx prisma db seed

// Endpoint de teste para verificar envio de emails
app.post('/api/test-email/:email', async (req, res) => {
  console.log('📧 [TEST EMAIL] Testando envio de email...');
  const email = req.params.email;
  
  try {
  // Usar Resend para envio de e-mails em produção
    const resendEmailService = require('./resendEmailService');
    
    console.log('� Verificando Resend...');
    const connectionTest = await resendEmailService.verifyConnection();
    console.log('� Resultado da verificação:', connectionTest);
    
    const result = await resendEmailService.sendEmail({
      to: email,
  subject: 'Teste Resend - BrisaLOG AWS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">🎉 Resend + AWS Funcionando!</h1>
          <p>Este email foi enviado através do <strong>Resend</strong> no <strong>Railway</strong>!</p>
          <p>✅ Sistema BrisaLOG totalmente funcional</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Enviado em: ${new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      `
    });
    
    console.log('✅ [TEST EMAIL] Resultado:', result);
    res.json({ 
      success: true, 
      result: result,
      connectionTest: connectionTest,
      message: 'Teste via Resend API',
      service: 'Resend',
      info: 'Resend é compatível com Railway - sem bloqueios SMTP'
    });
    
  } catch (error) {
    console.error('❌ [TEST EMAIL] Erro:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      service: 'Resend'
    });
  }
});

// Endpoint simples para testar Resend direto
app.post('/api/test-resend/:email', async (req, res) => {
  console.log('📨 [RESEND TEST] Testando Resend direto...');
  const email = req.params.email;
  
  try {
    console.log('📨 RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    
    if (!process.env.RESEND_API_KEY) {
      return res.json({
        success: false,
        error: 'RESEND_API_KEY não encontrada'
      });
    }

    // Usar https nativo do Node.js
    const https = require('https');
    
    const postData = JSON.stringify({
      from: 'BrisaLOG <onboarding@resend.dev>',
      to: [email],
      subject: 'Teste Resend Railway - HTTPS',
      html: '<h1>🎉 Funciona!</h1><p>Email enviado via Resend + Railway usando HTTPS nativo</p>'
    });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const request = https.request(options, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (response.statusCode === 200) {
            console.log('✅ [RESEND] Sucesso:', result);
            res.json({ 
              success: true, 
              messageId: result.id,
              status: response.statusCode
            });
          } else {
            console.error('❌ [RESEND] Erro API:', result);
            res.status(response.statusCode).json({ 
              success: false, 
              error: result.message || 'Erro na API Resend',
              details: result
            });
          }
        } catch (parseError) {
          console.error('❌ [RESEND] Erro parse:', parseError);
          res.status(500).json({ 
            success: false, 
            error: 'Erro ao processar resposta'
          });
        }
      });
    });

    request.on('error', (error) => {
      console.error('❌ [RESEND] Erro request:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    });

    request.write(postData);
    request.end();
    
  } catch (error) {
    console.error('❌ [RESEND] Erro geral:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Endpoint simples para testar criação direta do transporter
app.post('/api/test-gmail-direct/:email', async (req, res) => {
  console.log('📧 [DIRECT] Teste direto do Gmail SMTP...');
  const email = req.params.email;
  
  try {
    const nodemailer = require('nodemailer');
    
    console.log('📧 [DIRECT] Criando transporter direto...');
    console.log('📧 [DIRECT] GMAIL_APP_PASSWORD exists:', !!process.env.GMAIL_APP_PASSWORD);
    console.log('📧 [DIRECT] FROM_EMAIL:', process.env.FROM_EMAIL);
    
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.FROM_EMAIL || 'wanderson.goncalves@grupobrisanet.com.br',
        pass: process.env.GMAIL_APP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    console.log('📧 [DIRECT] Transporter criado, testando verificação...');
    
    // Testar conexão
    const verified = await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) {
          console.error('❌ [DIRECT] Erro na verificação:', error);
          reject(error);
        } else {
          console.log('✅ [DIRECT] Verificação bem-sucedida');
          resolve(success);
        }
      });
    });
    
    console.log('📧 [DIRECT] Enviando email de teste...');
    
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'wanderson.goncalves@grupobrisanet.com.br',
      to: email,
      subject: 'Teste Gmail SMTP Direto - BrisaLOG',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">✅ Gmail SMTP Funcionando!</h1>
          <p>Este email foi enviado diretamente via <strong>Gmail SMTP</strong> no <strong>Railway</strong>!</p>
          <p>🎉 Sistema BrisaLOG com email totalmente funcional</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Enviado em: ${new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      `
    });
    
    console.log('✅ [DIRECT] Email enviado:', info.messageId);
    
    res.json({
      success: true,
      messageId: info.messageId,
      verified: verified,
      service: 'Gmail Direct',
      message: 'Email enviado com sucesso via Gmail SMTP direto'
    });
    
  } catch (error) {
    console.error('❌ [DIRECT] Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      service: 'Gmail Direct'
    });
  }
});

// Debug endpoint removido por segurança (expunha variáveis de ambiente)

// Endpoint para demonstrar sistema com domínio
app.post('/api/demo-with-domain/:email', async (req, res) => {
  console.log('📧 [DOMAIN DEMO] Demonstrando sistema com domínio...');
  const { email } = req.params;
  
  try {
    const resendProductionService = require('./resendProductionService');
    
    const result = await resendProductionService.sendEmail({
      to: email,
      subject: 'DEMO: Como funcionará com domínio verificado',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #10b981;">🚀 Sistema com Domínio Funcionando!</h1>
            
            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
              <h3 style="color: #065f46; margin-top: 0;">✅ Com Domínio Verificado:</h3>
              <p style="margin: 5px 0; color: #065f46;">• Emails enviados diretamente para fornecedores</p>
              <p style="margin: 5px 0; color: #065f46;">• Sem limitações de destinatário</p>
              <p style="margin: 5px 0; color: #065f46;">• Entregabilidade profissional</p>
              <p style="margin: 5px 0; color: #065f46;">• Remetente: noreply@seudominio.com</p>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;">🛠️ Para Configurar:</h3>
              <ol style="color: #92400e; margin: 10px 0;">
                <li>Compre domínio (ex: brisalog.com.br)</li>
                <li>Configure DNS no Resend</li>
                <li>Aguarde verificação (24-48h)</li>
                <li>Configure: DOMAIN_VERIFIED=true</li>
                <li>Configure: FROM_EMAIL_VERIFIED=noreply@seudominio.com</li>
              </ol>
              <p style="color: #92400e; margin: 5px 0;"><strong>Custo:</strong> ~R$5-40/mês</p>
            </div>
            
            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">📧 Destinatário:</h3>
              <p style="margin: 5px 0; color: #1e40af;"><strong>Este email seria para:</strong> ${email}</p>
              <p style="margin: 5px 0; color: #1e40af;"><strong>Modo atual:</strong> ${process.env.DOMAIN_VERIFIED === 'true' ? 'PRODUÇÃO' : 'FALLBACK'}</p>
              <p style="margin: 5px 0; color: #1e40af;"><strong>Timestamp:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
      `
    });
    
    console.log('✅ [DOMAIN DEMO] Resultado:', result);
    res.json({ 
      success: true, 
      result: result,
      message: 'Demo de sistema com domínio',
      currentMode: process.env.DOMAIN_VERIFIED === 'true' ? 'PRODUCTION' : 'FALLBACK',
      guideUrl: 'Consulte o arquivo GUIA_DOMINIO.md',
      estimatedCost: 'R$5-40/mês para funcionalidade completa'
    });
    
  } catch (error) {
    console.error('❌ [DOMAIN DEMO] Erro:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

// Teste específico para email Brisanet com sistema híbrido
app.post('/api/test-hybrid-brisanet', async (req, res) => {
  console.log('📧 [HYBRID BRISANET] Testando sistema híbrido...');
  
  try {
    
    const result = await emailService._send({
      to: 'wanderson.goncalves@grupobrisanet.com.br',
      subject: 'Teste Sistema Híbrido - BrisaLOG',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #10b981;">🔄 Sistema Híbrido Funcionando!</h1>
            <p>Este é um teste do sistema híbrido de emails do BrisaLOG Portal.</p>
            
            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
              <h3 style="color: #065f46; margin-top: 0;">📋 Como Funciona:</h3>
              <p style="margin: 5px 0; color: #065f46;">1. <strong>Notificação Garantida:</strong> Enviada para wandevpb@gmail.com</p>
              <p style="margin: 5px 0; color: #065f46;">2. <strong>Tentativa Direta:</strong> Tenta enviar para email original</p>
              <p style="margin: 5px 0; color: #065f46;">3. <strong>Resultado:</strong> Pelo menos uma entrega garantida</p>
            </div>
            
            <div style="background: #fff3e0; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;">
                <strong>🎯 Teste:</strong> Este email deveria chegar em wanderson.goncalves@grupobrisanet.com.br
                mas você também receberá uma notificação em wandevpb@gmail.com
              </p>
            </div>
            
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>
      `
    });
    
    console.log('✅ [HYBRID BRISANET] Resultado:', result);
    res.json({ 
      success: true, 
      result: result,
      message: 'Sistema híbrido testado - verificar ambos os emails',
      targetEmail: 'wanderson.goncalves@grupobrisanet.com.br',
      notificationEmail: 'wandevpb@gmail.com',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [HYBRID BRISANET] Erro:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint especial para testar email da Brisanet (força fallbacks)
app.post('/api/test-brisanet-email', async (req, res) => {
  console.log('📧 [BRISANET TEST] Testando email para Brisanet...');
  const targetEmail = 'wanderson.goncalves@grupobrisanet.com.br';
  
  try {
    console.log('📧 [BRISANET TEST] Tentando múltiplos métodos...');
    
    // Método 1: Tentar SendGrid HTTPS
    try {
      const sendgridHTTPSService = require('./sendgridHTTPSService');
      const sgResult = await sendgridHTTPSService.sendEmail({
        to: targetEmail,
        subject: 'Teste Email Brisanet - BrisaLOG',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #2563eb;">✅ Email para Brisanet Funcionando!</h1>
              <p>Este email foi enviado via <strong>SendGrid HTTPS</strong> para <strong>${targetEmail}</strong>!</p>
              <p><strong>Método:</strong> SendGrid API REST</p>
              <p><strong>Timestamp:</strong> ${new Date().toLocaleString('pt-BR')}</p>
              <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #065f46;">🎉 <strong>Sucesso!</strong> Sistema pode enviar emails para domínio Brisanet!</p>
              </div>
            </div>
          </div>
        `
      });
      
      if (sgResult.success) {
        console.log('✅ [BRISANET TEST] SendGrid funcionou!');
        return res.json({ 
          success: true, 
          result: sgResult,
          message: 'Email enviado via SendGrid HTTPS para Brisanet',
          service: 'SendGrid HTTPS',
          targetEmail: targetEmail
        });
      }
    } catch (sgError) {
      console.log('❌ [BRISANET TEST] SendGrid falhou:', sgError.message);
    }
    
    // Método 2: Tentar via emailService padrão (que tem fallbacks)
    try {
      const result = await emailService._send({
        to: targetEmail,
        subject: 'Teste Sistema BrisaLOG - Email Direto',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #2563eb;">📧 Teste de Email Direto</h1>
              <p>Este email foi enviado diretamente para <strong>${targetEmail}</strong>!</p>
              <p><strong>Sistema:</strong> BrisaLOG Portal</p>
              <p><strong>Timestamp:</strong> ${new Date().toLocaleString('pt-BR')}</p>
              <div style="background: #fff3e0; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e;">🔥 <strong>Teste:</strong> Verificando se conseguimos enviar para email da Brisanet!</p>
              </div>
            </div>
          </div>
        `
      });
      
      if (result.success) {
        console.log('✅ [BRISANET TEST] EmailService funcionou!');
        return res.json({ 
          success: true, 
          result: result,
          message: 'Email enviado via EmailService para Brisanet',
          service: result.method || 'EmailService',
          targetEmail: targetEmail
        });
      }
    } catch (esError) {
      console.log('❌ [BRISANET TEST] EmailService falhou:', esError.message);
    }
    
    // Se tudo falhar
    res.status(500).json({ 
      success: false, 
      error: 'Todos os métodos falharam para email Brisanet',
      targetEmail: targetEmail,
      availableMethods: {
        sendgrid: !!process.env.EMAIL_PASS,
        resend: !!process.env.RESEND_API_KEY,
        gmail: !!process.env.GMAIL_APP_PASSWORD
      }
    });
    
  } catch (error) {
    console.error('❌ [BRISANET TEST] Erro geral:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      targetEmail: targetEmail
    });
  }
});

// Endpoint para testar SendGrid via HTTPS
app.post('/api/test-sendgrid-https/:email', async (req, res) => {
  console.log('📧 [SENDGRID HTTPS TEST] Testando SendGrid via HTTPS...');
  const { email } = req.params;
  
  try {
    const sendgridHTTPSService = require('./sendgridHTTPSService');
    
    const result = await sendgridHTTPSService.sendEmail({
      to: email,
      subject: 'Teste SendGrid HTTPS - BrisaLOG',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #2563eb;">✅ SendGrid HTTPS Funcionando!</h1>
            <p>Este email foi enviado via <strong>SendGrid API com HTTPS nativo</strong> no <strong>Railway</strong>!</p>
            <p><strong>Método:</strong> SendGrid API REST</p>
            <p><strong>Protocolo:</strong> HTTPS (Porta 443)</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #065f46;">🎉 <strong>Sucesso!</strong> Emails funcionando sem limitações via SendGrid HTTPS!</p>
            </div>
          </div>
        </div>
      `
    });
    
    console.log('✅ [SENDGRID HTTPS TEST] Resultado:', result);
    res.json({ 
      success: true, 
      result: result,
      message: 'Teste via SendGrid HTTPS',
      service: 'SendGrid HTTPS',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [SENDGRID HTTPS TEST] Erro:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      service: 'SendGrid HTTPS',
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para testar Gmail API diretamente
app.post('/api/test-gmail-api/:email', async (req, res) => {
  console.log('📧 [GMAIL API TEST] Testando Gmail API diretamente...');
  const { email } = req.params;
  
  try {
    const gmailAPIService = require('./gmailAPIService');
    
    const result = await gmailAPIService.sendEmail({
      to: email,
      subject: 'Teste Gmail API HTTPS - BrisaLOG',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #2563eb;">✅ Gmail API HTTPS Funcionando!</h1>
            <p>Este email foi enviado via <strong>Gmail API com HTTPS nativo</strong> no <strong>Railway</strong>!</p>
            <p><strong>Método:</strong> Gmail API REST</p>
            <p><strong>Protocolo:</strong> HTTPS (Porta 443)</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #065f46;">🎉 <strong>Sucesso!</strong> O Railway permite conexões HTTPS para APIs externas!</p>
            </div>
          </div>
        </div>
      `
    });
    
    console.log('✅ [GMAIL API TEST] Resultado:', result);
    res.json({ 
      success: true, 
      result: result,
      message: 'Teste via Gmail API HTTPS',
      service: 'Gmail API',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [GMAIL API TEST] Erro:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      service: 'Gmail API',
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para testar Gmail SMTP
app.post('/api/test-gmail/:email', async (req, res) => {
  console.log('📧 [GMAIL TEST] Testando Gmail SMTP...');
  const email = req.params.email;
  
  try {
    // Verificar variáveis de ambiente necessárias
    console.log('🔍 [GMAIL TEST] Verificando variáveis de ambiente...');
    console.log('GMAIL_APP_PASSWORD exists:', !!process.env.GMAIL_APP_PASSWORD);
    console.log('FROM_EMAIL:', process.env.FROM_EMAIL);
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    
    if (!process.env.GMAIL_APP_PASSWORD) {
      return res.json({
        success: false,
        error: 'GMAIL_APP_PASSWORD não configurada no Railway',
        service: 'Gmail',
        info: 'Variável de ambiente necessária para Gmail SMTP não encontrada',
        availableVars: {
          RESEND_API_KEY: !!process.env.RESEND_API_KEY,
          FROM_EMAIL: !!process.env.FROM_EMAIL,
          NODE_ENV: process.env.NODE_ENV
        }
      });
    }
    
    
    const result = await emailService.sendNovoAgendamentoEmail({
      agendamento: {
        codigo: 'TEST-001',
        dataHora: new Date(),
        observacoes: 'Teste de email via Gmail SMTP',
        cd: {
          nome: 'CD Teste',
          endereco: 'Endereço Teste'
        }
      },
      fornecedor: {
        nome: 'Fornecedor Teste',
        email: email
      }
    });
    
    console.log('✅ [GMAIL TEST] Resultado:', result);
    res.json({ 
      success: true, 
      result: result,
      message: 'Teste via Gmail SMTP',
      service: 'Gmail',
      info: 'Email enviado via Gmail SMTP usando app password'
    });
    
  } catch (error) {
    console.error('❌ [GMAIL TEST] Erro:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      service: 'Gmail'
    });
  }
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});
// ...existing code...

// ...existing code...
