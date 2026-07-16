import { listActiveTeamsWithTournament, listTeamUsers } from "@/lib/queries";
import CreateUserForm from "./CreateUserForm";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function UsuariosPage() {
  const [teams, users] = await Promise.all([listActiveTeamsWithTournament(), listTeamUsers()]);

  return (
    <main className="mx-auto max-w-3xl space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">Usuarios de equipo</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Crea un usuario y contraseña por equipo. Entrégaselos a su delegado — con eso podrá
          registrar a sus jugadores.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <CreateUserForm teams={teams} />
      </div>

      <div className="space-y-3">
        {users.length === 0 && <p className="text-sm text-zinc-500">Aún no hay delegados.</p>}
        {users.map((u) => (
          <div key={u.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-zinc-100">{u.username}</p>
                <p className="text-sm text-zinc-400">
                  {u.team_name} · {u.tournament_name}
                </p>
              </div>
              <ResetPasswordForm userId={u.id} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
