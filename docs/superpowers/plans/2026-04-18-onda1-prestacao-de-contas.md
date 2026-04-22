# Onda 1 — Prestação de Contas (Comprovantes + E-mail + Histórico) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que a equipe administrativa execute o ciclo mensal completo dentro da plataforma: upload de comprovante de repasse → envio de e-mail formal com comprovante → histórico auditável acessível ao síndico.

**Architecture:** Cada competência mensal (`"YYYY-MM"`) é a unidade de agrupamento. Um `Comprovante` é vinculado à competência e ao condomínio; um `EnvioEmail` referencia o comprovante e registra os destinatários. Um `AuditLog` imutável registra todos os eventos relevantes. Arquivos de comprovante são salvos em `uploads/comprovantes/` (fora do `public/`) e servidos via API route autenticada.

**Tech Stack:** Next.js 14 App Router, Prisma + PostgreSQL, NextAuth v5 (JWT), shadcn/ui, Tailwind CSS, nodemailer (SMTP), zod, date-fns, TypeScript.

**Nota sobre testes:** O projeto não tem framework de testes. Cada task usa `npm run build` como verificação de tipos e descreve cenários de teste manual.

---

## Mapa de Arquivos

### Criados
- `prisma/schema.prisma` — adicionar: `AuditLog`, `Comprovante`, `EnvioEmail`, `EnvioDestinatario` + enums
- `prisma/migrations/<timestamp>_onda1/migration.sql` — gerado automaticamente
- `src/lib/audit.ts` — helper `logAudit()` para gravar eventos
- `src/lib/storage.ts` — `saveFile()`, `deleteFile()`, `getFilePath()`
- `src/lib/email-sender.ts` — `sendComprovante()` via nodemailer
- `src/lib/competencia.ts` — `competenciaLabel()`, `parseCompetencia()`, helpers de formatação
- `src/app/api/admin/comprovantes/route.ts` — GET (listar), POST (upload)
- `src/app/api/admin/comprovantes/[id]/route.ts` — GET (detalhe), PUT (substituir), DELETE (cancelar)
- `src/app/api/admin/comprovantes/[id]/arquivo/route.ts` — GET (download autenticado)
- `src/app/api/admin/envios/route.ts` — POST (enviar e-mail)
- `src/app/api/admin/envios/[id]/reenvio/route.ts` — POST (reenviar)
- `src/app/api/historico/route.ts` — GET competências com status (ADMIN vê todos, SINDICO vê o seu)
- `src/app/api/admin/pendencias/route.ts` — GET alertas/pendências
- `src/app/(dashboard)/admin/comprovantes/page.tsx` — Server Component
- `src/app/(dashboard)/admin/comprovantes/comprovantes-view.tsx` — Client Component
- `src/app/(dashboard)/historico/page.tsx` — Server Component
- `src/app/(dashboard)/historico/historico-view.tsx` — Client Component
- `src/components/EnvioEmailModal.tsx` — modal de envio reutilizável

### Modificados
- `prisma/schema.prisma` — adicionar relações em `Condominio`
- `src/middleware.ts` — adicionar `/historico` ao matcher; já protege `/api/admin`
- `src/components/AppSidebar.tsx` — adicionar "Histórico" para SINDICO; "Comprovantes" para ADMIN
- `.env.example` — adicionar vars SMTP e UPLOADS_DIR
- `src/app/(dashboard)/layout.tsx` — passar badge de pendências (opcional, task 13)

---

## Task 1: Schema Prisma — Novos Models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Adicionar enums no final do schema**

```prisma
enum FormaPagamento {
  PIX
  TED
  DOC
  TRANSFERENCIA_INTERNA
  OUTRO
}

enum ComprovanteStatus {
  PENDENTE
  ANEXADO
  ENVIADO
  SUBSTITUIDO
  CANCELADO
}

enum EnvioStatus {
  PENDENTE
  AGENDADO
  ENVIADO
  ENTREGUE
  FALHOU
  REENVIADO
}

enum DestinatarioStatus {
  PENDENTE
  ENVIADO
  ENTREGUE
  FALHOU
}
```

- [ ] **Step 2: Adicionar model AuditLog**

```prisma
model AuditLog {
  id          String   @id @default(cuid())
  tipo        String
  entidade    String
  entidadeId  String
  usuarioId   String?
  usuarioRole String?
  descricao   String
  payload     Json?
  ip          String?
  criadoEm   DateTime @default(now())

  @@index([entidade, entidadeId])
  @@index([criadoEm])
}
```

- [ ] **Step 3: Adicionar model Comprovante**

```prisma
model Comprovante {
  id               String            @id @default(cuid())
  condominioId     String
  competencia      String
  nomeArquivo      String
  caminhoArquivo   String
  mimeType         String
  tamanhoBytes     Int
  hashArquivo      String
  valorRepasse     Decimal           @db.Decimal(10, 2)
  dataPagamento    DateTime          @db.Date
  formaPagamento   FormaPagamento
  bancoOrigem      String?
  bancoDestino     String?
  idTransacaoBanco String?
  observacao       String?
  visivelSindico   Boolean           @default(false)
  status           ComprovanteStatus @default(ANEXADO)
  justificativa    String?
  criadoPorId      String?
  versaoAnteriorId String?
  criadoEm        DateTime          @default(now())
  atualizadoEm    DateTime          @updatedAt

  condominio     Condominio    @relation("CondominioComprovantes", fields: [condominioId], references: [id])
  versaoAnterior Comprovante?  @relation("Versoes", fields: [versaoAnteriorId], references: [id])
  versoes        Comprovante[] @relation("Versoes")
  envios         EnvioEmail[]

  @@index([condominioId, competencia])
  @@index([status])
}
```

- [ ] **Step 4: Adicionar models EnvioEmail e EnvioDestinatario**

```prisma
model EnvioEmail {
  id           String      @id @default(cuid())
  condominioId String
  competencia  String
  comprovanteId String
  assunto      String
  corpo        String      @db.Text
  observacao   String?
  status       EnvioStatus @default(PENDENTE)
  agendadoPara DateTime?
  enviadoEm    DateTime?
  criadoPorId  String?
  reenvioDeId  String?
  criadoEm    DateTime    @default(now())
  atualizadoEm DateTime   @updatedAt

  condominio    Condominio          @relation("CondominioEnvios", fields: [condominioId], references: [id])
  comprovante   Comprovante         @relation(fields: [comprovanteId], references: [id])
  destinatarios EnvioDestinatario[]
  reenvioDe     EnvioEmail?         @relation("Reenvios", fields: [reenvioDeId], references: [id])
  reenvios      EnvioEmail[]        @relation("Reenvios")

  @@index([condominioId, competencia])
}

model EnvioDestinatario {
  id        String             @id @default(cuid())
  envioId   String
  email     String
  status    DestinatarioStatus @default(PENDENTE)
  erro      String?
  criadoEm DateTime           @default(now())

  envio EnvioEmail @relation(fields: [envioId], references: [id], onDelete: Cascade)

  @@index([envioId])
}
```

- [ ] **Step 5: Adicionar relações em Condominio**

No model `Condominio`, adicionar as duas linhas de relação:
```prisma
  comprovantes      Comprovante[]      @relation("CondominioComprovantes")
  envios            EnvioEmail[]       @relation("CondominioEnvios")
```

- [ ] **Step 6: Gerar e aplicar migration**

```bash
cd /c/Dev/Claude/projetos/DashBoard_Sindicos
npx prisma migrate dev --name onda1_prestacao_de_contas
```

Esperado: migration criada em `prisma/migrations/<timestamp>_onda1_prestacao_de_contas/`

- [ ] **Step 7: Verificar tipos gerados**

```bash
npx prisma generate
npm run build
```

Esperado: build sem erros.

- [ ] **Step 8: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add Comprovante, EnvioEmail, AuditLog schema for Onda 1"
```

---

## Task 2: Lib — audit.ts

**Files:**
- Create: `src/lib/audit.ts`

- [ ] **Step 1: Criar helper logAudit**

```typescript
// src/lib/audit.ts
import { prisma } from "@/lib/prisma";

export type AuditTipo =
  | "COMPROVANTE_CRIADO"
  | "COMPROVANTE_SUBSTITUIDO"
  | "COMPROVANTE_CANCELADO"
  | "COMPROVANTE_BAIXADO"
  | "ENVIO_CRIADO"
  | "ENVIO_REENVIADO"
  | "ENVIO_FALHOU"
  | "DESTINATARIO_CADASTRADO"
  | "DESTINATARIO_REMOVIDO";

export interface AuditParams {
  tipo: AuditTipo;
  entidade: string;
  entidadeId: string;
  usuarioId?: string | null;
  usuarioRole?: string | null;
  descricao: string;
  payload?: Record<string, unknown>;
  ip?: string | null;
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tipo: params.tipo,
        entidade: params.entidade,
        entidadeId: params.entidadeId,
        usuarioId: params.usuarioId ?? null,
        usuarioRole: params.usuarioRole ?? null,
        descricao: params.descricao,
        payload: params.payload ?? undefined,
        ip: params.ip ?? null,
      },
    });
  } catch {
    // Falha no audit não deve bloquear a operação — registrar no console
    console.error("[audit] Falha ao gravar AuditLog:", params);
  }
}

export function getIp(req: Request): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npm run build
```

Esperado: build sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/lib/audit.ts
git commit -m "feat: add audit log helper"
```

---

## Task 3: Lib — storage.ts

