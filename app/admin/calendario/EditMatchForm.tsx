"use client";

import { useActionState } from "react";
import { editMatchAction, type FormState } from "./actions";
import type { TeamRow } from "@/lib/types";

const initialState: FormState = { error: null };

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditMatchForm({
  matchId,
  round,
  homeTeamId,
  awayTeamId,
  kickoffAt,
  venue,
  streamUrl,
  teams,
}: {
  matchId: string;
  round: number;
  homeTeamId: string;
  awayTeamId: string;
  kickoffAt: string | null;
  venue: string | null;
  streamUrl: string | null;
  teams: TeamRow[];
}) {
  const [state, formAction, pending] = useActionState(editMatchAction, initialState);

  // <details> abre/cierra con HTML puro — no depende de que React se active
  // en el navegador (a diferencia de un toggle con useState). El navegador
  // maneja el clic aunque el JS de la página falle por lo que sea.
  return (
    <details className="group inline-block align-top">
      <summary className="inline-block cursor-pointer list-none rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">Editar</span>
        <span className="hidden group-open:inline">Cerrar</span>
      </summary>
      <form action={formAction} className="mt-2 flex w-full flex-wrap items-end gap-2">
        <input type="hidden" name="matchId" value={matchId} />
        <div>
          <label className="block text-xs text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">Jornada</label>
          <input
            name="round"
            type="number"
            min={1}
            max={99}
            defaultValue={round}
            required
            className="mt-1 w-16 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">Local</label>
          <select
            name="homeTeamId"
            defaultValue={homeTeamId}
            required
            className="mt-1 w-36 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">Visitante</label>
          <select
            name="awayTeamId"
            defaultValue={awayTeamId}
            required
            className="mt-1 w-36 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">Fecha y hora</label>
          <input
            name="kickoffAt"
            type="datetime-local"
            defaultValue={toDatetimeLocalValue(kickoffAt)}
            className="mt-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">Cancha</label>
          <input
            name="venue"
            type="text"
            defaultValue={venue ?? ""}
            className="mt-1 w-28 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">Link de transmisión (opcional)</label>
          <input
            name="streamUrl"
            type="url"
            placeholder="https://..."
            defaultValue={streamUrl ?? ""}
            className="mt-1 w-56 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
        {state.error && <p className="w-full text-sm text-red-600 dark:text-red-400">{state.error}</p>}
        {state.ok && <p className="w-full text-sm text-emerald-700 dark:text-emerald-400">✅ Guardado.</p>}
      </form>
    </details>
  );
}
