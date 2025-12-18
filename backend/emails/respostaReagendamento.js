// Template: Resposta ao Reagendamento
module.exports = function({ fornecedorNome, agendamentoCodigo, resposta, novaData, novoHorario, comentario }) {
  const respostaAceita = resposta && resposta.toLowerCase() === 'aceito';
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resposta ao Reagendamento - BrisaLOG</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <tr>
                        <td style="background: linear-gradient(135deg, ${respostaAceita ? '#10b981' : '#ef4444'} 0%, ${respostaAceita ? '#059669' : '#dc2626'} 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                ${respostaAceita ? '✅' : '❌'} Resposta ao Reagendamento
                            </h1>
                            <p style="margin: 12px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">
                                Resposta registrada: ${resposta ? resposta.toUpperCase() : 'N/A'}
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                Olá <strong style="color: ${respostaAceita ? '#10b981' : '#ef4444'};">${fornecedorNome}</strong>! 👋
                            </p>
                            
                            <p style="margin: 0 0 30px 0; color: #666666; font-size: 15px; line-height: 1.6;">
                                Sua resposta ao reagendamento foi <strong>registrada com sucesso</strong>. O CD foi notificado sobre sua decisão.
                            </p>

                            <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, ${respostaAceita ? '#f0fdf4' : '#fef2f2'} 0%, ${respostaAceita ? '#f7fef9' : '#fff5f5'} 100%); border-left: 4px solid ${respostaAceita ? '#10b981' : '#ef4444'}; border-radius: 8px; overflow: hidden; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="display: block; color: #666666; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                                                        📦 Código do Agendamento
                                                    </span>
                                                    <span style="display: block; color: ${respostaAceita ? '#10b981' : '#ef4444'}; font-size: 32px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                                                        ${agendamentoCodigo}
                                                    </span>
                                                </td>
                                            </tr>
                                            ${novaData ? `
                                            <tr>
                                                <td style="padding: 15px 0 8px 0; border-top: 1px solid rgba(${respostaAceita ? '16, 185, 129' : '239, 68, 68'}, 0.1);">
                                                    <span style="display: block; color: #666666; font-size: 13px; font-weight: 600; margin-bottom: 4px;">
                                                        🗓️ Nova Data
                                                    </span>
                                                    <span style="display: block; color: #333333; font-size: 16px; font-weight: 600;">
                                                        ${new Date(novaData).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                                    </span>
                                                </td>
                                            </tr>
                                            ` : ''}
                                            ${novoHorario ? `
                                            <tr>
                                                <td style="padding: 15px 0 8px 0; border-top: 1px solid rgba(${respostaAceita ? '16, 185, 129' : '239, 68, 68'}, 0.1);">
                                                    <span style="display: block; color: #666666; font-size: 13px; font-weight: 600; margin-bottom: 4px;">
                                                        ⏰ Novo Horário
                                                    </span>
                                                    <span style="display: block; color: #333333; font-size: 16px; font-weight: 600;">
                                                        ${novoHorario}
                                                    </span>
                                                </td>
                                            </tr>
                                            ` : ''}
                                            ${comentario ? `
                                            <tr>
                                                <td style="padding: 15px 0 0 0; border-top: 1px solid rgba(${respostaAceita ? '16, 185, 129' : '239, 68, 68'}, 0.1);">
                                                    <span style="display: block; color: #666666; font-size: 13px; font-weight: 600; margin-bottom: 4px;">
                                                        💬 Comentário
                                                    </span>
                                                    <span style="display: block; color: #333333; font-size: 15px;">
                                                        ${comentario}
                                                    </span>
                                                </td>
                                            </tr>
                                            ` : ''}
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="https://brisalog-agenda.online/" 
                                           style="display: inline-block; background: linear-gradient(135deg, ${respostaAceita ? '#10b981, #059669' : '#ef4444, #dc2626'}); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(${respostaAceita ? '16, 185, 129' : '239, 68, 68'}, 0.3);">
                                            🌐 Acessar Portal BrisaLOG
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 30px 0 0 0; color: #999999; font-size: 14px; line-height: 1.6; text-align: center;">
                                Acesse o portal para acompanhar o status do agendamento.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0 0 8px 0; color: #999999; font-size: 13px;">
                                © ${new Date().getFullYear()} <strong style="color: ${respostaAceita ? '#10b981' : '#ef4444'};">BrisaLOG</strong> - Sistema de Agendamento
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
