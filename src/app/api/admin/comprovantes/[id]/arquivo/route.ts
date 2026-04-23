import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFileFromStorage } from "@/lib/storage";
import { logAudit, getIp } from "@/lib/audit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { id } = await params;
  const comp = await prisma.comprovante.findUnique({ where: { id } });
  if (!comp) return NextResponse.json({ error: "Nao encontrado." }, { status: 404 });

  if (session.user.role === "SINDICO" && session.user.condominioId !== comp.condominioId) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  if (session.user.role === "SINDICO" && !comp.visivelSindico) {
    return NextResponse.json({ error: "Arquivo nao disponivel." }, { status: 403 });
  }

  const buffer = await readFileFromStorage(comp.caminhoArquivo).catch(() => null);
  if (!buffer) return NextResponse.json({ error: "Arquivo nao encontrado no servidor." }, { status: 404 });

  await logAudit({
    tipo: "COMPROVANTE_BAIXADO",
    entidade: "Comprovante",
    entidadeId: comp.id,
    usuarioId: session.user.id,
    usuarioRole: session.user.role,
    descricao: "Arquivo do comprovante baixado",
    ip: getIp(req),
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": comp.mimeType,
      "Content-Disposition": `attachment; filename="${comp.nomeArquivo}"`,
    },
  });
}
