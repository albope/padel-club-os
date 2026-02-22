"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BotonVolver() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      Página anterior
    </button>
  );
}
