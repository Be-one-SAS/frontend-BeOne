import api from "./api";


export const getProducts = async (params?: { page?: number; limit?: number; search?: string }) => {
    try {
        const response = await api.get("/producto", { params });
        // Normaliza: el API retorna { data, total, page, limit, totalPages } o array legacy
        const payload = response.data;
        const normalized = Array.isArray(payload) ? payload : (payload?.data ?? []);
        return { ...response, data: normalized, meta: Array.isArray(payload) ? null : payload };
    } catch (error) {
        console.error("Fallo el servicio para obtener los productos", error);
        throw error;
    }
};

export const getByName = async (name: string) => {
    try {
        const response = await api.get(
            `/product-box/by-name/${name}`,

            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        return response;
    } catch (error) {
        console.error("Fallo el servicio para obtener los product box", error);
        throw error; // Lanza el error para manejarlo donde se use
    }
};

export const uploadProductFoto = async (id: number | string, file: File) => {
    try {
        const form = new FormData();
        form.append('file', file);
        return await api.patch(`/producto/${id}/foto`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    } catch (error) {
        console.error('Fallo el servicio para subir foto del producto', error);
        throw error;
    }
};

export const deleteProduct = async (id: number | string) => {
    try {
        return await api.delete(`/producto/${id}`);
    } catch (error) {
        console.error("Fallo el servicio para eliminar el producto", error);
        throw error;
    }
};

export const updateProduct = async (id: number | string, data: object) => {
    try {
        const response = await api.patch(`/producto/${id}`, data);
        return response;
    } catch (error) {
        console.error("Fallo el servicio para actualizar el producto", error);
        throw error;
    }
};

export const createProduct = async (data: object) => {
    try {
        return await api.post("/producto", data);
    } catch (error) {
        console.error("Fallo el servicio para crear el producto", error);
        throw error;
    }
};

// TERCEROS
export const getThirdPartyCatalog = async () => {
    try {
        const response = await api.get(
            `/third-party-catalog`,

            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        return response;
    } catch (error) {
        console.error("Fallo el servicio para obtener los productos del terceros", error);
        throw error; // Lanza el error para manejarlo donde se use
    }
};

// TERCEROS - PATCH
export const updateThirdPartyCatalog = async (id: number | string, data: object) => {
    try {
        const response = await api.patch(`/third-party-catalog/${id}`, data);
        return response;
    } catch (error) {
        console.error("Fallo el servicio para actualizar el producto de terceros", error);
        throw error;
    }
};

// TERCEROS - POST
export const thirdPartyCatalog = async (data: object) => {
    try {
        const response = await api.post(
            `/third-party-catalog`,
            data,
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        return response;
    } catch (error) {
        console.error("Fallo el servicio para crear los productos del terceros", error);
        throw error; // Lanza el error para manejarlo donde se use
    }
};