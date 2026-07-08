<script setup>
import { ref } from "vue";

const secciones = [
  { id: "intro", label: "Qué es BeOne" },
  { id: "roles", label: "Roles y permisos" },
  { id: "cotizaciones", label: "Cotizaciones" },
  { id: "precios", label: "Precios y comisiones" },
  { id: "sedes", label: "Sedes / Unidades de Ejecución" },
  { id: "administracion", label: "Administración financiera" },
  { id: "reportes", label: "Reportes" },
  { id: "operativa", label: "Operativa y logística" },
  { id: "desafios", label: "Desafíos comerciales" },
  { id: "ejecutivos-cuenta", label: "Ejecutivos de Cuenta" },
  { id: "configuracion", label: "Configuración del sistema" },
  { id: "notificaciones", label: "Notificaciones automáticas" },
];

const activo = ref("intro");

const irA = (id) => {
  activo.value = id;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};
</script>

<template>
  <div class="doc-page">

    <div class="doc-header">
      <h1 class="doc-title">Documentación del sistema</h1>
      <p class="doc-subtitle">
        Guía de referencia para administradores: qué hace cada módulo de BeOne y cómo encajan entre sí.
      </p>
    </div>

    <div class="doc-layout">

      <!-- ═══ NAV ═══ -->
      <nav class="doc-nav">
        <button
          v-for="s in secciones"
          :key="s.id"
          type="button"
          class="doc-nav-item"
          :class="{ 'doc-nav-item--active': activo === s.id }"
          @click="irA(s.id)"
        >
          {{ s.label }}
        </button>
      </nav>

      <!-- ═══ CONTENIDO ═══ -->
      <div class="doc-content">

        <!-- ───────────────────────────────────────────── -->
        <section id="intro" class="doc-section">
          <h2 class="doc-h2">🧭 Qué es BeOne</h2>
          <div class="doc-card">
            <p>
              BeOne centraliza todo el proceso de un evento: desde que se cotiza, pasando por su aprobación,
              ejecución en campo y cobro, hasta los reportes que miden cómo va el negocio. Conecta cuatro áreas
              que antes vivían separadas (o en Excel): <strong>ventas</strong> (cotizaciones y comisiones),
              <strong>administración</strong> (facturación y cobros), <strong>operación</strong> (logística en
              terreno) y <strong>dirección</strong> (reportes y control).
            </p>
            <p>
              La idea de esta página es que cualquier administrador —sin tener que leer código ni preguntarle a
              un desarrollador— entienda <em>qué hace cada módulo y para qué sirve</em>. Está organizada por
              tema; usa el menú de la izquierda para saltar directo a lo que necesitas.
            </p>
          </div>
        </section>

        <!-- ───────────────────────────────────────────── -->
        <section id="roles" class="doc-section">
          <h2 class="doc-h2">👥 Roles y permisos</h2>
          <div class="doc-card">
            <p>
              Cada usuario tiene uno o más roles, y el rol determina qué puede ver y hacer en el sistema.
            </p>
            <table class="doc-table">
              <thead>
                <tr><th>Rol</th><th>Para qué está pensado</th></tr>
              </thead>
              <tbody>
                <tr><td><strong>ADMIN</strong></td><td>Super-usuario técnico. Tiene acceso a absolutamente todo, sin excepción — incluida la "Zona peligrosa". Es el único rol que nunca se puede bloquear desde "Acceso a vistas por rol".</td></tr>
                <tr><td><strong>ADMINISTRADOR</strong></td><td>Administra el negocio: valida cotizaciones, gestiona facturación/cobros, ve casi todos los reportes.</td></tr>
                <tr><td><strong>DIRECCION</strong></td><td>Visión gerencial — reportes financieros y de desempeño, sin gestionar el detalle operativo del día a día.</td></tr>
                <tr><td><strong>LIDER</strong></td><td>Lidera comercialmente: crea y aprueba cotizaciones, gestiona parámetros de precios, ve reportes de su equipo.</td></tr>
                <tr><td><strong>SUPERVISOR</strong></td><td>Supervisa operación y equipo comercial — incluye la gestión de Desafíos Comerciales de sus vendedores.</td></tr>
                <tr><td><strong>COORDINADOR</strong></td><td>Coordina cotizaciones y la logística de eventos ya confirmados (montajes, check-ins, materiales).</td></tr>
                <tr><td><strong>EJECUTIVO</strong></td><td>Mismo nivel de acceso que COORDINADOR: crea y ve sus propias cotizaciones, clientes y productos.</td></tr>
                <tr><td><strong>EJECUTIVO_CUENTA</strong></td><td>Mismo nivel de acceso que COORDINADOR; además es el rol pensado para monitorearse en "Ejecutivos de Cuenta" desde el panel de su líder.</td></tr>
                <tr><td><strong>LOGISTICO</strong></td><td>Ejecuta la operación en terreno: check-ins, montajes, registro de turnos.</td></tr>
                <tr><td><strong>OPERATIVO</strong></td><td>Personal de campo con acceso operativo básico.</td></tr>
              </tbody>
            </table>
            <p>
              Un usuario puede tener varios roles a la vez. El acceso real a cada pantalla se puede ajustar sin
              tocar código desde <strong>Configuración → Acceso a vistas por rol</strong>: ahí un ADMIN decide,
              vista por vista, qué otros roles la ven en el menú.
            </p>
          </div>
        </section>

        <!-- ───────────────────────────────────────────── -->
        <section id="cotizaciones" class="doc-section">
          <h2 class="doc-h2">📄 Cotizaciones</h2>
          <div class="doc-card">
            <h3 class="doc-h3">Cómo se arma una cotización</h3>
            <p>
              Se capturan los datos del evento (cliente, fechas de montaje/evento/desmontaje, región, vigencia
              de la oferta) y se le asignan tres <strong>responsables</strong>: comercial, administrativo y
              operativo — cada uno dueño de una etapa distinta del proceso. Luego se agregan productos: pueden
              ser <strong>propios</strong> (del inventario de BeOne) y/o de <strong>terceros</strong> (catálogo
              de proveedores externos); ambos tipos conviven en la misma cotización.
            </p>
            <p>
              Cada cotización recibe un número consecutivo (ej. <code>105-2026</code>). El piso desde el que
              arranca ese consecutivo cada año se configura en <strong>Configuración → Configuración general</strong>.
              También se pueden agregar <strong>colaboradores</strong>: usuarios internos con acceso a esa
              cotización puntual, además del creador y los administradores (que siempre ven todo).
            </p>

            <h3 class="doc-h3">Estados</h3>
            <ul class="doc-list">
              <li><strong>Pendiente</strong> — recién creada o en negociación con el cliente.</li>
              <li><strong>Aprobada</strong> — el cliente confirmó. Dispara la notificación de "Evento confirmado" y entra al flujo operativo.</li>
              <li><strong>Rechazada</strong> — el cliente no aceptó; queda cerrada.</li>
              <li><strong>Vencida</strong> — se marca sola cuando una Pendiente supera los días de "vigencia" indicados sin aprobarse ni rechazarse.</li>
            </ul>

            <h3 class="doc-h3">Bloqueo temporal de 7 días</h3>
            <p>
              Mientras una cotización está Pendiente, sus equipos quedan reservados preventivamente por 7 días
              para que ningún otro comercial los ofrezca al mismo tiempo a otro cliente. Pasado ese plazo, el
              bloqueo deja de aplicar y esos equipos vuelven a estar disponibles si la negociación no avanzó.
            </p>

            <h3 class="doc-h3">Versiones</h3>
            <p>
              Cada cambio importante guarda una "fotografía" completa de la cotización como una nueva versión.
              Esto permite ver el historial de cambios y <strong>restaurar</strong> una versión anterior si algo
              salió mal o el cliente pidió volver a una propuesta previa — restaurar también queda registrado,
              así nunca se pierde el rastro.
            </p>

            <h3 class="doc-h3">Reservas y buffers logísticos</h3>
            <p>
              Al reservar equipo físico para un evento, el sistema agrega automáticamente un margen de seguridad
              para evitar choques de agenda entre eventos consecutivos: <strong>4 horas</strong> si el evento
              anterior y el siguiente son en la misma ciudad, <strong>12 horas</strong> si son en ciudades
              distintas (por el tiempo de transporte). Si otro evento ya reservó el equipo dentro de esa
              ventana, el sistema no deja hacer la nueva reserva y avisa qué productos no están disponibles.
            </p>
          </div>
        </section>

        <!-- ───────────────────────────────────────────── -->
        <section id="precios" class="doc-section">
          <h2 class="doc-h2">💵 Precios y comisiones</h2>
          <div class="doc-card">
            <p>
              El precio de venta de un producto de <strong>tercero</strong> se calcula a partir de su costo más
              varios márgenes (descuento de negociación, margen base del negocio, y el margen comercial que
              ingresa el vendedor). Los productos <strong>propios</strong> no se recalculan de precio —tienen su
              propio valor de venta ya definido en el catálogo—, pero sí participan del cálculo de comisión.
            </p>
            <h3 class="doc-h3">Una sola comisión por cotización, no por producto</h3>
            <p>
              El sistema no calcula una comisión distinta para cada producto. En su lugar, mezcla TODOS los
              ítems de la cotización (propios y de terceros) en un único <strong>"margen equivalente"</strong>:
              un promedio ponderado por costo entre el margen real de cada ítem de tercero y un margen fijo de
              referencia para los ítems propios. Con ese único número se busca en una tabla de tramos el
              porcentaje de comisión aplicable a <strong>toda</strong> la cotización.
            </p>
            <p>
              Hay dos tablas de tramos, configurables en <strong>Configuración → Parámetros de cotización</strong>:
            </p>
            <ul class="doc-list">
              <li><strong>Comisión visible</strong> — la que ve el vendedor, se le paga a él.</li>
              <li><strong>Comisión estructural</strong> — uso interno de administración, nunca se muestra al vendedor. La diferencia entre estructural y visible se llama <strong>reserva</strong>.</li>
            </ul>
            <h3 class="doc-h3">Utilidad</h3>
            <p>
              La utilidad de una cotización es lo que queda después de restar el costo y la comisión visible del
              total vendido. El <strong>Cuadro de costos</strong> (ver Reportes) permite registrar gastos
              imprevistos del evento (transporte extra, daños, personal adicional) que se descuentan de esa
              utilidad interna — nunca cambian el precio ni el total que ve el cliente.
            </p>
            <p>
              El detalle completo de comisiones por producto (con filtros por vendedor, sede, fecha y estado, y
              exportación a CSV) está disponible en <strong>Configuración → Comisiones</strong>.
            </p>
          </div>
        </section>

        <!-- ───────────────────────────────────────────── -->
        <section id="sedes" class="doc-section">
          <h2 class="doc-h2">🏢 Sedes / Unidades de Ejecución</h2>
          <div class="doc-card">
            <p>
              Una "sede" (Unidad de Ejecución) representa un equipo o región del negocio (ej. "Bogotá",
              "Medellín"), con su propio líder y ubicación. Sirve para <strong>aislar información financiera</strong>
              entre equipos: por defecto, un usuario asignado a una sede solo ve las cotizaciones de esa sede
              (o donde lo hayan agregado como colaborador puntual).
            </p>
            <p>
              Los usuarios <strong>ADMIN, ADMINISTRADOR o DIRECCION sin sede asignada</strong> ven todas las
              cotizaciones sin restricción — es el modo "vista general" para quienes dirigen toda la operación.
              La estructura completa de sedes, con su organigrama visual, se administra en
              <strong>Configuración → Unidades de Ejecución</strong>.
            </p>
          </div>
        </section>

        <!-- ───────────────────────────────────────────── -->
        <section id="administracion" class="doc-section">
          <h2 class="doc-h2">🧾 Administración financiera</h2>
          <div class="doc-card">
            <h3 class="doc-h3">Validación administrativa (VAL ADM)</h3>
            <p>
              Es un "sello de aprobado" que Administración pone sobre un evento después de revisar que su
              información financiera y operativa está en orden. Al activarlo se notifica automáticamente a los
              responsables comercial y operativo. Se gestiona desde <strong>Administración → Cotizaciones</strong>.
            </p>
            <h3 class="doc-h3">Documentos financieros por cotización</h3>
            <p>El ciclo típico del dinero con el cliente sigue este orden:</p>
            <ul class="doc-list">
              <li><strong>Orden de Compra del cliente</strong> — el documento que el cliente envía autorizando la compra.</li>
              <li><strong>Factura BeOne</strong> — la factura que la empresa emite por el evento (notifica al comercial al crearse).</li>
              <li><strong>Pagos</strong> — cada abono del cliente (Anticipo, Parcial o Total). Si el pago cubre lo facturado, la cotización se marca "Pagada" sola.</li>
            </ul>
            <h3 class="doc-h3">Estados administrativos y operativos</h3>
            <p>
              El <strong>estado administrativo</strong> sigue el ciclo de cobro (Cotizado → Por Facturar → OC
              Pendiente → Facturada → ... → <strong>Pagada</strong> o <strong>Anulada</strong>). El
              <strong>estado operativo</strong> es más simple: RESERVA, EN CURSO, EJECUTADO — sigue la fase de
              ejecución en terreno.
            </p>
            <h3 class="doc-h3">Reportes de esta área</h3>
            <p>
              <strong>Cuentas por cobrar</strong> (qué eventos aprobados aún no se han pagado),
              <strong>Movimientos</strong> (bitácora de ingresos por pagos y egresos por órdenes de compra a
              proveedores) y el <strong>Dashboard Financiero</strong> (KPIs mensuales: facturado, pagado,
              cotizado, tasa de cierre, balance neto) — todos en el menú Administración.
            </p>
          </div>
        </section>

        <!-- ───────────────────────────────────────────── -->
        <section id="reportes" class="doc-section">
          <h2 class="doc-h2">📊 Reportes</h2>
          <div class="doc-card">
            <ul class="doc-list">
              <li><strong>Reporte Financiero</strong> — ¿cómo va el negocio en ventas este mes/año? KPIs, evolución mensual, top productos, cotizaciones por agente.</li>
              <li><strong>Cuadro de costos (Reporte General)</strong> — gastos imprevistos que surgieron durante los eventos (transporte extra, daños, personal adicional), y quién no ha subido el comprobante.</li>
              <li><strong>Reporte Operacional</strong> — cuánto costó y cuántas horas trabajó el personal logístico en cada evento (alimentado por Registro de Turno).</li>
              <li><strong>AdminReportes</strong> — agrupa Cuentas por cobrar, Desempeño por ejecutivo (conversión de cada vendedor), Historial por cliente y Reporte por período — todos exportables a CSV.</li>
            </ul>
            <p>
              Estos reportes están restringidos a <strong>ADMINISTRADOR y DIRECCION</strong> (más ADMIN, que
              siempre tiene acceso total).
            </p>
          </div>
        </section>

        <!-- ───────────────────────────────────────────── -->
        <section id="operativa" class="doc-section">
          <h2 class="doc-h2">🚚 Operativa y logística</h2>
          <div class="doc-card">
            <ul class="doc-list">
              <li><strong>Check-ins</strong> — registro de llegada al evento con el equipo, checklist de seguridad, fotos y observaciones. Deja evidencia formal de las condiciones de inicio del servicio.</li>
              <li><strong>Montajes</strong> — checklist de armado: por cada producto de la cotización se marca "completado" a medida que se instala, con barra de progreso por evento.</li>
              <li><strong>Registro de Turno</strong> — hora de entrada/salida del personal asignado a un evento, con su tarifa; alimenta directamente el Reporte Operacional.</li>
              <li><strong>Checklist de evento</strong> — control detallado por producto (no uno general), solo para los ítems marcados como "requiere checklist" al armar la cotización. Se llena vía un enlace público en sitio.</li>
              <li><strong>Inventario</strong> — control físico de cada equipo: disponibilidad (Disponible / En reserva / No disponible) y condición (Operativo OK / En mantenimiento / Defectuoso, etc.), con bitácora de cada cambio y escaneo QR para inventarios rápidos.</li>
              <li><strong>Asignación de Equipos</strong> — asigna personal (no productos) a los eventos confirmados; es la base del roster que luego usa Registro de Turno.</li>
            </ul>
          </div>
        </section>

        <!-- ───────────────────────────────────────────── -->
        <section id="desafios" class="doc-section">
          <h2 class="doc-h2">🎯 Desafíos comerciales</h2>
          <div class="doc-card">
            <p>
              Un desafío comercial es una meta o incentivo que un líder o supervisor le asigna a un miembro de
              su equipo, con una comisión en dinero como premio si se cumple. Puede asignarse a cualquier
              subordinado directo, sin importar su rol. Hay cuatro tipos:
            </p>
            <ul class="doc-list">
              <li><strong>Cierre de trato</strong> — ligado a una cotización puntual; se marca cumplido solo, automáticamente, en cuanto esa cotización pasa a Aprobada.</li>
              <li><strong>Meta de cierres múltiples</strong> — cerrar N cotizaciones antes de una fecha límite (progreso = cantidad de cotizaciones Aprobadas en el periodo).</li>
              <li><strong>Meta de ingresos ($)</strong> — un monto objetivo en pesos a cerrar antes de una fecha límite (ej. "cerrar $40.000.000"); el progreso suma el total de las cotizaciones Aprobadas del periodo, en vez de contarlas. Es la meta que alimenta la barra de progreso en "Ejecutivos de Cuenta".</li>
              <li><strong>Tarea de evento</strong> — una tarea manual sin meta numérica, se marca cumplida/no cumplida a mano.</li>
            </ul>
            <p>
              La comisión puede ser un <strong>monto fijo</strong> o un <strong>porcentaje</strong> sobre el
              valor del negocio. Cada desafío cumplido queda marcado como "ganado", y quien lo asignó puede
              alternarlo a "pagado" cuando corresponda, registrando la fecha de pago. El tablero de cada
              líder/supervisor muestra, por persona, su tasa de cumplimiento y cuánta comisión sigue pendiente
              de pago.
            </p>
          </div>
        </section>

        <!-- ───────────────────────────────────────────── -->
        <section id="ejecutivos-cuenta" class="doc-section">
          <h2 class="doc-h2">📈 Ejecutivos de Cuenta</h2>
          <div class="doc-card">
            <p>
              Pantalla de monitoreo para que un líder (o ADMIN/DIRECCION a nivel de toda la organización) le
              haga seguimiento a su equipo comercial: meta de ingresos, embudo de cotizaciones, ganancias y
              pérdidas, y una bitácora de evaluación — todo desde un solo lugar, con un selector arriba para
              cambiar de ejecutivo (por defecto siempre se muestra uno, no queda la pantalla vacía).
            </p>

            <h3 class="doc-h3">Quién aparece</h3>
            <p>
              A diferencia de otras pantallas, esto no depende del organigrama (<code>parentId</code>) sino del
              <strong>rol</strong>: cualquier usuario con rol <code>EJECUTIVO</code> o
              <code>EJECUTIVO_CUENTA</code> es candidato a aparecer. ADMIN y DIRECCION ven a todos los que
              tengan ese rol en toda la organización; un LIDER solo ve a los que además sean su subordinado
              directo.
            </p>

            <h3 class="doc-h3">Meta de ingresos y barra de progreso</h3>
            <p>
              Reutiliza el tipo <strong>Meta de ingresos ($)</strong> de Desafíos Comerciales (ver sección
              anterior). La barra de progreso, arriba de todo, muestra cuánto se ha logrado, el porcentaje, y
              cuánto falta para llegar a la meta — se actualiza sola a medida que se aprueban cotizaciones del
              ejecutivo dentro del periodo de la meta.
            </p>

            <h3 class="doc-h3">Embudo de cotizaciones</h3>
            <ul class="doc-list">
              <li><strong>En proceso</strong> — la cotización sigue Pendiente.</li>
              <li><strong>En ejecución</strong> — está Aprobada y la fecha de hoy cae dentro de la ventana operativa del evento (montaje–desmontaje).</li>
              <li><strong>Cerrada</strong> — está Aprobada y el evento ya terminó (la ventana operativa ya pasó).</li>
              <li><strong>Perdida</strong> — fue Rechazada, o su estado administrativo quedó Anulada/EV Cancelado.</li>
            </ul>
            <p>
              Las <strong>ganancias</strong> mostradas suman la utilidad neta de las cotizaciones Cerradas y En
              ejecución; las <strong>pérdidas</strong> suman el valor cotizado (no la utilidad) de las
              Perdidas — es el negocio que no se concretó.
            </p>

            <h3 class="doc-h3">Gráfico y cotizaciones</h3>
            <p>
              El gráfico de área muestra el cierre acumulado día a día durante el periodo de la meta activa (o
              el mes en curso si no hay meta). Debajo, cada cotización se lista con su valor, si tuvo
              descuento, y el detalle línea por línea de los productos cotizados —propios y de terceros, cada
              uno con su etiqueta ("Propio"/"Tercero"), cantidad, precio unitario, descuento y una vista previa
              ampliada de la imagen al pasar el mouse por encima—, paginadas de a 5 y exportables a CSV.
            </p>

            <h3 class="doc-h3">Bitácora de evaluación</h3>
            <p>
              Comentarios de seguimiento que el líder deja sobre un ejecutivo puntual — solo se pueden agregar
              y consultar, no editar ni borrar —, para llevar un historial de evaluación a lo largo del tiempo.
            </p>
          </div>
        </section>

        <!-- ───────────────────────────────────────────── -->
        <section id="configuracion" class="doc-section">
          <h2 class="doc-h2">⚙️ Configuración del sistema</h2>
          <div class="doc-card">
            <ul class="doc-list">
              <li><strong>Configuración general</strong> — número inicial de las cotizaciones de cada año.</li>
              <li><strong>Encabezado del PDF</strong> — logo, logos de certificaciones y datos de contacto que aparecen en el PDF de cotización.</li>
              <li><strong>Banner del Dashboard</strong> — imagen y mensaje motivacional del panel de inicio.</li>
              <li><strong>Importación masiva</strong> — cargar clientes, productos o proveedores desde Excel de una sola vez.</li>
              <li><strong>Acceso a vistas por rol</strong> — decide qué roles ven cada pantalla del menú (ADMIN siempre tiene acceso, no se puede quitar).</li>
              <li><strong>Unidades de Ejecución</strong> — administración de sedes y su organigrama (ver sección "Sedes" arriba).</li>
              <li><strong>Parámetros de cotización</strong> — IVA, márgenes base, utilidad mínima objetivo, y las tablas de comisión visible/estructural (ver sección "Precios y comisiones").</li>
              <li><strong>Comisiones</strong> — reporte detallado por producto, con filtros y exportación (ver sección "Precios y comisiones").</li>
              <li><strong>Zona peligrosa</strong> (solo ADMIN) — descargar backup completo de la base de datos y archivos, o purgar permanentemente todos los productos. La purga queda bloqueada hasta hacer un backup primero, y pide una frase de confirmación.</li>
            </ul>
          </div>
        </section>

        <!-- ───────────────────────────────────────────── -->
        <section id="notificaciones" class="doc-section">
          <h2 class="doc-h2">✉️ Notificaciones automáticas</h2>
          <div class="doc-card">
            <p>El sistema envía estos correos automáticamente, sin que nadie tenga que redactarlos a mano:</p>
            <table class="doc-table">
              <thead><tr><th>Evento</th><th>Cuándo se dispara</th><th>A quién llega</th></tr></thead>
              <tbody>
                <tr><td>Evento confirmado</td><td>La cotización pasa a Aprobada</td><td>Responsables + cliente</td></tr>
                <tr><td>Resumen del lunes</td><td>Cada lunes 7:00 a.m.</td><td>Responsables de eventos de los próximos 8 días + Admin/Supervisor/Coordinador/Ejecutivo/Ejecutivo de Cuenta/Logístico</td></tr>
                <tr><td>Despacho de camión</td><td>Se marca como despachado</td><td>Responsable operativo</td></tr>
                <tr><td>Listas de chequeo OK</td><td>Se verifica el listado de materiales</td><td>Responsable operativo</td></tr>
                <tr><td>Evento finalizado</td><td>Se marca el evento como finalizado</td><td>Los tres responsables</td></tr>
                <tr><td>Validado por Admin</td><td>Se activa la validación administrativa</td><td>Responsables comercial y operativo</td></tr>
                <tr><td>Factura emitida</td><td>Se registra una factura</td><td>Responsable comercial</td></tr>
                <tr><td>Pago registrado</td><td>Se registra un pago</td><td>Responsable comercial</td></tr>
                <tr><td>Bienvenida</td><td>Se crea un usuario nuevo</td><td>El usuario nuevo (con sus credenciales)</td></tr>
                <tr><td>OC recibida</td><td>Una orden de compra a proveedor pasa a "Recibida"</td><td>Admin/Administrador/Dirección</td></tr>
                <tr><td>Reporte de personal</td><td>Bajo demanda, desde Registro de Turno</td><td>El correo que se indique</td></tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  </div>
