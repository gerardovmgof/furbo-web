"use client";

import { useActionState } from "react";
import { generateScheduleAction, type FormState } from "./actions";

const initialState: FormState = { error: null };

export default function GenerateScheduleForm({
  tournamentId,
  activeTeamsCount,
}: {
  tournamentId: string;
  activeTeamsCount: number;
}) {
  const [state, formAction, pending] = useActionState(generateScheduleAction, initialState);

  if (activeTeamsCount < 2) {
    return (
      <p className="text-sm text-zinc-500">
        Necesitas al menos 2 equipos activos para sortear el calendario.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <div>
        <p className="font-semibold text-zinc-900 dark:text-zinc-100">Sortear calendario</p>
        <p className="text-sm text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">
          Genera automáticamente todas las jornadas de la fase regular (todos contra todos), con
          los cruces revueltos al azar. Los horarios y canchas se ajustan después, partido por
          partido.
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          name="doubleRound"
          className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950"
        />
        Ida y vuelta
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Sorteando…" : "Sortear calendario"}
      </button>
      {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
    </form>
  );
}
