import api from "./api";

export const getTasks = async () => {
  try {
    const response = await api.get("/tasks", {
      headers: { "Content-Type": "application/json" },
    });
    return response;
  } catch (error) {
    console.error("Fallo el servicio para obtener tareas:", error);
    throw error;
  }
};

export const createTask = async (data: object) => {
  try {
    const response = await api.post("/tasks", data, {
      headers: { "Content-Type": "application/json" },
    });
    return response;
  } catch (error) {
    console.error("Fallo el servicio para crear tarea:", error);
    throw error;
  }
};

export const updateTask = async (id: string, data: object) => {
  try {
    const response = await api.patch(`/tasks/${id}`, data, {
      headers: { "Content-Type": "application/json" },
    });
    return response;
  } catch (error) {
    console.error("Fallo el servicio para actualizar tarea:", error);
    throw error;
  }
};

export const updateTaskStatus = async (id: string, status: string) => {
  try {
    const response = await api.patch(`/tasks/${id}/status`, { status }, {
      headers: { "Content-Type": "application/json" },
    });
    return response;
  } catch (error) {
    console.error("Fallo el servicio para actualizar estado de tarea:", error);
    throw error;
  }
};

export const deleteTask = async (id: string) => {
  try {
    const response = await api.delete(`/tasks/${id}`, {
      headers: { "Content-Type": "application/json" },
    });
    return response;
  } catch (error) {
    console.error("Fallo el servicio para eliminar tarea:", error);
    throw error;
  }
};
