"use client";

import { useActionState, useState } from "react";
import { captureResultAction, type FormState } from "./actions";
import type { PlayerRow } from "@/lib/types";

const initialState: FormState = { error: null };

export default function ScoreCaptureForm({
  matchId,
  homeTeam,
  awayTeam,
  homePlayers,
  awayPlayers,
  existingGoals,
  initialHomeScore,
  initialAwayScore,
  initialForfeit,
  isPlayoff,
  initialHomePenalties,
  initialAwayPenalties,
}: {
  matchId: string;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  homePlayers: PlayerRow[];
  awayPlayers: PlayerRow[];
  existingGoals: Record<string, number>;
  initialHomeScore: number | null;
  initialAwayScore: number | null;
  initialForfeit: boolean;
  isPlayoff?: boolean;
  initialHomePenalties?: number | null;
  initialAwayPenalties?: number | null;
}) {
  const [state, formAction, pending] = useActionState(captureResultAction, initialState);
  const [forfeit, setForfeit] = useState(initialForfeit);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="matchId" value={matchId} />

      <div className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          id="isForfeit"
          name="isForfeit"
          type="checkbox"
          checked={forfeit}
          onChange={(e) => setForfeit(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-700 bg-zinc-950"
        />
        <label htmlFor="isForfeit">
          Partido por default (no se registran goles individuales)
        </label>
      </div>

      <div className="flex items-center justify-center gap-4">
        <div className="text-center">
          <label className="block text-sm text-zinc-400" htmlFor="homeScore">
            {homeTeam.name}
          </label>
          <input
            id="homeScore"
            name="homeScore"
            type="number"
            min={0}
            max={99}
            defaultValue={initialHomeScore ?? 0}
            required
            className="mt-1 w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-center text-xl text-zinc-100 outline-none focus:border-emerald-500"
          />
        </div>
        <span className="mt-6 text-zinc-500">—</span>
        <div className="text-center">
          <label className="block text-sm text-zinc-400" htmlFor="awayScore">
            {awayTeam.name}
          </label>
          <input
            id="awayScore"
            name="awayScore"
            type="number"
            min={0}
            max={99}
            defaultValue={initialAwayScore ?? 0}
            required
            className="mt-1 w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-center text-xl text-zinc-100 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {isPlayoff && !forfeit && (
        <div>
          <p className="mb-2 text-center text-sm text-zinc-400">
            Penales (solo si el cruce terminó empatado en el global)
          </p>
          <div className="flex items-center justify-center gap-4">
            <input
              name="homePenalties"
              type="number"
              min={0}
              max={99}
              defaultValue={initialHomePenalties ?? ""}
              placeholder="—"
              className="w-16 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-center text-zinc-100 outline-none focus:border-emerald-500"
            />
            <span className="text-zinc-500">—</span>
            <input
              name="awayPenalties"
              type="number"
              min={0}
              max={99}
              defaultValue={initialAwayPenalties ?? ""}
              placeholder="—"
              className="w-16 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-center text-zinc-100 outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      )}

      {!forfeit && (
        <div className="grid gap-6 sm:grid-cols-2">
          <PlayerGoalsList team={homeTeam} players={homePlayers} existingGoals={existingGoals} />
          <PlayerGoalsList team={awayTeam} players={awayPlayers} existingGoals={existingGoals} />
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar resultado"}
      </button>
      {state.error && <p className="text-center text-sm text-red-400">{state.error}</p>}
    </form>
  );
}

function PlayerGoalsList({
  team,
  players,
  existingGoals,
}: {
  team: { id: string; name: string };
  players: PlayerRow[];
  existingGoals: Record<string, number>;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-zinc-300">{team.name}</p>
      {players.length === 0 && (
        <p className="text-sm text-zinc-500">Sin jugadores registrados.</p>
      )}
      <div className="space-y-1">
        {players.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-2">
            <label htmlFor={`goal_${p.id}__${team.id}`} className="text-sm text-zinc-200">
              #{p.jersey_number} {p.name}
            </label>
            <input
              id={`goal_${p.id}__${team.id}`}
              name={`goal_${p.id}__${team.id}`}
              type="number"
              min={0}
              max={99}
              defaultValue={existingGoals[p.id] ?? 0}
              className="w-16 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-center text-zinc-100 outline-none focus:border-emerald-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
