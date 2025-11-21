const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Listar todos os usuários
router.get('/', async (req, res) => {
    try {
        const usuarios = await prisma.usuario.findMany({
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
        });

        res.json(usuarios);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
});

// Buscar usuários por CD
router.get('/cd/:cdId', async (req, res) => {
    try {
        const { cdId } = req.params;

        const usuarios = await prisma.usuario.findMany({
            where: {
                cdId: parseInt(cdId),
                ativo: true
            },
            orderBy: {
                nome: 'asc'
            }
        });

        res.json(usuarios);
    } catch (error) {
        console.error('Erro ao buscar usuários do CD:', error);
        res.status(500).json({ error: 'Erro ao buscar usuários do CD' });
    }
});

// Validar código de usuário
router.post('/validar-codigo', async (req, res) => {
    try {
        const { codigo, cdId } = req.body;

        console.log('🔍 [Validar Código] Recebido:', { codigo, cdId });

        if (!codigo) {
            return res.status(400).json({ error: 'Código é obrigatório' });
        }

        console.log('🔍 [Validar Código] Buscando usuário com código:', codigo.toUpperCase());

        const usuario = await prisma.usuario.findUnique({
            where: {
                codigo: codigo.toUpperCase()
            },
            include: {
                cd: {
                    select: {
                        id: true,
                        nome: true
                    }
                }
            }
        });

        console.log('🔍 [Validar Código] Usuário encontrado:', usuario ? 'SIM' : 'NÃO');

        if (!usuario) {
            return res.status(404).json({ error: 'Código de usuário inválido' });
        }

        if (!usuario.ativo) {
            return res.status(403).json({ error: 'Usuário inativo' });
        }

        // Validar se o usuário pertence ao CD correto
        if (cdId && usuario.cdId !== parseInt(cdId)) {
            console.log('🔍 [Validar Código] CD não corresponde:', { usuarioCdId: usuario.cdId, cdIdRequisitado: cdId });
            return res.status(403).json({ error: 'Usuário não autorizado para este CD' });
        }

        console.log('✅ [Validar Código] Validação bem-sucedida');

        res.json({
            valido: true,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                codigo: usuario.codigo,
                cargo: usuario.cargo,
                cd: usuario.cd
            }
        });
    } catch (error) {
        console.error('❌ [Validar Código] Erro:', error);
        console.error('❌ [Validar Código] Stack:', error.stack);
        res.status(500).json({ error: 'Erro ao validar código', details: error.message });
    }
});

// Criar novo usuário
router.post('/', async (req, res) => {
    try {
        const { nome, codigo, email, cargo, cdId } = req.body;

        if (!nome || !codigo) {
            return res.status(400).json({ error: 'Nome e código são obrigatórios' });
        }

        // Verificar se código já existe
        const codigoExistente = await prisma.usuario.findUnique({
            where: { codigo: codigo.toUpperCase() }
        });

        if (codigoExistente) {
            return res.status(400).json({ error: 'Código já cadastrado' });
        }

        const usuario = await prisma.usuario.create({
            data: {
                nome,
                codigo: codigo.toUpperCase(),
                email,
                cargo,
                cdId: cdId ? parseInt(cdId) : null
            },
            include: {
                cd: {
                    select: {
                        id: true,
                        nome: true
                    }
                }
            }
        });

        res.status(201).json(usuario);
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});

// Atualizar usuário
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, cargo, cdId, ativo } = req.body;

        const usuario = await prisma.usuario.update({
            where: {
                id: parseInt(id)
            },
            data: {
                nome,
                email,
                cargo,
                cdId: cdId ? parseInt(cdId) : null,
                ativo
            },
            include: {
                cd: {
                    select: {
                        id: true,
                        nome: true
                    }
                }
            }
        });

        res.json(usuario);
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
});

// Desativar usuário (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const usuario = await prisma.usuario.update({
            where: {
                id: parseInt(id)
            },
            data: {
                ativo: false
            }
        });

        res.json({ message: 'Usuário desativado com sucesso', usuario });
    } catch (error) {
        console.error('Erro ao desativar usuário:', error);
        res.status(500).json({ error: 'Erro ao desativar usuário' });
    }
});

// Gerar código aleatório de 5 dígitos para um CD
router.get('/gerar-codigo/:cdId', async (req, res) => {
    try {
        const { cdId } = req.params;

        const cd = await prisma.cd.findUnique({
            where: { id: parseInt(cdId) }
        });

        if (!cd) {
            return res.status(404).json({ error: 'CD não encontrado' });
        }

        // Gerar código aleatório de 5 dígitos
        let novoCodigo;
        let tentativas = 0;
        const maxTentativas = 100;

        do {
            // Gerar número aleatório de 5 dígitos (10000 a 99999)
            const numeroAleatorio = Math.floor(10000 + Math.random() * 90000);
            novoCodigo = numeroAleatorio.toString();

            // Verificar se já existe
            const codigoExistente = await prisma.usuario.findUnique({
                where: { codigo: novoCodigo }
            });

            if (!codigoExistente) {
                break; // Código único encontrado
            }

            tentativas++;
        } while (tentativas < maxTentativas);

        if (tentativas >= maxTentativas) {
            return res.status(500).json({ error: 'Não foi possível gerar código único' });
        }

        res.json({ codigo: novoCodigo });
    } catch (error) {
        console.error('Erro ao gerar código:', error);
        res.status(500).json({ error: 'Erro ao gerar código' });
    }
});

module.exports = router;
