import React, { createContext, useContext, useState, useEffect } from "react";
import { attendanceApi, employeeApi, attendanceEmployeeSegment, siteAssignmentApi } from "../api/Api";
import { useLiff } from "./LiffContext";

export const AttendanceContext = createContext();

export const AttendanceProvider = ({ children }) => {
  const [attendance, setAttendance] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState(null);
  const [attendanceCalendar, setAttendanceCalendar] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [sites, setSites] = useState([]);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  const { profile: lineProfile, loading: liffLoading, loggedIn: liffLoggedIn } = useLiff();

  const isEmployeeComplete = (emp) => {
    if (!emp) return false;
    return String(emp.status).toUpperCase() === "ACTIVE";
  };

  useEffect(() => {
    if (liffLoading) return;
    if (!liffLoggedIn || !lineProfile) return;

    const initAttendance = async () => {
      try {
        setAttendanceLoading(true);

        const lineUserId = lineProfile.userId;
        const displayName = lineProfile.displayName ?? "Unknown";

        const employeeRes = await employeeApi.getAll();

        // Handle both flat array and paginated { data: { data: [] } } responses
        const inner = employeeRes.data?.data;
        const rawEmployees = Array.isArray(inner)
          ? inner
          : Array.isArray(inner?.data)
            ? inner.data
            : [];

        console.log("[DEBUG] rawEmployees", rawEmployees);
        let foundEmployee = rawEmployees.find(emp => emp.line_user_id === String(lineUserId));
        console.log("[DEBUG] foundEmployee", foundEmployee);

        if (!foundEmployee) {
          const createRes = await employeeApi.create({
            employee_id: crypto.randomUUID(),
            line_user_id: lineUserId,
            name: displayName,
            status: "PENDING",
          });
          foundEmployee = createRes.data.data ?? createRes.data;
        } else if (displayName && foundEmployee.name !== displayName) {
          try {
            const updateRes = await employeeApi.update(foundEmployee.employee_id, {
              ...foundEmployee,
              name: displayName,
              line_user_id: lineUserId,
            });
            foundEmployee = updateRes.data.data ?? updateRes.data ?? { ...foundEmployee, name: displayName };
          } catch (syncErr) {
            console.error("Failed to sync LINE displayName to employee:", syncErr);
          }
        }

        setEmployee(foundEmployee);

        // if (!isEmployeeComplete(foundEmployee)) {
        //   setIsProfileIncomplete(true);
        //   setAttendanceLoading(false);
        //   return;
        // }

        const today = new Date().toLocaleDateString("en-CA");
        const attendanceRes = await attendanceApi.getAttendance({
          employee_id: foundEmployee.employee_id,
          work_date: today,
        });
        const attInner = attendanceRes.data?.data;
        const attendances = Array.isArray(attInner)
          ? attInner
          : Array.isArray(attInner?.data)
            ? attInner.data
            : [];

        console.log("[DEBUG] attendances found", attendances);
        let currentAttendance;
        let isNewAttendance = false;

        if (!attendances || attendances.length === 0) {
          const createRes = await attendanceApi.create({
            employee_id: foundEmployee.employee_id,
            work_date: today,
            status: "NOT_STARTED",
          });
          currentAttendance = createRes.data.data || createRes.data;
          isNewAttendance = true;
        } else {
          currentAttendance = attendances[0];
        }

        setAttendance(currentAttendance);

        const siteRes = await siteAssignmentApi.getAll();
        const siteInner = siteRes.data?.data;
        const rawSites = Array.isArray(siteInner)
          ? siteInner
          : Array.isArray(siteInner?.data)
            ? siteInner.data
            : [];
        const mappedSites = rawSites
          .filter(v => v != null)
          .map(v => {
            const site = v.site ?? v;
            return {
              site_id: site.site_id,
              site_name: site.site_name,
              address: site.address,
              client_name: site.client_name,
              is_leader: v.is_leader,
            };
          })
          .filter(v => v.site_id != null);
        setSites(mappedSites);

        if (isNewAttendance) {
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
  }, [liffLoading, liffLoggedIn, lineProfile?.userId]);

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
        sites,
        selectedDate,
        setSelectedDate,
        isProfileIncomplete,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendanceContext = () => useContext(AttendanceContext);