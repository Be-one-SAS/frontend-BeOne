const _fmt = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function formatCOP(n) {
  if (n == null || n === '') return '$ 0'
  return _fmt.format(Number(n))
}
