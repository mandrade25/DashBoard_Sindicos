"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  FileText,
  PlusCircle,
  Send,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { competenciaLabel, isValidPastCompetencia } from "@/lib/competencia";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface Condominio {
  id: string;
  nome: string;
  percentualRepasse: string;
}

interface ComprovanteItem {
  id: string;
  condominioId: string;
  competencia: string;
  nomeArquivo: string;
  valorRepasse: string;
  dataPagamento: string;
  formaPagamento: string;
  observacao?: string | null;
  visivelSindico: boolean;
  status: string;
  criadoEm: string;
  atualizadoEm: string;
  condominio: { nome: string };
}

interface DivergenciaPayload {
  mode: "create" | "edit" | "metadata";
  valorInformado: number;
  repasseEsperado: number;
  divergencia: number;
}

interface RepasseResumo {
  faturamento: number;
  percentualRepasse: number;
  repasseEstimado: number;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: typeof CheckCircle }
> = {
  PENDENTE: { label: "Pendente", className: "bg-slate-100 text-slate-600", icon: Clock },
  ANEXADO: { label: "Anexado", className: "bg-blue-100 text-blue-700", icon: FileText },
  ENVIADO: { label: "Enviado", className: "bg-green-100 text-green-700", icon: CheckCircle },
  SUBSTITUIDO: {
    label: "Substituído",
    className: "bg-yellow-100 text-yellow-700",
    icon: AlertTriangle,
  },
  CANCELADO: { label: "Cancelado", className: "bg-red-100 text-red-700", icon: XCircle },
};

const FORMAS_PAGAMENTO = [
  { value: "PIX", label: "PIX" },
  { value: "TED", label: "TED" },
  { value: "DOC", label: "DOC" },
  { value: "TRANSFERENCIA_INTERNA", label: "Transferência Interna" },
  { value: "OUTRO", label: "Outro" },
];

function groupStatus(groupItems: ComprovanteItem[]): string {
  if (groupItems.some((item) => item.status === "ENVIADO")) return "ENVIADO";
  return "ANEXADO";
}

