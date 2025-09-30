const emailService = require("./emailService");

async function sendNovoAgendamentoEmail() {
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Novo Agendamento Recebido - BrisaLOG</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; color: #333; }
        .container { background: #fff; border-radius: 15px; max-width: 600px; margin: 0 auto; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.08);}
        .header { text-align: center; background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FF9F66 100%); color: #fff; border-radius: 10px; padding: 20px; margin-bottom: 30px;}
        .header h1 { margin: 0; font-size: 24px;}
        .content { margin: 30px 0;}
        .info-box { background: #f8f9fa; border-left: 4px solid #FF6B35; padding: 15px; margin: 20px 0; border-radius: 5px;}
        .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #FF6B35, #FF8C42); color: #fff; text-decoration: none; border-radius: 10px; font-weight: bold; margin: 20px 0;}
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📝 Novo Agendamento Recebido</h1>
          <p>BrisaLOG Portal</p>
        </div>
        <div class="content">
          <p>Olá <b>Fornecedor Exemplo</b>,</p>
          <p>Seu pedido de agendamento <b>AGD123456</b> foi recebido pelo CD <b>CENTRAL</b> e está em análise.</p>
          <div class="info-box">
            <strong>Data da entrega:</strong> 2025-09-30<br>
            <strong>Horário:</strong> 10:00<br>
            <strong>Tipo de carga:</strong> Materiais de Instalação
          </div>
          <p>Você será notificado sobre qualquer atualização.</p>
          <div style="text-align: center;">
            <a href="https://brisalog.com/consultar" class="button">Consultar Agendamento</a>
          </div>
        </div>
        <div class="footer">
          <p><strong>BrisaLOG Portal</strong> - Sistema de Gestão de Entregas</p>
          <p>Este é um e-mail automático, não responda a esta mensagem.</p>
          <p>Em caso de dúvidas, entre em contato com o administrador do sistema.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999;">© 2025 Brisanet. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await emailService.transporter.sendMail({
    from: { name: "BrisaLOG Portal", address: process.env.EMAIL_USER },
    to: "wandevpb@gmail.com",
    subject: "📝 Novo Agendamento Recebido - BrisaLOG Portal",
    html
  });
  console.log("E-mail de novo agendamento enviado para wandevpb@gmail.com");
}

sendNovoAgendamentoEmail().then(() => process.exit(0));
