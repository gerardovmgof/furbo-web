import { requireOwnedTeam } from "@/lib/auth";
import { getTournament, listActivePlayersByTeam } from "@/lib/queries";
import { deactivatePlayerAction } from "./actions";
import AddPlayerForm from "./AddPlayerForm";

export const dynamic = "force-dynamic";

export default async function PlantillaPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const { team } = await requireOwnedTeam(teamId);

  const [tournament, players] = await Promise.all([
    getTournament(team.tournament_id),
    listActivePlayersByTeam(team.id),
  ]);

  const full = players.length >= team.player_limit;
  const closed = !tournament?.registration_open || team.status !== "active";
  const disabled = full || closed;

  // El mensaje genérico ("ya registraste a todos... o el registro está
  // cerrado") no le decía al dueño CUÁL de los dos era, y "0/0" en
  // particular se veía como un error en vez de "todavía no compras cupos".
  // Se distingue el motivo para que sepa si el problema se arregla en Pagos.
  let disabledMessage: string | null = null;
  let showPagosLink = false;
  if (team.status !== "active") {
    disabledMessage = "Tu equipo no está activo en este torneo en este momento.";
  } else if (!tournament?.registration_open) {
    disabledMessage = "El registro de jugadores está cerrado por el momento.";
  } else if (team.player_limit === 0) {
    disabledMessage = "Tu equipo todavía no tiene cupos comprados.";
    showPagosLink = true;
  } else if (full) {
    disabledMessage = `Ya registraste a los ${team.player_limit} jugadores permitidos. Si necesitas más, compra cupos adicionales.`;
    showPagosLink = true;
  }

  return (
    <main className="mx-auto max-w-2xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Plantilla — {team.name}</h2>
        <p className="mt-1 text-sm text-zinc-400">
          {players.length}/{team.player_limit} jugadores registrados
          {team.status !== "active" && " · equipo retirado"}
          {tournament && !tournament.registration_open && " · registro cerrado"}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <AddPlayerForm
          teamId={team.id}
          disabled={disabled}
          disabledMessage={disabledMessage}
          showPagosLink={showPagosLink}
        />
      </div>

      <div className="space-y-2">
        {players.length === 0 && (
          <p className="text-sm text-zinc-500">Aún no has registrado jugadores.</p>
        )}
        {players.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
          >
            <p className="text-zinc-100">
              <span className="mr-2 inline-block w-8 text-center font-mono text-zinc-400">
                #{p.jersey_number}
              </span>
              {p.name}
            </p>
            <form action={deactivatePlayerAction.bind(null, team.id, p.id)}>
              <button
                type="submit"
                className="rounded-lg border border-red-900 px-3 py-1 text-sm text-red-300 hover:bg-red-950"
              >
                Dar de baja
              </button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}
