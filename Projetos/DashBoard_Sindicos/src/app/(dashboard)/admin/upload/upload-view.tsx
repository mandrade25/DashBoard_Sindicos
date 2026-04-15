"use client";

import { useRef, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Upload as UploadIcon } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";

interface UploadResponse {
  importados: number;
  ignorados: number;
  erros: string[];
  condominiosNaoEncontrados: string[];
}

export function UploadView() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
    setResult(null);
    setError(null);
  }

  function onDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setFile(f);
      setResult(null);
      setError(null);
    }
  }

  function onSubmit() {
    if (!file) return;
    setError(null);
    setResult(null);
    const fd = new FormData();
    fd.append("file", file);

    startTransition(async () => {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Falha no upload.");
        return;
      }
      const data: UploadResponse = await res.json();
      setResult(data);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <>
      <Topbar role="ADMIN" condominioNome="Upload de Vendas" />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-6">
        <h1 className="text-2xl font-bold text-minimerx-navy">Upload de planilha de vendas</h1>
        <p className="mt-1 text-sm text-minimerx-gray">
          Formato aceito: .xls ou .xlsx com colunas <strong>Unidade</strong>,{" "}
          <strong>Data</strong> (dd/mm/aaaa) e <strong>Vl Venda</strong>.
        </p>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8">
          <label
            htmlFor="file"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-slate-300 bg-minimerx-light/50 px-6 py-12 text-center transition-colors hover:border-minimerx-green hover:bg-minimerx-light"
          >
            <UploadIcon className="h-10 w-10 text-minimerx-blue" />
            <div>
              <p className="text-sm font-semibold text-minimerx-navy">
                {file ? file.name : "Clique ou arraste o arquivo .xls aqui"}
              </p>
              <p className="text-xs text-minimerx-gray">
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB`
                  : "Apenas uma planilha por vez"}
              </p>
            </div>
            <input
              ref={inputRef}
              id="file"
              type="file"
              accept=".xls,.xlsx"
              className="hidden"
              onChange={onFileChange}
            />
          </label>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setFile(null); setResult(null); setError(null); if(inputRef.current) inputRef.current.value=""; }}>
              Limpar
            </Button>
            <Button disabled={!file || pending} onClick={onSubmit}>
              {pending ? "Processando..." : "Importar vendas"}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {result ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-minimerx-green" />
              <div>
                <p className="font-semibold">
                  {result.importados} venda(s) importada(s) com sucesso
                </p>
                {result.ignorados > 0 ? (
                  <p>{result.ignorados} linha(s) ignorada(s).</p>
                ) : null}
              </div>
            </div>

            {result.condominiosNaoEncontrados.length > 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold">Condomínios não encontrados no cadastro:</p>
                <ul className="mt-2 list-disc pl-5">
                  {result.condominiosNaoEncontrados.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs">
                  Cadastre esses condomínios (com nome idêntico ao da planilha) e refaça o upload.
                </p>
              </div>
            ) : null}

            {result.erros.length > 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
                <p className="mb-2 font-semibold text-minimerx-navy">
                  Erros ({result.erros.length})
                </p>
                <ul className="max-h-64 space-y-1 overflow-auto text-minimerx-gray">
                  {result.erros.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </main>
    </>
  );
}
