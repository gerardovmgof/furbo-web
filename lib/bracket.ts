// Generación y resolución de la liguilla. Sin acceso a red/DB — testeable.
//
// Convención de slots (fijos, documentados aquí porque la propagación en
// app/admin/liguilla/actions.ts depende de ellos):
//
//   8 equipos: QF slots 1-4 (ronda 1) -> SF slots 5-6 (ronda 2) -> Final slot 7 (ronda 3)
//     slot1 = seed1 vs seed8   slot2 = seed4 vs seed5
//     slot3 = seed2 vs seed7   slot4 = seed3 vs seed6
//   4 equipos: SF slots 1-2 (ronda 1) -> Final slot 3 (ronda 2)
//     slot1 = seed1 vs seed4   slot2 = seed2 vs seed3
//
// Ida/vuelta: el equipo "primario" de cada cruce cierra la serie en casa
// (leg2 home). En la ronda 1 el primario es el mejor sembrado del cruce.
// En rondas futuras (ganadores aún desconocidos al generar el bracket) el
// primario es el que avanza desde el slot de número MENOR de la pareja que
// alimenta el siguiente slot — convención fija, no depende de la seed real
// del ganador. La Final es SIEMPRE partido único, sin importar twoLegs.

export interface BracketMatchPlan {
  round: number;
  bracketSlot: number;
  leg: 1 | 2;
  homeTeamId: string | null;
  awayTeamId: string | null;
}

interface SlotPair {
  slot: number;
  primarySeedIdx: number; // índice en seededTeamIds del equipo que cierra en casa
  secondarySeedIdx: number;
}

const PAIRS_8: SlotPair[] = [
  { slot: 1, primarySeedIdx: 0, secondarySeedIdx: 7 }, // 1 vs 8
  { slot: 2, primarySeedIdx: 3, secondarySeedIdx: 4 }, // 4 vs 5
  { slot: 3, primarySeedIdx: 1, secondarySeedIdx: 6 }, // 2 vs 7
  { slot: 4, primarySeedIdx: 2, secondarySeedIdx: 5 }, // 3 vs 6
];

const PAIRS_4: SlotPair[] = [
  { slot: 1, primarySeedIdx: 0, secondarySeedIdx: 3 }, // 1 vs 4
  { slot: 2, primarySeedIdx: 1, secondarySeedIdx: 2 }, // 2 vs 3
];

/** slot de origen -> { slot de destino, si es el "primario" (cierra en casa) } */
const NEXT_SLOT_8: Record<number, { slot: number; isPrimary: boolean }> = {
  1: { slot: 5, isPrimary: true },
  2: { slot: 5, isPrimary: false },
  3: { slot: 6, isPrimary: true },
  4: { slot: 6, isPrimary: false },
  5: { slot: 7, isPrimary: true },
  6: { slot: 7, isPrimary: false },
};

const NEXT_SLOT_4: Record<number, { slot: number; isPrimary: boolean }> = {
  1: { slot: 3, isPrimary: true },
  2: { slot: 3, isPrimary: false },
};

export function nextSlot(
  slot: number,
  bracketSize: 4 | 8
): { slot: number; isPrimary: boolean } | null {
  const map = bracketSize === 8 ? NEXT_SLOT_8 : NEXT_SLOT_4;
  return map[slot] ?? null;
}

export function finalSlot(bracketSize: 4 | 8): number {
  return bracketSize === 8 ? 7 : 3;
}

/**
 * Genera TODOS los partidos del bracket, incluyendo rondas futuras con
 * home/away en null (se llenan por propagación al resolverse cada cruce).
 */
export function generateBracket(
  seededTeamIds: string[],
  twoLegs: boolean
): BracketMatchPlan[] {
  if (seededTeamIds.length !== 4 && seededTeamIds.length !== 8) {
    throw new Error("La liguilla solo admite 4 u 8 equipos.");
  }
  const bracketSize = seededTeamIds.length as 4 | 8;
  const pairs = bracketSize === 8 ? PAIRS_8 : PAIRS_4;
  const rounds = bracketSize === 8 ? 3 : 2;

  const plans: BracketMatchPlan[] = [];

  // Ronda 1: cruces conocidos desde la siembra.
  for (const pair of pairs) {
    const primary = seededTeamIds[pair.primarySeedIdx];
    const secondary = seededTeamIds[pair.secondarySeedIdx];
    plans.push(...legsFor(1, pair.slot, primary, secondary, twoLegs));
  }

  // Rondas futuras: slots numerados consecutivamente, equipos desconocidos.
  let slot = pairs.length + 1;
  for (let round = 2; round <= rounds; round++) {
    const slotsInRound = pairs.length / Math.pow(2, round - 1);
    const isFinal = round === rounds;
    for (let i = 0; i < slotsInRound; i++) {
      plans.push(...legsFor(round, slot, null, null, isFinal ? false : twoLegs));
      slot++;
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
