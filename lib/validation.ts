// Schemas zod compartidos. Toda Server Action valida su input aquí
// ANTES de tocar la base de datos.

import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "El usuario debe tener al menos 3 caracteres.")
    .max(40, "El usuario es demasiado largo."),
  password: z
    .string()
    .min(1, "Escribe tu contraseña.")
    .max(200, "La contraseña es demasiado larga."),
});

// Se usará a partir de F2 (creación de usuarios de equipo por el admin).
export const newPasswordSchema = z
  .string()
  .min(10, "La contraseña debe tener al menos 10 caracteres.")
  .max(200, "La contraseña es demasiado larga.");

export const playerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Escribe el nombre del jugador.")
    .max(80, "El nombre es demasiado largo."),
  jerseyNumber: z.coerce
    .number()
    .int("El dorsal debe ser un número entero.")
    .min(0, "El dorsal mínimo es 0.")
    .max(999, "El dorsal máximo es 999."),
});

export const editPlayerSchema = playerSchema.extend({
  playerId: z.string().uuid(),
});

export const teamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Escribe el nombre del equipo.")
    .max(60, "El nombre es demasiado largo."),
  playerLimit: z.coerce
    .number()
    .int()
    .min(0, "El límite no puede ser negativo.")
    .max(99, "El límite máximo es 99."),
});

export const tournamentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Escribe el nombre del torneo.")
    .max(80, "El nombre es demasiado largo."),
});

export const scoreSchema = z.object({
  homeScore: z.coerce.number().int().min(0).max(99),
  awayScore: z.coerce.number().int().min(0).max(99),
});

export const createTeamUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "El usuario debe tener al menos 3 caracteres.")
    .max(40, "El usuario es demasiado largo."),
  password: newPasswordSchema,
});

export const createRefereeSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "El usuario debe tener al menos 3 caracteres.")
    .max(40, "El usuario es demasiado largo."),
  password: newPasswordSchema,
});

export const resetPasswordSchema = z.object({
  userId: z.string().uuid(),
  password: newPasswordSchema,
});

export const editTeamUserSchema = z.object({
  userId: z.string().uuid(),
  username: z
    .string()
    .trim()
    .min(3, "El usuario debe tener al menos 3 caracteres.")
    .max(40, "El usuario es demasiado largo."),
});

export const registerTeamSchema = z.object({
  tournamentId: z.string().uuid("Selecciona un torneo."),
  name: z
    .string()
    .trim()
    .min(2, "Escribe el nombre del equipo.")
    .max(60, "El nombre es demasiado largo."),
});

export const uuidSchema = z.string().uuid();

export const generateScheduleSchema = z.object({
  doubleRound: z.boolean(),
});

// Los montos se capturan en pesos (con decimales) en la UI, y se convierten
// a centavos enteros justo antes de guardarse — ver toCents() más abajo.
export const setSlotPriceSchema = z.object({
  tournamentId: z.string().uuid(),
  slotPrice: z.coerce
    .number()
    .min(0, "El precio no puede ser negativo.")
    .max(100_000, "El precio es demasiado alto."),
});

export const createChargeSchema = z.object({
  teamId: z.string().uuid("Selecciona un equipo."),
  concept: z
    .string()
    .trim()
    .min(2, "Escribe un concepto.")
    .max(120, "El concepto es demasiado largo."),
  amount: z.coerce
    .number()
    .positive("El monto debe ser mayor a 0.")
    .max(500_000, "El monto es demasiado alto."),
});

/** Pesos (con decimales) -> centavos enteros, redondeando al centavo más cercano. */
export function toCents(pesos: number): number {
  return Math.round(pesos * 100);
}

export const buySlotsSchema = z.object({
  slotsCount: z.coerce
    .number()
    .int("La cantidad debe ser un número entero.")
    .positive("Elige al menos 1 cupo.")
    .max(99, "Máximo 99 cupos por compra."),
});

// El link de transmisión se valida a mano (no con un schema zod plano)
// porque necesita distinguir "vacío = quitar el link" de "URL inválida" —
// mismo espíritu que parsePenalties() en lib/actions/captureResult.ts.
// Se permite cualquier plataforma (Facebook, YouTube, Instagram, TikTok,
// Twitch...), solo se exige que sea una URL http/https real — eso basta
// para que sea segura de renderizar como link público.
export function parseStreamUrl(
  raw: FormDataEntryValue | null
): { value: string | null } | { error: string } {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) return { value: null };
  if (trimmed.length > 500) return { error: "El link de transmisión es demasiado largo." };

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { error: "El link de transmisión no es una URL válida (debe empezar con https://)." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { error: "El link de transmisión debe empezar con http:// o https://." };
  }
  return { value: trimmed };
}

export const matchSchema = z
  .object({
    round: z.coerce
      .number()
      .int("La jornada debe ser un número entero.")
      .min(1, "La jornada mínima es 1.")
      .max(99, "La jornada máxima es 99."),
    homeTeamId: z.string().uuid("Selecciona el equipo local."),
    awayTeamId: z.string().uuid("Selecciona el equipo visitante."),
    kickoffAt: z.string().trim().optional(),
    venue: z.string().trim().max(120, "La cancha es demasiado larga.").optional(),
  })
  .refine((d) => d.homeTeamId !== d.awayTeamId, {
    message: "El equipo local y visitante deben ser distintos.",
    path: ["awayTeamId"],
  });
