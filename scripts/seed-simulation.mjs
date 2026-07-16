// Reemplaza los datos reales por una simulación completa e inventada:
// borra el torneo actual (equipos, jugadores, partidos, goles, usuarios de
// equipo) y crea un torneo de 10 equipos con jugadores, calendario de
// temporada regular jugado, goleo y una liguilla de 8 equipos generada y
// jugada hasta el campeón (incluye un cruce definido por penales).
//
// Uso:  node scripts/seed-simulation.mjs
//
// Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local.
// Conserva el usuario admin existente; borra usuarios de equipo (dependen
// de los equipos que se van a borrar).

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (.env.local).");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

// ---------- lib/bracket.ts portado a JS plano (misma lógica, sin tipos) ----------
function seedOrder(n) {
  if (n === 1) return [1];
  const prev = seedOrder(n / 2);
  const result = [];
  for (const x of prev) result.push(x, n + 1 - x);
  return result;
}
function totalRounds(n) {
  return Math.log2(n);
}
function roundSlotCount(n, round) {
  return n / Math.pow(2, round);
}
function roundStartSlot(n, round) {
  return n - n / Math.pow(2, round - 1) + 1;
}
function nextSlot(slot, bracketSize) {
  const rounds = totalRounds(bracketSize);
  for (let round = 1; round <= rounds; round++) {
    const start = roundStartSlot(bracketSize, round);
    const count = roundSlotCount(bracketSize, round);
    if (slot < start || slot >= start + count) continue;
    if (round === rounds) return null;
    const k = slot - start;
    const destStart = roundStartSlot(bracketSize, round + 1);
    return { slot: destStart + Math.floor(k / 2), isPrimary: k % 2 === 0 };
  }
  return null;
}
function generateBracketRound1(seededTeamIds) {
  const bracketSize = seededTeamIds.length;
  const order = seedOrder(bracketSize);
  const start = roundStartSlot(bracketSize, 1);
  const plans = [];
  for (let i = 0; i < bracketSize / 2; i++) {
    const primarySeed = order[i * 2];
    const secondarySeed = order[i * 2 + 1];
    plans.push({
      round: 1,
      bracketSlot: start + i,
      homeTeamId: seededTeamIds[primarySeed - 1],
      awayTeamId: seededTeamIds[secondarySeed - 1],
    });
  }
  return plans;
}

// ---------- lib/standings.ts portado a JS plano ----------
function computeStandings(teams, matches) {
  const played = matches.filter(
    (m) =>
      m.phase === "regular" &&
      m.status === "played" &&
      m.home_team_id &&
      m.away_team_id &&
      m.home_score !== null &&
      m.away_score !== null
  );
  const acc = new Map();
  for (const t of teams) {
    acc.set(t.id, { teamId: t.id, name: t.name, jj: 0, jg: 0, je: 0, jp: 0, gf: 0, gc: 0 });
  }
  for (const m of played) {
    const home = acc.get(m.home_team_id);
    const away = acc.get(m.away_team_id);
    if (!home || !away) continue;
    const hs = m.home_score;
    const as = m.away_score;
    home.jj++;
    away.jj++;
    home.gf += hs;
    home.gc += as;
    away.gf += as;
    away.gc += hs;
    if (hs > as) {
      home.jg++;
      away.jp++;
    } else if (hs < as) {
      away.jg++;
      home.jp++;
    } else {
      home.je++;
      away.je++;
    }
  }
  const rows = [...acc.values()].map((a) => ({ ...a, dif: a.gf - a.gc, pts: a.jg * 3 + a.je }));
  const base = [...rows].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dif !== a.dif) return b.dif - a.dif;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.name.localeCompare(b.name, "es");
  });
  const result = [];
  let i = 0;
  while (i < base.length) {
    let j = i + 1;
    while (
      j < base.length &&
      base[j].pts === base[i].pts &&
      base[j].dif === base[i].dif &&
      base[j].gf === base[i].gf
    ) {
      j++;
    }
    const group = base.slice(i, j);
    result.push(...headToHeadSort(group, played));
    i = j;
  }
  return result;
}
function headToHeadSort(group, matches) {
  if (group.length <= 1) return group;
  const ids = new Set(group.map((g) => g.teamId));
  const mini = new Map(group.map((g) => [g.teamId, { pts: 0, gf: 0, gc: 0 }]));
  for (const m of matches) {
    const h = m.home_team_id;
    const a = m.away_team_id;
    if (!ids.has(h) || !ids.has(a)) continue;
    const hs = m.home_score;
    const as = m.away_score;
    const homeStat = mini.get(h);
    const awayStat = mini.get(a);
    homeStat.gf += hs;
    homeStat.gc += as;
    awayStat.gf += as;
    awayStat.gc += hs;
    if (hs > as) homeStat.pts += 3;
    else if (hs < as) awayStat.pts += 3;
    else {
      homeStat.pts += 1;
      awayStat.pts += 1;
    }
  }
  return [...group].sort((x, y) => {
    const mx = mini.get(x.teamId);
    const my = mini.get(y.teamId);
    if (my.pts !== mx.pts) return my.pts - mx.pts;
    const difX = mx.gf - mx.gc;
    const difY = my.gf - my.gc;
    if (difY !== difX) return difY - difX;
    return x.name.localeCompare(y.name, "es");
  });
}

