import api from "./api";


interface AuthData {
  email: string;
  password: string;
}

interface CreateUser {
  email: string;
  password: string;
  fullName: string,
  role: string
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
    const response = await api.post(
      "/auth/login",
      {
        email,
        password,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
         withCredentials: true
      }
    );

    return response;
  } catch (error) {
    console.error("Fallo el servicio para iniciar sesión:", error);
    throw error; // Lanza el error para manejarlo donde se use
  }
};

/**
* Servicio para crear
* @param data 
* @returns 
*/
export const createUser = async ({ email, password, fullName, role }: CreateUser) => {
  try {
    const response = await api.post(
      "/auth/register",
      {
        email: email,
        password: password,
        fullName: fullName,
        role: role
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response;
  } catch (error) {
    console.error("Fallo el servicio para crear el usuario:", error);
    throw error; // Lanza el error para manejarlo donde se use
  }
};


/**
* Servicio para crear
* @param data 
* @returns 
*/
export const getUsers = async () => {
  try {
    const response = await api.get(
      "/users",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response;
  } catch (error) {
    console.error("Fallo el servicio para ver los usuarios:", error);
    throw error; // Lanza el error para manejarlo donde se use
  }
};