export function ComprovantesView({
  condominios,
  initialComprovantes,
}: {
  condominios: Condominio[];
  initialComprovantes: ComprovanteItem[];
}) {
  const [items, setItems] = useState(initialComprovantes);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<{
    condominioId: string;
    competencia: string;
    condominioNome: string;
    primaryId: string;
  } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [envioDialogOpen, setEnvioDialogOpen] = useState(false);
  const [divergenciaDialogOpen, setDivergenciaDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [divergenciaPayload, setDivergenciaPayload] = useState<DivergenciaPayload | null>(null);
  const [repasseResumo, setRepasseResumo] = useState<RepasseResumo | null>(null);
  const [repasseResumoLoading, setRepasseResumoLoading] = useState(false);
  const [editRepasseResumo, setEditRepasseResumo] = useState<RepasseResumo | null>(null);
  const [editRepasseResumoLoading, setEditRepasseResumoLoading] = useState(false);

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

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

  const [editVisivelSindico, setEditVisivelSindico] = useState(false);
  const [editForm, setEditForm] = useState({
    valorRepasse: "",
    dataPagamento: "",
    formaPagamento: "",
    observacao: "",
  });
  const [editArquivo, setEditArquivo] = useState<File | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (!dialogOpen || !form.condominioId || !isValidPastCompetencia(form.competencia)) {
      setRepasseResumo(null);
      setRepasseResumoLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadRepasseResumo() {
      setRepasseResumoLoading(true);

      try {
        const params = new URLSearchParams({
          condominioId: form.condominioId,
          competencia: form.competencia,
        });
        const res = await fetch(`/api/admin/comprovantes/calculo?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          setRepasseResumo(null);
          return;
        }

        const data = (await res.json()) as RepasseResumo;
        setRepasseResumo(data);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setRepasseResumo(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setRepasseResumoLoading(false);
        }
      }
    }

    void loadRepasseResumo();

    return () => controller.abort();
  }, [dialogOpen, form.condominioId, form.competencia]);

  useEffect(() => {
    if (!editDialogOpen || !editGroup || !isValidPastCompetencia(editGroup.competencia)) {
      setEditRepasseResumo(null);
      setEditRepasseResumoLoading(false);
      return;
    }

    const currentEditGroup = editGroup;
    const controller = new AbortController();

    async function loadEditRepasseResumo() {
      setEditRepasseResumoLoading(true);

      try {
        const params = new URLSearchParams({
          condominioId: currentEditGroup.condominioId,
          competencia: currentEditGroup.competencia,
        });
        const res = await fetch(`/api/admin/comprovantes/calculo?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          setEditRepasseResumo(null);
          return;
        }

        const data = (await res.json()) as RepasseResumo;
        setEditRepasseResumo(data);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setEditRepasseResumo(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setEditRepasseResumoLoading(false);
        }
      }
    }

    void loadEditRepasseResumo();

    return () => controller.abort();
  }, [editDialogOpen, editGroup]);

  function normalizeItems(nextItems: ComprovanteItem[]) {
    return nextItems.map((item) => ({
      ...item,
      dataPagamento:
        typeof item.dataPagamento === "string"
          ? item.dataPagamento
          : new Date(item.dataPagamento).toISOString(),
      criadoEm:
        typeof item.criadoEm === "string"
          ? item.criadoEm
          : new Date(item.criadoEm).toISOString(),
      atualizadoEm:
        typeof item.atualizadoEm === "string"
          ? item.atualizadoEm
          : new Date(item.atualizadoEm).toISOString(),
    }));
  }

  const groupedItems = useMemo(() => {
    const groups = new Map<string, ComprovanteItem[]>();

    for (const item of items) {
      if (item.status === "CANCELADO") continue;
      const key = `${item.condominioId}|${item.competencia}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }

    return Array.from(groups.values())
      .map((groupItems) => {
        const sorted = [...groupItems].sort(
          (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
        );
        return { items: sorted, primary: sorted[0] };
      })
      .sort((a, b) => {
        const cmp = b.primary.competencia.localeCompare(a.primary.competencia);
        return cmp !== 0
          ? cmp
          : new Date(b.primary.criadoEm).getTime() - new Date(a.primary.criadoEm).getTime();
      });
  }, [items]);

  const editGroupItems = useMemo(() => {
    if (!editGroup) return [];

    return items
      .filter(
        (item) =>
          item.condominioId === editGroup.condominioId &&
          item.competencia === editGroup.competencia &&
          item.status !== "CANCELADO",
      )
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }, [items, editGroup]);

  async function refreshItems() {
    const res = await fetch("/api/admin/comprovantes");
    if (res.ok) {
      const data = (await res.json()) as ComprovanteItem[];
      setItems(normalizeItems(data));
    }
  }

  function openCreate() {
    setForm({
      condominioId: "",
      competencia: "",
      valorRepasse: "",
      dataPagamento: "",
      formaPagamento: "",
      observacao: "",
      visivelSindico: false,
    });
    setArquivo(null);
    setError(null);
    setSuccessMsg(null);
    setRepasseResumo(null);
    setRepasseResumoLoading(false);
    setDialogOpen(true);
  }

  function openEditGroup(primary: ComprovanteItem) {
    setEditGroup({
      condominioId: primary.condominioId,
      competencia: primary.competencia,
      condominioNome: primary.condominio.nome,
      primaryId: primary.id,
    });
    setEditVisivelSindico(primary.visivelSindico);
    setEditForm({
      valorRepasse: String(primary.valorRepasse),
      dataPagamento: primary.dataPagamento.slice(0, 10),
      formaPagamento: primary.formaPagamento,
      observacao: primary.observacao ?? "",
    });
    setEditArquivo(null);
    setEditError(null);
    setEditDialogOpen(true);
  }

  function handleCompetenciaChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    const formatted = digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
    setForm((current) => ({ ...current, competencia: formatted }));
  }

  async function submitComprovante(mode: "create" | "edit", confirmarDivergencia = false) {
    const isEdit = mode === "edit";
    const currentArquivo = isEdit ? editArquivo : arquivo;
    const currentCondominioId = isEdit ? editGroup?.condominioId ?? "" : form.condominioId;
    const currentCompetencia = isEdit ? editGroup?.competencia ?? "" : form.competencia;
    const currentValorRepasse = isEdit ? editForm.valorRepasse : form.valorRepasse;
    const currentDataPagamento = isEdit ? editForm.dataPagamento : form.dataPagamento;
    const currentFormaPagamento = isEdit ? editForm.formaPagamento : form.formaPagamento;
    const currentObservacao = isEdit ? editForm.observacao : form.observacao;
    const currentVisivelSindico = isEdit ? editVisivelSindico : form.visivelSindico;

    if (!currentArquivo) {
      isEdit ? setEditError("Selecione o arquivo.") : setError("Selecione o arquivo do comprovante.");
      return;
    }
    if (!currentCondominioId) {
      setError("Selecione o condomínio.");
      return;
    }
    if (!currentCompetencia || !isValidPastCompetencia(currentCompetencia)) {
      const message = "Competência inválida ou futura.";
      isEdit ? setEditError(message) : setError(message);
      return;
    }
    if (!currentValorRepasse || isNaN(parseFloat(currentValorRepasse))) {
      const message = "Valor de repasse inválido.";
      isEdit ? setEditError(message) : setError(message);
      return;
    }
    if (!currentDataPagamento) {
      const message = "Informe a data do pagamento.";
      isEdit ? setEditError(message) : setError(message);
      return;
    }
    if (!currentFormaPagamento) {
      const message = "Selecione a forma de pagamento.";
      isEdit ? setEditError(message) : setError(message);
      return;
    }

    isEdit ? setEditError(null) : setError(null);

    const fd = new FormData();
    fd.append("arquivo", currentArquivo);
    fd.append("condominioId", currentCondominioId);
    fd.append("competencia", currentCompetencia);
    fd.append("valorRepasse", currentValorRepasse);
    fd.append("dataPagamento", currentDataPagamento);
    fd.append("formaPagamento", currentFormaPagamento);
    if (currentObservacao) fd.append("observacao", currentObservacao);
    fd.append("visivelSindico", String(currentVisivelSindico));
    if (confirmarDivergencia) fd.append("confirmarDivergencia", "true");

    const res = await fetch("/api/admin/comprovantes", { method: "POST", body: fd });
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      temDivergencia?: boolean;
      divergencia?: number;
      requiresConfirmation?: boolean;
      repasseEsperado?: number;
      valorInformado?: number;
    };

    if (!res.ok) {
      if (
        res.status === 409 &&
        body.requiresConfirmation &&
        body.repasseEsperado !== undefined &&
        body.valorInformado !== undefined &&
        body.divergencia !== undefined
      ) {
        setDivergenciaPayload({
          mode,
          valorInformado: body.valorInformado,
          repasseEsperado: body.repasseEsperado,
          divergencia: body.divergencia,
        });
        setDivergenciaDialogOpen(true);
        return;
      }

      const message = body.error ?? "Erro ao salvar.";
      isEdit ? setEditError(message) : setError(message);
      return;
    }

    setSuccessMsg(
      body.temDivergencia && body.divergencia
        ? `Comprovante salvo. Divergência confirmada de ${formatCurrency(body.divergencia)} em relação ao repasse calculado.`
        : "Comprovante salvo com sucesso.",
    );

    if (isEdit) {
      setEditArquivo(null);
    } else {
      setDialogOpen(false);
    }

    setDivergenciaDialogOpen(false);
    setDivergenciaPayload(null);
    await refreshItems();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await submitComprovante("create");
    });
  }

  function handleSaveMetadata() {
    if (!editGroup) return;
    if (!editForm.valorRepasse || isNaN(parseFloat(editForm.valorRepasse))) {
      setEditError("Valor de repasse inválido.");
      return;
    }
    if (!editForm.dataPagamento) {
      setEditError("Informe a data do pagamento.");
      return;
    }
    if (!editForm.formaPagamento) {
      setEditError("Selecione a forma de pagamento.");
      return;
    }

    setEditError(null);
    startTransition(async () => {
      const [metaRes, visRes] = await Promise.all([
        fetch(`/api/admin/comprovantes/${editGroup.primaryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            valorRepasse: editForm.valorRepasse,
            dataPagamento: editForm.dataPagamento,
            formaPagamento: editForm.formaPagamento,
            observacao: editForm.observacao,
          }),
        }),
        fetch("/api/admin/comprovantes", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            condominioId: editGroup.condominioId,
            competencia: editGroup.competencia,
            visivelSindico: editVisivelSindico,
          }),
        }),
      ]);

      const metaBody = (await metaRes.json().catch(() => ({}))) as {
        error?: string;
        requiresConfirmation?: boolean;
        repasseEsperado?: number;
        valorInformado?: number;
        divergencia?: number;
      };

      if (
        metaRes.status === 409 &&
        metaBody.requiresConfirmation &&
        metaBody.repasseEsperado !== undefined &&
        metaBody.valorInformado !== undefined &&
        metaBody.divergencia !== undefined
      ) {
        setDivergenciaPayload({
          mode: "metadata",
          valorInformado: metaBody.valorInformado,
          repasseEsperado: metaBody.repasseEsperado,
          divergencia: metaBody.divergencia,
        });
        setDivergenciaDialogOpen(true);
        return;
      }

      if (!metaRes.ok || !visRes.ok) {
        const body = (metaRes.ok
          ? await visRes.json().catch(() => ({}))
          : metaBody) as {
          error?: string;
        };
        setEditError(body.error ?? "Erro ao salvar.");
        return;
      }

      await refreshItems();
    });
  }

  async function confirmSaveMetadata() {
    if (!editGroup) return;

    const [metaRes, visRes] = await Promise.all([
      fetch(`/api/admin/comprovantes/${editGroup.primaryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valorRepasse: editForm.valorRepasse,
          dataPagamento: editForm.dataPagamento,
          formaPagamento: editForm.formaPagamento,
          observacao: editForm.observacao,
          confirmarDivergencia: true,
        }),
      }),
      fetch("/api/admin/comprovantes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condominioId: editGroup.condominioId,
          competencia: editGroup.competencia,
          visivelSindico: editVisivelSindico,
        }),
      }),
    ]);

    const metaBody = (await metaRes.json().catch(() => ({}))) as { error?: string; divergencia?: number };
    if (!metaRes.ok || !visRes.ok) {
      const body = (metaRes.ok
        ? await visRes.json().catch(() => ({}))
        : metaBody) as { error?: string };
      setEditError(body.error ?? "Erro ao salvar.");
      return;
    }

    setDivergenciaDialogOpen(false);
    setDivergenciaPayload(null);
    setSuccessMsg(
      metaBody.divergencia
        ? `Comprovante salvo. Divergência confirmada de ${formatCurrency(metaBody.divergencia)} em relação ao repasse calculado.`
        : "Dados salvos com sucesso.",
    );
    await refreshItems();
  }

  function handleAddFile(e: React.FormEvent) {
    e.preventDefault();
    if (!editGroup) return;
    startTransition(async () => {
      await submitComprovante("edit");
    });
  }

  function handleDeleteFile(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/comprovantes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setEditError(body.error ?? "Erro ao excluir.");
        return;
      }
      await refreshItems();
    });
  }

  function openEnvio(id: string) {
    setSelectedId(id);
    setError(null);
    setSuccessMsg(null);
    setEnvioDialogOpen(true);
  }

  function handleEnvio() {
    if (!selectedId) return;

    startTransition(async () => {
      const res = await fetch("/api/admin/envios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comprovanteId: selectedId }),
      });

      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        enviados?: string[];
        falhas?: Array<{ email: string; erro: string }>;
      };

      if (!res.ok) {
        setError(body.error ?? "Erro ao enviar.");
        return;
      }

      const enviados = body.enviados?.length ?? 0;
      const falhas = body.falhas?.length ?? 0;
      setSuccessMsg(`E-mail enviado: ${enviados} entregue(s)${falhas > 0 ? `, ${falhas} falha(s)` : ""}.`);
      setEnvioDialogOpen(false);
      await refreshItems();
    });
  }

  return (
    <>
      <Topbar role="ADMIN" condominioNome="Comprovantes de Repasse" />
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-minimerx-navy">Comprovantes de Repasse</h1>
            <p className="mt-1 text-sm text-minimerx-gray">
              Gerencie os comprovantes bancários por condomínio e competência.
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Upload className="h-4 w-4" />
            Novo Comprovante
          </Button>
        </div>

        {successMsg ? (
          <div className="flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Condomínio</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead>Repasse</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Arquivos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center text-minimerx-gray">
                    Nenhum comprovante cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                groupedItems.map(({ items: groupItems, primary }) => {
                  const status = groupStatus(groupItems);
                  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDENTE;
                  const Icon = cfg.icon;
                  const sendableItem = groupItems.find((item) => item.status === "ANEXADO");

                  return (
                    <TableRow key={`${primary.condominioId}|${primary.competencia}`}>
                      <TableCell className="font-medium text-minimerx-navy">
                        {primary.condominio.nome}
                      </TableCell>
                      <TableCell>{competenciaLabel(primary.competencia)}</TableCell>
                      <TableCell>{formatCurrency(primary.valorRepasse)}</TableCell>
                      <TableCell>{formatDate(primary.dataPagamento)}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                            cfg.className,
                          )}
                          title={`Última atualização do status: ${formatDateTime(primary.atualizadoEm)}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {cfg.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-xs text-minimerx-gray">
                          <FileText className="h-3.5 w-3.5" />
                          {groupItems.length}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditGroup(primary)}
                            title="Gerenciar documentos"
                          >
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                          {sendableItem ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEnvio(sendableItem.id)}
                              title="Enviar e-mail"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => !pending && setDialogOpen(open)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Comprovante de Repasse</DialogTitle>
              <DialogDescription>
                Selecione o condomínio, competência e arquivo do comprovante.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Condomínio</Label>
                <Select
                  value={form.condominioId}
                  onValueChange={(value) => setForm((current) => ({ ...current, condominioId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {condominios.map((condominio) => (
                      <SelectItem key={condominio.id} value={condominio.id}>
                        {condominio.nome}
                      </SelectItem>
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
                    onChange={(e) => handleCompetenciaChange(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Data do Pagamento</Label>
                  <Input
                    type="date"
                    value={form.dataPagamento}
                    onChange={(e) => setForm((current) => ({ ...current, dataPagamento: e.target.value }))}
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
                    onChange={(e) => setForm((current) => ({ ...current, valorRepasse: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Forma de Pagamento</Label>
                  <Select
                    value={form.formaPagamento}
                    onValueChange={(value) => setForm((current) => ({ ...current, formaPagamento: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAS_PAGAMENTO.map((formaPagamento) => (
                        <SelectItem key={formaPagamento.value} value={formaPagamento.value}>
                          {formaPagamento.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-minimerx-gray">
                    Faturamento da competência
                  </p>
                  <p className="mt-1 text-lg font-semibold text-minimerx-navy">
                    {repasseResumoLoading
                      ? "Calculando..."
                      : repasseResumo
                        ? formatCurrency(repasseResumo.faturamento)
                        : "Selecione condomínio e competência"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-minimerx-gray">
                    Repasse estimado
                  </p>
                  <p className="mt-1 text-lg font-semibold text-minimerx-green">
                    {repasseResumoLoading
                      ? "Calculando..."
                      : repasseResumo
                        ? `${formatCurrency(repasseResumo.repasseEstimado)} (${repasseResumo.percentualRepasse.toFixed(2).replace(".", ",")}%)`
                        : "Selecione condomínio e competência"}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Arquivo (PDF, JPG ou PNG — máx. 10 MB)</Label>
                <div
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-6 transition-colors hover:border-minimerx-blue"
                  onClick={() => fileRef.current?.click()}
                >
                  {arquivo ? (
                    <p className="text-sm font-medium text-minimerx-navy">{arquivo.name}</p>
                  ) : (
                    <>
                      <Upload className="mb-2 h-8 w-8 text-minimerx-gray" />
                      <p className="text-sm text-minimerx-gray">Clique para selecionar o arquivo</p>
                    </>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Observação (opcional)</Label>
                <Input
                  placeholder="Anotações sobre o repasse..."
                  value={form.observacao}
                  onChange={(e) => setForm((current) => ({ ...current, observacao: e.target.value }))}
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.visivelSindico}
                  onChange={(e) => setForm((current) => ({ ...current, visivelSindico: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span className="text-sm">Visível para o síndico</span>
              </label>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={pending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={editDialogOpen} onOpenChange={(open) => !pending && setEditDialogOpen(open)}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editGroup
                  ? `${editGroup.condominioNome} — ${competenciaLabel(editGroup.competencia)}`
                  : "Documentos"}
              </DialogTitle>
              <DialogDescription>
                Gerencie os arquivos anexados para esta competência.
              </DialogDescription>
            </DialogHeader>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100">
              <input
                type="checkbox"
                checked={editVisivelSindico}
                onChange={(e) => setEditVisivelSindico(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <div>
                <p className="text-sm font-medium text-minimerx-navy">Visível para o síndico</p>
                <p className="text-xs text-minimerx-gray">
                  Aplica-se a todos os documentos desta competência ao salvar.
                </p>
              </div>
            </label>

            <div className="space-y-2">
              <p className="text-sm font-medium text-minimerx-navy">Documentos anexados</p>
              {editGroupItems.length === 0 ? (
                <p className="py-2 text-sm text-minimerx-gray">Nenhum documento encontrado.</p>
              ) : (
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {editGroupItems.map((item) => {
                    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDENTE;
                    const Icon = cfg.icon;
                    const canDelete = item.status === "ANEXADO";

                    return (
                      <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                        <FileText className="h-4 w-4 shrink-0 text-minimerx-gray" />
                        <span className="flex-1 truncate text-sm text-minimerx-navy">
                          {item.nomeArquivo}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                            cfg.className,
                          )}
                          title={`Última atualização do status: ${formatDateTime(item.atualizadoEm)}`}
                        >
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                        <Button variant="ghost" size="sm" asChild title="Baixar">
                          <a href={`/api/admin/comprovantes/${item.id}/arquivo`} download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        {canDelete ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDeleteFile(item.id)}
                            disabled={pending}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-4">
              <p className="mb-3 text-sm font-medium text-minimerx-navy">Adicionar documento</p>
              <form onSubmit={handleAddFile} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Valor do Repasse (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={editForm.valorRepasse}
                      onChange={(e) => setEditForm((current) => ({ ...current, valorRepasse: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data do Pagamento</Label>
                    <Input
                      type="date"
                      value={editForm.dataPagamento}
                      onChange={(e) => setEditForm((current) => ({ ...current, dataPagamento: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Forma de Pagamento</Label>
                  <Select
                    value={editForm.formaPagamento}
                    onValueChange={(value) => setEditForm((current) => ({ ...current, formaPagamento: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAS_PAGAMENTO.map((formaPagamento) => (
                        <SelectItem key={formaPagamento.value} value={formaPagamento.value}>
                          {formaPagamento.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-minimerx-gray">
                      Faturamento da competência
                    </p>
                    <p className="mt-1 text-lg font-semibold text-minimerx-navy">
                      {editRepasseResumoLoading
                        ? "Calculando..."
                        : editRepasseResumo
                          ? formatCurrency(editRepasseResumo.faturamento)
                          : "Resumo indisponível"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-minimerx-gray">
                      Repasse estimado
                    </p>
                    <p className="mt-1 text-lg font-semibold text-minimerx-green">
                      {editRepasseResumoLoading
                        ? "Calculando..."
                        : editRepasseResumo
                          ? `${formatCurrency(editRepasseResumo.repasseEstimado)} (${editRepasseResumo.percentualRepasse.toFixed(2).replace(".", ",")}%)`
                          : "Resumo indisponível"}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Arquivo (PDF, JPG ou PNG — máx. 10 MB)</Label>
                  <div
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-4 transition-colors hover:border-minimerx-blue"
                    onClick={() => editFileRef.current?.click()}
                  >
                    {editArquivo ? (
                      <p className="text-sm font-medium text-minimerx-navy">{editArquivo.name}</p>
                    ) : (
                      <>
                        <Upload className="mb-1 h-6 w-6 text-minimerx-gray" />
                        <p className="text-sm text-minimerx-gray">Clique para selecionar</p>
                      </>
                    )}
                    <input
                      ref={editFileRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => setEditArquivo(e.target.files?.[0] ?? null)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Observação (opcional)</Label>
                  <Input
                    placeholder="Anotações..."
                    value={editForm.observacao}
                    onChange={(e) => setEditForm((current) => ({ ...current, observacao: e.target.value }))}
                  />
                </div>

                {editError ? <p className="text-sm text-red-600">{editError}</p> : null}

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                    disabled={pending}
                  >
                    Fechar
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSaveMetadata}
                    disabled={pending}
                  >
                    {pending ? "Salvando..." : "Salvar dados"}
                  </Button>
                  <Button type="submit" disabled={pending} className="gap-2">
                    <Upload className="h-4 w-4" />
                    {pending ? "Salvando..." : "Adicionar Arquivo"}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={envioDialogOpen} onOpenChange={(open) => !pending && setEnvioDialogOpen(open)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Enviar Comprovante por E-mail</DialogTitle>
              <DialogDescription>
                O comprovante será enviado para todos os e-mails cadastrados no condomínio.
              </DialogDescription>
            </DialogHeader>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEnvioDialogOpen(false)}
                disabled={pending}
              >
                Cancelar
              </Button>
              <Button onClick={handleEnvio} disabled={pending}>
                {pending ? "Enviando..." : "Confirmar Envio"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={divergenciaDialogOpen}
          onOpenChange={(open) => {
            if (!pending && !open) {
              setDivergenciaDialogOpen(false);
              setDivergenciaPayload(null);
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Divergência do Repasse</DialogTitle>
              <DialogDescription>
                O valor informado é diferente do repasse calculado para a competência. Revise os
                números abaixo antes de continuar.
              </DialogDescription>
            </DialogHeader>

            {divergenciaPayload ? (
              <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <div className="flex items-center justify-between gap-4">
                  <span>Valor informado</span>
                  <strong>{formatCurrency(divergenciaPayload.valorInformado)}</strong>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Repasse calculado</span>
                  <strong>{formatCurrency(divergenciaPayload.repasseEsperado)}</strong>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Divergência</span>
                  <strong>{formatCurrency(divergenciaPayload.divergencia)}</strong>
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDivergenciaDialogOpen(false);
                  setDivergenciaPayload(null);
                }}
                disabled={pending}
              >
                Revisar valor
              </Button>
              <Button
                type="button"
                disabled={pending || !divergenciaPayload}
                onClick={() => {
                  if (!divergenciaPayload) return;
                  startTransition(async () => {
                    if (divergenciaPayload.mode === "metadata") {
                      await confirmSaveMetadata();
                      return;
                    }
                    await submitComprovante(divergenciaPayload.mode, true);
                  });
                }}
              >
                {pending ? "Confirmando..." : "Salvar mesmo assim"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
