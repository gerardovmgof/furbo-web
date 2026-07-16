// Lecturas compartidas entre server components. Solo SELECTs — las
// mutaciones viven en cada app/**/actions.ts junto a su validación.

import "server-only";
import { supabase } from "@/lib/supabase";
import type { TeamRow, TournamentRow, UserRow, PlayerRow } from "@/lib/types";

export async function listTournaments(): Promise<TournamentRow[]> {
  const { data } = await supabase
    .from("tournaments")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as TournamentRow[]) ?? [];
}

export async function getTournament(id: string): Promise<TournamentRow | null> {
  const { data } = await supabase.from("tournaments").select("*").eq("id", id).maybeSingle();
  return (data as TournamentRow) ?? null;
}

export async function listTeamsByTournament(tournamentId: string): Promise<TeamRow[]> {
  const { data } = await supabase
    .from("teams")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("name", { ascending: true });
  return (data as TeamRow[]) ?? [];
}

/** Equipos activos de todos los torneos, con el nombre del torneo embebido. */
export async function listActiveTeamsWithTournament(): Promise<
  (TeamRow & { tournament_name: string })[]
> {
  const { data } = await supabase
    .from("teams")
    .select("*, tournaments(name)")
    .eq("status", "active")
    .order("name", { ascending: true });
  return ((data ?? []) as (TeamRow & { tournaments: { name: string } | null })[]).map((t) => ({
    ...t,
    tournament_name: t.tournaments?.name ?? "—",
  }));
}

export async function getTeam(id: string): Promise<TeamRow | null> {
  const { data } = await supabase.from("teams").select("*").eq("id", id).maybeSingle();
  return (data as TeamRow) ?? null;
}

/** Conteo de jugadores activos por equipo, para varios equipos a la vez. */
export async function activePlayerCounts(teamIds: string[]): Promise<Record<string, number>> {
  if (teamIds.length === 0) return {};
  const { data } = await supabase
    .from("players")
    .select("team_id")
    .in("team_id", teamIds)
    .eq("active", true);
  const counts: Record<string, number> = {};
  for (const row of (data as { team_id: string }[]) ?? []) {
    counts[row.team_id] = (counts[row.team_id] ?? 0) + 1;
  }
  return counts;
}

export async function listActivePlayersByTeam(teamId: string): Promise<PlayerRow[]> {
  const { data } = await supabase
    .from("players")
    .select("*")
    .eq("team_id", teamId)
    .eq("active", true)
    .order("jersey_number", { ascending: true });
  return (data as PlayerRow[]) ?? [];
}

/** Delegados de equipo (role='team'), con el nombre de equipo y torneo embebidos. */
export async function listTeamUsers(): Promise<
  (UserRow & { team_name: string; tournament_name: string })[]
> {
  const { data } = await supabase
    .from("users")
    .select("*, teams(name, tournaments(name))")
    .eq("role", "team")
    .order("created_at", { ascending: false });
  return (
    (data ?? []) as (UserRow & {
      teams: { name: string; tournaments: { name: string } | null } | null;
    })[]
  ).map((u) => ({
    ...u,
    team_name: u.teams?.name ?? "—",
    tournament_name: u.teams?.tournaments?.name ?? "—",
  }));
}
