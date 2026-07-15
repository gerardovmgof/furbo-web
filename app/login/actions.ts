"use server";

import { redirect } from "next/navigation";
import { login, logout } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export interface LoginFormState {
  error: string | null;
}

export async function loginAction(
  _prev: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const result = await login(parsed.data.username, parsed.data.password);
  if (!result.ok) {
    return { error: result.error };
  }

  // El destino depende del rol; se ignora ?next para no redirigir a un panel ajeno.
  redirect(result.role === "admin" ? "/admin" : "/equipo");
}

export async function logoutAction(): Promise<void> {
  await logout();
  redirect("/login");
}
