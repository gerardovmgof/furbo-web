"use client";

import { useActionState } from "react";
import { editTournamentAction, type FormState } from "./actions";

const initialState: FormState = { error: null };

export default function EditTournamentForm({
  tournamentId,
  currentName,
}: {
  tournamentId: string;
  currentName: string;
}) {
  const [state, formAction, pending] = useActionState(editTournamentAction, initialState);

  return (
    <details className="group inline-block align-top">
      <summary className="inline-block cursor-pointer list-none rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">Editar nombre</span>
        <span className="hidden group-open:inline">Cerrar</span>
      </summary>
      <form action={formAction} className="mt-2 flex items-center gap-2">
        <input type="hidden" name="tournamentId" value={tournamentId} />
        <input
          name="name"
          type="text"
          defaultValue={currentName}
          required
          className="w-48 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
        {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      </form>
    </details>
  );
}
