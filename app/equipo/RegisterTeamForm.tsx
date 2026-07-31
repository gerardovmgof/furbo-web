"use client";

import { useActionState } from "react";
import { registerTeamAction, type FormState } from "./actions";
import type { TournamentRow } from "@/lib/types";

const initialState: FormState = { error: null };

function Fields({
  tournaments,
  pending,
  error,
  ok,
}: {
  tournaments: TournamentRow[];
  pending: boolean;
  error: string | null;
  ok?: boolean;
}) {
  if (tournaments.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No hay torneos abiertos a registro en este momento. Contacta al admin.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="tournamentId">
          Torneo
        </label>
        <select
          id="tournamentId"
          name="tournamentId"
          required
          className="mt-1 w-56 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
        >
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="name">
          Nombre del equipo
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="mt-1 w-56 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Registrando…" : "Registrar equipo"}
      </button>
      {error && <p className="w-full text-sm text-red-600 dark:text-red-400">{error}</p>}
      {ok && (
        <p className="w-full text-sm text-emerald-700 dark:text-emerald-400">
          ✅ Equipo registrado. Ya puedes comprar cupos en su pestaña de Pagos.
        </p>
      )}
    </div>
  );
}

export default function RegisterTeamForm({
  tournaments,
  hasTeams,
}: {
  tournaments: TournamentRow[];
  hasTeams: boolean;
}) {
  const [state, formAction, pending] = useActionState(registerTeamAction, initialState);

  if (!hasTeams) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4">
        <p className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">Registra tu primer equipo</p>
        <form action={formAction}>
          <Fields tournaments={tournaments} pending={pending} error={state.error} ok={state.ok} />
        </form>
      </div>
    );
  }

  return (
    <details className="group rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4">
      <summary className="cursor-pointer list-none font-semibold text-zinc-900 dark:text-zinc-100 [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">+ Registrar otro equipo</span>
        <span className="hidden group-open:inline">Cerrar</span>
      </summary>
      <form action={formAction} className="mt-3">
        <Fields tournaments={tournaments} pending={pending} error={state.error} ok={state.ok} />
      </form>
    </details>
  );
}