**Files:**
- Create: `src/lib/storage.ts`

- [ ] **Step 1: Criar helper de armazenamento local**

```typescript
// src/lib/storage.ts
import { createHash } from "crypto";
import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";

const UPLOADS_ROOT = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(process.cwd(), "uploads");

export const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export function computeHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function sanitizeFilename(original: string): string {
  return original
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .toLowerCase();
}

export async function saveFile(params: {
  condominioId: string;
  competencia: string;
  filename: string;
  buffer: Buffer;
}): Promise<{ relativePath: string; hash: string }> {
  const dir = path.join(UPLOADS_ROOT, params.condominioId, params.competencia);
  await mkdir(dir, { recursive: true });

  const hash = computeHash(params.buffer);
  const ext = path.extname(params.filename) || ".bin";
  const storedName = `${Date.now()}_${hash.slice(0, 8)}${ext}`;
  const fullPath = path.join(dir, storedName);

  await writeFile(fullPath, params.buffer);

  const relativePath = path.join(params.condominioId, params.competencia, storedName);
  return { relativePath, hash };
}

export async function readFileFromStorage(relativePath: string): Promise<Buffer> {
  const fullPath = path.join(UPLOADS_ROOT, relativePath);
  return readFile(fullPath);
}

export async function deleteFileFromStorage(relativePath: string): Promise<void> {
  const fullPath = path.join(UPLOADS_ROOT, relativePath);
  await unlink(fullPath).catch(() => {
    // Arquivo já inexistente — não é erro crítico
  });
}
```

- [ ] **Step 2: Adicionar UPLOADS_DIR ao .env.example**

Abrir `.env.example` e adicionar:
```
UPLOADS_DIR=./uploads
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@minimerx.com.br
SMTP_PASS=senha_aqui
SMTP_FROM="MiniMerX <noreply@minimerx.com.br>"
```

- [ ] **Step 3: Adicionar uploads/ ao .gitignore**

Verificar se `uploads/` está no `.gitignore`. Se não estiver, adicionar:
```
uploads/
```

- [ ] **Step 4: Verificar tipos**

```bash
npm run build
```

Esperado: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage.ts .env.example .gitignore
git commit -m "feat: add local file storage helper"
```

---

## Task 4: Deps + Lib — email-sender.ts

**Files:**
- Create: `src/lib/email-sender.ts`

- [ ] **Step 1: Instalar nodemailer**

```bash
cd /c/Dev/Claude/projetos/DashBoard_Sindicos
npm install nodemailer
npm install --save-dev @types/nodemailer
```

- [ ] **Step 2: Criar lib/competencia.ts**

```typescript
// src/lib/competencia.ts
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Converte Date para "YYYY-MM" */
export function toCompetencia(date: Date): string {
  return format(date, "yyyy-MM");
}

/** Converte "YYYY-MM" para label legível: "Março/2026" */
export function competenciaLabel(competencia: string): string {
  const [year, month] = competencia.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  const name = format(d, "MMMM", { locale: ptBR });
  return name.charAt(0).toUpperCase() + name.slice(1) + `/${year}`;
}

/** Valida formato "YYYY-MM" e garante que não é futuro */
export function isValidPastCompetencia(competencia: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(competencia)) return false;
  const [year, month] = competencia.split("-").map(Number);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const nowYM = now.getFullYear() * 100 + (now.getMonth() + 1);
  const cYM = year * 100 + month;
  return cYM <= nowYM;
}

