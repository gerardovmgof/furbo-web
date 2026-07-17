"use client";

import { useActionState, useState } from "react";
import { editPlayerAction, type FormState } from "./actions";

const initialState: FormState = { error: null };

export default function EditPlayerForm({
  teamId,
  playerId,
  currentName,
  currentJerseyNumber,
}: {
  teamId: string;
  playerId: string;
  currentName: string;
  currentJerseyNumber: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(editPlayerAction, initialState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-zinc-700 px-3 py-1 text-sm text-zinc-200 hover:bg-zinc-800"
      >
        Editar
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="playerId" value={playerId} />
      <input
        name="jerseyNumber"
        type="number"
        min={0}
        max={999}
        defaultValue={currentJerseyNumber}
        required
        className="w-16 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-emerald-500"
      />
      <input
        name="name"
        type="text"
        defaultValue={currentName}
        required
        className="w-40 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-emerald-500"
      />
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
        className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
      >
        Cancelar
      </button>
      {state.error && <p className="w-full text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
