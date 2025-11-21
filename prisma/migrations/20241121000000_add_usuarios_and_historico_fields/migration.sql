-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "email" TEXT,
    "cargo" TEXT,
    "cdId" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "historico_acoes" ADD COLUMN "autor" TEXT;
ALTER TABLE "historico_acoes" ADD COLUMN "codigoUsuario" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_codigo_key" ON "usuarios"("codigo");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_cdId_fkey" FOREIGN KEY ("cdId") REFERENCES "cds"("id") ON DELETE SET NULL ON UPDATE CASCADE;
