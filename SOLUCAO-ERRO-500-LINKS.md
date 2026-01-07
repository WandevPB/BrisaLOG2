# 🔧 Solução para Erro 500 ao Gerar Links Públicos

## 🚨 Problema
```
POST /api/relatorios-publicos 500 (Internal Server Error)
permission denied for table relatorios_publicos
```

## 📋 Causa
A tabela `relatorios_publicos` não existe ou foi criada com nome errado (`RelatorioPublico`).

---

## ✅ SOLUÇÃO COMPLETA (Execute no VPS)

### **Passo 1: Conectar ao PostgreSQL**
```bash
# Conectar ao banco
psql -U postgres -d base_brisalog
```

### **Passo 2: Verificar se existe tabela com nome errado**
```sql
-- Verificar se a tabela RelatorioPublico existe (nome errado)
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%elatorio%';
```

### **Passo 3: Remover tabela antiga e criar correta**
```sql
-- Dropar qualquer tabela com nome errado
DROP TABLE IF EXISTS "RelatorioPublico" CASCADE;

-- Criar tabela COM O NOME CORRETO
CREATE TABLE IF NOT EXISTS relatorios_publicos (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    filtros TEXT NOT NULL,
    "criadoPor" VARCHAR(255) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEm" TIMESTAMP(3),
    acessos INTEGER NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### **Passo 4: Criar índices**
```sql
CREATE INDEX IF NOT EXISTS relatorios_publicos_token_idx ON relatorios_publicos(token);
CREATE INDEX IF NOT EXISTS relatorios_publicos_criadoPor_idx ON relatorios_publicos("criadoPor");
CREATE INDEX IF NOT EXISTS relatorios_publicos_ativo_idx ON relatorios_publicos(ativo);
```

### **Passo 5: Dar permissões (CRÍTICO!)**
```sql
-- Dar permissões ao usuário postgres
GRANT ALL PRIVILEGES ON TABLE relatorios_publicos TO postgres;
GRANT ALL PRIVILEGES ON SEQUENCE relatorios_publicos_id_seq TO postgres;

-- Se seu usuário do banco for diferente de 'postgres', execute também:
-- GRANT ALL PRIVILEGES ON TABLE relatorios_publicos TO seu_usuario;
-- GRANT ALL PRIVILEGES ON SEQUENCE relatorios_publicos_id_seq TO seu_usuario;
```

### **Passo 6: Verificar criação**
```sql
-- Verificar estrutura da tabela
\d relatorios_publicos

-- Deve mostrar todas as colunas listadas acima
```

### **Passo 7: Sair do PostgreSQL**
```sql
\q
```

### **Passo 8: Reiniciar servidor Node.js**
```bash
pm2 restart all

# Verificar logs
pm2 logs brisalog --lines 50
```

---

## 🧪 Testar se funcionou

1. Acesse: https://brisalog-agenda.online/dashboard-gestao.html
2. Clique em "Gerar Link Público"
3. Preencha os dados e clique em "Confirmar"
4. Abra o Console do navegador (F12) e veja os logs:
   ```
   🔍 [Debug] Gerando link com payload: {...}
   ✅ [Debug] Link gerado com sucesso: {...}
   ```

Se ainda der erro, veja os logs do servidor:
```bash
pm2 logs brisalog --lines 100 --err
```

---

## ⚠️ Diferenças Importantes

| ❌ Nome ERRADO           | ✅ Nome CORRETO         |
|--------------------------|-------------------------|
| `"RelatorioPublico"`     | `relatorios_publicos`   |
| PascalCase com aspas     | snake_case sem aspas    |
| Singular                 | Plural                  |

**O Prisma usa `@@map("relatorios_publicos")` no schema, então a tabela DEVE ter este nome exato!**

---

## 📝 SQL Completo (Copiar e Colar Tudo de Uma Vez)

```sql
-- Limpar tabela antiga
DROP TABLE IF EXISTS "RelatorioPublico" CASCADE;

-- Criar tabela correta
CREATE TABLE IF NOT EXISTS relatorios_publicos (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    filtros TEXT NOT NULL,
    "criadoPor" VARCHAR(255) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEm" TIMESTAMP(3),
    acessos INTEGER NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS relatorios_publicos_token_idx ON relatorios_publicos(token);
CREATE INDEX IF NOT EXISTS relatorios_publicos_criadoPor_idx ON relatorios_publicos("criadoPor");
CREATE INDEX IF NOT EXISTS relatorios_publicos_ativo_idx ON relatorios_publicos(ativo);

-- Permissões
GRANT ALL PRIVILEGES ON TABLE relatorios_publicos TO postgres;
GRANT ALL PRIVILEGES ON SEQUENCE relatorios_publicos_id_seq TO postgres;

-- Verificar
SELECT COUNT(*) as total_colunas FROM information_schema.columns WHERE table_name = 'relatorios_publicos';
-- Deve retornar: total_colunas = 11
```

Depois de executar, saia com `\q` e rode:
```bash
pm2 restart all
```

🎉 **Pronto! Agora os links públicos devem funcionar!**
