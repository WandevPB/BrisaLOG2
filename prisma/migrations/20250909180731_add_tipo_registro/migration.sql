/*
  Warnings:

  - You are about to drop the column `dataBloqueio` on the `bloqueios_horarios` table. All the data in the column will be lost.
  - You are about to drop the column `horaFim` on the `bloqueios_horarios` table. All the data in the column will be lost.
  - You are about to drop the column `horaInicio` on the `bloqueios_horarios` table. All the data in the column will be lost.
  - Added the required column `dataFim` to the `bloqueios_horarios` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dataInicio` to the `bloqueios_horarios` table without a default value. This is not possible if the table is not empty.
  - Added the required column `horarioFim` to the `bloqueios_horarios` table without a default value. This is not possible if the table is not empty.
  - Added the required column `horarioInicio` to the `bloqueios_horarios` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_agendamentos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "dataEntrega" DATETIME NOT NULL,
    "horarioEntrega" TEXT NOT NULL,
    "tipoCarga" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "tipoRegistro" TEXT NOT NULL DEFAULT 'agendamento',
    "observacoes" TEXT,
    "dataSugestaoCD" DATETIME,
    "horarioSugestaoCD" TEXT,
    "motivoNaoVeio" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "cdId" INTEGER NOT NULL,
    "fornecedorId" INTEGER NOT NULL,
    CONSTRAINT "agendamentos_cdId_fkey" FOREIGN KEY ("cdId") REFERENCES "cds" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agendamentos_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_agendamentos" ("cdId", "codigo", "createdAt", "dataEntrega", "dataSugestaoCD", "fornecedorId", "horarioEntrega", "horarioSugestaoCD", "id", "motivoNaoVeio", "observacoes", "status", "tipoCarga", "updatedAt") SELECT "cdId", "codigo", "createdAt", "dataEntrega", "dataSugestaoCD", "fornecedorId", "horarioEntrega", "horarioSugestaoCD", "id", "motivoNaoVeio", "observacoes", "status", "tipoCarga", "updatedAt" FROM "agendamentos";
DROP TABLE "agendamentos";
ALTER TABLE "new_agendamentos" RENAME TO "agendamentos";
CREATE UNIQUE INDEX "agendamentos_codigo_key" ON "agendamentos"("codigo");
CREATE TABLE "new_bloqueios_horarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dataInicio" DATETIME NOT NULL,
    "dataFim" DATETIME NOT NULL,
    "horarioInicio" TEXT NOT NULL,
    "horarioFim" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "cdId" INTEGER NOT NULL,
    CONSTRAINT "bloqueios_horarios_cdId_fkey" FOREIGN KEY ("cdId") REFERENCES "cds" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_bloqueios_horarios" ("ativo", "cdId", "createdAt", "id", "motivo", "updatedAt") SELECT "ativo", "cdId", "createdAt", "id", "motivo", "updatedAt" FROM "bloqueios_horarios";
DROP TABLE "bloqueios_horarios";
ALTER TABLE "new_bloqueios_horarios" RENAME TO "bloqueios_horarios";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
