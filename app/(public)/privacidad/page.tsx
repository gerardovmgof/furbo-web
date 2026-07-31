export const metadata = {
  title: "Aviso de privacidad — Furbo Web",
};

export default function PrivacidadPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Aviso de privacidad</h1>

      <p className="mb-4">
        En cumplimiento de la Ley Federal de Protección de Datos Personales en Posesión de los
        Particulares (LFPDPPP) y su Reglamento, se emite el presente Aviso de Privacidad de
        &quot;Furbo Web&quot;, plataforma de gestión de ligas de fútbol amateur (en adelante, la
        &quot;Plataforma&quot;).
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-zinc-900 dark:text-zinc-100">1. Responsable del tratamiento</h2>
      <p className="mb-4">
        El responsable del tratamiento de tus datos personales es la organización de la liga que
        administra esta Plataforma (el &quot;Responsable&quot;). Puedes contactar al Responsable a
        través de los medios de contacto oficiales de la liga.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-zinc-900 dark:text-zinc-100">2. Datos personales que recabamos</h2>
      <p className="mb-2">La Plataforma recaba únicamente los datos mínimos necesarios:</p>
      <ul className="mb-4 list-disc pl-6">
        <li>
          <strong className="text-zinc-800 dark:text-zinc-200">Delegados de equipo:</strong> nombre de usuario asignado
          por la administración de la liga.
        </li>
        <li>
          <strong className="text-zinc-800 dark:text-zinc-200">Jugadores:</strong> nombre y número de camiseta
          (dorsal), registrados por el delegado de su equipo.
        </li>
        <li>
          <strong className="text-zinc-800 dark:text-zinc-200">Datos técnicos:</strong> dirección IP en los intentos de
          inicio de sesión, exclusivamente con fines de seguridad.
        </li>
        <li>
          <strong className="text-zinc-800 dark:text-zinc-200">Registros de pago:</strong> cuando un equipo compra
          registros de jugador o paga un cargo de renta de cancha, guardamos el monto, el concepto
          y si Mercado Pago confirmó el pago. La Plataforma{" "}
          <strong className="text-zinc-800 dark:text-zinc-200">nunca recibe ni almacena</strong> el número de tarjeta
          ni ningún otro dato bancario — esa información la captura directamente Mercado Pago.
        </li>
      </ul>
      <p className="mb-4">
        La Plataforma <strong className="text-zinc-800 dark:text-zinc-200">no recaba ni almacena</strong> números de
        tarjeta u otros datos bancarios, domicilios, fechas de nacimiento ni datos sensibles.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-zinc-900 dark:text-zinc-100">3. Finalidades del tratamiento</h2>
      <ul className="mb-4 list-disc pl-6">
        <li>Gestionar el registro de equipos y jugadores en los torneos de la liga.</li>
        <li>
          Publicar información deportiva de la competencia: tablas de posiciones, tabla de goleo,
          calendarios, resultados y estadísticas.
        </li>
        <li>Administrar los accesos de delegados y de la administración de la liga.</li>
        <li>Proteger la seguridad de la Plataforma (prevención de accesos no autorizados).</li>
      </ul>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-zinc-900 dark:text-zinc-100">4. Menores de edad</h2>
      <p className="mb-4">
        Las cuentas de acceso a la Plataforma solo se otorgan a personas mayores de edad. Cuando un
        equipo registra jugadores menores de edad, el delegado que realiza el registro declara
        contar con el consentimiento de la madre, padre o tutor del menor para la publicación de su
        nombre y dorsal con las finalidades deportivas descritas. Si eres tutor de un menor y
        deseas que su información sea eliminada, contacta al Responsable.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-zinc-900 dark:text-zinc-100">5. Transferencias</h2>
      <p className="mb-4">
        No vendemos ni compartimos tus datos personales con terceros con fines publicitarios o
        comerciales. Para operar, la Plataforma utiliza proveedores de infraestructura (alojamiento
        web y base de datos) que actúan como encargados del tratamiento y almacenan la información
        de forma segura. Para procesar pagos, compartimos el monto y el concepto del cargo con{" "}
        <strong className="text-zinc-800 dark:text-zinc-200">Mercado Pago</strong> — nunca datos de tarjeta, que
        Mercado Pago captura directamente en su propio checkout.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-zinc-900 dark:text-zinc-100">6. Derechos ARCO</h2>
      <p className="mb-4">
        Tienes derecho a Acceder, Rectificar y Cancelar tus datos personales, así como a Oponerte a
        su tratamiento (derechos ARCO). Para ejercerlos, presenta tu solicitud al Responsable a
        través de los medios de contacto oficiales de la liga, indicando tu nombre, la relación con
        los datos (jugador, delegado o tutor) y el derecho que deseas ejercer. El Responsable dará
        respuesta en los plazos que marca la LFPDPPP.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-zinc-900 dark:text-zinc-100">7. Cookies</h2>
      <p className="mb-4">
        La Plataforma utiliza únicamente una cookie técnica esencial de sesión para mantener el
        inicio de sesión de administradores y delegados. No utilizamos cookies de publicidad,
        análisis ni rastreo de terceros.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-zinc-900 dark:text-zinc-100">8. Cambios a este aviso</h2>
      <p className="mb-4">
        Cualquier modificación a este Aviso de Privacidad se publicará en esta misma página,
        indicando la fecha de su última actualización.
      </p>

      <p className="mt-8 text-xs text-zinc-500">Última actualización: julio de 2026.</p>
    </main>
  );
}