/** Retorna todas as competências desde a primeira venda até o mês atual */
export function competenciasRange(from: string, to: string): string[] {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  const result: string[] = [];
  let y = fy, m = fm;
  while (y * 100 + m <= ty * 100 + tm) {
    result.push(`${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return result;
}
```

- [ ] **Step 3: Criar lib/email-sender.ts**

```typescript
// src/lib/email-sender.ts
import nodemailer from "nodemailer";
import { competenciaLabel } from "@/lib/competencia";
import { formatCurrency } from "@/lib/formatters";

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export interface SendComprovanteParams {
  destinatarios: string[];
  condominioNome: string;
  competencia: string;
  faturamento: number;
  valorRepasse: number;
  percentualRepasse: number;
  dataPagamento: string;
  formaPagamento: string;
  observacao?: string | null;
  comprovante: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
  };
}

export interface SendResult {
  enviados: string[];
  falhas: Array<{ email: string; erro: string }>;
}

export async function sendComprovante(params: SendComprovanteParams): Promise<SendResult> {
  const transporter = createTransport();
  const label = competenciaLabel(params.competencia);

  const htmlBody = buildEmailBody({
    condominioNome: params.condominioNome,
    label,
    faturamento: params.faturamento,
    valorRepasse: params.valorRepasse,
    percentualRepasse: params.percentualRepasse,
    dataPagamento: params.dataPagamento,
    formaPagamento: params.formaPagamento,
    observacao: params.observacao,
  });

  const enviados: string[] = [];
  const falhas: Array<{ email: string; erro: string }> = [];

  for (const email of params.destinatarios) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM ?? "MiniMerX <noreply@minimerx.com.br>",
        to: email,
        subject: `MiniMerX — Repasse ${label} — ${params.condominioNome}`,
        html: htmlBody,
        attachments: [
          {
            filename: params.comprovante.filename,
            content: params.comprovante.buffer,
            contentType: params.comprovante.mimeType,
          },
        ],
      });
      enviados.push(email);
    } catch (err) {
      falhas.push({
        email,
        erro: err instanceof Error ? err.message : "Erro desconhecido",
      });
    }
  }

  return { enviados, falhas };
}

function buildEmailBody(p: {
  condominioNome: string;
  label: string;
  faturamento: number;
  valorRepasse: number;
  percentualRepasse: number;
  dataPagamento: string;
  formaPagamento: string;
  observacao?: string | null;
}): string {
  const obs = p.observacao
    ? `<p style="margin:16px 0;padding:12px;background:#f5f7fa;border-radius:6px;font-size:14px;color:#555;">${p.observacao}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <div style="background:#1e2a5a;padding:28px 32px;">
      <h1 style="margin:0;font-size:22px;color:#fff;">MiniMerX</h1>
      <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,.6);">Prestação de Contas — ${p.label}</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 4px;font-size:13px;color:#8a94a6;text-transform:uppercase;letter-spacing:.04em;">Condomínio</p>
      <p style="margin:0 0 24px;font-size:18px;font-weight:700;color:#1e2a5a;">${p.condominioNome}</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-size:13px;color:#555;">Faturamento do período</td>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-size:15px;font-weight:600;color:#1e2a5a;text-align:right;">${formatCurrency(p.faturamento)}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-size:13px;color:#555;">Percentual de repasse</td>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-size:15px;font-weight:600;color:#1e2a5a;text-align:right;">${p.percentualRepasse}%</td>
        </tr>
        <tr style="background:#f0fdf4;">
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-size:13px;color:#555;font-weight:600;">Valor do repasse</td>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-size:18px;font-weight:700;color:#3dae3c;text-align:right;">${formatCurrency(p.valorRepasse)}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-size:13px;color:#555;">Data do pagamento</td>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-size:15px;color:#1e2a5a;text-align:right;">${p.dataPagamento}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-size:13px;color:#555;">Forma de pagamento</td>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-size:15px;color:#1e2a5a;text-align:right;">${p.formaPagamento}</td>
        </tr>
      </table>
      ${obs}
      <p style="margin:24px 0 0;font-size:13px;color:#8a94a6;">O comprovante bancário do repasse está anexado a este e-mail. Acesse o portal para consultar o histórico completo.</p>
    </div>
    <div style="background:#f5f7fa;padding:16px 32px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#8a94a6;">MiniMerX · Rede de Mercadinhos Autônomos 24h · by LAVAX</p>
    </div>
  </div>
</body>
</html>`;
}
```

- [ ] **Step 4: Verificar tipos**

```bash
npm run build
```

Esperado: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/lib/competencia.ts src/lib/email-sender.ts package.json package-lock.json
git commit -m "feat: add competencia helpers and nodemailer email sender"
```

---

## Task 5: API — Upload de Comprovante

**Files:**
- Create: `src/app/api/admin/comprovantes/route.ts`

- [ ] **Step 1: Criar route GET + POST**

```typescript
// src/app/api/admin/comprovantes/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveFile, ALLOWED_MIME_TYPES, MAX_FILE_BYTES, computeHash } from "@/lib/storage";
import { logAudit, getIp } from "@/lib/audit";
import { isValidPastCompetencia } from "@/lib/competencia";

const VALOR_TOLERANCIA = 0.02; // R$ 0,02 de tolerância de arredondamento

export async function GET(req: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const condominioId = searchParams.get("condominioId");
  const competencia = searchParams.get("competencia");

  const items = await prisma.comprovante.findMany({
    where: {
      ...(condominioId ? { condominioId } : {}),
      ...(competencia ? { competencia } : {}),
    },
    orderBy: [{ competencia: "desc" }, { criadoEm: "desc" }],
    include: {
      condominio: { select: { nome: true, percentualRepasse: true } },
    },
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "FormData inválido." }, { status: 400 });
  }

  const arquivo = formData.get("arquivo") as File | null;
  const condominioId = formData.get("condominioId") as string | null;
  const competencia = formData.get("competencia") as string | null;
  const valorRepasseRaw = formData.get("valorRepasse") as string | null;
  const dataPagamento = formData.get("dataPagamento") as string | null;
  const formaPagamento = formData.get("formaPagamento") as string | null;
  const bancoOrigem = formData.get("bancoOrigem") as string | null;
  const bancoDestino = formData.get("bancoDestino") as string | null;
  const idTransacaoBanco = formData.get("idTransacaoBanco") as string | null;
  const observacao = formData.get("observacao") as string | null;
  const visivelSindico = formData.get("visivelSindico") === "true";

  // Validações básicas
  if (!arquivo || !condominioId || !competencia || !valorRepasseRaw || !dataPagamento || !formaPagamento) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
  }

  if (!isValidPastCompetencia(competencia)) {
    return NextResponse.json({ error: "Competência inválida ou futura." }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(arquivo.type as typeof ALLOWED_MIME_TYPES[number])) {
    return NextResponse.json({ error: "Formato não permitido. Use PDF, JPG ou PNG." }, { status: 400 });
  }

  if (arquivo.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Arquivo excede 10 MB." }, { status: 400 });
  }

  const valorRepasse = parseFloat(valorRepasseRaw);
  if (isNaN(valorRepasse) || valorRepasse <= 0) {
    return NextResponse.json({ error: "Valor de repasse inválido." }, { status: 400 });
  }

  const condominio = await prisma.condominio.findUnique({ where: { id: condominioId } });
  if (!condominio) {
    return NextResponse.json({ error: "Condomínio não encontrado." }, { status: 404 });
  }

  // Verificar comprovante ativo já existente para a competência
  const existente = await prisma.comprovante.findFirst({
    where: {
      condominioId,
      competencia,
      status: { in: ["ANEXADO", "ENVIADO"] },
    },
  });

  if (existente) {
    return NextResponse.json(
      { error: "Já existe comprovante ativo para esta competência. Use a substituição.", comprovanteId: existente.id },
      { status: 409 },
    );
  }

  // Calcular faturamento do período para validar tolerância
  const vendas = await prisma.venda.aggregate({
    where: {
      condominioId,
      data: {
        gte: new Date(`${competencia}-01`),
        lt: new Date(
          competencia.startsWith(competencia.substring(0, 7))
            ? `${String(parseInt(competencia.substring(0, 4)) + (parseInt(competencia.substring(5, 7)) === 12 ? 1 : 0))}-${String(parseInt(competencia.substring(5, 7)) === 12 ? 1 : parseInt(competencia.substring(5, 7)) + 1).padStart(2, "0")}-01`
            : `${competencia}-01`,
        ),
      },
    },
    _sum: { valorVenda: true },
  });

  const faturamento = Number(vendas._sum.valorVenda ?? 0);
  const repasseEsperado = faturamento * (Number(condominio.percentualRepasse) / 100);
  const divergencia = Math.abs(valorRepasse - repasseEsperado);
  const temDivergencia = divergencia > VALOR_TOLERANCIA;

  const buffer = Buffer.from(await arquivo.arrayBuffer());
  const hash = computeHash(buffer);

  // Verificar duplicidade exata por hash
  const duplicado = await prisma.comprovante.findFirst({ where: { hashArquivo: hash, condominioId } });
  if (duplicado) {
    return NextResponse.json({ error: "Arquivo idêntico já foi enviado.", comprovanteId: duplicado.id }, { status: 409 });
  }

  const { relativePath } = await saveFile({
    condominioId,
    competencia,
    filename: arquivo.name,
    buffer,
  });

  const comprovante = await prisma.comprovante.create({
    data: {
      condominioId,
      competencia,
      nomeArquivo: arquivo.name,
      caminhoArquivo: relativePath,
      mimeType: arquivo.type,
      tamanhoBytes: arquivo.size,
      hashArquivo: hash,
      valorRepasse,
      dataPagamento: new Date(dataPagamento),
      formaPagamento: formaPagamento as never,
      bancoOrigem: bancoOrigem || null,
      bancoDestino: bancoDestino || null,
      idTransacaoBanco: idTransacaoBanco || null,
      observacao: observacao || null,
      visivelSindico,
      criadoPorId: session.user.id,
      status: "ANEXADO",
    },
  });

  await logAudit({
    tipo: "COMPROVANTE_CRIADO",
    entidade: "Comprovante",
    entidadeId: comprovante.id,
    usuarioId: session.user.id,
    usuarioRole: session.user.role,
    descricao: `Comprovante criado para ${condominio.nome} — ${competencia}`,
    payload: { condominioId, competencia, valorRepasse, temDivergencia, divergencia },
    ip: getIp(req),
  });

  return NextResponse.json(
    { id: comprovante.id, temDivergencia, divergencia: temDivergencia ? divergencia : 0 },
    { status: 201 },
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npm run build
```

Esperado: sem erros (ignorar warnings sobre `as never` no formaPagamento — será tipado corretamente no Step 3).

- [ ] **Step 3: Corrigir o tipo FormaPagamento no POST**

Substituir `formaPagamento: formaPagamento as never` por:

```typescript
import { FormaPagamento } from "@prisma/client";
// ...
const formaEnum = z.nativeEnum(FormaPagamento).safeParse(formaPagamento);
if (!formaEnum.success) {
  return NextResponse.json({ error: "Forma de pagamento inválida." }, { status: 400 });
}
// ...
formaPagamento: formaEnum.data,
```

- [ ] **Step 4: Verificar build final**

```bash
npm run build
```

Esperado: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/comprovantes/route.ts
git commit -m "feat: add admin comprovante upload API"
```

---

## Task 6: API — Detalhe, Substituição e Cancelamento de Comprovante

**Files:**
- Create: `src/app/api/admin/comprovantes/[id]/route.ts`
- Create: `src/app/api/admin/comprovantes/[id]/arquivo/route.ts`

- [ ] **Step 1: Criar route de detalhe, substituição e cancelamento**

```typescript
// src/app/api/admin/comprovantes/[id]/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { FormaPagamento } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveFile, ALLOWED_MIME_TYPES, MAX_FILE_BYTES, computeHash } from "@/lib/storage";
import { logAudit, getIp } from "@/lib/audit";
import { isValidPastCompetencia } from "@/lib/competencia";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const comp = await prisma.comprovante.findUnique({
    where: { id: params.id },
    include: {
      condominio: { select: { nome: true, percentualRepasse: true } },
      versaoAnterior: { select: { id: true, nomeArquivo: true, criadoEm: true, status: true } },
      envios: {
        orderBy: { criadoEm: "desc" },
        take: 5,
        include: { destinatarios: true },
      },
    },
  });

  if (!comp) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  if (session.user.role === "SINDICO") {
    if (session.user.condominioId !== comp.condominioId) {
      return NextResponse.json({ error: "Proibido." }, { status: 403 });
    }
  }

  return NextResponse.json(comp);
}

// PUT: substituir comprovante (admin e admin-master)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const anterior = await prisma.comprovante.findUnique({
    where: { id: params.id },
    include: { condominio: { select: { nome: true } } },
  });

  if (!anterior) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  if (anterior.status === "CANCELADO") {
    return NextResponse.json({ error: "Não é possível substituir comprovante cancelado." }, { status: 409 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "FormData inválido." }, { status: 400 });

  const arquivo = formData.get("arquivo") as File | null;
  const justificativa = (formData.get("justificativa") as string | null)?.trim();
  const valorRepasseRaw = formData.get("valorRepasse") as string | null;
  const dataPagamento = formData.get("dataPagamento") as string | null;
  const formaPagamentoRaw = formData.get("formaPagamento") as string | null;
  const observacao = formData.get("observacao") as string | null;
  const visivelSindico = formData.get("visivelSindico") === "true";

  if (!arquivo || !justificativa || justificativa.length < 10) {
    return NextResponse.json({ error: "Arquivo e justificativa (mín. 10 caracteres) são obrigatórios." }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(arquivo.type as typeof ALLOWED_MIME_TYPES[number])) {
    return NextResponse.json({ error: "Formato não permitido. Use PDF, JPG ou PNG." }, { status: 400 });
  }

  if (arquivo.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Arquivo excede 10 MB." }, { status: 400 });
  }

  const formaEnum = formaPagamentoRaw ? z.nativeEnum(FormaPagamento).safeParse(formaPagamentoRaw) : null;
  const buffer = Buffer.from(await arquivo.arrayBuffer());
  const hash = computeHash(buffer);

  const { relativePath } = await saveFile({
    condominioId: anterior.condominioId,
    competencia: anterior.competencia,
    filename: arquivo.name,
    buffer,
  });

  const [, novoComp] = await prisma.$transaction([
    prisma.comprovante.update({
      where: { id: anterior.id },
      data: { status: "SUBSTITUIDO" },
    }),
    prisma.comprovante.create({
      data: {
        condominioId: anterior.condominioId,
        competencia: anterior.competencia,
        nomeArquivo: arquivo.name,
        caminhoArquivo: relativePath,
        mimeType: arquivo.type,
        tamanhoBytes: arquivo.size,
        hashArquivo: hash,
        valorRepasse: valorRepasseRaw ? parseFloat(valorRepasseRaw) : anterior.valorRepasse,
        dataPagamento: dataPagamento ? new Date(dataPagamento) : anterior.dataPagamento,
        formaPagamento: formaEnum?.success ? formaEnum.data : anterior.formaPagamento,
        observacao: observacao || anterior.observacao,
        visivelSindico,
        justificativa,
        versaoAnteriorId: anterior.id,
        criadoPorId: session.user.id,
        status: "ANEXADO",
      },
    }),
  ]);

  await logAudit({
    tipo: "COMPROVANTE_SUBSTITUIDO",
    entidade: "Comprovante",
    entidadeId: novoComp.id,
    usuarioId: session.user.id,
    usuarioRole: session.user.role,
    descricao: `Comprovante substituído — ${anterior.condominio.nome} / ${anterior.competencia}. Justificativa: ${justificativa}`,
    payload: { anteriorId: anterior.id, novoId: novoComp.id },
    ip: getIp(req),
  });

  return NextResponse.json({ id: novoComp.id });
}

// DELETE: cancelamento lógico (ADMIN master only — mesma role ADMIN por ora)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const justificativa = (body?.justificativa as string | undefined)?.trim();

  if (!justificativa || justificativa.length < 10) {
    return NextResponse.json({ error: "Justificativa obrigatória (mín. 10 caracteres)." }, { status: 400 });
  }

  const comp = await prisma.comprovante.findUnique({
    where: { id: params.id },
    include: { condominio: { select: { nome: true } } },
  });

  if (!comp) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  if (comp.status === "CANCELADO") return NextResponse.json({ error: "Já cancelado." }, { status: 409 });

  await prisma.comprovante.update({
    where: { id: params.id },
    data: { status: "CANCELADO", justificativa },
  });

  await logAudit({
    tipo: "COMPROVANTE_CANCELADO",
    entidade: "Comprovante",
    entidadeId: comp.id,
    usuarioId: session.user.id,
    usuarioRole: session.user.role,
    descricao: `Comprovante cancelado — ${comp.condominio.nome} / ${comp.competencia}. Justificativa: ${justificativa}`,
    ip: getIp(req),
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Criar route de download autenticado**

```typescript
// src/app/api/admin/comprovantes/[id]/arquivo/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFileFromStorage } from "@/lib/storage";
import { logAudit, getIp } from "@/lib/audit";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const comp = await prisma.comprovante.findUnique({ where: { id: params.id } });
  if (!comp) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  // SINDICO só pode baixar do próprio condomínio
  if (session.user.role === "SINDICO" && session.user.condominioId !== comp.condominioId) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const buffer = await readFileFromStorage(comp.caminhoArquivo).catch(() => null);
  if (!buffer) return NextResponse.json({ error: "Arquivo não encontrado no servidor." }, { status: 404 });

  await logAudit({
    tipo: "COMPROVANTE_BAIXADO",
    entidade: "Comprovante",
    entidadeId: comp.id,
    usuarioId: session.user.id,
    usuarioRole: session.user.role,
    descricao: `Arquivo do comprovante baixado`,
    ip: getIp(req),
  });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": comp.mimeType,
      "Content-Disposition": `attachment; filename="${comp.nomeArquivo}"`,
    },
  });
}
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/comprovantes/
git commit -m "feat: add comprovante detail, substitute, cancel and download APIs"
```

---

## Task 7: UI — Página Admin Comprovantes

**Files:**
- Create: `src/app/(dashboard)/admin/comprovantes/page.tsx`
- Create: `src/app/(dashboard)/admin/comprovantes/comprovantes-view.tsx`

- [ ] **Step 1: Criar Server Component page.tsx**

```tsx
// src/app/(dashboard)/admin/comprovantes/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ComprovantesView } from "./comprovantes-view";

