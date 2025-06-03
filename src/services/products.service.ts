import axios from "axios";

export const getProducts = async () => {
    try {
        const response = await axios.get(
            "https://backend-beone-production.up.railway.app/producto",

            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        return response;
    } catch (error) {
        console.error("Fallo el servicio para obtener los productos", error);
        throw error; // ✅ Lanza el error para manejarlo donde se use
    }
};