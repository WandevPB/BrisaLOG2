const transferenciaTemplate = require('./emails/transferenciaCD');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

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

    const data = await resend.emails.send({
      from: 'BrisaLOG Agendamentos <agendamentos@brisalog-agenda.online>',
      to: [transportadorEmail],
      subject: `🔄 Alteração de Local - Agendamento ${agendamento.codigo}`,
      html: htmlContent
    });

    console.log('✅ [sendTransferenciaCDEmail] Email enviado com sucesso:', data.id);
    return { success: true, messageId: data.id };

  } catch (error) {
    console.error('❌ [sendTransferenciaCDEmail] Erro ao enviar email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = sendTransferenciaCDEmail;
