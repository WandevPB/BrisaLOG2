const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

// Middleware de autenticação (usar o mesmo do server.js)
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura-aqui';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
        }
        return res.status(403).json({ error: 'Token inválido. Faça login novamente.' });
    }
};

// Gerar novo link público
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { nome, descricao, filtros, validadeHoras } = req.body;
        
        // Buscar dados do usuário logado
        const usuarioLogado = await prisma.cd.findUnique({
            where: { id: req.user.id }
        });

        // VERIFICAÇÃO EXCLUSIVA: Somente wanderson pode criar relatórios públicos
        if (!usuarioLogado || usuarioLogado.usuario !== 'wanderson') {
            console.log(`🚫 [Relatórios Públicos] Tentativa de acesso negada para usuário: ${usuarioLogado?.usuario || 'desconhecido'}`);
            return res.status(403).json({ 
                error: '❌ Acesso negado. Esta funcionalidade é exclusiva para o usuário wanderson.' 
            });
        }

        if (!nome || !filtros) {
            return res.status(400).json({ error: 'Nome e filtros são obrigatórios' });
        }

        // Gerar token único
        const token = crypto.randomBytes(32).toString('hex');

        // Calcular data de expiração
        let expiraEm = null;
        if (validadeHoras && validadeHoras > 0) {
            expiraEm = new Date();
            expiraEm.setHours(expiraEm.getHours() + parseInt(validadeHoras));
        }

        // Criar relatório público
        console.log(`📝 [Relatórios Públicos] Criando relatório: ${nome}, Filtros: ${JSON.stringify(filtros).substring(0, 100)}...`);
        
        const relatorio = await prisma.relatorioPublico.create({
            data: {
                token,
                nome,
                descricao: descricao || null,
                filtros: JSON.stringify(filtros),
                criadoPor: usuarioLogado.usuario, // wanderson
                expiraEm,
                ativo: true
            }
        });

        console.log(`✅ [Relatório Público] Criado por ${usuarioLogado.usuario}: ${nome} - Token: ${token.substring(0, 16)}... - Expira: ${expiraEm || 'Nunca'}`);

        res.status(201).json({
            id: relatorio.id,
            token: relatorio.token,
            nome: relatorio.nome,
            expiraEm: relatorio.expiraEm,
            criadoEm: relatorio.criadoEm
        });

    } catch (error) {
        console.error('Erro ao criar relatório público:', error);
        res.status(500).json({ error: 'Erro ao criar relatório público' });
    }
});

// Listar relatórios públicos criados
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Buscar dados do usuário logado
        const usuarioLogado = await prisma.cd.findUnique({
            where: { id: req.user.id }
        });

        // VERIFICAÇÃO EXCLUSIVA: Somente wanderson
        if (!usuarioLogado || usuarioLogado.usuario !== 'wanderson') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const relatorios = await prisma.relatorioPublico.findMany({
            where: {
                criadoPor: usuarioLogado.usuario
            },
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                token: true,
                nome: true,
                descricao: true,
                expiraEm: true,
                acessos: true,
                ativo: true,
                createdAt: true
            }
        });

        res.json(relatorios);

    } catch (error) {
        console.error('Erro ao listar relatórios públicos:', error);
        res.status(500).json({ error: 'Erro ao listar relatórios' });
    }
});

// Acessar relatório público (sem autenticação)
router.get('/acesso/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const relatorio = await prisma.relatorioPublico.findUnique({
            where: { token }
        });

        if (!relatorio) {
            return res.status(404).json({ error: 'Relatório não encontrado' });
        }

        if (!relatorio.ativo) {
            return res.status(403).json({ error: 'Relatório desativado' });
        }

        // Verificar expiração
        if (relatorio.expiraEm && new Date() > new Date(relatorio.expiraEm)) {
            return res.status(403).json({ error: 'Link expirado' });
        }

        // Incrementar contador de acessos
        await prisma.relatorioPublico.update({
            where: { id: relatorio.id },
            data: { acessos: relatorio.acessos + 1 }
        });

        console.log(`📊 [Relatório Público] Acessado: ${relatorio.nome} - Acessos: ${relatorio.acessos + 1}`);

        res.json({
            nome: relatorio.nome,
            descricao: relatorio.descricao,
            filtros: JSON.parse(relatorio.filtros),
            criadoEm: relatorio.createdAt
        });

    } catch (error) {
        console.error('Erro ao acessar relatório público:', error);
        res.status(500).json({ error: 'Erro ao acessar relatório' });
    }
});

