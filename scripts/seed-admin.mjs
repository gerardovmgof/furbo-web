// Siembra el PRIMER usuario admin. Uso:
//
//   SEED_ADMIN_USERNAME=admin SEED_ADMIN_PASSWORD='una-contraseña-larga' npm run seed:admin
//
// - Lee NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY de .env.local
// - Se niega a correr si ya existe un admin (idempotente)
// - La contraseña NUNCA se guarda en el repo ni en texto plano en la DB
//   (tip: antepon un espacio al comando para que no quede en el historial de shell)

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// Carga manual de .env.local (sin dependencia de dotenv)
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const username = process.env.SEED_ADMIN_USERNAME?.trim().toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD;

if (!url || !key) {
  console.error("❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (revisa .env.local).");
  process.exit(1);
}
if (!username || !password) {
  console.error(
    "❌ Uso: SEED_ADMIN_USERNAME=admin SEED_ADMIN_PASSWORD='contraseña' npm run seed:admin"
  );
  process.exit(1);
}
if (password.length < 10) {
  console.error("❌ La contraseña debe tener al menos 10 caracteres.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { count, error: countError } = await supabase
  .from("users")
  .select("id", { count: "exact", head: true })
  .eq("role", "admin");

if (countError) {
  console.error("❌ Error consultando la base de datos:", countError.message);
  process.exit(1);
}
if ((count ?? 0) > 0) {
  console.error("❌ Ya existe un usuario admin. Este script solo siembra el primero.");
  console.error("   Para más admins o resets de contraseña, usa el panel /admin/usuarios.");
  process.exit(1);
}

const password_hash = await bcrypt.hash(password, 12);
const { error } = await supabase
  .from("users")
  .insert({ username, password_hash, role: "admin", team_id: null });

if (error) {
  console.error("❌ Error insertando el admin:", error.message);
  process.exit(1);
}

console.log(`✅ Admin "${username}" creado. Ya puedes entrar en /login.`);
