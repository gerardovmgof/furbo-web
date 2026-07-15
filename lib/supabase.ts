import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente con service role: solo se usa en el servidor (Server Actions,
// server components, route handlers). Nunca exponer SUPABASE_SERVICE_ROLE_KEY
// al navegador ni importar este módulo desde un client component.
//
// Se crea de forma perezosa (al primer uso real, no al importar el módulo)
// porque Next.js importa las rutas durante el build para recolectar metadata,
// y ahí las variables de entorno reales todavía no están disponibles.
let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno."
    );
  }

  client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
  return client;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
