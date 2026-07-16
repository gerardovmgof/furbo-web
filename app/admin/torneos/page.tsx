import { listTournaments } from "@/lib/queries";
import { toggleRegistrationAction, setTournamentStatusAction } from "./actions";
import CreateTournamentForm from "./CreateTournamentForm";
import EditTournamentForm from "./EditTournamentForm";

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  regular: "Fase regular",
  playoffs: "Liguilla",
  finished: "Finalizado",
};

export default async function TorneosPage() {
  const tournaments = await listTournaments();

  return (
    <main className="mx-auto max-w-3xl space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">Torneos</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Da de alta un torneo antes de registrar equipos.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <CreateTournamentForm />
      </div>

      <div className="space-y-3">
        {tournaments.length === 0 && (
          <p className="text-sm text-zinc-500">Aún no hay torneos.</p>
        )}
        {tournaments.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-zinc-100">{t.name}</p>
                <p className="text-sm text-zinc-400">
                  {STATUS_LABEL[t.status]} ·{" "}
                  {t.registration_open ? "Registro abierto" : "Registro cerrado"}
                </p>
              </div>
              <a
                href={`/admin/equipos?t=${t.id}`}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
              >
                Ver equipos →
              </a>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <EditTournamentForm tournamentId={t.id} currentName={t.name} />
              <form
                action={toggleRegistrationAction.bind(null, t.id, !t.registration_open)}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
                >
                  {t.registration_open ? "Cerrar registro" : "Abrir registro"}
                </button>
              </form>

              {t.status === "draft" && (
                <form action={setTournamentStatusAction.bind(null, t.id, "regular")}>
                  <button
                    type="submit"
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
                  >
                    Iniciar fase regular
                  </button>
                </form>
              )}
              {t.status === "regular" && (
                <form action={setTournamentStatusAction.bind(null, t.id, "draft")}>
                  <button
                    type="submit"
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
                  >
                    Regresar a borrador
                  </button>
                </form>
              )}
              {(t.status === "regular" || t.status === "draft") && (
                <form action={setTournamentStatusAction.bind(null, t.id, "finished")}>
                  <button
                    type="submit"
                    className="rounded-lg border border-red-900 px-3 py-1.5 text-sm text-red-300 hover:bg-red-950"
                  >
                    Finalizar
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
