
import axios from "axios"

interface AuthData {
    email: string;
    password: string;
  }
  

//@ts-ignore
//const baseAPI = import.meta.env.VITE_BASE_URL_API
//@ts-ignore
//const version = import.meta.env.VITE_VERSION

/**
 * Servicio para autenticarme
 * @param data 
 * @returns 
 */
export const auth = async ({ email, password }: AuthData) => {
    try {
      const response = await axios.post(
        "https://backend-beone-production.up.railway.app/auth/login",
        {
          email,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
  
      return response;
    } catch (error) {
      console.error("Fallo el servicio para iniciar sesión:", error);
      throw error; // ✅ Lanza el error para manejarlo donde se use
    }
  };