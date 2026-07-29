import { listTeamUsers, listReferees } from "@/lib/queries";
import CreateUserForm from "./CreateUserForm";
import ResetPasswordForm from "./ResetPasswordForm";
import EditTeamUserForm from "./EditTeamUserForm";

export default async function UsuariosPage() {
  const [owners, referees] = await Promise.all([listTeamUsers(), listReferees()]);

  return (
    <main className="mx-auto max-w-3xl space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Crea un usuario y contraseña por dueño de equipo o por árbitro. Entrégaselos a la
          persona correspondiente — el dueño registra su(s) propio(s) equipo(s) al iniciar sesión.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <CreateUserForm />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Dueños de equipo
        </h2>
        {owners.length === 0 && <p className="text-sm text-zinc-500">Aún no hay dueños de equipo.</p>}
        {owners.map((u) => (
          <div key={u.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-zinc-100">{u.username}</p>
                <p className="text-sm text-zinc-400">
                  {u.teams.length === 0
                    ? "Sin equipos todavía"
                    : u.teams.map((t) => `${t.name} (${t.tournament_name})`).join(", ")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <EditTeamUserForm userId={u.id} currentUsername={u.username} />
                <ResetPasswordForm userId={u.id} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Árbitros</h2>
        {referees.length === 0 && <p className="text-sm text-zinc-500">Aún no hay árbitros.</p>}
        {referees.map((r) => (
          <div key={r.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="font-semibold text-zinc-100">{r.username}</p>
              <ResetPasswordForm userId={r.id} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
