-- CreateTable
CREATE TABLE "EmailNotificacao" (
    "id" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailNotificacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailNotificacao_condominioId_idx" ON "EmailNotificacao"("condominioId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailNotificacao_condominioId_email_key" ON "EmailNotificacao"("condominioId", "email");

-- AddForeignKey
ALTER TABLE "EmailNotificacao" ADD CONSTRAINT "EmailNotificacao_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
