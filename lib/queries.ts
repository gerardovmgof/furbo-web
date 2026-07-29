// Lecturas compartidas entre server components. Solo SELECTs — las
// mutaciones viven en cada app/**/actions.ts junto a su validación.

import "server-only";
import { supabase } from "@/lib/supabase";
import type { TeamRow, TournamentRow, UserRow, PlayerRow, MatchRow, ChargeRow } from "@/lib/types";

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

/**
 * El torneo a mostrar en las páginas públicas: prioriza uno en curso
 * (fase regular o liguilla); si no hay, cae al más reciente.
 */
export async function getPublicTournament(): Promise<TournamentRow | null> {
  const { data: active } = await supabase
    .from("tournaments")
    .select("*")
    .in("status", ["regular", "playoffs"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (active) return active as TournamentRow;

  const { data: latest } = await supabase
    .from("tournaments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (latest as TournamentRow) ?? null;
}

export type MatchWithTeamNames = MatchRow & { home_name: string; away_name: string };

export async function listMatchesByTournament(
  tournamentId: string,
  phase: "regular" | "playoff" = "regular"
): Promise<MatchWithTeamNames[]> {
  const { data } = await supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("phase", phase)
    .order("round", { ascending: true })
    .order("created_at", { ascending: true });
  const matches = (data as MatchRow[]) ?? [];

  const teamIds = [...new Set(matches.flatMap((m) => [m.home_team_id, m.away_team_id]))].filter(
    (id): id is string => Boolean(id)
  );
  const names = await teamNamesById(teamIds);

  return matches.map((m) => ({
    ...m,
    home_name: (m.home_team_id && names[m.home_team_id]) || "Por definir",
    away_name: (m.away_team_id && names[m.away_team_id]) || "Por definir",
  }));
}

export async function getMatch(matchId: string): Promise<MatchRow | null> {
  const { data } = await supabase.from("matches").select("*").eq("id", matchId).maybeSingle();
  return (data as MatchRow) ?? null;
}

/** Los 1 o 2 partidos (ida/vuelta) de un mismo cruce de liguilla. */
export async function listLegsForSlot(
  tournamentId: string,
  bracketSlot: number
): Promise<MatchRow[]> {
  const { data } = await supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("bracket_slot", bracketSlot)
    .order("leg", { ascending: true });
  return (data as MatchRow[]) ?? [];
}

export async function teamNamesById(teamIds: string[]): Promise<Record<string, string>> {
  if (teamIds.length === 0) return {};
  const { data } = await supabase.from("teams").select("id, name").in("id", teamIds);
  const names: Record<string, string> = {};
  for (const t of (data as { id: string; name: string }[]) ?? []) names[t.id] = t.name;
  return names;
}

export async function goalsByMatch(matchId: string): Promise<Record<string, number>> {
  const { data } = await supabase
    .from("goals")
    .select("player_id, count")
    .eq("match_id", matchId);
  const goals: Record<string, number> = {};
  for (const g of (data as { player_id: string; count: number }[]) ?? []) {
    goals[g.player_id] = g.count;
  }
  return goals;
}

export interface ScorerRow {
  playerId: string;
  playerName: string;
  jerseyNumber: number;
  teamId: string;
  teamName: string;
  goals: number;
}

/** Goleo del torneo (todas las fases), ordenado por goles descendente. */
export async function topScorers(tournamentId: string): Promise<ScorerRow[]> {
  const { data: matchRows } = await supabase
    .from("matches")
    .select("id")
    .eq("tournament_id", tournamentId);
  const matchIds = (matchRows as { id: string }[] | null)?.map((m) => m.id) ?? [];
  if (matchIds.length === 0) return [];

  const { data: goalRows } = await supabase
    .from("goals")
    .select("player_id, team_id, count")
    .in("match_id", matchIds);
  const totals = new Map<string, { teamId: string; goals: number }>();
  for (const g of (goalRows as { player_id: string; team_id: string; count: number }[]) ?? []) {
    const cur = totals.get(g.player_id) ?? { teamId: g.team_id, goals: 0 };
    cur.goals += g.count;
    totals.set(g.player_id, cur);
  }
  if (totals.size === 0) return [];

  const playerIds = [...totals.keys()];
  const { data: playerRows } = await supabase
    .from("players")
    .select("id, name, jersey_number")
    .in("id", playerIds);
  const players = new Map(
    ((playerRows as { id: string; name: string; jersey_number: number }[]) ?? []).map((p) => [
      p.id,
      p,
    ])
  );
  const names = await teamNamesById([...new Set([...totals.values()].map((v) => v.teamId))]);

  const rows: ScorerRow[] = playerIds.map((playerId) => {
    const t = totals.get(playerId)!;
    const p = players.get(playerId);
    return {
      playerId,
      playerName: p?.name ?? "Jugador",
      jerseyNumber: p?.jersey_number ?? 0,
      teamId: t.teamId,
      teamName: names[t.teamId] ?? "Equipo",
      goals: t.goals,
    };
  });

  rows.sort((a, b) => b.goals - a.goals || a.playerName.localeCompare(b.playerName, "es"));
  return rows;
}

export async function listMatchesByTeam(teamId: string): Promise<MatchWithTeamNames[]> {
  const { data } = await supabase
    .from("matches")
    .select("*")
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .order("round", { ascending: true })
    .order("created_at", { ascending: true });
  const matches = (data as MatchRow[]) ?? [];
  const teamIds = [...new Set(matches.flatMap((m) => [m.home_team_id, m.away_team_id]))].filter(
    (id): id is string => Boolean(id)
  );
  const names = await teamNamesById(teamIds);
  return matches.map((m) => ({
    ...m,
    home_name: (m.home_team_id && names[m.home_team_id]) || "Por definir",
    away_name: (m.away_team_id && names[m.away_team_id]) || "Por definir",
  }));
}

/** Árbitros (role='referee'). */
export async function listReferees(): Promise<UserRow[]> {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("role", "referee")
    .order("created_at", { ascending: false });
  return (data as UserRow[]) ?? [];
}

/** Dueños de equipo (role='team'), para el selector de "Dueño" del admin. */
export async function listTeamOwnerUsers(): Promise<UserRow[]> {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("role", "team")
    .order("username", { ascending: true });
  return (data as UserRow[]) ?? [];
}

/** Equipos de un dueño (un dueño puede tener varios), con el nombre del torneo embebido. */
export async function listTeamsByOwner(
  ownerId: string
): Promise<(TeamRow & { tournament_name: string })[]> {
  const { data } = await supabase
    .from("teams")
    .select("*, tournaments(name)")
    .eq("owner_user_id", ownerId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as (TeamRow & { tournaments: { name: string } | null })[]).map((t) => ({
    ...t,
    tournament_name: t.tournaments?.name ?? "—",
  }));
}

/**
 * Torneos donde un dueño de equipo puede autorregistrar un equipo nuevo:
 * en 'draft' (el admin no le dio "Iniciar fase regular" todavía) y con
 * precio de cupo configurado (si no, el equipo nacería sin forma de pagar
 * registros).
 */
export async function listOpenTournamentsForRegistration(): Promise<TournamentRow[]> {
  const { data } = await supabase
    .from("tournaments")
    .select("*")
    .eq("status", "draft")
    .not("slot_price_cents", "is", null)
    .order("created_at", { ascending: false });
  return (data as TournamentRow[]) ?? [];
}

/** Username del dueño de cada equipo, para mostrar "Equipo - Usuario". */
export async function teamOwnerUsernames(teamIds: string[]): Promise<Record<string, string>> {
  if (teamIds.length === 0) return {};
  const { data: teamRows } = await supabase
    .from("teams")
    .select("id, owner_user_id")
    .in("id", teamIds)
    .not("owner_user_id", "is", null);
  const ownerByTeam = new Map(
    ((teamRows ?? []) as { id: string; owner_user_id: string }[]).map((t) => [
      t.id,
      t.owner_user_id,
    ])
  );
  const ownerIds = [...new Set(ownerByTeam.values())];
  if (ownerIds.length === 0) return {};

  const { data: userRows } = await supabase.from("users").select("id, username").in("id", ownerIds);
  const usernameById = new Map(
    ((userRows ?? []) as { id: string; username: string }[]).map((u) => [u.id, u.username])
  );

  const usernames: Record<string, string> = {};
  for (const [teamId, ownerId] of ownerByTeam) {
    const username = usernameById.get(ownerId);
    if (username) usernames[teamId] = username;
  }
  return usernames;
}

export type ChargeWithTeamName = ChargeRow & { team_name: string };

export async function listChargesByTournament(
  tournamentId: string
): Promise<ChargeWithTeamName[]> {
  const { data } = await supabase
    .from("charges")
    .select("*, teams(name)")
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as (ChargeRow & { teams: { name: string } | null })[]).map((c) => ({
    ...c,
    team_name: c.teams?.name ?? "—",
  }));
}

export async function listChargesByTeam(teamId: string): Promise<ChargeRow[]> {
  const { data } = await supabase
    .from("charges")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });
  return (data as ChargeRow[]) ?? [];
}

