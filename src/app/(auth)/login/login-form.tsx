"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFormProps = {
  callbackUrl?: string;
};

export function LoginForm({ callbackUrl = "/dashboard" }: LoginFormProps) {
  const [csrfToken, setCsrfToken] = useState<string>("");
  const [loadingToken, setLoadingToken] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    let active = true;

    async function loadCsrfToken() {
      setLoadingToken(true);
      setTokenError(null);

      try {
        const response = await fetch("/api/auth/csrf", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) {
          throw new Error("csrf");
        }

        const body = await response.json();
        if (!active) return;

        setCsrfToken(body.csrfToken ?? "");
      } catch {
        if (!active) return;
        setTokenError("Nao foi possivel iniciar o login. Recarregue a pagina.");
      } finally {
        if (active) setLoadingToken(false);
      }
    }

    void loadCsrfToken();

    return () => {
      active = false;
    };
  }, []);

  const authError = searchParams.get("error");
  const authErrorMessage =
    authError === "MissingCSRF"
      ? "A sessao de login expirou. Recarregue a pagina e tente novamente."
      : authError === "RateLimit"
        ? "Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente."
      : authError
        ? "E-mail ou senha invalidos."
        : null;

  return (
    <form className="space-y-5" method="post" action="/api/auth/callback/credentials">
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-minimerx-navy">
          E-mail
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-12 text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-minimerx-navy">
          Senha
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 text-base"
        />
      </div>

      {authErrorMessage ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{authErrorMessage}</span>
        </div>
      ) : null}

      {tokenError ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{tokenError}</span>
        </div>
      ) : null}

      <Button
        type="submit"
        className="h-12 w-full text-base font-semibold"
        disabled={loadingToken || !csrfToken}
      >
        {loadingToken ? "Preparando..." : "Entrar"}
      </Button>
    </form>
  );
}
