// Cálculo puro de la tabla de posiciones. Sin acceso a red/DB — testeable.
//
// Solo cuenta partidos phase='regular' y status='played' (incluye forfeits,
// que sí cuentan como partido normal para la tabla).
//
// Orden de desempate, en este orden estricto:
//   1. PTS descendente
//   2. DIF (GF-GC) descendente
//   3. GF descendente
//   4. Head-to-head: dentro del grupo empatado en 1-3, mini-tabla calculada
//      SOLO con los partidos entre esos equipos (PTS -> DIF de esa mini-tabla)
//   5. Nombre del equipo, ascendente con localeCompare('es') — desempate
//      final estable (mismo input siempre da el mismo output).

import type { MatchRow, TeamRow, StandingRow } from "@/lib/types";

interface TeamAccumulator {
  teamId: string;
  name: string;
  withdrawn: boolean;
  jj: number;
  jg: number;
  je: number;
  jp: number;
  gf: number;
  gc: number;
}

export function computeStandings(teams: TeamRow[], matches: MatchRow[]): StandingRow[] {
  const playedRegular = matches.filter(
    (m) =>
      m.phase === "regular" &&
      m.status === "played" &&
      m.home_team_id &&
      m.away_team_id &&
      m.home_score !== null &&
      m.away_score !== null
  );

  const acc = new Map<string, TeamAccumulator>();
  for (const t of teams) {
    acc.set(t.id, {
      teamId: t.id,
      name: t.name,
      withdrawn: t.status === "withdrawn",
      jj: 0,
      jg: 0,
      je: 0,
      jp: 0,
      gf: 0,
      gc: 0,
    });
  }

  for (const m of playedRegular) {
    const home = acc.get(m.home_team_id as string);
    const away = acc.get(m.away_team_id as string);
    if (!home || !away) continue; // equipo fuera de la lista (no debería pasar)

    const hs = m.home_score as number;
    const as = m.away_score as number;

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

  const rows = [...acc.values()].map((a) => ({
    ...a,
    dif: a.gf - a.gc,
    pts: a.jg * 3 + a.je,
  }));

  const base = [...rows].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dif !== a.dif) return b.dif - a.dif;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.name.localeCompare(b.name, "es");
  });

  const result: typeof base = [];
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
    result.push(...headToHeadSort(group, playedRegular));
    i = j;
  }

  return result.map((r, idx) => ({
    pos: idx + 1,
    teamId: r.teamId,
    name: r.name,
    withdrawn: r.withdrawn,
    jj: r.jj,
    jg: r.jg,
    je: r.je,
    jp: r.jp,
    gf: r.gf,
    gc: r.gc,
    dif: r.dif,
    pts: r.pts,
  }));
}

function headToHeadSort<T extends { teamId: string; name: string }>(
  group: T[],
  matches: MatchRow[]
): T[] {
  if (group.length <= 1) return group;

  const ids = new Set(group.map((g) => g.teamId));
  const mini = new Map(group.map((g) => [g.teamId, { pts: 0, gf: 0, gc: 0 }]));

  for (const m of matches) {
    const h = m.home_team_id as string;
    const a = m.away_team_id as string;
    if (!ids.has(h) || !ids.has(a)) continue;
    const hs = m.home_score as number;
    const as = m.away_score as number;

    const homeStat = mini.get(h)!;
    const awayStat = mini.get(a)!;
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
    const mx = mini.get(x.teamId)!;
    const my = mini.get(y.teamId)!;
    if (my.pts !== mx.pts) return my.pts - mx.pts;
    const difX = mx.gf - mx.gc;
    const difY = my.gf - my.gc;
    if (difY !== difX) return difY - difX;
    return x.name.localeCompare(y.name, "es");
  });
}
