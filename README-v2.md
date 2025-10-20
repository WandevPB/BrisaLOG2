# BrisaLOG Portal - Sistema de Agendamento de Entregas 🚀

Sistema completo de agendamento de entregas para a Brisanet, com interface moderna, responsiva e funcionalidades avançadas.

![BrisaLOG Portal](https://img.shields.io/badge/Status-Completo-brightgreen)
![Versão](https://img.shields.io/badge/Versão-2.0-blue)
![Tecnologia](https://img.shields.io/badge/Frontend-HTML5%2BCSS3%2BJS-orange)
![Backend](https://img.shields.io/badge/Backend-Node.js%2BExpress-green)

## 🌟 Principais Funcionalidades

### 🏠 **Página Inicial Reformulada**
- **Design Limpo**: Interface moderna sem gradientes confusos
- **Consulta Rápida**: Botão destacado para consultar status de agendamentos
- **Navegação Intuitiva**: Acesso direto a todas as funcionalidades

### 📋 **Sistema de Agendamento Inteligente**
- **Cálculo Automático**: Valor total calculado automaticamente das notas fiscais
- **Validação Avançada**: Campos obrigatórios e formatação automática
- **Upload Simplificado**: Drag & drop para anexar PDFs
- **4 Etapas Intuitivas**: Fluxo otimizado para fornecedores

### 🔍 **Consulta de Status Completa**
- **Página Dedicada**: Interface específica para consulta de agendamentos
- **Histórico Detalhado**: Timeline completa com todas as ações
- **Comunicação Bilateral**: Sistema de reagendamento interativo
- **Dados Completos**: Visualização de todos os detalhes do agendamento

### 🏢 **Dashboard Organizado**
- **Layout em Colunas**: Agendamentos separados por status
- **Ordenação Inteligente**: 
  - Pendentes: mais antigos primeiro
  - Confirmados: data de entrega mais próxima
- **Filtros Avançados**: Por CD, data, fornecedor e status

## 🛠️ **Tecnologias**

### Frontend
- **HTML5 + CSS3 + JavaScript ES6+**
- **Tailwind CSS**: Framework CSS moderno
- **Font Awesome 6.4.0**: Ícones profissionais
- **Design Responsivo**: Mobile-first

### Backend
- **Node.js + Express.js**
- **JWT**: Autenticação segura
- **Multer**: Upload de arquivos
- **SQLite + Prisma ORM**: Banco de dados

## 🚀 **Como Usar**

### Para Fornecedores:
1. **Acesse** a página inicial
2. **Clique** em "Agendar Entrega Agora"
3. **Preencha** o formulário em 4 etapas
4. **Anexe** as notas fiscais (PDF)
5. **Receba** o código de acompanhamento
6. **Consulte** o status quando quiser

### Para CDs:
1. **Faça login** no sistema
2. **Visualize** agendamentos por status
3. **Gerencie** entregas (confirmar/reagendar)
4. **Comunique** com fornecedores

## 📱 **Responsividade Total**

- ✅ **Desktop**: Interface completa e otimizada
- ✅ **Tablet**: Layout adaptado para telas médias
- ✅ **Mobile**: Design mobile-first intuitivo

## 🔄 **Principais Melhorias v2.0**

### ✅ **Cálculo Automático**
- Valor total calculado automaticamente das NFs
- Eliminação do campo valor manual do pedido
- Validação de valores obrigatórios

### ✅ **Design Limpo**
- Remoção de gradientes de fundo confusos
- Interface mais profissional e limpa
- Melhor contraste e legibilidade

### ✅ **Consulta Avançada**
- Página dedicada para consulta de status
- Histórico completo de ações
- Sistema de comunicação para reagendamentos

### ✅ **Dashboard Organizado**
- Agendamentos em colunas por status
- Ordenação inteligente por prioridade
- Filtros e busca aprimorados

## 🎯 **Status dos Agendamentos**

| Status | Descrição | Cor |
|--------|-----------|-----|
| 🟠 **Pendente** | Aguardando confirmação do CD | Laranja |
| 🟢 **Confirmado** | Agendamento aprovado | Verde |
| 🔵 **Entregue** | Entrega realizada | Azul |
| 🔴 **Não Veio** | Fornecedor não compareceu | Vermelho |
| 🟣 **Reagendamento** | Nova data sugerida | Roxo |

## 📁 **Estrutura Simplificada**

```
BrisaLOG-Portal/
├── 📄 index.html                 # Página inicial
├── 📄 agendamento.html           # Formulário de agendamento
├── 📄 consultar-status.html      # Consulta de status (NOVO)
├── 📄 login.html                 # Login dos CDs
├── 📄 dashboard.html             # Dashboard administrativo
├── 📁 js/
│   ├── agendamento.js           # Lógica do agendamento (ATUALIZADO)
│   └── dashboard.js             # Lógica do dashboard (ATUALIZADO)
├── 📁 backend/
│   └── server.js                # Servidor Express
└── 📄 README.md                 # Documentação
```

## 🔒 **Segurança**

- ✅ **Autenticação JWT**
- ✅ **Validação de arquivos** (apenas PDF, máx 10MB)
- ✅ **Sanitização de dados**
- ✅ **Proteção CORS**

## 🎨 **Design System**

### Cores Principais:
- **Laranja Primário**: `#FF6B35`
- **Laranja Secundário**: `#FF8C42`
- **Laranja Accent**: `#FF9F66`
- **Laranja Light**: `#FFAB7A`

### Tipografia:
- **Fonte**: Inter (Google Fonts)
- **Hierarquia**: Clara definição de títulos
- **Responsividade**: Tamanhos escaláveis

## 📞 **Suporte**

- **Email**: suporte@brisanet.com.br
- **Telefone**: (84) 3301-5555
- **Horário**: Segunda à Sexta, 8h às 17h

---

**Desenvolvido com ❤️ para a Brisanet**  
*Sistema completo de gestão de entregas, moderno e eficiente*
