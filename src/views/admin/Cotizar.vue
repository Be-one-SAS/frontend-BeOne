<template>
  <div class="cot-page">

    <!-- ════════════════════════════════════════════════════════
         HEADER — QuotationNextNumber + botones de versión
    ════════════════════════════════════════════════════════ -->
    <div class="cot-header">
      <QuotationNextNumber />

      <!-- Botones de versión — solo si hay ID en la URL (lógica original) -->
      <div v-if="id" class="header-actions">
        <span class="ver-chip">v{{ cotizacion.version }}</span>
        <div class="btn-group">
          <button
            :class="['action-btn', modoEdicion ? 'action-btn--cancel' : 'action-btn--edit']"
            @click="modoEdicion = !modoEdicion"
          >
            {{ modoEdicion ? 'Cancelar edición' : 'Editar' }}
          </button>
          <button
            class="action-btn action-btn--save"
            @click="guardarEdicion"
            :disabled="!modoEdicion"
          >
            Guardar edición
          </button>
          <button
            :class="['action-btn', modoEdicion ? 'action-btn--edit' : 'action-btn--primary']"
            @click="guardarNuevaVersion"
          >
            Generar nueva versión
          </button>
        </div>
      </div>

      <!-- Botón limpiar formulario — solo en modo nuevo -->
      <div v-else class="header-actions">
        <button class="btn-clear-draft" @click="showConfirmClear = true">
          <Trash2 :size="14" />
          Limpiar formulario
        </button>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════
         BANNER — Draft guardado
    ════════════════════════════════════════════════════════ -->
    <Transition name="banner-slide">
      <div v-if="hasDraft && !id" class="draft-banner" role="alert">
        <div class="draft-banner-icon">
          <Clock :size="16" />
        </div>
        <div class="draft-banner-text">
          <strong>Tienes una cotización en progreso</strong>
          <span>Tus datos del formulario fueron recuperados automáticamente.</span>
        </div>
        <div class="draft-banner-actions">
          <button class="draft-btn-discard" @click="showConfirmClear = true">
            Descartar
          </button>
          <button class="draft-btn-continue" @click="dismissBanner">
            Continuar
          </button>
        </div>
      </div>
    </Transition>

    <!-- ════════════════════════════════════════════════════════
         STEPPER HORIZONTAL
    ════════════════════════════════════════════════════════ -->
    <div class="stepper-wrap">
      <!-- Desktop: steps completos -->
      <div class="stepper">
        <template v-for="(paso, i) in pasos" :key="paso.num">
          <button
            class="step-item"
            :class="{
              'step-active':  pasoActual === paso.num,
              'step-done':    pasoActual >  paso.num,
              'step-pending': pasoActual <  paso.num,
            }"
            @click="irAPaso(paso.num)"
          >
            <div class="step-bubble">
              <Check v-if="pasoActual > paso.num" :size="13" />
              <span v-else>{{ paso.num }}</span>
            </div>
            <span class="step-label">{{ paso.label }}</span>
          </button>
          <div
            v-if="i < pasos.length - 1"
            class="step-connector"
            :class="{ 'connector-done': pasoActual > paso.num }"
          ></div>
        </template>
      </div>

      <!-- Mobile: "Paso N de 4 · Nombre" -->
      <p class="step-mobile-label">
        Paso {{ pasoActual }} de 4 · <strong>{{ pasos[pasoActual - 1]?.label }}</strong>
      </p>

      <!-- Progress bar animada (width: 25% × paso activo) -->
      <div class="prog-track">
        <div class="prog-fill" :style="`width: ${(pasoActual / 4) * 100}%`"></div>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════
         CONTENIDO DE PASOS — Transition slide-fade
    ════════════════════════════════════════════════════════ -->
    <Transition name="slide-fade" mode="out-in">
      <div :key="pasoActual" class="step-pane">

        <!-- ╔══════════════════════════════════════════════╗
             ║  PASO 1 — Cliente y Comercial               ║
             ╚══════════════════════════════════════════════╝ -->
        <template v-if="pasoActual === 1">

          <!-- Card: Datos del Cliente -->
          <div class="form-card">
            <div class="section-header">
              <User :size="18" class="icon-primary" />
              <span>Datos del Cliente</span>
            </div>
            <div class="g2">
              <InputLabel label="Fecha de Cotización" v-model="cotizacion.fechaCotizacion" type="text" />
              <ClientsSelector v-model="cotizacion.cliente" v-model:dataClient="myClienteSeleccionado" />
              <ClienteFinalSelector v-model="cotizacion.empresa" v-model:dataClient="clienteSeleccionado" />
              <InputLabel label="Contacto" v-model="cotizacion.contacto" />
              <InputLabel label="Correo" v-model="cotizacion.correo" type="email" />
              <InputLabel label="Celular" v-model="cotizacion.celular" />
            </div>
          </div>

          <!-- Card: Datos Comerciales -->
          <div class="form-card">
            <div class="section-header">
              <Briefcase :size="18" class="icon-primary" />
              <span>Datos Comerciales</span>
            </div>
            <div class="g3">
              <InputLabel label="Agente Comercial" v-model="cotizacion.agenteComercial" />
              <div class="field-wrap">
                <label class="field-lbl">Unidad de Ejecución</label>
                <select v-model="cotizacion.unidadEjecucion" class="field-sel">
                  <option>Antioquia</option>
                  <option>Cundinamarca</option>
                  <option>Colombia</option>
                  <option>Israel</option>
                </select>
              </div>
              <InputLabel label="Vigencia de Cotización" v-model="cotizacion.vigencia" />
            </div>
          </div>

        </template>

        <!-- ╔══════════════════════════════════════════════╗
             ║  PASO 2 — Detalles del Evento               ║
             ╚══════════════════════════════════════════════╝ -->
        <template v-else-if="pasoActual === 2">

          <!-- Card: Información General -->
          <div class="form-card">
            <div class="section-header">
              <MapPin :size="18" class="icon-primary" />
              <span>Información General</span>
            </div>
            <div class="g3">
              <InputLabel label="Nombre descriptivo del evento" v-model="cotizacion.description" />
              <InputLabel label="Ubicación del Evento" v-model="cotizacion.ubicacion" />
              <MapSelector v-model="cotizacion.linkMaps" />
              <InputLabel label="Número de Asistentes" v-model="cotizacion.asistentes" type="number" />
              <div class="field-wrap">
                <label class="field-lbl">Tipo de Suelo</label>
                <select v-model="cotizacion.tipoSuelo" class="field-sel">
                  <option>Zona Cesped</option>
                  <option>Zona Dura</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Card: Calendario del Evento -->
          <div class="form-card">
            <div class="section-header">
              <CalendarDays :size="18" class="icon-primary" />
              <span>Calendario del Evento</span>
              <span v-if="duracionEvento" class="dur-badge">Duración: {{ duracionEvento }}</span>
            </div>
            <div class="g4">
              <InputLabel label="Fecha Inicio Evento"      v-model="cotizacion.fechaInicioEvento" type="date" />
              <InputLabel label="Horario de Inicio"        v-model="cotizacion.horarioInicio"     type="time" />
              <InputLabel label="Fecha Fin Evento"         v-model="cotizacion.fechaFinEvento"    type="date" />
              <InputLabel label="Horario de Finalización"  v-model="cotizacion.horarioFin"        type="time" />
            </div>
          </div>

          <!-- Card: Operación y Montaje -->
          <div class="form-card">
            <div class="section-header">
              <Settings :size="18" class="icon-primary" />
              <span>Operación y Montaje</span>
              <span v-if="duracionMontaje" class="dur-badge">Duración: {{ duracionMontaje }}</span>
            </div>
            <div class="g4">
              <InputLabel label="Fecha Inicio Montaje"    v-model="cotizacion.fechaInicioMontaje"    type="date" />
              <InputLabel label="Hora de Montaje"         v-model="cotizacion.horarioInicioMontaje"  type="time" />
              <InputLabel label="Fecha Inicio Desmontaje" v-model="cotizacion.fechaFinMontaje"       type="date" />
              <InputLabel label="Horario de Desmontaje"   v-model="cotizacion.horarioFinMontaje"     type="time" />
            </div>
          </div>

        </template>

        <!-- ╔══════════════════════════════════════════════╗
             ║  PASO 3 — Selección de Equipos              ║
             ╚══════════════════════════════════════════════╝ -->
        <template v-else-if="pasoActual === 3">

          <!-- Encabezado del paso 3 -->
          <div class="form-card step3-intro-card">
            <div class="step3-intro">
              <div class="step3-num-badge">
                <span>3</span>
              </div>
              <div class="step3-intro-text">
                <h2 class="step3-title">Selección de Equipos</h2>
                <p class="step3-desc">Busca y agrega los equipos que formarán parte de esta cotización. Configura cantidades y jornadas por cada ítem antes de continuar.</p>
              </div>
            </div>
          </div>

          <div class="equip-layout">

            <!-- Panel izquierdo (60%) — Buscador -->
            <div class="search-col">
              <div class="form-card">
                <div class="section-header">
                  <Search :size="18" class="icon-primary" />
                  <span>Buscar Equipos</span>
                </div>

                <!-- Inputs de búsqueda -->
                <div class="g2 mb16">

                  <!-- Seleccionar producto — abre el modal con buscador integrado -->
                  <div>
                    <label class="field-lbl">Seleccionar Producto</label>
                    <button
                      type="button"
                      class="picker-btn"
                      @click="cargarProductos(); mostrarLista = true"
                    >
                      <Search :size="14" class="s-ico" />
                      <span class="picker-btn-text">
                        {{ selectedProduct?.dispositivo || selectedProduct?.nombre || 'Buscar y seleccionar producto…' }}
                      </span>
                    </button>
                    <ProductPickerModal
                      :show="mostrarLista"
                      :productos="productosFiltrados"
                      @close="mostrarLista = false"
                      @select="seleccionarProducto"
                    />
                  </div>

                  <!-- Filtrar por categoría (lógica original intacta) -->
                  <div class="rel">
                    <label class="field-lbl">Filtrar por categoría</label>
                    <div class="search-wrap">
                      <Search :size="14" class="s-ico" />
                      <input
                        type="text"
                        v-model="searchCategoria"
                        @input="filtrarCategorias"
                        @focus="mostrarListaFilter = true"
                        placeholder="Buscar categoría..."
                        class="s-input"
                      />
                    </div>
                    <ul v-if="mostrarListaFilter && categoriasFiltradas.length" class="cat-list">
                      <li
                        v-for="cat in categoriasFiltradas"
                        :key="cat"
                        @mousedown.prevent="seleccionarCategoria(cat)"
                        class="cat-opt"
                      >{{ cat }}</li>
                    </ul>
                  </div>

                </div>

                <!-- BarraInfo (lógica original intacta) -->
                <BarraInfo
                  :motores="selectedProduct.qMotores"
                  :amperios="selectedProduct.amperios"
                  :precio="productPrice"
                />

                <!-- Cantidades + botones (lógica original intacta) -->
                <div class="add-row">
                  <div class="qty-field">
                    <label class="field-lbl">Q de Jornada</label>
                    <input
                      v-model="cotizacion.cantidadJornada"
                      type="number"
                      min="0"
                      class="qty-input"
                    />
                  </div>
                  <div class="qty-field">
                    <label class="field-lbl">Q de Producto</label>
                    <input
                      v-model="cotizacion.cantidadProducto"
                      type="number"
                      min="0"
                      class="qty-input"
                    />
                  </div>
                  <button @click="abrirModal" class="btn-tercero">
                    <Package :size="14" />
                    Tercero
                  </button>
                  <button
                    @click="addProduct"
                    :class="['btn-add', { 'btn-add--edit': modoEdicion }]"
                  >
                    Agregar
                  </button>
                </div>

              </div>
            </div>

            <!-- Panel derecho sticky (40%) — Carrito en tiempo real -->
            <div class="cart-col">
              <div class="form-card cart-card">
                <div class="section-header">
                  <ShoppingCart :size="18" class="icon-primary" />
                  <span>Equipos seleccionados</span>
                  <span class="item-count-badge">{{ items.length }}</span>
                </div>

                <!-- Estado vacío -->
                <div v-if="!items.length" class="cart-empty">
                  <Package :size="40" class="empty-ico" />
                  <p class="empty-title">Sin equipos agregados</p>
                  <p class="empty-sub">Busca y agrega equipos en el panel izquierdo</p>
                </div>

                <!-- Lista de items — usa el array `items` existente -->
                <div v-else class="cart-items">
                  <div v-for="(it, i) in items" :key="i" class="cart-row">
                    <p class="cart-name">{{ it.dispositivo || it.descripcion }}</p>
                    <div class="cart-meta">
                      <span class="cart-qty">{{ it.cantidadJornada }}j × {{ it.cantidadProducto }}u</span>
                      <span class="cart-price">${{ (it.unitPrice || 0).toLocaleString('es-CO') }}</span>
                    </div>
                  </div>
                </div>

                <!-- Total parcial -->
                <div v-if="items.length" class="cart-total">
                  <span class="total-lbl">Total parcial</span>
                  <span class="total-val">${{ (totalSummary.valorTotal || 0).toLocaleString('es-CO') }}</span>
                </div>
              </div>
            </div>

          </div>

          <!-- Detalle de productos (debajo de los paneles, lógica original intacta) -->
          <div class="mt20">
            <div class="section-header-standalone mb12">
              <Package :size="18" class="icon-primary" />
              <span>Detalle de productos</span>
            </div>
            <QuotationProductsCardList
              :items="items"
              @edit="abrirModalEdicion"
              linkFoto="https://placehold.co/600x400/f3f4f6/1f2937?text=Imagen+del+Producto"
              @delete="eliminarItem"
            />
          </div>

          <!-- Productos de Terceros -->
          <div class="mt20">
            <div class="section-header-standalone mb12">
              <Truck :size="18" class="icon-primary" />
              <span>Productos de Terceros</span>
              <span v-if="itemsTerceros.length" class="item-count-badge">{{ itemsTerceros.length }}</span>
              <button
                type="button"
                class="btn-add-tercero"
                @click="abrirModalTerceroQuotation"
              >
                <Plus :size="13" />
                Agregar producto tercero
              </button>
            </div>

            <!-- Tabla vacía -->
            <div v-if="!itemsTerceros.length" class="tercero-empty">
              <Truck :size="32" class="tercero-empty-ico" />
              <p>Sin productos de terceros agregados</p>
            </div>

            <!-- Tabla de terceros -->
            <div v-else class="table-wrap">
              <table class="eq-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Costo</th>
                    <th>Margen %</th>
                    <th>Precio unit.</th>
                    <th>Total factura</th>
                    <th>Utilidad final</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(it, i) in itemsTerceros" :key="i">
                    <td class="td-name">{{ it.nombre }}</td>
                    <td>{{ it.cantidad }}</td>
                    <td>{{ formatCOP(it.costo) }}</td>
                    <td>{{ it.margen }}%</td>
                    <td>{{ formatCOP(it.precioUnitario ?? it.precioUnitarioConIva ?? null) }}</td>
                    <td class="td-total">{{ formatCOP(it.totalFactura ?? null) }}</td>
                    <td>{{ formatCOP(it.utilidadFinal ?? it.utilidadNeta ?? null) }}</td>
                    <td>
                      <button class="btn-del-tercero" @click="eliminarItemTercero(i)" title="Eliminar">
                        <Trash2 :size="13" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </template>

        <!-- ╔══════════════════════════════════════════════╗
             ║  PASO 4 — Resumen y Generación              ║
             ╚══════════════════════════════════════════════╝ -->
        <template v-else-if="pasoActual === 4">

          <div class="resumen-layout">

            <!-- Columna izquierda (60%) -->
            <div class="resumen-main">

              <!-- Resumen de datos del cliente (modo lectura) -->
              <div class="form-card">
                <div class="section-header">
                  <User :size="18" class="icon-primary" />
                  <span>Resumen del Cliente</span>
                </div>
                <dl class="summ-list">
                  <div class="summ-row"><dt>Fecha cotización</dt>       <dd>{{ cotizacion.fechaCotizacion    || '—' }}</dd></div>
                  <div class="summ-row"><dt>Cliente</dt>                 <dd>{{ cotizacion.cliente            || '—' }}</dd></div>
                  <div class="summ-row"><dt>Empresa / Cliente final</dt> <dd>{{ cotizacion.empresa            || '—' }}</dd></div>
                  <div class="summ-row"><dt>Contacto</dt>                <dd>{{ cotizacion.contacto           || '—' }}</dd></div>
                  <div class="summ-row"><dt>Correo</dt>                  <dd>{{ cotizacion.correo             || '—' }}</dd></div>
                  <div class="summ-row"><dt>Celular</dt>                 <dd>{{ cotizacion.celular            || '—' }}</dd></div>
                  <div class="summ-row"><dt>Agente comercial</dt>        <dd>{{ cotizacion.agenteComercial    || '—' }}</dd></div>
                  <div class="summ-row"><dt>Unidad de ejecución</dt>     <dd>{{ cotizacion.unidadEjecucion    || '—' }}</dd></div>
                  <div class="summ-row"><dt>Vigencia</dt>                <dd>{{ cotizacion.vigencia           || '—' }}</dd></div>
                  <div class="summ-row"><dt>Evento</dt>                  <dd>{{ cotizacion.description        || '—' }}</dd></div>
                  <div class="summ-row"><dt>Ubicación</dt>               <dd>{{ cotizacion.ubicacion          || '—' }}</dd></div>
                  <div class="summ-row"><dt>Período del evento</dt>
                    <dd>{{ cotizacion.fechaInicioEvento || '—' }} → {{ cotizacion.fechaFinEvento || '—' }}</dd>
                  </div>
                  <div class="summ-row"><dt>Tipo de suelo</dt>           <dd>{{ cotizacion.tipoSuelo          || '—' }}</dd></div>
                </dl>
              </div>

              <!-- Tabla compacta de equipos seleccionados -->
              <div class="form-card" v-if="items.length">
                <div class="section-header">
                  <Package :size="18" class="icon-primary" />
                  <span>Equipos seleccionados</span>
                  <span class="item-count-badge">{{ items.length }}</span>
                </div>
                <div class="table-wrap">
                  <table class="eq-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Jornadas</th>
                        <th>Cantidad</th>
                        <th>Precio unit.</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(it, i) in items" :key="i">
                        <td class="td-name">{{ it.dispositivo || it.descripcion }}</td>
                        <td>{{ it.cantidadJornada }}</td>
                        <td>{{ it.cantidadProducto }}</td>
                        <td>{{ formatCOP(it.unitPrice) }}</td>
                        <td class="td-total">
                          {{ formatCOP((it.unitPrice || 0) * (it.cantidadJornada || 0) * (it.cantidadProducto || 0)) }}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr class="eq-subtotal-row">
                        <td colspan="4" class="eq-subtotal-label">Subtotal equipos propios</td>
                        <td class="eq-subtotal-val">{{ formatCOP(subtotalPropios) }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <!-- Tabla compacta de productos de terceros -->
              <div class="form-card" v-if="itemsTerceros.length">
                <div class="section-header">
                  <Truck :size="18" class="icon-primary" />
                  <span>Productos de Terceros</span>
                  <span class="item-count-badge">{{ itemsTerceros.length }}</span>
                </div>
                <div class="table-wrap">
                  <table class="eq-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cant.</th>
                        <th>Precio unit.</th>
                        <th>Total factura</th>
                        <th>Utilidad final</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(it, i) in itemsTerceros" :key="i">
                        <td class="td-name">{{ it.nombre }}</td>
                        <td>{{ it.cantidad }}</td>
                        <td>{{ formatCOP(it.precioUnitario ?? it.precioUnitarioConIva ?? null) }}</td>
                        <td class="td-total">{{ formatCOP(it.totalFactura ?? null) }}</td>
                        <td>{{ formatCOP(it.utilidadFinal ?? it.utilidadNeta ?? null) }}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr class="eq-subtotal-row">
                        <td colspan="3" class="eq-subtotal-label">Subtotal productos terceros</td>
                        <td class="eq-subtotal-val">{{ formatCOP(subtotalTerceros) }}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <!-- Resumen financiero -->
              <ResumenCotizacion
                :subtotalPropios="subtotalPropios"
                :subtotalTerceros="subtotalTerceros"
                :subtotalGeneral="subtotalGeneral"
                :descuentoPct="cotizacion.descuentoPct"
                :descuentoValor="descuentoValor"
                :totalGeneral="totalGeneral"
                @update:descuentoPct="cotizacion.descuentoPct = $event"
              />

            </div>

            <!-- Columna derecha sticky (40%) -->
            <div class="resumen-side">

              <!-- Card versión y estado — solo con ID (lógica original) -->
              <div v-if="id" class="form-card">
                <div class="section-header">
                  <FileText :size="18" class="icon-primary" />
                  <span>Versión y estado</span>
                </div>
                <p class="ver-text">
                  Versión actual: <strong>{{ cotizacion.version }}</strong>
                </p>
                <div class="side-btns">
                  <button
                    :class="['side-btn', modoEdicion ? 'side-btn--cancel' : 'side-btn--edit']"
                    @click="modoEdicion = !modoEdicion"
                  >
                    {{ modoEdicion ? 'Cancelar edición' : 'Editar' }}
                  </button>
                  <button
                    class="side-btn side-btn--save"
                    @click="guardarEdicion"
                    :disabled="!modoEdicion"
                  >
                    Guardar edición
                  </button>
                  <button
                    :class="['side-btn', modoEdicion ? 'side-btn--edit' : 'side-btn--primary']"
                    @click="guardarNuevaVersion"
                  >
                    Nueva versión
                  </button>
                </div>
              </div>

              <!-- Card acciones principales -->
              <div class="form-card">
                <div class="section-header">
                  <span>Acciones</span>
                </div>
                <div class="action-stack">
                  <button @click="saveQuotation" class="btn-ghost-full">
                    Guardar borrador
                  </button>
                  <button
                    @click="saveQuotation"
                    :class="['btn-primary-full', { 'btn-warning-full': modoEdicion }]"
                  >
                    {{ modoEdicion ? 'Guardar cambios' : 'Generar cotización' }}
                  </button>
                </div>
              </div>

            </div>
          </div>

        </template>

      </div>
    </Transition>

    <!-- ════════════════════════════════════════════════════════
         NAVEGACIÓN — pie de página del wizard
    ════════════════════════════════════════════════════════ -->
    <div class="step-nav">
      <button
        v-if="pasoActual > 1"
        @click="irAPaso(pasoActual - 1)"
        class="btn-prev"
      >
        <ChevronLeft :size="16" /> Anterior
      </button>

      <div class="nav-spacer"></div>

      <div class="nav-right">
        <!-- Pasos 1-3: botón Siguiente -->
        <template v-if="pasoActual < 4">
          <button @click="irAPaso(pasoActual + 1)" class="btn-next">
            Siguiente <ChevronRight :size="16" />
          </button>
        </template>

        <!-- Paso 4: Guardar borrador + Generar cotización -->
        <template v-else>
          <button @click="saveQuotation" class="btn-ghost-nav">
            Guardar borrador
          </button>
          <button
            @click="saveQuotation"
            :class="['btn-primary-nav', { 'btn-warning-nav': modoEdicion }]"
          >
            {{ modoEdicion ? 'Guardar cambios' : 'Generar cotización' }}
          </button>
        </template>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════
         MODALES — sin cambios respecto al original
    ════════════════════════════════════════════════════════ -->
    <EditProductModal
      :show="modalEditarProducto"
      :producto="productoEditado"
      @close="cerrarModalEdicion"
      @save="guardarEdicionProducto"
    />

    <ThirdPartyProductModal
      :show="modalNuevoProducto"
      :producto="productoTercero"
      @close="cerrarModal"
      @save="guardarProducto"
    />

    <ThirdPartyQuotationModal
      :show="showModalTerceroQuotation"
      :catalog="catalogTerceros"
      @close="showModalTerceroQuotation = false"
      @add="agregarItemTercero"
    />

    <!-- Modal: confirmar limpiar formulario -->
    <ModalReutilizable :show="showConfirmClear" @close="showConfirmClear = false">
      <div class="text-center p-4">
        <div class="flex justify-center mb-4">
          <div class="w-12 h-12 rounded-full bg-[#FEE2E2] flex items-center justify-center">
            <Trash2 :size="22" class="text-[#B91C1C]" />
          </div>
        </div>
        <h2 class="text-[16px] font-bold text-[#0F1A2E] mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
          Limpiar formulario
        </h2>
        <p class="text-[13px] text-text-2 mb-6 leading-relaxed">
          ¿Estás seguro? Se borrarán <strong>todos los datos ingresados</strong>
          y el borrador guardado. Esta acción no se puede deshacer.
        </p>
        <div class="flex justify-center gap-3">
          <button
            class="px-[18px] py-[9px] text-[13px] font-semibold bg-[#F1F5F9] text-[#64748B] border border-[#E5EAF0] rounded-[8px] hover:bg-[#E5EAF0] transition"
            @click="showConfirmClear = false"
          >
            Cancelar
          </button>
          <button
            class="px-[18px] py-[9px] text-[13px] font-semibold bg-[#B91C1C] text-white rounded-[8px] hover:bg-[#991B1B] transition flex items-center gap-2"
            @click="handleClearDraft"
          >
            <Trash2 :size="14" />
            Sí, limpiar todo
          </button>
        </div>
      </div>
    </ModalReutilizable>

    <!-- Modal: validación calendario incompleto -->
    <ModalReutilizable :show="modalCalendarioIncompleto" @close="modalCalendarioIncompleto = false">
      <div class="text-center p-4">
        <h2 class="text-[16px] font-bold text-primary mb-3 font-['Plus_Jakarta_Sans',sans-serif]">
          Fechas y horarios incompletos
        </h2>
        <p class="text-[13px] text-text-2 mb-6">
          Para ver la disponibilidad de los productos, debes definir
          <strong>todas las fechas y horarios del evento y la operación</strong>.
        </p>
        <button
          class="px-[18px] py-[9px] text-[13px] font-semibold bg-primary text-white rounded-[8px] shadow-[var(--shadow-btn)] hover:bg-primary-dark transition"
          @click="modalCalendarioIncompleto = false"
        >
          Entendido
        </button>
      </div>
    </ModalReutilizable>

    <!-- Modal: cotización creada exitosamente -->
    <ModalReutilizable :show="modalCotizacionExitosa" @close="modalCotizacionExitosa = false">
      <div class="text-center p-6">
        <h2 class="text-[16px] font-bold text-[#16A34A] mb-4 font-['Plus_Jakarta_Sans',sans-serif]">
          Cotización creada exitosamente
        </h2>
        <p class="text-[13px] text-text-2 mb-6">
          La cotización se creó de manera exitosa.
        </p>
        <div class="flex justify-center gap-4">
          <button
            class="px-[18px] py-[9px] text-[13px] font-semibold bg-primary-light text-primary border border-[#BFDBFE] rounded-[8px] hover:bg-[#DBEAFE] transition"
            @click="modalCotizacionExitosa = false"
          >
            Cerrar
          </button>
          <button
            class="px-[18px] py-[9px] text-[13px] font-semibold bg-primary text-white rounded-[8px] shadow-[var(--shadow-btn)] hover:bg-primary-dark transition"
          >
            Ver cotizaciones
          </button>
        </div>
      </div>
    </ModalReutilizable>

  </div>
</template>


<script setup>
// ── Imports originales — NO modificar ──────────────────────────────────────
import InputLabel from '@/components/input/InputLabel.vue';
import { ref, onMounted, watch, computed } from 'vue';   // añadido: computed
import { getQuotationById } from '../../services/quotation.service';

import ModalReutilizable from '../../components/modal/ModalReutilizable.vue';
import ResumenCotizacion from '../../components/panels/ResumenCotizacion.vue';
import ClienteFinalSelector from '../suppliers/ClienteFinalSelector.vue';
import BarraInfo from '../../components/panels/BarraInfo.vue';
import { useAuth } from '../../composables/useAuth';
import { formatDateTime, getCurrentISODate } from '../../utils/date';
import MapSelector from '../../components/map/MapSelector.vue';

import { useRoute } from 'vue-router';

import ClientsSelector from '../suppliers/ClientsSelector.vue';
import ProductPickerModal from '../../components/products/ProductPickerModal.vue';

import { useQuotationProducts }  from '@/composables/useQuotationProducts'
import { useQuotationCalendar }  from '@/composables/useQuotationCalendar'
import { useEditQuotationItem }  from '@/composables/useEditQuotationItem';
import EditProductModal          from '../../components/quotation/EditProductModal.vue';
import { useThirdPartyProduct }       from '../../composables/useThirdPartyProduct';
import ThirdPartyProductModal         from '../../components/quotation/ThirdPartyProductModal.vue';
import ThirdPartyQuotationModal       from '../../components/quotation/ThirdPartyQuotationModal.vue';
import { useQuotation }               from '../../composables/quotation/useQuotation';
import { useQuotationDraft }          from '../../composables/useQuotationDraft';
import QuotationNextNumber            from '../../components/quotation/QuotationNextNumber.vue';
import QuotationProductsCardList      from '../../components/products/QuotationProductsCardList.vue';
import { getThirdPartyCatalog }       from '../../services/products.service';

import {
  User,
  Briefcase,
  Calendar,
  CalendarDays,
  Settings,
  MapPin,
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  Package,
  ShoppingCart,
  FileText,
  Trash2,
  Clock,
  Truck,
  Plus,
} from 'lucide-vue-next'

// ── Lógica original — NO modificar ─────────────────────────────────────────
const route = useRoute();

const id          = route.params.id || null;
const isEditMode  = ref(!!id);
const modoEdicion = ref(false)

const { user } = useAuth();
const clienteSeleccionado   = ref({})
const myClienteSeleccionado = ref({})
const modalCalendarioIncompleto = ref(false);

const {
  cotizacion,
  items,
  itemsTerceros,
  subtotal,
  total,
  subtotalPropios,
  subtotalTerceros,
  subtotalGeneral,
  descuentoValor,
  totalGeneral,
  loading,
  modalCotizacionExitosa,
  saveQuotation
} = useQuotation()

const {
  modalEditarProducto,
  productoEditado,
  abrirModalEdicion,
  cerrarModalEdicion,
  guardarEdicionProducto
} = useEditQuotationItem(items)

const {
  calendarioCompleto,
  validarCalendario
} = useQuotationCalendar(cotizacion, items, modalCalendarioIncompleto)

const {
  productosFiltrados,
  categoriasFiltradas,
  selectedProduct,
  productPrice,
  searchProducto,
  searchCategoria,
  mostrarLista,
  mostrarListaFilter,
  totalSummary,
  cargarProductos,
  seleccionarProducto,
  seleccionarCategoria,
  filtrarCategorias,
  ocultarListas,
  addProduct,
  filtrarProductos,
} = useQuotationProducts({
  cotizacion,
  items,
  myClienteSeleccionado,
  validarCalendario
})

const {
  modalNuevoProducto,
  productoTercero,
  abrirModal,
  cerrarModal,
  guardarProducto
} = useThirdPartyProduct(items, cotizacion)

// ── Terceros en cotización (nuevo flujo) ────────────────────────────────────
const showModalTerceroQuotation = ref(false)
const catalogTerceros = ref([])
let catalogLoaded = false

const abrirModalTerceroQuotation = async () => {
  if (!catalogLoaded) {
    try {
      const { data } = await getThirdPartyCatalog()
      catalogTerceros.value = data ?? []
      catalogLoaded = true
    } catch (e) {
      console.error('[Cotizar] Error cargando catálogo de terceros:', e)
    }
  }
  showModalTerceroQuotation.value = true
}

const agregarItemTercero = (item) => {
  itemsTerceros.value.push(item)
}

const eliminarItemTercero = (index) => {
  itemsTerceros.value.splice(index, 1)
}

const formatCOP = (val) =>
  val == null ? '—' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val)

