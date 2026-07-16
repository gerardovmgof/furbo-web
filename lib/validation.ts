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
  teamId: z.string().uuid("Selecciona un equipo."),
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

export const uuidSchema = z.string().uuid();

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
