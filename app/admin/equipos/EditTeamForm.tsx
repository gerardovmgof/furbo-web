"use client";

import { useActionState } from "react";
import { editTeamAction, type FormState } from "./actions";
import type { UserRow } from "@/lib/types";

const initialState: FormState = { error: null };

export default function EditTeamForm({
  teamId,
  currentName,
  currentPlayerLimit,
  currentOwnerUserId,
  owners,
}: {
  teamId: string;
  currentName: string;
  currentPlayerLimit: number;
  currentOwnerUserId: string | null;
  owners: UserRow[];
}) {
  const [state, formAction, pending] = useActionState(editTeamAction, initialState);

  return (
    <details className="group inline-block align-top">
      <summary className="inline-block cursor-pointer list-none rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">Editar</span>
        <span className="hidden group-open:inline">Cerrar</span>
      </summary>
      <form action={formAction} className="mt-2 flex flex-wrap items-center gap-2">
        <input type="hidden" name="teamId" value={teamId} />
        <input
          name="name"
          type="text"
          defaultValue={currentName}
          required
          className="w-40 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
        />
        <input
          name="playerLimit"
          type="number"
          min={0}
          max={99}
          defaultValue={currentPlayerLimit}
          required
          className="w-20 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
        />
        <select
          name="ownerUserId"
          defaultValue={currentOwnerUserId ?? ""}
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
        >
          <option value="">Sin dueño</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.username}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
        {state.error && <p className="w-full text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      </form>
    </details>
  );
}
