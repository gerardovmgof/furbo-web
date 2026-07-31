"use client";

import { useActionState } from "react";
import { generateBracketAction, type FormState } from "./actions";

const initialState: FormState = { error: null };

export default function GenerateBracketForm({ tournamentId }: { tournamentId: string }) {
  const [state, formAction, pending] = useActionState(generateBracketAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Equipos que clasifican</label>
        <div className="mt-1 flex gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
            <input type="radio" name="playoffTeams" value="4" defaultChecked className="accent-emerald-600" />
            4
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
            <input type="radio" name="playoffTeams" value="8" className="accent-emerald-600" />
            8
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
            <input type="radio" name="playoffTeams" value="16" className="accent-emerald-600" />
            16
          </label>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
        <input type="checkbox" name="twoLegs" className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950" />
        Ida y vuelta (la final siempre es partido único)
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Generando…" : "Generar liguilla"}
      </button>
      {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
    </form>
  );
}
