import { NextResponse } from "next/server";
import JSZip from "jszip";
import { auth } from "@/lib/auth";
import { hasCondominioAccess } from "@/lib/condominio-access";
import { prisma } from "@/lib/prisma";
import { readFileFromStorage } from "@/lib/storage";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const condominioId = searchParams.get("condominioId");
  const competencia = searchParams.get("competencia");

  if (!condominioId || !competencia) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  const isSindico = session.user.role === "SINDICO";

  if (!hasCondominioAccess(session.user, condominioId)) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const comprovantes = await prisma.comprovante.findMany({
    where: { condominioId, competencia, status: { not: "CANCELADO" } },
    include: { condominio: { select: { nome: true } } },
    orderBy: { criadoEm: "asc" },
  });

  if (comprovantes.length === 0) {
    return NextResponse.json({ error: "Nenhum arquivo disponível." }, { status: 404 });
  }

  // Síndico só acessa se ao menos 1 arquivo da competência foi marcado como visível
  if (isSindico && !comprovantes.some((c) => c.visivelSindico)) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const zip = new JSZip();

  const usedNames = new Set<string>();
  for (const comp of comprovantes) {
    const buffer = await readFileFromStorage(comp.caminhoArquivo).catch(() => null);
    if (!buffer) continue;

    let filename = comp.nomeArquivo;
    if (usedNames.has(filename)) {
      const ext = filename.lastIndexOf(".");
      const base = ext !== -1 ? filename.slice(0, ext) : filename;
      const suffix = ext !== -1 ? filename.slice(ext) : "";
      let i = 2;
      while (usedNames.has(`${base}_${i}${suffix}`)) i++;
      filename = `${base}_${i}${suffix}`;
    }
    usedNames.add(filename);
    zip.file(filename, buffer);
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const condominioNome = comprovantes[0].condominio.nome.replace(/[^a-zA-Z0-9]/g, "_");
  const zipFilename = `comprovantes_${condominioNome}_${competencia}.zip`;

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipFilename}"`,
    },
  });
}