const buildThirdPartyPayload = () => ({
  dispositivo:                productoTercero.dispositivo,
  descripcion:                productoTercero.descripcion,
  valorBase:                  Number(productoTercero.precios) || 0,
  bodega:                     productoTercero.bodega,
  categoria:                  productoTercero.categoria,
  amperios:                   Number(productoTercero.amperios)       || null,
  medidas:                    productoTercero.medidas,
  qMotores:                   Number(productoTercero.motores)         || null,
  qOperarios:                 Number(productoTercero.operarios)       || null,
  qMetrosExtensiones:         Number(productoTercero.metrosExt)       || null,
  m2Dispositivo:              Number(productoTercero.m2Disp)          || null,
  qPesosEstacas:              Number(productoTercero.pesosEstacas)    || null,
  qExtintores:                Number(productoTercero.extintores)      || null,
  anioDispositivo:            Number(productoTercero.anio)            || null,
  porcentajeAmortizacion:     Number(productoTercero.amortizacion)    || null,
  m3Transporte:               Number(productoTercero.m3Transporte)    || null,
  pesoAproxDisp:              Number(productoTercero.peso)            || null,
  qHorasOperacion:            Number(productoTercero.horasOperacion)  || null,
  qHorasMontaje:              Number(productoTercero.horasMontaje)    || null,
  qPersonalMontaje:           Number(productoTercero.personalMontaje) || null,
  montacarga:                 productoTercero.montacarga         ? 'SI' : 'NO',
  incluyeTransporteBogMde:    productoTercero.incluyeTransporte  ? 'SI' : 'NO',
  notas:                      productoTercero.notas,
})

