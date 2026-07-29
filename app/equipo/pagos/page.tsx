import { requireTeamUser } from "@/lib/auth";
import { getTeam, getTournament, listChargesByTeam } from "@/lib/queries";
import { payChargeAction } from "@/lib/actions/payments";
import BuySlotsForm from "./BuySlotsForm";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  canceled: "Cancelado",
};

function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default async function PagosPage({
  searchParams,
}: {
  searchParams: Promise<{ resultado?: string }>;
}) {
  const user = await requireTeamUser();
  const { resultado } = await searchParams;
  const team = await getTeam(user.team_id);

  if (!team) {
    return (
      <main className="mx-auto max-w-2xl py-8">
        <p className="text-zinc-400">No se encontró tu equipo.</p>
      </main>
    );
  }

  const [tournament, charges] = await Promise.all([
    getTournament(team.tournament_id),
    listChargesByTeam(team.id),
  ]);

  const pending = charges.filter((c) => c.status === "pending");
  const history = charges.filter((c) => c.status !== "pending");

  return (
    <main className="mx-auto max-w-2xl space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">Pagos</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {team.name} · límite actual: {team.player_limit} jugadores
        </p>
      </div>

      {resultado === "ok" && (
        <p className="rounded-lg border border-emerald-900 bg-emerald-950 px-3 py-2 text-sm text-emerald-300">
          Pago en proceso. Si Mercado Pago ya lo confirmó, tu límite de jugadores se actualiza en
          unos segundos.
        </p>
      )}
      {resultado === "error" && (
        <p className="rounded-lg border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-300">
          No se pudo completar el pago. Intenta de nuevo.
        </p>
      )}
      {resultado === "pendiente" && (
        <p className="rounded-lg border border-amber-900 bg-amber-950 px-3 py-2 text-sm text-amber-300">
          Tu pago está pendiente de confirmación por Mercado Pago.
        </p>
      )}

      {tournament?.slot_price_cents ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <BuySlotsForm pricePerSlotCents={tournament.slot_price_cents} />
        </div>
      ) : (
        <p className="text-sm text-zinc-500">La compra de cupos no está habilitada por el momento.</p>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Cargos pendientes
        </h2>
        {pending.length === 0 && (
          <p className="text-sm text-zinc-500">No tienes cargos pendientes.</p>
        )}
        {pending.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
          >
            <div>
              <p className="text-zinc-100">{c.concept}</p>
              <p className="text-sm text-zinc-400">{formatMoney(c.amount_cents)}</p>
            </div>
            <form action={payChargeAction.bind(null, c.id)}>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Pagar
              </button>
            </form>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Historial</h2>
        {history.length === 0 && <p className="text-sm text-zinc-500">Sin pagos registrados.</p>}
        {history.map((c) => (
          <div key={c.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-zinc-100">{c.concept}</p>
            <p className="text-sm text-zinc-400">
              {formatMoney(c.amount_cents)} · {STATUS_LABEL[c.status]}
              {c.paid_via && ` · ${c.paid_via === "manual" ? "pago manual" : "Mercado Pago"}`}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
