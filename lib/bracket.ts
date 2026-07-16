// Generación y resolución de la liguilla. Sin acceso a red/DB — testeable.
//
// Bracket de eliminación directa para 4, 8 o 16 equipos. Los slots se
// numeran consecutivamente por ronda (ronda 1 primero, luego ronda 2, …) y
// el sembrado de la ronda 1 usa el algoritmo estándar de torneos (el mismo
// patrón que NCAA/FIFA): el mejor sembrado siempre cae del lado opuesto del
// bracket al segundo mejor, y así sucesivamente, para que los mejores
// equipos se crucen lo más tarde posible.
//
// Convención "primario/secundario": en cada cruce, el "primario" (el slot
// de número menor de la pareja que alimenta el siguiente cruce) cierra la
// serie en casa en la vuelta. En la ronda 1 el primario es el mejor
// sembrado del cruce; en rondas futuras (ganadores aún desconocidos al
// generar el bracket) es el que avanza desde el slot de número menor —
// convención fija, no depende de la seed real del ganador. La Final es
// SIEMPRE partido único, sin importar twoLegs.

export interface BracketMatchPlan {
  round: number;
  bracketSlot: number;
  leg: 1 | 2;
  homeTeamId: string | null;
  awayTeamId: string | null;
}

export type BracketSize = 4 | 8 | 16;

/**
 * Orden estándar de sembrado para un bracket de `n` equipos (n potencia de
 * 2): las posiciones adyacentes (0,1), (2,3), … forman los cruces de la
 * ronda 1.
 *   n=4  -> [1,4,2,3]                          cruces: (1,4) (2,3)
 *   n=8  -> [1,8,4,5,2,7,3,6]                  cruces: (1,8) (4,5) (2,7) (3,6)
 *   n=16 -> [1,16,8,9,4,13,5,12,2,15,7,10,3,14,6,11]
 */
function seedOrder(n: number): number[] {
  if (n === 1) return [1];
  const prev = seedOrder(n / 2);
  const result: number[] = [];
  for (const x of prev) result.push(x, n + 1 - x);
  return result;
}

function totalRounds(n: number): number {
  return Math.log2(n);
}

/** Cuántos slots tiene la ronda `round` (1-indexada) de un bracket de tamaño n. */
function roundSlotCount(n: number, round: number): number {
  return n / Math.pow(2, round);
}

/** Número de slot (1-indexado) del primer partido de la ronda `round`. */
function roundStartSlot(n: number, round: number): number {
  return n - n / Math.pow(2, round - 1) + 1;
}

export function finalSlot(bracketSize: BracketSize): number {
  return roundStartSlot(bracketSize, totalRounds(bracketSize));
}

export function nextSlot(
  slot: number,
  bracketSize: BracketSize
): { slot: number; isPrimary: boolean } | null {
  const rounds = totalRounds(bracketSize);
  for (let round = 1; round <= rounds; round++) {
    const start = roundStartSlot(bracketSize, round);
    const count = roundSlotCount(bracketSize, round);
    if (slot < start || slot >= start + count) continue;
    if (round === rounds) return null; // era la final: no hay siguiente ronda
    const k = slot - start; // índice 0-based dentro de la ronda
    const destStart = roundStartSlot(bracketSize, round + 1);
    return { slot: destStart + Math.floor(k / 2), isPrimary: k % 2 === 0 };
  }
  return null;
}

/**
 * Genera TODOS los partidos del bracket, incluyendo rondas futuras con
 * home/away en null (se llenan por propagación al resolverse cada cruce).
 */
