-- =============================================================
-- Furbo Web — schema.sql
-- Correr COMPLETO en el SQL Editor de Supabase (una sola vez).
-- =============================================================
create extension if not exists citext;

-- ---------- trigger genérico updated_at ----------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------- TORNEOS ----------
create table tournaments (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,                    -- "Apertura 2026"
  status            text not null default 'draft'
                    check (status in ('draft','regular','playoffs','finished')),
  registration_open boolean not null default true,    -- ventana de altas de jugadores
  playoff_teams     smallint check (playoff_teams in (4, 8, 16)),  -- null hasta generar liguilla
  playoff_two_legs  boolean,                          -- ida y vuelta (elección del admin)
  slot_price_cents  integer check (slot_price_cents is null or slot_price_cents > 0), -- null = compra de cupos deshabilitada
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger trg_tournaments_updated before update on tournaments
  for each row execute function set_updated_at();

-- ---------- USUARIOS (auth propia) ----------
-- Se crea ANTES que teams porque teams.owner_user_id la referencia.
create table users (
  id            uuid primary key default gen_random_uuid(),
  username      citext not null unique,              -- case-insensitive
  password_hash text not null,                       -- bcryptjs cost 12
  role          text not null check (role in ('admin','team','referee')),
  token_version integer not null default 1,          -- bump = invalida sesiones
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_users_updated before update on users
  for each row execute function set_updated_at();

-- ---------- EQUIPOS ----------
-- owner_user_id: el dueño de equipo (role='team') que lo autorregistró, o
-- null si lo dio de alta el admin sin ligarlo todavía. Un dueño puede tener
-- VARIOS equipos (uno-a-muchos: no hace falta tabla puente).
create table teams (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete restrict,
  owner_user_id uuid references users(id) on delete set null,
  name          text not null,
  player_limit  smallint not null default 0 check (player_limit >= 0), -- registros pagados
  status        text not null default 'active'
                check (status in ('active','withdrawn')),   -- withdrawn = abandonó el torneo
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tournament_id, name)
);
create index idx_teams_tournament on teams(tournament_id);
create index idx_teams_owner on teams(owner_user_id);
create trigger trg_teams_updated before update on teams
  for each row execute function set_updated_at();

-- ---------- JUGADORES (datos mínimos: nombre + dorsal) ----------
create table players (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid not null references teams(id) on delete restrict,
  name          text not null,
  jersey_number smallint not null check (jersey_number between 0 and 999),
  active        boolean not null default true,       -- soft delete: preserva histórico de goles
  created_by    uuid references users(id) on delete set null,  -- audit: quién lo dio de alta
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
-- dorsal único por equipo SOLO entre activos (una baja libera su dorsal)
create unique index uq_players_team_jersey_active
  on players(team_id, jersey_number) where active;
create index idx_players_team on players(team_id);
create trigger trg_players_updated before update on players
  for each row execute function set_updated_at();

-- ---------- PARTIDOS ----------
create table matches (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references tournaments(id) on delete restrict,
  phase          text not null check (phase in ('regular','playoff')),
  round          smallint not null,       -- jornada (regular) o ronda (playoff)
  bracket_slot   smallint,                -- posición fija en el bracket; null en fase regular
  leg            smallint not null default 1 check (leg in (1,2)),  -- ida/vuelta
  home_team_id   uuid references teams(id) on delete restrict,  -- null = slot de bracket sin resolver
  away_team_id   uuid references teams(id) on delete restrict,
  kickoff_at     timestamptz,             -- null = horario por definir
  venue          text,
  stream_url     text,                    -- link de transmisión (Facebook), opcional
  status         text not null default 'scheduled'
                 check (status in ('scheduled','played','postponed','canceled')),
  is_forfeit     boolean not null default false,  -- partido por default
  home_score     smallint check (home_score >= 0),
  away_score     smallint check (away_score >= 0),
  home_penalties smallint check (home_penalties >= 0),  -- solo liguilla, solo si hay empate
  away_penalties smallint check (away_penalties >= 0),
  updated_by     uuid references users(id) on delete set null,  -- audit: quién capturó
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (home_team_id is null or away_team_id is null or home_team_id <> away_team_id),
  check (status <> 'played' or (home_score is not null and away_score is not null)),
  unique (tournament_id, bracket_slot, leg)   -- un slot de bracket no se duplica
);
create index idx_matches_tournament_phase on matches(tournament_id, phase, round);
create index idx_matches_teams on matches(home_team_id, away_team_id);
create trigger trg_matches_updated before update on matches
  for each row execute function set_updated_at();

-- ---------- GOLES ----------
-- UNA fila por (partido, jugador) con contador `count` (v1 no registra minuto).
-- unique(match_id, player_id) hace la corrección un upsert idempotente.
-- La suma de goals NO tiene que cuadrar con home_score/away_score (autogoles,
-- goles sin identificar): el marcador alimenta posiciones, goals alimenta SOLO goleo.
create table goals (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references matches(id) on delete cascade,
  player_id  uuid not null references players(id) on delete restrict,
  team_id    uuid not null references teams(id) on delete restrict, -- denormalizado p/ goleo
  count      smallint not null check (count > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, player_id)
);
create index idx_goals_player on goals(player_id);
create index idx_goals_team on goals(team_id);
create trigger trg_goals_updated before update on goals
  for each row execute function set_updated_at();

-- ---------- COBROS (Mercado Pago) ----------
-- Compra de cupos de jugador y cargos de renta de cancha. La app NUNCA
-- guarda datos de tarjeta: Mercado Pago procesa el pago en su propio
-- checkout y solo notifica aprobado/no vía webhook (mp_payment_id).
create table charges (
  id               uuid primary key default gen_random_uuid(),
  tournament_id    uuid not null references tournaments(id) on delete restrict,
  team_id          uuid not null references teams(id) on delete restrict,
  kind             text not null check (kind in ('slots','rent')),
  concept          text not null,
  slots_count      smallint check (slots_count is null or slots_count > 0),
  amount_cents     integer not null check (amount_cents > 0),
  status           text not null default 'pending' check (status in ('pending','paid','canceled')),
  mp_preference_id text,
  mp_payment_id    text unique,             -- idempotencia del webhook
  paid_via         text check (paid_via in ('mercadopago','manual')),
  created_by       uuid references users(id) on delete set null,
  paid_at          timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (kind <> 'slots' or slots_count is not null)
);
create index idx_charges_team on charges(team_id);
create index idx_charges_tournament on charges(tournament_id);
create trigger trg_charges_updated before update on charges
  for each row execute function set_updated_at();

-- ---------- RATE LIMITING DE LOGIN ----------
create table login_attempts (
  id           bigint generated always as identity primary key,
  ip           text not null,
  username     citext not null,
  success      boolean not null default false,
  attempted_at timestamptz not null default now()
);
create index idx_login_attempts_ip on login_attempts(ip, attempted_at desc);
create index idx_login_attempts_user on login_attempts(username, attempted_at desc);

-- ---------- RPC: alta de jugador atómica (a prueba de race conditions) ----------
-- Dos requests simultáneos del mismo equipo no pueden rebasar player_limit:
-- SELECT ... FOR UPDATE serializa sobre la fila del equipo.
create or replace function create_player_atomic(
  p_team_id uuid, p_name text, p_jersey smallint, p_created_by uuid
) returns players as $$
declare
  v_limit smallint;
  v_count integer;
  v_row   players;
begin
  select player_limit into v_limit from teams
    where id = p_team_id and status = 'active' for update;
  if not found then
    raise exception 'TEAM_NOT_ACTIVE';
  end if;
  select count(*) into v_count from players where team_id = p_team_id and active;
  if v_count >= v_limit then
    raise exception 'PLAYER_LIMIT_REACHED';
  end if;
  insert into players (team_id, name, jersey_number, created_by)
    values (p_team_id, p_name, p_jersey, p_created_by)
    returning * into v_row;
  return v_row;
end;
$$ language plpgsql;

-- ---------- RPC: reset de contraseña atómico ----------
-- Cambia el hash y bumpea token_version en la misma sentencia: mata todas
-- las sesiones vigentes de ese usuario (p.ej. si se filtró la contraseña).
create or replace function reset_user_password(p_user_id uuid, p_password_hash text)
returns users as $$
  update users set password_hash = p_password_hash, token_version = token_version + 1
  where id = p_user_id
  returning *;
$$ language sql;

-- ---------- RPC: incremento atómico de player_limit (compra de cupos) ----------
-- Un solo UPDATE es atómico ante concurrencia; se usa tanto desde el webhook
-- de Mercado Pago como desde "marcar pagado manualmente" en el admin.
create or replace function increment_team_player_limit(p_team_id uuid, p_amount smallint)
returns void as $$
  update teams set player_limit = player_limit + p_amount where id = p_team_id;
$$ language sql;

-- ---------- RLS deny-all (defensa en profundidad) ----------
-- Solo el servidor con service-role key (que ignora RLS) accede a los datos.
-- Sin políticas = nadie con anon key puede leer/escribir nada.
alter table tournaments    enable row level security;
alter table teams          enable row level security;
alter table users          enable row level security;
alter table players        enable row level security;
alter table matches        enable row level security;
alter table goals          enable row level security;
alter table login_attempts enable row level security;
alter table charges        enable row level security;
