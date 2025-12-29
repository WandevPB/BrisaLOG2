const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const emailService = require('./emailService');
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
                AND: [
                    { ativo: true },
                    {
                        OR: [
                            { cdId: 'TODOS' }, // Usuários com acesso a todos os CDs
                            { cdIdNumerico: parseInt(cdId) } // Usuários específicos do CD
                        ]
                    }
                ]
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
        // Se o usuário tem acesso a TODOS os CDs, permite em qualquer CD
        if (usuario.cdId !== 'TODOS' && cdId && usuario.cdIdNumerico !== parseInt(cdId)) {
            console.log('🔍 [Validar Código] CD não corresponde:', { usuarioCdId: usuario.cdIdNumerico, cdIdRequisitado: cdId });
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
                cdId: cdId || null,
                cdIdNumerico: (cdId && cdId !== 'TODOS') ? parseInt(cdId) : null
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

        // Enviar e-mail de boas-vindas se houver email cadastrado
        if (email) {
            try {
                console.log('═══════════════════════════════════════════════════');
                console.log(`📧 [Novo Usuário] Iniciando envio de e-mail de boas-vindas`);
                console.log(`📧 [Novo Usuário] Destinatário: ${email}`);
                console.log(`📧 [Novo Usuário] Nome: ${usuario.nome}`);
                console.log(`📧 [Novo Usuário] Código: ${usuario.codigo}`);
                
                const cdNome = usuario.cdId === 'TODOS' 
                    ? 'Todos os CDs' 
                    : (usuario.cd?.nome || 'N/A');
                console.log(`📧 [Novo Usuário] CD: ${cdNome}`);
                
                const emailResult = await emailService.sendBoasVindasUsuario({
                    to: email,
                    nome: usuario.nome,
                    codigo: usuario.codigo,
                    cdNome: cdNome
                });

                console.log(`✅ [Novo Usuário] E-mail enviado com sucesso!`);
                console.log(`✅ [Novo Usuário] Message ID: ${emailResult.messageId || 'N/A'}`);
                console.log('═══════════════════════════════════════════════════');
            } catch (emailError) {
                // Não falhar a criação do usuário se o email falhar
                console.error('═══════════════════════════════════════════════════');
                console.error('⚠️ [Novo Usuário] ERRO ao enviar e-mail de boas-vindas!');
                console.error('⚠️ [Novo Usuário] Mensagem:', emailError.message);
                console.error('⚠️ [Novo Usuário] Stack:', emailError.stack);
                console.error('═══════════════════════════════════════════════════');
            }
        } else {
            console.log(`ℹ️ [Novo Usuário] E-mail não enviado - Email não fornecido`);
        }

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
                cdId: cdId || null,
                cdIdNumerico: (cdId && cdId !== 'TODOS') ? parseInt(cdId) : null,
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

// Excluir usuário permanentemente
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se usuário existe
        const usuario = await prisma.usuario.findUnique({
            where: { id: parseInt(id) },
            include: {
                cd: {
                    select: {
                        nome: true
                    }
                }
            }
        });

        if (!usuario) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Excluir permanentemente
        await prisma.usuario.delete({
            where: {
                id: parseInt(id)
            }
        });

        console.log(`🗑️ [Usuário Excluído] ${usuario.nome} (${usuario.codigo}) - CD: ${usuario.cd?.nome || 'N/A'}`);

        res.json({ 
            message: 'Usuário excluído permanentemente com sucesso', 
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                codigo: usuario.codigo
            }
        });
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        
        // Verificar se é erro de constraint (usuário tem relacionamentos)
        if (error.code === 'P2003') {
            return res.status(400).json({ 
                error: 'Não é possível excluir este usuário pois existem registros vinculados a ele. Desative o usuário em vez de excluí-lo.' 
            });
        }
        
        res.status(500).json({ error: 'Erro ao excluir usuário' });
    }
});

// Gerar código aleatório de 5 dígitos para um CD
router.get('/gerar-codigo/:cdId', async (req, res) => {
    try {
        const { cdId } = req.params;

        // Se cdId for 0, significa "Todos os CDs" - não precisa validar o CD
        if (cdId !== '0') {
            const cd = await prisma.cd.findUnique({
                where: { id: parseInt(cdId) }
            });

            if (!cd) {
                return res.status(404).json({ error: 'CD não encontrado' });
            }
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
