import api from "./api";

const BASE = "/desafios-comerciales";

export const getDesafios = async () => {
  try {
    const response = await api.get(BASE, {
      headers: { "Content-Type": "application/json" },
    });
    return response;
  } catch (error) {
    console.error("Fallo el servicio para obtener desafíos comerciales:", error);
    throw error;
  }
};

export const getResumenDesafios = async () => {
  try {
    const response = await api.get(`${BASE}/resumen`, {
      headers: { "Content-Type": "application/json" },
    });
    return response;
  } catch (error) {
    console.error("Fallo el servicio para obtener el resumen de desafíos comerciales:", error);
    throw error;
  }
};

export const createDesafio = async (data: object) => {
  try {
    const response = await api.post(BASE, data, {
      headers: { "Content-Type": "application/json" },
    });
    return response;
  } catch (error) {
    console.error("Fallo el servicio para crear el desafío comercial:", error);
    throw error;
  }
};

export const updateDesafio = async (id: number, data: object) => {
  try {
    const response = await api.patch(`${BASE}/${id}`, data, {
      headers: { "Content-Type": "application/json" },
    });
    return response;
  } catch (error) {
    console.error("Fallo el servicio para actualizar el desafío comercial:", error);
    throw error;
  }
};

export const updateDesafioEstado = async (id: number, estado: string) => {
  try {
    const response = await api.patch(`${BASE}/${id}/estado`, { estado }, {
      headers: { "Content-Type": "application/json" },
    });
    return response;
  } catch (error) {
    console.error("Fallo el servicio para actualizar el estado del desafío comercial:", error);
    throw error;
  }
};

export const updateDesafioPago = async (id: number, comisionPagada: boolean) => {
  try {
    const response = await api.patch(`${BASE}/${id}/pago`, { comisionPagada }, {
      headers: { "Content-Type": "application/json" },
    });
    return response;
  } catch (error) {
    console.error("Fallo el servicio para actualizar el pago de la comisión:", error);
    throw error;
  }
};

export const deleteDesafio = async (id: number) => {
  try {
    const response = await api.delete(`${BASE}/${id}`, {
      headers: { "Content-Type": "application/json" },
    });
    return response;
  } catch (error) {
    console.error("Fallo el servicio para eliminar el desafío comercial:", error);
    throw error;
  }
};