// ---------- datos inventados ----------
const TEAM_NAMES = [
  "Tigres del Bosque",
  "Águilas Doradas",
  "Lobos de Acero",
  "Cometas FC",
  "Halcones Rojos",
  "Titanes Azules",
  "Dragones Verdes",
  "Panteras Negras",
  "Rayos del Norte",
  "Fénix United",
];
const FIRST_NAMES = [
  "Carlos", "Luis", "José", "Miguel", "Juan", "Diego", "Fernando", "Ricardo",
  "Andrés", "Iván", "Emilio", "Raúl", "Héctor", "Sergio", "Alberto", "Pablo",
  "Daniel", "Jorge", "Adrián", "Mario", "Rodrigo", "Óscar", "Manuel", "Alejandro",
];
const LAST_NAMES = [
  "García", "Martínez", "López", "Hernández", "González", "Pérez", "Sánchez",
  "Ramírez", "Torres", "Flores", "Rivera", "Gómez", "Díaz", "Reyes", "Morales",
  "Cruz", "Ortiz", "Gutiérrez", "Chávez", "Ramos", "Vargas", "Castillo",
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomGoals() {
  const dist = [0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 3, 3, 4];
  return randomChoice(dist);
}
function pickScorers(players, goals) {
  const counts = new Map();
  for (let i = 0; i < goals; i++) {
    const player = Math.random() < 0.4 ? players[0] : randomChoice(players);
    counts.set(player.id, (counts.get(player.id) ?? 0) + 1);
  }
  return counts;
}
function generateRoundRobin(teamIds) {
  const n = teamIds.length;
  const rounds = [];
  let arr = teamIds.slice(1);
  for (let r = 0; r < n - 1; r++) {
    const roundTeams = [teamIds[0], ...arr];
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      let home = roundTeams[i];
      let away = roundTeams[n - 1 - i];
      if (r % 2 === 1) [home, away] = [away, home];
      pairs.push([home, away]);
    }
    rounds.push(pairs);
    arr = [arr[arr.length - 1], ...arr.slice(0, arr.length - 1)];
  }
  return rounds;
}

