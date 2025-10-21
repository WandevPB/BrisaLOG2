# 🚀 BrisaLOG Portal - Sistema de Agendamento de Entregas

Sistema completo de agendamento de entregas para fornecedores da Brisanet, com design moderno em tema laranja, efeitos 3D e funcionalidades avançadas.

## 📋 Características

### 🎨 Design & UX
- **Tema Laranja Predominante** com paleta de cores customizada
- **Efeitos 3D** em botões, cards e ícones
- **Design Responsivo** para desktop, tablet e mobile
- **Animações Suaves** e transições elegantes
- **Tailwind CSS** para toda a estrutura visual

### 🔧 Funcionalidades Principais

#### Para Fornecedores:
- ✅ Formulário de agendamento em 4 etapas
- ✅ Upload de múltiplos PDFs (até 10MB cada)
- ✅ Validação em tempo real
- ✅ Confirmação por e-mail

#### Para Centros de Distribuição:
- ✅ Dashboard administrativo completo
- ✅ Gestão de status de entregas
- ✅ Filtros e busca avançada
- ✅ Visualização em cards ou lista
- ✅ Exportação de relatórios (Excel/PDF)
- ✅ Sistema de reagendamento
- ✅ Histórico de ações

### 🛠️ Stack Tecnológica

#### Frontend:
- **HTML5** + **CSS3** + **JavaScript ES6+**
- **Tailwind CSS** (CDN) para estilização
- **Font Awesome 6.4.0** para ícones
- **Responsivo** e otimizado

#### Backend:
- **Node.js** + **Express.js**
- **API REST** completa
- **Autenticação JWT**
- **Upload de arquivos** com Multer
- **Middlewares de segurança**

#### Banco de Dados:
- **SQLite** com **Prisma ORM**
- **Migrations** automáticas
- **Seed** com dados de exemplo

## 🚀 Instalação e Execução

### 📋 Pré-requisitos
- **Node.js** >= 16.0.0
- **npm** >= 8.0.0

### ⚡ Instalação Rápida

```bash
# 1. Navegar para o diretório do projeto
cd BrisaLOG-Portal

# 2. Instalar dependências e configurar banco
npm run init-project

# 3. Iniciar o servidor
npm run dev
```

### 🔧 Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev              # Iniciar servidor em modo desenvolvimento
npm start               # Iniciar servidor em produção

# Banco de Dados
npm run db:generate     # Gerar cliente Prisma
npm run db:push         # Aplicar schema ao banco
npm run db:migrate      # Criar migrations
npm run db:seed         # Popular banco com dados de exemplo
npm run db:studio       # Abrir Prisma Studio
npm run db:reset        # Resetar banco e aplicar seed

