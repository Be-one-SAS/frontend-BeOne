import api from "./api";

export const getCustomer = async () => {
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
        throw error; //  Lanza el error para manejarlo donde se use
    }
};