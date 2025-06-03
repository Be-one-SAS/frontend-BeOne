import axios from "axios";

export const getCustomer = async () => {
    try {
        const response = await axios.get(
            "https://backend-beone-production.up.railway.app/customer",

            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        return response;
    } catch (error) {
        console.error("Fallo el servicio para obtener los clientes", error);
        throw error; // ✅ Lanza el error para manejarlo donde se use
    }
};