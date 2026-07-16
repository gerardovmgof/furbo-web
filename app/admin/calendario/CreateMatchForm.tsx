"use client";

import { useActionState } from "react";
import { createMatchAction, type FormState } from "./actions";
import type { TeamRow } from "@/lib/types";

const initialState: FormState = { error: null };

export default function CreateMatchForm({
  tournamentId,
  teams,
}: {
  tournamentId: string;
  teams: TeamRow[];
}) {
  const [state, formAction, pending] = useActionState(createMatchAction, initialState);

  if (teams.length < 2) {
    return (
      <p className="text-sm text-zinc-500">
        Necesitas al menos 2 equipos activos en este torneo para armar un partido.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <div>
        <label className="block text-sm font-medium text-zinc-300" htmlFor="round">
          Jornada
        </label>
        <input
          id="round"
          name="round"
          type="number"
          min={1}
          max={99}
          required
          className="mt-1 w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300" htmlFor="homeTeamId">
          Local
        </label>
        <select
          id="homeTeamId"
          name="homeTeamId"
          required
          className="mt-1 w-40 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-500"
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300" htmlFor="awayTeamId">
          Visitante
        </label>
        <select
          id="awayTeamId"
          name="awayTeamId"
          required
          defaultValue={teams[1]?.id}
          className="mt-1 w-40 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-500"
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300" htmlFor="kickoffAt">
          Fecha y hora
        </label>
        <input
          id="kickoffAt"
          name="kickoffAt"
          type="datetime-local"
          className="mt-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300" htmlFor="venue">
          Cancha
        </label>
        <input
          id="venue"
          name="venue"
          type="text"
          className="mt-1 w-36 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Creando…" : "Agregar partido"}
      </button>
      {state.error && <p className="w-full text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
