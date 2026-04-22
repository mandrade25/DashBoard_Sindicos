-- AlterTable: adicionar dataInicio ao Condominio
ALTER TABLE "Condominio" ADD COLUMN "dataInicio" DATE NOT NULL DEFAULT NOW();

-- Retroativamente, usar o início do mês de criadoEm para registros existentes
UPDATE "Condominio" SET "dataInicio" = DATE_TRUNC('month', "criadoEm");
