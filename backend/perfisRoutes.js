const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const emailService = require('./emailService');
const prisma = new PrismaClient();

// Listar todos os perfis (tabela cds - todos os tipos)
router.get('/', async (req, res) => {
    try {
        const perfis = await prisma.cd.findMany({
            select: {
                id: true,
                nome: true,
                usuario: true,
                tipoPerfil: true,
                emailRecuperacao: true,
                ativo: true,
                primeiroLogin: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(perfis);
    } catch (error) {
        console.error('Erro ao buscar perfis:', error);
        res.status(500).json({ error: 'Erro ao buscar perfis' });
    }
});

// Criar novo perfil
router.post('/', async (req, res) => {
    try {
        const { nome, usuario, tipoPerfil, email, ativo = true } = req.body;

        if (!nome || !usuario || !tipoPerfil) {
            return res.status(400).json({ error: 'Nome, usuário e tipo de perfil são obrigatórios' });
        }

        // Validar se é admin e não tem email
        if (tipoPerfil === 'admin' && !email) {
            return res.status(400).json({ error: 'Email é obrigatório para perfis de Admin' });
        }

        // Verificar se usuário já existe
        const usuarioExistente = await prisma.cd.findUnique({
            where: { usuario }
        });

        if (usuarioExistente) {
            return res.status(400).json({ error: 'Usuário já cadastrado' });
        }

        // Verificar se nome já existe
        const nomeExistente = await prisma.cd.findUnique({
            where: { nome }
        });

        if (nomeExistente) {
            return res.status(400).json({ error: 'Nome já cadastrado' });
        }

        // Hash da senha padrão "Brisanet123"
        const senhaHash = await bcrypt.hash('Brisanet123', 10);

        // Criar perfil
        const perfil = await prisma.cd.create({
            data: {
                nome,
                usuario,
                senha: senhaHash,
                tipoPerfil,
                emailRecuperacao: email || null,
                ativo,
                primeiroLogin: true,
                recebeNotificacoes: tipoPerfil === 'cd' // Apenas CDs recebem notificações de agendamento
            }
        });

        console.log(`✅ [Novo Perfil] ${nome} (${usuario}) - Tipo: ${tipoPerfil}`);

        // Se for admin E tiver email, enviar email de boas-vindas
        if (tipoPerfil === 'admin' && email) {
            try {
                console.log('═══════════════════════════════════════════════════');
                console.log(`📧 [Novo Perfil Admin] Iniciando envio de e-mail de boas-vindas`);
                console.log(`📧 [Novo Perfil Admin] Destinatário: ${email}`);
                console.log(`📧 [Novo Perfil Admin] Nome: ${nome}`);
                console.log(`📧 [Novo Perfil Admin] Usuário: ${usuario}`);
                
                await emailService.sendBoasVindasAdmin({
                    to: email,
                    nome: nome,
                    usuario: usuario
                });

                console.log(`✅ [Novo Perfil Admin] E-mail enviado com sucesso!`);
                console.log('═══════════════════════════════════════════════════');
            } catch (emailError) {
                console.error('═══════════════════════════════════════════════════');
                console.error('⚠️ [Novo Perfil Admin] ERRO ao enviar e-mail de boas-vindas!');
                console.error('⚠️ [Novo Perfil Admin] Mensagem:', emailError.message);
                console.error('⚠️ [Novo Perfil Admin] Stack:', emailError.stack);
                console.error('═══════════════════════════════════════════════════');
                // Não falhar a criação do perfil se o email falhar
            }
        }

        res.status(201).json(perfil);
    } catch (error) {
        console.error('Erro ao criar perfil:', error);
        res.status(500).json({ error: 'Erro ao criar perfil' });
    }
});

// Atualizar perfil
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, usuario, tipoPerfil, email, ativo } = req.body;

        // Validar se é admin e não tem email
        if (tipoPerfil === 'admin' && !email) {
            return res.status(400).json({ error: 'Email é obrigatório para perfis de Admin' });
        }

        // Verificar se usuário já existe em outro perfil
        if (usuario) {
            const usuarioExistente = await prisma.cd.findFirst({
                where: {
                    usuario,
                    id: { not: parseInt(id) }
                }
            });

            if (usuarioExistente) {
                return res.status(400).json({ error: 'Usuário já cadastrado em outro perfil' });
            }
        }

        // Verificar se nome já existe em outro perfil
        if (nome) {
            const nomeExistente = await prisma.cd.findFirst({
                where: {
                    nome,
                    id: { not: parseInt(id) }
                }
            });

            if (nomeExistente) {
                return res.status(400).json({ error: 'Nome já cadastrado em outro perfil' });
            }
        }

        const perfil = await prisma.cd.update({
            where: {
                id: parseInt(id)
            },
            data: {
                nome,
                usuario,
                tipoPerfil,
                emailRecuperacao: email || null,
                ativo,
                recebeNotificacoes: tipoPerfil === 'cd'
            }
        });

        console.log(`✏️ [Perfil Atualizado] ${perfil.nome} (${perfil.usuario})`);

        res.json(perfil);
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
});

// Excluir perfil
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se perfil existe
        const perfil = await prisma.cd.findUnique({
            where: { id: parseInt(id) }
        });

        if (!perfil) {
            return res.status(404).json({ error: 'Perfil não encontrado' });
        }

        // Não permitir excluir o próprio perfil wanderson
        if (perfil.usuario === 'wanderson') {
            return res.status(403).json({ error: 'Não é possível excluir o perfil do administrador principal' });
        }

        // Verificar se tem agendamentos vinculados
        const agendamentosCount = await prisma.agendamento.count({
            where: { cdId: parseInt(id) }
        });

        if (agendamentosCount > 0) {
            return res.status(400).json({ 
                error: `Não é possível excluir este perfil pois existem ${agendamentosCount} agendamento(s) vinculado(s). Desative o perfil em vez de excluí-lo.` 
            });
        }

        await prisma.cd.delete({
            where: { id: parseInt(id) }
        });

        console.log(`🗑️ [Perfil Excluído] ${perfil.nome} (${perfil.usuario})`);

        res.json({ 
            message: 'Perfil excluído com sucesso',
            perfil: {
                id: perfil.id,
                nome: perfil.nome,
                usuario: perfil.usuario
            }
        });
    } catch (error) {
        console.error('Erro ao excluir perfil:', error);
        
        // Verificar se é erro de constraint
        if (error.code === 'P2003') {
            return res.status(400).json({ 
                error: 'Não é possível excluir este perfil pois existem registros vinculados a ele. Desative o perfil em vez de excluí-lo.' 
            });
        }
        
        res.status(500).json({ error: 'Erro ao excluir perfil' });
    }
});

// Resetar senha para padrão "Brisanet123"
router.post('/:id/resetar-senha', async (req, res) => {
    try {
        const { id } = req.params;

        const senhaHash = await bcrypt.hash('Brisanet123', 10);

        const perfil = await prisma.cd.update({
            where: { id: parseInt(id) },
            data: {
                senha: senhaHash,
                primeiroLogin: true
            }
        });

        console.log(`🔑 [Senha Resetada] ${perfil.nome} (${perfil.usuario}) - Nova senha: Brisanet123`);

        res.json({ 
            message: 'Senha resetada para "Brisanet123" com sucesso',
            primeiroLogin: true
        });
    } catch (error) {
        console.error('Erro ao resetar senha:', error);
        res.status(500).json({ error: 'Erro ao resetar senha' });
    }
});

module.exports = router;
