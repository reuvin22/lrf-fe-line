// loggedInUser.js

export const loggedInUser = {
  employee_id: 1,
  employee_code: `EMP${Date.now()}`,
  name: "John Doe",
  email: "johndoe@example.com",
  employment_type: "FULL_TIME",
  role: "ADMIN",
  base_salary: 0,
  monthly_work_hours: 0,
  cost_rate: 0,
  joined_date: new Date().toISOString().split("T")[0],
  status: "ACTIVE",
};