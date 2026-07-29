"use client";

import { useActionState } from "react";
import { editTeamUserAction, type FormState } from "./actions";
import type { TeamRow } from "@/lib/types";

const initialState: FormState = { error: null };

export default function EditTeamUserForm({
  userId,
  currentUsername,
  currentTeamId,
  teams,
}: {
  userId: string;
  currentUsername: string;
  currentTeamId: string;
  teams: (TeamRow & { tournament_name: string })[];
}) {
  const [state, formAction, pending] = useActionState(editTeamUserAction, initialState);

  return (
    <details className="group inline-block align-top">
      <summary className="inline-block cursor-pointer list-none rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800 [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">Editar</span>
        <span className="hidden group-open:inline">Cerrar</span>
      </summary>
      <form action={formAction} className="mt-2 flex flex-wrap items-center gap-2">
        <input type="hidden" name="userId" value={userId} />
        <input
          name="username"
          type="text"
          defaultValue={currentUsername}
          required
          className="w-36 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-emerald-500"
        />
        <select
          name="teamId"
          defaultValue={currentTeamId}
          required
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-emerald-500"
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name} ({team.tournament_name})
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
        {state.error && <p className="w-full text-sm text-red-400">{state.error}</p>}
      </form>
    </details>
  );
}
