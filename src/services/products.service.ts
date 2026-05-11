import api from "./api";


export const getProducts = async () => {
    try {
        const response = await api.get(
            "/producto",

            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        return response;
    } catch (error) {
        console.error("Fallo el servicio para obtener los productos", error);
        throw error; // Lanza el error para manejarlo donde se use
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

export const updateProduct = async (id: number | string, data: object) => {
    try {
        const response = await api.patch(`/producto/${id}`, data);
        return response;
    } catch (error) {
        console.error("Fallo el servicio para actualizar el producto", error);
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