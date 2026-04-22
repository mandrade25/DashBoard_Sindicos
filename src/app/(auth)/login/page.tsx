import Link from "next/link";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/app/actions/logout";
import { LoginForm } from "@/app/(auth)/login/login-form";
import { Button } from "@/components/ui/button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string; error?: string };
}) {
  const session = await auth();
  const callbackUrl = searchParams?.callbackUrl || "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-[#1E2A5A] px-4">
      <div className="w-full max-w-[420px] rounded-2xl bg-white p-10 shadow-2xl max-sm:p-6">
        <div className="mb-8 flex justify-center">
          <img
            src="/logo-modelo1.svg"
            alt="MiniMerX Market by LAVAX"
            width={200}
            height={80}
            className="h-auto"
          />
        </div>
        <h1 className="mb-1 text-center text-2xl font-bold text-minimerx-navy">
          Acessar Dashboard
        </h1>
        <p className="mb-6 text-center text-sm text-minimerx-gray">
          Entre com suas credenciais MiniMerX
        </p>

        {session?.user ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-minimerx-navy">
              <p className="font-semibold">Sessao ativa detectada</p>
              <p className="mt-2">
                Voce esta logado como <strong>{session.user.email}</strong>.
              </p>
              <p className="mt-1 text-minimerx-gray">
                Para entrar com outro usuario, clique em <strong>Trocar conta</strong>.
              </p>
              <p className="mt-1 text-minimerx-gray">
                Por seguranca, a sessao expira automaticamente apos algumas horas de inatividade.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button asChild className="h-12 w-full text-base font-semibold">
                <Link href="/dashboard">Continuar com esta conta</Link>
              </Button>
              <form action={logoutAction}>
                <Button type="submit" variant="outline" className="h-12 w-full text-base font-semibold">
                  Trocar conta
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <LoginForm callbackUrl={callbackUrl} />
        )}
      </div>
    </div>
  );
}