async function main() {
  console.log("→ Verificando usuario admin existente...");
  const { data: admins, error: adminErr } = await supabase
    .from("users")
    .select("id")
    .eq("role", "admin");
  if (adminErr) throw adminErr;
  if (!admins || admins.length === 0) {
    console.error("❌ No hay usuario admin. Aborta (no se toca nada).");
    process.exit(1);
  }
  console.log(`  ${admins.length} admin(es) se conservarán.`);

  console.log("→ Borrando datos reales existentes (torneo, equipos, jugadores, partidos, usuarios de equipo)...");
  const { data: oldMatches } = await supabase.from("matches").select("id");
  if (oldMatches?.length) {
    const { error } = await supabase.from("matches").delete().in("id", oldMatches.map((m) => m.id));
    if (error) throw error;
  }
  const { data: oldPlayers } = await supabase.from("players").select("id");
  if (oldPlayers?.length) {
    const { error } = await supabase.from("players").delete().in("id", oldPlayers.map((p) => p.id));
    if (error) throw error;
  }
  const { error: delTeamUsersErr } = await supabase.from("users").delete().eq("role", "team");
  if (delTeamUsersErr) throw delTeamUsersErr;
  const { data: oldTeams } = await supabase.from("teams").select("id");
  if (oldTeams?.length) {
    const { error } = await supabase.from("teams").delete().in("id", oldTeams.map((t) => t.id));
    if (error) throw error;
  }
  const { data: oldTournaments } = await supabase.from("tournaments").select("id");
  if (oldTournaments?.length) {
    const { error } = await supabase
      .from("tournaments")
      .delete()
      .in("id", oldTournaments.map((t) => t.id));
    if (error) throw error;
  }
  console.log("  Listo.");

  console.log("→ Creando torneo de simulación...");
  const { data: tournament, error: tErr } = await supabase
    .from("tournaments")
    .insert({
      name: "Liga Simulación Verano 2026",
      status: "regular",
      registration_open: false,
    })
    .select()
    .single();
  if (tErr) throw tErr;

  console.log("→ Creando 10 equipos...");
  const teamsToInsert = TEAM_NAMES.map((name) => ({
    tournament_id: tournament.id,
    name,
    player_limit: 12,
    status: "active",
  }));
  const { data: teams, error: teamsErr } = await supabase
    .from("teams")
    .insert(teamsToInsert)
    .select();
  if (teamsErr) throw teamsErr;

  console.log("→ Creando jugadores (10 por equipo)...");
  const playersByTeam = new Map();
  const allPlayersToInsert = [];
  for (const team of teams) {
    const jerseys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const teamPlayers = jerseys.map((jersey) => ({
      team_id: team.id,
      name: `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`,
      jersey_number: jersey,
      active: true,
    }));
    allPlayersToInsert.push(...teamPlayers);
  }
  const { data: insertedPlayers, error: playersErr } = await supabase
    .from("players")
    .insert(allPlayersToInsert)
    .select();
  if (playersErr) throw playersErr;
  for (const p of insertedPlayers) {
    if (!playersByTeam.has(p.team_id)) playersByTeam.set(p.team_id, []);
    playersByTeam.get(p.team_id).push(p);
  }

  // Inserta un partido jugado y sus goles; retorna la fila insertada.
  // Inserción secuencial (no bulk) para conocer el id real de cada partido
  // sin depender del orden de retorno de un insert masivo.
  async function playMatch({ homeId, awayId, homeScore, awayScore, matchFields }) {
    const { data: match, error } = await supabase
      .from("matches")
      .insert({
        tournament_id: tournament.id,
        home_team_id: homeId,
        away_team_id: awayId,
        status: "played",
        home_score: homeScore,
        away_score: awayScore,
        ...matchFields,
      })
      .select()
      .single();
    if (error) throw error;

    const homeCounts = pickScorers(playersByTeam.get(homeId), homeScore);
    const awayCounts = pickScorers(playersByTeam.get(awayId), awayScore);
    const goalRows = [];
    for (const [playerId, count] of homeCounts) {
      goalRows.push({ match_id: match.id, player_id: playerId, team_id: homeId, count });
    }
    for (const [playerId, count] of awayCounts) {
      goalRows.push({ match_id: match.id, player_id: playerId, team_id: awayId, count });
    }
    if (goalRows.length) {
      const { error: gErr } = await supabase.from("goals").insert(goalRows);
      if (gErr) throw gErr;
    }
    return match;
  }

  console.log("→ Generando y jugando calendario de temporada regular (round-robin, 9 jornadas)...");
  const teamIds = teams.map((t) => t.id);
  const roundRobin = generateRoundRobin(teamIds);
  const seasonStart = new Date("2026-03-07T18:00:00-06:00");
  const playedRegular = [];
  for (let r = 0; r < roundRobin.length; r++) {
    const kickoff = new Date(seasonStart);
    kickoff.setDate(kickoff.getDate() + r * 7);
    for (const [homeId, awayId] of roundRobin[r]) {
      const homeScore = randomGoals();
      const awayScore = randomGoals();
      const match = await playMatch({
        homeId,
        awayId,
        homeScore,
        awayScore,
        matchFields: {
          phase: "regular",
          round: r + 1,
          leg: 1,
          kickoff_at: kickoff.toISOString(),
          venue: "Cancha Municipal",
        },
      });
      playedRegular.push(match);
    }
  }
  console.log(`  ${playedRegular.length} partidos jugados.`);

  console.log("→ Calculando tabla de posiciones para sembrar la liguilla...");
  const standings = computeStandings(teams, playedRegular);
  const top8 = standings.slice(0, 8).map((s) => s.teamId);
  console.log("  Top 8:", standings.slice(0, 8).map((s) => `${s.name} (${s.pts}pts)`).join(", "));

  console.log("→ Activando fase de liguilla (8 equipos, partido único)...");
  const { error: playoffModeErr } = await supabase
    .from("tournaments")
    .update({ status: "playoffs", playoff_teams: 8, playoff_two_legs: false })
    .eq("id", tournament.id);
  if (playoffModeErr) throw playoffModeErr;

  const playoffStart = new Date("2026-05-16T18:00:00-06:00");

  console.log("→ Generando y jugando cuartos de final (incluye un cruce definido por penales)...");
  const round1Plans = generateBracketRound1(top8);
  const round1Winners = [];
  for (let idx = 0; idx < round1Plans.length; idx++) {
    const plan = round1Plans[idx];
    let homeScore, awayScore, homePenalties, awayPenalties;
    if (idx === 1) {
      // Fuerza un empate resuelto por penales en el segundo cruce.
      homeScore = 1;
      awayScore = 1;
      homePenalties = 3;
      awayPenalties = 4;
    } else {
      homeScore = randomGoals();
      awayScore = randomGoals();
      while (homeScore === awayScore) awayScore = randomGoals();
      homePenalties = null;
      awayPenalties = null;
    }
    const match = await playMatch({
      homeId: plan.homeTeamId,
      awayId: plan.awayTeamId,
      homeScore,
      awayScore,
      matchFields: {
        phase: "playoff",
        round: 1,
        bracket_slot: plan.bracketSlot,
        leg: 1,
        kickoff_at: playoffStart.toISOString(),
        venue: "Cancha Municipal",
        home_penalties: homePenalties,
        away_penalties: awayPenalties,
      },
    });
    const winnerId =
      homeScore !== awayScore
        ? homeScore > awayScore
          ? plan.homeTeamId
          : plan.awayTeamId
        : homePenalties > awayPenalties
          ? plan.homeTeamId
          : plan.awayTeamId;
    round1Winners.push({ slot: plan.bracketSlot, winnerId, matchId: match.id });
  }

  console.log("→ Armando y jugando semifinales a partir de los ganadores de cuartos...");
  const sfSlots = new Map(); // slot -> { homeTeamId, awayTeamId }
  for (const { slot, winnerId } of round1Winners) {
    const dest = nextSlot(slot, 8);
    if (!sfSlots.has(dest.slot)) sfSlots.set(dest.slot, {});
    const entry = sfSlots.get(dest.slot);
    if (dest.isPrimary) entry.homeTeamId = winnerId;
    else entry.awayTeamId = winnerId;
  }
  const round2Kickoff = new Date(playoffStart);
  round2Kickoff.setDate(round2Kickoff.getDate() + 7);
  const sfWinners = [];
  for (const [slot, pair] of sfSlots) {
    let homeScore = randomGoals();
    let awayScore = randomGoals();
    while (homeScore === awayScore) awayScore = randomGoals();
    await playMatch({
      homeId: pair.homeTeamId,
      awayId: pair.awayTeamId,
      homeScore,
      awayScore,
      matchFields: {
        phase: "playoff",
        round: 2,
        bracket_slot: slot,
        leg: 1,
        kickoff_at: round2Kickoff.toISOString(),
        venue: "Cancha Municipal",
      },
    });
    const winnerId = homeScore > awayScore ? pair.homeTeamId : pair.awayTeamId;
    sfWinners.push({ slot, winnerId });
  }

  console.log("→ Jugando la final...");
  const finalSlotEntry = new Map();
  for (const { slot, winnerId } of sfWinners) {
    const dest = nextSlot(slot, 8);
    if (!finalSlotEntry.has(dest.slot)) finalSlotEntry.set(dest.slot, {});
    const entry = finalSlotEntry.get(dest.slot);
    if (dest.isPrimary) entry.homeTeamId = winnerId;
    else entry.awayTeamId = winnerId;
  }
  const [finalSlotNum, finalTeams] = [...finalSlotEntry.entries()][0];
  let finalHs = randomGoals();
  let finalAs = randomGoals();
  while (finalHs === finalAs) finalAs = randomGoals();
  const round3Kickoff = new Date(playoffStart);
  round3Kickoff.setDate(round3Kickoff.getDate() + 14);
  await playMatch({
    homeId: finalTeams.homeTeamId,
    awayId: finalTeams.awayTeamId,
    homeScore: finalHs,
    awayScore: finalAs,
    matchFields: {
      phase: "playoff",
      round: 3,
      bracket_slot: finalSlotNum,
      leg: 1,
      kickoff_at: round3Kickoff.toISOString(),
      venue: "Estadio Central",
    },
  });

  const championId = finalHs > finalAs ? finalTeams.homeTeamId : finalTeams.awayTeamId;
  const championName = teams.find((t) => t.id === championId)?.name;

  console.log("→ Cerrando el torneo (finished)...");
  const { error: finishErr } = await supabase
    .from("tournaments")
    .update({ status: "finished" })
    .eq("id", tournament.id);
  if (finishErr) throw finishErr;

  console.log("\n✅ Simulación creada.");
  console.log(`   Torneo: ${tournament.name}`);
  console.log(`   Campeón: ${championName}`);
  console.log(`   Partidos regulares: ${playedRegular.length} · Playoff: 7`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message ?? err);
  process.exit(1);
});
