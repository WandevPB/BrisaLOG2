const express = require('express');
const router = express.Router();
const emailService = require('./emailService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'E-mail é obrigatório'
            });
        }

        // Buscar usuário pelo e-mail
        const usuario = await prisma.cd.findFirst({
            where: { emailRecuperacao: email }
        });

        if (!usuario) {
            // Por segurança, não revelamos se o e-mail existe ou não
            return res.status(200).json({
                success: true,
                message: 'Se o e-mail existir no sistema, você receberá as instruções de recuperação.'
            });
        }

        // Gerar token de reset
        const resetToken = emailService.generateResetToken();
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        // Salvar token no banco
        await prisma.cd.update({
            where: { id: usuario.id },
            data: {
                resetToken: resetToken,
                resetTokenExpiry: resetTokenExpiry
            }
        });

        // Enviar e-mail
        const emailResult = await emailService.sendPasswordResetEmail(
            email,
            resetToken,
            usuario.nome
        );

        if (emailResult.success) {
            res.status(200).json({
                success: true,
                message: 'E-mail de recuperação enviado com sucesso!'
            });
        } else {
            console.error('Erro ao enviar e-mail:', emailResult.error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor. Tente novamente mais tarde.'
            });
        }

    } catch (error) {
        console.error('Erro na recuperação de senha:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, email, newPassword } = req.body;

        if (!token || !email || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token, e-mail e nova senha são obrigatórios'
            });
        }

        // Buscar usuário pelo e-mail e token
        const usuario = await prisma.cd.findFirst({
            where: {
                emailRecuperacao: email,
                resetToken: token
            }
        });

        if (!usuario) {
            return res.status(400).json({
                success: false,
                message: 'Token inválido ou expirado'
            });
        }

        // Verificar se token expirou
        if (new Date() > usuario.resetTokenExpiry) {
            return res.status(400).json({
                success: false,
                message: 'Token expirado. Solicite uma nova recuperação.'
            });
        }

        // Validar nova senha
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'A senha deve ter pelo menos 8 caracteres'
            });
        }

        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Atualizar senha e limpar tokens
        await prisma.cd.update({
            where: { id: usuario.id },
            data: {
                senha: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
                primeiroLogin: false
            }
        });

        res.status(200).json({
            success: true,
            message: 'Senha redefinida com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// POST /api/auth/change-password-first-login
router.post('/change-password-first-login', async (req, res) => {
    try {
        const { username, novaSenha, emailRecuperacao } = req.body;

        if (!username || !novaSenha || !emailRecuperacao) {
            return res.status(400).json({
                success: false,
                message: 'Usuário, nova senha e e-mail são obrigatórios'
            });
        }

        // Buscar usuário
        const usuario = await prisma.cd.findUnique({
            where: { usuario: username }
        });

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        // Validar formato do e-mail
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailRecuperacao)) {
            return res.status(400).json({
                success: false,
                message: 'E-mail inválido'
            });
        }

        // Hash da nova senha
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(novaSenha, saltRounds);

        // Atualizar senha, e-mail e marcar como não sendo mais primeiro login
        await prisma.cd.update({
            where: { id: usuario.id },
            data: { 
                senha: hashedPassword,
                emailRecuperacao: emailRecuperacao,
                primeiroLogin: false
            }
        });

        res.status(200).json({
            success: true,
            message: 'Senha alterada com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// POST /api/auth/update-recovery-email
router.post('/update-recovery-email', async (req, res) => {
    try {
        const { username, email } = req.body;

        if (!username || !email) {
            return res.status(400).json({
                success: false,
                message: 'Usuário e e-mail são obrigatórios'
            });
        }

        // Buscar usuário
        const usuario = await prisma.cd.findUnique({
            where: { usuario: username }
        });

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        // Validar formato do e-mail
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'E-mail inválido'
            });
        }

        // Atualizar e-mail do usuário
        await prisma.cd.update({
            where: { id: usuario.id },
            data: { emailRecuperacao: email }
        });

        res.status(200).json({
            success: true,
            message: 'E-mail de recuperação atualizado com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao atualizar e-mail:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// GET /api/auth/cds - Listar CDs para dropdown
router.get('/cds', async (req, res) => {
    try {
        const cds = await prisma.cd.findMany({
            where: { ativo: true },
            select: {
                id: true,
                nome: true,
                usuario: true
            },
            orderBy: { nome: 'asc' }
        });

        res.status(200).json({
            success: true,
            data: cds
        });

    } catch (error) {
        console.error('Erro ao listar CDs:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// GET /api/auth/test-email/:email
router.get('/test-email/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        const result = await emailService.sendTestEmail(email);
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'E-mail de teste enviado com sucesso!',
                messageId: result.messageId
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Erro ao enviar e-mail de teste',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Erro no teste de e-mail:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

module.exports = router;
