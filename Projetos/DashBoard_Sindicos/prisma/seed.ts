import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@minimerx.com.br";
  const senhaHash = await bcrypt.hash("MiniMerX@2026", 12);

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

  console.log(`Seed concluído. Admin: ${email} / senha: MiniMerX@2026`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
