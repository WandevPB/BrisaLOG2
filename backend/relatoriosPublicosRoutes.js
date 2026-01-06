const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Aqui você validaria o JWT token
    // Por simplicidade, vamos apenas continuar
    next();
};

// Gerar novo link público
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { nome, descricao, filtros, validadeHoras } = req.body;
        const usuario = req.usuario || 'wanderson'; // Deve vir do token JWT

        // Verificar se usuário é wanderson
        if (usuario !== 'wanderson') {
            return res.status(403).json({ error: 'Acesso negado. Funcionalidade exclusiva para wanderson.' });
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
        const relatorio = await prisma.relatorioPublico.create({
            data: {
                token,
                nome,
                descricao: descricao || null,
                filtros: JSON.stringify(filtros),
                criadoPor: usuario,
                expiraEm,
                ativo: true
            }
        });

        console.log(`✅ [Relatório Público] Criado: ${nome} - Token: ${token.substring(0, 16)}... - Expira: ${expiraEm || 'Nunca'}`);

        res.status(201).json({
            id: relatorio.id,
            token: relatorio.token,
            nome: relatorio.nome,
            expiraEm: relatorio.expiraEm,
            createdAt: relatorio.createdAt
        });

    } catch (error) {
        console.error('Erro ao criar relatório público:', error);
        res.status(500).json({ error: 'Erro ao criar relatório público' });
    }
});

// Listar relatórios públicos criados
router.get('/', authenticateToken, async (req, res) => {
    try {
        const usuario = req.usuario || 'wanderson';

        if (usuario !== 'wanderson') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const relatorios = await prisma.relatorioPublico.findMany({
            where: {
                criadoPor: usuario
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

// Desativar relatório público
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = req.usuario || 'wanderson';

        if (usuario !== 'wanderson') {
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
