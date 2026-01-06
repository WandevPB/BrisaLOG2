# 📊 Guia de KPIs do Dashboard de Gestão BrisaLOG

## 🎯 KPIs Principais (4 cards laranja/verde/azul)

### 1. **Total de Agendamentos** 
- **O que é**: Quantidade total de agendamentos no período filtrado
- **Para que serve**: Medir o volume geral de operações
- **Ideal**: Crescimento constante mês a mês

### 2. **Taxa de Confirmação**
- **O que é**: % de agendamentos que foram confirmados pelo CD
- **Fórmula**: (Confirmados + Entregues) / Total × 100
- **Para que serve**: Mede a eficiência do processo de validação
- **Meta ideal**: > 90%

### 3. **Taxa de Entrega**
- **O que é**: % de agendamentos que foram efetivamente entregues
- **Fórmula**: Entregues / Total × 100
- **Para que serve**: Principal indicador de sucesso operacional
- **Meta ideal**: > 85%

### 4. **Não Comparecimento**
- **O que é**: % de fornecedores que NÃO compareceram no horário agendado
- **Fórmula**: Não Veio / Total × 100
- **Para que serve**: Identifica problemas com fornecedores ou processo
- **Meta ideal**: < 5% (quanto menor, melhor)

---

## 🔧 KPIs Secundários (3 cards roxos)

### 5. **Tempo Médio de Confirmação**
- **O que é**: Média de horas entre o agendamento e a confirmação
- **Fórmula**: Soma(updatedAt - createdAt) / Quantidade
- **Para que serve**: Mede velocidade de resposta dos CDs
- **Meta ideal**: < 4 horas

### 6. **Volume Total de NFs** *(substituiu "Média por Dia")*
- **O que é**: Quantidade total de Notas Fiscais processadas
- **Fórmula**: Soma de todas as NFs de todos os agendamentos
- **Para que serve**: **Métrica de throughput real** - mostra o volume de negócio processado, não apenas agendamentos vazios
- **Diferencial**: 1 agendamento pode ter múltiplas NFs, então essa é a **verdadeira métrica de produtividade**

### 7. **CD Mais Ativo**
- **O que é**: Centro de Distribuição com mais agendamentos
- **Para que serve**: Identifica hotspots operacionais que precisam de mais recursos
- **Uso estratégico**: Direcionar investimentos em infraestrutura

---

## 🚀 KPIs Executivos (4 cards gradiente)

### 8. **Taxa de Assertividade** ⭐ NOVO
- **O que é**: % de agendamentos confirmados que foram efetivamente entregues
- **Fórmula**: Entregues / Confirmados × 100
- **Para que serve**: **Mede a qualidade das confirmações**
  - Se você confirma 100 agendamentos mas só entrega 60, sua assertividade é 60%
  - Previne "confirmações infladas" (confirmar tudo sem critério)
- **Diferença da Taxa de Entrega**: 
  - Taxa de Entrega = entregues/total (inclui pendentes e cancelados)
  - Assertividade = entregues/confirmados (mede só os que você validou)
- **Meta ideal**: > 95% (quase tudo que confirma, deve entregar)
- **❌ Problema se baixo**: CDs confirmando sem critério, perdendo credibilidade

### 9. **Taxa de Cancelamento**
- **O que é**: % de agendamentos cancelados
- **Fórmula**: Cancelados / Total × 100
- **Para que serve**: Rastreia desperdício operacional e retrabalho
- **Meta ideal**: < 3%
- **Causas comuns**: Problemas na documentação, fornecedor não consegue chegar

### 10. **Agendamentos Pendentes**
- **O que é**: Quantidade de agendamentos ainda não confirmados
- **Para que serve**: **Indicador de urgência** - mostra carga de trabalho imediata
- **Ação requerida**: Se muito alto, CDs precisam agir rápido
- **Uso em reuniões**: "Temos X agendamentos para confirmar HOJE"

### 11. **Total de Notas Fiscais** *(agora duplicado como executivo)*
- **Já explicado acima no item 6**
- **Razão de estar aqui também**: É tão importante que merece destaque executivo
- **Comparação**: 
  - 1000 agendamentos com 1 NF cada = 1000 NFs
  - 500 agendamentos com 3 NFs cada = 1500 NFs (mais valor!)

---

## 📈 Como Usar na Apresentação à Diretoria

### **Slide 1: Operação Geral**
- Total de Agendamentos (crescimento mês a mês)
- Taxa de Entrega (acima de 85% = operação saudável)
- CD Mais Ativo (onde estamos mais fortes)

### **Slide 2: Qualidade do Serviço**
- **Taxa de Assertividade** ⭐ ("Confirmamos com critério!")
- Taxa de Não Comparecimento (problema dos fornecedores)
- Tempo Médio de Confirmação (nossa agilidade)

### **Slide 3: Eficiência e Throughput**
- Volume Total de NFs (o verdadeiro volume de negócio)
- Taxa de Cancelamento (quanto perdemos)
- Agendamentos Pendentes (carga atual)

---

## 🎨 **Por Que Esses KPIs São Melhores?**

| KPI Antigo          | KPI Novo                   | Por Quê?                                      |
|---------------------|----------------------------|-----------------------------------------------|
| Média por Dia       | Volume Total de NFs        | NFs = negócio real, não apenas agendamentos   |
| *(não existia)*     | Taxa de Assertividade      | Mede qualidade das decisões, não só volume    |
| *(não existia)*     | Agendamentos Pendentes     | Urgência operacional visível                  |

---

## 📊 Exemplo Prático: Apresentação à Diretoria

**"No último trimestre:**
- ✅ Processamos **12.500 agendamentos** (↑ 18% vs Q3)
- ✅ **Taxa de Entrega de 89%** (acima da meta de 85%)
- ⭐ **Taxa de Assertividade de 96%** - confirmamos com critério!
- 📦 **Volume de 28.300 NFs** processadas (throughput real)
- ⚡ Tempo médio de confirmação: **2.8 horas** (meta: <4h)
- 🚨 Taxa de cancelamento: **2.1%** (dentro da meta <3%)
- 📍 CD Lagoa Nova lidera com **3.200 agendamentos** (25% do total)
- ⏳ Temos **87 agendamentos pendentes** para confirmar hoje"

**Conclusão**: Operação eficiente, ágil e com alto padrão de qualidade! 🎉

---

## 🔗 Link Público com Fullscreen

- ✅ Botão "Tela Cheia" (F11) para apresentações
- ✅ Links públicos podem expirar (segurança)
- ✅ Contador de acessos (rastreabilidade)
