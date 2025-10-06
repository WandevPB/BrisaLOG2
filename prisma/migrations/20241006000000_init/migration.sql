-- CreateTable
CREATE TABLE "cds" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "emailRecuperacao" TEXT,
    "primeiroLogin" BOOLEAN NOT NULL DEFAULT true,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendamentos" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "dataEntrega" TIMESTAMP(3) NOT NULL,
    "horarioEntrega" TEXT NOT NULL,
    "tipoCarga" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "tipoRegistro" TEXT NOT NULL DEFAULT 'agendamento',
    "observacoes" TEXT,
    "dataSugestaoCD" TIMESTAMP(3),
    "horarioSugestaoCD" TEXT,
    "motivoNaoVeio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cdId" INTEGER NOT NULL,
    "fornecedorId" INTEGER NOT NULL,

    CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_fiscais" (
    "id" SERIAL NOT NULL,
    "numeroPedido" TEXT NOT NULL,
    "numeroNF" TEXT NOT NULL,
    "serie" TEXT,
    "valor" TEXT,
    "arquivoPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "agendamentoId" INTEGER NOT NULL,

    CONSTRAINT "notas_fiscais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_acoes" (
    "id" SERIAL NOT NULL,
    "acao" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataAnterior" TIMESTAMP(3),
    "dataNova" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agendamentoId" INTEGER NOT NULL,
    "cdId" INTEGER NOT NULL,

    CONSTRAINT "historico_acoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloqueios_horarios" (
    "id" SERIAL NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "horarioInicio" TEXT NOT NULL,
    "horarioFim" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cdId" INTEGER NOT NULL,

    CONSTRAINT "bloqueios_horarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respostas_reagendamento" (
    "id" SERIAL NOT NULL,
    "resposta" TEXT NOT NULL,
    "comentario" TEXT,
    "novaData" TIMESTAMP(3),
    "novoHorario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agendamentoId" INTEGER NOT NULL,

    CONSTRAINT "respostas_reagendamento_pkey" PRIMARY KEY ("id")
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

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_cdId_fkey" FOREIGN KEY ("cdId") REFERENCES "cds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "agendamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_acoes" ADD CONSTRAINT "historico_acoes_cdId_fkey" FOREIGN KEY ("cdId") REFERENCES "cds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_acoes" ADD CONSTRAINT "historico_acoes_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "agendamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueios_horarios" ADD CONSTRAINT "bloqueios_horarios_cdId_fkey" FOREIGN KEY ("cdId") REFERENCES "cds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respostas_reagendamento" ADD CONSTRAINT "respostas_reagendamento_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "agendamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;