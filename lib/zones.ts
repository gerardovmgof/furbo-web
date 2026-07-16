// Zonas visuales de clasificación para la tabla de posiciones.
// Puramente visual: no genera partidos ni rondas de repechaje reales.

export type ZoneKind = "clasifica" | "repechaje";

export interface ZoneInfo {
  kind: ZoneKind | null;
  label: string;
}

const REPECHAJE_SPOTS = 2;

// Antes de generar la liguilla no se sabe cuántos equipos clasificarán;
// se sugiere un tamaño razonable según cuántos equipos hay en el torneo.
export function suggestPlayoffTeams(teamCount: number): 4 | 8 | 16 | null {
  if (teamCount >= 16) return 16;
  if (teamCount >= 8) return 8;
  if (teamCount >= 4) return 4;
  return null;
}

export function getZone(pos: number, playoffTeams: number | null): ZoneInfo {
  if (!playoffTeams) return { kind: null, label: "" };
  if (pos <= playoffTeams) return { kind: "clasifica", label: "Clasifica a liguilla" };
  if (pos <= playoffTeams + REPECHAJE_SPOTS) {
    return { kind: "repechaje", label: "Zona de repechaje" };
  }
  return { kind: null, label: "" };
}
