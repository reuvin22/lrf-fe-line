import axiosApi from "./Axios";

const createApi = (endpoint) => ({
  getAll: (params = {}) => axiosApi.get(`/${endpoint}`, { params }),
  getAttendance: (params = {}) => axiosApi.get(`/${endpoint}`, { params }),
  getById: (id) => axiosApi.get(`/${endpoint}/${id}`),
  create: (data) => axiosApi.post(`/${endpoint}`, data),
  update: (id, data) => axiosApi.put(`/${endpoint}/${id}`, data),
  delete: (id) => axiosApi.delete(`/${endpoint}/${id}`),
  bulkDelete: (ids) => axiosApi.delete(`/transportation_expenses/bulk-delete`, { data: { ids } }),
});

export const attendanceApi = createApi("attendances");
export const segmentApi = createApi("segments");
export const transportationExpensesApi = createApi("transportation_expenses");
export const subContractorApi = createApi("sub-contractors");
export const employeeApi = createApi('employees');