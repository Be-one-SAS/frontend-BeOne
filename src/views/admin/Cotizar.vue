<template>
  <div class="cot-page">

    <!-- ════════════════════════════════════════════════════════
         HEADER — QuotationNextNumber + acciones de cotización
    ════════════════════════════════════════════════════════ -->
    <div class="cot-header">
      <QuotationNextNumber />

      <!-- Acciones de cotización — solo si hay ID en la URL (modo edición) -->
      <div v-if="id" class="header-actions">
        <!-- Versión de la cotización -->
        <div class="version-badge">
          <span class="version-label">Versión</span>
          <span class="version-number">{{ cotizacion.version }}</span>
        </div>
        
        <!-- Botones de acción -->
        <div class="btn-group">
          <button
            @click="saveQuotation"
            class="action-btn action-btn--ghost"
          >
            Guardar borrador
          </button>
          <button
            class="action-btn action-btn--update"
            @click="guardarEdicion"
            :disabled="isUpdating"
          >
            <Loader2 v-if="isUpdating" :size="16" class="spin" />
            <CheckCircle2 v-else-if="updateSuccess" :size="16" />
            <span v-else>{{ id ? 'Actualizar cotización' : 'Crear cotización' }}</span>
            <span v-if="isUpdating">{{ id ? 'Actualizando...' : 'Creando...' }}</span>
            <span v-else-if="updateSuccess">¡{{ id ? 'Actualizado' : 'Creada' }}!</span>
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
              <InputLabel label="Agente Comercial" v-model="cotizacion.agenteComercial" disabled />
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

            <div class="mt-4">
              <CollaboratorsManager 
                v-if="!loading"
                :quotationId="id" 
                :initialMembers="cotizacion.members || []"
                :isReadOnly="false"
                @update-members="(m) => cotizacion.members = m"
              />
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
              <MapSelector
                v-model="cotizacion.linkMaps"
                :address="cotizacion.ubicacion"
                @update:address="cotizacion.ubicacion = $event"
              />
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

            <!-- Selector de fechas con modal -->
            <EventDatePickerModal
              :fechaInicio="cotizacion.fechaInicioEvento"
              :horaInicio="cotizacion.horarioInicio"
              :fechaFin="cotizacion.fechaFinEvento"
              :horaFin="cotizacion.horarioFin"
              :fechaInicioEvento="cotizacion.fechaInicioEvento"
              :horaInicioEvento="cotizacion.horarioInicio"
              :fechaFinEvento="cotizacion.fechaFinEvento"
              :horaFinEvento="cotizacion.horarioFin"
              calendarType="evento"
              @update:fechaInicio="cotizacion.fechaInicioEvento = $event"
              @update:horaInicio="cotizacion.horarioInicio = $event"
              @update:fechaFin="cotizacion.fechaFinEvento = $event"
              @update:horaFin="cotizacion.horarioFin = $event"
            />
          </div>

          <!-- Card: Operación y Montaje -->
          <div class="form-card">
            <div class="section-header">
              <Settings :size="18" class="icon-primary" />
              <span>Operación y Montaje</span>
              <span v-if="duracionMontaje" class="dur-badge">Duración: {{ duracionMontaje }}</span>
            </div>

            <!-- Selector de fechas con modal -->
            <EventDatePickerModal
              :fechaInicio="cotizacion.fechaInicioMontaje"
              :horaInicio="cotizacion.horarioInicioMontaje"
              :fechaFin="cotizacion.fechaFinMontaje"
              :horaFin="cotizacion.horarioFinMontaje"
              :fechaInicioEvento="cotizacion.fechaInicioEvento"
              :horaInicioEvento="cotizacion.horarioInicio"
              :fechaFinEvento="cotizacion.fechaFinEvento"
              :horaFinEvento="cotizacion.horarioFin"
              calendarType="montaje"
              @update:fechaInicio="cotizacion.fechaInicioMontaje = $event"
              @update:horaInicio="cotizacion.horarioInicioMontaje = $event"
              @update:fechaFin="cotizacion.fechaFinMontaje = $event"
              @update:horaFin="cotizacion.horarioFinMontaje = $event"
            />
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
                <div class="section-header j-bet">
                  <div class="flex items-center gap-2">
                    <Search :size="18" class="icon-primary" />
                    <span>Seleccionar Equipos</span>
                  </div>
                  
                    <div v-if="myClienteSeleccionado?.name || cotizacion.cliente" class="price-list-badge">
                      <Check :size="12" />
                      <span>Caja / Lista: {{ myClienteSeleccionado?.name || cotizacion.cliente }}</span>
                    </div>
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
                        {{ selectedProduct?.nombre || selectedProduct?.dispositivo || 'Buscar y seleccionar producto…' }}
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
                  <button @click="abrirModalTerceroQuotation" class="btn-tercero">
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
                <div v-if="!items.length && !itemsTerceros.length" class="cart-empty">
                  <Package :size="40" class="empty-ico" />
                  <p class="empty-title">Sin equipos agregados</p>
                  <p class="empty-sub">Busca y agrega equipos en el panel izquierdo</p>
                </div>

                <!-- Lista de items -->
                <div v-else class="cart-items">
                  <!-- Equipos Propios -->
                  <div v-for="(it, i) in items" :key="'own-' + i" class="cart-row">
                    <p class="cart-name">{{ it.nombre || it.dispositivo || it.descripcion }}</p>
                    <div class="cart-meta">
                      <span class="cart-qty">{{ it.cantidadJornada }}j × {{ it.cantidadProducto }}u</span>
                      <span class="cart-price">${{ Math.round(totalesFilasPropias[i] || 0).toLocaleString('es-CO') }}</span>
                    </div>
                  </div>

                  <!-- Productos Terceros -->
                  <div v-for="(it, i) in itemsTerceros" :key="'third-' + i" class="cart-row cart-row--tercero">
                    <p class="cart-name">
                      <Truck :size="10" class="inline-icon" />
                      {{ it.nombre || it.dispositivo || '—' }}
                    </p>
                    <div class="cart-meta">
                      <span class="cart-qty">{{ it.cantidad }} unid.</span>
                      <span class="cart-price">${{ Math.round(totalesFilasTerceros[i] || 0).toLocaleString('es-CO') }}</span>
                    </div>
                  </div>
                </div>

                <!-- Total parcial -->
                <div v-if="items.length || itemsTerceros.length" class="cart-total">
                  <span class="total-lbl">Total parcial</span>
                  <span class="total-val">${{ (subtotalGeneral || 0).toLocaleString('es-CO') }}</span>
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
              <Truck :size="36" class="tercero-empty-ico" />
              <p>Sin productos de terceros agregados</p>
            </div>

            <div v-else class="prd-table-card">
              <div class="prd-table-scroll">
                <table class="prd-table">
                  <thead>
                    <tr>
                      <th class="th-num">#</th>
                      <th class="th-img"></th>
                      <th class="th-product">Producto</th>
                      <th class="th-center">Q. Jornada</th>
                      <th class="th-center">Q. Producto</th>
                      <th class="th-center">Precio unit.</th>
                      <th class="th-center">Desc. (%)</th>
                      <th class="th-center">Total</th>
                      <th class="th-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(it, i) in itemsTerceros" :key="i" class="prd-row">
                      <td class="td-num">{{ i + 1 }}</td>
                      <td class="td-img">
                        <img
                          :src="it.linkFoto || it.linkFotoDispositivo || '/assets/be-one-logo.webp'"
                          @error="$event.target.src = '/assets/be-one-logo.webp'"
                          class="prd-thumb"
                          alt=""
                        />
                      </td>
                      <td class="td-name">
                        <p class="prd-nombre">{{ it.nombre || it.dispositivo || '—' }}</p>
                        <p v-if="it.categoria" class="prd-cat">{{ it.categoria }}</p>
                      </td>
                      <td class="td-center">
                        <span class="prd-qty">1</span>
                      </td>
                      <td class="td-center">
                        <span class="prd-qty">{{ it.cantidad ?? 1 }}</span>
                      </td>
                      <td class="td-center prd-price">
                        {{ formatCOP(it.costoUnitario ?? null) }}
                      </td>
                      <td class="td-center">
                        <input
                          v-model.number="it.descuentoPct"
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0%"
                          class="prd-discount-input"
                        />
                      </td>
                      <td class="td-center prd-total">
                        {{ formatCOP(totalesFilasTerceros[i]) }}
                      </td>
                      <td class="td-center" @click.stop>
                        <button class="prd-action-btn" style="--hbg:#FEE2E2; --hc:#B91C1C" @click="eliminarItemTercero(i)" title="Eliminar">
                          <Trash2 :size="14" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="prd-subtotal-row">
                      <td colspan="7" class="td-subtotal-label">Subtotal productos terceros</td>
                      <td class="td-subtotal-val">{{ formatCOP(totalesFilasTerceros.reduce((s, v) => s + v, 0)) }}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          
          <!-- Resumen de totales al final del Paso 3 -->
          <div class="fin-bar" v-if="items.length || itemsTerceros.length">

            <div class="fin-bar-item">
              <span class="fin-bar-lbl">Totales</span>
              <span class="fin-bar-val">{{ formatCOP(subtotalGeneral) }}</span>
            </div>

            <div class="fin-bar-sep"></div>

            <div class="fin-bar-item">
              <span class="fin-bar-lbl">Total Descuentos</span>
              <span class="fin-bar-val fin-bar-val--disc">− {{ formatCOP(totalDescuentos) }}</span>
            </div>

            <div class="fin-bar-sep"></div>

            <div class="fin-bar-item">
              <span class="fin-bar-lbl">IVA (19%)</span>
              <span class="fin-bar-val fin-bar-val--iva">{{ formatCOP(ivaGeneral) }}</span>
            </div>

            <div class="fin-bar-sep"></div>

            <div class="fin-bar-item fin-bar-item--total">
              <span class="fin-bar-lbl fin-bar-lbl--total">TOTAL GENERAL</span>
              <span class="fin-bar-val fin-bar-val--total">{{ formatCOP(totalGeneral) }}</span>
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
                <div class="prd-table-scroll">
                  <table class="prd-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th class="th-center">Jornadas</th>
                        <th class="th-center">Cant.</th>
                        <th class="th-right">Precio unit.</th>
                        <th class="th-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(it, i) in items" :key="i" class="prd-row-view">
                        <td class="td-name">{{ it.nombre || it.dispositivo || it.descripcion }}</td>
                        <td class="td-center">{{ it.cantidadJornada }}</td>
                        <td class="td-center">{{ it.cantidadProducto }}</td>
                        <td class="td-right prd-price">{{ formatCOP(it.unitPrice) }}</td>
                        <td class="td-right prd-total">
                          {{ formatCOP(totalesFilasPropias[i]) }}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr class="prd-subtotal-row">
                        <td colspan="4" class="td-subtotal-label">Subtotal equipos propios</td>
                        <td class="td-subtotal-val">{{ formatCOP(subtotalPropios) }}</td>
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
                <div class="prd-table-scroll">
                  <table class="prd-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th class="th-center">Cant.</th>
                        <th class="th-right">Precio unit.</th>
                        <th class="th-right">Total factura</th>
                        <th class="th-right">Utilidad final</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(it, i) in itemsTerceros" :key="i" class="prd-row-view">
                        <td class="td-name">{{ it.nombre || it.dispositivo || '—' }}</td>
                        <td class="td-center">{{ it.cantidad }}</td>
                        <td class="td-right prd-price">
                          {{ formatCOP(it.precioUnitario ?? it.precioUnitarioConIva ?? null) }}
                        </td>
                        <td class="td-right prd-total">
                          {{ formatCOP(calcularTotalFilaTercero(it)) }}
                        </td>
                        <td class="td-right font-semibold" style="color: #059669">
                          {{ formatCOP(it.utilidadFinal ?? it.utilidadNeta ?? null) }}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr class="prd-subtotal-row">
                        <td colspan="3" class="td-subtotal-label">Subtotal productos terceros</td>
                        <td class="td-subtotal-val">{{ formatCOP(subtotalTerceros) }}</td>
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
                :ivaGeneral="ivaGeneral"
                :totalGeneral="totalGeneral"
                @update:descuentoPct="cotizacion.descuentoPct = $event"
              />

              <!-- Card: Notas de la cotización -->
              <div class="form-card">
                <div class="section-header">
                  <StickyNote :size="18" class="icon-primary" />
                  <span>Notas</span>
                  <span v-if="notas.length" class="item-count-badge">{{ notas.length }}</span>
                </div>

                <!-- Lista de notas existentes (solo en modo edición) -->
                <div v-if="id && notas.length" class="notas-list">
                  <div v-for="nota in notas" :key="nota.id" class="nota-row">
                    <div class="nota-area-badge" :data-area="nota.area">{{ nota.area }}</div>
                    <p class="nota-contenido">{{ nota.contenido }}</p>
                    <div class="nota-meta">
                      <span class="nota-fecha">{{ formatDate(nota.createdAt) }}</span>
                      <button class="nota-delete-btn" @click="eliminarNota(nota.id)" title="Eliminar nota">
                        <Trash2 :size="13" />
                      </button>
                    </div>
                  </div>
                </div>

                <div v-else-if="id && !notas.length" class="notas-empty">
                  <StickyNote :size="28" class="notas-empty-ico" />
                  <p>Sin notas registradas</p>
                </div>

                <div v-if="!id" class="notas-empty">
                  <StickyNote :size="28" class="notas-empty-ico" />
                  <p>Guarda primero la cotización para agregar notas</p>
                </div>

                <!-- Formulario para agregar nota (solo en modo edición) -->
                <div v-if="id" class="nota-form">
                  <div class="nota-form-row">
                    <div class="field-wrap" style="flex: 1;">
                      <label class="field-lbl">Área</label>
                      <select v-model="notaNueva.area" class="field-sel">
                        <option value="" disabled>Seleccionar área…</option>
                        <option v-for="area in AREAS_NOTA" :key="area" :value="area">{{ area }}</option>
                      </select>
                    </div>
                  </div>
                  <div class="nota-form-row">
                    <div class="field-wrap" style="flex: 1;">
                      <label class="field-lbl">Contenido</label>
                      <textarea
                        v-model="notaNueva.contenido"
                        class="nota-textarea"
                        placeholder="Escribe una nota…"
                        rows="3"
                      />
                    </div>
                  </div>
                  <button
                    class="nota-add-btn"
                    @click="agregarNota"
                    :disabled="!notaNueva.contenido.trim() || !notaNueva.area || notaGuardando"
                  >
                    <Plus :size="14" />
                    {{ notaGuardando ? 'Guardando…' : 'Agregar nota' }}
                  </button>
                </div>
              </div>

            </div>

            <!-- Columna derecha sticky (40%) -->
            <div class="resumen-side">

              <!-- Card versión y estado — solo con ID (modo lectura) -->
              <div v-if="id" class="form-card">
                <div class="section-header">
                  <FileText :size="18" class="icon-primary" />
                  <span>Información de cotización</span>
                </div>
                <div class="info-list">
                  <div class="info-row">
                    <span class="info-label">No. Cotización:</span>
                    <span class="info-value">{{ cotizacion.numero }}-2026</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Versión:</span>
                    <span class="info-value">{{ cotizacion.version }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Estado:</span>
                    <span class="info-value">{{ cotizacion.quotationStatus?.name || 'Pendiente' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Última actualización:</span>
                    <span class="info-value">{{ cotizacion.updatedAt ? formatDate(cotizacion.updatedAt) : '—' }}</span>
                  </div>
                </div>
              </div>

              <!-- Card acciones principales -->
              <div class="form-card">
                <div class="section-header">
                  <span>Acciones de cotización</span>
                </div>
                <div class="action-stack">
                  <button @click="saveQuotation" class="btn-ghost-full">
                    Guardar borrador
                  </button>
                  <button
                    @click="guardarEdicion"
                    class="btn-primary-full"
                    :disabled="isUpdating"
                  >
                    <Loader2 v-if="isUpdating" :size="16" class="spin" />
                    <CheckCircle2 v-else-if="updateSuccess" :size="16" />
                    <span v-else>{{ id ? 'Actualizar cotización' : 'Crear cotización' }}</span>
                    <span v-if="isUpdating">{{ id ? 'Actualizando...' : 'Creando...' }}</span>
                    <span v-else-if="updateSuccess">¡{{ id ? 'Actualizado' : 'Creada' }}!</span>
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
          <div
            class="btn-next-wrap"
            :data-tip="pasoActual === 2 && !cotizacion.linkMaps
              ? 'Selecciona una ubicación en el mapa para continuar'
              : undefined"
          >
            <button
              @click="irAPaso(pasoActual + 1)"
              class="btn-next"
              :disabled="pasoActual === 2 && !cotizacion.linkMaps"
            >
              Siguiente <ChevronRight :size="16" />
            </button>
          </div>
        </template>

        <!-- Paso 4: Guardar borrador + Actualizar cotización -->
        <template v-else>
          <button @click="saveQuotation" class="btn-ghost-nav" :disabled="isUpdating">
            Guardar borrador
          </button>
          <button
            @click="guardarEdicion"
            class="btn-primary-nav"
            :disabled="isUpdating"
          >
            <Loader2 v-if="isUpdating" :size="16" class="spin" />
            <CheckCircle2 v-else-if="updateSuccess" :size="16" />
            <span v-else>{{ id ? 'Actualizar cotización' : 'Crear cotización' }}</span>
            <span v-if="isUpdating">{{ id ? 'Actualizando...' : 'Creando...' }}</span>
            <span v-else-if="updateSuccess">¡{{ id ? 'Actualizado' : 'Creada' }}!</span>
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
      @catalog-updated="(item) => catalogTerceros.push(item)"
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
      <div class="modal-exitosa">
        <!-- Encabezado -->
        <div class="modal-exitosa-header">
          <div class="modal-exitosa-icon">
            <CheckCircle2 :size="28" />
          </div>
          <h2 class="modal-exitosa-title">Cotización creada exitosamente</h2>
          <p class="modal-exitosa-sub">Puedes agregar notas antes de continuar.</p>
        </div>

        <!-- Lista de notas agregadas en el modal -->
        <div v-if="notasModal.length" class="modal-notas-list">
          <div v-for="n in notasModal" :key="n.id" class="nota-row">
            <div class="nota-area-badge" :data-area="n.area">{{ n.area }}</div>
            <p class="nota-contenido">{{ n.contenido }}</p>
          </div>
        </div>

        <!-- Formulario de nota -->
        <div class="modal-nota-form">
          <div class="field-wrap">
            <label class="field-lbl">Área</label>
            <select v-model="notaModal.area" class="field-sel">
              <option value="" disabled>Seleccionar área…</option>
              <option v-for="area in AREAS_NOTA" :key="area" :value="area">{{ area }}</option>
            </select>
          </div>
          <div class="field-wrap">
            <label class="field-lbl">Nota</label>
            <textarea
              v-model="notaModal.contenido"
              class="nota-textarea"
              placeholder="Escribe una nota…"
              rows="3"
            />
          </div>
          <button
            class="nota-add-btn"
            style="width: 100%;"
            @click="agregarNotaModal"
            :disabled="!notaModal.contenido.trim() || !notaModal.area || notaModalGuardando"
          >
            <Plus :size="14" />
            {{ notaModalGuardando ? 'Guardando…' : 'Agregar nota' }}
          </button>
        </div>

        <!-- Acciones -->
        <div class="modal-exitosa-actions">
          <button class="modal-btn modal-btn--secondary" @click="modalCotizacionExitosa = false">
            Cerrar
          </button>
          <button
            class="modal-btn modal-btn--primary"
            @click="push({ path: '/admin/ver-cotizaciones', query: { id: quotationId } })"
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
import CollaboratorsManager from './components/CollaboratorsManager.vue';
import QuotationVersions from './components/QuotationVersions.vue';
import { ref, onMounted, watch, computed } from 'vue';   // añadido: computed
import { getQuotationById, getVersions, createVersion } from '../../services/quotation.service';

import ModalReutilizable from '../../components/modal/ModalReutilizable.vue';
import ResumenCotizacion from '../../components/panels/ResumenCotizacion.vue';
import ClienteFinalSelector from '../suppliers/ClienteFinalSelector.vue';
import BarraInfo from '../../components/panels/BarraInfo.vue';
import { useAuth } from '../../composables/useAuth';
import MapSelector from '../../components/map/MapSelector.vue';

import { useRoute, useRouter } from 'vue-router';

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
import EventDatePickerModal           from '../../components/quotation/EventDatePickerModal.vue';
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
  ReceiptText,
  Loader2,
  CheckCircle2,
  StickyNote,
} from 'lucide-vue-next'

import {
  AREAS_NOTA,
  createNotaCotizacion,
  getNotasByCotizacion,
  deleteNotaCotizacion,
} from '../../services/nota-cotizacion.service'

// ── Lógica original — NO modificar ─────────────────────────────────────────
const route = useRoute();
const { push } = useRouter();

const id          = route.params.id || null;
const isEditMode  = ref(!!id);
const modoEdicion = ref(false)

const { user } = useAuth();
const clienteSeleccionado   = ref({})
const myClienteSeleccionado = ref({})
const modalCalendarioIncompleto = ref(false);
const showVersionsHistory = ref(false); // ✅ ADDED

const {
  cotizacion,
  items,
  itemsTerceros,
  subtotal,
  total,
  subtotalPropios,
  subtotalTerceros,
  subtotalGeneral,
  subtotalSinDescuento,
  totalDescuentos,
  ivaGeneral,
  descuentoValor,
  totalGeneral,
  loading,
  modalCotizacionExitosa,
  saveQuotation,
  quotationId // ✅ ADDED
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

const canManage = computed(() => {
  if (!user.value) return false;
  // Solo ADMIN, SUPERVISOR o el creador de la cotización
  const rolesPermitidos = ['ADMIN', 'SUPERVISOR'];
  const hasRole = rolesPermitidos.includes(user.value.role);
  const isCreator = user.value.id === cotizacion.createdById;
  return hasRole || isCreator;
});

// ── Lógica de Guardado y Versiones ───────────────────────────────────────

const isUpdating = ref(false);
const updateSuccess = ref(false);

/**
 * Guarda los cambios actuales vía PATCH a la cotización activa
 */
const guardarEdicion = async () => {
  isUpdating.value = true;
  updateSuccess.value = false;
  
  try {
    await saveQuotation();
    modoEdicion.value = false;
    // recargar para asegurar consistencia
    await getCotizacion();
    
    // Mostrar éxito
    updateSuccess.value = true;
    setTimeout(() => {
      updateSuccess.value = false;
    }, 2000);
  } catch (error) {
    console.error('[Cotizar] Error al guardar edición:', error);
    alert('Error al actualizar la cotización. Por favor intenta nuevamente.');
  } finally {
    isUpdating.value = false;
  }
};

/**
 * Genera una nueva versión (Snapshot) y recarga la vista
 */
const guardarNuevaVersion = async () => {
  if (!id) return;
  try {
    // ✅ IMPROVED — Guardar cambios actuales antes de generar el snapshot
    // para que la versión contenga lo que el usuario ve en pantalla.
    await saveQuotation();
    
    // Al generar nueva versión, limpiamos la marca de "versión restaurada"
    // para que el sistema vuelva a calcular el máximo (que será la nueva versión)
    localStorage.removeItem(`active_v_${id}`);
    
    await createVersion(id);
    await getCotizacion();
    alert('Nueva versión generada con éxito (incluyendo tus cambios actuales)');
  } catch (error) {
    console.error('[Cotizar] Error al generar versión:', error);
  }
};

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
  itemsTerceros.value.push({
    ...item,
    descuentoPct: typeof item.descuentoPct === 'number' ? item.descuentoPct : 0,
    // Ensure costoUnitario is preserved from the modal
    costoUnitario: item.costoUnitario,
  })
}

const eliminarItemTercero = (index) => {
  if (confirm(`¿Seguro que deseas eliminar este producto de tercero?`)) {
    itemsTerceros.value.splice(index, 1)
  }
}

// Calcular subtotal de un item propio (sin descuento)
const calcularSubtotalItem = (item) => {
  return (item.unitPrice || 0) * (item.cantidadProducto || 0) * (item.cantidadJornada || 0)
}

// Calcular total de una fila propia considerando el descuento
const calcularTotalFila = (item) => {
  const sub = calcularSubtotalItem(item)
  const dsc = Number(item.descuentoPct) || 0
  return sub - (sub * dsc / 100)
}

// Totales de filas propias como computed para reactividad garantizada
const totalesFilasPropias = computed(() =>
  items.value.map(item => calcularTotalFila(item))
)

// Calcular total de una fila de tercero considerando el descuento.
// Usa subtotalVenta (precio venta × cantidad) calculado por el API.
// Fallback a precioUnitario × cantidad y luego a costoUnitario para datos legacy.
const calcularTotalFilaTercero = (item) => {
  let sub
  if (item.subtotalVenta != null) sub = item.subtotalVenta
  else if (item.precioUnitario != null) sub = item.precioUnitario * (item.cantidad || 1)
  else sub = (item.costoUnitario || 0) * (item.cantidad || 1)
  const dsc = Number(item.descuentoPct) || 0
  return sub - (sub * dsc / 100)
}

// Totales de filas terceros como computed para reactividad garantizada
const totalesFilasTerceros = computed(() =>
  itemsTerceros.value.map(item => calcularTotalFilaTercero(item))
)

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
  cotizacion.fechaCotizacion = new Date().toISOString().split('T')[0]
  cotizacion.agenteComercial = user.value.fullName

  // Restore draft only for new quotations (not edit mode)
  if (!id) restoreDraft()

  // Preseleccionar Unidad de Ejecución según la zona del usuario (solo en nueva cotización)
  // Se aplica después de restoreDraft para asegurar que el valor autodetectado prevalezca
  if (!id && user.value?.zona) {
    cotizacion.unidadEjecucion = user.value.zona.trim()
  }
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

// sincroniza clienteId (FK numérica) y listaPrecio cuando se selecciona un grupo de precios
watch(myClienteSeleccionado, (nuevoCliente) => {
  if (!nuevoCliente?.id) {
    cotizacion.clienteId   = null
    cotizacion.listaPrecio = ''
  } else if (nuevoCliente.id === 'cliente_directo') {
    cotizacion.clienteId   = null
    cotizacion.listaPrecio = 'cliente_directo'
  } else {
    cotizacion.clienteId   = Number(nuevoCliente.id)
    cotizacion.listaPrecio = nuevoCliente.name || ''
  }
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

    cotizacion.cliente             = data.cliente ? data.cliente.name : '';
    cotizacion.clienteId           = data.clienteId ?? null;
    cotizacion.listaPrecio         = data.listaPrecio || '';
    cotizacion.celular             = data.celular;
    cotizacion.empresa             = data.empresa;
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
    cotizacion.description         = data.description; 
    cotizacion.unidadEjecucion     = data.unidadEjecucion;
    cotizacion.tipoSuelo           = data.tipoSuelo;
    cotizacion.quotationStatusId   = data.quotationStatusId;
    cotizacion.createdById         = data.createdById; 
    cotizacion.agenteComercial     = data.agenteComercial; // ✅ ADDED
    cotizacion.fechaCotizacion     = data.fechaCotizacion ? data.fechaCotizacion.split('T')[0] : ''; // ✅ ADDED
    cotizacion.cantidadJornada     = data.cantidadJornada; // ✅ ADDED
    cotizacion.cantidadProducto    = data.cantidadProducto; // ✅ ADDED
    cotizacion.descuentoPct        = data.descuentoPct ?? 0;
    cotizacion.members             = data.members || []; // ✅ ADDED - Cargar colaboradores
    
    // ✅ SYNC ID — Esto evita que se creen duplicados al guardar
    quotationId.value = data.id;

    // Si hay un cliente de lista (Caja), sincronizar
    if (data.cliente) {
      cotizacion.cliente = data.cliente.name || '';
      myClienteSeleccionado.value = data.cliente;
    }
    
    // Si hay una empresa/cliente final
    if (data.empresa) {
      cotizacion.empresa = data.empresa;
    }
    
    // ✅ PRIORIZAR VERSIÓN RESTAURADA DESDE LOCALSTORAGE
    try {
      const activeVKey = `active_v_${id}`;
      const savedV = localStorage.getItem(activeVKey);
      
      if (savedV) {
        cotizacion.version = parseInt(savedV);
      } else {
        // Si no hay versión activa manual, calculamos el máximo historial
        const vRes = await getVersions(id);
        const allV = vRes.data || [];
        if (allV.length > 0) {
          cotizacion.version = Math.max(...allV.map(v => v.versionNumber));
        } else {
          cotizacion.version = 1;
        }
      }
    } catch (ve) {
      cotizacion.version = 1;
    }

    items.value = data.items.map(it => ({
      id:                it.id,
      productId:         it.productId || it.product?.id,
      nombre:            it.product?.nombre,
      category:          it.product?.categoria,
      dispositivo:       it.product?.dispositivo,
      descripcion:       it.product?.descripcion,
      estado:            it.product?.conditionStatus,
      incluyeTransporte: it.product?.incluyeTransporteBogMde,
      medidas:           it.product?.medidas,
      unitPrice:         it.unitPrice,
      linkFoto:          it.product?.linkFotoDispositivo,
      qMotores:          it.product?.qMotores,
      qOperarios:        it.product?.qOperarios,
      cantidadJornada:   it.cantidadJornada  ?? it.quantity ?? 1,
      cantidadProducto:  it.cantidadProducto ?? 1,
      descuentoPct:      typeof it.descuentoPct === 'number' ? it.descuentoPct : 0,
    }))

    // Cargar productos de terceros
    if (data.thirdPartyItems && data.thirdPartyItems.length > 0) {
      itemsTerceros.value = data.thirdPartyItems.map(it => ({
        id:                  it.id,
        catalogItemId:       it.catalogProductId || it.catalogProduct?.id,
        nombre:              it.catalogProduct?.nombre || it.catalogProduct?.dispositivo || it.nombre || it.dispositivo,
        dispositivo:         it.catalogProduct?.dispositivo || it.dispositivo,
        categoria:           it.catalogProduct?.categoria || it.categoria,
        descripcion:         it.catalogProduct?.descripcion || it.descripcion,
        cantidad:            it.cantidad ?? 1,
        costoUnitario:       it.costoUnitario ?? 0,
        margenVariable:      it.margenVariable ?? 0,
        precioUnitario:      it.precioUnitario ?? 0,
        subtotalVenta:       it.precioUnitario != null ? it.precioUnitario * (it.cantidad ?? 1) : 0,
        descuentoPct:        it.descuento ?? 0,
        comisionPct:         it.comisionPct ?? 0,
        comisionMonto:       it.comisionMonto ?? 0,
        total:               it.total ?? 0,
        incluyeTransporte:   it.catalogProduct?.incluyeTransporteBogMde ?? false,
      }))
    }

    console.log("Cotización cargada para edición:", data);
  } catch (error) {
    console.error("Error al cargar cotización", error);
  }
}

/** 
 * Maneja la restauración de una versión específica 
 */
const handleVersionRestored = async (vNum) => {
  if (!id) return;
  // Guardamos en localStorage para que el indicador lo respete tras el refresco
  localStorage.setItem(`active_v_${id}`, vNum.toString());
  
  showVersionsHistory.value = false;
  await getCotizacion();
}

onMounted(getCotizacion)

// Helper para formatear fechas
const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const eliminarItem = (item) => {
  if (confirm(`¿Seguro que deseas eliminar el producto "${item.nombre || item.descripcion || item.dispositivo}"?`)) {
    // Use reference equality (indexOf) so it works for unsaved items that have no id yet.
    const idx = items.value.indexOf(item)
    if (idx !== -1) {
      items.value.splice(idx, 1)
    }
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
  cotizacion.fechaCotizacion = new Date().toISOString().split('T')[0]
  cotizacion.agenteComercial = user.value.fullName
}

const pasos = [
  { num: 1, label: 'Cliente'  },
  { num: 2, label: 'Evento'   },
  { num: 3, label: 'Equipos'  },
  { num: 4, label: 'Resumen'  },
]

watch(pasoActual, () => {
  // Intentar scroll en window y fallbacks (estándar)
  window.scrollTo({ top: 0, behavior: 'smooth' })
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0

  // Intentar scroll en el contenedor principal del layout (.page-content)
  const container = document.querySelector('.page-content')
  if (container) {
    container.scrollTo({ top: 0, behavior: 'smooth' })
    container.scrollTop = 0
  }
}, { flush: 'post' })

const irAPaso = (n) => {
  pasoActual.value = n
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

// ── Notas de la cotización ──────────────────────────────────────────────────
const notas = ref([])
const notaGuardando = ref(false)
const notaNueva = ref({ contenido: '', area: '' })

const cargarNotas = async () => {
  if (!id) return
  try {
    notas.value = await getNotasByCotizacion(Number(id))
  } catch (e) {
    console.error('[Cotizar] Error cargando notas:', e)
  }
}

const agregarNota = async () => {
  if (!notaNueva.value.contenido.trim() || !notaNueva.value.area) return
  notaGuardando.value = true
  try {
    await createNotaCotizacion({
      contenido: notaNueva.value.contenido.trim(),
      area: notaNueva.value.area,
      cotizacionId: Number(id),
    })
    notaNueva.value = { contenido: '', area: '' }
    await cargarNotas()
  } catch (e) {
    console.error('[Cotizar] Error al agregar nota:', e)
  } finally {
    notaGuardando.value = false
  }
}

const eliminarNota = async (notaId) => {
  if (!confirm('¿Eliminar esta nota?')) return
  try {
    await deleteNotaCotizacion(notaId)
    notas.value = notas.value.filter((n) => n.id !== notaId)
  } catch (e) {
    console.error('[Cotizar] Error al eliminar nota:', e)
  }
}

onMounted(cargarNotas)

// ── Notas dentro del modal de creación exitosa ──────────────────────────────
const notasModal = ref([])
const notaModalGuardando = ref(false)
const notaModal = ref({ contenido: '', area: '' })

const agregarNotaModal = async () => {
  if (!notaModal.value.contenido.trim() || !notaModal.value.area) return
  notaModalGuardando.value = true
  try {
    const creada = await createNotaCotizacion({
      contenido: notaModal.value.contenido.trim(),
      area: notaModal.value.area,
      cotizacionId: Number(quotationId.value),
    })
    notasModal.value.push(creada)
    notaModal.value = { contenido: '', area: '' }
  } catch (e) {
    console.error('[Cotizar] Error al agregar nota en modal:', e)
  } finally {
    notaModalGuardando.value = false
  }
}

// Limpia el estado del modal de notas cuando se abre
watch(modalCotizacionExitosa, (val) => {
  if (val) {
    notasModal.value = []
    notaModal.value = { contenido: '', area: '' }
  }
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
  gap: 12px;
  flex-wrap: wrap;
}

/* Badge de versión mejorado */
.version-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #054EAF 0%, #0A3D8F 100%);
  padding: 8px 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(5, 78, 175, 0.2);
}

.version-label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: 'Inter', sans-serif;
}

.version-number {
  font-size: 20px;
  font-weight: 800;
  color: #FFFFFF;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  min-width: 28px;
  text-align: center;
}

.btn-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Inter', sans-serif;
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn--ghost {
  background: #F1F5F9;
  color: #475569;
  border: 1px solid #E2E8F0;
}

.action-btn--ghost:hover {
  background: #E2E8F0;
  border-color: #CBD5E1;
  transform: translateY(-1px);
}

.action-btn--update {
  background: linear-gradient(135deg, #054EAF 0%, #0A3D8F 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(5, 78, 175, 0.25);
}

.action-btn--update:hover {
  background: linear-gradient(135deg, #03368A 0%, #072D6F 100%);
  box-shadow: 0 6px 16px rgba(5, 78, 175, 0.35);
  transform: translateY(-2px);
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
.eq-table .td-name  { font-weight: 500; max-width: 200px; }
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

/* Panel lateral información */
.info-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.info-label {
  font-size: 12px;
  color: #64748B;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
}

.info-value {
  font-size: 12px;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  text-align: right;
}

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
.btn-next:hover    { background: #03368A; }
.btn-next:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-next:disabled:hover { background: #054EAF; }

/* Tooltip sobre el botón Siguiente cuando está deshabilitado */
.btn-next-wrap { position: relative; }
.btn-next-wrap[data-tip]:hover::after {
  content: attr(data-tip);
  position: absolute;
  bottom: calc(100% + 9px);
  right: 0;
  background: #0F1A2E;
  color: white;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  padding: 7px 12px;
  border-radius: 8px;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 4px 14px rgba(15, 26, 46, 0.22);
  z-index: 200;
}
.btn-next-wrap[data-tip]:hover::before {
  content: '';
  position: absolute;
  bottom: calc(100% + 3px);
  right: 20px;
  border: 5px solid transparent;
  border-top-color: #0F1A2E;
  pointer-events: none;
  z-index: 200;
}

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
  gap: 10px;
  padding: 48px 24px;
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
/* ── Barra de totales financieros ────────────────────────── */
.fin-bar {
  display: flex;
  align-items: stretch;
  background: linear-gradient(135deg, #054EAF 0%, #0B6BDB 100%);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(5, 78, 175, 0.30), 0 1px 4px rgba(0,0,0,0.12);
  border: 1px solid rgba(255,255,255,0.12);
  margin-bottom: 24px;
}

.fin-bar-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  padding: 20px 24px;
  justify-content: center;
}

.fin-bar-item--total {
  background: rgba(0,0,0,0.18);
  border-left: 1px solid rgba(255,255,255,0.12);
  text-align: right;
  flex: 0 0 auto;
  min-width: 220px;
  padding: 20px 32px;
}

.fin-bar-sep {
  width: 1px;
  background: rgba(255,255,255,0.10);
  flex-shrink: 0;
  margin: 14px 0;
}

.fin-bar-lbl {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.10em;
  color: rgba(186, 210, 255, 0.75);
  white-space: nowrap;
  font-family: 'Inter', sans-serif;
}

.fin-bar-lbl--total {
  color: #93C5FD;
}

.fin-bar-val {
  font-size: 16px;
  font-weight: 700;
  color: #F1F5F9;
  white-space: nowrap;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.fin-bar-val--disc { color: #FCA5A5; }
.fin-bar-val--iva  { color: #7DD3FC; }

.fin-bar-val--total {
  font-size: 26px;
  font-weight: 800;
  color: #FFFFFF;
  font-family: 'Plus Jakarta Sans', sans-serif;
  text-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

@media (max-width: 900px) {
  .fin-bar {
    flex-wrap: wrap;
  }
  .fin-bar-item {
    flex: 0 0 calc(50% - 1px);
    padding: 16px 20px;
  }
  .fin-bar-sep { display: none; }
  .fin-bar-item--total {
    flex: 0 0 100%;
    border-left: none;
    border-top: 1px solid rgba(255,255,255,0.10);
    text-align: left;
    min-width: unset;
    padding: 16px 20px;
  }
  .fin-bar-val--total { font-size: 22px; }
}

.price-list-badge, .client-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.price-list-badge {
  background: #ECFDF5;
  border: 1px solid #10B981;
  color: #047857;
}

.client-badge {
  background: #EFF6FF;
  border: 1px solid #3B82F6;
  color: #1D4ED8;
}

.j-bet {
  justify-content: space-between;
}

.cart-row--tercero {
  background: #F0F9FF;
  border-left: 3px solid #0EA5E9;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 4px;
}
.inline-icon {
  display: inline-block;
  vertical-align: middle;
  margin-right: 4px;
  color: #0EA5E9;
}

/* ═══════════════════════════════════════════════════════════
   SHARED TABLE STYLES (prd-table system)
   Mirrors QuotationProductsCardList to make tables consistent
   in Paso 3 (third-party) and Paso 4 (summary) tables.
═══════════════════════════════════════════════════════════ */

.prd-table-card {
  background: #FFFFFF;
  border-radius: 18px;
  border: 1px solid #E2EBF6;
  box-shadow: 0 1px 4px rgba(5, 78, 175, .06), 0 4px 16px rgba(5, 78, 175, .08);
  overflow: hidden;
}

.prd-table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.prd-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
  min-width: 760px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
}

.prd-table thead tr {
  background: #F8FAFC;
  border-bottom: 1px solid #E2EBF6;
}

.prd-table th {
  padding: 10px 16px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  text-align: left;
  white-space: nowrap;
}

.prd-table th.th-num     { width: 40px; text-align: center; }
.prd-table th.th-img     { width: 72px; }
.prd-table th.th-right   { text-align: right; }
.prd-table th.th-center  { text-align: center; }
.prd-table th.th-product { width: 240px; min-width: 240px; }

.prd-table td {
  padding: 13px 16px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #475569;
  border-bottom: 1px solid #F1F5FA;
  vertical-align: middle;
}

.prd-table tbody tr:last-child td { border-bottom: none; }

.prd-row {
  cursor: pointer;
  transition: background 0.15s ease;
}
.prd-row:hover { background: #F0F7FF; }

.prd-row-view { transition: background 0.15s ease; }
.prd-row-view:hover { background: #F8FAFC; }

.td-num {
  text-align: center;
  color: #94A3B8;
  font-size: 11px;
  font-weight: 600;
  width: 40px;
}

.td-img {
  width: 72px;
  padding-top: 8px;
  padding-bottom: 8px;
}

.prd-thumb {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #E5EAF0;
  display: block;
  background: #F1F5F9;
}

.td-name  { min-width: 160px; }
.td-right { text-align: right; white-space: nowrap; }
.td-center { text-align: center; white-space: nowrap; }

.prd-nombre {
  font-weight: 500;
  color: #0F1A2E;
  margin: 0;
  line-height: 1.4;
}
.prd-cat {
  font-size: 11px;
  color: #94A3B8;
  margin: 2px 0 0;
}

.prd-qty {
  font-size: 12px;
  font-weight: 500;
  color: #64748B;
  background: #F1F5F9;
  padding: 2px 8px;
  border-radius: 99px;
  white-space: nowrap;
}

.prd-price { color: #374151; font-weight: 500; }
.prd-total { font-weight: 700; color: #054EAF; }

/* Input de descuento */
.prd-discount-input {
  width: 60px;
  padding: 4px 8px;
  font-size: 12px;
  font-family: 'Inter', sans-serif;
  color: #0F1A2E;
  background: #F8FAFC;
  border: 1px solid #E5EAF0;
  border-radius: 99px;
  text-align: center;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

/* Spinner de carga */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spin {
  animation: spin 1s linear infinite;
}

.prd-discount-input:focus {
  border-color: #054EAF;
  box-shadow: 0 0 0 2px rgba(5, 78, 175, 0.12);
}
.prd-discount-input::-webkit-outer-spin-button,
.prd-discount-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.prd-action-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #94A3B8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.prd-action-btn:hover {
  background: var(--hbg);
  color: var(--hc);
}

.prd-subtotal-row {
  background: #F0F6FF;
  border-top: 2px solid #D1DAE6;
}
.prd-subtotal-row td {
  border-bottom: none;
  padding: 10px 16px;
}
.td-subtotal-label {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-family: 'Inter', sans-serif;
  text-align: right;
}
.td-subtotal-val {
  font-size: 14px;
  font-weight: 800;
  color: #054EAF;
  text-align: right;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}

/* ═══════════════════════════════════════════════════════════
   NOTAS DE COTIZACIÓN
═══════════════════════════════════════════════════════════ */
.notas-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.nota-row {
  background: #F8FAFC;
  border: 1px solid #E5EAF0;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nota-area-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 10px;
  border-radius: 99px;
  width: fit-content;
  font-family: 'Inter', sans-serif;
}
.nota-area-badge[data-area="Comercial"]       { background: #DBEAFE; color: #1D4ED8; }
.nota-area-badge[data-area="Operativo"]       { background: #D1FAE5; color: #065F46; }
.nota-area-badge[data-area="Administrativo"]  { background: #FEF3C7; color: #92400E; }
.nota-area-badge[data-area="Logístico"]       { background: #EDE9FE; color: #5B21B6; }

.nota-contenido {
  font-size: 13px;
  color: #374151;
  font-family: 'Inter', sans-serif;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.nota-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.nota-fecha {
  font-size: 11px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
}

.nota-delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #CBD5E1;
  display: flex;
  align-items: center;
  padding: 2px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
}
.nota-delete-btn:hover {
  color: #B91C1C;
  background: #FEE2E2;
}

.notas-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 24px 0 16px;
  color: #94A3B8;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
}
.notas-empty-ico { color: #CBD5E1; }

.nota-form {
  border-top: 1px solid #EEF1F7;
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nota-form-row {
  display: flex;
  gap: 10px;
}

.nota-textarea {
  width: 100%;
  background: #F8FAFC;
  border: 1px solid #E5EAF0;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13px;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  outline: none;
  resize: vertical;
  transition: border-color 0.15s, box-shadow 0.15s;
  line-height: 1.5;
}
.nota-textarea:focus {
  border-color: #054EAF;
  box-shadow: 0 0 0 2px rgba(5, 78, 175, 0.12);
}
.nota-textarea::placeholder { color: #94A3B8; }

.nota-add-btn {
  align-self: flex-end;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  background: #054EAF;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}
.nota-add-btn:hover:not(:disabled) { background: #03368A; }
.nota-add-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* ═══════════════════════════════════════════════════════════
   MODAL COTIZACIÓN EXITOSA
═══════════════════════════════════════════════════════════ */
.modal-exitosa {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 360px;
}

.modal-exitosa-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}

.modal-exitosa-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #DCFCE7;
  color: #16A34A;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-exitosa-title {
  font-size: 18px;
  font-weight: 700;
  color: #0F1A2E;
  font-family: 'Plus Jakarta Sans', sans-serif;
  margin: 0;
  line-height: 1.3;
}

.modal-exitosa-sub {
  font-size: 13px;
  color: #64748B;
  font-family: 'Inter', sans-serif;
  margin: 0;
}

.modal-notas-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 180px;
  overflow-y: auto;
  padding-right: 4px;
}

.modal-nota-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #F8FAFC;
  border: 1px solid #E5EAF0;
  border-radius: 14px;
  padding: 16px;
}

.modal-exitosa-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 16px;
  border-top: 1px solid #EEF1F7;
}

.modal-btn {
  padding: 9px 20px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Inter', sans-serif;
  line-height: 1.4;
}

.modal-btn--secondary {
  background: #F1F5F9;
  color: #64748B;
  border: 1px solid #E5EAF0;
}

.modal-btn--secondary:hover {
  background: #E5EAF0;
}

.modal-btn--primary {
  background: #054EAF;
  color: #FFFFFF;
  box-shadow: 0 2px 8px rgba(5, 78, 175, 0.18);
}

.modal-btn--primary:hover {
  background: #03368A;
}
</style>
