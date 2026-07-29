"use client";

import { useActionState, useState, useEffect, useRef } from "react";
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
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(editMatchAction, initialState);

  // Al guardar con éxito se cierra el formulario y se ve el partido
  // actualizado en la fila de abajo — esa es la confirmación visual.
  // Se compara la referencia del objeto (no solo state.ok) para que también
  // dispare en guardados sucesivos exitosos, no solo el primero.
  const prevStateRef = useRef(state);
  useEffect(() => {
    if (state !== prevStateRef.current && state.ok) setOpen(false);
    prevStateRef.current = state;
  }, [state]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
      >
        Editar
      </button>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-wrap items-end gap-2 pt-2">
      <input type="hidden" name="matchId" value={matchId} />
      <div>
        <label className="block text-xs text-zinc-400">Jornada</label>
        <input
          name="round"
          type="number"
          min={1}
          max={99}
          defaultValue={round}
          required
          className="mt-1 w-16 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-emerald-500"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-400">Local</label>
        <select
          name="homeTeamId"
          defaultValue={homeTeamId}
          required
          className="mt-1 w-36 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-emerald-500"
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-zinc-400">Visitante</label>
        <select
          name="awayTeamId"
          defaultValue={awayTeamId}
          required
          className="mt-1 w-36 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-emerald-500"
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-zinc-400">Fecha y hora</label>
        <input
          name="kickoffAt"
          type="datetime-local"
          defaultValue={toDatetimeLocalValue(kickoffAt)}
          className="mt-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-emerald-500"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-400">Cancha</label>
        <input
          name="venue"
          type="text"
          defaultValue={venue ?? ""}
          className="mt-1 w-28 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-emerald-500"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-400">Link de transmisión (opcional)</label>
        <input
          name="streamUrl"
          type="url"
          placeholder="https://..."
          defaultValue={streamUrl ?? ""}
          className="mt-1 w-56 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-emerald-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
      >
        Cancelar
      </button>
      {state.error && <p className="w-full text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
