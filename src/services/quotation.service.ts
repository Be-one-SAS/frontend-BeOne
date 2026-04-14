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

// Calcula precio, subtotal, utilidades desde costo unitario (fórmula calcularCotizacionDesdeCosto)
export const calculateFromCost = async (data: { costoUnitario: number; cantidad: number; margenVariable: number }) => {
    try {
        const response = await api.post(
            `/quotations/calculate-from-cost`,
            data,
            { headers: { 'Content-Type': 'application/json' } },
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

// Agrega un colaborador (miembro) a una cotización
export const addQuotationMember = async (quotationId: number, userId: number) => {
    try {
        const response = await api.post(
            `/quotations/${quotationId}/members`,
            { userId },
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

// Elimina un colaborador de una cotización
export const removeQuotationMember = async (quotationId: number, userId: number) => {
    try {
        const response = await api.delete(
            `/quotations/${quotationId}/members/${userId}`,
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

// ── VERSIONAMIENTO ────────────────────────────────────────────────────────

export const getVersions = async (quotationId: number | string) => {
    try {
        const response = await api.get(`/quotations/${quotationId}/versions`);
        return response;
    } catch (error) {
        throw error;
    }
};

export const createVersion = async (quotationId: number | string) => {
    try {
        const response = await api.post(`/quotations/${quotationId}/versions`);
        return response;
    } catch (error) {
        throw error;
    }
};

export const restoreVersion = async (quotationId: number | string, versionId: number | string) => {
    try {
        const response = await api.post(`/quotations/${quotationId}/versions/${versionId}/restore`);
        return response;
    } catch (error) {
        throw error;
    }
};

