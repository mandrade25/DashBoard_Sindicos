"use client";

import { useState, useTransition } from "react";
import { CheckCircle, KeyRound } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AlterarSenhaView({ usuarioNome }: { usuarioNome: string }) {
  const [form, setForm] = useState({ senhaAtual: "", novaSenha: "", confirmar: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (form.novaSenha !== form.confirmar) {
      setError("A nova senha e a confirmação não coincidem.");
      return;
    }
    if (form.novaSenha.length < 8) {
      setError("A nova senha deve ter no mínimo 8 caracteres.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/usuario/alterar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual: form.senhaAtual, novaSenha: form.novaSenha }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Erro ao alterar senha.");
        return;
      }
      setSuccess(true);
      setForm({ senhaAtual: "", novaSenha: "", confirmar: "" });
    });
  }

  return (
    <>
      <Topbar role="SINDICO" condominioNome="Meu Perfil" />
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-minimerx-navy">
            <KeyRound className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-minimerx-navy">Alterar Senha</h1>
            <p className="text-sm text-minimerx-gray">{usuarioNome}</p>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle className="h-12 w-12 text-minimerx-green" />
              <p className="text-lg font-semibold text-minimerx-navy">Senha alterada com sucesso!</p>
              <p className="text-sm text-minimerx-gray">Use a nova senha no próximo acesso.</p>
              <Button variant="outline" className="mt-2" onClick={() => setSuccess(false)}>
                Alterar novamente
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="senhaAtual">Senha atual</Label>
                <Input
                  id="senhaAtual"
                  type="password"
                  autoComplete="current-password"
                  value={form.senhaAtual}
                  onChange={(e) => setForm((f) => ({ ...f, senhaAtual: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="novaSenha">Nova senha</Label>
                <Input
                  id="novaSenha"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  value={form.novaSenha}
                  onChange={(e) => setForm((f) => ({ ...f, novaSenha: e.target.value }))}
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmar">Confirmar nova senha</Label>
                <Input
                  id="confirmar"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmar}
                  onChange={(e) => setForm((f) => ({ ...f, confirmar: e.target.value }))}
                  required
                  minLength={8}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Salvando..." : "Alterar senha"}
              </Button>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
