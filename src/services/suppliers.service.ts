import api from "./api";

// ⚠️ A pesar del nombre, esto llama a /client — NO a /suppliers. Está mal
// nombrada, pero ClienteFinalSelector.vue depende de este comportamiento
// exacto para poblar su lista de clientes ("Obtener lista de clientes").
// No la "arregles" para que apunte a /suppliers sin antes actualizar ese
// componente — usa listSuppliers() de abajo para proveedores reales.
export const getSuppliers = async () => {
    try {
        const response = await api.get(
            "/client",

            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        return response;
    } catch (error) {
        throw error; // Lanza el error para manejarlo donde se use
    }
};

// ── Proveedores reales (/suppliers) ──────────────────────────────────────
export const listSuppliers = async () => {
    try {
        return await api.get("/suppliers");
    } catch (error) {
        throw error;
    }
};

export const createSupplier = async (data: Record<string, any>) => {
    try {
        return await api.post("/suppliers", data);
    } catch (error) {
        throw error;
    }
};

export const updateSupplier = async (id: number, data: Record<string, any>) => {
    try {
        return await api.patch(`/suppliers/${id}`, data);
    } catch (error) {
        throw error;
    }
};

export const deleteSupplier = async (id: number) => {
    try {
        return await api.delete(`/suppliers/${id}`);
    } catch (error) {
        throw error;
    }
};

export const getBox = async () => {
    try {
        const response = await api.get(
            "/product-box",

            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        return response;
    } catch (error) {
        throw error; // Lanza el error para manejarlo donde se use
    }
};


export const createClient = async (data: any) => {
    try {
     
        const response = await api.post(
            "/client",
            data,
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        return response;
    } catch (error) {
        throw error; // Lanza el error para manejarlo donde se use
    }
};

export const updateClient = async (id: number, data: Object) => {

    try {
        const response = await api.patch(
            `/client/${id}`,
            data,
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        return response;
    } catch (error) {
        throw error;
    }
}