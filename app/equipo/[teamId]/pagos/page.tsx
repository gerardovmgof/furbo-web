import { requireOwnedTeam } from "@/lib/auth";
import { getTournament, listChargesByTeam } from "@/lib/queries";
import { payChargeAction } from "@/lib/actions/payments";
import { SKIP_MERCADOPAGO_FOR_TESTING } from "@/lib/paymentsTestMode";
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
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ resultado?: string }>;
}) {
  const { teamId } = await params;
  const { team } = await requireOwnedTeam(teamId);
  const { resultado } = await searchParams;

  const [tournament, charges] = await Promise.all([
    getTournament(team.tournament_id),
    listChargesByTeam(team.id),
  ]);

  const pending = charges.filter((c) => c.status === "pending");
  const history = charges.filter((c) => c.status !== "pending");

  return (
    <main className="mx-auto max-w-2xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Pagos</h2>
        <p className="mt-1 text-sm text-zinc-400">
          {team.name} · límite actual: {team.player_limit} jugadores
        </p>
      </div>

      {SKIP_MERCADOPAGO_FOR_TESTING && (
        <p className="rounded-lg border border-amber-900 bg-amber-950 px-3 py-2 text-sm text-amber-300">
          🧪 Modo de prueba: los pagos se marcan como aprobados de inmediato, sin pasar por
          Mercado Pago.
        </p>
      )}

      {resultado === "ok" && (
        <p className="rounded-lg border border-emerald-900 bg-emerald-950 px-3 py-2 text-sm text-emerald-300">
          {SKIP_MERCADOPAGO_FOR_TESTING
            ? "Pago aprobado (modo de prueba). Tu límite de jugadores ya se actualizó."
            : "Pago en proceso. Si Mercado Pago ya lo confirmó, tu límite de jugadores se actualiza en unos segundos."}
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
          <BuySlotsForm teamId={team.id} pricePerSlotCents={tournament.slot_price_cents} />
        </div>
      ) : (
        <p className="text-sm text-zinc-500">La compra de cupos no está habilitada por el momento.</p>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Cargos pendientes
        </h3>
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
            <form action={payChargeAction.bind(null, team.id, c.id)}>
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
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Historial</h3>
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