export const metadata = { title: "Comprovantes — MiniMerX" };

export default async function ComprovantesPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/dashboard");

  const condominios = await prisma.condominio.findMany({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, percentualRepasse: true },
  });

  const comprovantes = await prisma.comprovante.findMany({
    orderBy: [{ competencia: "desc" }, { criadoEm: "desc" }],
    include: { condominio: { select: { nome: true } } },
    take: 100,
  });

  return (
    <ComprovantesView
      condominios={condominios}
      initialComprovantes={comprovantes.map((c) => ({
        ...c,
        valorRepasse: c.valorRepasse.toString(),
        dataPagamento: c.dataPagamento.toISOString(),
        criadoEm: c.criadoEm.toISOString(),
        atualizadoEm: c.atualizadoEm.toISOString(),
      }))}
    />
  );
}
```

- [ ] **Step 2: Criar Client Component comprovantes-view.tsx**

O componente precisa implementar:
1. Lista de comprovantes com status badge colorido
2. Botão "Novo Comprovante" → modal com formulário de upload
3. Formulário: `condominioId`, `competencia` (mês/ano), arquivo drag-and-drop, valor repasse, data pagamento, forma pagamento, observação, toggle visível síndico
4. Download do comprovante via `/api/admin/comprovantes/[id]/arquivo`
5. Status badges: PENDENTE=cinza, ANEXADO=azul, ENVIADO=verde, SUBSTITUIDO=amarelo, CANCELADO=vermelho

```tsx
// src/app/(dashboard)/admin/comprovantes/comprovantes-view.tsx
"use client";

import { useState, useRef, useTransition } from "react";
import { CheckCircle, Clock, FileText, Upload, XCircle, AlertTriangle, Download } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { competenciaLabel, isValidPastCompetencia } from "@/lib/competencia";
import { cn } from "@/lib/utils";

interface Condominio {
  id: string;
  nome: string;
  percentualRepasse: string | number;
}

interface ComprovanteItem {
  id: string;
  condominioId: string;
  competencia: string;
  nomeArquivo: string;
  valorRepasse: string;
  dataPagamento: string;
  formaPagamento: string;
  status: string;
  criadoEm: string;
  condominio: { nome: string };
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  PENDENTE:    { label: "Pendente",    className: "bg-slate-100 text-slate-600",  icon: Clock },
  ANEXADO:     { label: "Anexado",     className: "bg-blue-100 text-blue-700",    icon: FileText },
  ENVIADO:     { label: "Enviado",     className: "bg-green-100 text-green-700",  icon: CheckCircle },
  SUBSTITUIDO: { label: "Substituído", className: "bg-yellow-100 text-yellow-700", icon: AlertTriangle },
  CANCELADO:   { label: "Cancelado",   className: "bg-red-100 text-red-700",      icon: XCircle },
};

const FORMAS_PAGAMENTO = [
  { value: "PIX", label: "PIX" },
  { value: "TED", label: "TED" },
  { value: "DOC", label: "DOC" },
  { value: "TRANSFERENCIA_INTERNA", label: "Transferência Interna" },
  { value: "OUTRO", label: "Outro" },
];

