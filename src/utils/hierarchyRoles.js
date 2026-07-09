// Roles "efectivos" contra los que evaluar acceso (menú, vistas, acciones) —
// agrega LIDER si el usuario es BEONE "viendo" una sede, para que replique
// fielmente lo que el líder real de esa sede vería. Antes vivía duplicado en
// useActionAccess.js, useViewAccess.js, useSidebarPermissions.js y
// usePermissions.ts.
export function withLiderIfViewingSede(roles, isViewingAsSede) {
  return isViewingAsSede ? [...roles, 'LIDER'] : roles
}
