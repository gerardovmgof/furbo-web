"use client";

import { useActionState } from "react";
import { setSlotPriceAction, type FormState } from "./actions";

const initialState: FormState = { error: null };

export default function SetSlotPriceForm({
  tournamentId,
  currentPriceCents,
}: {
  tournamentId: string;
  currentPriceCents: number | null;
}) {
  const [state, formAction, pending] = useActionState(setSlotPriceAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="slotPrice">
          Precio por cupo (MXN)
        </label>
        <input
          id="slotPrice"
          name="slotPrice"
          type="number"
          min={0}
          step={0.01}
          defaultValue={currentPriceCents ? (currentPriceCents / 100).toFixed(2) : ""}
          placeholder="0 = deshabilitado"
          onWheel={(e) => e.currentTarget.blur()}
          className="mt-1 w-40 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar precio"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      {state.ok && <p className="w-full text-sm text-emerald-700 dark:text-emerald-400">✅ Precio guardado.</p>}
    </form>
  );
}
