import { describe, it, expect } from "vitest";
import { generateBracket, nextSlot, finalSlot, seriesStatus } from "@/lib/bracket";
import type { SeriesLeg } from "@/lib/bracket";

const T = (n: number) => `team-${n}`;
const SEEDS_8 = Array.from({ length: 8 }, (_, i) => T(i + 1)); // team-1 = seed1 ... team-8 = seed8
const SEEDS_4 = Array.from({ length: 4 }, (_, i) => T(i + 1));

describe("generateBracket — 4 equipos", () => {
  it("cruces de la ronda 1: 1v4 y 2v3, partido único", () => {
    const plans = generateBracket(SEEDS_4, false);
    const round1 = plans.filter((p) => p.round === 1);
    expect(round1).toHaveLength(2);

    const slot1 = round1.find((p) => p.bracketSlot === 1)!;
    expect(slot1.homeTeamId).toBe(T(1));
    expect(slot1.awayTeamId).toBe(T(4));

    const slot2 = round1.find((p) => p.bracketSlot === 2)!;
    expect(slot2.homeTeamId).toBe(T(2));
    expect(slot2.awayTeamId).toBe(T(3));
  });

  it("la final (slot 3) se genera con equipos null hasta que se resuelvan las semis", () => {
    const plans = generateBracket(SEEDS_4, false);
    const final = plans.filter((p) => p.bracketSlot === 3);
    expect(final).toHaveLength(1);
    expect(final[0].round).toBe(2);
    expect(final[0].homeTeamId).toBeNull();
    expect(final[0].awayTeamId).toBeNull();
  });

  it("la final siempre es partido único aunque twoLegs=true", () => {
    const plans = generateBracket(SEEDS_4, true);
    const finalLegs = plans.filter((p) => p.bracketSlot === 3);
    expect(finalLegs).toHaveLength(1);
  });

  it("ida/vuelta en ronda 1: el mejor sembrado (primario) cierra en casa", () => {
    const plans = generateBracket(SEEDS_4, true);
    const slot1Legs = plans.filter((p) => p.bracketSlot === 1);
    expect(slot1Legs).toHaveLength(2);
    const leg1 = slot1Legs.find((l) => l.leg === 1)!;
    const leg2 = slot1Legs.find((l) => l.leg === 2)!;
    // leg1: el peor sembrado (T4) de local; leg2: el mejor sembrado (T1) cierra en casa.
    expect(leg1.homeTeamId).toBe(T(4));
    expect(leg1.awayTeamId).toBe(T(1));
    expect(leg2.homeTeamId).toBe(T(1));
    expect(leg2.awayTeamId).toBe(T(4));
  });
});

describe("generateBracket — 8 equipos", () => {
  it("cruces de cuartos: 1v8, 4v5, 2v7, 3v6", () => {
    const plans = generateBracket(SEEDS_8, false);
    const qf = plans.filter((p) => p.round === 1);
    expect(qf).toHaveLength(4);
    expect([qf.find((p) => p.bracketSlot === 1)!.homeTeamId, qf.find((p) => p.bracketSlot === 1)!.awayTeamId]).toEqual([T(1), T(8)]);
    expect([qf.find((p) => p.bracketSlot === 2)!.homeTeamId, qf.find((p) => p.bracketSlot === 2)!.awayTeamId]).toEqual([T(4), T(5)]);
    expect([qf.find((p) => p.bracketSlot === 3)!.homeTeamId, qf.find((p) => p.bracketSlot === 3)!.awayTeamId]).toEqual([T(2), T(7)]);
    expect([qf.find((p) => p.bracketSlot === 4)!.homeTeamId, qf.find((p) => p.bracketSlot === 4)!.awayTeamId]).toEqual([T(3), T(6)]);
  });

  it("genera semis (slots 5-6) y final (slot 7) vacíos", () => {
    const plans = generateBracket(SEEDS_8, false);
    const sf = plans.filter((p) => p.round === 2);
    const final = plans.filter((p) => p.round === 3);
    expect(sf.map((p) => p.bracketSlot).sort()).toEqual([5, 6]);
    expect(final.map((p) => p.bracketSlot)).toEqual([7]);
    expect([...sf, ...final].every((p) => p.homeTeamId === null && p.awayTeamId === null)).toBe(
      true
    );
  });

  it("total de partidos con ida/vuelta: 4 QF*2 + 2 SF*2 + 1 final = 13", () => {
    const plans = generateBracket(SEEDS_8, true);
    expect(plans).toHaveLength(4 * 2 + 2 * 2 + 1);
  });
});

