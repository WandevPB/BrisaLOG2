-- CreateTable
CREATE TABLE "cds" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "emailRecuperacao" TEXT,
    "primeiroLogin" BOOLEAN NOT NULL DEFAULT true,
    "resetToken" TEXT,
    "resetTokenExpiry" DATETIME,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "agendamentos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "dataEntrega" DATETIME NOT NULL,
    "horarioEntrega" TEXT NOT NULL,
    "tipoCarga" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "cdId" INTEGER NOT NULL,
    "fornecedorId" INTEGER NOT NULL,
    CONSTRAINT "agendamentos_cdId_fkey" FOREIGN KEY ("cdId") REFERENCES "cds" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agendamentos_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notas_fiscais" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numeroPedido" TEXT NOT NULL,
    "numeroNF" TEXT NOT NULL,
    "serie" TEXT,
    "valor" TEXT,
    "arquivoPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "agendamentoId" INTEGER NOT NULL,
    CONSTRAINT "notas_fiscais_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "agendamentos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "historico_acoes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "acao" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataAnterior" DATETIME,
    "dataNova" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agendamentoId" INTEGER NOT NULL,
    "cdId" INTEGER NOT NULL,
    CONSTRAINT "historico_acoes_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "agendamentos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "historico_acoes_cdId_fkey" FOREIGN KEY ("cdId") REFERENCES "cds" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bloqueios_horarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dataBloqueio" DATETIME NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "cdId" INTEGER NOT NULL,
    CONSTRAINT "bloqueios_horarios_cdId_fkey" FOREIGN KEY ("cdId") REFERENCES "cds" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "respostas_reagendamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "resposta" TEXT NOT NULL,
    "comentario" TEXT,
    "novaData" DATETIME,
    "novoHorario" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agendamentoId" INTEGER NOT NULL,
    CONSTRAINT "respostas_reagendamento_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "agendamentos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "cds_nome_key" ON "cds"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "cds_usuario_key" ON "cds"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "fornecedores_email_key" ON "fornecedores"("email");

-- CreateIndex
CREATE UNIQUE INDEX "fornecedores_documento_key" ON "fornecedores"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "agendamentos_codigo_key" ON "agendamentos"("codigo");
