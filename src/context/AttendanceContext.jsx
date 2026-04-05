import React, { createContext, useContext, useState, useEffect } from "react";
import { attendanceApi, employeeApi } from "../api/Api";

export const AttendanceContext = createContext();

export const AttendanceProvider = ({ children }) => {
  const [attendance, setAttendance] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState(null);
  const [attendanceCalendar, setAttendanceCalendar] = useState(null);
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    const initAttendance = async () => {
      try {
        setAttendanceLoading(true);
        const email = "john@example.com";

        // 1️⃣ Get all employees
        const employeeRes = await employeeApi.getAll();
        const employees = employeeRes.data.data || employeeRes.data;

        // 2️⃣ Find or create employee
        let foundEmployee = employees.find((emp) => emp.email === email);
        if (!foundEmployee) {
          const createRes = await employeeApi.create({
            employee_id: 1,
            employee_code: `EMP${Date.now()}`,
            name: "John Doe",
            email,
            employment_type: "FULL_TIME",
            role: "ADMIN",
            base_salary: 0,
            monthly_work_hours: 0,
            cost_rate: 0,
            joined_date: new Date().toISOString().split("T")[0],
            status: "ACTIVE",
          });
          foundEmployee = createRes.data.data || createRes.data;
        }
        setEmployee(foundEmployee);

        // 3️⃣ Get today's attendance
        const today = new Date().toISOString().split("T")[0];
        const attendanceRes = await attendanceApi.getAttendance({
          employee_id: foundEmployee.employee_id,
          work_date: today,
        });
        let attendances = attendanceRes.data.data || attendanceRes.data;

        let currentAttendance;
        if (!attendances || attendances.length === 0) {
          const createRes = await attendanceApi.create({
            employee_id: foundEmployee.employee_id,
            work_date: today,
            status: "NOT_STARTED",
          });
          currentAttendance = createRes.data.data || createRes.data;
        } else {
          currentAttendance = attendances[0];
        }

        setAttendance(currentAttendance);
      } catch (error) {
        console.error("Attendance init error:", error);
        setAttendanceError(error);
      } finally {
        setAttendanceLoading(false);
      }
    };

    initAttendance();
  }, []);

  return (
    <AttendanceContext.Provider
      value={{
        attendance,
        setAttendance,
        attendanceLoading,
        setAttendanceLoading,
        attendanceError,
        setAttendanceError,
        attendanceCalendar,
        setAttendanceCalendar,
        employee,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendanceContext = () => useContext(AttendanceContext);