export function generateBracket(
  seededTeamIds: string[],
  twoLegs: boolean
): BracketMatchPlan[] {
  if (
    seededTeamIds.length !== 4 &&
    seededTeamIds.length !== 8 &&
    seededTeamIds.length !== 16
  ) {
    throw new Error("La liguilla solo admite 4, 8 o 16 equipos.");
  }
  const bracketSize = seededTeamIds.length as BracketSize;
  const rounds = totalRounds(bracketSize);
  const order = seedOrder(bracketSize);

  const plans: BracketMatchPlan[] = [];

  // Ronda 1: cruces conocidos desde la siembra (pares consecutivos de `order`).
  const round1Start = roundStartSlot(bracketSize, 1);
  for (let i = 0; i < bracketSize / 2; i++) {
    const primarySeed = order[i * 2];
    const secondarySeed = order[i * 2 + 1];
    const primary = seededTeamIds[primarySeed - 1];
    const secondary = seededTeamIds[secondarySeed - 1];
    plans.push(...legsFor(1, round1Start + i, primary, secondary, twoLegs));
  }

  // Rondas futuras: equipos desconocidos hasta que se resuelva la anterior.
  for (let round = 2; round <= rounds; round++) {
    const start = roundStartSlot(bracketSize, round);
    const count = roundSlotCount(bracketSize, round);
    const isFinal = round === rounds;
    for (let i = 0; i < count; i++) {
      plans.push(...legsFor(round, start + i, null, null, isFinal ? false : twoLegs));
    }
  }

  return plans;
}

function legsFor(
  round: number,
  slot: number,
  primaryTeamId: string | null,
  secondaryTeamId: string | null,
  twoLegs: boolean
): BracketMatchPlan[] {
  if (!twoLegs) {
    // Partido único: el primario (mejor sembrado / slot menor) juega de local.
    return [
      {
        round,
        bracketSlot: slot,
        leg: 1,
        homeTeamId: primaryTeamId,
        awayTeamId: secondaryTeamId,
      },
    ];
  }
  return [
    {
      round,
      bracketSlot: slot,
      leg: 1,
      homeTeamId: secondaryTeamId,
      awayTeamId: primaryTeamId,
    },
    {
      round,
      bracketSlot: slot,
      leg: 2,
      homeTeamId: primaryTeamId,
      awayTeamId: secondaryTeamId,
    },
  ];
}

// ---------- Resolución de series ----------

export interface SeriesLeg {
  homeTeamId: string | null;
  awayTeamId: string | null;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  leg: 1 | 2;
}

export interface SeriesStatus {
  complete: boolean; // todos los partidos de tiempo regular ya se jugaron
  winnerId: string | null; // null si falta jugar o faltan penales
  needsPenalties: boolean;
}

/**
 * Resuelve el ganador de una serie (1 o 2 partidos entre los mismos dos
 * equipos). Sin gol de visitante: se suma el marcador global; empate ->
 * penales (capturados en el ÚLTIMO leg jugado).
 */
export function seriesStatus(legs: SeriesLeg[]): SeriesStatus {
  if (legs.length === 0 || legs.some((l) => l.status !== "played")) {
    return { complete: false, winnerId: null, needsPenalties: false };
  }

  const teamA = legs[0].homeTeamId;
  const teamB = legs[0].awayTeamId;
  if (!teamA || !teamB) {
    return { complete: false, winnerId: null, needsPenalties: false };
  }

  let totalA = 0;
  let totalB = 0;
  for (const leg of legs) {
    const hs = leg.homeScore ?? 0;
    const as = leg.awayScore ?? 0;
    if (leg.homeTeamId === teamA) {
      totalA += hs;
      totalB += as;
    } else {
      totalA += as;
      totalB += hs;
    }
  }

  if (totalA !== totalB) {
    return { complete: true, winnerId: totalA > totalB ? teamA : teamB, needsPenalties: false };
  }

  // Empate global: resolver con los penales del último leg jugado.
  const decisive = [...legs].sort((a, b) => b.leg - a.leg)[0];
  if (decisive.homePenalties === null || decisive.awayPenalties === null) {
    return { complete: true, winnerId: null, needsPenalties: true };
  }
  const homeWinsShootout = decisive.homePenalties > decisive.awayPenalties;
  const winnerId = homeWinsShootout ? decisive.homeTeamId : decisive.awayTeamId;
  return { complete: true, winnerId, needsPenalties: true };
}
