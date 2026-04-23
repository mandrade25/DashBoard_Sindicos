import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_INITIAL_EMAIL?.trim() || "admin@minimerx.com.br";
  const senha = process.env.ADMIN_INITIAL_PASSWORD?.trim();

  if (!senha || senha.length < 12) {
    throw new Error(
      "Defina ADMIN_INITIAL_PASSWORD com pelo menos 12 caracteres antes de rodar o seed.",
    );
  }

  const senhaHash = await bcrypt.hash(senha, 12);

  await prisma.usuario.upsert({
    where: { email },
    update: {},
    create: {
      nome: "Administrador MiniMerX",
      email,
      senhaHash,
      role: "ADMIN",
      condominioId: null,
    },
  });

  console.log(`Seed concluido. Admin bootstrap atualizado para ${email}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
