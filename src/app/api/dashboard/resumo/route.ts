import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { assertAcessoCondominio, getResumo } from "@/lib/dashboard-queries";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const condominioId = searchParams.get("condominioId");
  if (!condominioId) {
    return NextResponse.json({ error: "condominioId ausente" }, { status: 400 });
  }

  const autorizado = await assertAcessoCondominio(
    session.user.role,
    session.user.condominioIds ?? [],
    condominioId,
  );
  if (!autorizado) return NextResponse.json({ error: "Proibido" }, { status: 403 });

  const resumo = await getResumo(condominioId);
  if (!resumo) return NextResponse.json({ error: "Condomínio não encontrado" }, { status: 404 });

  return NextResponse.json(resumo);
}