// Auto completa el campo Agente comercial y restaura el draft si existe
onMounted(async () => {
  cotizacion.fechaCotizacion = formatDateTime(getCurrentISODate())
  cotizacion.agenteComercial = user.value.fullName
  // Restore draft only for new quotations (not edit mode)
  if (!id) restoreDraft()
})

/**
 * !Corregir reference, es un numero de celular
 * !Corregir la variable de mail
 */
watch(clienteSeleccionado, (nuevoCliente) => {
  cotizacion.contacto = nuevoCliente.phone
  cotizacion.correo   = nuevoCliente.email
  cotizacion.celular  = nuevoCliente.reference
})

// ✅ CHANGED — sincroniza clienteId (FK numérica) cuando se selecciona un cliente de pricing
watch(myClienteSeleccionado, (nuevoCliente) => {
  cotizacion.clienteId = nuevoCliente.id ?? null
})

// Obtiene el precio según el cliente seleccionado
function getPrecioSeleccionado(producto) {
  productPrice.value = producto?.productBoxes?.[myClienteSeleccionado.value.id - 1]?.price ?? 0
}

const producto = ref({
  idCatalogo:                    null,
  nombre:                        '',
  valorCuadroCotizador:          null,
  cop:                           null,
  linkFotoDispositivo:           '',
  dispositivo:                   '',
  descripcion:                   '',
  incluyeTransporteBogMde:       '',
  valorListaCAFAM:               null,
  valorListaColsubsidio:         null,
  valorListaComfama:             null,
  valorListaCompensar:           null,
  valorListaConfenalco:          null,
  valorCuadroCotizador1:         null,
  verificarPrestacionProvExterno: ''
})

