"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPercent } from "@/lib/formatters";

interface Sindico {
  id: string;
  nome: string;
  email: string;
}

interface Condominio {
  id: string;
  nome: string;
  percentualRepasse: number;
  sindico: Sindico | null;
}

interface FormState {
  id: string | null;
  nome: string;
  percentualRepasse: string;
  sindicoNome: string;
  sindicoEmail: string;
  sindicoSenha: string;
}

const emptyForm: FormState = {
  id: null,
  nome: "",
  percentualRepasse: "",
  sindicoNome: "",
  sindicoEmail: "",
  sindicoSenha: "",
};

export function CondominiosView({ items }: { items: Condominio[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openCreate() {
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  }

  function openEdit(c: Condominio) {
    setForm({
      id: c.id,
      nome: c.nome,
      percentualRepasse: String(c.percentualRepasse).replace(".", ","),
      sindicoNome: c.sindico?.nome ?? "",
      sindicoEmail: c.sindico?.email ?? "",
      sindicoSenha: "",
    });
    setError(null);
    setOpen(true);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const payload = {
      nome: form.nome,
      percentualRepasse: Number(form.percentualRepasse.replace(",", ".")),
      sindicoNome: form.sindicoNome,
      sindicoEmail: form.sindicoEmail,
      sindicoSenha: form.sindicoSenha || undefined,
    };

    startTransition(async () => {
      const url = form.id ? `/api/condominios/${form.id}` : "/api/condominios";
      const method = form.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Erro ao salvar.");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Topbar role="ADMIN" condominioNome="Gestão de Condomínios" />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-minimerx-navy">Condomínios</h1>
            <p className="mt-1 text-sm text-minimerx-gray">
              Gerencie os condomínios atendidos e seus respectivos síndicos.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo condomínio
          </Button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>% Repasse</TableHead>
                <TableHead>Síndico</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-sm text-minimerx-gray">
                    Nenhum condomínio cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell>{formatPercent(c.percentualRepasse)}</TableCell>
                    <TableCell>
                      {c.sindico ? (
                        <div>
                          <p className="font-medium">{c.sindico.nome}</p>
                          <p className="text-xs text-minimerx-gray">{c.sindico.email}</p>
                        </div>
                      ) : (
                        <span className="text-minimerx-gray">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.id ? "Editar condomínio" : "Novo condomínio"}</DialogTitle>
              <DialogDescription>
                {form.id
                  ? "Atualize os dados do condomínio e do síndico responsável."
                  : "Cadastre o condomínio e crie automaticamente o acesso do síndico."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do condomínio</Label>
                <Input
                  id="nome"
                  tabIndex={1}
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="percentual">% de repasse</Label>
                <Input
                  id="percentual"
                  tabIndex={2}
                  inputMode="decimal"
                  placeholder="12,5"
                  value={form.percentualRepasse}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, percentualRepasse: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h3 className="mb-3 text-sm font-semibold text-minimerx-navy">Síndico</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sindicoNome">Nome</Label>
                    <Input
                      id="sindicoNome"
                      tabIndex={3}
                      value={form.sindicoNome}
                      onChange={(e) => setForm((f) => ({ ...f, sindicoNome: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sindicoEmail">E-mail</Label>
                    <Input
                      id="sindicoEmail"
                      tabIndex={4}
                      type="email"
                      value={form.sindicoEmail}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, sindicoEmail: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sindicoSenha">
                      Senha {form.id ? <span className="text-minimerx-gray">(deixe vazio para manter)</span> : null}
                    </Label>
                    <Input
                      id="sindicoSenha"
                      tabIndex={5}
                      type="password"
                      value={form.sindicoSenha}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, sindicoSenha: e.target.value }))
                      }
                      required={!form.id}
                      minLength={form.id ? undefined : 8}
                    />
                  </div>
                </div>
              </div>

              {error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : null}

              <DialogFooter className="gap-2">
                <Button tabIndex={6} type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button tabIndex={7} type="submit" disabled={pending}>
                  {pending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
