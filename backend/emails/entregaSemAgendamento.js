module.exports = ({ 
    fornecedorNome, 
    agendamentoCodigo, 
    cdNome, 
    dataEntrega, 
    horarioEntrega, 
    agendamentoUrl 
}) => {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FF9F66 100%); color: white; border-radius: 10px; padding: 30px 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 26px;">📦 Entrega Registrada!</h1>
        <p style="font-size: 18px; margin: 10px 0 0 0;">Sua entrega foi registrada no CD ${cdNome}</p>
      </div>
      
      <div style="background: #fff; border-radius: 10px; margin-top: 20px; padding: 30px 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        <h2 style="color: #FF6B35; margin-top: 0;">Olá, ${fornecedorNome}!</h2>
        <p>Sua entrega foi registrada em nosso sistema pelo Centro de Distribuição com status <b>ENTREGUE</b>.</p>
        
        <div style="background: #f8f9fa; border-left: 4px solid #FF6B35; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <strong>📦 Código do Registro:</strong> <span style="font-size: 18px; color: #FF6B35;">${agendamentoCodigo}</span><br>
          <strong>🏢 Centro de Distribuição:</strong> ${cdNome}<br>
          <strong>📅 Data da Entrega:</strong> ${dataEntrega}<br>
          <strong>⏰ Horário:</strong> ${horarioEntrega}
        </div>

        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h3 style="color: #856404; margin-top: 0;">⚠️ Use o Sistema de Agendamento!</h3>
          <p style="color: #856404; margin: 0;">Para otimizar suas entregas futuras e evitar filas, recomendamos que utilize nosso sistema de agendamento online.</p>
        </div>

        <div style="background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h4 style="color: #0c5460; margin-top: 0;">✅ Benefícios do agendamento:</h4>
          <ul style="color: #0c5460; margin: 0;">
            <li>Horário garantido para sua entrega</li>
            <li>Menor tempo de espera</li>
            <li>Melhor organização do recebimento</li>
            <li>Notificações automáticas sobre status</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${agendamentoUrl}" style="background: linear-gradient(135deg, #FF6B35, #FF8C42); color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(255, 107, 53, 0.2);">🌐 Acessar Portal BrisaLOG</a>
        </div>
        
        <p style="font-size: 15px; color: #666; text-align: center;">Acesse o portal para fazer novos agendamentos e consultar o status das suas entregas.</p>
      </div>
      
      <div style="text-align: center; margin-top: 40px; color: #999; font-size: 13px;">
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p>© ${new Date().getFullYear()} Brisanet. Todos os direitos reservados.</p>
      </div>
    </div>
    `;
};