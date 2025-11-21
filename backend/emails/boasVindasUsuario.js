module.exports = function({ nome, codigo, cdNome, email }) {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo ao BrisaLOG Agenda</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header com gradiente laranja -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FF9F66 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                🎉 Bem-vindo ao BrisaLOG!
                            </h1>
                            <p style="margin: 12px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">
                                Seu acesso foi criado com sucesso
                            </p>
                        </td>
                    </tr>

                    <!-- Conteúdo principal -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                Olá <strong style="color: #FF6B35;">${nome}</strong>! 👋
                            </p>
                            
                            <p style="margin: 0 0 30px 0; color: #666666; font-size: 15px; line-height: 1.6;">
                                Seu usuário foi criado no sistema <strong>BrisaLOG Agenda</strong>. Você recebeu um código de autorização pessoal que será solicitado para realizar ações importantes no sistema.
                            </p>

                            <!-- Card com informações do usuário -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #fff5f2 0%, #fff9f7 100%); border-left: 4px solid #FF6B35; border-radius: 8px; overflow: hidden; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="display: block; color: #666666; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                                                        🔑 Código de Autorização
                                                    </span>
                                                    <span style="display: block; color: #FF6B35; font-size: 32px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                                                        ${codigo}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 15px 0 8px 0; border-top: 1px solid rgba(255, 107, 53, 0.1);">
                                                    <span style="display: block; color: #666666; font-size: 13px; font-weight: 600; margin-bottom: 4px;">
                                                        📍 Centro de Distribuição
                                                    </span>
                                                    <span style="display: block; color: #333333; font-size: 16px; font-weight: 600;">
                                                        ${cdNome}
                                                    </span>
                                                </td>
                                            </tr>
                                            ${email ? `
                                            <tr>
                                                <td style="padding: 15px 0 0 0; border-top: 1px solid rgba(255, 107, 53, 0.1);">
                                                    <span style="display: block; color: #666666; font-size: 13px; font-weight: 600; margin-bottom: 4px;">
                                                        ✉️ E-mail
                                                    </span>
                                                    <span style="display: block; color: #333333; font-size: 15px;">
                                                        ${email}
                                                    </span>
                                                </td>
                                            </tr>
                                            ` : ''}
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Instruções de uso -->
                            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                                <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 16px; font-weight: 700;">
                                    🔐 Para que serve o código de autorização?
                                </h3>
                                <p style="margin: 0 0 15px 0; color: #666666; font-size: 14px; line-height: 1.8;">
                                    Este código será solicitado quando você realizar ações importantes no sistema, como:
                                </p>
                                <ul style="margin: 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 1.8;">
                                    <li style="margin-bottom: 8px;">Alterar o estágio de um agendamento</li>
                                    <li style="margin-bottom: 8px;">Confirmar entrega de solicitações</li>
                                    <li style="margin-bottom: 8px;">Atualizar informações importantes</li>
                                    <li>Outras ações que requerem confirmação de identidade</li>
                                </ul>
                            </div>

                            <!-- Botão de acesso -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="https://brisalog-agenda.online/login.html" 
                                           style="display: inline-block; background: linear-gradient(135deg, #FF6B35, #FF8C42); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3); transition: all 0.3s ease;">
                                            🚀 Acessar Sistema BrisaLOG
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Aviso importante -->
                            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 6px; padding: 15px; margin-top: 25px;">
                                <p style="margin: 0; color: #856404; font-size: 13px; line-height: 1.6;">
                                    <strong>⚠️ Importante:</strong> Guarde este código em local seguro. Ele é pessoal e intransferível, servindo como sua assinatura digital para autorizar ações no sistema.
                                </p>
                            </div>

                            <!-- Mensagem de suporte -->
                            <p style="margin: 30px 0 0 0; color: #999999; font-size: 14px; line-height: 1.6; text-align: center;">
                                O login no sistema continua sendo feito pelo acesso do seu CD.<br>
                                Em caso de dúvidas, entre em contato com o administrador.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0 0 8px 0; color: #999999; font-size: 13px;">
                                © ${new Date().getFullYear()} <strong style="color: #FF6B35;">BrisaLOG</strong> - Sistema de Agendamento
                            </p>
                            <p style="margin: 0; color: #cccccc; font-size: 12px;">
                                Brisanet Telecomunicações. Todos os direitos reservados.
                            </p>
                        </td>
                    </tr>

                </table>

                <!-- Mensagem adicional abaixo do card -->
                <p style="margin: 20px 0 0 0; color: #999999; font-size: 12px; text-align: center; line-height: 1.5;">
                    Este é um e-mail automático, por favor não responda.<br>
                    Caso não tenha solicitado este acesso, desconsidere esta mensagem.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};
