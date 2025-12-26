# Comandos SQL para CD Torre

Execute estes comandos SQL no banco de dados PostgreSQL do VPS na ordem apresentada:

## 1. Adicionar coluna tipoCD na tabela cds

```sql
ALTER TABLE cds ADD COLUMN "tipoCD" VARCHAR(50) DEFAULT 'normal';
```

## 2. Criar o CD Lagoa Nova (Torre)

```sql
INSERT INTO cds (
    nome, 
    usuario, 
    senha, 
    "tipoPerfil", 
    "tipoCD", 
    "codigoGod", 
    ativo, 
    "recebeNotificacoes", 
    "createdAt", 
    "updatedAt"
) VALUES (
    'Lagoa Nova (Torre)', 
    'lagoanova-torre', 
    '$2a$10$ujpNcFt8z0ueBf1wPA4f8ut4zc5dB7JNyovs/bLK5j3us76b8RTZm', 
    'cd', 
    'torre', 
    NULL, 
    true, 
    true, 
    NOW(), 
    NOW()
);
```

## Credenciais do novo CD

- **Usuário:** lagoanova-torre
- **Senha:** BrisaLOG2025
- **Tipo:** torre

## Como executar no VPS

1. Conecte ao PostgreSQL:
```bash
psql -U seu_usuario -d nome_do_banco
```

2. Execute os comandos SQL acima na ordem

3. Verifique a criação:
```sql
SELECT id, nome, usuario, "tipoCD", ativo FROM cds WHERE "tipoCD" = 'torre';
```

## Validação

Após executar os comandos:
1. Acesse a página de agendamento
2. Selecione "Lagoa Nova (Torre)" no campo CD de Destino
3. Você deve ver apenas os horários 08:00 e 13:00
4. Deve aparecer um aviso em laranja explicando a restrição

## Funcionalidades Implementadas

✅ **Backend:**
- Validação que permite apenas horários 08:00 ou 13:00 para CD Torre
- Verifica se já existe agendamento no mesmo turno (manhã ou tarde)
- Retorna mensagem específica com horário alternativo se turno estiver ocupado

✅ **Frontend:**
- Filtro automático de horários quando CD Torre é selecionado
- Aviso visual sobre restrições do CD Torre
- Opções mostram apenas "08:00 (Turno da Manhã)" e "13:00 (Turno da Tarde)"

✅ **Database:**
- Nova coluna `tipoCD` com valores: 'normal' ou 'torre'
- CDs existentes automaticamente marcados como 'normal'
