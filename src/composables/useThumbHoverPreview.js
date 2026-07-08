import { ref } from 'vue'

/**
 * Preview ampliado al hacer hover sobre una miniatura. Usa coordenadas fijas
 * (el consumidor debe renderizar <ThumbHoverPreview :preview="preview" />,
 * que hace Teleport a <body>) en vez de CSS puro porque las miniaturas suelen
 * vivir dentro de tablas con overflow-x:auto, que recortarían cualquier hijo
 * absoluto que intente salirse de su fila.
 */
export function useThumbHoverPreview(size = 240) {
  const preview = ref({ visible: false, src: '', top: 0, left: 0, size })

  const showPreview = (event, src) => {
    if (!src) return
    const rect = event.currentTarget.getBoundingClientRect()
    let left = rect.right + 12
    if (left + size > window.innerWidth) left = rect.left - size - 12
    left = Math.min(Math.max(left, 8), window.innerWidth - size - 8)
    let top = rect.top + rect.height / 2 - size / 2
    top = Math.min(Math.max(top, 8), window.innerHeight - size - 8)
    preview.value = { visible: true, src, top, left, size }
  }
  const hidePreview = () => { preview.value.visible = false }

  return { preview, showPreview, hidePreview }
}
