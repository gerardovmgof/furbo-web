"use client";

import { useActionState } from "react";
import { loginAction, type LoginFormState } from "./actions";

const initialState: LoginFormState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-white dark:bg-zinc-950 px-4 text-zinc-900 dark:text-zinc-100">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-8 shadow-xl"
      >
        <div className="mb-6 text-center">
          <span className="text-4xl">⚽</span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Furbo Web</h1>
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">Acceso para administradores y equipos</p>
        </div>

        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="username">
          Usuario
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className="mt-1 mb-4 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
        />

        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 mb-6 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
        />

        {state.error && (
          <p className="mb-4 rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
