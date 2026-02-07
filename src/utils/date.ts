//  Devuelve fecha actual en UTC (esto está correcto)
export function getCurrentISODate(): string {
  return new Date().toISOString();
}


//  Formatea un ISO (UTC) a hora Colombia correctamente
export const formatIsoToCustom = (iso: string): string => {
  const date = new Date(iso);

  const formatter = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);

  const get = (type: string) =>
    parts.find(p => p.type === type)?.value ?? '';

  return `${get('year')}-${get('month')}-${get('day')} / ${get('hour')}:${get('minute')}:${get('second')}`;
};

export function toBackendISO(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  if (isNaN(date.getTime())) {
    throw new Error(`Fecha inválida: ${dateInput}`);
  }

  // Devuelve ISO completo UTC, compatible con el backend
  return date.toISOString(); // Ej: "2026-02-03T05:00:00.000Z"
}


//  Igual que la anterior, pero mantenemos tu nombre original
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);

  // Creamos el formateador con zona horaria Colombia
  const formatter = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  // Obtenemos las partes separadas de la fecha y hora
  const parts = formatter.formatToParts(date);

  // Función auxiliar para sacar cada valor
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';

  // Retornamos en el formato: YYYY-MM-DD / HH:MM:SS
  return `${get('year')}-${get('month')}-${get('day')} / ${get('hour')}:${get('minute')}:${get('second')}`;
}