describe("nextSlot", () => {
  it("mapea correctamente el bracket de 8", () => {
    expect(nextSlot(1, 8)).toEqual({ slot: 5, isPrimary: true });
    expect(nextSlot(2, 8)).toEqual({ slot: 5, isPrimary: false });
    expect(nextSlot(3, 8)).toEqual({ slot: 6, isPrimary: true });
    expect(nextSlot(4, 8)).toEqual({ slot: 6, isPrimary: false });
    expect(nextSlot(5, 8)).toEqual({ slot: 7, isPrimary: true });
    expect(nextSlot(6, 8)).toEqual({ slot: 7, isPrimary: false });
    expect(nextSlot(7, 8)).toBeNull(); // la final no avanza a nada
  });

  it("mapea correctamente el bracket de 4", () => {
    expect(nextSlot(1, 4)).toEqual({ slot: 3, isPrimary: true });
    expect(nextSlot(2, 4)).toEqual({ slot: 3, isPrimary: false });
    expect(nextSlot(3, 4)).toBeNull();
  });

  it("finalSlot devuelve el slot correcto según el tamaño", () => {
    expect(finalSlot(8)).toBe(7);
    expect(finalSlot(4)).toBe(3);
  });
});

describe("seriesStatus", () => {
  function leg(overrides: Partial<SeriesLeg>): SeriesLeg {
    return {
      homeTeamId: T(1),
      awayTeamId: T(2),
      status: "played",
      homeScore: 0,
      awayScore: 0,
      homePenalties: null,
      awayPenalties: null,
      leg: 1,
      ...overrides,
    };
  }

  it("serie incompleta (leg sin jugar) -> complete=false", () => {
    const status = seriesStatus([
      leg({ status: "scheduled", homeScore: null, awayScore: null }),
    ]);
    expect(status).toEqual({ complete: false, winnerId: null, needsPenalties: false });
  });

  it("partido único decisivo, sin penales", () => {
    const status = seriesStatus([leg({ homeScore: 2, awayScore: 1 })]);
    expect(status).toEqual({ complete: true, winnerId: T(1), needsPenalties: false });
  });

  it("partido único empatado sin penales capturados -> pendiente de penales", () => {
    const status = seriesStatus([leg({ homeScore: 1, awayScore: 1 })]);
    expect(status).toEqual({ complete: true, winnerId: null, needsPenalties: true });
  });

  it("partido único empatado con penales -> gana por penales", () => {
    const status = seriesStatus([
      leg({ homeScore: 1, awayScore: 1, homePenalties: 3, awayPenalties: 4 }),
    ]);
    expect(status).toEqual({ complete: true, winnerId: T(2), needsPenalties: true });
  });

  it("ida/vuelta: suma global decide sin necesidad de penales", () => {
    // leg1: T2 de local gana 2-0. leg2: T1 de local gana 1-0.
    // Global: T1 anota 1(leg2 home)+0(leg1 away)=1; T2 anota 2(leg1 home)+0(leg2 away)=2 -> gana T2.
    const status = seriesStatus([
      leg({ leg: 1, homeTeamId: T(2), awayTeamId: T(1), homeScore: 2, awayScore: 0 }),
      leg({ leg: 2, homeTeamId: T(1), awayTeamId: T(2), homeScore: 1, awayScore: 0 }),
    ]);
    expect(status).toEqual({ complete: true, winnerId: T(2), needsPenalties: false });
  });

  it("ida/vuelta con marcador global empatado -> penales en el leg2 (el último jugado)", () => {
    // leg1: T2 local gana 2-0. leg2: T1 local gana 2-0 -> global 2-2, penales en leg2.
    const status = seriesStatus([
      leg({ leg: 1, homeTeamId: T(2), awayTeamId: T(1), homeScore: 2, awayScore: 0 }),
      leg({
        leg: 2,
        homeTeamId: T(1),
        awayTeamId: T(2),
        homeScore: 2,
        awayScore: 0,
        homePenalties: 5,
        awayPenalties: 4,
      }),
    ]);
    expect(status).toEqual({ complete: true, winnerId: T(1), needsPenalties: true });
  });

  it("sin gol de visitante: sólo importa la suma global, no dónde se marcó", () => {
    // leg1: T2 local 3-1 (T2 anota 3 en casa, T1 anota 1 de visita).
    // leg2: T1 local 1-2 (T1 anota 1 en casa, T2 anota 2 de visita).
    // Global: T1 = 1+1=2, T2 = 3+2=5 -> gana T2 claramente (no hay regla de visitante que cambie esto).
    const status = seriesStatus([
      leg({ leg: 1, homeTeamId: T(2), awayTeamId: T(1), homeScore: 3, awayScore: 1 }),
      leg({ leg: 2, homeTeamId: T(1), awayTeamId: T(2), homeScore: 1, awayScore: 2 }),
    ]);
    expect(status.winnerId).toBe(T(2));
    expect(status.needsPenalties).toBe(false);
  });
});
