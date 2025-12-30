// Template: Cancelamento pelo CD/Admin
module.exports = function({ fornecedorNome, agendamentoCodigo, cdNome, motivo, dataAgendamento, horarioAgendamento }) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agendamento Cancelado - BrisaLOG</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                🚫 Agendamento Cancelado
                            </h1>
                            <p style="margin: 12px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">
                                Informamos que seu agendamento foi cancelado
                            </p>
                        </td>
                    </tr>

                    <!-- Conteúdo -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                Olá <strong style="color: #f97316;">${fornecedorNome}</strong>! 👋
                            </p>
                            
                            <p style="margin: 0 0 30px 0; color: #666666; font-size: 15px; line-height: 1.6;">
                                Informamos que seu agendamento no <strong>${cdNome}</strong> foi <strong style="color: #ef4444;">cancelado pelo centro de distribuição</strong>.
                            </p>

                            <!-- Card de Informações -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-left: 4px solid #f97316; border-radius: 8px; overflow: hidden; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="display: block; color: #666666; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                                                        📦 Código do Agendamento
                                                    </span>
                                                    <span style="display: block; color: #f97316; font-size: 32px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                                                        ${agendamentoCodigo}
                                                    </span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Detalhes do Agendamento Cancelado -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h3 style="margin: 0 0 20px 0; color: #333333; font-size: 16px; font-weight: 600;">
                                            📋 Detalhes do Agendamento
                                        </h3>
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                                                    <span style="display: block; color: #666666; font-size: 13px; margin-bottom: 4px;">Centro de Distribuição</span>
                                                    <span style="display: block; color: #333333; font-size: 15px; font-weight: 600;">${cdNome}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                                                    <span style="display: block; color: #666666; font-size: 13px; margin-bottom: 4px;">Data Agendada</span>
                                                    <span style="display: block; color: #333333; font-size: 15px; font-weight: 600;">${dataAgendamento}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0;">
                                                    <span style="display: block; color: #666666; font-size: 13px; margin-bottom: 4px;">Horário</span>
                                                    <span style="display: block; color: #333333; font-size: 15px; font-weight: 600;">${horarioAgendamento}</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Motivo do Cancelamento -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; overflow: hidden; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h3 style="margin: 0 0 12px 0; color: #dc2626; font-size: 16px; font-weight: 600;">
                                            ℹ️ Motivo do Cancelamento
                                        </h3>
                                        <p style="margin: 0; color: #666666; font-size: 15px; line-height: 1.6;">
                                            ${motivo}
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Próximos Passos -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; overflow: hidden; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h3 style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px; font-weight: 600;">
                                            💡 Próximos Passos
                                        </h3>
                                        <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                                            Se desejar, você pode realizar um novo agendamento através do portal BrisaLOG. 
                                            Em caso de dúvidas, entre em contato com o ${cdNome}.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.6; text-align: center;">
                                Atenciosamente,<br>
                                <strong style="color: #f97316;">Equipe BrisaLOG</strong>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px; line-height: 1.5;">
                                Este é um e-mail automático, por favor não responda.
                            </p>
                            <p style="margin: 0; color: #cccccc; font-size: 11px;">
                                © ${new Date().getFullYear()} BrisaLOG - Sistema de Agendamento de Entregas
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
};
