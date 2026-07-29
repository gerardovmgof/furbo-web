import Link from "next/link";
import { requireOwnedTeam } from "@/lib/auth";
import EquipoTabs from "@/components/EquipoTabs";

export default async function TeamScopedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const { team } = await requireOwnedTeam(teamId);

  return (
    <div>
      <div className="px-4 pt-3">
        <Link href="/equipo" className="text-sm text-emerald-400 underline">
          ← Mis equipos
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-zinc-100">{team.name}</h1>
      </div>
      <EquipoTabs teamId={teamId} />
      <div className="p-4">{children}</div>
    </div>
  );
}
