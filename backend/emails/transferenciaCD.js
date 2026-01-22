// Template: Transferência de CD
module.exports = function({ transportadorNome, agendamentoCodigo, cdAnterior, cdNovo, motivo, dataEntrega, horario, horarioOriginal, horarioFoiAjustado }) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alteração de Local de Entrega - BrisaLOG</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <tr>
                        <td style="background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FF9F66 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                🔄 Alteração de Local de Entrega
                            </h1>
                            <p style="margin: 12px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">
                                Seu agendamento foi transferido para outro CD
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                Olá <strong style="color: #FF6B35;">${transportadorNome}</strong>! 👋
                            </p>
                            
                            <p style="margin: 0 0 20px 0; color: #666666; font-size: 15px; line-height: 1.6;">
                                Identificamos que houve um <strong>erro no local de entrega</strong> escolhido para seu agendamento. Para garantir o melhor atendimento, fizemos a transferência do seu ticket para o CD correto.
                            </p>

                            <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #FFE5D9 0%, #FFD4C2 100%); border-left: 4px solid #FF6B35; border-radius: 8px; overflow: hidden; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="display: block; color: #666666; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                                                        📦 Código do Agendamento
                                                    </span>
                                                    <span style="display: block; color: #FF6B35; font-size: 32px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                                                        ${agendamentoCodigo}
                                                    </span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <div style="background-color: #f0f9ff; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                                <p style="margin: 0 0 15px 0; color: #1e40af; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                    ⚠️ Importante
                                </p>
                                <p style="margin: 0; color: #1e3a8a; font-size: 15px; line-height: 1.6;">
                                    <strong>Não se preocupe!</strong> Seu código de agendamento <strong>permanece o mesmo</strong>. Seu ticket está com status <strong style="color: #f59e0b;">PENDENTE DE APROVAÇÃO</strong>. Aguarde a confirmação do novo CD para seguir com a entrega.
                                </p>
                            </div>

                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 15px 0; border-bottom: 2px solid #f3f4f6;">
                                        <table role="presentation" style="width: 100%;">
                                            <tr>
                                                <td style="width: 40%; color: #6b7280; font-size: 14px; font-weight: 600;">
                                                    Local Anterior:
                                                </td>
                                                <td style="color: #ef4444; font-size: 14px; font-weight: 700; text-decoration: line-through;">
                                                    ${cdAnterior}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 0; border-bottom: 2px solid #f3f4f6;">
                                        <table role="presentation" style="width: 100%;">
                                            <tr>
                                                <td style="width: 40%; color: #6b7280; font-size: 14px; font-weight: 600;">
                                                    ✅ Novo Local:
                                                </td>
                                                <td style="color: #10b981; font-size: 16px; font-weight: 700;">
                                                    ${cdNovo}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 0; border-bottom: 2px solid #f3f4f6;">
                                        <table role="presentation" style="width: 100%;">
                                            <tr>
                                                <td style="width: 40%; color: #6b7280; font-size: 14px; font-weight: 600;">
                                                    📅 Data:
                                                </td>
                                                <td style="color: #1f2937; font-size: 14px; font-weight: 600;">
                                                    ${dataEntrega}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 0;">
                                        <table role="presentation" style="width: 100%;">
                                            <tr>
                                                <td style="width: 40%; color: #6b7280; font-size: 14px; font-weight: 600;">
                                                    🕐 Horário:
                                                </td>
                                                <td style="color: #1f2937; font-size: 14px; font-weight: 600;">
                                                    ${horario}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                ${horarioFoiAjustado ? `
                                <tr>
                                    <td style="padding: 15px 0; background-color: #fef3c7; border-radius: 8px;">
                                        <table role="presentation" style="width: 100%;">
                                            <tr>
                                                <td style="width: 40%; color: #92400e; font-size: 14px; font-weight: 600;">
                                                    ⏰ Horário Original:
                                                </td>
                                                <td style="color: #c2410c; font-size: 14px; font-weight: 600; text-decoration: line-through;">
                                                    ${horarioOriginal}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                ` : ''}
                            </table>

                            ${horarioFoiAjustado ? `
                            <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin-bottom: 25px; border-left: 4px solid #f59e0b;">
                                <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                                    ⏰ Ajuste de Horário
                                </p>
                                <p style="margin: 0; color: #78350f; font-size: 15px; line-height: 1.6;">
                                    O horário foi ajustado automaticamente de <strong>${horarioOriginal}</strong> para <strong>${horario}</strong> porque o CD <strong>${cdNovo}</strong> possui restrição de horários apenas até às 15h.
                                </p>
                            </div>
                            ` : ''}

                            <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
                                <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                                    📝 Motivo da Transferência
                                </p>
                                <p style="margin: 0; color: #78350f; font-size: 15px; line-height: 1.6; font-style: italic;">
                                    "${motivo}"
                                </p>
                            </div>

                            <div style="background-color: #ecfdf5; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                                <p style="margin: 0 0 15px 0; color: #065f46; font-size: 14px; font-weight: 600;">
                                    ✅ Próximos Passos:
                                </p>
                                <ul style="margin: 0; padding-left: 20px; color: #047857; font-size: 14px; line-height: 1.8;">
                                    <li>Aguarde a confirmação do novo CD</li>
                                    <li>Você receberá um email quando seu agendamento for aprovado</li>
                                    <li>Não é necessário fazer um novo agendamento</li>
                                    <li>O código <strong>${agendamentoCodigo}</strong> permanece válido</li>
                                </ul>
                            </div>

                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 30px;">
                                <tr>
                                    <td align="center">
                                        <a href="https://brisalog-agenda.online/consultar-status.html?codigo=${agendamentoCodigo}" 
                                           style="display: inline-block; background: linear-gradient(135deg, #FF6B35, #FF8C42); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px rgba(255, 107, 53, 0.3);">
                                            🔍 Acompanhar Agendamento
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color: #1f2937; padding: 25px 30px; text-align: center;">
                            <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                                © 2026 <strong style="color: #ffffff;">BrisaLOG</strong> - Sistema de Agendamento de Entregas<br>
                                Este é um e-mail automático, por favor não responda.
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
