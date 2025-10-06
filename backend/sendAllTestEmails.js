const emailService = require("./emailService");

async function sendAllTestEmails() {
  // 1. Novo Agendamento
  await emailService.transporter.sendMail({
    from: { name: "BrisaLOG Portal", address: process.env.EMAIL_USER },
    to: "wandevpb@gmail.com",
    subject: "📝 Novo Agendamento Recebido - BrisaLOG Portal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FF9F66 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
          <h1>📝 Novo Agendamento Recebido</h1>
        </div>
        <div style="background: #fff; border-radius: 10px; padding: 30px; margin-top: 20px;">
          <p>Olá <b>Fornecedor Exemplo</b>,</p>
          <p>Seu pedido de agendamento <b>AGD123456</b> foi recebido pelo CD <b>Lagoa Nova</b> e está em análise.</p>
          <p>Você será notificado sobre qualquer atualização.</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="https://brisalog.com/consultar" style="background: #FF6B35; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Consultar Agendamento</a>
          </div>
        </div>
        <div style="text-align: center; color: #888; font-size: 12px; margin-top: 30px;">Este é um e-mail automático do BrisaLOG Portal.</div>
      </div>
    `
  });

  // 2. Status Atualizado (exemplo: Confirmado)
  await emailService.transporter.sendMail({
    from: { name: "BrisaLOG Portal", address: process.env.EMAIL_USER },
    to: "wandevpb@gmail.com",
    subject: "🔔 Status Atualizado: Confirmado - BrisaLOG Portal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 20px; border-radius: 10px; text-align: center;">
          <h1>🔔 Status Atualizado: Confirmado</h1>
        </div>
        <div style="background: #fff; border-radius: 10px; padding: 30px; margin-top: 20px;">
          <p>Olá <b>Fornecedor Exemplo</b>,</p>
          <p>O status do seu agendamento <b>AGD123456</b> foi alterado para <b>Confirmado</b>.</p>
          <p>Data: <b>26/09/2025</b> | Horário: <b>10:00</b></p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="https://brisalog.com/consultar" style="background: #10B981; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Ver Detalhes</a>
          </div>
        </div>
        <div style="text-align: center; color: #888; font-size: 12px; margin-top: 30px;">Este é um e-mail automático do BrisaLOG Portal.</div>
      </div>
    `
  });

  // 3. Status Atualizado (exemplo: Entregue)
  await emailService.transporter.sendMail({
    from: { name: "BrisaLOG Portal", address: process.env.EMAIL_USER },
    to: "wandevpb@gmail.com",
    subject: "🚚 Entrega Realizada - BrisaLOG Portal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; padding: 20px; border-radius: 10px; text-align: center;">
          <h1>🚚 Entrega Realizada</h1>
        </div>
        <div style="background: #fff; border-radius: 10px; padding: 30px; margin-top: 20px;">
          <p>Olá <b>Fornecedor Exemplo</b>,</p>
          <p>O agendamento <b>AGD123456</b> foi marcado como <b>Entregue</b> pelo CD <b>Lagoa Nova</b>.</p>
          <p>Data da entrega: <b>26/09/2025</b></p>
        </div>
        <div style="text-align: center; color: #888; font-size: 12px; margin-top: 30px;">Este é um e-mail automático do BrisaLOG Portal.</div>
      </div>
    `
  });

  // 4. Status Atualizado (exemplo: Não Veio)
  await emailService.transporter.sendMail({
    from: { name: "BrisaLOG Portal", address: process.env.EMAIL_USER },
    to: "wandevpb@gmail.com",
    subject: "❌ Agendamento Não Realizado - BrisaLOG Portal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #EF4444, #DC2626); color: white; padding: 20px; border-radius: 10px; text-align: center;">
          <h1>❌ Agendamento Não Realizado</h1>
        </div>
        <div style="background: #fff; border-radius: 10px; padding: 30px; margin-top: 20px;">
          <p>Olá <b>Fornecedor Exemplo</b>,</p>
          <p>O agendamento <b>AGD123456</b> foi marcado como <b>Não Realizado</b> pelo CD <b>Lagoa Nova</b>.</p>
        </div>
        <div style="text-align: center; color: #888; font-size: 12px; margin-top: 30px;">Este é um e-mail automático do BrisaLOG Portal.</div>
      </div>
    `
  });

  // 5. Status Atualizado (exemplo: Cancelado)
  await emailService.transporter.sendMail({
    from: { name: "BrisaLOG Portal", address: process.env.EMAIL_USER },
    to: "wandevpb@gmail.com",
    subject: "🚫 Agendamento Cancelado - BrisaLOG Portal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; padding: 20px; border-radius: 10px; text-align: center;">
          <h1>🚫 Agendamento Cancelado</h1>
        </div>
        <div style="background: #fff; border-radius: 10px; padding: 30px; margin-top: 20px;">
          <p>Olá <b>Fornecedor Exemplo</b>,</p>
          <p>O agendamento <b>AGD123456</b> foi <b>cancelado</b> pelo CD <b>Lagoa Nova</b>.</p>
        </div>
        <div style="text-align: center; color: #888; font-size: 12px; margin-top: 30px;">Este é um e-mail automático do BrisaLOG Portal.</div>
      </div>
    `
  });
}

sendAllTestEmails().then(() => {
  console.log("Todos os e-mails de teste foram enviados para wandevpb@gmail.com");
  process.exit(0);
});
