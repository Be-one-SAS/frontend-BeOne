import { ref, watch } from 'vue'

const DRAFT_KEY = 'quotation_draft'

/** Initial values that match useQuotation's reactive defaults */
const COTIZACION_DEFAULTS = {
  numero: 2,
  fechaCotizacion: '',
  description: '',
  agenteComercial: '',
  cliente: '',
  empresa: '',
  contacto: '',
  correo: '',
  celular: '',
  ubicacion: '',
  linkMaps: '',
  fechaInicioEvento: '',
  fechaFinEvento: '',
  fechaInicioMontaje: '',
  fechaFinMontaje: '',
  horarioInicioMontaje: '00:00',
  horarioFinMontaje: '00:00',
  horarioInicio: '00:00',
  horarioFin: '00:00',
  asistentes: 10,
  vigencia: '15 días',
  unidadEjecucion: 'Nivel Nacional',
  tipoSuelo: '',
  cantidadJornada: 1,
  cantidadProducto: 1,
  quotationStatusId: 1,
  descuentoPct: 0,
}

export function useQuotationDraft({
  cotizacion,
  items,
  itemsTerceros,
  pasoActual,
  modalCotizacionExitosa,
}: {
  cotizacion: Record<string, any>
  items: { value: any[] }
  itemsTerceros: { value: any[] }
  pasoActual: { value: number }
  modalCotizacionExitosa: { value: boolean }
}) {
  const hasDraft         = ref(false)
  const showConfirmClear = ref(false)
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  // ── Write ──────────────────────────────────────────────────────
  const saveDraft = () => {
    try {
      const payload = {
        cotizacion: { ...cotizacion },
        items: JSON.parse(JSON.stringify(items.value)),
        itemsTerceros: JSON.parse(JSON.stringify(itemsTerceros.value)),
        paso: pasoActual.value,
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
    } catch {
      // Silently ignore quota / serialization errors
    }
  }

  const scheduleSave = () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(saveDraft, 500)
  }

  // ── Read ───────────────────────────────────────────────────────
  const readDraft = (): Record<string, any> | null => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      // Discard if missing the required shape
      if (!parsed?.cotizacion || typeof parsed.cotizacion !== 'object') return null
      return parsed
    } catch {
      localStorage.removeItem(DRAFT_KEY)
      return null
    }
  }

  // ── Restore on mount ───────────────────────────────────────────
  const restoreDraft = () => {
    const draft = readDraft()
    if (!draft) return

    Object.assign(cotizacion, draft.cotizacion)

    if (Array.isArray(draft.items)) {
      items.value = draft.items
    }

    if (Array.isArray(draft.itemsTerceros)) {
      itemsTerceros.value = draft.itemsTerceros
    }

    if (typeof draft.paso === 'number' && draft.paso >= 1 && draft.paso <= 4) {
      pasoActual.value = draft.paso
    }

    hasDraft.value = true
  }

  // ── Clear (used by "Limpiar formulario") ───────────────────────
  const clearDraft = () => {
    if (saveTimer) clearTimeout(saveTimer)
    localStorage.removeItem(DRAFT_KEY)
    hasDraft.value         = false
    showConfirmClear.value = false

    Object.assign(cotizacion, { ...COTIZACION_DEFAULTS })
    items.value         = []
    itemsTerceros.value = []
    pasoActual.value    = 1
  }

  const dismissBanner = () => {
    hasDraft.value = false
  }

  // ── Watch (debounced 500ms) ────────────────────────────────────
  // Watching both the spread of cotizacion and items with deep:true covers all mutations
  watch(
    [() => ({ ...cotizacion }), items, itemsTerceros],
    scheduleSave,
    { deep: true },
  )

  // ── Auto-clear on successful submission ───────────────────────
  watch(modalCotizacionExitosa, (val) => {
    if (val) {
      if (saveTimer) clearTimeout(saveTimer)
      localStorage.removeItem(DRAFT_KEY)
      hasDraft.value = false
    }
  })

  return {
    hasDraft,
    showConfirmClear,
    restoreDraft,
    clearDraft,
    dismissBanner,
  }
}
