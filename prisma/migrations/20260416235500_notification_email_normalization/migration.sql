ALTER TABLE "EmailNotificacao"
ADD COLUMN "emailNormalizado" TEXT;

UPDATE "EmailNotificacao"
SET "emailNormalizado" = LOWER(TRIM("email"))
WHERE "emailNormalizado" IS NULL;

ALTER TABLE "EmailNotificacao"
ALTER COLUMN "emailNormalizado" SET NOT NULL;

DROP INDEX IF EXISTS "EmailNotificacao_condominioId_email_key";

CREATE UNIQUE INDEX "EmailNotificacao_condominioId_emailNormalizado_key"
ON "EmailNotificacao"("condominioId", "emailNormalizado");
