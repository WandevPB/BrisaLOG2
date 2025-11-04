// Template: Não Veio
module.exports = function({ transportadorNome, agendamentoCodigo, cdNome, consultaUrl, motoristaNome, veiculoPlaca, dataAgendamento, horarioAgendamento }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FF9F66 100%); color: white; border-radius: 10px; padding: 30px 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 26px;">Entrega Não Realizada</h1>
        <p style="font-size: 18px; margin: 10px 0 0 0;">O transportador não compareceu ao CD ${cdNome}</p>
      </div>
      <div style="background: #fff; border-radius: 10px; margin-top: 20px; padding: 30px 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        <h2 style="color: #FF6B35; margin-top: 0;">Olá, ${transportadorNome}!</h2>
        <p>O status do seu agendamento <b>${agendamentoCodigo}</b> foi atualizado para <b>NÃO VEIO</b>.</p>
        <div style="background: #f8f9fa; border-left: 4px solid #FF6B35; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <strong>📦 Código do Agendamento:</strong> <span style="font-size: 18px; color: #FF6B35;">${agendamentoCodigo}</span><br>
          <strong>🚚 Motorista:</strong> ${motoristaNome || 'Não informado'}<br>
          <strong>🚗 Veículo/Placa:</strong> ${veiculoPlaca || 'Não informado'}<br>
          <strong>📅 Data:</strong> ${dataAgendamento ? new Date(dataAgendamento).toLocaleDateString('pt-BR') : 'Não informado'}<br>
          <strong>⏰ Horário:</strong> ${horarioAgendamento || 'Não informado'}
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${consultaUrl}" style="background: linear-gradient(135deg, #FF6B35, #FF8C42); color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(255, 107, 53, 0.2);">🔍 Consultar Status do Agendamento</a>
        </div>
        <p style="font-size: 15px; color: #666;">Para consultar, acesse o link acima e informe o código: <b>${agendamentoCodigo}</b></p>
      </div>
      <div style="text-align: center; margin-top: 40px; color: #999; font-size: 13px;">
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p>© ${new Date().getFullYear()} Brisanet. Todos os direitos reservados.</p>
      </div>
    </div>
  `;
};
