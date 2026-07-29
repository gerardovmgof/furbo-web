"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  createTeamUserSchema,
  createRefereeSchema,
  resetPasswordSchema,
  editTeamUserSchema,
} from "@/lib/validation";

export interface FormState {
  error: string | null;
  ok?: boolean;
}

export async function editTeamUserAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = editTeamUserSchema.safeParse({
    userId: formData.get("userId"),
    teamId: formData.get("teamId"),
    username: formData.get("username"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { error } = await supabase
    .from("users")
    .update({
      username: parsed.data.username.trim().toLowerCase(),
      team_id: parsed.data.teamId,
    })
    .eq("id", parsed.data.userId);
  if (error) {
    const message =
      error.code === "23505" ? "Ese nombre de usuario ya existe." : "No se pudo actualizar el delegado.";
    return { error: message };
  }

  revalidatePath("/admin/usuarios");
  return { error: null, ok: true };
}

export async function createTeamUserAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = createTeamUserSchema.safeParse({
    teamId: formData.get("teamId"),
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const password_hash = await hashPassword(parsed.data.password);
  const { error } = await supabase.from("users").insert({
    username: parsed.data.username.trim().toLowerCase(),
    password_hash,
    role: "team",
    team_id: parsed.data.teamId,
  });
  if (error) {
    const message =
      error.code === "23505" ? "Ese nombre de usuario ya existe." : "No se pudo crear el usuario.";
    return { error: message };
  }

  revalidatePath("/admin/usuarios");
  return { error: null, ok: true };
}

export async function createRefereeAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = createRefereeSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const password_hash = await hashPassword(parsed.data.password);
  const { error } = await supabase.from("users").insert({
    username: parsed.data.username.trim().toLowerCase(),
    password_hash,
    role: "referee",
    team_id: null,
  });
  if (error) {
    const message =
      error.code === "23505" ? "Ese nombre de usuario ya existe." : "No se pudo crear el árbitro.";
    return { error: message };
  }

  revalidatePath("/admin/usuarios");
  return { error: null, ok: true };
}

export async function resetTeamUserPasswordAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = resetPasswordSchema.safeParse({
    userId: formData.get("userId"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const password_hash = await hashPassword(parsed.data.password);
  // RPC atómica: cambia el hash Y bumpea token_version en la misma sentencia,
  // matando cualquier sesión vigente robada con la contraseña anterior.
  const { error } = await supabase.rpc("reset_user_password", {
    p_user_id: parsed.data.userId,
    p_password_hash: password_hash,
  });
  if (error) return { error: "No se pudo restablecer la contraseña." };

  revalidatePath("/admin/usuarios");
  return { error: null, ok: true };
}
