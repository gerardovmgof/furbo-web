import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 px-4 py-6 text-center text-xs text-zinc-500">
      <nav className="mb-2 flex justify-center gap-4">
        <Link href="/privacidad" className="hover:text-zinc-300">
          Aviso de privacidad
        </Link>
        <Link href="/terminos" className="hover:text-zinc-300">
          Términos y condiciones
        </Link>
        <Link href="/login" className="hover:text-zinc-300">
          Acceso
        </Link>
      </nav>
      <p>Furbo Web — gestión de ligas de fútbol amateur.</p>
    </footer>
  );
}
