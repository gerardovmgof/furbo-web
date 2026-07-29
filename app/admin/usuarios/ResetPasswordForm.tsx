"use client";

import { useActionState } from "react";
import { resetTeamUserPasswordAction, type FormState } from "./actions";

const initialState: FormState = { error: null };

export default function ResetPasswordForm({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(resetTeamUserPasswordAction, initialState);

  return (
    <details className="group inline-block align-top">
      <summary className="inline-block cursor-pointer list-none rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800 [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">Restablecer contraseña</span>
        <span className="hidden group-open:inline">Cerrar</span>
      </summary>
      <form action={formAction} className="mt-2 flex items-center gap-2">
        <input type="hidden" name="userId" value={userId} />
        <input
          name="password"
          type="text"
          placeholder="Nueva contraseña (mín. 10)"
          required
          minLength={10}
          className="w-52 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
        {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      </form>
    </details>
  );
}
