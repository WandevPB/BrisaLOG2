// Template: Não Veio
module.exports = function({ transportadorNome, agendamentoCodigo, cdNome, motoristaNome, veiculoPlaca, dataAgendamento, horarioAgendamento }) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Entrega Não Realizada - BrisaLOG</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header com gradiente vermelho (não veio) -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                ❌ Entrega Não Realizada
                            </h1>
                            <p style="margin: 12px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">
                                O transportador não compareceu ao CD ${cdNome}
                            </p>
                        </td>
                    </tr>

                    <!-- Conteúdo principal -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                Olá <strong style="color: #ef4444;">${transportadorNome}</strong>! 👋
                            </p>
                            
                            <p style="margin: 0 0 30px 0; color: #666666; font-size: 15px; line-height: 1.6;">
                                O status do seu agendamento foi atualizado para <strong>NÃO VEIO</strong>. Por favor, entre em contato com o CD para reagendar.
                            </p>

                            <!-- Card com informações -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%); border-left: 4px solid #ef4444; border-radius: 8px; overflow: hidden; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="display: block; color: #666666; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                                                        📦 Código do Agendamento
                                                    </span>
                                                    <span style="display: block; color: #ef4444; font-size: 32px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                                                        ${agendamentoCodigo}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 15px 0 8px 0; border-top: 1px solid rgba(239, 68, 68, 0.1);">
                                                    <span style="display: block; color: #666666; font-size: 13px; font-weight: 600; margin-bottom: 4px;">
                                                        🚚 Motorista
                                                    </span>
                                                    <span style="display: block; color: #333333; font-size: 16px; font-weight: 600;">
                                                        ${motoristaNome || 'Não informado'}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 15px 0 8px 0; border-top: 1px solid rgba(239, 68, 68, 0.1);">
                                                    <span style="display: block; color: #666666; font-size: 13px; font-weight: 600; margin-bottom: 4px;">
                                                        🚗 Veículo / Placa
                                                    </span>
                                                    <span style="display: block; color: #333333; font-size: 16px; font-weight: 600;">
                                                        ${veiculoPlaca || 'Não informado'}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 15px 0 8px 0; border-top: 1px solid rgba(239, 68, 68, 0.1);">
                                                    <span style="display: block; color: #666666; font-size: 13px; font-weight: 600; margin-bottom: 4px;">
                                                        📅 Data Prevista
                                                    </span>
                                                    <span style="display: block; color: #333333; font-size: 16px; font-weight: 600;">
                                                        ${dataAgendamento ? new Date(dataAgendamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Não informado'}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 15px 0 0 0; border-top: 1px solid rgba(239, 68, 68, 0.1);">
                                                    <span style="display: block; color: #666666; font-size: 13px; font-weight: 600; margin-bottom: 4px;">
                                                        ⏰ Horário
                                                    </span>
                                                    <span style="display: block; color: #333333; font-size: 16px; font-weight: 600;">
                                                        ${horarioAgendamento || 'Não informado'}
                                                    </span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Aviso importante -->
                            <div style="background-color: #fef3c7; border-left: 4px solid #ffc107; border-radius: 6px; padding: 15px; margin-bottom: 30px;">
                                <p style="margin: 0; color: #856404; font-size: 13px; line-height: 1.6;">
                                    <strong>⚠️ Atenção:</strong> Entre em contato com o CD ${cdNome} para reagendar sua entrega o quanto antes.
                                </p>
                            </div>

                            <!-- Botão de acesso -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="https://brisalog-agenda.online/" 
                                           style="display: inline-block; background: linear-gradient(135deg, #ef4444, #dc2626); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);">
                                            🌐 Acessar Portal BrisaLOG
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 30px 0 0 0; color: #999999; font-size: 14px; line-height: 1.6; text-align: center;">
                                Acesse o portal para agendar uma nova data.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0 0 8px 0; color: #999999; font-size: 13px;">
                                © ${new Date().getFullYear()} <strong style="color: #ef4444;">BrisaLOG</strong> - Sistema de Agendamento
                            </p>
                            <p style="margin: 0; color: #cccccc; font-size: 12px;">
                                Desenvolvido por Wanderson Davyd. Todos os direitos reservados.
                            </p>
                        </td>
                    </tr>

                </table>

                <p style="margin: 20px 0 0 0; color: #999999; font-size: 12px; text-align: center; line-height: 1.5;">
                    Este é um e-mail automático, por favor não responda.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
};
