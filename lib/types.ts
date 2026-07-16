// Tipos de las filas de la base de datos (espejo de supabase/schema.sql).
// Mantener sincronizados a mano al cambiar el esquema.

export type TournamentStatus = "draft" | "regular" | "playoffs" | "finished";
export type TeamStatus = "active" | "withdrawn";
export type UserRole = "admin" | "team";
export type MatchPhase = "regular" | "playoff";
export type MatchStatus = "scheduled" | "played" | "postponed" | "canceled";

export interface TournamentRow {
  id: string;
  name: string;
  status: TournamentStatus;
  registration_open: boolean;
  playoff_teams: 4 | 8 | null;
  playoff_two_legs: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface TeamRow {
  id: string;
  tournament_id: string;
  name: string;
  player_limit: number;
  status: TeamStatus;
  created_at: string;
  updated_at: string;
}

export interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  team_id: string | null;
  token_version: number;
  created_at: string;
  updated_at: string;
}

export interface PlayerRow {
  id: string;
  team_id: string;
  name: string;
  jersey_number: number;
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchRow {
  id: string;
  tournament_id: string;
  phase: MatchPhase;
  round: number;
  bracket_slot: number | null;
  leg: 1 | 2;
  home_team_id: string | null;
  away_team_id: string | null;
  kickoff_at: string | null;
  venue: string | null;
  status: MatchStatus;
  is_forfeit: boolean;
  home_score: number | null;
  away_score: number | null;
  home_penalties: number | null;
  away_penalties: number | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalRow {
  id: string;
  match_id: string;
  player_id: string;
  team_id: string;
  count: number;
  created_at: string;
  updated_at: string;
}

// Fila de la tabla de posiciones (ver lib/standings.ts)
export interface StandingRow {
  pos: number;
  teamId: string;
  name: string;
  withdrawn: boolean;
  jj: number;
  jg: number;
  je: number;
  jp: number;
  gf: number;
  gc: number;
  dif: number;
  pts: number;
}

// Payload de la cookie de sesión firmada (ver lib/session.ts)
export interface SessionPayload {
  uid: string;
  role: UserRole;
  teamId: string | null;
  tv: number; // token_version al momento del login
  exp: number; // epoch segundos
}
