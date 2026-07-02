import api from "./api";

const HEADERS = { headers: { "Content-Type": "application/json" } };

export const getConfirmedDates = async () => {
  try {
    return await api.get("/dashboard/confirmed-dates", HEADERS);
  } catch (error) {
    throw error;
  }
};

export const getDashboardStats = async () => {
  try {
    return await api.get("/dashboard/stats", HEADERS);
  } catch (error) {
    throw error;
  }
};