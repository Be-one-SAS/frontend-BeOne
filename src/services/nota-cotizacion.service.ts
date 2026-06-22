import api from './api';

export const AREAS_NOTA = ['Comercial', 'Operativo', 'Administrativo', 'Logístico'] as const;
export type AreaNota = typeof AREAS_NOTA[number];

export const createNotaCotizacion = async (payload: {
  contenido: string;
  area: AreaNota;
  cotizacionId: number;
}) => {
  const response = await api.post('/nota-cotizacion', payload);
  return response.data;
};

export const getNotasByCotizacion = async (cotizacionId: number) => {
  const response = await api.get(`/nota-cotizacion/quotation/${cotizacionId}`);
  return response.data as Array<{ id: number; contenido: string; area: string; createdAt: string }>;
};

export const deleteNotaCotizacion = async (id: number) => {
  const response = await api.delete(`/nota-cotizacion/${id}`);
  return response.data;
};
