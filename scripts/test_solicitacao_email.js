require('dotenv').config();
const emailService = require('../backend/emailService');

(async () => {
  await emailService.sendSolicitacaoRecebidaFornecedor({
    agendamento: {
      codigo: 'TEST-EMAIL-001',
      dataHora: new Date(),
      observacoes: 'Teste de visualização do novo fluxo de email',
      cd: { nome: 'CD Teste' }
    },
    fornecedor: {
      nome: 'Fornecedor Teste',
  email: 'sdgcza743@gmail.com',
      documento: '00.000.000/0001-00'
    }
  })
  .then(result => {
    if (result.success) {
      console.log('✅ Email de solicitação recebido enviado:', result.messageId);
    } else {
      console.error('❌ Erro no email de solicitação recebido:', result.error);
    }
  })
  .catch(err => {
    console.error('❌ Falha ao enviar email de solicitação recebido:', err);
  });
})();
