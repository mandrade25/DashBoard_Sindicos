import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AlterarSenhaView } from "./alterar-senha-view";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <AlterarSenhaView usuarioNome={session.user.name ?? ""} />;
}
