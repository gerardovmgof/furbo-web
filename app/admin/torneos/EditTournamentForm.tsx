"use client";

import { useActionState, useState } from "react";
import { editTournamentAction, type FormState } from "./actions";

const initialState: FormState = { error: null };

export default function EditTournamentForm({
  tournamentId,
  currentName,
}: {
  tournamentId: string;
  currentName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(editTournamentAction, initialState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
      >
        Editar nombre
      </button>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <input
        name="name"
        type="text"
        defaultValue={currentName}
        required
        className="w-48 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-emerald-500"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
