export const ESTADOS_ADMIN = [
  'Pagada',
  'Facturada',
  'Por Facturar',
  'Anulada',
  'Cobro Interno',
  'a Porcentaje',
  'RAS Pendiente',
  'Verificar',
  'Anticipo',
  'EV Cancelado',
  'OC Pendiente',
  'Espera EJEC',
  'Cotizado',
  'Sin factura',
  'Cuenta de cobro',
  'Pen Liberación',
]

// Each entry: { bg, color } — matches the badge palette in Control.vue
export const ESTADO_ADMIN_STYLE = {
  'Pagada':          { bg: '#F0FDF4', color: '#166534' },
  'Facturada':       { bg: '#E0F9FA', color: '#27C8D8' },
  'Por Facturar':    { bg: '#FEFCE8', color: '#854D0E' },
  'Anulada':         { bg: '#FEF2F2', color: '#991B1B' },
  'Cobro Interno':   { bg: '#F5F3FF', color: '#6D28D9' },
  'a Porcentaje':    { bg: '#FFF7ED', color: '#C2410C' },
  'RAS Pendiente':   { bg: '#EEF2FF', color: '#3730A3' },
  'Verificar':       { bg: '#F0FDFA', color: '#115E59' },
  'Anticipo':        { bg: '#FFFBEB', color: '#92400E' },
  'EV Cancelado':    { bg: '#FEF2F2', color: '#7F1D1D' },
  'OC Pendiente':    { bg: '#FFF7ED', color: '#9A3412' },
  'Espera EJEC':     { bg: '#F1F5F9', color: '#64748B' },
  'Cotizado':        { bg: '#F0F9FF', color: '#138E9C' },
  'Sin factura':     { bg: '#F8FAFC', color: '#475569' },
  'Cuenta de cobro': { bg: '#EEF2FF', color: '#4338CA' },
  'Pen Liberación':  { bg: '#FFF1F2', color: '#9F1239' },
}

export function estadoAdminStyle(estado) {
  return ESTADO_ADMIN_STYLE[estado] ?? { bg: '#F1F5F9', color: '#64748B' }
}