</template>

<style scoped>
.doc-page { width: 100%; }

.doc-header { margin-bottom: 24px; }

.doc-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-1, #0F1A2E);
  margin: 0 0 4px;
  line-height: 1.2;
}

.doc-subtitle {
  font-size: 13px;
  color: var(--text-3, #94A3B8);
  font-family: 'Inter', sans-serif;
  margin: 0;
}

.doc-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  align-items: start;
}

@media (min-width: 900px) {
  .doc-layout { grid-template-columns: 220px 1fr; }
}

.doc-nav {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6px;
  position: static;
}

@media (min-width: 900px) {
  .doc-nav {
    flex-direction: column;
    position: sticky;
    top: 16px;
  }
}

.doc-nav-item {
  text-align: left;
  padding: 8px 12px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--text-3, #94A3B8);
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  white-space: nowrap;
}

.doc-nav-item:hover { background: #F8FAFC; color: var(--text-1, #0F1A2E); }

.doc-nav-item--active {
  background: rgba(39,200,216,0.1);
  color: var(--primary, #27C8D8);
  font-weight: 700;
}

.doc-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

.doc-section { scroll-margin-top: 16px; }

.doc-h2 {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-1, #0F1A2E);
  margin: 0 0 10px;
}

.doc-h3 {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-1, #0F1A2E);
  margin: 16px 0 6px;
}

.doc-h3:first-child { margin-top: 0; }

.doc-card {
  background: #fff;
  border-radius: 14px;
  padding: 20px 22px;
  box-shadow: 0 1px 4px rgba(39,200,216,.06);
}

.doc-card p {
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--text-2, #475569);
  font-family: 'Inter', sans-serif;
  margin: 0 0 10px;
}

.doc-card p:last-child { margin-bottom: 0; }

.doc-card strong { color: var(--text-1, #0F1A2E); }

.doc-card code {
  background: #F1F5F9;
  padding: 1px 6px;
  border-radius: 6px;
  font-size: 12.5px;
}

.doc-list {
  margin: 0 0 10px;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.doc-list li {
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--text-2, #475569);
  font-family: 'Inter', sans-serif;
}

.doc-list li strong { color: var(--text-1, #0F1A2E); }

.doc-table {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
  font-size: 12.5px;
  font-family: 'Inter', sans-serif;
}

.doc-table th, .doc-table td {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid #EEF2F7;
  color: var(--text-2, #475569);
  vertical-align: top;
}

.doc-table th {
  color: var(--text-3, #94A3B8);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 10.5px;
  letter-spacing: 0.4px;
}

.doc-table tr:last-child td { border-bottom: none; }
</style>
