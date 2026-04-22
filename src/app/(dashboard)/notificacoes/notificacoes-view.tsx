"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  BellRing,
  Inbox,
  Loader2,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Topbar, type CondominioOption } from "@/components/Topbar";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface NotificationEmail {
  id: string;
  email: string;
  criadoEm: string;
  atualizadoEm: string;
}

interface FormState {
  id: string | null;
  email: string;
}

const emptyForm: FormState = {
  id: null,
  email: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string) {
  return emailPattern.test(value.trim());
}

export function NotificacoesView({
  condominioNome,
  condominioIdSelecionado,
  condominios,
  initialItems,
}: {
  condominioNome: string;
  condominioIdSelecionado: string;
  condominios: CondominioOption[];
  initialItems: NotificationEmail[];
}) {
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<NotificationEmail | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const trimmedEmail = form.email.trim();
  const emailTouched = trimmedEmail.length > 0;
  const emailIsValid = isValidEmail(trimmedEmail);
  const duplicateEmail = useMemo(() => {
    return items.some(
      (item) => item.id !== form.id && item.email.toLowerCase() === trimmedEmail.toLowerCase(),
    );
  }, [form.id, items, trimmedEmail]);

  function buildApiUrl(path: string) {
    const params = new URLSearchParams();
    params.set("condominioId", condominioIdSelecionado);
    return `${path}?${params.toString()}`;
  }

  function handleSelecionarCondominio(id: string) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("condominioId", id);
    router.replace(`${pathname}?${nextParams.toString()}`);
  }

  async function refreshItems() {
    setLoading(true);
    setFetchError(null);

    const response = await fetch(buildApiUrl("/api/notificacoes"), { cache: "no-store" });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setFetchError(body.error ?? "Nao foi possivel carregar os e-mails.");
      setLoading(false);
      return;
    }

    const nextItems = (await response.json()) as NotificationEmail[];
    setItems(nextItems);
    setLoading(false);
  }

  function openCreate() {
    setForm(emptyForm);
    setFeedbackError(null);
    setDialogOpen(true);
  }

  function openEdit(item: NotificationEmail) {
    setForm({ id: item.id, email: item.email });
    setFeedbackError(null);
    setDialogOpen(true);
  }

  function openDelete(item: NotificationEmail) {
    setDeleteTarget(item);
    setFeedbackError(null);
    setDeleteDialogOpen(true);
  }

  function closeDialogs() {
    if (pending) return;
    setDialogOpen(false);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
    setFeedbackError(null);
  }

  function validateForm() {
    if (!trimmedEmail) {
      return "Informe um e-mail.";
    }

    if (!emailIsValid) {
      return "Informe um e-mail valido.";
    }

    if (duplicateEmail) {
      return "Este e-mail ja esta cadastrado na lista.";
    }

    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setFeedbackError(validationError);
      return;
    }

    setFeedbackError(null);

    startTransition(async () => {
      const response = await fetch(
        form.id ? buildApiUrl(`/api/notificacoes/${form.id}`) : buildApiUrl("/api/notificacoes"),
        {
          method: form.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmedEmail }),
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setFeedbackError(body.error ?? "Nao foi possivel salvar o e-mail.");
        return;
      }

      setDialogOpen(false);
      await refreshItems();
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;

    setFeedbackError(null);

    startTransition(async () => {
      const response = await fetch(buildApiUrl(`/api/notificacoes/${deleteTarget.id}`), {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setFeedbackError(body.error ?? "Nao foi possivel excluir o e-mail.");
        return;
      }

      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      await refreshItems();
      router.refresh();
    });
  }

  return (
    <>
      <Topbar
        role="SINDICO"
        condominioNome={condominioNome}
        condominioIdSelecionado={condominioIdSelecionado}
        condominios={condominios}
        onSelecionarCondominio={handleSelecionarCondominio}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-minimerx-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-minimerx-blue">
                <BellRing className="h-4 w-4" />
                Notificacoes por e-mail
              </div>
              <h1 className="mt-4 text-2xl font-bold text-minimerx-navy">
                Defina quem recebe os avisos do seu condominio
              </h1>
              <p className="mt-2 text-sm leading-6 text-minimerx-gray">
                Cadastre os enderecos responsaveis por receber as notificacoes automaticas da
                MiniMerX. A lista pode ser ajustada a qualquer momento.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" onClick={() => void refreshItems()} disabled={loading || pending}>
                <RefreshCw className={cn("h-4 w-4", loading ? "animate-spin" : "")} />
                Atualizar
              </Button>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Novo e-mail
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-minimerx-gray">
              Condominio
            </p>
            <p className="mt-2 text-lg font-semibold text-minimerx-navy">{condominioNome}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-minimerx-gray">
              Destinatarios ativos
            </p>
            <p className="mt-2 text-3xl font-bold text-minimerx-navy">
              {loading ? "..." : items.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-minimerx-gray">
              Validacao visual
            </p>
            <p className="mt-2 text-sm leading-6 text-minimerx-gray">
              O formulario libera o salvamento apenas com e-mail valido e sem duplicidade.
            </p>
          </div>
        </section>

        {fetchError ? (
          <section className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <h2 className="text-base font-semibold text-red-700">Erro ao carregar a lista</h2>
                  <p className="mt-1 text-sm text-red-600">{fetchError}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-red-200 bg-white text-red-700 hover:bg-red-100"
                onClick={() => void refreshItems()}
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          </section>
        ) : null}

        <section className="mt-6 rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-minimerx-navy">E-mails cadastrados</h2>
            <p className="mt-1 text-sm text-minimerx-gray">
              Gerencie os destinatarios que devem receber as mensagens automatizadas.
            </p>
          </div>

          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="grid gap-3 md:grid-cols-[1.5fr_180px_180px_120px]">
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-minimerx-light">
                <Inbox className="h-8 w-8 text-minimerx-gray" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-minimerx-navy">
                Nenhum e-mail cadastrado
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-minimerx-gray">
                Adicione os destinatarios que devem receber as notificacoes enviadas para este
                condominio.
              </p>
              <Button className="mt-6" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Cadastrar primeiro e-mail
              </Button>
            </div>
          ) : (
            <Table>
              <caption className="sr-only">
                Lista de e-mails cadastrados para notificacoes do condominio
              </caption>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead className="w-28 text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const valid = isValidEmail(item.email);

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-minimerx-light text-minimerx-blue">
                            <Mail className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-minimerx-navy">{item.email}</p>
                            <p className="text-xs text-minimerx-gray">
                              Atualizado em {formatDate(item.atualizadoEm)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                            valid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
                          )}
                        >
                          {valid ? "Valido" : "Revisar"}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(item.criadoEm)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(item)}
                            aria-label={`Editar ${item.email}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => openDelete(item)}
                            aria-label={`Excluir ${item.email}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </section>

        <Dialog open={dialogOpen} onOpenChange={(open) => !pending && setDialogOpen(open)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.id ? "Editar e-mail" : "Novo e-mail de notificacao"}</DialogTitle>
              <DialogDescription>
                {form.id
                  ? "Atualize o destinatario desta notificacao."
                  : "Cadastre um novo destinatario para receber notificacoes do condominio."}
              </DialogDescription>
            </DialogHeader>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="notification-email">E-mail</Label>
                <Input
                  id="notification-email"
                  type="email"
                  placeholder="nome@empresa.com.br"
                  value={form.email}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, email: event.target.value }));
                    if (feedbackError) setFeedbackError(null);
                  }}
                  className={cn(
                    emailTouched && !emailIsValid && "border-red-300 focus-visible:ring-red-400",
                  )}
                  aria-invalid={feedbackError ? "true" : "false"}
                  autoComplete="email"
                  required
                />

                {emailTouched ? (
                  <p className={cn("text-xs", emailIsValid ? "text-green-700" : "text-red-600")}>
                    {emailIsValid
                      ? "Formato de e-mail valido."
                      : "Digite um e-mail completo, por exemplo nome@empresa.com."}
                  </p>
                ) : (
                  <p className="text-xs text-minimerx-gray">
                    Use um e-mail que realmente recebera as notificacoes automaticas.
                  </p>
                )}

                {duplicateEmail ? (
                  <p className="text-xs text-red-600">
                    Este e-mail ja existe na lista de destinatarios.
                  </p>
                ) : null}
              </div>

              {feedbackError ? (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{feedbackError}</span>
                </div>
              ) : null}

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={closeDialogs} disabled={pending}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={pending || !emailIsValid || duplicateEmail}>
                  {pending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar e-mail"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialogOpen} onOpenChange={(open) => !pending && setDeleteDialogOpen(open)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir destinatario</DialogTitle>
              <DialogDescription>
                Esta acao remove o e-mail da lista de notificacoes do condominio.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-slate-200 bg-minimerx-light px-4 py-3 text-sm text-minimerx-navy">
              {deleteTarget?.email}
            </div>

            {feedbackError ? (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{feedbackError}</span>
              </div>
            ) : null}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={closeDialogs} disabled={pending}>
                Cancelar
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  "Excluir e-mail"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
