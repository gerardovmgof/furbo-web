import PublicTabs from "@/components/PublicTabs";

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-950 text-zinc-100">
      <PublicTabs />
      <div className="flex-1">{children}</div>
    </div>
  );
}
