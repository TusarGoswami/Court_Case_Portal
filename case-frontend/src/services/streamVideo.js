import api from "./api";

export async function fetchStreamVideoCredentials() {
  const response = await api.get("/video/token");
  return response.data?.data;
}

