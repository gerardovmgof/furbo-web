export const metadata = {
  title: "Términos y condiciones — Furbo Web",
};

export default function TerminosPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 text-sm leading-relaxed text-zinc-300">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-100">Términos y condiciones de uso</h1>

      <p className="mb-4">
        Estos Términos y Condiciones regulan el uso de &quot;Furbo Web&quot; (la
        &quot;Plataforma&quot;), una herramienta de gestión y publicación de información deportiva
        de ligas de fútbol amateur. Al utilizar la Plataforma aceptas estos términos.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-zinc-100">1. Naturaleza del servicio</h2>
      <p className="mb-4">
        La Plataforma publica información deportiva (tablas de posiciones, goleo, calendarios y
        resultados) y permite a la administración de la liga y a los delegados de equipo gestionar
        registros de jugadores. La Plataforma{" "}
        <strong className="text-zinc-200">
          no procesa pagos ni almacena información bancaria o financiera
        </strong>
        . Cualquier pago relacionado con la liga (inscripciones, registros, arbitrajes) se realiza
        fuera de la Plataforma, directamente con la organización de la liga.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-zinc-100">2. Cuentas de acceso</h2>
      <ul className="mb-4 list-disc pl-6">
        <li>
          Las cuentas de delegado son creadas y entregadas por la administración de la liga. No
          existe registro público de cuentas.
        </li>
        <li>
          <strong className="text-zinc-200">Debes ser mayor de edad</strong> para recibir y usar
          una cuenta de acceso.
        </li>
        <li>
          Eres responsable de mantener la confidencialidad de tu contraseña y de toda actividad
          realizada con tu cuenta. Si sospechas un uso no autorizado, notifícalo de inmediato a la
          administración de la liga para restablecer tu acceso.
        </li>
      </ul>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-zinc-100">3. Registro de jugadores</h2>
      <ul className="mb-4 list-disc pl-6">
        <li>
          El delegado que registra jugadores declara que la información proporcionada es veraz y
          que cuenta con la autorización de cada jugador — o de su madre, padre o tutor en caso de
          menores de edad — para publicar su nombre y dorsal con fines deportivos.
        </li>
        <li>
          El número de jugadores que un equipo puede registrar depende de los registros contratados
          con la administración de la liga.
        </li>
        <li>
          La administración de la liga puede corregir, dar de baja o rechazar registros que
          incumplan el reglamento deportivo de la competencia.
        </li>
      </ul>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-zinc-100">4. Uso aceptable</h2>
      <p className="mb-2">Queda prohibido:</p>
      <ul className="mb-4 list-disc pl-6">
        <li>Intentar acceder a cuentas, paneles o datos ajenos.</li>
        <li>Registrar información falsa, ofensiva o que suplante identidades.</li>
        <li>
          Interferir con el funcionamiento de la Plataforma (ataques, scraping abusivo, intentos de
          vulneración).
        </li>
        <li>Usar la Plataforma para fines distintos a la gestión deportiva de la liga.</li>
      </ul>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-zinc-100">5. Información deportiva</h2>
      <p className="mb-4">
        Los resultados, tablas y estadísticas publicados tienen carácter informativo. La
        administración de la liga es la única facultada para capturar y corregir resultados
        oficiales conforme a su reglamento deportivo. En caso de discrepancia, prevalece la
        decisión de la administración de la liga.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-zinc-100">6. Limitación de responsabilidad</h2>
      <p className="mb-4">
        La Plataforma se proporciona &quot;tal cual&quot;. No garantizamos disponibilidad
        ininterrumpida ni ausencia de errores. En la medida permitida por la ley aplicable, la
        Plataforma y sus desarrolladores no serán responsables por daños derivados del uso o la
        imposibilidad de uso del servicio, ni por decisiones deportivas, administrativas o de
        cualquier otra índole tomadas por la organización de la liga.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-zinc-100">7. Privacidad</h2>
      <p className="mb-4">
        El tratamiento de datos personales se rige por nuestro{" "}
        <a href="/privacidad" className="text-emerald-400 underline hover:text-emerald-300">
          Aviso de Privacidad
        </a>
        .
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-zinc-100">8. Modificaciones</h2>
      <p className="mb-4">
        Estos términos pueden actualizarse; los cambios se publicarán en esta página con la fecha
        de última actualización. El uso continuado de la Plataforma tras un cambio implica su
        aceptación.
      </p>

      <p className="mt-8 text-xs text-zinc-500">Última actualización: julio de 2026.</p>
    </main>
  );
}