# Projeto
npm run init-project    # Configuração inicial completa
npm run build          # Build do projeto
```

## 🌐 Acesso ao Sistema

Após a instalação, o sistema estará disponível em:

- **Portal Principal**: https://brisalog-front.onrender.com
- **API**: https://brisalog-back.onrender.com/api
- **Health Check**: https://brisalog-back.onrender.com/health

### 🔑 Credenciais de Teste

**Login dos CDs** (primeiro acesso exige troca de senha):
- **Usuário:** `Bahia` | **Senha:** `Brisanet123`
- **Usuário:** `Pernambuco` | **Senha:** `Brisanet123`
- **Usuário:** `LagoaNova` | **Senha:** `Brisanet123`

## 📁 Estrutura do Projeto

```
BrisaLOG-Portal/
├── 📄 index.html                 # Página inicial
├── 📄 agendamento.html          # Formulário de agendamento
├── 📄 login.html                # Login dos CDs
├── 📄 dashboard.html            # Dashboard administrativo
├── 📁 js/
│   ├── 📄 agendamento.js        # Lógica do formulário
│   └── 📄 dashboard.js          # Lógica do dashboard
├── 📁 backend/
│   └── 📄 server.js             # Servidor Express
├── 📁 prisma/
│   ├── 📄 schema.prisma         # Schema do banco
│   └── 📄 seed.js               # Dados iniciais
├── 📁 uploads/                  # Arquivos PDF
├── 📄 package.json              # Configurações do projeto
└── 📄 README.md                 # Este arquivo
```

## 🔌 API Endpoints

### 🔐 Autenticação
```
POST /api/auth/login              # Login de CD
POST /api/auth/change-password    # Alterar senha
```

### 📋 Agendamentos
```
GET  /api/agendamentos           # Listar agendamentos (com filtros)
POST /api/agendamentos           # Criar novo agendamento
PUT  /api/agendamentos/:id/status # Atualizar status
POST /api/agendamentos/:id/reagendar # Sugerir nova data
```

### 📊 Dashboard
```
GET /api/dashboard/stats         # Estatísticas do dashboard
```

### 📎 Arquivos
```
GET /api/files/:filename         # Download de PDF
```

## 🎯 Fluxo de Utilização

### 👤 Para Fornecedores:

1. **Acesse** a página inicial
2. **Clique** em "Começar Agendamento"
3. **Preencha** os dados em 4 etapas:
   - Dados do fornecedor
   - Dados da entrega
   - Pedidos e notas fiscais
   - Revisão e confirmação
4. **Anexe** os PDFs das notas fiscais
5. **Confirme** o agendamento

### 🏢 Para Centros de Distribuição:

1. **Faça login** com suas credenciais
2. **Visualize** os agendamentos no dashboard
3. **Gerencie** status das entregas:
   - Aceitar/Rejeitar agendamentos
   - Marcar como entregue
   - Marcar como "não veio"
   - Sugerir nova data
4. **Exporte** relatórios quando necessário

## 🔒 Segurança

- ✅ **Autenticação JWT** com expiração em 24h
- ✅ **Hash de senhas** com bcrypt
- ✅ **Validação de entrada** em todas as APIs
- ✅ **Upload seguro** de arquivos PDF
- ✅ **Middleware CORS** configurado
- ✅ **Sanitização** de dados

## 📊 Dados de Exemplo

O sistema vem com dados de exemplo incluindo:
- **3 CDs** (Bahia, Pernambuco, Lagoa Nova)
- **5 Fornecedores** fictícios
- **20 Agendamentos** com status variados
- **Notas fiscais** e histórico de ações

## 🎨 Paleta de Cores

```css
Primária:    #FF6B35  /* Laranja vibrante */
Secundária:  #FF8C42  /* Laranja médio */
Acento:      #FF9F66  /* Laranja suave */
Luz:         #FFA885  /* Laranja claro */
```

## 🛡️ Status dos Agendamentos

- 🟠 **Pendente** - Aguardando aprovação do CD
- 🟢 **Confirmado** - Data aceita pelo CD
- 🔵 **Entregue** - Entrega realizada com sucesso
- 🔴 **Não Veio** - Fornecedor não compareceu
- 🟣 **Reagendamento** - Nova data sugerida

## 📱 Responsividade

O sistema é totalmente responsivo e funciona perfeitamente em:
- 🖥️ **Desktop** (1920px+)
- 💻 **Laptop** (1024px - 1919px)
- 📱 **Tablet** (768px - 1023px)
- 📱 **Mobile** (320px - 767px)

## 🔄 Atualizações Futuras

### Planejadas para v2.0:
- [ ] Notificações por e-mail/SMS
- [ ] Integração com WhatsApp Business
- [ ] Dashboard com gráficos avançados
- [ ] App mobile nativo
- [ ] API de rastreamento
- [ ] Relatórios personalizados

## 🐛 Suporte e Issues

Para reportar problemas ou sugerir melhorias:
1. Verifique se já existe uma issue similar
2. Crie uma nova issue com detalhes
3. Inclua logs e screenshots quando relevante

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

## 🚀 Deploy em Produção

### Usando PM2:
```bash
npm install -g pm2
pm2 start backend/server.js --name "brisalog-portal"
pm2 startup
pm2 save
```

### Usando Docker:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npx prisma db push
RUN npx prisma db seed
EXPOSE 3000
CMD ["npm", "start"]
```

---

**Desenvolvido com ❤️ para a Brisanet** 🌐