const campos = [
  { id: 'verificarPrestacionProvExterno', label: 'Proveedor',                     model: 'verificarPrestacionProvExterno', type: 'text'   },
  { id: 'nombre',                         label: 'Descripción producto',            model: 'nombre',                        type: 'text'   },
  { id: 'Cotización del proveedor',       label: 'Cotización del proveedor',        model: 'Cotización del proveedor',      type: 'file'   },
  { id: 'Imagen del producto',            label: 'Imagen del producto',             model: 'Cotización del proveedor',      type: 'file'   },
  { id: 'cop',                            label: 'Costo del producto',              model: 'cop',                           type: 'number' },
  { id: 'dispositivo',                    label: 'Categoria',                       model: 'dispositivo',                   type: 'text'   },
  { id: 'incluyeTransporteBogMde',        label: 'Incluye Transporte Bog-Mde',      model: 'incluyeTransporteBogMde',       type: 'text'   },
  { id: 'Fecha de carga',                 label: 'Fecha de carga',                  model: 'Fecha de carga',                type: 'text'   },
]

// =============== Actualiza, generar una nueva version =================
const getCotizacion = async () => {
  if (!isEditMode.value) return;

  try {
    const response = await getQuotationById(id);
    const data = response.data;

    cotizacion.cliente             = data.cliente;
    cotizacion.celular             = data.celular;
    cotizacion.empresa             = data.empresa;
    cotizacion.cliente             = data.cliente ? data?.cliente.name : '';
    cotizacion.contacto            = data.contacto;
    cotizacion.correo              = data.correo;
    // Map operationWindow → flat date/time fields used by the form inputs
    cotizacion.fechaInicioEvento   = data.operationWindow?.eventStartAt?.split('T')[0]        ?? ''
    cotizacion.horarioInicio       = data.operationWindow?.eventStartAt?.split('T')[1]?.slice(0, 5) ?? '00:00'
    cotizacion.fechaFinEvento      = data.operationWindow?.eventEndAt?.split('T')[0]          ?? ''
    cotizacion.horarioFin          = data.operationWindow?.eventEndAt?.split('T')[1]?.slice(0, 5)   ?? '00:00'
    cotizacion.fechaInicioMontaje  = data.operationWindow?.setupStartAt?.split('T')[0]        ?? ''
    cotizacion.horarioInicioMontaje= data.operationWindow?.setupStartAt?.split('T')[1]?.slice(0, 5) ?? '00:00'
    cotizacion.fechaFinMontaje     = data.operationWindow?.teardownEndAt?.split('T')[0]       ?? ''
    cotizacion.horarioFinMontaje   = data.operationWindow?.teardownEndAt?.split('T')[1]?.slice(0, 5) ?? '00:00'
    cotizacion.ubicacion           = data.ubicacion;
    cotizacion.linkMaps            = data.linkMaps;
    cotizacion.asistentes          = data.asistentes;
    cotizacion.vigencia            = data.vigencia;
    cotizacion.unidadEjecucion     = data.unidadEjecucion;
    cotizacion.tipoSuelo           = data.tipoSuelo;
    cotizacion.quotationStatusId   = data.quotationStatusId;

    items.value = data.items.map(it => ({
      category:          it.product.categoria,
      dispositivo:       it.product.dispositivo,
      descripcion:       it.product.descripcion,
      estado:            it.product.conditionStatus,
      incluyeTransporte: it.product.incluyeTransporteBogMde,
      medidas:           it.product.medidas,
      unitPrice:         it.unitPrice,
      linkFoto:          it.product.linkFotoDispositivo,
      qMotores:          it.product.qMotores,
      qOperarios:        it.product.qOperarios,
      cantidadJornada:   it.cantidadJornada  ?? it.quantity ?? 1,
      cantidadProducto:  it.cantidadProducto ?? 1,
    }))

    console.log("Cotización cargada para edición:", data);
  } catch (error) {
    console.error("Error al cargar cotización", error);
  }
}

