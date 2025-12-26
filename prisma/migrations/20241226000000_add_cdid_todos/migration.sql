-- Adicionar nova coluna cdId como String
ALTER TABLE usuarios ADD COLUMN "cdIdTemp" VARCHAR(50);

-- Copiar valores existentes para a nova coluna
UPDATE usuarios SET "cdIdTemp" = CAST("cdId" AS VARCHAR) WHERE "cdId" IS NOT NULL;

-- Adicionar coluna cdIdNumerico
ALTER TABLE usuarios ADD COLUMN "cdIdNumerico" INTEGER;

-- Copiar valores existentes para cdIdNumerico
UPDATE usuarios SET "cdIdNumerico" = "cdId";

-- Remover constraint da coluna antiga cdId
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_cdId_fkey;

-- Remover coluna antiga cdId
ALTER TABLE usuarios DROP COLUMN "cdId";

-- Renomear cdIdTemp para cdId
ALTER TABLE usuarios RENAME COLUMN "cdIdTemp" TO "cdId";

-- Adicionar constraint para cdIdNumerico
ALTER TABLE usuarios ADD CONSTRAINT usuarios_cdIdNumerico_fkey 
    FOREIGN KEY ("cdIdNumerico") REFERENCES cds(id) ON DELETE SET NULL ON UPDATE CASCADE;
