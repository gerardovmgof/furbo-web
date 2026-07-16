const LINKS = [
  { href: "/admin/torneos", label: "Torneos", desc: "Crear y administrar torneos." },
  { href: "/admin/equipos", label: "Equipos", desc: "Altas, límite de registros, retiros." },
  { href: "/admin/usuarios", label: "Usuarios de equipo", desc: "Crear delegados y resetear contraseñas." },
  { href: "/admin/calendario", label: "Calendario", desc: "Jornadas, partidos y captura de resultados." },
  { href: "/admin/liguilla", label: "Liguilla", desc: "Generar el bracket y capturar los playoffs." },
];

export default function AdminHome() {
  return (
    <main className="mx-auto max-w-2xl py-8">
      <h1 className="text-2xl font-bold">Panel de administración</h1>
      <p className="mt-2 text-zinc-400">
        Da de alta un torneo, sus equipos, y crea un usuario por cada delegado.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition hover:border-emerald-700"
          >
            <p className="font-semibold text-zinc-100">{link.label}</p>
            <p className="mt-1 text-sm text-zinc-400">{link.desc}</p>
          </a>
        ))}
      </div>
    </main>
  );
}
