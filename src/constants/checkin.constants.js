// ─────────────────────────────────────────────────────────────────────────────
// Constantes para el módulo de Check-ins operativos
// TODO: completar las listas con los datos reales antes de producción
// ─────────────────────────────────────────────────────────────────────────────

export const COORDINADORES = [
  // TODO: reemplazar con los 7 coordinadores reales
  'Coordinador 1',
  'Coordinador 2',
  'Coordinador 3',
  'Otro',
]

export const DISPOSITIVOS = [
  // TODO: completar con los ~53 dispositivos reales
  'Dispositivo de ejemplo 1',
  'Dispositivo de ejemplo 2',
]

// Aspectos a inspeccionar — usados como seed inicial y fallback
// La grilla del formulario los carga dinámicamente desde /aspectos-inspeccion
export const ASPECTOS_INSPECCION_SEED = [
  'Las condiciones climáticas son adecuadas y están dentro el marco de seguridad para la operación del dispositivo.',
  'El dispositivo se encuentra aseado y libre de manchas.',
  'Las costuras y mallas se encuentran en buen estado y seguro.',
  'El dispositivo cuenta con sus correas para anclaje de seguridad en buen estado.',
  'El dispositivo se encuentra anclado con estaca metálica a 45º según norma.',
  'El dispositivo cuenta con sacos de arena para brindar una mayor estabilidad y seguridad.',
  'La plataforma de ingreso del dispositivo está libre de obstrucciones.',
  'Cuenta el dispositivo con una señalética con la siguiente información: Acompañamiento, Accesorios, Altura mínima, Numero de operarios, Cabello recogido, No alimentos, Respeta tiempo, Respeta turno, Siempre atento, No choques mal intencionados, No alcohol y/o sustancias psicoactivas.',
  'El área perimetral del dispositivo está limpia y ordenada.',
  'Los pasillos entre los dispositivos se encuentran libres de obstáculos.',
  'El material de soporte y guía como cuerdas están en buen estado.',
  'El motor soplador se encuentra cubierto con una caja para evitar que personal ajeno a la operación acceda directamente a él.',
  'El dispositivo se encuentra ubicado en un perímetro mayor de 50 cm de alguna línea de servicio público.',
  'Cuenta con los accesorios de cada dispositivo y están en óptimo estado.',
  'El motor soplador se encuentra ubicado de manera firme sobre una superficie plana.',
  'El dispositivo está acompañado de un extintor debidamente recargado para brindar una mayor seguridad.',
  'El motor soplador está recibiendo la energía necesaria 110v o 210v según el dispositivo.',
  'Los cables eléctricos conductores de energía se encuentran en óptimo estado.',
  'Para los dispositivos con agua, la fuente hídrica está limpia sin ningún tipo de agente contaminante que afecte a los usuarios.',
]

export const RESPUESTAS = ['SI', 'NO', 'NO_APLICA']

export const RESPUESTA_LABEL = {
  SI:       'SI',
  NO:       'NO',
  NO_APLICA: 'N/A',
}

export const RESPUESTA_COLOR = {
  SI:       { bg: '#DCFCE7', text: '#16A34A' },
  NO:       { bg: '#FEE2E2', text: '#DC2626' },
  NO_APLICA: { bg: '#F1F5F9', text: '#64748B' },
}