onMounted(getCotizacion)

const eliminarItem = (item) => {
  if (confirm(`¿Seguro que deseas eliminar el producto "${item.descripcion}"?`)) {
    items.value = items.value.filter((i) => i.id !== item.id)
    // Si también lo eliminas del backend:
    // await api.delete(`/productos/${item.id}`)
    console.log('Eliminado:', item)
  }
}

// ── Wizard — adiciones mínimas ──────────────────────────────────────────────
const pasoActual = ref(1)

// ── Persistencia del formulario (debe ir después de pasoActual) ──────────────
const {
  hasDraft,
  showConfirmClear,
  restoreDraft,
  clearDraft,
  dismissBanner,
} = useQuotationDraft({ cotizacion, items, itemsTerceros, pasoActual, modalCotizacionExitosa })

/** Limpia el draft y re-aplica los valores de sesión (nombre del agente y fecha de hoy) */
const handleClearDraft = () => {
  clearDraft()
  cotizacion.fechaCotizacion = formatDateTime(getCurrentISODate())
  cotizacion.agenteComercial = user.value.fullName
}

const pasos = [
  { num: 1, label: 'Cliente'  },
  { num: 2, label: 'Evento'   },
  { num: 3, label: 'Equipos'  },
  { num: 4, label: 'Resumen'  },
]

