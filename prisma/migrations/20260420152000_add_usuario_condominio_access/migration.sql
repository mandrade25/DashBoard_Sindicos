CREATE TABLE "UsuarioCondominio" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsuarioCondominio_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UsuarioCondominio_usuarioId_condominioId_key" ON "UsuarioCondominio"("usuarioId", "condominioId");
CREATE INDEX "UsuarioCondominio_condominioId_idx" ON "UsuarioCondominio"("condominioId");

ALTER TABLE "UsuarioCondominio"
ADD CONSTRAINT "UsuarioCondominio_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UsuarioCondominio"
ADD CONSTRAINT "UsuarioCondominio_condominioId_fkey"
FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "UsuarioCondominio" ("id", "usuarioId", "condominioId", "criadoEm")
SELECT
    'link_' || md5("id" || '-' || "condominioId"),
    "id",
    "condominioId",
    CURRENT_TIMESTAMP
FROM "Usuario"
WHERE "condominioId" IS NOT NULL
ON CONFLICT ("usuarioId", "condominioId") DO NOTHING;
