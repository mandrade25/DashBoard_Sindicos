import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { assertAcessoCondominio, getVendas } from "@/lib/dashboard-queries";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const condominioId = searchParams.get("condominioId");
  const period = (searchParams.get("period") ?? "month") as "week" | "month" | "year";

  if (!condominioId) {
    return NextResponse.json({ error: "condominioId ausente" }, { status: 400 });
  }
  if (!["week", "month", "year"].includes(period)) {
    return NextResponse.json({ error: "period inválido" }, { status: 400 });
  }

  const autorizado = await assertAcessoCondominio(
    session.user.role,
    session.user.condominioId,
    condominioId,
  );
  if (!autorizado) return NextResponse.json({ error: "Proibido" }, { status: 403 });

  const data = await getVendas(condominioId, period);
  return NextResponse.json(data);
}
