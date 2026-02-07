import api from "./api";


export const getProductsEndReservation = async (date: object) => {
    try {
        const response = await api.post(
            "/reservation/products/availability",
            date,
            
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

export const confirmReservation = async (quotationId: number, isSameCity: boolean) => {
  try {
    const response = await api.post(
      `/reservation/confirm/${quotationId}`,
      {
          isSameCity: isSameCity
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response;
  } catch (error) {
    console.error("Error confirmando la reserva", error);
    throw error;
  }
};


export const cancelReservation = async (quotationId: number) => {
  try {
    const response = await api.patch(
      `/reservation/cancel/${quotationId}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response;
  } catch (error) {
    console.error("Error cancelando la reserva", error);
    throw error;
  }
};