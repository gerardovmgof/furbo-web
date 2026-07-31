import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-6 text-center text-xs text-zinc-500">
      <div className="mb-3 flex justify-center">
        <ThemeToggle />
      </div>
      <nav className="mb-2 flex justify-center gap-4">
        <Link href="/privacidad" className="hover:text-zinc-700 dark:hover:text-zinc-300">
          Aviso de privacidad
        </Link>
        <Link href="/terminos" className="hover:text-zinc-700 dark:hover:text-zinc-300">
          Términos y condiciones
        </Link>
      </nav>
      <p>Furbo Web — gestión de ligas de fútbol amateur.</p>
    </footer>
  );
}