export interface TeamOwnerWithTeams extends UserRow {
  teams: { id: string; name: string; tournament_name: string }[];
}

/** Dueños de equipo (role='team'), con la lista de sus equipos (0, 1 o varios). */
export async function listTeamUsers(): Promise<TeamOwnerWithTeams[]> {
  const { data: userRows } = await supabase
    .from("users")
    .select("*")
    .eq("role", "team")
    .order("created_at", { ascending: false });
  const owners = (userRows as UserRow[]) ?? [];
  if (owners.length === 0) return [];

  const { data: teamRows } = await supabase
    .from("teams")
    .select("*, tournaments(name)")
    .in(
      "owner_user_id",
      owners.map((u) => u.id)
    );

  const teamsByOwner = new Map<string, { id: string; name: string; tournament_name: string }[]>();
  for (const t of (teamRows ?? []) as (TeamRow & { tournaments: { name: string } | null })[]) {
    if (!t.owner_user_id) continue;
    const list = teamsByOwner.get(t.owner_user_id) ?? [];
    list.push({ id: t.id, name: t.name, tournament_name: t.tournaments?.name ?? "—" });
    teamsByOwner.set(t.owner_user_id, list);
  }

  return owners.map((u) => ({ ...u, teams: teamsByOwner.get(u.id) ?? [] }));
}
