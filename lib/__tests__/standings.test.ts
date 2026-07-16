import { describe, it, expect } from "vitest";
import { computeStandings } from "@/lib/standings";
import type { TeamRow, MatchRow } from "@/lib/types";

let seq = 0;
function team(name: string, opts: Partial<TeamRow> = {}): TeamRow {
  seq++;
  return {
    id: opts.id ?? `team-${seq}`,
    tournament_id: "t1",
    name,
    player_limit: 12,
    status: opts.status ?? "active",
    created_at: "",
    updated_at: "",
    ...opts,
  };
}

function played(
  home: TeamRow,
  away: TeamRow,
  homeScore: number,
  awayScore: number,
  opts: Partial<MatchRow> = {}
): MatchRow {
  seq++;
  return {
    id: `match-${seq}`,
    tournament_id: "t1",
    phase: "regular",
    round: 1,
    bracket_slot: null,
    leg: 1,
    home_team_id: home.id,
    away_team_id: away.id,
    kickoff_at: null,
    venue: null,
    status: "played",
    is_forfeit: false,
    home_score: homeScore,
    away_score: awayScore,
    home_penalties: null,
    away_penalties: null,
    updated_by: null,
    created_at: "",
    updated_at: "",
    ...opts,
  };
}

describe("computeStandings", () => {
  it("torneo vacío: sin equipos ni partidos devuelve []", () => {
    expect(computeStandings([], [])).toEqual([]);
  });

  it("equipos sin partidos: todos en 0, orden alfabético", () => {
    const b = team("Bravos");
    const a = team("Águilas");
    const rows = computeStandings([b, a], []);
    expect(rows.map((r) => r.name)).toEqual(["Águilas", "Bravos"]);
    expect(rows.every((r) => r.pts === 0 && r.jj === 0)).toBe(true);
  });

  it("ordena por PTS descendente", () => {
    const a = team("A");
    const b = team("B");
    const c = team("C");
    const matches = [played(a, b, 2, 0), played(b, c, 1, 1)];
    const rows = computeStandings([a, b, c], matches);
    // A: 3pts (le ganó a B). B y C: 1pt cada uno (empataron entre sí), pero
    // B además cargó la derrota 0-2 contra A -> dif-2 vs el dif0 de C.
    expect(rows.map((r) => r.name)).toEqual(["A", "C", "B"]);
    expect(rows[0].pts).toBe(3);
  });

  it("desempata por DIF cuando PTS es igual", () => {
    const a = team("A");
    const b = team("B");
    const c = team("C");
    // A y B ganan 1 partido cada uno (3pts), pero A tiene mejor diferencia.
    const matches = [played(a, c, 5, 0), played(b, c, 1, 0)];
    const rows = computeStandings([a, b, c], matches);
    expect(rows[0].name).toBe("A");
    expect(rows[0].dif).toBe(5);
    expect(rows[1].name).toBe("B");
    expect(rows[1].dif).toBe(1);
  });

  it("desempata por GF cuando PTS y DIF son iguales", () => {
    const a = team("A");
    const b = team("B");
    const c = team("C");
    const d = team("D");
    // A: 3-1 (dif2, gf3) vs B: 4-2 (dif2, gf4) — mismos PTS y DIF, distinto GF.
    const matches = [played(a, c, 3, 1), played(b, d, 4, 2)];
    const rows = computeStandings([a, b, c, d], matches);
    expect(rows[0].name).toBe("B");
    expect(rows[0].gf).toBe(4);
    expect(rows[1].name).toBe("A");
    expect(rows[1].gf).toBe(3);
  });

  it("círculo de 3 perfectamente simétrico: irresoluble incluso en head-to-head -> alfabético", () => {
    const a = team("A");
    const b = team("B");
    const c = team("C");
    const d = team("D");
    // A > B > C > A, todos por 1-0 (círculo simétrico: mismo pts/dif/gf para
    // los tres, y el mini-table entre ellos también queda perfectamente
    // simétrico). Empatan además con D vía un 5-5 idéntico para los tres.
    const matches = [
      played(a, b, 1, 0),
      played(b, c, 1, 0),
      played(c, a, 1, 0),
      played(a, d, 5, 5),
      played(b, d, 5, 5),
      played(c, d, 5, 5),
    ];
    const rows = computeStandings([a, b, c, d], matches);
    expect(rows.slice(0, 3).map((r) => r.name)).toEqual(["A", "B", "C"]);
  });

  it("head-to-head resuelve un empate global genuino en PTS/DIF/GF", () => {
    const a = team("A");
    const b = team("B");
    const c = team("C");
    const d = team("D");
    // A le gana a B 2-0 (resultado decisivo entre ellos). Para que A y B
    // terminen EMPATADOS en el global, B compensa goleando a C 2-0 y A
    // "compensa" perdiendo 0-2 con D. Verificado a mano:
    //   A: (2-0 vs B) + (0-2 vs D) = pts3+0=3, dif+2-2=0, gf2+0=2, gc0+2=2
    //   B: (0-2 vs A) + (2-0 vs C) = pts0+3=3, dif-2+2=0, gf0+2=2, gc2+0=2
    // A y B quedan idénticos en PTS/DIF/GF -> mismo grupo de empate.
    // Pero el mini-table SOLO con el partido entre ellos (A 2-0 B) favorece
    // claramente a A (3 mini-pts vs 0), así que A debe quedar arriba de B.
    // D (pts3, dif+2) queda arriba de ambos por DIF; C (pts0) queda al final.
    const matches = [played(a, b, 2, 0), played(d, a, 2, 0), played(b, c, 2, 0)];
    const rows = computeStandings([a, b, c, d], matches);
    expect(rows.map((r) => r.name)).toEqual(["D", "A", "B", "C"]);
  });

  it("equipo retirado se marca con withdrawn pero se ordena igual", () => {
    const a = team("A", { status: "withdrawn" });
    const b = team("B");
    const matches = [played(b, a, 3, 0)];
    const rows = computeStandings([a, b], matches);
    const aRow = rows.find((r) => r.name === "A")!;
    expect(aRow.withdrawn).toBe(true);
    expect(aRow.jp).toBe(1);
    expect(rows.find((r) => r.name === "B")!.withdrawn).toBe(false);
  });

  it("ignora partidos de fase playoff y no-jugados", () => {
    const a = team("A");
    const b = team("B");
    const matches = [
      played(a, b, 3, 0, { phase: "playoff" }),
      played(a, b, 1, 1, { status: "scheduled", home_score: null, away_score: null }),
    ];
    const rows = computeStandings([a, b], matches);
    expect(rows.every((r) => r.jj === 0)).toBe(true);
  });

  it("cuenta un forfeit como partido normal", () => {
    const a = team("A");
    const b = team("B");
    const matches = [played(a, b, 3, 0, { is_forfeit: true })];
    const rows = computeStandings([a, b], matches);
    const aRow = rows.find((r) => r.name === "A")!;
    expect(aRow.jg).toBe(1);
    expect(aRow.pts).toBe(3);
  });
});
