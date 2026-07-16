"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { tournamentSchema, uuidSchema } from "@/lib/validation";

export interface FormState {
  error: string | null;
}

export async function createTournamentAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = tournamentSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { error } = await supabase.from("tournaments").insert({
    name: parsed.data.name,
    status: "draft",
    registration_open: true,
  });
  if (error) return { error: "No se pudo crear el torneo." };

  revalidatePath("/admin/torneos");
  return { error: null };
}

export async function editTournamentAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const idParsed = uuidSchema.safeParse(formData.get("tournamentId"));
  const parsed = tournamentSchema.safeParse({ name: formData.get("name") });
  if (!idParsed.success) return { error: "Torneo inválido." };
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { error } = await supabase
    .from("tournaments")
    .update({ name: parsed.data.name })
    .eq("id", idParsed.data);
  if (error) return { error: "No se pudo actualizar el torneo." };

  revalidatePath("/admin/torneos");
  return { error: null };
}

export async function toggleRegistrationAction(
  tournamentId: string,
  nextValue: boolean
): Promise<void> {
  await requireAdmin();
  const id = uuidSchema.parse(tournamentId);

  await supabase.from("tournaments").update({ registration_open: nextValue }).eq("id", id);
  revalidatePath("/admin/torneos");
}

export async function setTournamentStatusAction(
  tournamentId: string,
  status: "draft" | "regular" | "finished"
): Promise<void> {
  await requireAdmin();
  const id = uuidSchema.parse(tournamentId);
  // "playoffs" se asigna solo desde /admin/liguilla (F5) al generar el bracket.
  if (status !== "draft" && status !== "regular" && status !== "finished") return;

  await supabase.from("tournaments").update({ status }).eq("id", id);
  revalidatePath("/admin/torneos");
}
