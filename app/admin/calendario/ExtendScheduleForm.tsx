"use client";

import { useActionState } from "react";
import { extendScheduleAction, type FormState } from "./actions";

const initialState: FormState = { error: null };

export default function ExtendScheduleForm({
  tournamentId,
  newTeamNames,
}: {
  tournamentId: string;
  newTeamNames: string[];
}) {
  const [state, formAction, pending] = useActionState(extendScheduleAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <div>
        <p className="font-semibold text-zinc-100">Agregar equipos nuevos al calendario</p>
        <p className="text-sm text-zinc-400">
          {newTeamNames.join(", ")} no {newTeamNames.length === 1 ? "tiene" : "tienen"} partidos
          todavía. Se les generan jornadas nuevas contra cada equipo activo — los partidos y
          resultados ya existentes no se tocan.
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          name="doubleRound"
          className="h-4 w-4 rounded border-zinc-700 bg-zinc-950"
        />
        Ida y vuelta
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Agregando…" : "Agregar al calendario"}
      </button>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state.ok && (
        <p className="text-sm text-emerald-400">✅ Calendario actualizado con las nuevas jornadas.</p>
      )}
    </form>
  );
}
