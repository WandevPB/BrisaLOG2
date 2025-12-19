// Template: Boas-vindas Admin
module.exports = function ({ nome, usuario, senha, linkPrimeiroAcesso }) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Boas-vindas - Acesso Admin BrisaLOG</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <tr>
                        <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
                            <div style="background-color: rgba(255, 255, 255, 0.2); width: 80px; height: 80px; margin: 0 auto 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 40px;">👑</span>
                            </div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                Boas-vindas ao BrisaLOG!
                            </h1>
                            <p style="margin: 12px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">
                                Acesso de Gestor Administrativo
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                Olá <strong style="color: #f97316;">${nome}</strong>! 👋
                            </p>
                            
                            <p style="margin: 0 0 30px 0; color: #666666; font-size: 15px; line-height: 1.6;">
                                É com grande satisfação que lhe damos as boas-vindas como <strong>Gestor Administrativo</strong> do portal BrisaLOG! 🎉
                            </p>

                            <p style="margin: 0 0 30px 0; color: #666666; font-size: 15px; line-height: 1.6;">
                                Seu acesso foi criado com sucesso. Abaixo estão suas credenciais de primeiro acesso:
                            </p>

                            <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-left: 4px solid #f97316; border-radius: 8px; overflow: hidden; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <h3 style="margin: 0 0 15px 0; color: #c2410c; font-size: 16px; font-weight: 700;">
                                            🔑 Suas Credenciais de Acesso
                                        </h3>
                                        <div style="margin-bottom: 15px;">
                                            <p style="margin: 0 0 5px 0; color: #666666; font-size: 13px;">
                                                <strong>Usuário:</strong>
                                            </p>
                                            <p style="margin: 0; color: #f97316; font-size: 20px; font-weight: 700; font-family: 'Courier New', monospace; background-color: rgba(249, 115, 22, 0.1); padding: 10px; border-radius: 6px; text-align: center;">
                                                ${usuario}
                                            </p>
                                        </div>
                                        <div>
                                            <p style="margin: 0 0 5px 0; color: #666666; font-size: 13px;">
                                                <strong>Senha Temporária:</strong>
                                            </p>
                                            <p style="margin: 0; color: #f97316; font-size: 20px; font-weight: 700; font-family: 'Courier New', monospace; background-color: rgba(249, 115, 22, 0.1); padding: 10px; border-radius: 6px; text-align: center;">
                                                ${senha}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <div style="background-color: #e0f2fe; border-left: 4px solid #0284c7; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
                                <h3 style="margin: 0 0 15px 0; color: #0369a1; font-size: 15px; font-weight: 700;">
                                    📋 Passo a Passo para Primeiro Acesso
                                </h3>
                                <ol style="margin: 0; padding-left: 20px; color: #075985; font-size: 14px; line-height: 2;">
                                    <li><strong>Clique no botão abaixo</strong> - Você será autenticado automaticamente</li>
                                    <li><strong>Cadastre um e-mail de recuperação</strong> - Para segurança da sua conta</li>
                                    <li><strong>Defina sua nova senha</strong> - Crie uma senha forte e pessoal</li>
                                    <li><strong>Confirme sua nova senha</strong> - Digite novamente para validar</li>
                                    <li><strong>Salve as alterações</strong> - Pronto! Seu acesso estará configurado</li>
                                </ol>
                            </div>

                            <div style="background-color: #fef3c7; border-left: 4px solid #ffc107; border-radius: 6px; padding: 15px; margin-bottom: 30px;">
                                <p style="margin: 0; color: #856404; font-size: 13px; line-height: 1.6;">
                                    <strong>⚠️ Importante:</strong> Por questões de segurança, você deverá criar uma nova senha no primeiro acesso. A senha temporária não funcionará após a troca.
                                </p>
                            </div>

                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${linkPrimeiroAcesso}" 
                                           style="display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: #ffffff; text-decoration: none; padding: 18px 45px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);">
                                            🚀 Configurar Meu Acesso Agora
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 30px 0 0 0; color: #999999; font-size: 13px; line-height: 1.6; text-align: center;">
                                Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                                <a href="${linkPrimeiroAcesso}" style="color: #f97316; word-break: break-all;">${linkPrimeiroAcesso}</a>
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0 0 8px 0; color: #999999; font-size: 13px;">
                                © ${new Date().getFullYear()} <strong style="color: #f97316;">BrisaLOG</strong> - Sistema de Agendamento
                            </p>
                            <p style="margin: 0; color: #cccccc; font-size: 12px;">
                                Desenvolvido por Wanderson Davyd. Todos os direitos reservados.
                            </p>
                        </td>
                    </tr>

                </table>

                <p style="margin: 20px 0 0 0; color: #999999; font-size: 12px; text-align: center; line-height: 1.5;">
                    Este é um e-mail automático, por favor não responda.<br>
                    Em caso de dúvidas, entre em contato com o suporte.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
};
