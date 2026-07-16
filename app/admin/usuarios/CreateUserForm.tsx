"use client";

import { useActionState } from "react";
import { createTeamUserAction, type FormState } from "./actions";
import type { TeamRow } from "@/lib/types";

const initialState: FormState = { error: null };

export default function CreateUserForm({
  teams,
}: {
  teams: (TeamRow & { tournament_name: string })[];
}) {
  const [state, formAction, pending] = useActionState(createTeamUserAction, initialState);

  if (teams.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No hay equipos activos todavía. Da de alta un equipo en{" "}
        <a href="/admin/equipos" className="text-emerald-400 underline">
          Equipos
        </a>{" "}
        antes de crear un delegado.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="block text-sm font-medium text-zinc-300" htmlFor="teamId">
          Equipo
        </label>
        <select
          id="teamId"
          name="teamId"
          required
          className="mt-1 w-56 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-500"
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name} ({team.tournament_name})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300" htmlFor="username">
          Usuario
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          className="mt-1 w-40 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="text"
          required
          minLength={10}
          placeholder="mín. 10 caracteres"
          className="mt-1 w-48 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear delegado"}
      </button>
      {state.error && <p className="w-full text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
