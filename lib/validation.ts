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
