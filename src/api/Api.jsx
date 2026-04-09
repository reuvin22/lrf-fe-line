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
export const subContractorApi = createApi("subcontractors");
export const employeeApi = createApi('employees');
export const sitesApi = createApi('sites');
export const siteAssignmentApi = createApi('site-assignment')
export const constructionSiteApi = createApi('sites')
export const siteSubContractorApi = createApi('site-subcontractors')
export const subContractorReportApi = createApi('subcontractor-reports')
export const subContractorWorkerApi = createApi('subcontractor-workers')
export const attendanceSubcontractorSegmentApi = createApi('attendance-subcontractor-segments');
export const attendanceEmployeeSegment = createApi('attendance-employee');
export const getAttendanceEmployeeSegment = createApi('get-attendance-employee');
export const siteAssignedEmployee = createApi('employee-site');
export const ocrUploadApi= createApi('ocr-uploads');
export const ocrCategoriesApi = createApi('ocr-categories');
export const getAttendanceSubcontractor = createApi('get-attendance-subcontractor');
export const dashboardApi = createApi('dashboard')