import React, { useEffect, useState } from "react";
import Layout from "./Layout";
import { attendanceApi, employeeApi, attendanceEmployeeSegment } from "../api/Api";
import { useAttendanceContext } from "../context/AttendanceContext";

function Main() {
  const [employee, setEmployee] = useState(null);
  const { attendance, setAttendance } = useAttendanceContext();

  useEffect(() => {
    const initAttendance = async () => {
      try {
        const email = "john@example.com";

        // 1️⃣ Get or create employee
        let employeeRes = await employeeApi.getAll();
        let employees = employeeRes.data.data || employeeRes.data;

        let foundEmployee = employees.find((emp) => emp.email === email);

        if (!foundEmployee) {
          const createRes = await employeeApi.create({
            employee_code: `EMP${Date.now()}`,
            employee_id: 1,
            name: "John Doe",
            email: email,
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

        const today = new Date().toISOString().split("T")[0];
        const attendanceRes = await attendanceApi.getAttendance({ work_date: today });
        let attendances = attendanceRes.data.data || attendanceRes.data;

        let currentAttendance;

        if (!attendances || attendances.length === 0) {
          const createRes = await attendanceApi.create({
            work_date: today,
            status: "NOT_STARTED",
          });

          currentAttendance = createRes.data.data || createRes.data;
          console.log("Attendance created");
        } else {
          currentAttendance = attendances[0];
        }

        setAttendance(currentAttendance);
        console.log(foundEmployee)
        await attendanceEmployeeSegment.create({
          attendance_id: currentAttendance.attendance_id,
          employee_id: foundEmployee.employee_id ,
        });

        console.log("Employee assigned to attendance");
      } catch (error) {
        console.error("Attendance init error:", error);
      }
    };

    initAttendance();
  }, []);

  return <Layout employee={employee} />;
}

export default Main;