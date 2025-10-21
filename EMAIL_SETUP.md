# 📧 Configuração de E-mail - BrisaLOG Portal

## 🔧 Configuração de E-mail

Para usar o sistema de recuperação de senha por e-mail, você precisa configurar as credenciais de e-mail no arquivo `.env`.

### 📋 Passos para Configuração:

### 1. **Usando Gmail (Recomendado)**

1. **Acesse sua conta Gmail**
2. **Ative a verificação em 2 etapas** (se ainda não estiver ativada)
3. **Gere uma senha de app:**
   - Vá em: Conta Google → Segurança → Verificação em duas etapas → Senhas de app
   - Selecione "Outro (nome personalizado)" e digite "BrisaLOG Portal"
   - Copie a senha gerada (16 caracteres)

4. **Configure o arquivo `.env`:**
```env
# Configurações de E-mail (Gmail)
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu.email@gmail.com
EMAIL_PASS=sua_senha_de_app_aqui
```

### 2. **Usando Outlook/Hotmail**

```env
# Configurações de E-mail (Outlook)
EMAIL_SERVICE=hotmail
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu.email@outlook.com
EMAIL_PASS=sua_senha_aqui
```

### 3. **Usando Outro Provedor (SMTP Customizado)**

```env
# Configurações de E-mail (Customizado)
EMAIL_SERVICE=
EMAIL_HOST=smtp.seudominio.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@seudominio.com
EMAIL_PASS=sua_senha_aqui
```

## 🚀 Testando a Configuração

### 1. **Iniciar o Servidor**
```bash
npm start
```

### 2. **Testar Envio de E-mail**
```bash
# Acesse no navegador ou use curl:
curl https://brisalog-back.onrender.com/api/auth/test-email/seu.email@exemplo.com
```

### 3. **Verificar Logs**
- ✅ **Sucesso:** "Servidor de e-mail configurado com sucesso"
- ❌ **Erro:** "Erro na configuração de e-mail"

## 🔒 Segurança

### **Importante:**
- **NUNCA** use sua senha principal do e-mail
- **SEMPRE** use senhas de app ou tokens específicos
- **MANTENHA** o arquivo `.env` fora do controle de versão (já está no .gitignore)
- **CONFIGURE** um e-mail dedicado para o sistema (ex: `noreply@empresa.com`)

## 📧 Como Funciona o Sistema

### **1. Solicitar Recuperação**
1. Usuário acessa `esqueceu-senha.html`
2. Digita o e-mail cadastrado
3. Sistema envia e-mail com link de recuperação

### **2. E-mail de Recuperação**
- **Template profissional** com branding BrisaLOG
- **Link seguro** com token único
- **Validade:** 1 hora
- **Informações:** e-mail, data, instruções

### **3. Redefinir Senha**
1. Usuário clica no link do e-mail
2. Acessa `redefinir-senha.html?token=xxx&email=xxx`
3. Define nova senha com validação
4. Sistema confirma alteração

## 🎨 Template do E-mail

O e-mail possui:
- **Design responsivo** que funciona em todos os clientes
- **Cores corporativas** da Brisanet (#FF6B35, #FF8C42)
- **Instruções claras** passo a passo
- **Avisos de segurança** sobre validade e uso
- **Botão de ação** destacado para redefinir senha

## 🛠️ Troubleshooting

### **Problema:** "Erro na configuração de e-mail"
**Solução:**
1. Verifique se `EMAIL_USER` e `EMAIL_PASS` estão corretos
2. Para Gmail, use senha de app (não a senha normal)
3. Verifique se a verificação em 2 etapas está ativada

### **Problema:** "Authentication failed"
**Solução:**
1. Gmail: Gere uma nova senha de app
2. Outlook: Verifique se "Aplicativos menos seguros" está permitido
3. Outros: Verifique credenciais SMTP

### **Problema:** E-mail não chega
**Solução:**
1. Verifique spam/lixo eletrônico
2. Teste com diferentes provedores de e-mail
3. Verifique logs do servidor para erros

## 📊 Monitoramento

O sistema registra logs detalhados:
- ✅ **Sucesso:** E-mails enviados com messageId
- ❌ **Erro:** Falhas com descrição do problema
- 📧 **Info:** Tentativas de recuperação por e-mail

## 🔄 Próximos Passos

Após configurar:
1. **Teste** com um e-mail real
2. **Configure** e-mails de recuperação para usuários existentes
3. **Monitore** logs para garantir funcionamento
4. **Documente** procedimentos para sua equipe

---

💡 **Dica:** Para produção, considere usar serviços como SendGrid, Amazon SES ou similar para maior confiabilidade e entregabilidade.
