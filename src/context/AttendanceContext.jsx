import React, { createContext, useContext, useState, useEffect } from "react";
import { attendanceApi, employeeApi, attendanceEmployeeSegment, getAttendanceEmployeeSegment } from "../api/Api";

export const AttendanceContext = createContext();

export const AttendanceProvider = ({ children }) => {
  const [attendance, setAttendance] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState(null);
  const [attendanceCalendar, setAttendanceCalendar] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  useEffect(() => {
  const initAttendance = async () => {
    try {
      setAttendanceLoading(true);

      const email = "john@example.com";

      // 1️⃣ Fetch all employees
      const employeeRes = await employeeApi.getAll();
      const employees = employeeRes.data.data || employeeRes.data;

      let foundEmployee = employees.find(emp => emp.email === email);

      // 2️⃣ Create employee only if not found
      if (!foundEmployee) {
        const createRes = await employeeApi.create({
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

      const today = new Date().toLocaleDateString("en-CA");
      console.log(today)
      const attendanceRes = await attendanceApi.getAttendance({
        employee_id: foundEmployee.employee_id,
        work_date: today,
      });
      const attendances = attendanceRes.data.data || attendanceRes.data;

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

      const segmentRes = await getAttendanceEmployeeSegment.getAll({
        attendance_id: currentAttendance.attendance_id,
      });

      const existingSegments = segmentRes.data.data || segmentRes.data;

      const alreadyAssigned = existingSegments.some(
        seg => seg.employee_id === foundEmployee.employee_id
      );

      if (!alreadyAssigned) {
        await attendanceEmployeeSegment.create({
          attendance_id: currentAttendance.attendance_id,
          employee_id: foundEmployee.employee_id,
        });
      }

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
        selectedDate,
        setSelectedDate
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendanceContext = () => useContext(AttendanceContext);