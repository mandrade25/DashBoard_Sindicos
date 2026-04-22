-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('PIX', 'TED', 'DOC', 'TRANSFERENCIA_INTERNA', 'OUTRO');

-- CreateEnum
CREATE TYPE "ComprovanteStatus" AS ENUM ('PENDENTE', 'ANEXADO', 'ENVIADO', 'SUBSTITUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EnvioStatus" AS ENUM ('PENDENTE', 'AGENDADO', 'ENVIADO', 'ENTREGUE', 'FALHOU', 'REENVIADO');

-- CreateEnum
CREATE TYPE "DestinatarioStatus" AS ENUM ('PENDENTE', 'ENVIADO', 'ENTREGUE', 'FALHOU');

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "usuarioRole" TEXT,
    "descricao" TEXT NOT NULL,
    "payload" JSONB,
    "ip" TEXT,
    "criadoEm" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comprovante" (
    "id" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "competencia" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "caminhoArquivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "hashArquivo" TEXT NOT NULL,
    "valorRepasse" NUMERIC NOT NULL,
    "dataPagamento" DATE NOT NULL,
    "formaPagamento" "FormaPagamento" NOT NULL,
    "bancoOrigem" TEXT,
    "bancoDestino" TEXT,
    "idTransacaoBanco" TEXT,
    "observacao" TEXT,
    "visivelSindico" BOOLEAN NOT NULL DEFAULT false,
    "status" "ComprovanteStatus" NOT NULL DEFAULT 'ANEXADO',
    "justificativa" TEXT,
    "criadoPorId" TEXT,
    "versaoAnteriorId" TEXT,
    "criadoEm" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP NOT NULL,

    CONSTRAINT "Comprovante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvioEmail" (
    "id" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "competencia" TEXT NOT NULL,
    "comprovanteId" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "observacao" TEXT,
    "status" "EnvioStatus" NOT NULL DEFAULT 'PENDENTE',
    "agendadoPara" TIMESTAMP,
    "enviadoEm" TIMESTAMP,
    "criadoPorId" TEXT,
    "reenvioDeId" TEXT,
    "criadoEm" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP NOT NULL,

    CONSTRAINT "EnvioEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvioDestinatario" (
    "id" TEXT NOT NULL,
    "envioId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "DestinatarioStatus" NOT NULL DEFAULT 'PENDENTE',
    "erro" TEXT,
    "criadoEm" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnvioDestinatario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_entidade_entidadeId_idx" ON "AuditLog"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "AuditLog_criadoEm_idx" ON "AuditLog"("criadoEm");

-- CreateIndex
CREATE INDEX "Comprovante_condominioId_competencia_idx" ON "Comprovante"("condominioId", "competencia");

-- CreateIndex
CREATE INDEX "Comprovante_status_idx" ON "Comprovante"("status");

-- CreateIndex
CREATE INDEX "EnvioEmail_condominioId_competencia_idx" ON "EnvioEmail"("condominioId", "competencia");

-- CreateIndex
CREATE INDEX "EnvioDestinatario_envioId_idx" ON "EnvioDestinatario"("envioId");

-- AddForeignKey
ALTER TABLE "Comprovante" ADD CONSTRAINT "Comprovante_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comprovante" ADD CONSTRAINT "Comprovante_versaoAnteriorId_fkey" FOREIGN KEY ("versaoAnteriorId") REFERENCES "Comprovante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvioEmail" ADD CONSTRAINT "EnvioEmail_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvioEmail" ADD CONSTRAINT "EnvioEmail_comprovanteId_fkey" FOREIGN KEY ("comprovanteId") REFERENCES "Comprovante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvioEmail" ADD CONSTRAINT "EnvioEmail_reenvioDeId_fkey" FOREIGN KEY ("reenvioDeId") REFERENCES "EnvioEmail"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvioDestinatario" ADD CONSTRAINT "EnvioDestinatario_envioId_fkey" FOREIGN KEY ("envioId") REFERENCES "EnvioEmail"("id") ON DELETE CASCADE ON UPDATE CASCADE;
