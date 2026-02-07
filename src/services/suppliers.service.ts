import api from "./api";


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