// Carregar dados do relatório público (SEM AUTENTICAÇÃO - endpoint público)
router.get('/dados/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Validar token do relatório
        const relatorio = await prisma.relatorioPublico.findUnique({
            where: { token }
        });

        if (!relatorio) {
            return res.status(404).json({ error: 'Relatório não encontrado' });
        }

        if (!relatorio.ativo) {
            return res.status(403).json({ error: 'Relatório desativado' });
        }

        // Verificar expiração
        if (relatorio.expiraEm && new Date() > new Date(relatorio.expiraEm)) {
            return res.status(403).json({ error: 'Link expirado' });
        }

        // Parse dos filtros
        const filtros = JSON.parse(relatorio.filtros);
        
        // Construir where clause baseado nos filtros
        const whereClause = {};
        
        // Filtro de CDs
        if (filtros.cds && !filtros.cds.includes('todos')) {
            whereClause.cdId = {
                in: filtros.cds.map(id => parseInt(id))
            };
        }
        
        // Filtro de Status
        if (filtros.status && !filtros.status.includes('todos')) {
            whereClause.status = {
                in: filtros.status
            };
        }
        
        // Filtro de Período
        if (filtros.periodo) {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            let dataInicio = new Date(hoje);
            let dataFim = new Date(hoje);
            
            switch (filtros.periodo) {
                case 'hoje':
                    dataFim.setHours(23, 59, 59, 999);
                    break;
                case '7dias':
                    dataInicio.setDate(hoje.getDate() - 7);
                    dataFim.setHours(23, 59, 59, 999);
                    break;
                case '30dias':
                    dataInicio.setDate(hoje.getDate() - 30);
                    dataFim.setHours(23, 59, 59, 999);
                    break;
                case 'personalizado':
                    if (filtros.dataInicio && filtros.dataFim) {
                        dataInicio = new Date(filtros.dataInicio);
                        dataFim = new Date(filtros.dataFim);
                        dataFim.setHours(23, 59, 59, 999);
                    }
                    break;
            }
            
            whereClause.dataEntrega = {
                gte: dataInicio,
                lte: dataFim
            };
        }

        // Carregar agendamentos FILTRADOS e CDs
        const [agendamentos, cds] = await Promise.all([
            prisma.agendamento.findMany({
                where: whereClause,
                include: {
                    notasFiscais: true,
                    fornecedor: {
                        select: {
                            id: true,
                            nome: true
                        }
                    },
                    historicoAcoes: {
                        orderBy: {
                            createdAt: 'desc'
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prisma.cd.findMany({
                where: {
                    tipoPerfil: 'cd'
                },
                select: {
                    id: true,
                    nome: true,
                    usuario: true
                }
            })
        ]);

        console.log(`📦 [Relatório Público - Dados] Carregados ${agendamentos.length} agendamentos FILTRADOS via token ${token.substring(0, 16)}...`);

        // Converter BigInt para Number antes de serializar
        const agendamentosSerializaveis = JSON.parse(JSON.stringify(agendamentos, (key, value) =>
            typeof value === 'bigint' ? Number(value) : value
        ));

        const cdsSerializaveis = JSON.parse(JSON.stringify(cds, (key, value) =>
            typeof value === 'bigint' ? Number(value) : value
        ));

        res.json({
            agendamentos: agendamentosSerializaveis,
            cds: cdsSerializaveis,
            filtros: filtros
        });

    } catch (error) {
        console.error('Erro ao carregar dados do relatório público:', error);
        res.status(500).json({ error: 'Erro ao carregar dados' });
    }
});

// Desativar relatório público
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar dados do usuário logado
        const usuarioLogado = await prisma.cd.findUnique({
            where: { id: req.user.id }
        });

        // VERIFICAÇÃO EXCLUSIVA: Somente wanderson
        if (!usuarioLogado || usuarioLogado.usuario !== 'wanderson') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const relatorio = await prisma.relatorioPublico.update({
            where: { id: parseInt(id) },
            data: { ativo: false }
        });

        console.log(`🗑️ [Relatório Público] Desativado: ${relatorio.nome}`);

        res.json({ message: 'Relatório desativado com sucesso' });

    } catch (error) {
        console.error('Erro ao desativar relatório público:', error);
        res.status(500).json({ error: 'Erro ao desativar relatório' });
    }
});

module.exports = router;