const irAPaso = (n) => {
  pasoActual.value = n
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Computed: duración del evento en días
const duracionEvento = computed(() => {
  if (!cotizacion.fechaInicioEvento || !cotizacion.fechaFinEvento) return null
  const diff = Math.ceil(
    (new Date(cotizacion.fechaFinEvento) - new Date(cotizacion.fechaInicioEvento))
    / (1000 * 60 * 60 * 24)
  ) + 1
  if (isNaN(diff) || diff < 1) return null
  return `${diff} ${diff === 1 ? 'día' : 'días'}`
})

// Computed: duración del montaje en días
const duracionMontaje = computed(() => {
  if (!cotizacion.fechaInicioMontaje || !cotizacion.fechaFinMontaje) return null
  const diff = Math.ceil(
    (new Date(cotizacion.fechaFinMontaje) - new Date(cotizacion.fechaInicioMontaje))
    / (1000 * 60 * 60 * 24)
  ) + 1
  if (isNaN(diff) || diff < 1) return null
  return `${diff} ${diff === 1 ? 'día' : 'días'}`
})
</script>


<style scoped>
/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
.cot-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  padding-bottom: 40px;
}

/* ═══════════════════════════════════════════════════════════
   HEADER
═══════════════════════════════════════════════════════════ */
.cot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.ver-chip {
  font-size: 12px;
  font-weight: 600;
  color: #054EAF;
  background: #EEF4FF;
  padding: 3px 10px;
  border-radius: 20px;
  font-family: 'Inter', sans-serif;
}

