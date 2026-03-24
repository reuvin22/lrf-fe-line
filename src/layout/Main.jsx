import React, { useEffect, useState } from "react";
import Layout from "./Layout";
import { attendanceApi, employeeApi } from "../api/Api";
import { useAttendanceContext } from "../context/AttendanceContext";

function Main() {
  const [employee, setEmployee] = useState(null);
  const {attendance, setAttendance} = useAttendanceContext()
  useEffect(() => {
    const initAttendance = async () => {
      try {
        const email = "john@example.com";

        let employeeRes = await employeeApi.getAll();
        let employees = employeeRes.data.data || employeeRes.data;

        let foundEmployee = employees.find((emp) => emp.email === email);

        if (!foundEmployee) {
          const createRes = await employeeApi.create({
            employee_code: `EMP${Date.now()}`,
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

        const attendanceRes = await attendanceApi.getAttendance({
          employee_id: foundEmployee.id,
          work_date: today,
        });

        let attendances = attendanceRes.data.data || attendanceRes.data;

        let currentAttendance;

        if (!attendances || attendances.length === 0) {
          const createRes = await attendanceApi.create({
            employee_id: foundEmployee.id,
            work_date: today,
            status: "NOT_STARTED",
          });

          currentAttendance = createRes.data.data || createRes.data;

          console.log("Attendance created");
        } else {
          currentAttendance = attendances[0];
          console.log("Attendance already exists");
        }

        setAttendance(currentAttendance);
        console.log('current: ', attendance)
      } catch (error) {
        console.error("Attendance init error:", error);
      }
    };

    initAttendance();
  }, []);

  console.log("THIS IS EMPLOYEE:", employee);

  return <Layout />;
}

export default Main;