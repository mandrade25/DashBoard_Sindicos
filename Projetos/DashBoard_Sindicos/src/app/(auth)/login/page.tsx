import Image from "next/image";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-minimerx-light px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex justify-center">
          <Image
            src="/logo-modelo1.svg"
            alt="MiniMerX Market by LAVAX"
            width={240}
            height={120}
            priority
          />
        </div>
        <h1 className="mb-1 text-center text-2xl font-bold text-minimerx-navy">
          Acessar Dashboard
        </h1>
        <p className="mb-6 text-center text-sm text-minimerx-gray">
          Entre com suas credenciais MiniMerX
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