.btn-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Inter', sans-serif;
}
.action-btn--cancel          { background: #FEE2E2; color: #B91C1C; }
.action-btn--cancel:hover    { background: #FECACA; }
.action-btn--edit            { background: #FEF3C7; color: #B45309; }
.action-btn--edit:hover      { background: #FDE68A; }
.action-btn--save            { background: #DCFCE7; color: #16A34A; }
.action-btn--save:hover      { background: #BBF7D0; }
.action-btn--save:disabled   { opacity: 0.5; cursor: not-allowed; }
.action-btn--primary         { background: #054EAF; color: white; box-shadow: 0 2px 8px rgba(5,78,175,.18); }
.action-btn--primary:hover   { background: #03368A; }

/* ═══════════════════════════════════════════════════════════
   STEPPER
═══════════════════════════════════════════════════════════ */
.stepper-wrap {
  background: #FFFFFF;
  border-radius: 18px;
  padding: 20px 24px 16px;
  box-shadow: 0 1px 4px rgba(5,78,175,.06), 0 4px 16px rgba(5,78,175,.08);
  border: 1px solid #EEF1F7;
}

.stepper {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 16px;
  min-width: 88px;
  transition: opacity 0.15s;
}
.step-item:hover { opacity: 0.8; }

.step-bubble {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  font-family: 'Plus Jakarta Sans', sans-serif;
  transition: all 0.2s;
  flex-shrink: 0;
}
.step-active  .step-bubble { background: #054EAF; color: white; box-shadow: 0 0 0 4px rgba(5,78,175,.14); }
.step-done    .step-bubble { background: #6EE7A0; color: white; }
.step-pending .step-bubble { background: #F1F5FA; color: #94A3B8; }

.step-label {
  font-size: 11px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}
.step-active  .step-label { color: #054EAF; font-weight: 700; }
.step-done    .step-label { color: #16A34A; }
.step-pending .step-label { color: #94A3B8; }

.step-connector {
  flex: 1;
  height: 2px;
  background: #E5EAF0;
  border-radius: 99px;
  transition: background 0.3s;
}
.connector-done { background: #6EE7A0; }

/* Mobile: "Paso N de 4" */
.step-mobile-label {
  display: none;
  font-size: 13px;
  color: #64748B;
  font-family: 'Inter', sans-serif;
  margin-bottom: 10px;
}
.step-mobile-label strong { color: #054EAF; }

/* Progress bar */
.prog-track {
  height: 4px;
  background: #EEF1F7;
  border-radius: 99px;
  overflow: hidden;
}
.prog-fill {
  height: 100%;
  background: #054EAF;
  border-radius: 99px;
  transition: width 0.4s ease;
}

/* ═══════════════════════════════════════════════════════════
   TRANSICIÓN ENTRE PASOS
═══════════════════════════════════════════════════════════ */
.slide-fade-enter-active { transition: all 0.25s ease-out; }
.slide-fade-leave-active { transition: all 0.20s ease-in;  }
.slide-fade-enter-from   { opacity: 0; transform: translateX(20px);  }
.slide-fade-leave-to     { opacity: 0; transform: translateX(-20px); }

/* ═══════════════════════════════════════════════════════════
   STEP PANE
═══════════════════════════════════════════════════════════ */
.step-pane {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ═══════════════════════════════════════════════════════════
   CARD BASE
═══════════════════════════════════════════════════════════ */
.form-card {
  background: #FFFFFF;
  border-radius: 18px;
  padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(5,78,175,.06), 0 4px 16px rgba(5,78,175,.08);
  border: 1px solid #EEF1F7;
}

/* ═══════════════════════════════════════════════════════════
   SECTION HEADER (dentro de card)
═══════════════════════════════════════════════════════════ */
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #EBF3FC;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #0F1A2E;
}

/* Section header standalone (fuera de card) */
.section-header-standalone {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #0F1A2E;
}

.icon-primary { color: #054EAF; flex-shrink: 0; }

/* ═══════════════════════════════════════════════════════════
   GRIDS
═══════════════════════════════════════════════════════════ */
.g2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.g3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.g4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }

/* ═══════════════════════════════════════════════════════════
   FIELD COMPONENTS (select estilizado igual a InputLabel)
═══════════════════════════════════════════════════════════ */
.field-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-lbl {
  font-size: 13px;
  font-weight: 500;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  display: block;
  margin-bottom: 4px;
}

.field-sel {
  width: 100%;
  background: #F8FAFC;
  border: 1px solid #E5EAF0;
  border-radius: 99px;
  padding: 8px 16px;
  font-size: 13px;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  outline: none;
  appearance: none;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.field-sel:focus {
  border-color: #054EAF;
  box-shadow: 0 0 0 2px rgba(5,78,175,.12);
}

/* Badge de duración */
.dur-badge {
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  background: #EEF4FF;
  color: #054EAF;
  padding: 3px 10px;
  border-radius: 20px;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}

/* ═══════════════════════════════════════════════════════════
   PASO 3: EQUIPOS — layout 60 / 40
═══════════════════════════════════════════════════════════ */
.equip-layout {
  display: grid;
  grid-template-columns: 60fr 40fr;
  gap: 16px;
  align-items: start;
}

.search-col { min-width: 0; }

.cart-col {
  position: sticky;
  top: 20px;
}

.cart-card {
  display: flex;
  flex-direction: column;
}

/* Search input con ícono inline */
.mb16 { margin-bottom: 16px; }
.rel  { position: relative; }

.search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #F8FAFC;
  border: 1px solid #E5EAF0;
  border-radius: 99px;
  padding: 8px 14px;
  margin-top: 4px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search-wrap:focus-within {
  border-color: #054EAF;
  box-shadow: 0 0 0 2px rgba(5,78,175,.12);
}

.s-ico { color: #94A3B8; flex-shrink: 0; }

.s-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 13px;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
}
.s-input::placeholder { color: #94A3B8; }

/* Dropdown de categorías */
.cat-list {
  position: absolute;
  z-index: 20;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #E5EAF0;
  border-radius: 12px;
  max-height: 220px;
  overflow-y: auto;
  box-shadow: 0 4px 16px rgba(5,78,175,.1);
}
.cat-opt {
  padding: 9px 16px;
  font-size: 13px;
  color: #0F1A2E;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: background 0.12s;
}
.cat-opt:hover { background: #EEF4FF; color: #054EAF; }

/* Fila de cantidades + botones */
.add-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  margin-top: 16px;
  flex-wrap: wrap;
}

.qty-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 80px;
}

.qty-input {
  width: 100%;
  background: #F8FAFC;
  border: 1px solid #E5EAF0;
  border-radius: 99px;
  padding: 8px 14px;
  font-size: 13px;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.qty-input:focus {
  border-color: #054EAF;
  box-shadow: 0 0 0 2px rgba(5,78,175,.12);
}

.btn-tercero {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  font-size: 12px;
  font-weight: 600;
  background: #EEF4FF;
  color: #054EAF;
  border: 1px solid #BFDBFE;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
  font-family: 'Inter', sans-serif;
}
.btn-tercero:hover { background: #DBEAFE; }

.btn-add {
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  background: #054EAF;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(5,78,175,.18);
  transition: background 0.15s;
  white-space: nowrap;
  font-family: 'Inter', sans-serif;
}
.btn-add:hover      { background: #03368A; }
.btn-add--edit      { background: #F59E0B; box-shadow: none; }
.btn-add--edit:hover { background: #D97706; }

/* Panel carrito */
.item-count-badge {
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  background: #EEF4FF;
  color: #054EAF;
  padding: 2px 8px;
  border-radius: 20px;
  font-family: 'Inter', sans-serif;
}

.cart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  text-align: center;
  gap: 8px;
}
.empty-ico   { color: #E5EAF0; }
.empty-title { font-size: 13px; font-weight: 600; color: #64748B; font-family: 'Inter', sans-serif; }
.empty-sub   { font-size: 12px; color: #94A3B8; font-family: 'Inter', sans-serif; line-height: 1.4; }

.cart-items {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 2px;
  max-height: 320px;
  overflow-y: auto;
}
.cart-items::-webkit-scrollbar       { width: 4px; }
.cart-items::-webkit-scrollbar-thumb { background: #E5EAF0; border-radius: 99px; }

.cart-row {
  padding: 8px 0;
  border-bottom: 1px solid #F1F5FA;
}
.cart-row:last-child { border-bottom: none; }

.cart-name {
  font-size: 12px;
  font-weight: 500;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cart-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 2px;
}
.cart-qty   { font-size: 11px; color: #94A3B8; font-family: 'Inter', sans-serif; }
.cart-price { font-size: 11px; font-weight: 600; color: #054EAF; font-family: 'Inter', sans-serif; }

.cart-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  margin-top: 8px;
  border-top: 2px solid #EBF3FC;
}
.total-lbl { font-size: 12px; font-weight: 600; color: #64748B; font-family: 'Inter', sans-serif; }
.total-val { font-size: 16px; font-weight: 700; color: #054EAF; font-family: 'Plus Jakarta Sans', sans-serif; }

/* Sección de detalle de productos */
.mt20 { margin-top: 4px; }
.mb12 { margin-bottom: 12px; }

/* ═══════════════════════════════════════════════════════════
   DRAFT BANNER
═══════════════════════════════════════════════════════════ */
.draft-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #EEF4FF;
  border: 1px solid #BFDBFE;
  border-radius: var(--r-xl);
  padding: 14px 20px;
  flex-wrap: wrap;
}

.draft-banner-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #DBEAFE;
  color: #1D4ED8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.draft-banner-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 180px;
}
.draft-banner-text strong {
  font-size: 13px;
  font-weight: 600;
  color: #1D4ED8;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.draft-banner-text span {
  font-size: 12px;
  color: #3B82F6;
  font-family: 'Inter', sans-serif;
}

.draft-banner-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

.draft-btn-discard {
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  background: transparent;
  color: #64748B;
  border: 1px solid #CBD5E1;
  border-radius: 99px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: background 0.15s, color 0.15s;
}
.draft-btn-discard:hover {
  background: #FEE2E2;
  color: #B91C1C;
  border-color: #FECACA;
}

.draft-btn-continue {
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 600;
  background: #054EAF;
  color: white;
  border: none;
  border-radius: 99px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 2px 8px rgba(5,78,175,.18);
  transition: background 0.15s;
}
.draft-btn-continue:hover { background: #03368A; }

/* Transition for the banner */
.banner-slide-enter-active,
.banner-slide-leave-active {
  transition: all 0.25s ease;
}
.banner-slide-enter-from,
.banner-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Botón limpiar en el header */
.btn-clear-draft {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 600;
  background: #FEF2F2;
  color: #B91C1C;
  border: 1px solid #FECACA;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: background 0.15s, border-color 0.15s;
}
.btn-clear-draft:hover {
  background: #FEE2E2;
  border-color: #FCA5A5;
}

/* ═══════════════════════════════════════════════════════════
   PASO 3: INTRO CARD
═══════════════════════════════════════════════════════════ */
.step3-intro-card {
  padding: 18px 24px;
}

.step3-intro {
  display: flex;
  align-items: center;
  gap: 16px;
}

.step3-num-badge {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #054EAF 0%, #1a72e8 100%);
  box-shadow: 0 0 0 6px rgba(5,78,175,.10);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
  font-weight: 700;
  color: white;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.step3-intro-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.step3-title {
  font-size: 17px;
  font-weight: 700;
  color: #0F1A2E;
  font-family: 'Plus Jakarta Sans', sans-serif;
  line-height: 1.3;
  margin: 0;
}

.step3-desc {
  font-size: 13px;
  color: #64748B;
  font-family: 'Inter', sans-serif;
  line-height: 1.5;
  margin: 0;
  max-width: 600px;
}

/* Botón picker de productos */
.picker-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background: #F8FAFC;
  border: 1px solid #E5EAF0;
  border-radius: 99px;
  padding: 9px 16px;
  margin-top: 4px;
  font-size: 13px;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  text-align: left;
}
.picker-btn:hover {
  border-color: #054EAF;
  background: #EEF4FF;
  box-shadow: 0 0 0 2px rgba(5,78,175,.10);
}
.picker-btn .s-ico { color: #94A3B8; flex-shrink: 0; }
.picker-btn-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #94A3B8;
}

/* ═══════════════════════════════════════════════════════════
   PASO 4: RESUMEN — layout 60 / 40
═══════════════════════════════════════════════════════════ */
.resumen-layout {
  display: grid;
  grid-template-columns: 60fr 40fr;
  gap: 16px;
  align-items: start;
}

.resumen-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.resumen-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 20px;
}

/* Lista de resumen (dl) */
.summ-list {
  display: flex;
  flex-direction: column;
}

.summ-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px solid #F1F5FA;
  font-family: 'Inter', sans-serif;
}
.summ-row:last-child { border-bottom: none; }

.summ-row dt {
  font-size: 12px;
  font-weight: 500;
  color: #64748B;
  flex-shrink: 0;
  min-width: 150px;
}

.summ-row dd {
  font-size: 13px;
  font-weight: 500;
  color: #0F1A2E;
  text-align: right;
  word-break: break-word;
  margin: 0;
}

/* Tabla de equipos */
.table-wrap { overflow-x: auto; }

.eq-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
}
.eq-table thead tr { border-bottom: 2px solid #EBF3FC; }
.eq-table th {
  text-align: left;
  font-size: 10px;
  font-weight: 600;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 6px 8px;
}
.eq-table td {
  padding: 9px 8px;
  border-bottom: 1px solid #F1F5FA;
  color: #0F1A2E;
}
.eq-table tr:last-child td { border-bottom: none; }
.td-name  { font-weight: 500; max-width: 200px; }
.td-total { font-weight: 600; color: #054EAF; }

.eq-subtotal-row {
  background: #F0F6FF;
  border-top: 2px solid #D1DAE6;
}
.eq-subtotal-label {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  padding: 9px 8px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.eq-subtotal-val {
  font-size: 13px;
  font-weight: 800;
  color: #054EAF;
  padding: 9px 8px;
}

/* Panel lateral versión */
.ver-text {
  font-size: 13px;
  color: #64748B;
  font-family: 'Inter', sans-serif;
  margin-bottom: 12px;
}

.side-btns { display: flex; flex-direction: column; gap: 6px; }

.side-btn {
  width: 100%;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Inter', sans-serif;
  text-align: center;
}
.side-btn--cancel        { background: #FEE2E2; color: #B91C1C; }
.side-btn--cancel:hover  { background: #FECACA; }
.side-btn--edit          { background: #FEF3C7; color: #B45309; }
.side-btn--edit:hover    { background: #FDE68A; }
.side-btn--save          { background: #DCFCE7; color: #16A34A; }
.side-btn--save:hover    { background: #BBF7D0; }
.side-btn--save:disabled { opacity: 0.5; cursor: not-allowed; }
.side-btn--primary       { background: #054EAF; color: white; box-shadow: 0 2px 8px rgba(5,78,175,.18); }
.side-btn--primary:hover { background: #03368A; }

/* Botones de acción principales */
.action-stack { display: flex; flex-direction: column; gap: 10px; }

.btn-ghost-full,
.btn-primary-full {
  width: 100%;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Inter', sans-serif;
  text-align: center;
}

.btn-ghost-full {
  background: #F8FAFC;
  color: #64748B;
  border: 1px solid #E5EAF0;
}
.btn-ghost-full:hover { background: #EEF4FF; color: #054EAF; border-color: #BFDBFE; }

.btn-primary-full {
  background: #054EAF;
  color: white;
  border: none;
  box-shadow: 0 2px 8px rgba(5,78,175,.18);
}
.btn-primary-full:hover  { background: #03368A; }
.btn-warning-full        { background: #F59E0B; box-shadow: none; }
.btn-warning-full:hover  { background: #D97706; }

/* ═══════════════════════════════════════════════════════════
   NAVEGACIÓN — pie del wizard
═══════════════════════════════════════════════════════════ */
.step-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #FFFFFF;
  border-radius: 18px;
  box-shadow: 0 1px 4px rgba(5,78,175,.06), 0 4px 16px rgba(5,78,175,.08);
  border: 1px solid #EEF1F7;
  gap: 12px;
}

.nav-spacer { flex: 1; }
.nav-right  { display: flex; gap: 10px; align-items: center; }

.btn-prev {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #64748B;
  background: #F8FAFC;
  border: 1px solid #E5EAF0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Inter', sans-serif;
}
.btn-prev:hover { background: #EEF4FF; color: #054EAF; border-color: #BFDBFE; }

.btn-next {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  background: #054EAF;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(5,78,175,.18);
  transition: background 0.15s;
  font-family: 'Inter', sans-serif;
}
.btn-next:hover { background: #03368A; }

.btn-ghost-nav {
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #64748B;
  background: #F8FAFC;
  border: 1px solid #E5EAF0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Inter', sans-serif;
}
.btn-ghost-nav:hover { background: #EEF4FF; color: #054EAF; border-color: #BFDBFE; }

.btn-primary-nav {
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  background: #054EAF;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(5,78,175,.18);
  transition: background 0.15s;
  font-family: 'Inter', sans-serif;
}
.btn-primary-nav:hover  { background: #03368A; }
.btn-warning-nav        { background: #F59E0B; box-shadow: none; }
.btn-warning-nav:hover  { background: #D97706; }

/* ═══════════════════════════════════════════════════════════
   RESPONSIVE
═══════════════════════════════════════════════════════════ */
@media (max-width: 1024px) {
  .g4 { grid-template-columns: repeat(2, 1fr); }
  .g3 { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .g2,
  .g3,
  .g4           { grid-template-columns: 1fr; }
  .equip-layout { grid-template-columns: 1fr; }
  .resumen-layout { grid-template-columns: 1fr; }

  /* Carrito y sidebar van debajo */
  .cart-col    { position: static; }
  .resumen-side { position: static; }

  /* Stepper: ocultar completo, mostrar solo "Paso N de 4" */
  .stepper           { display: none; }
  .step-mobile-label { display: block; }

  /* Navegación móvil */
  .step-nav   { flex-wrap: wrap; }
  .nav-spacer { display: none; }
  .nav-right  { flex: 1; width: 100%; }
  .btn-prev   { flex: 1; justify-content: center; }
  .btn-next,
  .btn-primary-nav,
  .btn-ghost-nav { flex: 1; justify-content: center; text-align: center; }
}

/* ═══════════════════════════════════════════════════════════
   TERCEROS EN COTIZACIÓN
═══════════════════════════════════════════════════════════ */
.btn-add-tercero {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  background: #EFF6FF;
  color: #1D4ED8;
  border: 1px solid #BFDBFE;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;
}
.btn-add-tercero:hover {
  background: #DBEAFE;
  border-color: #93C5FD;
}

.tercero-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px 0;
  color: #94A3B8;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
}
.tercero-empty-ico { color: #CBD5E1; }

.btn-del-tercero {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: #94A3B8;
  padding: 4px;
  border-radius: 5px;
  transition: background 0.15s, color 0.15s;
}
.btn-del-tercero:hover {
  background: #FEE2E2;
  color: #B91C1C;
}
</style>
