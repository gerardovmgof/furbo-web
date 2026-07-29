"use client";

import { useActionState, useState } from "react";
import { buySlotsAction, type FormState } from "@/lib/actions/payments";

const initialState: FormState = { error: null };

function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default function BuySlotsForm({
  teamId,
  pricePerSlotCents,
}: {
  teamId: string;
  pricePerSlotCents: number;
}) {
  const [state, formAction, pending] = useActionState(
    buySlotsAction.bind(null, teamId),
    initialState
  );
  const [count, setCount] = useState(1);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <p className="font-semibold text-zinc-100">Comprar cupos de jugador</p>
        <p className="text-sm text-zinc-400">{formatMoney(pricePerSlotCents)} por cupo.</p>
      </div>
      <div className="flex items-end gap-3">
        <div>
          <label className="block text-xs text-zinc-400" htmlFor="slotsCount">
            Cantidad
          </label>
          <input
            id="slotsCount"
            name="slotsCount"
            type="number"
            min={1}
            max={99}
            value={count}
            onChange={(e) => setCount(Number(e.target.value) || 1)}
            className="mt-1 w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-500"
          />
        </div>
        <p className="text-sm text-zinc-300">Total: {formatMoney(count * pricePerSlotCents)}</p>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Redirigiendo…" : "Pagar con Mercado Pago"}
      </button>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
