// Template: Entrega Realizada
module.exports = function({ fornecedorNome, agendamentoCodigo, cdNome, baseUrl }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FF9F66 100%); color: white; border-radius: 10px; padding: 30px 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 26px;">Entrega Realizada!</h1>
        <p style="font-size: 18px; margin: 10px 0 0 0;">Seu agendamento foi entregue e finalizado no CD ${cdNome}</p>
      </div>
      <div style="background: #fff; border-radius: 10px; margin-top: 20px; padding: 30px 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        <h2 style="color: #FF6B35; margin-top: 0;">Olá, ${fornecedorNome}!</h2>
        <p>O status do seu agendamento <b>${agendamentoCodigo}</b> foi atualizado para <b>ENTREGUE</b>.</p>
        <div style="background: #f8f9fa; border-left: 4px solid #FF6B35; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <strong>📦 Código do Agendamento:</strong> <span style="font-size: 18px; color: #FF6B35;">${agendamentoCodigo}</span>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}" style="background: linear-gradient(135deg, #FF6B35, #FF8C42); color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(255, 107, 53, 0.2);">🌐 Acessar Portal BrisaLOG</a>
        </div>
        <p style="font-size: 15px; color: #666;">Acesse o portal para consultar o status dos seus agendamentos.</p>
      </div>
      <div style="text-align: center; margin-top: 40px; color: #999; font-size: 13px;">
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p>© ${new Date().getFullYear()} Brisanet. Todos os direitos reservados.</p>
      </div>
    </div>
  `;
};
