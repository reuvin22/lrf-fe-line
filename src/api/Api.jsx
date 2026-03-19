import axiosApi from "./Axios";

const segmentApi = {
  getAll: () => axiosApi.get("/segments"),
  getById: (id) => axiosApi.get(`/segments/${id}`),
  create: (data) => axiosApi.post("/segments", data),
  update: (id, data) => axiosApi.put(`/segments/${id}`, data),
  delete: (id) => axiosApi.delete(`/segments/${id}`),
};

const transportationExpensesApi = {
  getAll: () => axiosApi.get("/segments"),
  getById: (id) => axiosApi.get(`/segments/${id}`),
  create: (data) => axiosApi.post("/segments", data),
  update: (id, data) => axiosApi.put(`/segments/${id}`, data),
  delete: (id) => axiosApi.delete(`/segments/${id}`),
};

const subContractorApi = {
  getAll: () => axiosApi.get("/segments"),
  getById: (id) => axiosApi.get(`/segments/${id}`),
  create: (data) => axiosApi.post("/segments", data),
  update: (id, data) => axiosApi.put(`/segments/${id}`, data),
  delete: (id) => axiosApi.delete(`/segments/${id}`),
};

export default segmentApi;