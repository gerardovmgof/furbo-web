"use client";

import { useState } from "react";

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
  const [count, setCount] = useState(1);

  return (
    // action apunta a un Route Handler (no un Server Action): así el envío
    // es SIEMPRE una navegación real del navegador, sin fetch() de por
    // medio — necesario porque el destino final (tras el POST) es el
    // checkout externo de Mercado Pago, y fetch() no puede seguir un
    // redirect cross-origin.
    <form action={`/equipo/${teamId}/pagos/buy-slots`} method="POST" className="space-y-3">
      <div>
        <p className="font-semibold text-zinc-900 dark:text-zinc-100">Comprar cupos de jugador</p>
        <p className="text-sm text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">{formatMoney(pricePerSlotCents)} por cupo.</p>
      </div>
      <div className="flex items-end gap-3">
        <div>
          <label className="block text-xs text-zinc-400 dark:text-zinc-600 dark:text-zinc-400" htmlFor="slotsCount">
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
            className="mt-1 w-20 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
          />
        </div>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">Total: {formatMoney(count * pricePerSlotCents)}</p>
      </div>
      <button
        type="submit"
        className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-500"
      >
        Pagar con Mercado Pago
      </button>
    </form>
  );
}
