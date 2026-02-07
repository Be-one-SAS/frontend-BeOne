import api from "./api";


export const getConfirmedDates = async () => {
    try {
          const response = await api.get("/dashboard/confirmed-dates",
  
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