// Generación del calendario de fase regular ("sorteo"). Sin acceso a red/DB —
// testeable.
//
// Método del círculo: se fija un equipo y se rotan los demás para producir
// todas las jornadas de un todos-contra-todos. El orden de entrada se
// revuelve al azar primero — eso es el "sorteo": quién queda en qué posición
// del círculo, no un algoritmo distinto.
//
// Con número impar de equipos se agrega un "descanso" (bye) interno: en cada
// jornada, el equipo que le toca enfrentar al bye simplemente no juega esa
// jornada. Con ida y vuelta, la segunda vuelta repite las mismas jornadas
// con localía invertida.

export interface ScheduleMatchPlan {
  round: number;
  homeTeamId: string;
  awayTeamId: string;
}

const BYE = null;

function fisherYatesShuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface GenerateRoundRobinOptions {
  doubleRound?: boolean;
  /** Inyectable para tests deterministas; por defecto revuelve al azar (el "sorteo"). */
  shuffle?: <T>(items: T[]) => T[];
}

export function generateRoundRobin(
  teamIds: string[],
  options: GenerateRoundRobinOptions = {}
): ScheduleMatchPlan[] {
  if (teamIds.length < 2) {
    throw new Error("Se necesitan al menos 2 equipos para generar el calendario.");
  }

  const shuffle = options.shuffle ?? fisherYatesShuffle;
  const shuffled = shuffle(teamIds);
  const slots: (string | null)[] = shuffled.length % 2 === 0 ? [...shuffled] : [...shuffled, BYE];
  const n = slots.length;
  const totalRounds = n - 1;

  const plans: ScheduleMatchPlan[] = [];
  let rotating = slots.slice(1);

  for (let r = 0; r < totalRounds; r++) {
    const roundSlots = [slots[0], ...rotating];
    for (let i = 0; i < n / 2; i++) {
      let home = roundSlots[i];
      let away = roundSlots[n - 1 - i];
      if (home === BYE || away === BYE) continue;
      if (r % 2 === 1) [home, away] = [away, home]; // alterna localía por jornada
      plans.push({ round: r + 1, homeTeamId: home, awayTeamId: away });
    }
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, rotating.length - 1)];
  }

  if (!options.doubleRound) return plans;

  const secondLeg: ScheduleMatchPlan[] = plans.map((p) => ({
    round: p.round + totalRounds,
    homeTeamId: p.awayTeamId,
    awayTeamId: p.homeTeamId,
  }));
  return [...plans, ...secondLeg];
}
