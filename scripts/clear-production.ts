import fs from "fs";
import path from "path";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PRESERVED_ADMIN_EMAIL = "admin@minimerx.com.br";

function resolveUploadsRoot() {
  return process.env.UPLOADS_DIR
    ? path.resolve(process.env.UPLOADS_DIR)
    : path.resolve(process.cwd(), "uploads");
}

function assertProductionEnvironment() {
  if (process.env.NODE_ENV !== "production") {
    throw new Error("Abortado: NODE_ENV precisa ser 'production'.");
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Abortado: DATABASE_URL nao definida.");
  }

  const url = new URL(databaseUrl);
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    throw new Error(
      `Abortado: DATABASE_URL aponta para '${url.hostname}'. Rode isso apenas no ambiente remoto do EasyPanel/Hostinger.`,
    );
  }

  return {
    host: url.hostname,
    port: url.port || "default",
    name: url.pathname.replace(/^\//, ""),
  };
}

async function main() {
  const database = assertProductionEnvironment();

  const admins = await prisma.usuario.findMany({
    where: { role: "ADMIN" },
    select: { id: true, email: true, nome: true },
  });

  if (admins.length !== 1 || admins[0]?.email !== PRESERVED_ADMIN_EMAIL) {
    throw new Error(
      `Abortado: esperado exatamente 1 admin (${PRESERVED_ADMIN_EMAIL}). Encontrados: ${JSON.stringify(admins)}`,
    );
  }

  const condominioIds = (
    await prisma.condominio.findMany({
      select: { id: true },
    })
  ).map((item) => item.id);

  const before = {
    usuarios: await prisma.usuario.count(),
    condominios: await prisma.condominio.count(),
    acessos: await prisma.usuarioCondominio.count(),
    vendas: await prisma.venda.count(),
    auditLogs: await prisma.auditLog.count(),
    comprovantes: await prisma.comprovante.count(),
    envios: await prisma.envioEmail.count(),
    destinatarios: await prisma.envioDestinatario.count(),
    emailsNotificacao: await prisma.emailNotificacao.count(),
  };

  const deleted = await prisma.$transaction(async (tx) => {
    const destinatarios = await tx.envioDestinatario.deleteMany({});
    const envios = await tx.envioEmail.deleteMany({});
    const comprovantes = await tx.comprovante.deleteMany({});
    const auditLogs = await tx.auditLog.deleteMany({});
    const emailsNotificacao = await tx.emailNotificacao.deleteMany({});
    const vendas = await tx.venda.deleteMany({});
    const acessos = await tx.usuarioCondominio.deleteMany({});
    const usuarios = await tx.usuario.deleteMany({
      where: { NOT: { id: admins[0].id } },
    });
    const condominios = await tx.condominio.deleteMany({});

    return {
      destinatarios: destinatarios.count,
      envios: envios.count,
      comprovantes: comprovantes.count,
      auditLogs: auditLogs.count,
      emailsNotificacao: emailsNotificacao.count,
      vendas: vendas.count,
      acessos: acessos.count,
      usuarios: usuarios.count,
      condominios: condominios.count,
    };
  });

  const uploadsRoot = resolveUploadsRoot();
  const uploadsRemoved: string[] = [];
  for (const condominioId of condominioIds) {
    const fullPath = path.join(uploadsRoot, condominioId);
    if (!fs.existsSync(fullPath)) continue;
    fs.rmSync(fullPath, { recursive: true, force: true });
    uploadsRemoved.push(fullPath);
  }

  const after = {
    usuarios: await prisma.usuario.count(),
    condominios: await prisma.condominio.count(),
    acessos: await prisma.usuarioCondominio.count(),
    vendas: await prisma.venda.count(),
    auditLogs: await prisma.auditLog.count(),
    comprovantes: await prisma.comprovante.count(),
    envios: await prisma.envioEmail.count(),
    destinatarios: await prisma.envioDestinatario.count(),
    emailsNotificacao: await prisma.emailNotificacao.count(),
  };

  console.log(
    JSON.stringify(
      {
        database,
        preservedAdmin: admins[0],
        before,
        deleted,
        uploadsRemoved,
        after,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
