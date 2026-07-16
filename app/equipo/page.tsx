export default function TeamHome() {
  return (
    <main className="mx-auto max-w-2xl py-8">
      <h1 className="text-2xl font-bold">Mi equipo</h1>
      <p className="mt-2 text-zinc-400">
        Registra a tus jugadores en{" "}
        <a href="/equipo/plantilla" className="text-emerald-400 underline">
          Plantilla
        </a>
        . Tus partidos y estadísticas se irán habilitando en las siguientes fases.
      </p>
    </main>
  );
}
