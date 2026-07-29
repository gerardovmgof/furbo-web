"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { createTeamUserAction, createRefereeAction, type FormState } from "./actions";
import type { TeamRow } from "@/lib/types";

const initialState: FormState = { error: null };

export default function CreateUserForm({
  teams,
}: {
  teams: (TeamRow & { tournament_name: string })[];
}) {
  const [kind, setKind] = useState<"team" | "referee">("team");
  const [teamState, teamFormAction, teamPending] = useActionState(
    createTeamUserAction,
    initialState
  );
  const [refereeState, refereeFormAction, refereePending] = useActionState(
    createRefereeAction,
    initialState
  );

  const teamFormRef = useRef<HTMLFormElement>(null);
  const refereeFormRef = useRef<HTMLFormElement>(null);
  const prevTeamState = useRef(teamState);
  const prevRefereeState = useRef(refereeState);

  // Al crear con éxito, limpia los campos para la siguiente alta — es la
  // única señal visible de que sí se creó (el nuevo usuario aparece en la
  // lista de abajo, pero eso no siempre es visible sin hacer scroll).
  useEffect(() => {
    if (teamState !== prevTeamState.current && teamState.ok) teamFormRef.current?.reset();
    prevTeamState.current = teamState;
  }, [teamState]);
  useEffect(() => {
    if (refereeState !== prevRefereeState.current && refereeState.ok) {
      refereeFormRef.current?.reset();
    }
    prevRefereeState.current = refereeState;
  }, [refereeState]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setKind("team")}
          className={`rounded-lg px-3 py-1.5 ${kind === "team" ? "bg-emerald-600 text-white" : "border border-zinc-700 text-zinc-300 hover:bg-zinc-800"}`}
        >
          Dueño de equipo
        </button>
        <button
          type="button"
          onClick={() => setKind("referee")}
          className={`rounded-lg px-3 py-1.5 ${kind === "referee" ? "bg-emerald-600 text-white" : "border border-zinc-700 text-zinc-300 hover:bg-zinc-800"}`}
        >
          Árbitro
        </button>
      </div>

      {kind === "team" &&
        (teams.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No hay equipos activos todavía. Da de alta un equipo en{" "}
            <a href="/admin/equipos" className="text-emerald-400 underline">
              Equipos
            </a>{" "}
            antes de crear un dueño de equipo.
          </p>
        ) : (
          <form ref={teamFormRef} action={teamFormAction} className="flex flex-wrap items-end gap-2">
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
              disabled={teamPending}
              className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {teamPending ? "Creando…" : "Crear dueño de equipo"}
            </button>
            {teamState.error && <p className="w-full text-sm text-red-400">{teamState.error}</p>}
            {teamState.ok && (
              <p className="w-full text-sm text-emerald-400">✅ Dueño de equipo creado.</p>
            )}
          </form>
        ))}

      {kind === "referee" && (
        <form ref={refereeFormRef} action={refereeFormAction} className="flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-sm font-medium text-zinc-300" htmlFor="ref-username">
              Usuario
            </label>
            <input
              id="ref-username"
              name="username"
              type="text"
              required
              className="mt-1 w-40 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300" htmlFor="ref-password">
              Contraseña
            </label>
            <input
              id="ref-password"
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
            disabled={refereePending}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {refereePending ? "Creando…" : "Crear árbitro"}
          </button>
          {refereeState.error && (
            <p className="w-full text-sm text-red-400">{refereeState.error}</p>
          )}
          {refereeState.ok && (
            <p className="w-full text-sm text-emerald-400">✅ Árbitro creado.</p>
          )}
        </form>
      )}
    </div>
  );
}
