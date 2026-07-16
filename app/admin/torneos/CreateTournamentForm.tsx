"use client";

import { useActionState } from "react";
import { createTournamentAction, type FormState } from "./actions";

const initialState: FormState = { error: null };

export default function CreateTournamentForm() {
  const [state, formAction, pending] = useActionState(createTournamentAction, initialState);

  return (
    <form action={formAction} className="flex items-end gap-2">
      <div className="flex-1">
        <label className="block text-sm font-medium text-zinc-300" htmlFor="name">
          Nuevo torneo
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Apertura 2026"
          required
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear"}
      </button>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
