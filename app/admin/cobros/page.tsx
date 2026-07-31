import {
  listTournaments,
  listTeamsByTournament,
  listChargesByTournament,
  teamOwnerUsernames,
} from "@/lib/queries";
import { markChargePaidManuallyAction, cancelChargeAction } from "./actions";
import SetSlotPriceForm from "./SetSlotPriceForm";
import CreateChargeForm from "./CreateChargeForm";
import TournamentSelect from "@/components/TournamentSelect";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  canceled: "Cancelado",
};

function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default async function CobrosPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const tournaments = await listTournaments();

  if (tournaments.length === 0) {
    return (
      <main className="mx-auto max-w-3xl py-8">
        <h1 className="text-2xl font-bold">Cobros</h1>
        <p className="mt-2 text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">
          Primero crea un torneo en{" "}
          <a href="/admin/torneos" className="text-emerald-700 dark:text-emerald-400 underline">
            Torneos
          </a>
          .
        </p>
      </main>
    );
  }

  const selected = tournaments.find((x) => x.id === t) ?? tournaments[0];
  const [teams, charges] = await Promise.all([
    listTeamsByTournament(selected.id),
    listChargesByTournament(selected.id),
  ]);
  const activeTeams = teams.filter((team) => team.status === "active");
  const ownerUsernames = await teamOwnerUsernames(activeTeams.map((team) => team.id));

  return (
    <main className="mx-auto max-w-3xl space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">Cobros</h1>
        <div className="mt-2 flex items-center gap-2">
          <label className="text-sm text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">Torneo:</label>
          <TournamentSelect
            tournaments={tournaments}
            selectedId={selected.id}
            basePath="/admin/cobros"
          />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4">
        <SetSlotPriceForm
          tournamentId={selected.id}
          currentPriceCents={selected.slot_price_cents}
        />
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4">
        <p className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">Crear cargo manual (renta de cancha, etc.)</p>
        <CreateChargeForm
          tournamentId={selected.id}
          teams={activeTeams}
          ownerUsernames={ownerUsernames}
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">Cargos</h2>
        {charges.length === 0 && <p className="text-sm text-zinc-500">Aún no hay cargos.</p>}
        {charges.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4"
          >
            <div>
              <p className="text-zinc-900 dark:text-zinc-100">
                {c.team_name} — {c.concept}
              </p>
              <p className="text-sm text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">
                {formatMoney(c.amount_cents)} · {STATUS_LABEL[c.status]}
                {c.paid_via && ` · ${c.paid_via === "manual" ? "pago manual" : "Mercado Pago"}`}
              </p>
            </div>
            {c.status === "pending" && (
              <div className="flex gap-2">
                <form action={markChargePaidManuallyAction.bind(null, c.id)}>
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500"
                  >
                    Marcar pagado
                  </button>
                </form>
                <form action={cancelChargeAction.bind(null, c.id)}>
                  <button
                    type="submit"
                    className="rounded-lg border border-red-300 dark:border-red-900 px-3 py-1.5 text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    Cancelar
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
