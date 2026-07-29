"use client";

import { useActionState } from "react";
import { createTeamAction, type FormState } from "./actions";
import type { UserRow } from "@/lib/types";

const initialState: FormState = { error: null };

export default function CreateTeamForm({
  tournamentId,
  owners,
}: {
  tournamentId: string;
  owners: UserRow[];
}) {
  const [state, formAction, pending] = useActionState(createTeamAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <div>
        <label className="block text-sm font-medium text-zinc-300" htmlFor="name">
          Nombre del equipo
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
        <label className="block text-sm font-medium text-zinc-300" htmlFor="playerLimit">
          Registros pagados
        </label>
        <input
          id="playerLimit"
          name="playerLimit"
          type="number"
          min={0}
          max={99}
          defaultValue={12}
          required
          className="mt-1 w-28 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300" htmlFor="ownerUserId">
          Dueño
        </label>
        <select
          id="ownerUserId"
          name="ownerUserId"
          defaultValue=""
          className="mt-1 w-40 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-500"
        >
          <option value="">Sin dueño</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.username}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Creando…" : "Agregar equipo"}
      </button>
      {state.error && <p className="w-full text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
