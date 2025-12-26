# Comandos SQL - Sistema de Usuários com "Todos os CDs"

Execute estes comandos SQL no banco de dados PostgreSQL do VPS na ordem apresentada:

## 1. Migração da tabela usuarios (Permitir cdId = 'TODOS')

```sql
-- Passo 1: Adicionar nova coluna cdId como String
ALTER TABLE usuarios ADD COLUMN "cdIdTemp" VARCHAR(50);

-- Passo 2: Copiar valores existentes para a nova coluna
UPDATE usuarios SET "cdIdTemp" = CAST("cdId" AS VARCHAR) WHERE "cdId" IS NOT NULL;

-- Passo 3: Adicionar coluna cdIdNumerico
ALTER TABLE usuarios ADD COLUMN "cdIdNumerico" INTEGER;

-- Passo 4: Copiar valores existentes para cdIdNumerico
UPDATE usuarios SET "cdIdNumerico" = "cdId";

-- Passo 5: Remover constraint da coluna antiga cdId
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_cdId_fkey;

-- Passo 6: Remover coluna antiga cdId
ALTER TABLE usuarios DROP COLUMN "cdId";

-- Passo 7: Renomear cdIdTemp para cdId
ALTER TABLE usuarios RENAME COLUMN "cdIdTemp" TO "cdId";

-- Passo 8: Adicionar constraint para cdIdNumerico
ALTER TABLE usuarios ADD CONSTRAINT usuarios_cdIdNumerico_fkey 
    FOREIGN KEY ("cdIdNumerico") REFERENCES cds(id) ON DELETE SET NULL ON UPDATE CASCADE;
```

## 2. Verificar a migração

```sql
-- Ver estrutura da tabela usuarios
\d usuarios

-- Ver todos os usuários
SELECT id, nome, codigo, "cdId", "cdIdNumerico", cargo, ativo FROM usuarios;
```

---

## Funcionalidades Implementadas

### ✅ Frontend (dashboard-admin.html + dashboard-admin.js)

1. **Select de CD filtrado:**
   - Mostra apenas CDs reais (tipoPerfil = 'cd')
   - Não mostra usuários admin/consultivo na lista

2. **Opção "Todos os CDs":**
   - Aparece em destaque no select (🌐 Todos os CDs)
   - Cor laranja e negrito
   - Valor: 'TODOS'

3. **Exibição na tabela:**
   - Usuários com cdId='TODOS' mostram badge especial
   - Badge com gradiente laranja e emoji 🌐
   - Texto: "🌐 Todos os CDs"

4. **Filtros:**
   - Usuários com acesso a "Todos os CDs" aparecem em qualquer filtro de CD

### ✅ Backend (usuariosRoutes.js)

1. **Validação de código:**
   - Aceita usuários com cdId='TODOS' em qualquer CD
   - Usuários específicos só podem usar o código no CD vinculado

2. **Criação/Edição:**
   - Campo `cdId` aceita: ID numérico, 'TODOS' ou null
   - Campo `cdIdNumerico` armazena referência ao CD (null se 'TODOS')

3. **Email de boas-vindas:**
   - Exibe "Todos os CDs" quando cdId='TODOS'
   - Exibe nome do CD específico quando vinculado

### ✅ Database (schema.prisma)

1. **Campos:**
   - `cdId` (String): Pode ser ID ou "TODOS"
   - `cdIdNumerico` (Int): Referência foreign key ao CD
   - `cd` (Relation): Relacionamento com tabela CDs

---

## Como Testar

### 1. Criar usuário com acesso a Todos os CDs

1. No dashboard admin, clique em "Novo Usuário"
2. Preencha os dados
3. No campo "Centro de Distribuição", selecione "🌐 Todos os CDs"
4. Clique em "Salvar Usuário"

### 2. Testar código em diferentes CDs

1. Faça login em qualquer CD
2. Use o código do usuário criado
3. O código deve funcionar em todos os CDs

### 3. Verificar exibição

1. Na lista de usuários, o badge deve aparecer como "🌐 Todos os CDs"
2. O badge deve ter gradiente laranja
3. Filtrar por qualquer CD deve mostrar esse usuário

---

## Observações Importantes

⚠️ **Migração obrigatória**: Execute os comandos SQL antes de usar a funcionalidade

✅ **Compatibilidade**: Usuários existentes continuarão funcionando normalmente

✅ **Emails**: Sistema envia email informando "Todos os CDs" quando aplicável

✅ **Validação**: Backend impede acesso indevido mesmo com código válido
