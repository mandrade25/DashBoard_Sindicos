import Image from "next/image";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-[#1E2A5A] px-4">
      <div className="w-full max-w-[420px] rounded-2xl bg-white p-10 shadow-2xl max-sm:p-6">
        <div className="mb-8 flex justify-center">
          <Image
            src="/logo-modelo1.svg"
            alt="MiniMerX Market by LAVAX"
            width={200}
            height={80}
            priority
            style={{ height: "auto" }}
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
