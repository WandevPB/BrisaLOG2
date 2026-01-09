const transferenciaTemplate = require('./emails/transferenciaCD');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function sendTransferenciaCDEmail(agendamento, cdAnterior, cdNovo, motivo) {
  try {
    console.log('📧 [sendTransferenciaCDEmail] Iniciando envio...');
    console.log('📧 [sendTransferenciaCDEmail] Agendamento:', agendamento.codigo);
    console.log('📧 [sendTransferenciaCDEmail] CD Anterior:', cdAnterior);
    console.log('📧 [sendTransferenciaCDEmail] CD Novo:', cdNovo);
    
    const transportadorNome = agendamento.fornecedorNome || agendamento.transportadorNome || 'Transportador';
    const transportadorEmail = agendamento.fornecedorEmail || agendamento.transportadorEmail;
    
    if (!transportadorEmail) {
      console.warn('⚠️ [sendTransferenciaCDEmail] Email do transportador não encontrado');
      return { success: false, error: 'Email do transportador não encontrado' };
    }

    // Configurar transporter do Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.FROM_EMAIL || 'wanderson.goncalves@grupobrisanet.com.br',
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    if (!process.env.GMAIL_APP_PASSWORD) {
      console.error('❌ [sendTransferenciaCDEmail] GMAIL_APP_PASSWORD não configurada');
      return { success: false, error: 'Configuração de email não encontrada' };
    }
    // Formatar data
    const dataEntrega = new Date(agendamento.dataEntrega);
    const dataFormatada = dataEntrega.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const htmlContent = transferenciaTemplate({
      transportadorNome,
      agendamentoCodigo: agendamento.codigo,
      cdAnterior,
      cdNovo,
      motivo,
      dataEntrega: dataFormatada,
      horario: agendamento.horarioEntrega
    });

    const mailOptions = {
      from: `"BrisaLOG Agendamentos" <${process.env.FROM_EMAIL || 'wanderson.goncalves@grupobrisanet.com.br'}>`,
      to: transportadorEmail,
      subject: `🔄 Alteração de Local - Agendamento ${agendamento.codigo}`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ [sendTransferenciaCDEmail] Email enviado com sucesso');
    console.log('📧 [sendTransferenciaCDEmail] Message ID:', info.messageId);

    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ [sendTransferenciaCDEmail] Erro ao enviar email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = sendTransferenciaCDEmail;
