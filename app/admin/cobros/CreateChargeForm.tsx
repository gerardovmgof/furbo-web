"use client";

import { useActionState } from "react";
import { createChargeAction, type FormState } from "./actions";
import type { TeamRow } from "@/lib/types";

const initialState: FormState = { error: null };

export default function CreateChargeForm({
  tournamentId,
  teams,
  ownerUsernames,
}: {
  tournamentId: string;
  teams: TeamRow[];
  ownerUsernames: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(createChargeAction, initialState);

  if (teams.length === 0) {
    return <p className="text-sm text-zinc-500">No hay equipos activos en este torneo.</p>;
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <div>
        <label className="block text-sm font-medium text-zinc-300" htmlFor="teamId">
          Equipo
        </label>
        <select
          id="teamId"
          name="teamId"
          required
          className="mt-1 w-40 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-500"
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} - {ownerUsernames[t.id] ?? "sin usuario"}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300" htmlFor="concept">
          Concepto
        </label>
        <input
          id="concept"
          name="concept"
          type="text"
          required
          placeholder="Renta de cancha jornada 5"
          className="mt-1 w-56 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300" htmlFor="amount">
          Monto (MXN)
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          min={0.01}
          step={0.01}
          required
          onWheel={(e) => e.currentTarget.blur()}
          className="mt-1 w-32 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear cargo"}
      </button>
      {state.error && <p className="w-full text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
