"use client";

import { useActionState } from "react";
import { addPlayerAction, type FormState } from "./actions";

const initialState: FormState = { error: null };

export default function AddPlayerForm({
  teamId,
  disabled,
}: {
  teamId: string;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    addPlayerAction.bind(null, teamId),
    initialState
  );

  if (disabled) {
    return (
      <p className="text-sm text-zinc-500">
        Ya registraste a todos los jugadores permitidos, o el registro está cerrado.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="block text-sm font-medium text-zinc-300" htmlFor="name">
          Nombre del jugador
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="mt-1 w-56 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300" htmlFor="jerseyNumber">
          Dorsal
        </label>
        <input
          id="jerseyNumber"
          name="jerseyNumber"
          type="number"
          min={0}
          max={999}
          required
          className="mt-1 w-24 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Agregando…" : "Agregar jugador"}
      </button>
      {state.error && <p className="w-full text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
