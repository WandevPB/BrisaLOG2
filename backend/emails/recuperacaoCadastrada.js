module.exports = function ({ nome, email, cd }) {
  return `
    <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); padding: 32px;">
        <h2 style="color: #FF6B35; margin-bottom: 16px;">Cadastro de E-mail de Recuperação</h2>
        <p style="font-size: 16px; color: #333;">Olá <b>${nome || 'usuário'}</b>,</p>
        <p style="font-size: 16px; color: #333;">O e-mail <b>${email}</b> foi cadastrado como e-mail de recuperação para o CD <b>${cd}</b> no portal BrisaLOG.</p>
        <p style="font-size: 15px; color: #666; margin-top: 24px;">Se você não reconhece esta ação, por favor, entre em contato com o suporte imediatamente.</p>
        <div style="margin-top: 32px; text-align: center;">
          <a href="https://brisalog-agenda.online/" style="background: linear-gradient(135deg, #FF6B35, #FF8C42); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Acessar Portal BrisaLOG</a>
        </div>
        <p style="font-size: 13px; color: #aaa; margin-top: 32px;">Esta é uma mensagem automática. Não responda este e-mail.</p>
      </div>
    </div>
  `;
};
