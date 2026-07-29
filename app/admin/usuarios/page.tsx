import { listActiveTeamsWithTournament, listTeamUsers, listReferees } from "@/lib/queries";
import CreateUserForm from "./CreateUserForm";
import ResetPasswordForm from "./ResetPasswordForm";
import EditTeamUserForm from "./EditTeamUserForm";

export default async function UsuariosPage() {
  const [teams, users, referees] = await Promise.all([
    listActiveTeamsWithTournament(),
    listTeamUsers(),
    listReferees(),
  ]);

  return (
    <main className="mx-auto max-w-3xl space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Crea un usuario y contraseña por equipo o por árbitro. Entrégaselos a la persona
          correspondiente.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <CreateUserForm teams={teams} />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Dueños de equipo
        </h2>
        {users.length === 0 && <p className="text-sm text-zinc-500">Aún no hay dueños de equipo.</p>}
        {users.map((u) => (
          <div key={u.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-zinc-100">{u.username}</p>
                <p className="text-sm text-zinc-400">
                  {u.team_name} · {u.tournament_name}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <EditTeamUserForm
                  userId={u.id}
                  currentUsername={u.username}
                  currentTeamId={u.team_id ?? ""}
                  teams={teams}
                />
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
