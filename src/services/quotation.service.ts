import api from "./api";


//Obtiene las cotizaciones
export const getQuotations = async () => {
    try {
        const response = await api.get(
            "/quotations",

            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        return response;
    } catch (error) {
        throw error; //Lanza el error para manejarlo donde se use
    }
};

//Obtiene la cotizacion
export const getQuotationById = async (id: number) => {
    try {
        const response = await api.get(
            `/quotations/${id}`,
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

function limpiarCotizacion(data: Record<string, any>) {
    return Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== '')
    );
}

//Crea una cotización
export const createQuotation = async (cotizacion: any) => {
    try {
        const data = limpiarCotizacion(cotizacion)

        const response = await api.post(
            "/quotations", data,
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


//Actualiza una cotización
export const updateQuotation = async (id: number, cotizacion: any) => {
    try {
        const data = limpiarCotizacion(cotizacion)

        const response = await api.put(
            `/quotations/${id}`, data,
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

// ✅ CHANGED — agrega items a una cotización ya creada via endpoint dedicado
export const addQuotationItems = async (id: number, items: any[]) => {
    try {
        const response = await api.post(
            `/quotations/${id}/items`,
            { items },
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
};

// Agrega productos de terceros a una cotización ya creada
export const addThirdPartyQuotationItems = async (id: number, items: any[]) => {
    try {
        const response = await api.post(
            `/quotations/${id}/third-party-items`,
            { items },
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
};

// Calcula el desglose de un producto de tercero (backend-only logic)
export const calculateThirdPartyItem = async (data: { catalogItemId: number; cantidad: number; costo: number; margen: number }) => {
    try {
        const response = await api.post(
            `/third-party-quotation-item/calculate`,
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
};

//Elimina una cotización
export const deleteQuotation = async (id: number) => {
    try {
        const response = await api.delete(
            `/quotations/${id}`,
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
}

//Obtiene el número de la cotización
export const nextQuotationNumber = async () => {
    try {
        const response = await api.get(
            `/quotations/next-number/preview`,
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
}

