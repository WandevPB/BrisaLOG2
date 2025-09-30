const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();


const path = require('path');

// Importar templates
const templateConfirmado = require('./emails/confirmado');
const templateEntregue = require('./emails/entregue');
const templateNaoVeio = require('./emails/naoVeio');
const templateReagendamento = require('./emails/reagendamento');
const templateRespostaReagendamento = require('./emails/respostaReagendamento');
const templateCanceladoFornecedor = require('./emails/canceladoFornecedor');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        try {
            // Log para depuração das variáveis de ambiente
            console.log('EMAIL_USER:', process.env.EMAIL_USER);
            console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '[PROVIDED]' : '[MISSING]');
            this.transporter = nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE || 'gmail',
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.EMAIL_PORT) || 587,
                secure: process.env.EMAIL_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            this.transporter.verify((error, success) => {
                if (error) {
                    console.error('❌ Erro na configuração de e-mail:', error.message);
                } else {
                    console.log('✅ Servidor de e-mail configurado com sucesso');
                }
            });
        } catch (error) {
            console.error('❌ Erro ao inicializar serviço de e-mail:', error.message);
        }
    }

    // E-mail de confirmação de agendamento
    async sendConfirmadoEmail({ to, fornecedorNome, agendamentoCodigo, cdNome, consultaUrl }) {
        const html = templateConfirmado({ fornecedorNome, agendamentoCodigo, cdNome, consultaUrl });
        return this._send({
            to,
            subject: '[BrisaLOG] Agendamento Confirmado',
            html
        });
    }

    // E-mail de entrega realizada
    async sendEntregueEmail({ to, fornecedorNome, agendamentoCodigo, cdNome, consultaUrl }) {
        const html = templateEntregue({ fornecedorNome, agendamentoCodigo, cdNome, consultaUrl });
        return this._send({
            to,
            subject: '[BrisaLOG] Entrega Realizada',
            html
        });
    }

    // E-mail de não comparecimento
    async sendNaoVeioEmail({ to, fornecedorNome, agendamentoCodigo, cdNome, consultaUrl }) {
        const html = templateNaoVeio({ fornecedorNome, agendamentoCodigo, cdNome, consultaUrl });
        return this._send({
            to,
            subject: '[BrisaLOG] Entrega Não Realizada',
            html
        });
    }

    // E-mail de reagendamento
    async sendReagendamentoEmail({ to, fornecedorNome, agendamentoCodigo, cdNome, dataOriginal, novaDataSugerida, novoHorario, motivo, consultaUrl }) {
        const html = templateReagendamento({ fornecedorNome, agendamentoCodigo, cdNome, dataOriginal, novaDataSugerida, novoHorario, motivo, consultaUrl });
        return this._send({
            to,
            subject: `[BrisaLOG] Solicitação de Reagendamento - ${agendamentoCodigo}`,
            html
        });
    }

    // E-mail de resposta ao reagendamento
    async sendRespostaReagendamentoEmail({ to, fornecedorNome, agendamentoCodigo, resposta, novaData, novoHorario, comentario, consultaUrl }) {
        const html = templateRespostaReagendamento({ fornecedorNome, agendamentoCodigo, resposta, novaData, novoHorario, comentario, consultaUrl });
        return this._send({
            to,
            subject: '[BrisaLOG] Resposta ao Reagendamento',
            html
        });
    }

    // E-mail de cancelamento pelo fornecedor
    async sendCanceladoFornecedorEmail({ to, fornecedorNome, agendamentoCodigo, motivo, consultaUrl }) {
        const html = templateCanceladoFornecedor({ fornecedorNome, agendamentoCodigo, motivo, consultaUrl });
        return this._send({
            to,
            subject: '[BrisaLOG] Solicitação Cancelada',
            html
        });
    }

    // Utilitário de envio
    async _send({ to, subject, html }) {
        const mailOptions = {
            from: {
                name: 'BrisaLOG Portal',
                address: process.env.EMAIL_USER
            },
            to,
            subject,
            html
        };
        try {
            const result = await this.transporter.sendMail(mailOptions);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = new EmailService();