export function ComprovantesView({
  condominios,
  initialComprovantes,
}: {
  condominios: Condominio[];
  initialComprovantes: ComprovanteItem[];
}) {
  const [items, setItems] = useState(initialComprovantes);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [divergenciaAviso, setDivergenciaAviso] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    condominioId: "",
    competencia: "",
    valorRepasse: "",
    dataPagamento: "",
    formaPagamento: "",
    observacao: "",
    visivelSindico: false,
  });
  const [arquivo, setArquivo] = useState<File | null>(null);

  function openCreate() {
    setForm({ condominioId: "", competencia: "", valorRepasse: "", dataPagamento: "", formaPagamento: "", observacao: "", visivelSindico: false });
    setArquivo(null);
    setError(null);
    setDivergenciaAviso(null);
    setDialogOpen(true);
  }

  async function refreshItems() {
    const res = await fetch("/api/admin/comprovantes");
    if (res.ok) {
      const data = await res.json() as ComprovanteItem[];
      setItems(data);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!arquivo) { setError("Selecione o arquivo do comprovante."); return; }
    if (!form.condominioId) { setError("Selecione o condomínio."); return; }
    if (!form.competencia || !isValidPastCompetencia(form.competencia)) { setError("Competência inválida ou futura."); return; }
    if (!form.valorRepasse || isNaN(parseFloat(form.valorRepasse))) { setError("Valor de repasse inválido."); return; }
    if (!form.dataPagamento) { setError("Informe a data do pagamento."); return; }
    if (!form.formaPagamento) { setError("Selecione a forma de pagamento."); return; }

    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("arquivo", arquivo);
      fd.append("condominioId", form.condominioId);
      fd.append("competencia", form.competencia);
      fd.append("valorRepasse", form.valorRepasse);
      fd.append("dataPagamento", form.dataPagamento);
      fd.append("formaPagamento", form.formaPagamento);
      if (form.observacao) fd.append("observacao", form.observacao);
      fd.append("visivelSindico", String(form.visivelSindico));

      const res = await fetch("/api/admin/comprovantes", { method: "POST", body: fd });
      const body = await res.json().catch(() => ({})) as { error?: string; temDivergencia?: boolean; divergencia?: number };

      if (!res.ok) {
        setError(body.error ?? "Erro ao salvar.");
        return;
      }

      if (body.temDivergencia && body.divergencia) {
        setDivergenciaAviso(`Atenção: divergência de ${formatCurrency(body.divergencia)} entre valor declarado e cálculo esperado. Comprovante salvo com flag de revisão.`);
      }

      setDialogOpen(false);
      await refreshItems();
    });
  }

  return (
    <>
      <Topbar role="ADMIN" condominioNome={null} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-minimerx-navy">Comprovantes de Repasse</h1>
            <p className="mt-1 text-sm text-minimerx-gray">Gerencie os comprovantes bancários por condomínio e competência.</p>
          </div>
          <Button onClick={openCreate}><Upload className="h-4 w-4" />Novo Comprovante</Button>
        </div>

        {divergenciaAviso && (
          <div className="flex gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{divergenciaAviso}</span>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Condomínio</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead>Repasse</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center text-minimerx-gray">
                    Nenhum comprovante cadastrado.
                  </TableCell>
                </TableRow>
              ) : items.map((item) => {
                const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDENTE;
                const Icon = cfg.icon;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-minimerx-navy">{item.condominio.nome}</TableCell>
                    <TableCell>{competenciaLabel(item.competencia)}</TableCell>
                    <TableCell>{formatCurrency(item.valorRepasse)}</TableCell>
                    <TableCell>{formatDate(item.dataPagamento)}</TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", cfg.className)}>
                        <Icon className="h-3.5 w-3.5" />{cfg.label}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(item.criadoEm)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a href={`/api/admin/comprovantes/${item.id}/arquivo`} download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(o) => !pending && setDialogOpen(o)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Comprovante de Repasse</DialogTitle>
              <DialogDescription>Selecione o condomínio, competência e arquivo do comprovante.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Condomínio</Label>
                <Select value={form.condominioId} onValueChange={(v) => setForm((f) => ({ ...f, condominioId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {condominios.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Competência (YYYY-MM)</Label>
                  <Input
                    placeholder="2026-03"
                    value={form.competencia}
                    onChange={(e) => setForm((f) => ({ ...f, competencia: e.target.value }))}
                    pattern="\d{4}-\d{2}"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Data do Pagamento</Label>
                  <Input
                    type="date"
                    value={form.dataPagamento}
                    onChange={(e) => setForm((f) => ({ ...f, dataPagamento: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Valor do Repasse (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={form.valorRepasse}
                    onChange={(e) => setForm((f) => ({ ...f, valorRepasse: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Forma de Pagamento</Label>
                  <Select value={form.formaPagamento} onValueChange={(v) => setForm((f) => ({ ...f, formaPagamento: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {FORMAS_PAGAMENTO.map((fp) => (
                        <SelectItem key={fp.value} value={fp.value}>{fp.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Arquivo (PDF, JPG ou PNG — máx. 10 MB)</Label>
                <div
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-6 cursor-pointer hover:border-minimerx-blue transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  <FileText className="h-8 w-8 text-minimerx-gray mb-2" />
                  <p className="text-sm text-minimerx-gray">
                    {arquivo ? arquivo.name : "Clique ou arraste o arquivo aqui"}
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Observação (opcional)</Label>
                <Input
                  placeholder="Observação visível ao síndico..."
                  value={form.observacao}
                  onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={pending}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Salvando..." : "Salvar Comprovante"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

Esperado: sem erros de tipo.

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/admin/comprovantes/
git commit -m "feat: add admin comprovantes UI"
```

---

## Task 8: API — Histórico de Competências

**Files:**
- Create: `src/app/api/historico/route.ts`

- [ ] **Step 1: Criar route GET /api/historico**

```typescript
// src/app/api/historico/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { competenciasRange, toCompetencia } from "@/lib/competencia";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  let condominioId = searchParams.get("condominioId");

  if (session.user.role === "SINDICO") {
    if (!session.user.condominioId) return NextResponse.json([], { status: 200 });
    condominioId = session.user.condominioId; // Força isolamento
  } else if (!condominioId) {
    return NextResponse.json({ error: "condominioId obrigatório para ADMIN." }, { status: 400 });
  }

  const condominio = await prisma.condominio.findUnique({
    where: { id: condominioId },
    select: { id: true, nome: true, percentualRepasse: true },
  });

  if (!condominio) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  // Buscar primeira venda para saber o início do histórico
  const primeiraVenda = await prisma.venda.findFirst({
    where: { condominioId },
    orderBy: { data: "asc" },
    select: { data: true },
  });

  if (!primeiraVenda) return NextResponse.json([]);

  const hoje = new Date();
  const inicio = toCompetencia(primeiraVenda.data);
  const fim = toCompetencia(hoje);
  const competencias = competenciasRange(inicio, fim).reverse(); // mais recente primeiro

  // Buscar vendas agrupadas por competência
  const vendas = await prisma.$queryRaw<Array<{ competencia: string; total: number }>>`
    SELECT
      TO_CHAR(data, 'YYYY-MM') AS competencia,
      SUM("valorVenda")::float AS total
    FROM "Venda"
    WHERE "condominioId" = ${condominioId}
    GROUP BY TO_CHAR(data, 'YYYY-MM')
  `;

  const vendasMap = Object.fromEntries(vendas.map((v) => [v.competencia, v.total]));

  // Buscar comprovantes ativos
  const comprovantes = await prisma.comprovante.findMany({
    where: {
      condominioId,
      status: { in: ["ANEXADO", "ENVIADO", "SUBSTITUIDO"] },
    },
    orderBy: { criadoEm: "desc" },
    select: { id: true, competencia: true, status: true, valorRepasse: true, criadoEm: true },
  });

  const compMap: Record<string, typeof comprovantes[number]> = {};
  for (const c of comprovantes) {
    if (!compMap[c.competencia] || c.status === "ANEXADO" || c.status === "ENVIADO") {
      compMap[c.competencia] = c;
    }
  }

  // Buscar último envio por competência
  const envios = await prisma.envioEmail.findMany({
    where: { condominioId },
    orderBy: { criadoEm: "desc" },
    select: { id: true, competencia: true, status: true, enviadoEm: true },
  });

  const envioMap: Record<string, typeof envios[number]> = {};
  for (const e of envios) {
    if (!envioMap[e.competencia]) envioMap[e.competencia] = e;
  }

  const percentual = Number(condominio.percentualRepasse);

  const resultado = competencias.map((comp) => {
    const faturamento = vendasMap[comp] ?? null;
    const repasseCalculado = faturamento !== null ? faturamento * (percentual / 100) : null;
    const comprovante = compMap[comp] ?? null;
    const envio = envioMap[comp] ?? null;

    let statusConsolidado: string;
    if (!faturamento) {
      statusConsolidado = "EM_ABERTO";
    } else if (!comprovante) {
      statusConsolidado = "SEM_COMPROVANTE";
    } else if (comprovante.status === "ANEXADO") {
      statusConsolidado = "COMPROVANTE_ANEXADO";
    } else if (envio) {
      statusConsolidado = "COMUNICADA";
    } else {
      statusConsolidado = "COMPROVANTE_ANEXADO";
    }

    return {
      competencia: comp,
      faturamento,
      repasseCalculado,
      percentualRepasse: percentual,
      comprovanteId: comprovante?.id ?? null,
      comprovanteStatus: comprovante?.status ?? null,
      envioId: envio?.id ?? null,
      envioStatus: envio?.status ?? null,
      enviadoEm: envio?.enviadoEm ?? null,
      statusConsolidado,
    };
  });

  return NextResponse.json({
    condominio: { id: condominio.id, nome: condominio.nome },
    competencias: resultado,
  });
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/historico/route.ts
git commit -m "feat: add historico API with competencias status"
```

---

## Task 9: UI — Página Histórico

**Files:**
- Create: `src/app/(dashboard)/historico/page.tsx`
- Create: `src/app/(dashboard)/historico/historico-view.tsx`

- [ ] **Step 1: Criar Server Component page.tsx**

```tsx
// src/app/(dashboard)/historico/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HistoricoView } from "./historico-view";

export const metadata = { title: "Histórico — MiniMerX" };

export default async function HistoricoPage({ searchParams }: { searchParams: { condominioId?: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let condominioId: string | null = null;
  let condominioNome: string | null = null;
  let condominios: Array<{ id: string; nome: string }> = [];

  if (session.user.role === "ADMIN") {
    condominios = await prisma.condominio.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    });
    condominioId = searchParams.condominioId ?? condominios[0]?.id ?? null;
    condominioNome = condominios.find((c) => c.id === condominioId)?.nome ?? null;
  } else {
    condominioId = session.user.condominioId ?? null;
    if (condominioId) {
      const cond = await prisma.condominio.findUnique({
        where: { id: condominioId },
        select: { nome: true },
      });
      condominioNome = cond?.nome ?? null;
    }
  }

  return (
    <HistoricoView
      role={session.user.role}
      condominioId={condominioId}
      condominioNome={condominioNome}
      condominios={condominios}
    />
  );
}
```

- [ ] **Step 2: Criar Client Component historico-view.tsx**

```tsx
// src/app/(dashboard)/historico/historico-view.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Clock, FileText, AlertCircle, Send, Download } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { competenciaLabel } from "@/lib/competencia";
import { cn } from "@/lib/utils";

interface CompetenciaItem {
  competencia: string;
  faturamento: number | null;
  repasseCalculado: number | null;
  percentualRepasse: number;
  comprovanteId: string | null;
  comprovanteStatus: string | null;
  envioId: string | null;
  envioStatus: string | null;
  enviadoEm: string | null;
  statusConsolidado: string;
}

interface HistoricoData {
  condominio: { id: string; nome: string };
  competencias: CompetenciaItem[];
}

const STATUS_CONF: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  EM_ABERTO:           { label: "Em aberto",          className: "bg-slate-100 text-slate-600",   icon: Clock },
  SEM_COMPROVANTE:     { label: "Sem comprovante",     className: "bg-orange-100 text-orange-700", icon: AlertCircle },
  COMPROVANTE_ANEXADO: { label: "Comprovante anexado", className: "bg-blue-100 text-blue-700",     icon: FileText },
  COMUNICADA:          { label: "Comunicada",          className: "bg-green-100 text-green-700",   icon: CheckCircle },
};

export function HistoricoView({
  role,
  condominioId: initialCondominioId,
  condominioNome,
  condominios,
}: {
  role: "ADMIN" | "SINDICO";
  condominioId: string | null;
  condominioNome: string | null;
  condominios: Array<{ id: string; nome: string }>;
}) {
  const router = useRouter();
  const [condominioId, setCondominioId] = useState(initialCondominioId ?? "");
  const [data, setData] = useState<HistoricoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!condominioId) return;
    setLoading(true);
    setErro(null);
    fetch(`/api/historico?condominioId=${condominioId}`)
      .then((r) => r.json())
      .then((d: HistoricoData) => setData(d))
      .catch(() => setErro("Erro ao carregar histórico."))
      .finally(() => setLoading(false));
  }, [condominioId]);

  return (
    <>
      <Topbar role={role} condominioNome={condominioNome} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-minimerx-navy">Histórico de Competências</h1>
            <p className="mt-1 text-sm text-minimerx-gray">Fechamentos, repasses e comprovantes por mês.</p>
          </div>
          {role === "ADMIN" && condominios.length > 0 && (
            <Select
              value={condominioId}
              onValueChange={(v) => {
                setCondominioId(v);
                router.push(`/historico?condominioId=${v}`);
              }}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecione o condomínio..." />
              </SelectTrigger>
              <SelectContent>
                {condominios.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {erro && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{erro}</div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : !data || data.competencias.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Clock className="h-10 w-10 text-minimerx-gray mb-3" />
              <p className="text-minimerx-navy font-semibold">Nenhum histórico disponível</p>
              <p className="text-sm text-minimerx-gray mt-1">Importe dados de vendas para visualizar as competências.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left font-semibold text-minimerx-navy">Competência</th>
                  <th className="px-4 py-3 text-right font-semibold text-minimerx-navy">Faturamento</th>
                  <th className="px-4 py-3 text-right font-semibold text-minimerx-navy">Repasse</th>
                  <th className="px-4 py-3 text-center font-semibold text-minimerx-navy">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-minimerx-navy">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.competencias.map((c) => {
                  const cfg = STATUS_CONF[c.statusConsolidado] ?? STATUS_CONF.EM_ABERTO;
                  const Icon = cfg.icon;
                  return (
                    <tr key={c.competencia} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-minimerx-navy">
                        {competenciaLabel(c.competencia)}
                      </td>
                      <td className="px-4 py-4 text-right text-minimerx-navy">
                        {c.faturamento !== null ? formatCurrency(c.faturamento) : "—"}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-minimerx-green">
                        {c.repasseCalculado !== null ? formatCurrency(c.repasseCalculado) : "—"}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", cfg.className)}>
                          <Icon className="h-3.5 w-3.5" />{cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {c.comprovanteId && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={`/api/admin/comprovantes/${c.comprovanteId}/arquivo`} download>
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/historico/
git commit -m "feat: add historico page for sindico and admin"
```

---

## Task 10: API — Envio de E-mail

**Files:**
- Create: `src/app/api/admin/envios/route.ts`
- Create: `src/app/api/admin/envios/[id]/reenvio/route.ts`

- [ ] **Step 1: Criar route POST /api/admin/envios**

```typescript
// src/app/api/admin/envios/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFileFromStorage } from "@/lib/storage";
import { sendComprovante } from "@/lib/email-sender";
import { logAudit, getIp } from "@/lib/audit";
import { competenciaLabel } from "@/lib/competencia";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.comprovanteId) {
    return NextResponse.json({ error: "comprovanteId obrigatório." }, { status: 400 });
  }

  const comp = await prisma.comprovante.findUnique({
    where: { id: body.comprovanteId },
    include: {
      condominio: {
        select: {
          nome: true,
          percentualRepasse: true,
          emailsNotificacao: { select: { email: true } },
        },
      },
    },
  });

  if (!comp) return NextResponse.json({ error: "Comprovante não encontrado." }, { status: 404 });
  if (comp.status === "CANCELADO" || comp.status === "SUBSTITUIDO") {
    return NextResponse.json({ error: "Comprovante não está ativo." }, { status: 409 });
  }

  const destinatarios = (body.destinatarios as string[] | undefined) ??
    comp.condominio.emailsNotificacao.map((e) => e.email);

  if (!destinatarios.length) {
    return NextResponse.json({ error: "Nenhum destinatário cadastrado para este condomínio." }, { status: 422 });
  }

  // Calcular faturamento do período
  const [ano, mes] = comp.competencia.split("-").map(Number);
  const inicioMes = new Date(ano, mes - 1, 1);
  const fimMes = new Date(ano, mes, 1);

  const vendas = await prisma.venda.aggregate({
    where: { condominioId: comp.condominioId, data: { gte: inicioMes, lt: fimMes } },
    _sum: { valorVenda: true },
  });

  const faturamento = Number(vendas._sum.valorVenda ?? 0);

  const buffer = await readFileFromStorage(comp.caminhoArquivo).catch(() => null);
  if (!buffer) {
    return NextResponse.json({ error: "Arquivo do comprovante não encontrado no servidor." }, { status: 500 });
  }

  const result = await sendComprovante({
    destinatarios,
    condominioNome: comp.condominio.nome,
    competencia: comp.competencia,
    faturamento,
    valorRepasse: Number(comp.valorRepasse),
    percentualRepasse: Number(comp.condominio.percentualRepasse),
    dataPagamento: comp.dataPagamento.toISOString().substring(0, 10),
    formaPagamento: comp.formaPagamento,
    observacao: comp.visivelSindico ? comp.observacao : null,
    comprovante: {
      buffer,
      filename: comp.nomeArquivo,
      mimeType: comp.mimeType,
    },
  });

  const assunto = `MiniMerX — Repasse ${competenciaLabel(comp.competencia)} — ${comp.condominio.nome}`;

  const envio = await prisma.envioEmail.create({
    data: {
      condominioId: comp.condominioId,
      competencia: comp.competencia,
      comprovanteId: comp.id,
      assunto,
      corpo: "Ver HTML do e-mail",
      observacao: body.observacao ?? null,
      status: result.falhas.length > 0 && result.enviados.length === 0 ? "FALHOU" : "ENVIADO",
      enviadoEm: new Date(),
      criadoPorId: session.user.id,
      destinatarios: {
        create: [
          ...result.enviados.map((email) => ({ email, status: "ENVIADO" as const })),
          ...result.falhas.map(({ email, erro }) => ({ email, status: "FALHOU" as const, erro })),
        ],
      },
    },
  });

  // Atualizar status do comprovante
  if (result.enviados.length > 0) {
    await prisma.comprovante.update({
      where: { id: comp.id },
      data: { status: "ENVIADO" },
    });
  }

  await logAudit({
    tipo: "ENVIO_CRIADO",
    entidade: "EnvioEmail",
    entidadeId: envio.id,
    usuarioId: session.user.id,
    usuarioRole: session.user.role,
    descricao: `E-mail de fechamento enviado — ${comp.condominio.nome} / ${comp.competencia}. Enviados: ${result.enviados.length}, falhas: ${result.falhas.length}`,
    payload: { comprovanteId: comp.id, enviados: result.enviados, falhas: result.falhas },
    ip: getIp(req),
  });

  return NextResponse.json({
    id: envio.id,
    enviados: result.enviados,
    falhas: result.falhas,
  });
}
```

- [ ] **Step 2: Criar route POST reenvio**

```typescript
// src/app/api/admin/envios/[id]/reenvio/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFileFromStorage } from "@/lib/storage";
import { sendComprovante } from "@/lib/email-sender";
import { logAudit, getIp } from "@/lib/audit";
import { competenciaLabel } from "@/lib/competencia";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const envioOriginal = await prisma.envioEmail.findUnique({
    where: { id: params.id },
    include: {
      comprovante: true,
      destinatarios: true,
    },
  });

  if (!envioOriginal) return NextResponse.json({ error: "Envio não encontrado." }, { status: 404 });

  const condominio = await prisma.condominio.findUnique({
    where: { id: envioOriginal.condominioId },
    include: { emailsNotificacao: { select: { email: true } } },
  });

  if (!condominio) return NextResponse.json({ error: "Condomínio não encontrado." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const destinatarios = (body.destinatarios as string[] | undefined) ??
    condominio.emailsNotificacao.map((e) => e.email);

  const [ano, mes] = envioOriginal.competencia.split("-").map(Number);
  const vendas = await prisma.venda.aggregate({
    where: {
      condominioId: envioOriginal.condominioId,
      data: { gte: new Date(ano, mes - 1, 1), lt: new Date(ano, mes, 1) },
    },
    _sum: { valorVenda: true },
  });

  const faturamento = Number(vendas._sum.valorVenda ?? 0);
  const comp = envioOriginal.comprovante;

  const buffer = await readFileFromStorage(comp.caminhoArquivo).catch(() => null);
  if (!buffer) return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 500 });

  const result = await sendComprovante({
    destinatarios,
    condominioNome: condominio.nome,
    competencia: envioOriginal.competencia,
    faturamento,
    valorRepasse: Number(comp.valorRepasse),
    percentualRepasse: Number(condominio.percentualRepasse),
    dataPagamento: comp.dataPagamento.toISOString().substring(0, 10),
    formaPagamento: comp.formaPagamento,
    observacao: comp.visivelSindico ? comp.observacao : null,
    comprovante: { buffer, filename: comp.nomeArquivo, mimeType: comp.mimeType },
  });

  const reenvio = await prisma.envioEmail.create({
    data: {
      condominioId: envioOriginal.condominioId,
      competencia: envioOriginal.competencia,
      comprovanteId: comp.id,
      assunto: envioOriginal.assunto,
      corpo: envioOriginal.corpo,
      status: result.falhas.length > 0 && result.enviados.length === 0 ? "FALHOU" : "REENVIADO",
      enviadoEm: new Date(),
      criadoPorId: session.user.id,
      reenvioDeId: envioOriginal.id,
      destinatarios: {
        create: [
          ...result.enviados.map((email) => ({ email, status: "ENVIADO" as const })),
          ...result.falhas.map(({ email, erro }) => ({ email, status: "FALHOU" as const, erro })),
        ],
      },
    },
  });

  await logAudit({
    tipo: "ENVIO_REENVIADO",
    entidade: "EnvioEmail",
    entidadeId: reenvio.id,
    usuarioId: session.user.id,
    usuarioRole: session.user.role,
    descricao: `Reenvio de fechamento — ${condominio.nome} / ${envioOriginal.competencia}`,
    payload: { envioOriginalId: envioOriginal.id, enviados: result.enviados, falhas: result.falhas },
    ip: getIp(req),
  });

  return NextResponse.json({ id: reenvio.id, enviados: result.enviados, falhas: result.falhas });
}
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/envios/
git commit -m "feat: add email send and resend API"
```

---

## Task 11: UI — Modal de Envio + Integração na Página de Comprovantes

**Files:**
- Create: `src/components/EnvioEmailModal.tsx`
- Modify: `src/app/(dashboard)/admin/comprovantes/comprovantes-view.tsx`

- [ ] **Step 1: Criar EnvioEmailModal.tsx**

```tsx
// src/components/EnvioEmailModal.tsx
"use client";

import { useState, useTransition } from "react";
import { Send, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { competenciaLabel } from "@/lib/competencia";
import { formatCurrency } from "@/lib/formatters";

interface EnvioEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comprovanteId: string;
  condominioNome: string;
  competencia: string;
  valorRepasse: string | number;
  destinatariosPadrao: string[];
  onSuccess?: () => void;
}

interface SendResult {
  enviados: string[];
  falhas: Array<{ email: string; erro: string }>;
}

export function EnvioEmailModal({
  open,
  onOpenChange,
  comprovanteId,
  condominioNome,
  competencia,
  valorRepasse,
  destinatariosPadrao,
  onSuccess,
}: EnvioEmailModalProps) {
  const [result, setResult] = useState<SendResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [observacao, setObservacao] = useState("");
  const [pending, startTransition] = useTransition();

  function handleClose() {
    if (pending) return;
    setResult(null);
    setError(null);
    onOpenChange(false);
  }

  function handleEnviar() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/envios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comprovanteId,
          destinatarios: destinatariosPadrao,
          observacao: observacao || undefined,
        }),
      });
      const body = await res.json().catch(() => ({})) as SendResult & { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Erro ao enviar.");
        return;
      }
      setResult(body);
      if (body.enviados.length > 0) onSuccess?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-minimerx-blue" />
            Enviar Fechamento por E-mail
          </DialogTitle>
          <DialogDescription>
            {condominioNome} — {competenciaLabel(competencia)} — Repasse: {formatCurrency(valorRepasse)}
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-minimerx-gray">
                Destinatários ({destinatariosPadrao.length})
              </Label>
              <ul className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-minimerx-navy space-y-1">
                {destinatariosPadrao.length > 0 ? (
                  destinatariosPadrao.map((e) => <li key={e}>{e}</li>)
                ) : (
                  <li className="text-minimerx-gray">Nenhum destinatário cadastrado.</li>
                )}
              </ul>
            </div>

            <div className="space-y-1.5">
              <Label>Observação adicional (opcional)</Label>
              <Input
                placeholder="Inclui mensagem no corpo do e-mail..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={pending}>Cancelar</Button>
              <Button
                onClick={handleEnviar}
                disabled={pending || destinatariosPadrao.length === 0}
              >
                {pending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Enviando...</>
                ) : (
                  <><Send className="h-4 w-4" />Enviar agora</>
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            {result.enviados.length > 0 && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  Enviado com sucesso para {result.enviados.length} destinatário(s)
                </p>
                <ul className="mt-2 space-y-1 text-sm text-green-700">
                  {result.enviados.map((e) => <li key={e}>• {e}</li>)}
                </ul>
              </div>
            )}
            {result.falhas.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
                  <XCircle className="h-4 w-4" />
                  Falhou para {result.falhas.length} destinatário(s)
                </p>
                <ul className="mt-2 space-y-1 text-sm text-red-700">
                  {result.falhas.map(({ email, erro }) => (
                    <li key={email}>• {email}: {erro}</li>
                  ))}
                </ul>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Integrar modal na ComprovantesView**

Na `comprovantes-view.tsx`, adicionar:
1. Import `EnvioEmailModal`
2. Estado `envioTarget: ComprovanteItem | null`
3. Botão "Enviar" em cada linha da tabela (visível quando `status === "ANEXADO"`)
4. `<EnvioEmailModal>` renderizado fora da tabela

Adicionar ao estado e handlers em `ComprovantesView`:
```tsx
const [envioTarget, setEnvioTarget] = useState<ComprovanteItem | null>(null);
const [destinatariosMap, setDestinatariosMap] = useState<Record<string, string[]>>({});

async function loadDestinatarios(condominioId: string) {
  if (destinatariosMap[condominioId]) return;
  const res = await fetch("/api/notificacoes");
  if (res.ok) {
    const emails = (await res.json() as Array<{ email: string }>).map((e) => e.email);
    setDestinatariosMap((m) => ({ ...m, [condominioId]: emails }));
  }
}
```

Adicionar coluna "Enviar" na tabela:
```tsx
{item.status === "ANEXADO" && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => {
      setEnvioTarget(item);
      void loadDestinatarios(item.condominioId);
    }}
  >
    <Send className="h-4 w-4" />
  </Button>
)}
```

Adicionar modal após a tabela:
```tsx
{envioTarget && (
  <EnvioEmailModal
    open={!!envioTarget}
    onOpenChange={(o) => { if (!o) setEnvioTarget(null); }}
    comprovanteId={envioTarget.id}
    condominioNome={envioTarget.condominio.nome}
    competencia={envioTarget.competencia}
    valorRepasse={envioTarget.valorRepasse}
    destinatariosPadrao={destinatariosMap[envioTarget.condominioId] ?? []}
    onSuccess={refreshItems}
  />
)}
```

**Nota:** O `loadDestinatarios` usa `/api/notificacoes` que só funciona para SINDICO. Para ADMIN, criar uma rota `/api/admin/notificacoes?condominioId=X` que retorna os emails do condomínio. Adicionar este handler:

```typescript
// src/app/api/admin/notificacoes/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Proibido." }, { status: 403 });

  const condominioId = new URL(req.url).searchParams.get("condominioId");
  if (!condominioId) return NextResponse.json({ error: "condominioId obrigatório." }, { status: 400 });

  const items = await prisma.emailNotificacao.findMany({
    where: { condominioId },
    select: { id: true, email: true },
    orderBy: { email: "asc" },
  });

  return NextResponse.json(items);
}
```

E no `loadDestinatarios` usar `/api/admin/notificacoes?condominioId=${condominioId}`.

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/components/EnvioEmailModal.tsx src/app/(dashboard)/admin/comprovantes/comprovantes-view.tsx src/app/api/admin/notificacoes/route.ts
git commit -m "feat: add email send modal and admin notificacoes API"
```

---

## Task 12: API + UI — Alertas e Pendências

**Files:**
- Create: `src/app/api/admin/pendencias/route.ts`
- Modify: `src/components/AppSidebar.tsx`

- [ ] **Step 1: Criar API de pendências**

```typescript
// src/app/api/admin/pendencias/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCompetencia } from "@/lib/competencia";

export async function GET() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const hoje = new Date();
  const competenciaAtual = toCompetencia(hoje);
  const mesAnterior = hoje.getMonth() === 0
    ? `${hoje.getFullYear() - 1}-12`
    : `${hoje.getFullYear()}-${String(hoje.getMonth()).padStart(2, "0")}`;

  const competenciasVerificar = [mesAnterior, competenciaAtual];

  const condominios = await prisma.condominio.findMany({
    select: {
      id: true,
      nome: true,
      emailsNotificacao: { select: { id: true } },
      comprovantes: {
        where: {
          competencia: { in: competenciasVerificar },
          status: { in: ["ANEXADO", "ENVIADO"] },
        },
        select: { competencia: true, status: true },
      },
    },
  });

  const pendencias: Array<{
    tipo: string;
    severidade: "ALTA" | "MEDIA" | "BAIXA";
    descricao: string;
    condominioId: string;
    condominioNome: string;
    competencia: string | null;
  }> = [];

  for (const cond of condominios) {
    // Sem destinatário
    if (cond.emailsNotificacao.length === 0) {
      pendencias.push({
        tipo: "SEM_DESTINATARIO",
        severidade: "ALTA",
        descricao: `Nenhum e-mail cadastrado para receber notificações`,
        condominioId: cond.id,
        condominioNome: cond.nome,
        competencia: null,
      });
    }

    // Comprovante do mês anterior não enviado
    const compMesAnterior = cond.comprovantes.find((c) => c.competencia === mesAnterior);
    if (!compMesAnterior) {
      pendencias.push({
        tipo: "SEM_COMPROVANTE",
        severidade: "ALTA",
        descricao: `Sem comprovante para a competência ${mesAnterior}`,
        condominioId: cond.id,
        condominioNome: cond.nome,
        competencia: mesAnterior,
      });
    } else if (compMesAnterior.status === "ANEXADO") {
      pendencias.push({
        tipo: "COMPROVANTE_NAO_ENVIADO",
        severidade: "MEDIA",
        descricao: `Comprovante de ${mesAnterior} não foi comunicado ao síndico`,
        condominioId: cond.id,
        condominioNome: cond.nome,
        competencia: mesAnterior,
      });
    }
  }

  return NextResponse.json({
    total: pendencias.length,
    altas: pendencias.filter((p) => p.severidade === "ALTA").length,
    pendencias,
  });
}
```

- [ ] **Step 2: Adicionar badge de pendências no AppSidebar**

O `AppSidebar` é um Client Component. Adicionar fetch de pendências para ADMIN:

No início do componente, após os imports existentes, adicionar:
```tsx
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
```

Dentro de `AppSidebar`, antes do `return`:
```tsx
const [pendenciasCount, setPendenciasCount] = useState(0);

useEffect(() => {
  if (role !== "ADMIN") return;
  fetch("/api/admin/pendencias")
    .then((r) => r.json())
    .then((d: { total?: number }) => setPendenciasCount(d.total ?? 0))
    .catch(() => {});
}, [role]);
```

No item de navegação do admin, adicionar item "Pendências":
```tsx
{ href: "/admin/pendencias", label: "Pendências", icon: AlertCircle, badge: pendenciasCount > 0 ? pendenciasCount : undefined },
```

No render do item de nav, adicionar suporte a badge:
```tsx
{item.badge ? (
  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
    {item.badge}
  </span>
) : null}
```

- [ ] **Step 3: Criar página /admin/pendencias simples**

```tsx
// src/app/(dashboard)/admin/pendencias/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PendenciasView } from "./pendencias-view";

export const metadata = { title: "Pendências — MiniMerX" };

export default async function PendenciasPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/dashboard");
  return <PendenciasView />;
}
```

```tsx
// src/app/(dashboard)/admin/pendencias/pendencias-view.tsx
"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Skeleton } from "@/components/ui/skeleton";
import { competenciaLabel } from "@/lib/competencia";
import { cn } from "@/lib/utils";

interface Pendencia {
  tipo: string;
  severidade: "ALTA" | "MEDIA" | "BAIXA";
  descricao: string;
  condominioId: string;
  condominioNome: string;
  competencia: string | null;
}

const SEV_CONF = {
  ALTA:  { className: "bg-red-50 border-red-200 text-red-700",    icon: AlertCircle },
  MEDIA: { className: "bg-yellow-50 border-yellow-200 text-yellow-700", icon: Clock },
  BAIXA: { className: "bg-blue-50 border-blue-200 text-blue-700", icon: CheckCircle },
};

export function PendenciasView() {
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/pendencias")
      .then((r) => r.json())
      .then((d: { pendencias: Pendencia[] }) => setPendencias(d.pendencias ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Topbar role="ADMIN" condominioNome={null} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-minimerx-navy">Pendências Operacionais</h1>
          <p className="mt-1 text-sm text-minimerx-gray">Itens que requerem ação para completar o ciclo mensal.</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : pendencias.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-green-200 bg-green-50 py-16 text-center">
            <CheckCircle className="h-10 w-10 text-green-600 mb-3" />
            <p className="font-semibold text-green-700">Nenhuma pendência!</p>
            <p className="text-sm text-green-600 mt-1">Todos os condomínios estão em dia.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendencias.map((p, i) => {
              const cfg = SEV_CONF[p.severidade];
              const Icon = cfg.icon;
              return (
                <div key={i} className={cn("flex items-start gap-4 rounded-xl border p-4", cfg.className)}>
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{p.condominioNome}</p>
                    <p className="text-sm">{p.descricao}</p>
                    {p.competencia && (
                      <p className="text-xs mt-1 opacity-75">Competência: {competenciaLabel(p.competencia)}</p>
                    )}
                  </div>
                  <span className="text-xs font-semibold uppercase">{p.severidade}</span>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
```

- [ ] **Step 4: Verificar build**

```bash
npm run build
```

Esperado: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/pendencias/ src/app/(dashboard)/admin/pendencias/ src/components/AppSidebar.tsx
git commit -m "feat: add pendencias API, page and sidebar badge"
```

---

## Task 13: Sidebar — Novos Itens de Menu + Proteção de Rotas

**Files:**
- Modify: `src/components/AppSidebar.tsx`
- Modify: `src/middleware.ts`

- [ ] **Step 1: Adicionar itens de menu no AppSidebar**

Para ADMIN, adicionar ao array `items`:
```tsx
{ href: "/admin/comprovantes", label: "Comprovantes", icon: FileCheck },
{ href: "/admin/pendencias", label: "Pendências", icon: AlertCircle, badge: pendenciasCount > 0 ? pendenciasCount : undefined },
```

Para SINDICO, adicionar:
```tsx
{ href: "/historico", label: "Histórico", icon: History },
```

Imports adicionais necessários:
```tsx
import { History, FileCheck } from "lucide-react";
```

- [ ] **Step 2: Verificar tipagem do item de nav com badge**

Atualizar o tipo local `items`:
```tsx
const items: Array<{
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}> = role === "ADMIN" ? [...] : [...];
```

- [ ] **Step 3: Atualizar middleware para incluir /historico**

O `/historico` já está protegido pelo matcher geral (requer login). Verificar que o matcher inclui a rota. O middleware atual:

```typescript
matcher: [
  "/((?!api/auth|_next/static|_next/image|favicon.ico|logo-modelo1.svg|logo-modelo2.svg).*)",
],
```

Isso já captura `/historico`. Nenhuma alteração necessária no matcher. ✓

- [ ] **Step 4: Verificar build**

```bash
npm run build
```

Esperado: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/components/AppSidebar.tsx src/middleware.ts
git commit -m "feat: update sidebar with Comprovantes, Historico and Pendencias links"
```

---

## Task 14: Teste Manual End-to-End

- [ ] **Step 1: Subir o servidor de desenvolvimento**

```bash
npm run dev
```

- [ ] **Step 2: Testar ciclo completo como ADMIN**

1. Login como admin (`admin@minimerx.com.br`)
2. Ir em **Comprovantes** → clicar "Novo Comprovante"
3. Selecionar condomínio + competência (ex: `2026-03`) + arquivo PDF + valor + data + forma pagamento
4. Confirmar → comprovante aparece na lista com status "Anexado"
5. Clicar "Enviar" → verificar modal com destinatários cadastrados
6. Confirmar envio → verificar resultado (enviados/falhas)
7. Ir em **Histórico** → selecionar o mesmo condomínio → verificar status "Comunicada" na competência
8. Ir em **Pendências** → verificar que a competência não aparece mais como pendente

- [ ] **Step 3: Testar como SINDICO**

1. Login como síndico do condomínio
2. Ir em **Histórico** → visualizar competências com status e repasse
3. Clicar no download do comprovante → arquivo deve ser baixado
4. Ir em **Notificações** → verificar e-mails cadastrados

- [ ] **Step 4: Testar isolamento de dados**

1. Criar segundo condomínio com segundo síndico
2. Logar como síndico 1 → Histórico deve mostrar apenas as competências do condomínio 1
3. Tentar acessar `/api/admin/comprovantes/[id-do-cond-2]/arquivo` → deve retornar 403

- [ ] **Step 5: Commit final da task**

```bash
git add .
git commit -m "chore: end-to-end manual test verification - Onda 1"
```

---

## Checklist de Cobertura da Especificação

Verificação pós-plano contra `docs/ESPECIFICACAO_FUNCIONAL_EVOLUCAO.md` seção 10 (obrigatórias):

| Requisito | Task |
|---|---|
| Upload de comprovante com metadados | Task 5 |
| Formatos aceitos (PDF/JPG/PNG) | Task 3 + Task 5 |
| Limite de 10 MB | Task 3 + Task 5 |
| Verificação de duplicidade por hash | Task 5 |
| Status: PENDENTE→ANEXADO→ENVIADO | Task 5 + Task 10 |
| Substituição com justificativa e versionamento | Task 6 |
| Cancelamento lógico (ADMIN only) | Task 6 |
| Download autenticado | Task 6 |
| Trilha de auditoria em todas as operações | Task 2 + todos |
| Envio de e-mail com comprovante anexo | Task 10 |
| Template HTML institucional | Task 4 |
| Destinatários do cadastro do síndico | Task 10 |
| Registro do envio (status, destinatários, falhas) | Task 10 |
| Reenvio gerando novo registro | Task 10 |
| Histórico por competência com status consolidado | Task 8 + Task 9 |
| Isolamento de dados por condomínio (SINDICO) | Tasks 5, 6, 8 |
| Alertas: sem destinatário, sem comprovante, não enviado | Task 12 |
| Badge de pendências no sidebar | Task 12 |

**Lacunas intencionais (fora do escopo desta Onda):**
- Central de documentos avulsos (Onda 2)
- Exportação de relatórios (Onda 2)
- Confirmação de leitura / pixel tracking (Onda 3)
- Agendamento de envios (Onda 2)

---

*Fim do plano — Onda 1 — Prestação de Contas.*
