import { describe, it, expect } from "vitest";
import { generateRoundRobin } from "@/lib/schedule";

const identity = <T,>(items: T[]) => items;

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("-");
}

function teamIds(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `t${i + 1}`);
}

describe("generateRoundRobin", () => {
  it("lanza error con menos de 2 equipos", () => {
    expect(() => generateRoundRobin(["t1"])).toThrow();
    expect(() => generateRoundRobin([])).toThrow();
  });

  it("cada par de equipos juega exactamente una vez (par, single round)", () => {
    const teams = teamIds(6);
    const plans = generateRoundRobin(teams, { shuffle: identity });
    const seen = new Set<string>();
    for (const p of plans) {
      const key = pairKey(p.homeTeamId, p.awayTeamId);
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
    expect(plans.length).toBe((6 * 5) / 2);
  });

  it("ningún equipo repite en la misma jornada (par)", () => {
    const teams = teamIds(6);
    const plans = generateRoundRobin(teams, { shuffle: identity });
    const rounds = new Set(plans.map((p) => p.round));
    for (const round of rounds) {
      const inRound = plans.filter((p) => p.round === round);
      const teamsThisRound = inRound.flatMap((p) => [p.homeTeamId, p.awayTeamId]);
      expect(new Set(teamsThisRound).size).toBe(teamsThisRound.length);
    }
  });

  it("número impar de equipos: cada jornada descansa exactamente un equipo", () => {
    const teams = teamIds(5);
    const plans = generateRoundRobin(teams, { shuffle: identity });
    const rounds = [...new Set(plans.map((p) => p.round))];
    expect(rounds.length).toBe(5); // n=5 impar -> con bye, totalRounds = 6-1 = 5

    for (const round of rounds) {
      const inRound = plans.filter((p) => p.round === round);
      const teamsThisRound = new Set(inRound.flatMap((p) => [p.homeTeamId, p.awayTeamId]));
      expect(teamsThisRound.size).toBe(4); // 5 equipos - 1 que descansa
    }
    // cada par de los 5 equipos reales se enfrenta exactamente una vez
    const seen = new Set<string>();
    for (const p of plans) seen.add(pairKey(p.homeTeamId, p.awayTeamId));
    expect(seen.size).toBe((5 * 4) / 2);
  });

  it("ida y vuelta: duplica los partidos con localía invertida y jornadas corridas", () => {
    const teams = teamIds(4);
    const single = generateRoundRobin(teams, { shuffle: identity });
    const double = generateRoundRobin(teams, { shuffle: identity, doubleRound: true });

    expect(double.length).toBe(single.length * 2);

    const totalRoundsSingle = Math.max(...single.map((p) => p.round));
    const secondLeg = double.filter((p) => p.round > totalRoundsSingle);
    expect(secondLeg.length).toBe(single.length);

    // cada partido de la ida tiene su espejo en la vuelta con localía invertida
    for (const p of single) {
      const mirror = secondLeg.find(
        (m) => m.homeTeamId === p.awayTeamId && m.awayTeamId === p.homeTeamId
      );
      expect(mirror).toBeDefined();
    }
  });

  it("usa exactamente el conjunto de equipos recibido, sin perder ni duplicar (sorteo real)", () => {
    const teams = teamIds(7);
    const plans = generateRoundRobin(teams); // shuffle real (Math.random)
    const used = new Set(plans.flatMap((p) => [p.homeTeamId, p.awayTeamId]));
    expect(used).toEqual(new Set(teams));
    expect(plans.length).toBe((7 * 6) / 2);
  });

  it("3 a 20 equipos: siempre produce todos los enfrentamientos exactamente una vez", () => {
    for (let n = 3; n <= 20; n++) {
      const teams = teamIds(n);
      const plans = generateRoundRobin(teams, { shuffle: identity });
      const seen = new Set<string>();
      for (const p of plans) seen.add(pairKey(p.homeTeamId, p.awayTeamId));
      expect(seen.size).toBe((n * (n - 1)) / 2);
    }
  });
});
