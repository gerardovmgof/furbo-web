"use client";

import { useRouter } from "next/navigation";
import type { TournamentRow } from "@/lib/types";

export default function TournamentSelect({
  tournaments,
  selectedId,
  basePath,
}: {
  tournaments: TournamentRow[];
  selectedId: string;
  basePath: string;
}) {
  const router = useRouter();

  return (
    <select
      value={selectedId}
      onChange={(e) => router.push(`${basePath}?t=${e.target.value}`)}
      className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
    >
      {tournaments.map((tour) => (
        <option key={tour.id} value={tour.id}>
          {tour.name}
        </option>
      ))}
    </select>
  );
}
