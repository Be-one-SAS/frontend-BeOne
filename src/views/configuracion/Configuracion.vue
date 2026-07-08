<template>
  <div class="cfg-page">

    <div class="cfg-header">
      <h1 class="cfg-title">Configuración</h1>
      <p class="cfg-subtitle">Gestión de la organización e importación masiva de datos</p>
    </div>

    <!-- Módulos de configuración -->
    <div class="cfg-modules">
      <RouterLink to="/configuracion/unidades-ejecucion" class="cfg-module-card">
        <div class="cfg-module-icon">🏢</div>
        <div>
          <p class="cfg-module-title">Unidades de Ejecución</p>
          <p class="cfg-module-desc">Gestión de equipos, visibilidad financiera y estructura organizacional</p>
        </div>
        <span class="cfg-module-arrow">→</span>
      </RouterLink>
      <RouterLink to="/admin/quotation-params" class="cfg-module-card">
        <div class="cfg-module-icon">⚙️</div>
        <div>
          <p class="cfg-module-title">Parámetros de cotización</p>
          <p class="cfg-module-desc">Configura los parámetros, variables y valores por defecto de cotizaciones</p>
        </div>
        <span class="cfg-module-arrow">→</span>
      </RouterLink>
      <RouterLink to="/configuracion/comisiones" class="cfg-module-card">
        <div class="cfg-module-icon">💰</div>
        <div>
          <p class="cfg-module-title">Comisiones</p>
          <p class="cfg-module-desc">Reporte de comisiones, utilidad y margen por cotización</p>
        </div>
        <span class="cfg-module-arrow">→</span>
      </RouterLink>
      <RouterLink to="/configuracion/documentacion" class="cfg-module-card">
        <div class="cfg-module-icon">📖</div>
        <div>
          <p class="cfg-module-title">Documentación</p>
          <p class="cfg-module-desc">Guía de referencia: qué hace cada módulo del sistema y cómo funciona</p>
        </div>
        <span class="cfg-module-arrow">→</span>
      </RouterLink>
    </div>

    <div class="cfg-section-label">Configuración general</div>
    <div class="cfg-card">
      <div class="cfg-field-row">
        <div>
          <p class="cfg-field-title">Número inicial de cotizaciones</p>
          <p class="cfg-field-desc">
            Define desde qué número deben iniciar las cotizaciones nuevas. Si ya existen cotizaciones
            este año con un número mayor, ese valor prevalece — este campo nunca genera números duplicados.
          </p>
        </div>
        <div class="cfg-field-control">
          <input
            v-model.number="startNumberEdited"
            type="number"
            min="1"
            class="cfg-input"
            :disabled="numberingLoading || numberingSaving"
          />
          <button
            class="cfg-btn-save"
            :disabled="numberingLoading || numberingSaving || startNumberEdited === startNumberSaved"
            @click="saveStartNumber"
          >
            {{ numberingSaving ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </div>
      <p v-if="numberingSaved" class="cfg-field-saved">Guardado — la próxima cotización usará este valor como referencia.</p>
      <p v-if="numberingError" class="cfg-field-error">{{ numberingError }}</p>
    </div>

    <div class="cfg-section-label">Acceso a vistas por rol</div>
    <div class="cfg-card">
      <div class="rva-intro">
        <p class="cfg-field-desc" style="max-width: 100%; margin: 0;">
          Define qué vistas puede ver y abrir cada rol desde el menú. <strong>ADMIN siempre tiene acceso a todo</strong>
          y no es editable — así nadie puede quedar bloqueado fuera de esta pantalla. Esto controla la navegación
          del frontend, no cambia los permisos reales de la API.
        </p>
        <div class="rva-intro-actions">
          <button type="button" class="rva-link-btn" @click="setAllGroupsOpen(true)">Expandir todo</button>
          <span class="rva-intro-sep">·</span>
          <button type="button" class="rva-link-btn" @click="setAllGroupsOpen(false)">Contraer todo</button>
        </div>
      </div>

      <p v-if="viewAccessLoading" class="cfg-field-desc">Cargando…</p>

      <template v-else>
        <div class="rva-groups">
          <div v-for="group in groupedViews" :key="group.name" class="rva-group" :class="{ 'rva-group--open': openGroups.has(group.name) }">
            <button type="button" class="rva-group-header" @click="toggleGroup(group.name)">
              <ChevronDown :size="15" class="rva-group-chevron" />
              <span class="rva-group-name">{{ group.name }}</span>
              <span class="rva-group-count">{{ group.views.length }}</span>
            </button>

            <div v-show="openGroups.has(group.name)" class="rva-table-scroll">
              <table class="rva-table">
                <thead>
                  <tr>
                    <th class="rva-th-label">Vista</th>
                    <th class="rva-th-role rva-th-admin">ADMIN</th>
                    <th v-for="role in viewAccessRoles" :key="role" class="rva-th-role">{{ role }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="view in group.views" :key="view.key" class="rva-row">
                    <td class="rva-label">{{ view.label }}</td>
                    <td class="rva-cell rva-cell--admin">
                      <input type="checkbox" checked disabled title="ADMIN siempre tiene acceso" />
                    </td>
                    <td v-for="role in viewAccessRoles" :key="role" class="rva-cell">
                      <input
                        type="checkbox"
                        :checked="view.roles.includes(role)"
                        @change="toggleViewRole(view, role, $event.target.checked)"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="cfg-field-control" style="margin-top: 14px;">
          <button type="button" class="cfg-btn-save" :disabled="viewAccessSaving || !viewAccessDirty" @click="saveViewAccess">
            {{ viewAccessSaving ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
        <p v-if="viewAccessSaved" class="cfg-field-saved">Guardado.</p>
        <p v-if="viewAccessError" class="cfg-field-error">{{ viewAccessError }}</p>
      </template>
    </div>

    <ConfirmModal
      :show="showViewAccessSelfLockConfirm"
      title="¿Guardar de todas formas?"
      message="Estás por quitarle a tu propio rol el acceso a esta vista (Configuración general). Si continúas, es posible que no puedas volver a entrar aquí para deshacerlo — tendría que hacerlo un ADMIN."
      confirm-label="Sí, guardar de todas formas"
      cancel-label="Cancelar"
      @confirm="() => { showViewAccessSelfLockConfirm = false; doSaveViewAccess() }"
      @cancel="showViewAccessSelfLockConfirm = false"
    />

    <div class="cfg-section-label">Encabezado del PDF de cotización</div>
    <div class="cfg-card">
      <!-- Logo -->
      <div class="cfg-field-row">
        <div>
          <p class="cfg-field-title">Logo</p>
          <p class="cfg-field-desc">Aparece a la izquierda del encabezado. Sin uno propio, se usa el logo predeterminado de BeOne.</p>
        </div>
        <div class="cfg-field-control">
          <div class="pdfh-logo-preview" @click="logoFileInput?.click()">
            <img v-if="pdfHeaderConfig.logo?.url" :src="pdfHeaderConfig.logo.url" alt="Logo" />
            <span v-else class="pdfh-logo-placeholder">Predeterminado</span>
          </div>
          <input ref="logoFileInput" type="file" accept="image/*" style="display:none" @change="onLogoFileChange" />
          <button type="button" class="cfg-btn-save" :disabled="logoUploading" @click="logoFileInput?.click()">
            {{ logoUploading ? 'Subiendo…' : 'Cambiar logo' }}
          </button>
        </div>
      </div>
      <p v-if="logoError" class="cfg-field-error">{{ logoError }}</p>

      <div class="cfg-divider" />

      <!-- Logos de certificación (patrón del medio) -->
      <div class="cfg-field-row">
        <div>
          <p class="cfg-field-title">Logos de certificación</p>
          <p class="cfg-field-desc">Se muestran en el centro del encabezado, sobre el patrón ondulado (ese patrón no es editable).</p>
        </div>
      </div>

      <div class="pdfh-partners-list">
        <p v-if="!pdfHeaderConfig.partners.length" class="pdfh-partners-empty">Sin logos agregados todavía.</p>
        <div v-for="(p, idx) in pdfHeaderConfig.partners" :key="p.id" class="pdfh-partner-row">
          <img :src="p.imageUrl" :alt="p.nombre" class="pdfh-partner-thumb" />
          <span class="pdfh-partner-name">{{ p.nombre }}</span>
          <div class="pdfh-partner-actions">
            <button type="button" class="pdfh-partner-btn" :disabled="idx === 0" @click="movePartner(idx, -1)" title="Subir">↑</button>
            <button type="button" class="pdfh-partner-btn" :disabled="idx === pdfHeaderConfig.partners.length - 1" @click="movePartner(idx, 1)" title="Bajar">↓</button>
            <button type="button" class="pdfh-partner-btn pdfh-partner-btn--danger" :disabled="partnerRemovingId === p.id" @click="removePartner(p.id)" title="Eliminar">✕</button>
          </div>
        </div>
      </div>

      <div class="pdfh-partner-add">
        <input v-model="newPartnerName" type="text" class="cfg-input" placeholder="Nombre (ej: IAAPA)" />
        <input ref="partnerFileInput" type="file" accept="image/*" style="display:none" @change="onPartnerFileChange" />
        <button type="button" class="cfg-btn-save" :disabled="!newPartnerName.trim() || partnerUploading" @click="partnerFileInput?.click()">
          {{ partnerUploading ? 'Subiendo…' : '+ Agregar logo' }}
        </button>
      </div>
      <p v-if="partnerError" class="cfg-field-error">{{ partnerError }}</p>

      <div class="cfg-divider" />

      <!-- Datos de contacto y red social -->
      <div class="cfg-field-row">
        <div>
          <p class="cfg-field-title">Datos de contacto y red social</p>
          <p class="cfg-field-desc">Se muestran a la derecha del encabezado.</p>
        </div>
      </div>
      <div class="pdfh-contacto-grid">
        <div class="pdfh-contacto-field">
          <label class="pdfh-lbl">Ciudad</label>
          <input v-model="contactoForm.ciudad" type="text" class="cfg-input" />
        </div>
        <div class="pdfh-contacto-field">
          <label class="pdfh-lbl">Dirección</label>
          <input v-model="contactoForm.direccion" type="text" class="cfg-input" />
        </div>
        <div class="pdfh-contacto-field">
          <label class="pdfh-lbl">PBX</label>
          <input v-model="contactoForm.pbx" type="text" class="cfg-input" />
        </div>
        <div class="pdfh-contacto-field">
          <label class="pdfh-lbl">Celular</label>
          <input v-model="contactoForm.celular" type="text" class="cfg-input" />
        </div>
        <div class="pdfh-contacto-field">
          <label class="pdfh-lbl">Instagram</label>
          <input v-model="contactoForm.instagram" type="text" class="cfg-input" />
        </div>
      </div>
      <div class="cfg-field-control" style="margin-top: 10px;">
        <button type="button" class="cfg-btn-save" :disabled="contactoSaving" @click="saveContacto">
          {{ contactoSaving ? 'Guardando…' : 'Guardar' }}
        </button>
      </div>
      <p v-if="contactoSaved" class="cfg-field-saved">Guardado.</p>
      <p v-if="contactoError" class="cfg-field-error">{{ contactoError }}</p>
    </div>

    <div class="cfg-section-label">Banner del Dashboard</div>
    <div class="cfg-card">
      <div class="cfg-field-row">
        <div>
          <p class="cfg-field-title">Imagen de fondo</p>
          <p class="cfg-field-desc">
            Aparece de fondo en el saludo de /dashboard. Se le aplica una capa oscura automática para
            que el texto siga siendo legible encima, sin importar la imagen.
          </p>
        </div>
        <div class="cfg-field-control">
          <div class="pdfh-logo-preview banner-preview" @click="bannerFileInput?.click()">
            <img v-if="dashboardBannerConfig.image?.url" :src="dashboardBannerConfig.image.url" alt="Banner" />
            <span v-else class="pdfh-logo-placeholder">Sin imagen</span>
          </div>
          <input ref="bannerFileInput" type="file" accept="image/*" style="display:none" @change="onBannerFileChange" />
          <button type="button" class="cfg-btn-save" :disabled="bannerUploading" @click="bannerFileInput?.click()">
            {{ bannerUploading ? 'Subiendo…' : 'Cambiar imagen' }}
          </button>
          <button
            v-if="dashboardBannerConfig.image?.url"
            type="button"
            class="cfg-btn-remove"
            :disabled="bannerUploading"
            @click="removeBannerImage"
          >
            Quitar
          </button>
        </div>
      </div>
      <p v-if="bannerError" class="cfg-field-error">{{ bannerError }}</p>

      <div class="cfg-divider" />

      <div class="cfg-field-row">
        <div>
          <p class="cfg-field-title">Mensaje motivacional</p>
          <p class="cfg-field-desc">Se muestra en grande, centrado, sobre el banner.</p>
        </div>
        <div class="cfg-field-control">
          <input v-model="bannerMessageEdited" type="text" maxlength="200" class="cfg-input banner-message-input" />
          <button type="button" class="cfg-btn-save" :disabled="bannerMessageSaving || bannerMessageEdited === dashboardBannerConfig.message" @click="saveBannerMessage">
            {{ bannerMessageSaving ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </div>
      <p v-if="bannerMessageSaved" class="cfg-field-saved">Guardado.</p>
      <p v-if="bannerMessageError" class="cfg-field-error">{{ bannerMessageError }}</p>
    </div>

    <div class="cfg-section-label">Importación masiva</div>
    <div class="cfg-grid">
      <ImportCard
        title="Clientes"
        description="Importa clientes directos e indirectos desde un archivo Excel."
        :columns="clientesCols"
        :loading="states.clientes.loading"
        :result="states.clientes.result"
        :error="states.clientes.error"
        @import="file => runImport('clientes', file)"
        @reset="resetState('clientes')"
      />

      <ImportCard
        title="Productos"
        description="Importa el catálogo de productos propios. Crea automáticamente las cajas de precios por lista."
        :columns="productosCols"
        :loading="states.productos.loading"
        :result="states.productos.result"
        :error="states.productos.error"
        @import="file => runImport('productos', file)"
        @reset="resetState('productos')"
      />

      <ImportCard
        title="Proveedores"
        description="Importa el directorio de proveedores externos."
        :columns="proveedoresCols"
        :loading="states.proveedores.loading"
        :result="states.proveedores.result"
        :error="states.proveedores.error"
        @import="file => runImport('proveedores', file)"
        @reset="resetState('proveedores')"
      />
    </div>

    <template v-if="hasRole('ADMIN')">
      <div class="cfg-section-label cfg-section-label--danger">Zona peligrosa</div>
      <div class="cfg-card cfg-card--danger">
        <div class="cfg-field-row">
          <div>
            <p class="cfg-field-title">Backup del sistema</p>
            <p class="cfg-field-desc">
              Descarga un .zip con el volcado completo de la base de datos, un volcado
              separado por cada tabla, y todos los archivos subidos (documentos/imágenes en R2).
            </p>
          </div>
          <div class="cfg-field-control">
            <button class="cfg-btn-backup" :disabled="backupLoading" @click="downloadBackup">
              {{ backupLoading ? 'Generando…' : 'Descargar backup' }}
            </button>
          </div>
        </div>
        <p v-if="backupDoneAt" class="cfg-field-saved">
          Backup descargado a las {{ backupDoneAt }} — ya puedes eliminar los productos.
        </p>
        <p v-if="backupError" class="cfg-field-error">{{ backupError }}</p>

        <p v-if="!backupConfigured" class="cfg-field-desc cfg-backup-warning">
          Backup automático no configurado — falta la variable R2_BACKUP_BUCKET en el servidor.
          El botón manual de arriba funciona igual, pero no hay respaldo nocturno automático.
        </p>
        <div v-else-if="backupHistory.length" class="cfg-backup-history">
          <p class="cfg-field-desc" style="margin-bottom: 6px;">Últimos backups automáticos:</p>
          <div v-for="(h, i) in backupHistory.slice(0, 5)" :key="i" class="cfg-backup-history-row">
            <span :class="['cfg-backup-status', h.status === 'SUCCESS' ? 'ok' : 'fail']">
              {{ h.status === 'SUCCESS' ? '✓' : '✗' }}
            </span>
            <span>{{ formatBackupDate(h.at) }}</span>
            <span class="cfg-backup-history-trigger">{{ h.trigger === 'MANUAL' ? 'manual' : 'automático' }}</span>
            <span v-if="h.sizeBytes">{{ formatBackupSize(h.sizeBytes) }}</span>
            <span v-if="h.error" class="cfg-field-error" style="margin:0;">{{ h.error }}</span>
          </div>
        </div>

        <div class="cfg-danger-divider" />

        <div class="cfg-field-row">
          <div>
            <p class="cfg-field-title">Eliminar todos los productos</p>
            <p class="cfg-field-desc">
              Borra permanentemente todos los productos propios y de terceros, junto con sus
              ítems de cotización, órdenes de compra ligadas, reservas y auditoría de inventario.
              Las cotizaciones, facturas y pagos no se eliminan. Requiere haber descargado un
              backup en esta sesión.
            </p>
          </div>
          <div class="cfg-field-control">
            <button
              class="cfg-btn-danger"
              :disabled="!backupDoneAt"
              :title="!backupDoneAt ? 'Descarga un backup primero' : ''"
              @click="showPurgeModal = true"
            >
              Eliminar todos los productos
            </button>
          </div>
        </div>
        <p v-if="purgeResult" class="cfg-field-saved">
          Eliminado — productos: {{ purgeResult.products }}, productos de terceros: {{ purgeResult.thirdPartyCatalogProduct }},
          ítems de cotización: {{ purgeResult.quotationItem + purgeResult.thirdPartyQuotationItem }},
          órdenes de compra: {{ purgeResult.ordenCompra }}.
        </p>
      </div>
    </template>

    <ConfirmModal
      :show="showConfirmModal"
      title="¿Cambiar número inicial de cotización?"
      :message="`Vas a cambiar el número inicial de cotización de ${startNumberSaved} a ${startNumberEdited}.`"
      confirm-label="Sí, cambiar"
      cancel-label="Cancelar"
      @confirm="confirmSaveStartNumber"
      @cancel="cancelSaveStartNumber"
    />

    <PurgeConfirmModal
      :show="showPurgeModal"
      title="¿Eliminar todos los productos?"
      message="Esta acción es irreversible: borra productos, ítems de cotización, órdenes de compra ligadas, reservas y logs de inventario/escaneo asociados."
      :loading="purgeLoading"
      :error="purgeError"
      @confirm="confirmPurge"
      @cancel="showPurgeModal = false"
    />
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import ImportCard from '@/components/configuracion/ImportCard.vue'
import ConfirmModal from '@/components/modal/ConfirmModal.vue'
import PurgeConfirmModal from '@/components/modal/PurgeConfirmModal.vue'
import { usePermissions } from '@/composables/usePermissions'
import api from '@/services/api'
import { ChevronDown } from 'lucide-vue-next'

const { hasRole, activeRoles } = usePermissions()

// ── Acceso a vistas por rol ──────────────────────────────────────────────
const viewAccessViews    = ref([])  // [{ key, label, group, roles }]
const viewAccessRoles    = ref([])  // roles configurables (sin ADMIN, siempre implícito)
const viewAccessLoading  = ref(false)
const viewAccessSaving   = ref(false)
const viewAccessSaved    = ref(false)
const viewAccessDirty    = ref(false)
const viewAccessError    = ref('')
const showViewAccessSelfLockConfirm = ref(false)

const groupedViews = computed(() => {
  const groups = []
  const byName = new Map()
  for (const view of viewAccessViews.value) {
    if (!byName.has(view.group)) {
      const g = { name: view.group, views: [] }
      byName.set(view.group, g)
      groups.push(g)
    }
    byName.get(view.group).views.push(view)
  }
  return groups
})

// Grupos abiertos por defecto — Principal/Comercial/Operativo son los de uso
// diario; el resto arranca contraído para que la pantalla no sea un muro de
// checkboxes. Se puede expandir/contraer cualquiera, o todos de una.
const DEFAULT_OPEN_GROUPS = ['Principal', 'Comercial', 'Operativo']
const openGroups = ref(new Set(DEFAULT_OPEN_GROUPS))
const toggleGroup = (name) => {
  const next = new Set(openGroups.value)
  next.has(name) ? next.delete(name) : next.add(name)
  openGroups.value = next
}
const setAllGroupsOpen = (open) => {
  openGroups.value = open ? new Set(groupedViews.value.map(g => g.name)) : new Set()
}

async function fetchRoleViewAccess() {
  viewAccessLoading.value = true
  viewAccessError.value = ''
  try {
    const { data } = await api.get('/app-config/role-view-access')
    viewAccessViews.value = data.views.map(v => ({ ...v, roles: [...v.roles] }))
    viewAccessRoles.value = data.allRoles
  } catch (e) {
    viewAccessError.value = 'No se pudo cargar la configuración de accesos'
  } finally {
    viewAccessLoading.value = false
  }
}
onMounted(fetchRoleViewAccess)

function toggleViewRole(view, role, checked) {
  if (checked) {
    if (!view.roles.includes(role)) view.roles.push(role)
  } else {
    view.roles = view.roles.filter(r => r !== role)
  }
  viewAccessDirty.value = true
  viewAccessSaved.value = false
}

function saveViewAccess() {
  // Salvaguarda: si el usuario actual no es ADMIN y está a punto de quitarle
  // a su propio rol el acceso a "Configuración general", confirma antes —
  // de lo contrario podría no poder volver a entrar aquí a corregirlo.
  const configView = viewAccessViews.value.find(v => v.key === 'Configuracion')
  const wouldSelfLock = !activeRoles.value.includes('ADMIN') && configView &&
    !activeRoles.value.some(r => configView.roles.includes(r))

  if (wouldSelfLock) {
    showViewAccessSelfLockConfirm.value = true
    return
  }
  doSaveViewAccess()
}

async function doSaveViewAccess() {
  viewAccessSaving.value = true
  viewAccessError.value = ''
  try {
    const rolesMap = Object.fromEntries(viewAccessViews.value.map(v => [v.key, v.roles]))
    const { data } = await api.patch('/app-config/role-view-access', { roles: rolesMap })
    viewAccessViews.value = data.views.map(v => ({ ...v, roles: [...v.roles] }))
    viewAccessDirty.value = false
    viewAccessSaved.value = true
    setTimeout(() => { viewAccessSaved.value = false }, 2500)
  } catch (e) {
    viewAccessError.value = e?.response?.data?.message || 'Error al guardar'
  } finally {
    viewAccessSaving.value = false
  }
}

// ── Configuración general — número inicial de cotizaciones ──
const startNumberSaved  = ref(null) // último valor confirmado por el backend
const startNumberEdited = ref(null) // valor en el input
const numberingLoading  = ref(false)
const numberingSaving   = ref(false)
const numberingSaved    = ref(false)
const numberingError    = ref('')

async function fetchQuotationNumbering() {
  numberingLoading.value = true
  numberingError.value   = ''
  try {
    const { data } = await api.get('/app-config/quotation-numbering')
    startNumberSaved.value  = data?.startNumber ?? 100
    startNumberEdited.value = startNumberSaved.value
  } catch (e) {
    numberingError.value = e?.response?.data?.message || 'Error al cargar la configuración'
  } finally {
    numberingLoading.value = false
  }
}

const showConfirmModal = ref(false)

function saveStartNumber() {
  const nuevo = startNumberEdited.value
  if (!Number.isInteger(nuevo) || nuevo < 1) {
    numberingError.value = 'El número inicial debe ser un entero mayor a 0'
    return
  }
  showConfirmModal.value = true
}

function cancelSaveStartNumber() {
  showConfirmModal.value = false
  startNumberEdited.value = startNumberSaved.value
}

async function confirmSaveStartNumber() {
  showConfirmModal.value = false
  const nuevo = startNumberEdited.value

  numberingSaving.value = true
  numberingError.value  = ''
  numberingSaved.value  = false
  try {
    await api.patch('/app-config/quotation-numbering', { startNumber: nuevo })
    startNumberSaved.value = nuevo
    numberingSaved.value = true
    setTimeout(() => { numberingSaved.value = false }, 2500)
  } catch (e) {
    numberingError.value = e?.response?.data?.message || 'Error al guardar la configuración'
  } finally {
    numberingSaving.value = false
  }
}

onMounted(fetchQuotationNumbering)
onMounted(() => { if (hasRole('ADMIN')) fetchBackupStatus() })

// ── Encabezado del PDF de cotización — logo + logos de certificación + contacto ──
const pdfHeaderConfig = reactive({ logo: null, partners: [], contacto: {} })

const logoFileInput   = ref(null)
const logoUploading   = ref(false)
const logoError       = ref('')

const partnerFileInput  = ref(null)
const newPartnerName    = ref('')
const partnerUploading  = ref(false)
const partnerRemovingId = ref(null)
const partnerError      = ref('')

const contactoForm   = reactive({ ciudad: '', direccion: '', pbx: '', celular: '', instagram: '' })
const contactoSaving = ref(false)
const contactoSaved  = ref(false)
const contactoError  = ref('')

async function fetchPdfHeaderConfig() {
  try {
    const { data } = await api.get('/app-config/pdf-header')
    pdfHeaderConfig.logo     = data.logo ?? null
    pdfHeaderConfig.partners = data.partners ?? []
    Object.assign(contactoForm, data.contacto ?? {})
  } catch (e) {
    logoError.value = 'No se pudo cargar la configuración del encabezado'
  }
}
onMounted(fetchPdfHeaderConfig)

async function onLogoFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  logoUploading.value = true
  logoError.value = ''
  try {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.patch('/app-config/pdf-header/logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    pdfHeaderConfig.logo = data.logo
  } catch (e) {
    logoError.value = e?.response?.data?.message || 'Error al subir el logo'
  } finally {
    logoUploading.value = false
    e.target.value = ''
  }
}

async function onPartnerFileChange(e) {
  const file = e.target.files[0]
  if (!file || !newPartnerName.value.trim()) return
  partnerUploading.value = true
  partnerError.value = ''
  try {
    const form = new FormData()
    form.append('file', file)
    form.append('nombre', newPartnerName.value.trim())
    const { data } = await api.post('/app-config/pdf-header/partners', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    pdfHeaderConfig.partners = data.partners
    newPartnerName.value = ''
  } catch (e) {
    partnerError.value = e?.response?.data?.message || 'Error al agregar el logo'
  } finally {
    partnerUploading.value = false
    e.target.value = ''
  }
}

async function removePartner(id) {
  partnerRemovingId.value = id
  partnerError.value = ''
  try {
    const { data } = await api.delete(`/app-config/pdf-header/partners/${id}`)
    pdfHeaderConfig.partners = data.partners
  } catch (e) {
    partnerError.value = e?.response?.data?.message || 'Error al eliminar el logo'
  } finally {
    partnerRemovingId.value = null
  }
}

async function movePartner(idx, direction) {
  const list = [...pdfHeaderConfig.partners]
  const target = idx + direction
  if (target < 0 || target >= list.length) return
  ;[list[idx], list[target]] = [list[target], list[idx]]
  pdfHeaderConfig.partners = list // optimista — se confirma abajo contra el backend

  try {
    const { data } = await api.patch('/app-config/pdf-header/partners/reorder', {
      order: list.map(p => p.id),
    })
    pdfHeaderConfig.partners = data.partners
  } catch (e) {
    partnerError.value = e?.response?.data?.message || 'Error al reordenar'
    fetchPdfHeaderConfig() // revertir al estado real del servidor
  }
}

async function saveContacto() {
  contactoSaving.value = true
  contactoError.value = ''
  try {
    const { data } = await api.patch('/app-config/pdf-header/contacto', { ...contactoForm })
    Object.assign(contactoForm, data.contacto ?? {})
    contactoSaved.value = true
    setTimeout(() => { contactoSaved.value = false }, 2500)
  } catch (e) {
    contactoError.value = e?.response?.data?.message || 'Error al guardar'
  } finally {
    contactoSaving.value = false
  }
}

// ── Banner del Dashboard — imagen de fondo + mensaje motivacional ────────
const dashboardBannerConfig = reactive({ image: null, message: '' })
const bannerFileInput    = ref(null)
const bannerUploading    = ref(false)
const bannerError        = ref('')
const bannerMessageEdited = ref('')
const bannerMessageSaving = ref(false)
const bannerMessageSaved  = ref(false)
const bannerMessageError  = ref('')

async function fetchDashboardBanner() {
  try {
    const { data } = await api.get('/app-config/dashboard-banner')
    dashboardBannerConfig.image   = data.image ?? null
    dashboardBannerConfig.message = data.message ?? ''
    bannerMessageEdited.value     = data.message ?? ''
  } catch (e) {
    bannerError.value = 'No se pudo cargar la configuración del banner'
  }
}
onMounted(fetchDashboardBanner)

async function onBannerFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  bannerUploading.value = true
  bannerError.value = ''
  try {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.patch('/app-config/dashboard-banner/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    dashboardBannerConfig.image = data.image
  } catch (e) {
    bannerError.value = e?.response?.data?.message || 'Error al subir la imagen'
  } finally {
    bannerUploading.value = false
    e.target.value = ''
  }
}

async function removeBannerImage() {
  bannerUploading.value = true
  bannerError.value = ''
  try {
    const { data } = await api.delete('/app-config/dashboard-banner/image')
    dashboardBannerConfig.image = data.image
  } catch (e) {
    bannerError.value = e?.response?.data?.message || 'Error al quitar la imagen'
  } finally {
    bannerUploading.value = false
  }
}

async function saveBannerMessage() {
  bannerMessageSaving.value = true
  bannerMessageError.value = ''
  try {
    const { data } = await api.patch('/app-config/dashboard-banner/message', { message: bannerMessageEdited.value })
    dashboardBannerConfig.message = data.message
    bannerMessageEdited.value     = data.message
    bannerMessageSaved.value = true
    setTimeout(() => { bannerMessageSaved.value = false }, 2500)
  } catch (e) {
    bannerMessageError.value = e?.response?.data?.message || 'Error al guardar'
  } finally {
    bannerMessageSaving.value = false
  }
}

const ENDPOINTS = {
  clientes:    '/client/import',
  productos:   '/producto/import',
  proveedores: '/suppliers/import',
}

const clientesCols = [
  { col: 'Cliente',             req: true  },
  { col: 'Nit',                 req: false },
  { col: 'Email',               req: false },
  { col: 'Teléfono',            req: false },
  { col: 'Documento',           req: false },
  { col: 'Nombre de contacto',  req: false },
  { col: 'Referencia',          req: false },
  { col: 'Tipo',                req: false, note: 'DIRECTO / INDIRECTO' },
]

const productosCols = [
  { col: 'Dispositivo',                        req: true,  note: 'Nombre del producto' },
  { col: 'IdCatalogo',                         req: false },
  { col: 'DESCRIPCION',                        req: false },
  { col: 'CARACTERISTICA PRODUCTO',            req: false, note: 'Tipo de dispositivo' },
  { col: 'Categoría',                          req: false },
  { col: 'Estado',                             req: false, note: 'Operativo - Estado ok / ITEM NO ACTIVO' },
  { col: 'Bodega',                             req: false },
  { col: 'ValorCuadroCotizador',               req: false },
  { col: 'Cop',                                req: false },
  { col: 'CAFAM 2026',                         req: false, note: 'Precio lista' },
  { col: 'COMFAMA 2026',                       req: false, note: 'Precio lista' },
  { col: 'COMPENSAR 2026',                     req: false, note: 'Precio lista' },
  { col: 'COLSUBSIDIO 2026',                   req: false, note: 'Precio lista' },
  { col: 'OPERADORES 2026',                    req: false, note: 'Precio lista' },
  { col: 'Medidas',                            req: false },
  { col: 'AMPERIOS',                           req: false },
  { col: 'Q Motores',                          req: false },
  { col: 'Q Operarios',                        req: false },
  { col: 'Q Metros E0tensiones',               req: false },
  { col: 'M2 Dispositivo',                     req: false },
  { col: 'Q pesos o Estacas',                  req: false },
  { col: 'Q E0tintores',                       req: false },
  { col: 'Año Dispositivo',                    req: false },
  { col: 'Q hs - Montaje',                     req: false },
  { col: 'Q Personal Montaje',                 req: false },
  { col: 'Montacarga',                         req: false },
  { col: 'Accesorio 1 … Accesorio 8',          req: false, note: 'Lista de materiales' },
]

const proveedoresCols = [
  { col: 'Proveedor',       req: true  },
  { col: 'Mail',            req: false },
  { col: 'Teléfono 1',     req: false },
  { col: 'Teléfono 2',     req: false },
  { col: 'Categoría',      req: false },
  { col: 'Dirección',      req: false },
  { col: 'Zona - Operación', req: false },
  { col: 'Contacto',       req: false },
  { col: 'Ciudad',         req: false },
  { col: 'País',           req: false },
  { col: 'Sitio web',      req: false },
  { col: 'Link Portafolio', req: false },
]

const makeState = () => ({ loading: false, result: null, error: null })
const states = reactive({
  clientes:    makeState(),
  productos:   makeState(),
  proveedores: makeState(),
})

function resetState(mod) {
  states[mod].loading = false
  states[mod].result  = null
  states[mod].error   = null
}

async function runImport(mod, file) {
  states[mod].loading = true
  states[mod].result  = null
  states[mod].error   = null
  const form = new FormData()
  form.append('file', file)
  try {
    // Importaciones grandes (ej. productos) hacen varias consultas por fila —
    // el timeout global de 10s del cliente puede quedarse corto aunque el
    // backend sí termine, así que aquí se le da mucho más margen.
    const res = await api.post(ENDPOINTS[mod], form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 180000,
    })
    states[mod].result = res.data
  } catch (e) {
    states[mod].error = e?.code === 'ECONNABORTED'
      ? 'La importación tardó demasiado y el navegador canceló la espera. Verifica en la tabla de productos si ya se aplicó antes de reintentar.'
      : (e?.response?.data?.message || 'Error al importar el archivo')
  } finally {
    states[mod].loading = false
  }
}

// ── Zona peligrosa: backup + purga total de productos ──
const backupLoading = ref(false)
const backupDoneAt  = ref('')
const backupError   = ref('')

// El .zip ahora incluye dump completo + un dump por tabla + todos los
// archivos de R2 (documentos/imágenes subidos) — puede tardar bastante más
// que el .sql simple de antes, así que el timeout sube de 2 a 10 minutos.
async function downloadBackup() {
  backupLoading.value = true
  backupError.value   = ''
  try {
    const res = await api.get('/admin/backup', { responseType: 'blob', timeout: 600000 })
    const disposition = res.headers['content-disposition'] || ''
    const match = disposition.match(/filename="?([^"]+)"?/)
    const filename = match?.[1] || `beone-backup-${Date.now()}.zip`

    const url = URL.createObjectURL(res.data)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)

    backupDoneAt.value = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    fetchBackupStatus()
  } catch (e) {
    backupError.value = await extractBlobErrorMessage(e) || 'Error al generar el backup'
  } finally {
    backupLoading.value = false
  }
}

// ── Historial de backups automáticos (cron nocturno) ──
const backupHistory    = ref([])
const backupConfigured = ref(true)

async function fetchBackupStatus() {
  try {
    const { data } = await api.get('/admin/backup/status')
    backupConfigured.value = data?.configured ?? false
    backupHistory.value    = data?.history ?? []
  } catch {
    // No bloquea la pantalla — es solo informativo
  }
}

function formatBackupSize(bytes) {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
}

function formatBackupDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// Con responseType:'blob', un error del servidor (403/500 con JSON) también
// llega como Blob en e.response.data — hay que leerlo como texto y parsearlo.
async function extractBlobErrorMessage(e) {
  const data = e?.response?.data
  if (!(data instanceof Blob)) return e?.response?.data?.message
  try {
    const text = await data.text()
    return JSON.parse(text)?.message
  } catch {
    return null
  }
}

const showPurgeModal = ref(false)
const purgeLoading   = ref(false)
const purgeError     = ref('')
const purgeResult    = ref(null)

async function confirmPurge({ confirmPhrase, secretKey }) {
  purgeLoading.value = true
  purgeError.value   = ''
  try {
    const { data } = await api.post('/admin/products/purge-all', { confirmPhrase, secretKey }, { timeout: 120000 })
    purgeResult.value  = data
    showPurgeModal.value = false
  } catch (e) {
    purgeError.value = e?.response?.data?.message || 'Error al eliminar los productos'
  } finally {
    purgeLoading.value = false
  }
}
</script>

<style scoped>
.cfg-page     { padding: 20px 24px; width: 100%; box-sizing: border-box; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; gap: 20px; }
.cfg-header   { }
.cfg-title    { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 700; color: #0F172A; margin: 0; }
.cfg-subtitle { font-size: 13px; color: #64748B; margin: 3px 0 0; }
.cfg-grid     { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }

.cfg-section-label { font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: .06em; }

.cfg-modules { display: flex; flex-direction: column; gap: 10px; }
.cfg-module-card {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 20px; background: #fff;
  border: 1.5px solid #E2E8F0; border-radius: 14px;
  text-decoration: none; color: inherit;
  transition: border-color .15s, box-shadow .15s;
  max-width: 500px;
}
.cfg-module-card:hover { border-color: #27C8D8; box-shadow: 0 2px 10px rgba(39,200,216,.1); }
.cfg-module-icon { font-size: 24px; flex-shrink: 0; }
.cfg-module-title { font-size: 14px; font-weight: 700; color: #0F172A; margin: 0 0 2px; }
.cfg-module-desc { font-size: 12px; color: #64748B; margin: 0; }
.cfg-module-arrow { font-size: 18px; color: #CBD5E1; margin-left: auto; }
.cfg-module-card:hover .cfg-module-arrow { color: #27C8D8; }

.cfg-card {
  background: #fff;
  border: 1.5px solid #E2E8F0;
  border-radius: 14px;
  padding: 18px 20px;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cfg-field-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
.cfg-field-title { font-size: 14px; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
.cfg-field-desc { font-size: 12px; color: #64748B; margin: 0; max-width: 380px; line-height: 1.5; }
.cfg-field-control { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.cfg-input {
  width: 100px;
  height: 36px;
  padding: 0 12px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  border: 1px solid #E2EBF6;
  border-radius: 8px;
  background: #F8FAFC;
  color: #0F1A2E;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.cfg-input:focus { border-color: #27C8D8; box-shadow: 0 0 0 3px rgba(39,200,216,0.1); }
.cfg-input:disabled { opacity: 0.6; cursor: not-allowed; }
.cfg-btn-save {
  height: 36px;
  padding: 0 16px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: none;
  background: #27C8D8;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}
.cfg-btn-save:hover:not(:disabled) { background: #1BAEBB; }
.cfg-btn-save:disabled { opacity: 0.45; cursor: not-allowed; }
.cfg-field-saved { font-size: 12px; font-weight: 600; color: #16A34A; margin: 0; }
.cfg-field-error { font-size: 12px; color: #B91C1C; margin: 0; }
.cfg-divider { height: 1px; background: #EEF2F7; margin: 14px 0; }

/* ── Encabezado del PDF de cotización ── */
.pdfh-logo-preview {
  width: 90px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  border: 1px dashed #CBD5E1; border-radius: 8px;
  background: #F8FAFC; cursor: pointer; overflow: hidden; flex-shrink: 0;
}
.pdfh-logo-preview img { max-width: 100%; max-height: 100%; object-fit: contain; }
.pdfh-logo-placeholder { font-size: 9px; color: #94A3B8; text-align: center; padding: 0 4px; }

.banner-preview { width: 140px; height: 56px; }
.banner-preview img { object-fit: cover; width: 100%; height: 100%; }
.banner-message-input { width: 320px; }
.cfg-btn-remove {
  height: 36px; padding: 0 14px; font-size: 12px; font-weight: 600;
  font-family: 'Inter', sans-serif; border-radius: 8px; border: 1px solid #FECACA;
  background: #fff; color: #B91C1C; cursor: pointer; transition: background 0.15s, opacity 0.15s;
}
.cfg-btn-remove:hover:not(:disabled) { background: #FEE2E2; }
.cfg-btn-remove:disabled { opacity: 0.45; cursor: not-allowed; }

.pdfh-partners-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
.pdfh-partners-empty { font-size: 12px; color: #94A3B8; margin: 0 0 8px; }
.pdfh-partner-row {
  display: flex; align-items: center; gap: 10px;
  padding: 6px 10px; border: 1px solid #E2EBF6; border-radius: 8px; background: #F8FAFC;
}
.pdfh-partner-thumb { width: 32px; height: 32px; object-fit: contain; border-radius: 4px; background: #fff; flex-shrink: 0; }
.pdfh-partner-name { flex: 1; font-size: 13px; font-weight: 500; color: #0F172A; }
.pdfh-partner-actions { display: flex; gap: 4px; }
.pdfh-partner-btn {
  width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
  border: 1px solid #E2EBF6; border-radius: 6px; background: #fff; color: #475569;
  font-size: 12px; cursor: pointer; transition: background 0.15s;
}
.pdfh-partner-btn:hover:not(:disabled) { background: #EFF6FF; }
.pdfh-partner-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.pdfh-partner-btn--danger:hover:not(:disabled) { background: #FEE2E2; color: #B91C1C; border-color: #FECACA; }
.pdfh-partner-add { display: flex; gap: 8px; }
.pdfh-partner-add .cfg-input { width: 220px; }

.pdfh-contacto-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 4px; }
.pdfh-contacto-field { display: flex; flex-direction: column; gap: 4px; }
.pdfh-contacto-field .cfg-input { width: 100%; }
.pdfh-lbl { font-size: 11px; font-weight: 600; color: #64748B; }

/* ── Acceso a vistas por rol ── */
.rva-intro {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
  margin-bottom: 14px;
}
.rva-intro-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; white-space: nowrap; padding-top: 1px; }
.rva-intro-sep { color: #CBD5E1; font-size: 12px; }
.rva-link-btn {
  background: none; border: none; padding: 0; cursor: pointer;
  font-size: 12px; font-weight: 600; color: #27C8D8; font-family: 'Inter', sans-serif;
}
.rva-link-btn:hover { color: #1BAEBB; text-decoration: underline; }

.rva-groups { display: flex; flex-direction: column; gap: 10px; }
.rva-group { border: 1px solid #E2EBF6; border-radius: 10px; overflow: hidden; }
.rva-group--open { border-color: #CFE3F5; }

.rva-group-header {
  width: 100%; display: flex; align-items: center; gap: 8px;
  padding: 11px 14px; background: #F8FAFC; border: none; cursor: pointer;
  font-family: 'Inter', sans-serif; text-align: left;
  transition: background 0.15s;
}
.rva-group-header:hover { background: #F1F5F9; }
.rva-group-chevron { color: #94A3B8; flex-shrink: 0; transition: transform 0.15s; }
.rva-group--open .rva-group-chevron { transform: rotate(180deg); color: #27C8D8; }
.rva-group-name { flex: 1; font-size: 13px; font-weight: 700; color: #0F172A; }
.rva-group-count {
  font-size: 10px; font-weight: 700; color: #64748B; background: #E2E8F0;
  padding: 2px 8px; border-radius: 99px;
}

.rva-table-scroll { overflow-x: auto; border-top: 1px solid #E2EBF6; }
.rva-table { width: 100%; border-collapse: collapse; font-size: 12px; white-space: nowrap; }
.rva-th-label {
  text-align: left; padding: 9px 14px; background: #fff;
  font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.3px;
  border-bottom: 1px solid #EEF2F7; position: sticky; left: 0; z-index: 2;
}
.rva-th-role {
  text-align: center; padding: 9px 10px; background: #fff; min-width: 88px;
  font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.3px;
  border-bottom: 1px solid #EEF2F7; border-left: 1px solid #EEF2F7;
}
.rva-th-admin { color: #27C8D8; }
.rva-row:nth-child(even) { background: #FAFBFC; }
.rva-row:hover { background: #F0FAFB; }
.rva-label {
  padding: 8px 14px; font-size: 12px; color: #0F172A; font-weight: 500;
  position: sticky; left: 0; background: inherit; border-right: 1px solid #EEF2F7;
}
.rva-cell { text-align: center; padding: 8px 10px; border-left: 1px solid #EEF2F7; }
.rva-cell--admin { background: #F0FAFB; }
.rva-cell input[type="checkbox"] { width: 15px; height: 15px; cursor: pointer; accent-color: #27C8D8; }
.rva-cell input[type="checkbox"]:disabled { cursor: not-allowed; opacity: 0.7; }

/* ── Zona peligrosa ── */
.cfg-section-label--danger { color: #B91C1C; }
.cfg-card--danger { border-color: #FECACA; background: #FFFBFB; }
.cfg-danger-divider { height: 1px; background: #FEE2E2; margin: 4px 0; }
.cfg-btn-backup {
  height: 36px;
  padding: 0 16px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: 1px solid #E2EBF6;
  background: #fff;
  color: #0F172A;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
  white-space: nowrap;
}
.cfg-btn-backup:hover:not(:disabled) { background: #F8FAFC; }
.cfg-btn-backup:disabled { opacity: 0.6; cursor: not-allowed; }
.cfg-backup-warning { color: #B45309; }
.cfg-backup-history { display: flex; flex-direction: column; gap: 4px; margin: 6px 0; }
.cfg-backup-history-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #475569;
}
.cfg-backup-history-trigger {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: #94A3B8;
}
.cfg-backup-status { font-weight: 700; }
.cfg-backup-status.ok { color: #16A34A; }
.cfg-backup-status.fail { color: #B91C1C; }
.cfg-btn-danger {
  height: 36px;
  padding: 0 16px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  border: none;
  background: #EF4444;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
  white-space: nowrap;
}
.cfg-btn-danger:hover:not(:disabled) { background: #DC2626; }
.cfg-btn-danger:disabled { background: #FCA5A5; cursor: not-allowed; }
</style>
